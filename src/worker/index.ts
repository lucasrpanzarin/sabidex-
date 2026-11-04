// Servidor do Sabidex: turmas, contas das crianças (PIN), sincronização, trocas e ranking.
// Roda na Cloudflare (Worker + banco D1). Tudo fora de /api/* é o app (arquivos estáticos).

import { Hono, type Context } from 'hono';
import { capitulos } from '../data';
import { FASES, chaveExtra, extrasDo } from '../lib/jogo';
import { idEvolucao, itemPorId, migrarFormas, podeEvoluir, premiosLivres, PRECO_EVOLUCAO, protegido, refCompra } from '../lib/loja';
import { figurinhaPorId, idCarta, IDS_CARTAS, IDS_PACOTE } from '../lib/figurinhas';
import {
  gerarCodigo, mesclar, normalizarApelido, normalizarCodigo, pinValido, progressoVazio,
  sanitizar, sanitizarDelta, semanaDe, type ProgressoSync,
} from '../shared/sync';
import { ESQUEMA, MIGRACOES, temTurma, turmaDaFamilia } from './esquema';
import { dataValida, type DatasProva } from '../lib/provas';
import { APPLE, conferirCracha, GOOGLE } from './jwt';
import { aleatorio, hashSegredo, iguais, pinAleatorio, sha256 } from './seguranca';

interface Env {
  DB: D1Database; ASSETS: Fetcher; ADMIN_EMAILS?: string;
  /** Entrar com Google: ID do cliente OAuth (Google Cloud). Sem ele, o botão não aparece. */
  GOOGLE_CLIENT_ID?: string;
  /** Entrar com Apple: Services ID (Apple Developer). Sem ele, o botão não aparece. */
  APPLE_CLIENT_ID?: string;
  /** Esqueci minha senha: chave do Resend (segredo) e remetente. Sem elas, a opção não aparece. */
  RESEND_API_KEY?: string;
  EMAIL_REMETENTE?: string;
}
type C = Context<{ Bindings: Env }>;

const DIA = 86_400_000;
const FASES_VALIDAS = new Set(capitulos.flatMap((c) => [...FASES.map((f) => `${c.id}:${f}`), ...extrasDo(c).map((x) => chaveExtra(c.id, x))]));
// Todas as 60 cartas (trocas). Do aparelho só chegam cartas novas da forma 1 (as que vêm nos pacotes);
// as formas 2 e 3 só nascem aqui no servidor, na evolução.
const CARTAS_VALIDAS = IDS_CARTAS;
const COR = /^#[0-9A-Fa-f]{6}$/;
const MAX_FALHAS = 5;
const BLOQUEIO_MS = 15 * 60_000;

const chaveApelido = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const erro = (c: C, status: 400 | 401 | 403 | 404 | 409 | 423 | 429, mensagem: string) => c.json({ erro: mensagem }, status);

let esquemaPronto = false;
const app = new Hono<{ Bindings: Env }>().basePath('/api');

app.use('*', async (c, next) => {
  // Nas versões de teste (previews) não há banco: a turma fica desligada, com aviso claro.
  if (!(c.env as Partial<Env>).DB) return c.json({ erro: 'A turma não funciona nesta versão de teste.' }, 503);
  if (!esquemaPronto) {
    await c.env.DB.batch(ESQUEMA.map((s) => c.env.DB.prepare(s)));
    for (const m of MIGRACOES) {
      try { await c.env.DB.prepare(m).run(); } catch (e) { if (!String(e).includes('duplicate column')) throw e; }
    }
    esquemaPronto = true;
  }
  await next();
  c.header('Cache-Control', 'no-store');
});

async function corpo(c: C): Promise<Record<string, unknown>> {
  try { const j = await c.req.json(); return j && typeof j === 'object' ? j : {}; } catch { return {}; }
}

async function novaSessao(db: D1Database, tipo: 'crianca' | 'adulto', ref: string) {
  const token = aleatorio(32);
  const validade = tipo === 'crianca' ? 180 * DIA : 30 * DIA;
  await db.prepare('INSERT INTO sessoes (token_hash, tipo, ref_id, expira) VALUES (?, ?, ?, ?)')
    .bind(await sha256(token), tipo, ref, Date.now() + validade).run();
  return token;
}

async function sessao(c: C, tipo: 'crianca' | 'adulto') {
  const t = (c.req.header('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!t) return null;
  const s = await c.env.DB.prepare('SELECT ref_id, expira FROM sessoes WHERE token_hash = ? AND tipo = ?')
    .bind(await sha256(t), tipo).first<{ ref_id: string; expira: number }>();
  if (!s || s.expira < Date.now()) return null;
  return s.ref_id;
}

async function sairSessao(c: C) {
  const t = (c.req.header('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (t) await c.env.DB.prepare('DELETE FROM sessoes WHERE token_hash = ?').bind(await sha256(t)).run();
  return c.json({ ok: true });
}

/* ============================ Crianças ============================ */

interface Crianca {
  id: string; turma_id: string; apelido: string; cor: string; pin_hash: string; pin_sal: string;
  falhas: number; bloqueado_ate: number; progresso: string; xp_semana: number; semana: string;
  familia_id: string | null;
}

const MSG_BLOQUEIO = 'Muitas tentativas erradas. Espere 15 minutos ou peça para um adulto trocar seu PIN.';

/** Confere o PIN contando as tentativas erradas (5 erros bloqueiam por 15 minutos). Devolve a mensagem de erro, ou null se o PIN está certo. */
async function conferirPin(db: D1Database, k: Crianca, pin: unknown, generico: string): Promise<{ status: 401 | 423; msg: string } | null> {
  if (k.bloqueado_ate > Date.now()) return { status: 423, msg: MSG_BLOQUEIO };
  if (!pinValido(pin) || !iguais(await hashSegredo(pin as string, k.pin_sal), k.pin_hash)) {
    const falhas = k.falhas + 1;
    await db.prepare('UPDATE criancas SET falhas = ?, bloqueado_ate = ? WHERE id = ?')
      .bind(falhas >= MAX_FALHAS ? 0 : falhas, falhas >= MAX_FALHAS ? Date.now() + BLOQUEIO_MS : 0, k.id).run();
    return { status: falhas >= MAX_FALHAS ? 423 : 401, msg: falhas >= MAX_FALHAS ? MSG_BLOQUEIO : generico };
  }
  await db.prepare('UPDATE criancas SET falhas = 0, bloqueado_ate = 0, visto = ? WHERE id = ?').bind(Date.now(), k.id).run();
  return null;
}

/** Comandos que apagam uma criança e tudo dela (cartas, sessões, trocas pendentes). */
function apagarCrianca(db: D1Database, cid: string) {
  return [
    db.prepare('DELETE FROM cartas WHERE crianca_id = ?').bind(cid),
    db.prepare(`UPDATE trocas SET status = 'cancelada', resolvido = ? WHERE (de_id = ? OR para_id = ?) AND status = 'pendente'`).bind(Date.now(), cid, cid),
    db.prepare(`DELETE FROM sessoes WHERE tipo = 'crianca' AND ref_id = ?`).bind(cid),
    db.prepare('DELETE FROM criancas WHERE id = ?').bind(cid),
  ];
}

/** Tira a criança da turma sem apagar a conta: ela volta a ser só da família. */
function tirarDaTurma(db: D1Database, cid: string, familiaId: string) {
  return [
    db.prepare(`UPDATE trocas SET status = 'cancelada', resolvido = ? WHERE (de_id = ? OR para_id = ?) AND status = 'pendente'`).bind(Date.now(), cid, cid),
    // Se um irmão já usa o mesmo apelido, a chave ganha um final diferente (o apelido mostrado não muda).
    db.prepare(`UPDATE criancas SET turma_id = ?1, apelido_chave = CASE
        WHEN EXISTS (SELECT 1 FROM criancas o WHERE o.turma_id = ?1 AND o.apelido_chave = criancas.apelido_chave AND o.id != criancas.id)
        THEN apelido_chave || '-' || substr(id, 1, 4) ELSE apelido_chave END
      WHERE id = ?2`).bind(turmaDaFamilia(familiaId), cid),
  ];
}

const contarNaTurma = async (db: D1Database, turmaId: string) =>
  (await db.prepare('SELECT COUNT(*) n FROM criancas WHERE turma_id = ?').bind(turmaId).first<{ n: number }>())?.n ?? 0;

async function cartasDe(db: D1Database, id: string) {
  const r = await db.prepare('SELECT carta_id, qtd FROM cartas WHERE crianca_id = ? AND qtd > 0').bind(id).all<{ carta_id: string; qtd: number }>();
  return Object.fromEntries(r.results.map((x) => [x.carta_id, x.qtd]));
}

function upsertCartas(db: D1Database, id: string, delta: Record<string, number>) {
  return Object.entries(delta).map(([carta, n]) =>
    db.prepare('INSERT INTO cartas (crianca_id, carta_id, qtd) VALUES (?, ?, ?) ON CONFLICT (crianca_id, carta_id) DO UPDATE SET qtd = qtd + excluded.qtd')
      .bind(id, carta, n));
}

/* ---------------- Datas das provas da escola ---------------- */

const CAPITULOS_VALIDOS = new Set(capitulos.map((c) => c.id));

/** Datas marcadas para estas turmas. Quando duas marcam o mesmo capítulo, vale a última da lista. */
async function datasDe(db: D1Database, turmas: string[]): Promise<DatasProva> {
  if (!turmas.length) return {};
  const r = await db.prepare(`SELECT turma_id, capitulo, data FROM datas_prova WHERE turma_id IN (${turmas.map(() => '?').join(',')})`)
    .bind(...turmas).all<{ turma_id: string; capitulo: string; data: string }>();
  const datas: DatasProva = {};
  for (const t of turmas) for (const x of r.results) if (x.turma_id === t && CAPITULOS_VALIDOS.has(x.capitulo)) datas[x.capitulo] = x.data;
  return datas;
}

/** Marca (ou apaga, com data vazia) a data da prova de um capítulo. */
async function marcarData(c: C, turmaId: string) {
  const b = await corpo(c);
  const capitulo = String(b.capitulo ?? '');
  if (!CAPITULOS_VALIDOS.has(capitulo)) return erro(c, 400, 'Capítulo inválido.');
  if (b.data === '' || b.data === null) {
    await c.env.DB.prepare('DELETE FROM datas_prova WHERE turma_id = ? AND capitulo = ?').bind(turmaId, capitulo).run();
  } else {
    if (!dataValida(b.data)) return erro(c, 400, 'Data inválida.');
    await c.env.DB.prepare(`INSERT INTO datas_prova (turma_id, capitulo, data) VALUES (?, ?, ?)
      ON CONFLICT (turma_id, capitulo) DO UPDATE SET data = excluded.data`).bind(turmaId, capitulo, b.data).run();
  }
  return c.json({ provas: await datasDe(c.env.DB, [turmaId]) });
}

async function respostaConta(db: D1Database, k: Crianca, progresso: ProgressoSync) {
  const turma = temTurma(k.turma_id)
    ? await db.prepare('SELECT nome, codigo FROM turmas WHERE id = ?').bind(k.turma_id).first<{ nome: string; codigo: string }>()
    : null;
  // A data da família vale quando a turma não marcou aquele capítulo; a da turma vale mais.
  const provas = await datasDe(db, [...(k.familia_id ? [turmaDaFamilia(k.familia_id)] : []), ...(temTurma(k.turma_id) ? [k.turma_id] : [])]);
  return {
    conta: { id: k.id, apelido: k.apelido, cor: k.cor, turma: turma?.nome ?? '', codigo: turma?.codigo ?? '', familia: !!k.familia_id, provas },
    progresso,
    cartas: await cartasDe(db, k.id),
  };
}

app.post('/turma/info', async (c) => {
  const b = await corpo(c);
  const codigo = normalizarCodigo(String(b.codigo ?? ''));
  const t = await c.env.DB.prepare('SELECT nome FROM turmas WHERE codigo = ?').bind(codigo).first<{ nome: string }>();
  if (!t) return erro(c, 404, 'Não achei essa turma. Confira o código com seu professor ou responsável.');
  return c.json({ nome: t.nome, codigo });
});

/** Criança entra numa turma pela primeira vez e cria o PIN. O progresso do aparelho vai junto. */
app.post('/crianca/entrar-turma', async (c) => {
  const b = await corpo(c);
  const codigo = normalizarCodigo(String(b.codigo ?? ''));
  const apelido = normalizarApelido(String(b.apelido ?? ''));
  const cor = String(b.cor ?? '');
  if (apelido.length < 2) return erro(c, 400, 'O apelido precisa ter pelo menos 2 letras.');
  if (!COR.test(cor)) return erro(c, 400, 'Cor inválida.');
  if (!pinValido(b.pin)) return erro(c, 400, 'O PIN precisa ter 4 números.');
  const t = await c.env.DB.prepare('SELECT id FROM turmas WHERE codigo = ?').bind(codigo).first<{ id: string }>();
  if (!t) return erro(c, 404, 'Não achei essa turma. Confira o código.');
  if (await contarNaTurma(c.env.DB, t.id) >= 60) return erro(c, 409, 'Essa turma já está cheia.');

  const id = aleatorio(8);
  const sal = aleatorio(16);
  const progresso = mesclar(progressoVazio(), sanitizar(b.progresso, FASES_VALIDAS));
  const semana = semanaDe();
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO criancas (id, turma_id, apelido, apelido_chave, cor, pin_hash, pin_sal, progresso, xp_semana, semana, criado, visto)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`)
        .bind(id, t.id, apelido, chaveApelido(apelido), cor, await hashSegredo(b.pin as string, sal), sal, JSON.stringify(progresso), semana, Date.now(), Date.now()),
      ...upsertCartas(c.env.DB, id, sanitizarDelta(b.cartas, IDS_PACOTE)),
    ]);
  } catch (e) {
    if (String(e).includes('UNIQUE')) return erro(c, 409, 'Já tem alguém com esse apelido na turma. Escolha outro, ou entre com o seu PIN se a conta for sua.');
    throw e;
  }
  const k = await migrarCrianca(c.env.DB, (await c.env.DB.prepare('SELECT * FROM criancas WHERE id = ?').bind(id).first<Crianca>())!);
  return c.json({ token: await novaSessao(c.env.DB, 'crianca', id), ...(await respostaConta(c.env.DB, k, sanitizar(JSON.parse(k.progresso), FASES_VALIDAS))) });
});

/** Criança entra na conta dela (em outro aparelho, por exemplo). */
app.post('/crianca/entrar', async (c) => {
  const b = await corpo(c);
  const codigo = normalizarCodigo(String(b.codigo ?? ''));
  const apelido = normalizarApelido(String(b.apelido ?? ''));
  if (!pinValido(b.pin)) return erro(c, 400, 'O PIN precisa ter 4 números.');
  const k = await c.env.DB.prepare(`SELECT k.* FROM criancas k JOIN turmas t ON t.id = k.turma_id WHERE t.codigo = ? AND k.apelido_chave = ?`)
    .bind(codigo, chaveApelido(apelido)).first<Crianca>();
  const generico = 'Código, apelido ou PIN não conferem. Tente de novo.';
  if (!k) return erro(c, 401, generico);
  const falha = await conferirPin(c.env.DB, k, b.pin, generico);
  if (falha) return erro(c, falha.status, falha.msg);
  const km = await migrarCrianca(c.env.DB, k);
  return c.json({ token: await novaSessao(c.env.DB, 'crianca', km.id), ...(await respostaConta(c.env.DB, km, sanitizar(JSON.parse(km.progresso), FASES_VALIDAS))) });
});

/** Criança da família escolhe o perfil dela num aparelho onde a família já entrou (só com o PIN). */
app.post('/crianca/entrar-perfil', async (c) => {
  const b = await corpo(c);
  const k = await c.env.DB.prepare('SELECT * FROM criancas WHERE id = ? AND familia_id IS NOT NULL').bind(String(b.id ?? '')).first<Crianca>();
  const generico = 'PIN errado. Tente de novo.';
  if (!k) return erro(c, 404, 'Esse perfil não existe mais. Peça para um adulto entrar na conta da família.');
  const falha = await conferirPin(c.env.DB, k, b.pin, generico);
  if (falha) return erro(c, falha.status, falha.msg);
  const km = await migrarCrianca(c.env.DB, k);
  return c.json({ token: await novaSessao(c.env.DB, 'crianca', km.id), ...(await respostaConta(c.env.DB, km, sanitizar(JSON.parse(km.progresso), FASES_VALIDAS))) });
});

async function crianca(c: C) {
  const id = await sessao(c, 'crianca');
  if (!id) return null;
  const k = await c.env.DB.prepare('SELECT * FROM criancas WHERE id = ?').bind(id).first<Crianca>();
  return k && migrarCrianca(c.env.DB, k);
}

/**
 * Cada forma agora é uma carta. Quem evoluiu antes ganha a carta da forma que tinha
 * (no lugar de 1 cópia da forma 1). Acontece uma vez só, numa transação.
 */
async function migrarCrianca(db: D1Database, k: Crianca): Promise<Crianca> {
  const prog = sanitizar(JSON.parse(k.progresso), FASES_VALIDAS);
  const m = migrarFormas({ compras: prog.compras, cartas: await cartasDe(db, k.id) });
  if (!m) return k;
  const progresso = JSON.stringify({ ...prog, compras: m.compras });
  const trava = `EXISTS (SELECT 1 FROM criancas WHERE id = '${k.id}' AND progresso = ?)`;
  const ops = [db.prepare('UPDATE criancas SET progresso = ? WHERE id = ? AND progresso = ?').bind(progresso, k.id, k.progresso)];
  // As cartas só mudam se o progresso acima mudou (assim duas abas ao mesmo tempo não migram duas vezes).
  for (const [carta, n] of Object.entries(m.delta)) {
    ops.push(n < 0
      ? db.prepare(`UPDATE cartas SET qtd = MAX(0, qtd + ?) WHERE crianca_id = ? AND carta_id = ? AND ${trava}`).bind(n, k.id, carta, progresso)
      : db.prepare(`INSERT INTO cartas (crianca_id, carta_id, qtd) SELECT ?, ?, ? WHERE ${trava}
          ON CONFLICT (crianca_id, carta_id) DO UPDATE SET qtd = qtd + excluded.qtd`).bind(k.id, carta, n, progresso));
  }
  await db.batch(ops);
  return (await db.prepare('SELECT * FROM criancas WHERE id = ?').bind(k.id).first<Crianca>()) ?? k;
}

/** Criança na turma (para ranking, colegas e trocas). Criança só da família recebe erro. */
const SEM_TURMA_MSG = 'Entre numa turma para ver os colegas.';

app.post('/crianca/sair', sairSessao);

/** Criança que já tem conta (da família) entra numa turma. A conta e o progresso continuam os mesmos. */
app.post('/crianca/turma', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  const b = await corpo(c);
  const codigo = normalizarCodigo(String(b.codigo ?? ''));
  const apelido = normalizarApelido(String(b.apelido ?? k.apelido));
  if (apelido.length < 2) return erro(c, 400, 'O apelido precisa ter pelo menos 2 letras.');
  const t = await c.env.DB.prepare('SELECT id FROM turmas WHERE codigo = ?').bind(codigo).first<{ id: string }>();
  if (!t) return erro(c, 404, 'Não achei essa turma. Confira o código.');
  if (t.id === k.turma_id) return c.json(await respostaConta(c.env.DB, k, sanitizar(JSON.parse(k.progresso), FASES_VALIDAS)));
  if (await contarNaTurma(c.env.DB, t.id) >= 60) return erro(c, 409, 'Essa turma já está cheia.');
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE trocas SET status = 'cancelada', resolvido = ? WHERE (de_id = ? OR para_id = ?) AND status = 'pendente'`).bind(Date.now(), k.id, k.id),
      c.env.DB.prepare('UPDATE criancas SET turma_id = ?, apelido = ?, apelido_chave = ? WHERE id = ?').bind(t.id, apelido, chaveApelido(apelido), k.id),
    ]);
  } catch (e) {
    if (String(e).includes('UNIQUE')) return erro(c, 409, 'Já tem alguém com esse apelido na turma. Escolha outro.');
    throw e;
  }
  const novo = { ...k, turma_id: t.id, apelido };
  return c.json(await respostaConta(c.env.DB, novo, sanitizar(JSON.parse(k.progresso), FASES_VALIDAS)));
});

/**
 * Compras que chegam do aparelho: itens têm o preço conferido pela tabela da loja.
 * Evoluções só valem quando feitas pelo servidor (/crianca/evoluir), que gasta as cópias.
 */
function conferirCompras(antes: ProgressoSync, m: ProgressoSync): ProgressoSync {
  const ja = new Set(antes.compras.map((c) => c.id));
  const compras: ProgressoSync['compras'] = [];
  for (const c of m.compras) {
    if (ja.has(c.id)) { compras.push(c); continue; }
    // Item novo vai sempre numa carta ("s001-1", "s001-2"...); evolução só pelo servidor.
    if (c.forma || !/-[123]$/.test(c.sabimon) || !CARTAS_VALIDAS.has(c.sabimon.replace(/-1$/, ''))) continue;
    const item = c.item ? itemPorId.get(c.item) : undefined;
    if (!item || item.antigo) continue;
    // Prêmio de estudo: no máximo 1 por mundo completo.
    if (item.premio && premiosLivres({ feitas: m.feitas, compras }) < 1) continue;
    compras.push({ ...c, preco: item.preco });
  }
  return { ...m, compras };
}

/** Sincroniza o progresso: junta o do aparelho com o do servidor e aplica as cartas novas. */
app.post('/crianca/sync', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  const b = await corpo(c);
  const antes = sanitizar(JSON.parse(k.progresso), FASES_VALIDAS);
  const m = conferirCompras(antes, mesclar(antes, sanitizar(b.progresso, FASES_VALIDAS)));
  const semana = semanaDe();
  const ganho = Math.max(0, m.xp - antes.xp);
  const xpSemana = (k.semana === semana ? k.xp_semana : 0) + Math.min(ganho, 2000);
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE criancas SET progresso = ?, xp_semana = ?, semana = ?, visto = ? WHERE id = ?')
      .bind(JSON.stringify(m), xpSemana, semana, Date.now(), k.id),
    ...upsertCartas(c.env.DB, k.id, sanitizarDelta(b.cartas, IDS_PACOTE)),
  ]);
  return c.json(await respostaConta(c.env.DB, k, m));
});

/** Evolui uma carta: 3 da forma 1 viram 1 da forma 2; 2 da forma 2 viram 1 da forma 3. Gasta também as Sabicoins. */
app.post('/crianca/evoluir', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  const b = await corpo(c);
  const f = figurinhaPorId.get(String(b.carta ?? ''));
  if (!f) return erro(c, 400, 'Carta inválida.');
  const db = c.env.DB;
  const prog = sanitizar(JSON.parse(k.progresso), FASES_VALIDAS);
  const cartas = await cartasDe(db, k.id);
  const p = podeEvoluir({ xp: prog.xp, compras: prog.compras, cartas }, f.id);
  if (!p.ok) {
    const msg = { final: 'Essa carta já é a forma final.', desenho: 'Essa evolução ainda não tem desenho. Chega em breve!',
      copias: 'Faltam cartas para evoluir. Abra mais pacotes!', moedas: 'Faltam Sabicoins para evoluir.' }[p.motivo];
    return erro(c, 409, msg);
  }
  const minimo = p.gasta + (protegido(prog, f.id) ? 1 : 0);
  const tirou = await db.prepare('UPDATE cartas SET qtd = qtd - ? WHERE crianca_id = ? AND carta_id = ? AND qtd >= ?').bind(p.gasta, k.id, f.id, minimo).run();
  if (tirou.meta.changes !== 1) return erro(c, 409, 'Faltam cartas para evoluir. Abra mais pacotes!');
  const nova = idCarta(f.s.id, p.forma);
  const novo: ProgressoSync = { ...prog, compras: [...prog.compras, { id: idEvolucao(f.s.id, p.forma), sabimon: refCompra(nova), forma: p.forma, preco: PRECO_EVOLUCAO[p.forma] }] };
  await db.batch([
    ...upsertCartas(db, k.id, { [nova]: 1 }),
    db.prepare('UPDATE criancas SET progresso = ?, visto = ? WHERE id = ?').bind(JSON.stringify(novo), Date.now(), k.id),
  ]);
  return c.json({ ...(await respostaConta(db, k, novo)), carta: nova });
});

/** Quantas cópias a criança precisa manter: 1 se a carta tem itens da lojinha (ela não sai em troca). */
async function minimoParaTrocar(db: D1Database, criancaId: string, carta: string) {
  const r = await db.prepare('SELECT progresso FROM criancas WHERE id = ?').bind(criancaId).first<{ progresso: string }>();
  const prog = sanitizar(JSON.parse(r?.progresso ?? '{}'), FASES_VALIDAS);
  return protegido(prog, carta) ? 2 : 1;
}

app.get('/crianca/turma', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  if (!temTurma(k.turma_id)) return erro(c, 403, SEM_TURMA_MSG);
  const r = await c.env.DB.prepare(`SELECT id, apelido, cor, (SELECT COUNT(*) FROM cartas WHERE crianca_id = criancas.id AND qtd > 0) AS cartas
    FROM criancas WHERE turma_id = ? AND id != ? ORDER BY apelido_chave`).bind(k.turma_id, k.id).all();
  return c.json({ colegas: r.results });
});

app.get('/crianca/colega/:id', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  if (!temTurma(k.turma_id)) return erro(c, 403, SEM_TURMA_MSG);
  const o = await c.env.DB.prepare('SELECT id, apelido, cor FROM criancas WHERE id = ? AND turma_id = ?').bind(c.req.param('id'), k.turma_id).first();
  if (!o) return erro(c, 404, 'Colega não encontrado.');
  // Mostra só o que dá para trocar: a carta com itens fica com o dono.
  const prog = sanitizar(JSON.parse(((await c.env.DB.prepare('SELECT progresso FROM criancas WHERE id = ?').bind(o.id).first<{ progresso: string }>())?.progresso) ?? '{}'), FASES_VALIDAS);
  const cartas = Object.fromEntries(Object.entries(await cartasDe(c.env.DB, o.id as string))
    .map(([id, n]) => [id, n - (protegido(prog, id) ? 1 : 0)] as const).filter(([, n]) => n > 0));
  return c.json({ colega: o, cartas });
});

app.get('/crianca/ranking', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  if (!temTurma(k.turma_id)) return erro(c, 403, SEM_TURMA_MSG);
  const r = await c.env.DB.prepare(`SELECT id, apelido, cor, CASE WHEN semana = ? THEN xp_semana ELSE 0 END AS xp,
    (SELECT COUNT(*) FROM cartas WHERE crianca_id = criancas.id AND qtd > 0) AS cartas
    FROM criancas WHERE turma_id = ?`).bind(semanaDe(), k.turma_id).all();
  return c.json({ eu: k.id, semana: semanaDe(), participantes: r.results });
});

/* ---------------- Trocas ---------------- */

interface Troca { id: string; turma_id: string; de_id: string; para_id: string; carta_dar: string; carta_receber: string; status: string; criado: number; resolvido: number | null }

app.get('/crianca/trocas', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  if (!temTurma(k.turma_id)) return erro(c, 403, SEM_TURMA_MSG);
  const r = await c.env.DB.prepare(`SELECT t.*, de.apelido AS de_apelido, de.cor AS de_cor, pa.apelido AS para_apelido, pa.cor AS para_cor
    FROM trocas t LEFT JOIN criancas de ON de.id = t.de_id LEFT JOIN criancas pa ON pa.id = t.para_id
    WHERE (t.de_id = ? OR t.para_id = ?) AND (t.status = 'pendente' OR t.resolvido > ?)
    ORDER BY t.criado DESC LIMIT 40`).bind(k.id, k.id, Date.now() - 7 * DIA).all();
  return c.json({ eu: k.id, trocas: r.results });
});

app.post('/crianca/trocas', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  if (!temTurma(k.turma_id)) return erro(c, 403, SEM_TURMA_MSG);
  const b = await corpo(c);
  const para = String(b.para ?? ''), dar = String(b.dar ?? ''), receber = String(b.receber ?? '');
  if (!CARTAS_VALIDAS.has(dar) || !CARTAS_VALIDAS.has(receber)) return erro(c, 400, 'Carta inválida.');
  if (dar === receber) return erro(c, 400, 'Escolha cartas diferentes.');
  if (para === k.id) return erro(c, 400, 'Escolha um colega.');
  const colega = await c.env.DB.prepare('SELECT id FROM criancas WHERE id = ? AND turma_id = ?').bind(para, k.turma_id).first();
  if (!colega) return erro(c, 404, 'Colega não encontrado.');
  const [minha, dele] = await Promise.all([
    c.env.DB.prepare('SELECT qtd FROM cartas WHERE crianca_id = ? AND carta_id = ?').bind(k.id, dar).first<{ qtd: number }>(),
    c.env.DB.prepare('SELECT qtd FROM cartas WHERE crianca_id = ? AND carta_id = ?').bind(para, receber).first<{ qtd: number }>(),
  ]);
  if (!minha || minha.qtd < 1) return erro(c, 409, 'Você não tem essa carta.');
  if (minha.qtd < await minimoParaTrocar(c.env.DB, k.id, dar)) return erro(c, 409, 'Essa carta tem itens da lojinha e fica com você. Só as cópias repetidas podem ser trocadas.');
  if (!dele || dele.qtd < 1) return erro(c, 409, 'Seu colega não tem mais essa carta.');
  if (dele.qtd < await minimoParaTrocar(c.env.DB, para, receber)) return erro(c, 409, 'Essa carta do seu colega tem itens da lojinha e fica com ele. Escolha outra.');
  const pend = await c.env.DB.prepare(`SELECT COUNT(*) n FROM trocas WHERE de_id = ? AND status = 'pendente'`).bind(k.id).first<{ n: number }>();
  if ((pend?.n ?? 0) >= 5) return erro(c, 429, 'Você já tem 5 propostas esperando resposta. Espere ou cancele uma.');
  const id = aleatorio(8);
  await c.env.DB.prepare(`INSERT INTO trocas (id, turma_id, de_id, para_id, carta_dar, carta_receber, status, criado) VALUES (?, ?, ?, ?, ?, ?, 'pendente', ?)`)
    .bind(id, k.turma_id, k.id, para, dar, receber, Date.now()).run();
  return c.json({ id });
});

app.post('/crianca/trocas/:id/:acao', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  if (!temTurma(k.turma_id)) return erro(c, 403, SEM_TURMA_MSG);
  const acao = c.req.param('acao');
  const t = await c.env.DB.prepare(`SELECT * FROM trocas WHERE id = ? AND status = 'pendente'`).bind(c.req.param('id')).first<Troca>();
  if (!t) return erro(c, 404, 'Essa proposta não está mais esperando resposta.');
  const db = c.env.DB;
  const agora = Date.now();

  if (acao === 'cancelar' || acao === 'recusar') {
    const dono = acao === 'cancelar' ? t.de_id : t.para_id;
    if (dono !== k.id) return erro(c, 403, 'Essa proposta não é sua.');
    await db.prepare(`UPDATE trocas SET status = ?, resolvido = ? WHERE id = ? AND status = 'pendente'`)
      .bind(acao === 'cancelar' ? 'cancelada' : 'recusada', agora, t.id).run();
    return c.json({ ok: true });
  }
  if (acao !== 'aceitar') return erro(c, 400, 'Ação inválida.');
  if (t.para_id !== k.id) return erro(c, 403, 'Essa proposta não é para você.');

  // Tudo numa transação: a troca só acontece se as duas crianças ainda têm as cartas.
  // Carta com itens fica com o dono: precisa sobrar 1 cópia.
  const [minDe, minPara] = await Promise.all([minimoParaTrocar(db, t.de_id, t.carta_dar), minimoParaTrocar(db, t.para_id, t.carta_receber)]);
  const trava = aleatorio(12);
  const travada = `EXISTS (SELECT 1 FROM trocas WHERE id = '${t.id}' AND trava = '${trava}')`;
  const res = await db.batch([
    db.prepare(`UPDATE trocas SET status = 'aceita', trava = ?, resolvido = ? WHERE id = ? AND status = 'pendente'
      AND EXISTS (SELECT 1 FROM cartas WHERE crianca_id = ? AND carta_id = ? AND qtd >= ?)
      AND EXISTS (SELECT 1 FROM cartas WHERE crianca_id = ? AND carta_id = ? AND qtd >= ?)`)
      .bind(trava, agora, t.id, t.de_id, t.carta_dar, minDe, t.para_id, t.carta_receber, minPara),
    db.prepare(`UPDATE cartas SET qtd = qtd - 1 WHERE crianca_id = ? AND carta_id = ? AND ${travada}`).bind(t.de_id, t.carta_dar),
    db.prepare(`UPDATE cartas SET qtd = qtd - 1 WHERE crianca_id = ? AND carta_id = ? AND ${travada}`).bind(t.para_id, t.carta_receber),
    db.prepare(`INSERT INTO cartas (crianca_id, carta_id, qtd) SELECT ?, ?, 1 WHERE ${travada}
      ON CONFLICT (crianca_id, carta_id) DO UPDATE SET qtd = qtd + 1`).bind(t.para_id, t.carta_dar),
    db.prepare(`INSERT INTO cartas (crianca_id, carta_id, qtd) SELECT ?, ?, 1 WHERE ${travada}
      ON CONFLICT (crianca_id, carta_id) DO UPDATE SET qtd = qtd + 1`).bind(t.de_id, t.carta_receber),
  ]);
  if (res[0].meta.changes !== 1 && minPara === 2) {
    const minha = await db.prepare('SELECT qtd FROM cartas WHERE crianca_id = ? AND carta_id = ?').bind(t.para_id, t.carta_receber).first<{ qtd: number }>();
    if ((minha?.qtd ?? 0) < 2) {
      await db.prepare(`UPDATE trocas SET status = 'invalida', resolvido = ? WHERE id = ? AND status = 'pendente'`).bind(agora, t.id).run();
      return erro(c, 409, 'Sua carta tem itens da lojinha e fica com você. Só dá para trocar uma cópia repetida.');
    }
  }
  if (res[0].meta.changes !== 1) {
    await db.prepare(`UPDATE trocas SET status = 'invalida', resolvido = ? WHERE id = ? AND status = 'pendente'`).bind(agora, t.id).run();
    return erro(c, 409, 'Essa troca não dá mais: uma das cartas já foi trocada com outra pessoa.');
  }
  return c.json({ ok: true, cartas: await cartasDe(db, k.id) });
});

/* ============================ Adultos ============================ */

interface Adulto { id: string; nome: string; email: string; senha_hash: string; senha_sal: string; falhas: number; bloqueado_ate: number; aceite_versao: string; tem_senha: number }

/** Versão da política de privacidade aceita no cadastro (mudar quando o texto mudar). */
const VERSAO_PRIVACIDADE = '2026-11';
const MAX_FILHOS = 6;

const emailValido = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 120;
const ehAdmin = (env: Env, email: string) => (env.ADMIN_EMAILS ?? '').toLowerCase().split(',').map((x) => x.trim()).includes(email.toLowerCase());

app.post('/adulto/cadastro', async (c) => {
  const b = await corpo(c);
  const nome = String(b.nome ?? '').trim().slice(0, 60);
  const email = String(b.email ?? '').trim().toLowerCase();
  const senha = String(b.senha ?? '');
  if (nome.length < 2) return erro(c, 400, 'Digite seu nome.');
  if (!emailValido(email)) return erro(c, 400, 'E-mail inválido.');
  if (senha.length < 8) return erro(c, 400, 'A senha precisa ter pelo menos 8 caracteres.');
  if (b.aceite !== true) return erro(c, 400, 'Para criar a conta, confirme que você é maior de idade e aceita a política de privacidade.');
  const id = aleatorio(8), sal = aleatorio(16);
  try {
    await c.env.DB.prepare('INSERT INTO adultos (id, nome, email, senha_hash, senha_sal, criado, aceite, aceite_versao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, nome, email, await hashSegredo(senha, sal), sal, Date.now(), Date.now(), VERSAO_PRIVACIDADE).run();
  } catch (e) {
    if (String(e).includes('UNIQUE')) return erro(c, 409, 'Já existe uma conta com esse e-mail. Use "Entrar".');
    throw e;
  }
  return c.json({ token: await novaSessao(c.env.DB, 'adulto', id), adulto: { nome, email, admin: ehAdmin(c.env, email), precisaAceite: false, temSenha: true } });
});

app.post('/adulto/entrar', async (c) => {
  const b = await corpo(c);
  const email = String(b.email ?? '').trim().toLowerCase();
  const a = await c.env.DB.prepare('SELECT * FROM adultos WHERE email = ?').bind(email).first<Adulto>();
  const generico = 'E-mail ou senha não conferem.';
  if (!a) return erro(c, 401, generico);
  if (a.bloqueado_ate > Date.now()) return erro(c, 423, 'Muitas tentativas erradas. Tente de novo em 15 minutos.');
  if (!iguais(await hashSegredo(String(b.senha ?? ''), a.senha_sal), a.senha_hash)) {
    const f = a.falhas + 1;
    await c.env.DB.prepare('UPDATE adultos SET falhas = ?, bloqueado_ate = ? WHERE id = ?')
      .bind(f >= MAX_FALHAS ? 0 : f, f >= MAX_FALHAS ? Date.now() + BLOQUEIO_MS : 0, a.id).run();
    return erro(c, 401, generico);
  }
  await c.env.DB.prepare('UPDATE adultos SET falhas = 0, bloqueado_ate = 0 WHERE id = ?').bind(a.id).run();
  return c.json({ token: await novaSessao(c.env.DB, 'adulto', a.id), adulto: dadosAdulto(c.env, a) });
});

const dadosAdulto = (env: Env, a: Pick<Adulto, 'nome' | 'email' | 'aceite_versao' | 'tem_senha'>) =>
  ({ nome: a.nome, email: a.email, admin: ehAdmin(env, a.email), precisaAceite: a.aceite_versao !== VERSAO_PRIVACIDADE, temSenha: !!a.tem_senha });

async function adulto(c: C) {
  const id = await sessao(c, 'adulto');
  if (!id) return null;
  const a = await c.env.DB.prepare('SELECT id, nome, email, aceite_versao, tem_senha FROM adultos WHERE id = ?').bind(id)
    .first<{ id: string; nome: string; email: string; aceite_versao: string; tem_senha: number }>();
  return a ? { ...a, admin: ehAdmin(c.env, a.email) } : null;
}

/** O que está ligado neste servidor (o app só mostra os botões que funcionam). */
app.get('/config', (c) => c.json({
  google: c.env.GOOGLE_CLIENT_ID || null,
  apple: c.env.APPLE_CLIENT_ID || null,
  recuperarSenha: !!(c.env.RESEND_API_KEY && c.env.EMAIL_REMETENTE),
}));

/** Adulto que já tinha conta aceita a política de privacidade (versão nova). */
app.post('/adulto/aceite', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  if ((await corpo(c)).aceite !== true) return erro(c, 400, 'Marque que você aceita a política de privacidade.');
  await c.env.DB.prepare('UPDATE adultos SET aceite = ?, aceite_versao = ? WHERE id = ?').bind(Date.now(), VERSAO_PRIVACIDADE, a.id).run();
  return c.json({ ok: true });
});

/**
 * Entrar com Google ou Apple. Se já existe conta com o mesmo e-mail, entra nela.
 * Se não existe, cria — mas só depois do aceite (a primeira resposta pede o aceite).
 */
app.post('/adulto/social', async (c) => {
  const b = await corpo(c);
  const p = b.provedor === 'google' ? GOOGLE : b.provedor === 'apple' ? APPLE : null;
  const cliente = p === GOOGLE ? c.env.GOOGLE_CLIENT_ID : p === APPLE ? c.env.APPLE_CLIENT_ID : undefined;
  if (!p || !cliente) return erro(c, 400, 'Esse jeito de entrar não está disponível.');
  let cracha;
  try { cracha = await conferirCracha(String(b.token ?? ''), p, cliente); } catch { return erro(c, 400, 'Não consegui falar com o ' + (p === GOOGLE ? 'Google' : 'Apple') + '. Tente de novo.'); }
  if (!cracha) return erro(c, 401, 'Não deu para confirmar sua conta. Tente de novo.');
  if (!cracha.emailVerificado || !emailValido(cracha.email)) return erro(c, 401, 'Sua conta precisa ter um e-mail confirmado.');
  const db = c.env.DB;
  const a = await db.prepare('SELECT * FROM adultos WHERE email = ?').bind(cracha.email).first<Adulto>();
  if (a) return c.json({ token: await novaSessao(db, 'adulto', a.id), adulto: dadosAdulto(c.env, a) });
  const nome = (String(b.nome ?? '').trim() || cracha.nome || cracha.email.split('@')[0]).slice(0, 60);
  if (b.aceite !== true) return c.json({ precisaAceite: true, nome, email: cracha.email });
  const id = aleatorio(8), sal = aleatorio(16);
  // Sem senha: guarda um segredo sorteado que ninguém conhece. Dá para criar senha depois em "Esqueci minha senha".
  await db.prepare('INSERT INTO adultos (id, nome, email, senha_hash, senha_sal, criado, aceite, aceite_versao, tem_senha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)')
    .bind(id, nome, cracha.email, await hashSegredo(aleatorio(32), sal), sal, Date.now(), Date.now(), VERSAO_PRIVACIDADE).run();
  return c.json({ token: await novaSessao(db, 'adulto', id), adulto: { nome, email: cracha.email, admin: ehAdmin(c.env, cracha.email), precisaAceite: false, temSenha: false } });
});

/** Esqueci minha senha: manda um link por e-mail. Responde igual exista ou não a conta. */
app.post('/adulto/esqueci', async (c) => {
  if (!c.env.RESEND_API_KEY || !c.env.EMAIL_REMETENTE) return erro(c, 400, 'Essa opção ainda não está disponível.');
  const email = String((await corpo(c)).email ?? '').trim().toLowerCase();
  if (!emailValido(email)) return erro(c, 400, 'E-mail inválido.');
  const resposta = c.json({ ok: true });
  const a = await c.env.DB.prepare('SELECT id, nome FROM adultos WHERE email = ?').bind(email).first<{ id: string; nome: string }>();
  if (!a) return resposta;
  const recentes = await c.env.DB.prepare('SELECT COUNT(*) n FROM recuperacoes WHERE adulto_id = ? AND criado > ?').bind(a.id, Date.now() - 3_600_000).first<{ n: number }>();
  if ((recentes?.n ?? 0) >= 3) return resposta;
  const token = aleatorio(32);
  await c.env.DB.prepare('INSERT INTO recuperacoes (token_hash, adulto_id, expira, criado) VALUES (?, ?, ?, ?)')
    .bind(await sha256(token), a.id, Date.now() + 3_600_000, Date.now()).run();
  const link = `${new URL(c.req.url).origin}/#/nova-senha/${token}`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${c.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: c.env.EMAIL_REMETENTE, to: [email], subject: 'Sabidex: criar uma senha nova',
      text: `Olá, ${a.nome}!\n\nPara criar uma senha nova no Sabidex, abra este link (vale por 1 hora):\n${link}\n\nSe não foi você que pediu, ignore este e-mail.`,
      html: `<p>Olá, ${a.nome.replace(/[<>&"]/g, '')}!</p><p>Para criar uma senha nova no Sabidex, toque no link abaixo. Ele vale por 1 hora.</p><p><a href="${link}">Criar senha nova</a></p><p>Se não foi você que pediu, ignore este e-mail.</p>`,
    }),
  }).catch((e) => { console.error('resend', e); return null; });
  if (r && !r.ok) console.error('resend', r.status, await r.text());
  return resposta;
});

/** Cria a senha nova a partir do link do e-mail. Encerra as outras sessões do adulto. */
app.post('/adulto/nova-senha', async (c) => {
  const b = await corpo(c);
  const senha = String(b.senha ?? '');
  if (senha.length < 8) return erro(c, 400, 'A senha precisa ter pelo menos 8 caracteres.');
  const h = await sha256(String(b.token ?? ''));
  const rec = await c.env.DB.prepare('SELECT adulto_id, expira, usado FROM recuperacoes WHERE token_hash = ?').bind(h).first<{ adulto_id: string; expira: number; usado: number }>();
  if (!rec || rec.usado || rec.expira < Date.now()) return erro(c, 400, 'Esse link não vale mais. Peça outro em "Esqueci minha senha".');
  const sal = aleatorio(16);
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE recuperacoes SET usado = 1 WHERE token_hash = ?').bind(h),
    c.env.DB.prepare('UPDATE adultos SET senha_hash = ?, senha_sal = ?, tem_senha = 1, falhas = 0, bloqueado_ate = 0 WHERE id = ?').bind(await hashSegredo(senha, sal), sal, rec.adulto_id),
    c.env.DB.prepare(`DELETE FROM sessoes WHERE tipo = 'adulto' AND ref_id = ?`).bind(rec.adulto_id),
  ]);
  const a = await c.env.DB.prepare('SELECT * FROM adultos WHERE id = ?').bind(rec.adulto_id).first<Adulto>();
  return c.json({ token: await novaSessao(c.env.DB, 'adulto', rec.adulto_id), adulto: dadosAdulto(c.env, a!) });
});

app.post('/adulto/sair', sairSessao);

app.get('/adulto/eu', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  return c.json({ adulto: dadosAdulto(c.env, a) });
});

app.get('/adulto/turmas', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const sql = `SELECT t.id, t.nome, t.codigo, t.criado, d.nome AS dono, (SELECT COUNT(*) FROM criancas WHERE turma_id = t.id) AS criancas
    FROM turmas t JOIN adultos d ON d.id = t.dono_id ${a.admin ? '' : 'WHERE t.dono_id = ?'} ORDER BY t.criado DESC`;
  const st = c.env.DB.prepare(sql);
  const r = await (a.admin ? st : st.bind(a.id)).all();
  return c.json({ turmas: r.results });
});

app.post('/adulto/turmas', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const b = await corpo(c);
  const nome = String(b.nome ?? '').trim().slice(0, 50);
  if (nome.length < 2) return erro(c, 400, 'Dê um nome para a turma, por exemplo "4º ano B".');
  const n = await c.env.DB.prepare('SELECT COUNT(*) n FROM turmas WHERE dono_id = ?').bind(a.id).first<{ n: number }>();
  if ((n?.n ?? 0) >= 20 && !a.admin) return erro(c, 429, 'Limite de 20 turmas por adulto.');
  for (let i = 0; i < 6; i++) {
    const id = aleatorio(8), codigo = gerarCodigo();
    try {
      await c.env.DB.prepare('INSERT INTO turmas (id, codigo, nome, dono_id, criado) VALUES (?, ?, ?, ?, ?)').bind(id, codigo, nome, a.id, Date.now()).run();
      return c.json({ turma: { id, nome, codigo } });
    } catch (e) { if (!String(e).includes('UNIQUE')) throw e; }
  }
  return erro(c, 409, 'Não consegui gerar um código. Tente de novo.');
});

async function turmaDoAdulto(c: C, a: { id: string; admin: boolean }) {
  return c.env.DB.prepare(`SELECT id, nome, codigo FROM turmas WHERE id = ? ${a.admin ? '' : 'AND dono_id = ?'}`)
    .bind(...(a.admin ? [c.req.param('id')] : [c.req.param('id'), a.id])).first<{ id: string; nome: string; codigo: string }>();
}

app.get('/adulto/turmas/:id', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const t = await turmaDoAdulto(c, a);
  if (!t) return erro(c, 404, 'Turma não encontrada.');
  const r = await c.env.DB.prepare(`SELECT id, apelido, cor, criado, visto, bloqueado_ate, familia_id IS NOT NULL AS familia, CASE WHEN semana = ? THEN xp_semana ELSE 0 END AS xp_semana,
    json_extract(progresso, '$.xp') AS xp, (SELECT COUNT(*) FROM cartas WHERE crianca_id = criancas.id AND qtd > 0) AS cartas
    FROM criancas WHERE turma_id = ? ORDER BY apelido_chave`).bind(semanaDe(), t.id).all();
  return c.json({ turma: t, criancas: r.results, provas: await datasDe(c.env.DB, [t.id]) });
});

app.post('/adulto/turmas/:id/provas', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const t = await turmaDoAdulto(c, a);
  if (!t) return erro(c, 404, 'Turma não encontrada.');
  return marcarData(c, t.id);
});

app.post('/adulto/turmas/:id/criancas/:cid/pin', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const t = await turmaDoAdulto(c, a);
  if (!t) return erro(c, 404, 'Turma não encontrada.');
  const pin = pinAleatorio(), sal = aleatorio(16);
  const r = await c.env.DB.prepare('UPDATE criancas SET pin_hash = ?, pin_sal = ?, falhas = 0, bloqueado_ate = 0 WHERE id = ? AND turma_id = ?')
    .bind(await hashSegredo(pin, sal), sal, c.req.param('cid'), t.id).run();
  if (!r.meta.changes) return erro(c, 404, 'Criança não encontrada.');
  return c.json({ pin });
});

/**
 * Tira a criança da turma. Se ela tem conta da família, a conta continua (só sai da turma);
 * se foi criada só na turma, a conta é apagada.
 */
app.delete('/adulto/turmas/:id/criancas/:cid', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const t = await turmaDoAdulto(c, a);
  if (!t) return erro(c, 404, 'Turma não encontrada.');
  const cid = c.req.param('cid');
  const k = await c.env.DB.prepare('SELECT id, familia_id FROM criancas WHERE id = ? AND turma_id = ?').bind(cid, t.id).first<{ id: string; familia_id: string | null }>();
  if (!k) return erro(c, 404, 'Criança não encontrada.');
  await c.env.DB.batch(k.familia_id ? tirarDaTurma(c.env.DB, cid, k.familia_id) : apagarCrianca(c.env.DB, cid));
  return c.json({ ok: true, apagada: !k.familia_id });
});

/* ---------------- Família: o responsável e os perfis dos filhos ---------------- */

const doAdulto = (c: C, adultoId: string) =>
  c.env.DB.prepare('SELECT * FROM criancas WHERE id = ? AND familia_id = ?').bind(c.req.param('cid'), adultoId).first<Crianca>();

app.get('/adulto/familia', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const r = await c.env.DB.prepare(`SELECT k.id, k.apelido, k.cor, k.criado, k.visto, k.bloqueado_ate, t.nome AS turma, t.codigo AS codigo,
    json_extract(k.progresso, '$.xp') AS xp, (SELECT COUNT(*) FROM cartas WHERE crianca_id = k.id AND qtd > 0) AS cartas
    FROM criancas k LEFT JOIN turmas t ON t.id = k.turma_id WHERE k.familia_id = ? ORDER BY k.criado`).bind(a.id).all();
  return c.json({ filhos: r.results, provas: await datasDe(c.env.DB, [turmaDaFamilia(a.id)]) });
});

/** Datas das provas para os filhos (vale para quem não está numa turma, ou quando a turma não marcou). */
app.post('/adulto/familia/provas', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  return marcarData(c, turmaDaFamilia(a.id));
});

/** Cria o perfil de um filho. Com `progresso`/`cartas`, leva junto o que já foi feito no aparelho. */
app.post('/adulto/familia', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const b = await corpo(c);
  const apelido = normalizarApelido(String(b.apelido ?? ''));
  const cor = String(b.cor ?? '');
  if (apelido.length < 2) return erro(c, 400, 'O apelido precisa ter pelo menos 2 letras.');
  if (!COR.test(cor)) return erro(c, 400, 'Cor inválida.');
  if (!pinValido(b.pin)) return erro(c, 400, 'O PIN precisa ter 4 números.');
  const n = await c.env.DB.prepare('SELECT COUNT(*) n FROM criancas WHERE familia_id = ?').bind(a.id).first<{ n: number }>();
  if ((n?.n ?? 0) >= MAX_FILHOS) return erro(c, 429, `Limite de ${MAX_FILHOS} crianças por família.`);
  const id = aleatorio(8), sal = aleatorio(16);
  const progresso = mesclar(progressoVazio(), sanitizar(b.progresso, FASES_VALIDAS));
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO criancas (id, turma_id, familia_id, apelido, apelido_chave, cor, pin_hash, pin_sal, progresso, xp_semana, semana, criado, visto)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`)
        .bind(id, turmaDaFamilia(a.id), a.id, apelido, chaveApelido(apelido), cor, await hashSegredo(b.pin as string, sal), sal, JSON.stringify(progresso), semanaDe(), Date.now(), Date.now()),
      ...upsertCartas(c.env.DB, id, sanitizarDelta(b.cartas, IDS_PACOTE)),
    ]);
  } catch (e) {
    if (String(e).includes('UNIQUE')) return erro(c, 409, 'Já tem uma criança com esse apelido na sua família.');
    throw e;
  }
  return c.json({ id });
});

/** Liga à família uma conta que a criança já tinha numa turma (código + apelido + PIN). */
app.post('/adulto/familia/ligar', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const b = await corpo(c);
  const k = await c.env.DB.prepare(`SELECT k.* FROM criancas k JOIN turmas t ON t.id = k.turma_id WHERE t.codigo = ? AND k.apelido_chave = ?`)
    .bind(normalizarCodigo(String(b.codigo ?? '')), chaveApelido(normalizarApelido(String(b.apelido ?? '')))).first<Crianca>();
  const generico = 'Código, apelido ou PIN não conferem.';
  if (!k) return erro(c, 401, generico);
  const falha = await conferirPin(c.env.DB, k, b.pin, generico);
  if (falha) return erro(c, falha.status, falha.msg);
  if (k.familia_id && k.familia_id !== a.id) return erro(c, 409, 'Essa conta já está ligada a outra família.');
  const n = await c.env.DB.prepare('SELECT COUNT(*) n FROM criancas WHERE familia_id = ?').bind(a.id).first<{ n: number }>();
  if (!k.familia_id && (n?.n ?? 0) >= MAX_FILHOS) return erro(c, 429, `Limite de ${MAX_FILHOS} crianças por família.`);
  await c.env.DB.prepare('UPDATE criancas SET familia_id = ? WHERE id = ?').bind(a.id, k.id).run();
  return c.json({ id: k.id });
});

/** Abre o perfil do filho neste aparelho (o adulto já provou quem é com a senha). */
app.post('/adulto/familia/:cid/aparelho', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const k = await doAdulto(c, a.id);
  if (!k) return erro(c, 404, 'Criança não encontrada.');
  await c.env.DB.prepare('UPDATE criancas SET falhas = 0, bloqueado_ate = 0, visto = ? WHERE id = ?').bind(Date.now(), k.id).run();
  return c.json({ token: await novaSessao(c.env.DB, 'crianca', k.id), ...(await respostaConta(c.env.DB, k, sanitizar(JSON.parse(k.progresso), FASES_VALIDAS))) });
});

/** O responsável escolhe um PIN novo (ou o servidor sorteia um). */
app.post('/adulto/familia/:cid/pin', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const b = await corpo(c);
  if (b.pin !== undefined && !pinValido(b.pin)) return erro(c, 400, 'O PIN precisa ter 4 números.');
  const pin = b.pin === undefined ? pinAleatorio() : String(b.pin), sal = aleatorio(16);
  const r = await c.env.DB.prepare('UPDATE criancas SET pin_hash = ?, pin_sal = ?, falhas = 0, bloqueado_ate = 0 WHERE id = ? AND familia_id = ?')
    .bind(await hashSegredo(pin, sal), sal, c.req.param('cid'), a.id).run();
  if (!r.meta.changes) return erro(c, 404, 'Criança não encontrada.');
  return c.json({ pin });
});

app.post('/adulto/familia/:cid/sair-turma', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const k = await doAdulto(c, a.id);
  if (!k) return erro(c, 404, 'Criança não encontrada.');
  if (temTurma(k.turma_id)) await c.env.DB.batch(tirarDaTurma(c.env.DB, k.id, a.id));
  return c.json({ ok: true });
});

/** Apaga o perfil do filho e tudo dele, para sempre. */
app.delete('/adulto/familia/:cid', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const k = await doAdulto(c, a.id);
  if (!k) return erro(c, 404, 'Criança não encontrada.');
  await c.env.DB.batch(apagarCrianca(c.env.DB, k.id));
  return c.json({ ok: true });
});

/**
 * Apaga a conta do adulto (exigência da Apple e do Google). Pede a senha de novo.
 * Some junto: os perfis dos filhos e as turmas dele. Crianças de outras famílias
 * que estavam nessas turmas só saem da turma; as que só existiam na turma são apagadas.
 */
app.post('/adulto/apagar-conta', async (c) => {
  const id = await sessao(c, 'adulto');
  if (!id) return erro(c, 401, 'Entre de novo.');
  const a = await c.env.DB.prepare('SELECT * FROM adultos WHERE id = ?').bind(id).first<Adulto>();
  if (!a) return erro(c, 401, 'Entre de novo.');
  const b = await corpo(c);
  if (a.tem_senha) {
    if (!iguais(await hashSegredo(String(b.senha ?? ''), a.senha_sal), a.senha_hash)) return erro(c, 401, 'Senha errada.');
  } else if (String(b.confirmar ?? '').trim().toUpperCase() !== 'APAGAR') return erro(c, 400, 'Escreva APAGAR para confirmar.');
  const db = c.env.DB;
  const turmas = (await db.prepare('SELECT id FROM turmas WHERE dono_id = ?').bind(a.id).all<{ id: string }>()).results.map((t) => t.id);
  const nasTurmas = turmas.length
    ? (await db.prepare(`SELECT id, familia_id FROM criancas WHERE turma_id IN (${turmas.map(() => '?').join(',')})`).bind(...turmas).all<{ id: string; familia_id: string | null }>()).results
    : [];
  const filhos = (await db.prepare('SELECT id FROM criancas WHERE familia_id = ?').bind(a.id).all<{ id: string }>()).results.map((k) => k.id);
  const apagar = new Set([...filhos, ...nasTurmas.filter((k) => !k.familia_id || k.familia_id === a.id).map((k) => k.id)]);
  const mover = nasTurmas.filter((k) => k.familia_id && k.familia_id !== a.id);
  await db.batch([
    ...[...apagar].flatMap((cid) => apagarCrianca(db, cid)),
    ...mover.flatMap((k) => tirarDaTurma(db, k.id, k.familia_id!)),
    ...turmas.map((t) => db.prepare('DELETE FROM turmas WHERE id = ?').bind(t)),
    ...[...turmas, turmaDaFamilia(a.id)].map((t) => db.prepare('DELETE FROM datas_prova WHERE turma_id = ?').bind(t)),
    db.prepare(`DELETE FROM sessoes WHERE tipo = 'adulto' AND ref_id = ?`).bind(a.id),
    db.prepare('DELETE FROM adultos WHERE id = ?').bind(a.id),
  ]);
  return c.json({ ok: true });
});

app.notFound((c) => c.json({ erro: 'Não encontrado.' }, 404));
app.onError((e, c) => { console.error(e); return c.json({ erro: 'Algo deu errado. Tente de novo.' }, 500); });

// Endereço principal. sabidex.com, www.sabidex.com e www.sabidex.com.br levam para cá,
// assim o progresso salvo no aparelho fica sempre no mesmo endereço.
// O endereço antigo *.workers.dev continua funcionando sem mudar.
const PRINCIPAL = 'sabidex.com.br';
const REDIRECIONAR = new Set(['sabidex.com', 'www.sabidex.com', 'www.sabidex.com.br']);

// Arquivo que não existe (áudio, imagem, script) responde "não encontrado".
// Sem isso, a Cloudflare devolve a página do app no lugar, e o aparelho guardava
// essa página como se fosse o áudio (aí tocava a narração antiga, de reserva).
async function arquivo(req: Request, env: Env) {
  const r = await env.ASSETS.fetch(req);
  const ultimo = new URL(req.url).pathname.split('/').pop() ?? '';
  const temExtensao = /\.[a-z0-9]+$/i.test(ultimo) && !ultimo.endsWith('.html');
  if (temExtensao && (r.headers.get('content-type') ?? '').includes('text/html')) {
    return new Response('Não encontrado.', { status: 404 });
  }
  return r;
}

export default {
  fetch(req: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(req.url);
    if (REDIRECIONAR.has(url.hostname)) {
      url.hostname = PRINCIPAL;
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return app.fetch(req, env, ctx);
    return arquivo(req, env);
  },
} satisfies ExportedHandler<Env>;
