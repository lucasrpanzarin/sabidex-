// Servidor do Sabidex: turmas, contas das crianças (PIN), sincronização, trocas e ranking.
// Roda na Cloudflare (Worker + banco D1). Tudo fora de /api/* é o app (arquivos estáticos).

import { Hono, type Context } from 'hono';
import { capitulos } from '../data';
import { FASES, POR_PACOTE, chaveExtra, extrasDo } from '../lib/jogo';
import { idEvolucao, itemPorId, migrarFormas, podeEvoluir, premiosLivres, PRECO_EVOLUCAO, protegido, refCompra } from '../lib/loja';
import { figurinhaPorId, idCarta, IDS_CARTAS } from '../lib/figurinhas';
import {
  comBoasVindas, gerarCodigo, mesclar, normalizarApelido, normalizarCodigo, pinValido, progressoVazio,
  sanitizar, sanitizarDelta, semanaDe, type ProgressoSync,
} from '../shared/sync';
import { ESQUEMA, MIGRACOES, temTurma, turmaDaFamilia, VERSAO_ESQUEMA } from './esquema';
import { dataValida, type DatasProva } from '../lib/provas';
import { conferirMensagem, dentroDoHorario, GUARDAR_DIAS, JANELA_LIMITE, LIMITE_MENSAGENS, MOTIVO as MOTIVO_CHAT, ONLINE_MS } from '../shared/chat';
import { APPLE, conferirCracha, GOOGLE } from './jwt';
import {
  corrigir, DUELOS_COM_XP_POR_DIA, diaBrasilia, MAX_DESAFIOS_ESPERANDO, montarDuelo, mundosEmComum, VALIDADE_DUELO_MS, vencedorDe,
} from '../shared/duelo';
import { diaBR, sortearPacote, type Contadores } from '../shared/pacotes';
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
    // Cada vez que o servidor "acorda", confere as tabelas. Se já estão na versão certa, é uma consulta só
    // (antes rodava umas 40, uma depois da outra, e a primeira tela demorava).
    const db = c.env.DB;
    const v = await db.prepare('SELECT versao FROM esquema_versao LIMIT 1').first<{ versao: string }>().catch(() => null);
    if (v?.versao !== VERSAO_ESQUEMA) {
      await db.batch(ESQUEMA.map((s) => db.prepare(s)));
      for (const m of MIGRACOES) {
        try { await db.prepare(m).run(); } catch (e) { if (!String(e).includes('duplicate column')) throw e; }
      }
      await db.batch([
        db.prepare('CREATE TABLE IF NOT EXISTS esquema_versao (versao TEXT NOT NULL)'),
        db.prepare('DELETE FROM esquema_versao'),
        db.prepare('INSERT INTO esquema_versao (versao) VALUES (?)').bind(VERSAO_ESQUEMA),
      ]);
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
  familia_id: string | null; chat_ok: number; mostrar_online: number; mudo_ate: number; ativo: number;
  sem_novo: number; pacotes_dia: string; pacotes_hoje: number; epicos: number; ultimo_pacote: string;
}

const contadoresDe = (k: Crianca): Contadores => ({ semNovo: k.sem_novo ?? 0, dia: k.pacotes_dia ?? '', hoje: k.pacotes_hoje ?? 0, epicos: k.epicos ?? 0 });

/* ---------------- Limite de códigos errados ---------------- */

/** Erros de código permitidos por internet (IP) a cada 15 minutos. Numa escola, a turma toda divide a mesma internet. */
const MAX_ERROS_CODIGO = 30;
const JANELA_ERROS = 15 * 60_000;
const MSG_MUITOS_ERROS = 'Muitos códigos errados seguidos. Espere 15 minutos e tente de novo.';
const ipDe = (c: C) => c.req.header('CF-Connecting-IP') ?? 'local';

async function muitosErros(c: C) {
  const r = await c.env.DB.prepare('SELECT n, inicio FROM tentativas WHERE chave = ?').bind('codigo:' + ipDe(c)).first<{ n: number; inicio: number }>();
  return !!r && Date.now() - r.inicio < JANELA_ERROS && r.n >= MAX_ERROS_CODIGO;
}

async function contarErro(c: C) {
  const agora = Date.now();
  await c.env.DB.prepare(`INSERT INTO tentativas (chave, n, inicio) VALUES (?1, 1, ?2)
    ON CONFLICT (chave) DO UPDATE SET n = CASE WHEN ?2 - inicio > ?3 THEN 1 ELSE n + 1 END, inicio = CASE WHEN ?2 - inicio > ?3 THEN ?2 ELSE inicio END`)
    .bind('codigo:' + ipDe(c), agora, JANELA_ERROS).run();
  // De vez em quando, limpa as linhas velhas.
  if (Math.random() < 0.02) await c.env.DB.prepare('DELETE FROM tentativas WHERE inicio < ?').bind(agora - DIA).run();
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
    db.prepare('DELETE FROM mensagens WHERE crianca_id = ?').bind(cid),
    db.prepare('DELETE FROM duelos WHERE de_id = ? OR para_id = ?').bind(cid, cid),
    db.prepare('DELETE FROM avisos_chat WHERE por_id = ?').bind(cid),
    db.prepare('DELETE FROM criancas WHERE id = ?').bind(cid),
  ];
}

/** Tira a criança da turma sem apagar a conta: ela volta a ser só da família. */
function tirarDaTurma(db: D1Database, cid: string, familiaId: string) {
  return [
    db.prepare(`UPDATE duelos SET status = 'cancelado', resolvido = ? WHERE (de_id = ? OR para_id = ?) AND status IN ('novo', 'esperando')`).bind(Date.now(), cid, cid),
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

/**
 * Só para o progresso que já estava no aparelho antes de ter conta (entrar na turma ou criar o perfil
 * levando o que foi feito): no máximo 1 carta por pacote aberto. Depois de ter conta, quem sorteia é o servidor.
 */
function limitarCartas(delta: Record<string, number>, pacotesNovos: number): Record<string, number> {
  let resta = Math.max(0, pacotesNovos) * POR_PACOTE;
  const out: Record<string, number> = {};
  for (const [carta, n] of Object.entries(delta)) {
    const pode = Math.min(n, resta);
    if (pode > 0) { out[carta] = pode; resta -= pode; }
  }
  return out;
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

/** Código livre: não é de nenhuma turma nem de nenhuma família. */
async function codigoLivre(db: D1Database) {
  for (let i = 0; i < 8; i++) {
    const codigo = gerarCodigo();
    const usado = await db.prepare('SELECT 1 FROM turmas WHERE codigo = ?1 UNION ALL SELECT 1 FROM adultos WHERE codigo_familia = ?1').bind(codigo).first();
    if (!usado) return codigo;
  }
  return null;
}

/** O código da família do adulto (cria na primeira vez; com `novo`, troca por outro). */
async function codigoDaFamilia(db: D1Database, adultoId: string, novo = false): Promise<string | null> {
  if (!novo) {
    const a = await db.prepare('SELECT codigo_familia FROM adultos WHERE id = ?').bind(adultoId).first<{ codigo_familia: string | null }>();
    if (a?.codigo_familia) return a.codigo_familia;
  }
  for (let i = 0; i < 4; i++) {
    const codigo = await codigoLivre(db);
    if (!codigo) return null;
    try {
      await db.prepare('UPDATE adultos SET codigo_familia = ? WHERE id = ?').bind(codigo, adultoId).run();
      return codigo;
    } catch (e) { if (!String(e).includes('UNIQUE')) throw e; }
  }
  return null;
}

app.post('/turma/info', async (c) => {
  if (await muitosErros(c)) return erro(c, 429, MSG_MUITOS_ERROS);
  const b = await corpo(c);
  const codigo = normalizarCodigo(String(b.codigo ?? ''));
  const t = await c.env.DB.prepare('SELECT nome FROM turmas WHERE codigo = ?').bind(codigo).first<{ nome: string }>();
  if (!t) {
    const f = await c.env.DB.prepare('SELECT 1 FROM adultos WHERE codigo_familia = ?').bind(codigo).first();
    if (f) return erro(c, 400, 'Esse é o código da família, não de uma turma. A turma tem outro código, que o professor passa.');
    await contarErro(c);
    return erro(c, 404, 'Não achei essa turma. Confira o código com seu professor ou responsável.');
  }
  return c.json({ nome: t.nome, codigo });
});

/**
 * Quem tem o código da turma vê os apelidos e cores dos colegas (os mesmos do ranking),
 * para tocar no próprio nome em vez de decorar o apelido. A conta continua protegida pelo PIN.
 */
app.post('/turma/alunos', async (c) => {
  if (await muitosErros(c)) return erro(c, 429, MSG_MUITOS_ERROS);
  const b = await corpo(c);
  const codigo = normalizarCodigo(String(b.codigo ?? ''));
  const t = await c.env.DB.prepare('SELECT id, nome FROM turmas WHERE codigo = ?').bind(codigo).first<{ id: string; nome: string }>();
  if (t) {
    const r = await c.env.DB.prepare('SELECT apelido, cor FROM criancas WHERE turma_id = ? ORDER BY apelido_chave').bind(t.id).all<{ apelido: string; cor: string }>();
    return c.json({ nome: t.nome, codigo, familia: false, alunos: r.results });
  }
  // Código da família: mostra os filhos (apelido e cor). Entrar continua pedindo o PIN de cada um.
  const f = await c.env.DB.prepare('SELECT id FROM adultos WHERE codigo_familia = ?').bind(codigo).first<{ id: string }>();
  if (!f) { await contarErro(c); return erro(c, 404, 'Não achei esse código. Confira com seu professor ou com um adulto da sua casa.'); }
  const r = await c.env.DB.prepare('SELECT id, apelido, cor FROM criancas WHERE familia_id = ? ORDER BY criado').bind(f.id).all<{ id: string; apelido: string; cor: string }>();
  return c.json({ nome: 'Sua família', codigo, familia: true, alunos: r.results });
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
  if (await muitosErros(c)) return erro(c, 429, MSG_MUITOS_ERROS);
  const t = await c.env.DB.prepare('SELECT id FROM turmas WHERE codigo = ?').bind(codigo).first<{ id: string }>();
  if (!t) { await contarErro(c); return erro(c, 404, 'Não achei essa turma. Confira o código.'); }
  if (await contarNaTurma(c.env.DB, t.id) >= 60) return erro(c, 409, 'Essa turma já está cheia.');

  const id = aleatorio(8);
  const sal = aleatorio(16);
  const progresso = comBoasVindas(mesclar(progressoVazio(), sanitizar(b.progresso, FASES_VALIDAS)));
  const semana = semanaDe();
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO criancas (id, turma_id, apelido, apelido_chave, cor, pin_hash, pin_sal, progresso, xp_semana, semana, criado, visto)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`)
        .bind(id, t.id, apelido, chaveApelido(apelido), cor, await hashSegredo(b.pin as string, sal), sal, JSON.stringify(progresso), semana, Date.now(), Date.now()),
      ...upsertCartas(c.env.DB, id, limitarCartas(sanitizarDelta(b.cartas, IDS_CARTAS), progresso.abertos.length)),
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
  if (await muitosErros(c)) return erro(c, 429, MSG_MUITOS_ERROS);
  const b = await corpo(c);
  const codigo = normalizarCodigo(String(b.codigo ?? ''));
  const apelido = normalizarApelido(String(b.apelido ?? ''));
  if (!pinValido(b.pin)) return erro(c, 400, 'O PIN precisa ter 4 números.');
  const k = await c.env.DB.prepare(`SELECT k.* FROM criancas k JOIN turmas t ON t.id = k.turma_id WHERE t.codigo = ? AND k.apelido_chave = ?`)
    .bind(codigo, chaveApelido(apelido)).first<Crianca>();
  const generico = 'Código, apelido ou PIN não conferem. Tente de novo.';
  if (!k) { await contarErro(c); return erro(c, 401, generico); }
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
  // Sessão e criança numa consulta só (cada ida ao banco demora um pouco).
  const t = (c.req.header('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!t) return null;
  const k = await c.env.DB.prepare(`SELECT k.* FROM sessoes s JOIN criancas k ON k.id = s.ref_id
    WHERE s.token_hash = ? AND s.tipo = 'crianca' AND s.expira >= ?`).bind(await sha256(t), Date.now()).first<Crianca>();
  if (!k) return null;
  // "Estudando agora": guarda quando a criança mexeu no app (no máximo uma gravação a cada 30 s).
  // Grava sem fazer a criança esperar.
  const agora = Date.now();
  if (agora - (k.ativo ?? 0) > 30_000) {
    const gravar = c.env.DB.prepare('UPDATE criancas SET ativo = ? WHERE id = ?').bind(agora, k.id).run();
    try { c.executionCtx.waitUntil(gravar); } catch { await gravar; }
    k.ativo = agora;
  }
  return migrarCrianca(c.env.DB, k);
}

/**
 * Cada forma agora é uma carta. Quem evoluiu antes ganha a carta da forma que tinha
 * (no lugar de 1 cópia da forma 1). Acontece uma vez só, numa transação.
 */
async function migrarCrianca(db: D1Database, k: Crianca): Promise<Crianca> {
  const prog = sanitizar(JSON.parse(k.progresso), FASES_VALIDAS);
  // Quase sempre já migrou: confere só pelo progresso, sem ler as cartas do banco.
  if (!migrarFormas({ compras: prog.compras, cartas: {} })) return k;
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
  if (await muitosErros(c)) return erro(c, 429, MSG_MUITOS_ERROS);
  const t = await c.env.DB.prepare('SELECT id FROM turmas WHERE codigo = ?').bind(codigo).first<{ id: string }>();
  if (!t) { await contarErro(c); return erro(c, 404, 'Não achei essa turma. Confira o código.'); }
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
  const doAparelho = sanitizar(b.progresso, FASES_VALIDAS);
  // As cartas que o aparelho diz ter tirado não valem mais: quem sorteia é o servidor (veja /crianca/abrir-pacote).
  // Versões antigas do app ainda abrem pacote no aparelho; para esses pacotes, o servidor sorteia a carta aqui.
  const db = c.env.DB;
  // Grava só se ninguém mudou o progresso no meio do caminho (uma evolução, outra aba).
  // Se mudou, lê de novo e junta outra vez: assim nenhuma evolução ou compra do servidor se perde.
  let atual = k;
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const antes = sanitizar(JSON.parse(atual.progresso), FASES_VALIDAS);
    const m = conferirCompras(antes, mesclar(antes, doAparelho));
    // Só ganha carta o pacote que o servidor já conhecia; os outros só fecham.
    const delta: Record<string, number> = {};
    const tem = await cartasDe(db, atual.id);
    let cont = contadoresDe(atual);
    for (const id of m.abertos.filter((x) => !antes.abertos.includes(x))) {
      const p = antes.pacotes.find((x) => x.id === id);
      if (!p) continue;
      const s = sortearPacote({ ...antes, feitas: m.feitas, pacotes: [p], abertos: [] }, id, tem, cont, { capitulos: capitulos.length, dia: diaBR() });
      if ('erro' in s) continue;
      for (const carta of s.cartas) { delta[carta] = (delta[carta] ?? 0) + 1; tem[carta] = (tem[carta] ?? 0) + 1; }
      cont = s.contadores;
    }
    const semana = semanaDe();
    const ganho = Math.max(0, m.xp - antes.xp);
    const xpSemana = (atual.semana === semana ? atual.xp_semana : 0) + Math.min(ganho, 2000);
    const novo = JSON.stringify(m);
    const trava = `EXISTS (SELECT 1 FROM criancas WHERE id = ? AND progresso = ?)`;
    const res = await db.batch([
      // As cartas entram primeiro, só se o progresso ainda é o que foi lido (e depois o progresso muda).
      ...Object.entries(delta).map(([carta, n]) =>
        db.prepare(`INSERT INTO cartas (crianca_id, carta_id, qtd) SELECT ?, ?, ? WHERE ${trava}
          ON CONFLICT (crianca_id, carta_id) DO UPDATE SET qtd = qtd + excluded.qtd`).bind(atual.id, carta, n, atual.id, atual.progresso)),
      db.prepare(`UPDATE criancas SET progresso = ?, xp_semana = ?, semana = ?, visto = ?, sem_novo = ?, pacotes_dia = ?, pacotes_hoje = ?, epicos = ?
        WHERE id = ? AND progresso = ?`)
        .bind(novo, xpSemana, semana, Date.now(), cont.semNovo, cont.dia, cont.hoje, cont.epicos, atual.id, atual.progresso),
    ]);
    if (res[res.length - 1].meta.changes === 1) return c.json(await respostaConta(db, atual, m));
    const relido = await db.prepare('SELECT * FROM criancas WHERE id = ?').bind(k.id).first<Crianca>();
    if (!relido) return erro(c, 401, 'Entre de novo na sua conta.');
    atual = relido;
  }
  return erro(c, 409, 'Muita coisa ao mesmo tempo. Tente de novo.');
});

/**
 * Abre um pacote: o servidor sorteia o Sabimon e guarda a carta e o pacote aberto numa vez só.
 * Se a internet cair no meio e a criança tentar de novo, recebe a mesma carta (não ganha outra).
 */
app.post('/crianca/abrir-pacote', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  const b = await corpo(c);
  const id = String(b.id ?? '').slice(0, 40);
  const db = c.env.DB;
  let atual = k;
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const prog = sanitizar(JSON.parse(atual.progresso), FASES_VALIDAS);
    if (prog.abertos.includes(id)) {
      const ultimo = (() => { try { return JSON.parse(atual.ultimo_pacote || 'null') as { id: string; cartas: string[] } | null; } catch { return null; } })();
      if (ultimo?.id === id) return c.json({ ...(await respostaConta(db, atual, prog)), cartasDoPacote: ultimo.cartas });
      return erro(c, 409, 'Esse pacote já foi aberto.');
    }
    const s = sortearPacote(prog, id, await cartasDe(db, atual.id), contadoresDe(atual), { capitulos: capitulos.length, dia: diaBR() });
    if ('erro' in s) return erro(c, 409, s.erro);
    const novo = JSON.stringify(s.progresso);
    const trava = `EXISTS (SELECT 1 FROM criancas WHERE id = ? AND progresso = ?)`;
    const res = await db.batch([
      ...s.cartas.map((carta) => db.prepare(`INSERT INTO cartas (crianca_id, carta_id, qtd) SELECT ?, ?, 1 WHERE ${trava}
        ON CONFLICT (crianca_id, carta_id) DO UPDATE SET qtd = qtd + 1`).bind(atual.id, carta, atual.id, atual.progresso)),
      db.prepare(`UPDATE criancas SET progresso = ?, sem_novo = ?, pacotes_dia = ?, pacotes_hoje = ?, epicos = ?, ultimo_pacote = ?, visto = ?
        WHERE id = ? AND progresso = ?`)
        .bind(novo, s.contadores.semNovo, s.contadores.dia, s.contadores.hoje, s.contadores.epicos, JSON.stringify({ id, cartas: s.cartas }), Date.now(), atual.id, atual.progresso),
    ]);
    if (res[res.length - 1].meta.changes === 1) {
      const depois = { ...atual, progresso: novo };
      return c.json({ ...(await respostaConta(db, depois, s.progresso)), cartasDoPacote: s.cartas });
    }
    const relido = await db.prepare('SELECT * FROM criancas WHERE id = ?').bind(k.id).first<Crianca>();
    if (!relido) return erro(c, 401, 'Entre de novo na sua conta.');
    atual = relido;
  }
  return erro(c, 409, 'Muita coisa ao mesmo tempo. Tente de novo.');
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
  const nova = idCarta(f.s.id, p.forma);
  const novo: ProgressoSync = { ...prog, compras: [...prog.compras, { id: idEvolucao(f.s.id, p.forma), sabimon: refCompra(nova), forma: p.forma, preco: PRECO_EVOLUCAO[p.forma] }] };
  const novoTexto = JSON.stringify(novo);
  // Tudo numa transação só: o progresso (com a compra da evolução) só muda se ninguém mexeu nele
  // e se ainda há cartas; as cartas só mudam se o progresso mudou. Nunca some carta sem evoluir.
  const feito = `EXISTS (SELECT 1 FROM criancas WHERE id = ? AND progresso = ?)`;
  const res = await db.batch([
    db.prepare(`UPDATE criancas SET progresso = ?, visto = ? WHERE id = ? AND progresso = ?
      AND EXISTS (SELECT 1 FROM cartas WHERE crianca_id = ? AND carta_id = ? AND qtd >= ?)`)
      .bind(novoTexto, Date.now(), k.id, k.progresso, k.id, f.id, minimo),
    db.prepare(`UPDATE cartas SET qtd = qtd - ? WHERE crianca_id = ? AND carta_id = ? AND ${feito}`).bind(p.gasta, k.id, f.id, k.id, novoTexto),
    db.prepare(`INSERT INTO cartas (crianca_id, carta_id, qtd) SELECT ?, ?, 1 WHERE ${feito}
      ON CONFLICT (crianca_id, carta_id) DO UPDATE SET qtd = qtd + 1`).bind(k.id, nova, k.id, novoTexto),
  ]);
  if (res[0].meta.changes !== 1) return erro(c, 409, 'Não deu para evoluir agora. Tente de novo.');
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
  const r = await c.env.DB.prepare(`SELECT k.id, k.apelido, k.cor, (SELECT COUNT(*) FROM cartas WHERE crianca_id = k.id AND qtd > 0) AS cartas,
    (t.mostrar_online = 1 AND k.mostrar_online = 1 AND k.ativo > ?) AS online
    FROM criancas k JOIN turmas t ON t.id = k.turma_id WHERE k.turma_id = ? AND k.id != ? ORDER BY k.apelido_chave`).bind(Date.now() - ONLINE_MS, k.turma_id, k.id).all();
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
  const inicioSemana = Date.parse(`${semanaDe()}T03:00:00Z`);
  const r = await c.env.DB.prepare(`SELECT id, apelido, cor, CASE WHEN semana = ? THEN xp_semana ELSE 0 END AS xp,
    (SELECT COUNT(*) FROM cartas WHERE crianca_id = criancas.id AND qtd > 0) AS cartas,
    (SELECT COUNT(*) FROM duelos d WHERE d.turma_id = criancas.turma_id AND d.status = 'feito' AND d.resolvido >= ?
      AND ((d.vencedor = 'de' AND d.de_id = criancas.id) OR (d.vencedor = 'para' AND d.para_id = criancas.id))) AS vitorias,
    ((SELECT mostrar_online FROM turmas WHERE id = criancas.turma_id) = 1 AND mostrar_online = 1 AND ativo > ? AND id != ?) AS online
    FROM criancas WHERE turma_id = ?`).bind(semanaDe(), inicioSemana, Date.now() - ONLINE_MS, k.id, k.turma_id).all();
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

/* ---------------- Duelo do Saber ---------------- */
// Os dois respondem as mesmas 10 perguntas (cada um quando puder). O servidor corrige e decide quem venceu.
// Ninguém perde carta. Só colegas da mesma turma, sem mensagem nenhuma entre eles.

interface Duelo {
  id: string; turma_id: string; de_id: string; para_id: string; perguntas: string; carta_de: string; carta_para: string | null;
  resp_de: string | null; resp_para: string | null; acertos_de: number | null; acertos_para: number | null;
  jogou_de: number | null; jogou_para: number | null; status: string; vencedor: string | null; criado: number; resolvido: number | null;
}

/** O que a criança pode ver do duelo: as respostas e os acertos do colega só aparecem depois que ela também jogou. */
function dueloParaCrianca(d: Duelo & { de_apelido?: string; de_cor?: string; para_apelido?: string; para_cor?: string }, eu: string) {
  const fim = d.status === 'feito';
  const souDe = d.de_id === eu;
  const ler = (s: string | null) => (s ? JSON.parse(s) as number[] : null);
  return {
    id: d.id, status: d.status, criado: d.criado, resolvido: d.resolvido, vencedor: d.vencedor,
    de_id: d.de_id, para_id: d.para_id, de_apelido: d.de_apelido, de_cor: d.de_cor, para_apelido: d.para_apelido, para_cor: d.para_cor,
    perguntas: JSON.parse(d.perguntas) as string[], carta_de: d.carta_de, carta_para: d.carta_para,
    resp_de: souDe || fim ? ler(d.resp_de) : null, resp_para: !souDe || fim ? ler(d.resp_para) : null,
    acertos_de: souDe || fim ? d.acertos_de : null, acertos_para: !souDe || fim ? d.acertos_para : null,
  };
}

async function temCarta(db: D1Database, criancaId: string, carta: string) {
  if (!CARTAS_VALIDAS.has(carta)) return false;
  const r = await db.prepare('SELECT qtd FROM cartas WHERE crianca_id = ? AND carta_id = ?').bind(criancaId, carta).first<{ qtd: number }>();
  return (r?.qtd ?? 0) > 0;
}

/** Quantos duelos a criança já jogou hoje (horário de Brasília). Só os 3 primeiros do dia dão XP. */
async function duelosDeHoje(db: D1Database, criancaId: string) {
  const inicio = Date.parse(`${diaBrasilia(Date.now())}T03:00:00Z`);
  const r = await db.prepare(`SELECT COUNT(*) n FROM duelos WHERE (de_id = ?1 AND jogou_de >= ?2) OR (para_id = ?1 AND jogou_para >= ?2)`)
    .bind(criancaId, inicio).first<{ n: number }>();
  return r?.n ?? 0;
}

async function buscarDuelo(db: D1Database, id: string) {
  return db.prepare(`SELECT d.*, de.apelido AS de_apelido, de.cor AS de_cor, pa.apelido AS para_apelido, pa.cor AS para_cor
    FROM duelos d LEFT JOIN criancas de ON de.id = d.de_id LEFT JOIN criancas pa ON pa.id = d.para_id WHERE d.id = ?`).bind(id).first<Duelo>();
}

app.get('/crianca/duelos', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  if (!temTurma(k.turma_id)) return erro(c, 403, SEM_TURMA_MSG);
  const db = c.env.DB;
  const agora = Date.now();
  // Desafios velhos vencem sozinhos: sem resposta em 7 dias, ou que quem desafiou nem chegou a jogar (1 dia).
  await db.batch([
    db.prepare(`UPDATE duelos SET status = 'expirado', resolvido = ? WHERE status = 'esperando' AND criado < ? AND (de_id = ?3 OR para_id = ?3)`).bind(agora, agora - VALIDADE_DUELO_MS, k.id),
    db.prepare(`UPDATE duelos SET status = 'cancelado', resolvido = ? WHERE status = 'novo' AND criado < ? AND de_id = ?`).bind(agora, agora - DIA, k.id),
  ]);
  const r = await db.prepare(`SELECT d.*, de.apelido AS de_apelido, de.cor AS de_cor, pa.apelido AS para_apelido, pa.cor AS para_cor
    FROM duelos d LEFT JOIN criancas de ON de.id = d.de_id LEFT JOIN criancas pa ON pa.id = d.para_id
    WHERE d.turma_id = ?1 AND ((d.de_id = ?2 AND d.status IN ('novo', 'esperando')) OR (d.para_id = ?2 AND d.status = 'esperando')
      OR ((d.de_id = ?2 OR d.para_id = ?2) AND d.resolvido > ?3))
    ORDER BY d.criado DESC LIMIT 40`).bind(k.turma_id, k.id, agora - VALIDADE_DUELO_MS).all<Duelo>();
  return c.json({ eu: k.id, duelos: r.results.map((d) => dueloParaCrianca(d, k.id)), comXpHoje: Math.max(0, DUELOS_COM_XP_POR_DIA - await duelosDeHoje(db, k.id)) });
});

/** Cria um desafio. Quem desafia joga primeiro; o colega só vê o desafio depois disso. */
app.post('/crianca/duelos', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  if (!temTurma(k.turma_id)) return erro(c, 403, SEM_TURMA_MSG);
  const b = await corpo(c);
  const para = String(b.para ?? ''), carta = String(b.carta ?? '');
  const db = c.env.DB;
  if (para === k.id) return erro(c, 400, 'Escolha um colega.');
  const colega = await db.prepare('SELECT id, progresso FROM criancas WHERE id = ? AND turma_id = ?').bind(para, k.turma_id).first<{ id: string; progresso: string }>();
  if (!colega) return erro(c, 404, 'Colega não encontrado.');
  if (!await temCarta(db, k.id, carta)) return erro(c, 409, 'Escolha um Sabimon do seu álbum.');
  const pend = await db.prepare(`SELECT COUNT(*) n FROM duelos WHERE de_id = ? AND status IN ('novo', 'esperando')`).bind(k.id).first<{ n: number }>();
  if ((pend?.n ?? 0) >= MAX_DESAFIOS_ESPERANDO) return erro(c, 429, `Você já tem ${MAX_DESAFIOS_ESPERANDO} desafios esperando. Espere seus colegas jogarem.`);
  const ja = await db.prepare(`SELECT 1 FROM duelos WHERE status IN ('novo', 'esperando') AND ((de_id = ?1 AND para_id = ?2) OR (de_id = ?2 AND para_id = ?1))`).bind(k.id, para).first();
  if (ja) return erro(c, 409, 'Vocês dois já têm um duelo esperando. Terminem esse primeiro!');
  const meu = sanitizar(JSON.parse(k.progresso), FASES_VALIDAS);
  const dele = sanitizar(JSON.parse(colega.progresso), FASES_VALIDAS);
  const comum = mundosEmComum(capitulos, meu.feitas, dele.feitas);
  if (!comum.length) return erro(c, 409, 'Vocês ainda não estudaram um mesmo mundo. Para duelar, os dois precisam ter ouvido os temas do mesmo mundo.');
  const id = aleatorio(8);
  const perguntas = montarDuelo(comum);
  await db.prepare(`INSERT INTO duelos (id, turma_id, de_id, para_id, perguntas, carta_de, status, criado) VALUES (?, ?, ?, ?, ?, ?, 'novo', ?)`)
    .bind(id, k.turma_id, k.id, para, JSON.stringify(perguntas), carta, Date.now()).run();
  const d = await buscarDuelo(db, id);
  return c.json({ duelo: dueloParaCrianca(d!, k.id) });
});

/** Manda as respostas. Quem desafiou: o desafio vai para o colega. O colega: o servidor decide quem venceu. */
app.post('/crianca/duelos/:id/responder', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  const db = c.env.DB;
  const d = await buscarDuelo(db, c.req.param('id'));
  if (!d || d.turma_id !== k.turma_id || (d.de_id !== k.id && d.para_id !== k.id)) return erro(c, 404, 'Duelo não encontrado.');
  const b = await corpo(c);
  const perguntas = JSON.parse(d.perguntas) as string[];
  const acertos = corrigir(perguntas, b.respostas, capitulos);
  if (acertos === null) return erro(c, 400, 'Respostas inválidas.');
  const respostas = JSON.stringify(b.respostas);
  const agora = Date.now();
  const valeXp = await duelosDeHoje(db, k.id) < DUELOS_COM_XP_POR_DIA;
  let res;
  if (d.de_id === k.id) {
    if (d.status !== 'novo') return erro(c, 409, 'Você já jogou este duelo.');
    res = await db.prepare(`UPDATE duelos SET resp_de = ?, acertos_de = ?, jogou_de = ?, status = 'esperando' WHERE id = ? AND status = 'novo'`)
      .bind(respostas, acertos, agora, d.id).run();
  } else {
    if (d.status === 'novo') return erro(c, 409, 'Ainda não é a sua vez neste duelo.');
    if (d.status !== 'esperando') return erro(c, 409, 'Esse duelo não está mais esperando você.');
    const carta = String(b.carta ?? '');
    if (!await temCarta(db, k.id, carta)) return erro(c, 409, 'Escolha um Sabimon do seu álbum.');
    const vencedor = vencedorDe(d.acertos_de ?? 0, acertos);
    res = await db.prepare(`UPDATE duelos SET carta_para = ?, resp_para = ?, acertos_para = ?, jogou_para = ?, status = 'feito', vencedor = ?, resolvido = ?
      WHERE id = ? AND status = 'esperando'`).bind(carta, respostas, acertos, agora, vencedor, agora, d.id).run();
  }
  if (res.meta.changes !== 1) return erro(c, 409, 'Esse duelo mudou. Abra de novo.');
  return c.json({ duelo: dueloParaCrianca((await buscarDuelo(db, d.id))!, k.id), acertos, valeXp });
});

app.post('/crianca/duelos/:id/:acao', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  const acao = c.req.param('acao');
  if (acao !== 'recusar' && acao !== 'cancelar') return erro(c, 400, 'Ação inválida.');
  const d = await buscarDuelo(c.env.DB, c.req.param('id'));
  if (!d || (acao === 'recusar' ? d.para_id : d.de_id) !== k.id) return erro(c, 404, 'Duelo não encontrado.');
  const r = await c.env.DB.prepare(`UPDATE duelos SET status = ?, resolvido = ? WHERE id = ? AND status IN (${acao === 'recusar' ? `'esperando'` : `'novo', 'esperando'`})`)
    .bind(acao === 'recusar' ? 'recusado' : 'cancelado', Date.now(), d.id).run();
  if (r.meta.changes !== 1) return erro(c, 409, 'Esse duelo não está mais esperando.');
  return c.json({ ok: true });
});

/* ============================ Adultos ============================ */

interface Adulto { id: string; nome: string; email: string; senha_hash: string; senha_sal: string; falhas: number; bloqueado_ate: number; aceite_versao: string; tem_senha: number }

/** Versão da política de privacidade aceita no cadastro (mudar quando o texto mudar). */
const VERSAO_PRIVACIDADE = '2026-11-duelo';
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
  const sql = `SELECT t.id, t.nome, t.codigo, t.criado, d.nome AS dono, t.dono_id = ?1 AS sou_dono, (SELECT COUNT(*) FROM criancas WHERE turma_id = t.id) AS criancas
    FROM turmas t JOIN adultos d ON d.id = t.dono_id
    ${a.admin ? '' : 'WHERE t.dono_id = ?1 OR EXISTS (SELECT 1 FROM turma_admins WHERE turma_id = t.id AND adulto_id = ?1)'} ORDER BY t.criado DESC`;
  const r = await c.env.DB.prepare(sql).bind(a.id).all();
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
    const id = aleatorio(8), codigo = await codigoLivre(c.env.DB);
    if (!codigo) continue;
    try {
      await c.env.DB.prepare('INSERT INTO turmas (id, codigo, nome, dono_id, criado) VALUES (?, ?, ?, ?, ?)').bind(id, codigo, nome, a.id, Date.now()).run();
      return c.json({ turma: { id, nome, codigo } });
    } catch (e) { if (!String(e).includes('UNIQUE')) throw e; }
  }
  return erro(c, 409, 'Não consegui gerar um código. Tente de novo.');
});

/** A turma, se o adulto é o dono, um administrador convidado ou o administrador geral. `dono` diz se pode mexer nos administradores. */
async function turmaDoAdulto(c: C, a: { id: string; admin: boolean }) {
  const t = await c.env.DB.prepare(`SELECT id, nome, codigo, dono_id FROM turmas WHERE id = ?1 AND (?2 = 1 OR dono_id = ?3
      OR EXISTS (SELECT 1 FROM turma_admins WHERE turma_id = turmas.id AND adulto_id = ?3))`)
    .bind(c.req.param('id'), a.admin ? 1 : 0, a.id).first<{ id: string; nome: string; codigo: string; dono_id: string }>();
  return t ? { id: t.id, nome: t.nome, codigo: t.codigo, dono: t.dono_id === a.id || a.admin } : null;
}

app.get('/adulto/turmas/:id', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const t = await turmaDoAdulto(c, a);
  if (!t) return erro(c, 404, 'Turma não encontrada.');
  const r = await c.env.DB.prepare(`SELECT id, apelido, cor, criado, visto, bloqueado_ate, familia_id IS NOT NULL AS familia, CASE WHEN semana = ? THEN xp_semana ELSE 0 END AS xp_semana,
    json_extract(progresso, '$.xp') AS xp, (SELECT COUNT(*) FROM cartas WHERE crianca_id = criancas.id AND qtd > 0) AS cartas,
    chat_ok, mudo_ate, (ativo > ?) AS online
    FROM criancas WHERE turma_id = ? ORDER BY apelido_chave`).bind(semanaDe(), Date.now() - ONLINE_MS, t.id).all();
  const avisos = await c.env.DB.prepare('SELECT COUNT(DISTINCT mensagem_id) n FROM avisos_chat WHERE turma_id = ? AND resolvido = 0').bind(t.id).first<{ n: number }>();
  return c.json({ turma: t, chat: await turmaChat(c.env.DB, t.id), avisos: avisos?.n ?? 0, criancas: r.results, provas: await datasDe(c.env.DB, [t.id]) });
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
    k.chat_ok, k.mostrar_online, t.chat AS turma_chat,
    json_extract(k.progresso, '$.xp') AS xp, (SELECT COUNT(*) FROM cartas WHERE crianca_id = k.id AND qtd > 0) AS cartas
    FROM criancas k LEFT JOIN turmas t ON t.id = k.turma_id WHERE k.familia_id = ? ORDER BY k.criado`).bind(a.id).all();
  return c.json({ filhos: r.results, provas: await datasDe(c.env.DB, [turmaDaFamilia(a.id)]), codigo: await codigoDaFamilia(c.env.DB, a.id) });
});

/** Troca o código da família (se ele foi parar com quem não devia). Quem já entrou continua entrando. */
app.post('/adulto/familia/codigo', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const codigo = await codigoDaFamilia(c.env.DB, a.id, true);
  if (!codigo) return erro(c, 409, 'Não consegui gerar um código. Tente de novo.');
  return c.json({ codigo });
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
  const progresso = comBoasVindas(mesclar(progressoVazio(), sanitizar(b.progresso, FASES_VALIDAS)));
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO criancas (id, turma_id, familia_id, apelido, apelido_chave, cor, pin_hash, pin_sal, progresso, xp_semana, semana, criado, visto)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`)
        .bind(id, turmaDaFamilia(a.id), a.id, apelido, chaveApelido(apelido), cor, await hashSegredo(b.pin as string, sal), sal, JSON.stringify(progresso), semanaDe(), Date.now(), Date.now()),
      ...upsertCartas(c.env.DB, id, limitarCartas(sanitizarDelta(b.cartas, IDS_CARTAS), progresso.abertos.length)),
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
  // Turma com outro administrador passa para ele (o mais antigo) em vez de sumir.
  const minhas = (await db.prepare(`SELECT t.id, (SELECT adulto_id FROM turma_admins WHERE turma_id = t.id AND adulto_id != ?1 ORDER BY criado LIMIT 1) AS herdeiro
    FROM turmas t WHERE t.dono_id = ?1`).bind(a.id).all<{ id: string; herdeiro: string | null }>()).results;
  const passar = minhas.filter((t) => t.herdeiro);
  const turmas = minhas.filter((t) => !t.herdeiro).map((t) => t.id);
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
    ...turmas.flatMap((t) => [db.prepare('DELETE FROM mensagens WHERE turma_id = ?').bind(t), db.prepare('DELETE FROM avisos_chat WHERE turma_id = ?').bind(t)]),
    ...[...turmas, turmaDaFamilia(a.id)].map((t) => db.prepare('DELETE FROM datas_prova WHERE turma_id = ?').bind(t)),
    ...passar.flatMap((t) => [
      db.prepare('UPDATE turmas SET dono_id = ? WHERE id = ?').bind(t.herdeiro, t.id),
      db.prepare('DELETE FROM turma_admins WHERE turma_id = ? AND adulto_id = ?').bind(t.id, t.herdeiro),
    ]),
    ...turmas.flatMap((t) => [db.prepare('DELETE FROM turma_admins WHERE turma_id = ?').bind(t), db.prepare('DELETE FROM convites_admin WHERE turma_id = ?').bind(t)]),
    db.prepare('DELETE FROM turma_admins WHERE adulto_id = ?').bind(a.id),
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


/* ============================ Chat da turma ============================ */
// Decisão do Lucas (04/11/2026): chat escrito só no grupo da turma. Pais e professor leem tudo.
// Para a criança escrever: o professor ligou o chat da turma, o responsável autorizou,
// está no horário e ela não está silenciada. Mensagens somem depois de 60 dias.

interface TurmaChat { id: string; nome: string; chat: number; chat_inicio: number; chat_fim: number; mostrar_online: number }
interface Mensagem { id: string; crianca_id: string; apelido: string | null; cor: string | null; texto: string; criado: number; apagada: number }

const turmaChat = (db: D1Database, id: string) =>
  db.prepare('SELECT id, nome, chat, chat_inicio, chat_fim, mostrar_online FROM turmas WHERE id = ?').bind(id).first<TurmaChat>();

/** Por que a criança não pode escrever agora (ou null se pode). */
function bloqueioChat(t: TurmaChat | null, k: Crianca): { motivo: string; texto: string } | null {
  if (!t) return { motivo: 'sem-turma', texto: 'Entre numa turma para conversar com os colegas.' };
  if (!t.chat) return { motivo: 'desligado', texto: 'O chat da turma ainda não foi ligado pelo professor ou pelos adultos da turma.' };
  if (!k.familia_id) return { motivo: 'sem-familia', texto: 'Para usar o chat, peça para seu responsável criar a conta da família no Sabidex e liberar o chat para você.' };
  if (!k.chat_ok) return { motivo: 'sem-autorizacao', texto: 'Peça para seu responsável liberar o chat na área dos adultos.' };
  if (k.mudo_ate > Date.now()) return { motivo: 'silenciado', texto: 'Um adulto da turma pausou suas mensagens por um tempo. Você ainda pode ler.' };
  if (!dentroDoHorario(t.chat_inicio, t.chat_fim)) return { motivo: 'horario', texto: `O chat abre das ${t.chat_inicio}h às ${t.chat_fim}h.` };
  return null;
}

const limparVelhas = (db: D1Database, turmaId: string) => {
  const limite = Date.now() - GUARDAR_DIAS * DIA;
  return db.batch([
    db.prepare('DELETE FROM mensagens WHERE turma_id = ? AND criado < ?').bind(turmaId, limite),
    db.prepare('DELETE FROM avisos_chat WHERE turma_id = ? AND criado < ?').bind(turmaId, limite),
  ]);
};

async function mensagensDa(db: D1Database, turmaId: string, opcoes: { depois?: number; limite: number; comApagadas: boolean }) {
  const r = await db.prepare(`SELECT m.id, m.crianca_id, k.apelido, k.cor, m.texto, m.criado, m.apagada FROM mensagens m LEFT JOIN criancas k ON k.id = m.crianca_id
    WHERE m.turma_id = ? AND m.criado > ? ${opcoes.comApagadas ? '' : 'AND m.apagada = 0'} ORDER BY m.criado DESC LIMIT ?`)
    .bind(turmaId, opcoes.depois ?? 0, opcoes.limite).all<Mensagem>();
  return r.results.reverse();
}

/** A criança lê o chat (as últimas 60 mensagens, ou só as novas depois de `depois`). */
app.get('/crianca/chat', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  if (!temTurma(k.turma_id)) return c.json({ liberado: false, motivo: 'sem-turma', aviso: 'Entre numa turma para conversar com os colegas.', mensagens: [], online: [] });
  const t = await turmaChat(c.env.DB, k.turma_id);
  // Sem chat ligado ou sem autorização, a criança não lê nada (nem as mensagens dos colegas).
  const b = bloqueioChat(t, k);
  if (b && ['desligado', 'sem-familia', 'sem-autorizacao'].includes(b.motivo)) return c.json({ liberado: false, motivo: b.motivo, aviso: b.texto, mensagens: [], online: [] });
  const depois = Number(c.req.query('depois') ?? 0) || 0;
  const mensagens = (await mensagensDa(c.env.DB, k.turma_id, { depois, limite: 60, comApagadas: false }))
    .map((m) => ({ id: m.id, de: m.crianca_id, apelido: m.apelido ?? 'Colega', cor: m.cor ?? '#94A3B8', texto: m.texto, criado: m.criado, minha: m.crianca_id === k.id }));
  const online = t?.mostrar_online
    ? (await c.env.DB.prepare('SELECT apelido, cor FROM criancas WHERE turma_id = ? AND id != ? AND mostrar_online = 1 AND ativo > ? ORDER BY apelido_chave')
      .bind(k.turma_id, k.id, Date.now() - ONLINE_MS).all<{ apelido: string; cor: string }>()).results
    : [];
  return c.json({ liberado: !b, motivo: b?.motivo ?? null, aviso: b?.texto ?? null, horario: t ? { inicio: t.chat_inicio, fim: t.chat_fim } : null, mensagens, online });
});

app.post('/crianca/chat', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  const t = temTurma(k.turma_id) ? await turmaChat(c.env.DB, k.turma_id) : null;
  const b = bloqueioChat(t, k);
  if (b) return erro(c, 403, b.texto);
  const conf = conferirMensagem(String((await corpo(c)).texto ?? ''));
  if (!conf.ok) return erro(c, 400, MOTIVO_CHAT[conf.motivo]);
  const db = c.env.DB;
  const recentes = await db.prepare('SELECT COUNT(*) n FROM mensagens WHERE crianca_id = ? AND criado > ?').bind(k.id, Date.now() - JANELA_LIMITE).first<{ n: number }>();
  if ((recentes?.n ?? 0) >= LIMITE_MENSAGENS) return erro(c, 429, 'Calma! Espere um pouquinho antes de mandar mais mensagens.');
  const m = { id: aleatorio(10), criado: Date.now() };
  await db.prepare('INSERT INTO mensagens (id, turma_id, crianca_id, texto, criado) VALUES (?, ?, ?, ?, ?)').bind(m.id, t!.id, k.id, conf.texto, m.criado).run();
  if (Math.random() < 0.05) await limparVelhas(db, t!.id);
  return c.json({ id: m.id, de: k.id, apelido: k.apelido, cor: k.cor, texto: conf.texto, criado: m.criado, minha: true });
});

/** "Avisar um adulto" sobre uma mensagem (vai para os administradores da turma). */
app.post('/crianca/chat/:mid/avisar', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  const m = await c.env.DB.prepare('SELECT id, turma_id, crianca_id FROM mensagens WHERE id = ? AND turma_id = ?').bind(c.req.param('mid'), k.turma_id).first<{ id: string; turma_id: string; crianca_id: string }>();
  if (!m) return erro(c, 404, 'Mensagem não encontrada.');
  if (m.crianca_id === k.id) return erro(c, 400, 'Essa mensagem é sua.');
  await c.env.DB.prepare('INSERT OR IGNORE INTO avisos_chat (id, turma_id, mensagem_id, por_id, criado) VALUES (?, ?, ?, ?, ?)')
    .bind(aleatorio(10), m.turma_id, m.id, k.id, Date.now()).run();
  return c.json({ ok: true });
});

/** O app avisa que a criança está com ele aberto (para o "estudando agora"). */
app.post('/crianca/ping', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  return c.json({ ok: true });
});

/* ---- Professor ---- */

/** Liga/desliga o chat, escolhe o horário e o "estudando agora" da turma. */
app.post('/adulto/turmas/:id/chat', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const t = await turmaDoAdulto(c, a);
  if (!t) return erro(c, 404, 'Turma não encontrada.');
  const b = await corpo(c);
  const atual = (await turmaChat(c.env.DB, t.id))!;
  const hora = (v: unknown, padrao: number) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 24 ? (v as number) : padrao);
  const novo = {
    chat: typeof b.chat === 'boolean' ? Number(b.chat) : atual.chat,
    inicio: hora(b.inicio, atual.chat_inicio),
    fim: hora(b.fim, atual.chat_fim),
    online: typeof b.online === 'boolean' ? Number(b.online) : atual.mostrar_online,
  };
  if (novo.inicio === novo.fim) return erro(c, 400, 'O chat precisa abrir e fechar em horas diferentes.');
  await c.env.DB.prepare('UPDATE turmas SET chat = ?, chat_inicio = ?, chat_fim = ?, mostrar_online = ? WHERE id = ?').bind(novo.chat, novo.inicio, novo.fim, novo.online, t.id).run();
  return c.json({ chat: (await turmaChat(c.env.DB, t.id))! });
});

/** O professor lê tudo (inclusive o que foi apagado) e vê os avisos das crianças. */
app.get('/adulto/turmas/:id/chat', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const t = await turmaDoAdulto(c, a);
  if (!t) return erro(c, 404, 'Turma não encontrada.');
  await limparVelhas(c.env.DB, t.id);
  const mensagens = await mensagensDa(c.env.DB, t.id, { limite: 500, comApagadas: true });
  const avisos = (await c.env.DB.prepare(`SELECT v.id, v.mensagem_id, v.criado, k.apelido AS por FROM avisos_chat v LEFT JOIN criancas k ON k.id = v.por_id
    WHERE v.turma_id = ? AND v.resolvido = 0 ORDER BY v.criado`).bind(t.id).all()).results;
  return c.json({ mensagens, avisos });
});

app.post('/adulto/turmas/:id/chat/:mid/apagar', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const t = await turmaDoAdulto(c, a);
  if (!t) return erro(c, 404, 'Turma não encontrada.');
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE mensagens SET apagada = 1 WHERE id = ? AND turma_id = ?').bind(c.req.param('mid'), t.id),
    c.env.DB.prepare('UPDATE avisos_chat SET resolvido = 1 WHERE mensagem_id = ? AND turma_id = ?').bind(c.req.param('mid'), t.id),
  ]);
  return c.json({ ok: true });
});

/** Marca os avisos de uma mensagem como vistos (sem apagar a mensagem). */
app.post('/adulto/turmas/:id/chat/:mid/ok', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const t = await turmaDoAdulto(c, a);
  if (!t) return erro(c, 404, 'Turma não encontrada.');
  await c.env.DB.prepare('UPDATE avisos_chat SET resolvido = 1 WHERE mensagem_id = ? AND turma_id = ?').bind(c.req.param('mid'), t.id).run();
  return c.json({ ok: true });
});

/** Pausa as mensagens de uma criança (horas = 0 tira a pausa). Ela continua lendo. */
app.post('/adulto/turmas/:id/criancas/:cid/silenciar', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const t = await turmaDoAdulto(c, a);
  if (!t) return erro(c, 404, 'Turma não encontrada.');
  const horas = Number((await corpo(c)).horas ?? 24);
  if (![0, 1, 24, 168].includes(horas)) return erro(c, 400, 'Tempo inválido.');
  const ate = horas ? Date.now() + horas * 3600_000 : 0;
  const r = await c.env.DB.prepare('UPDATE criancas SET mudo_ate = ? WHERE id = ? AND turma_id = ?').bind(ate, c.req.param('cid'), t.id).run();
  if (!r.meta.changes) return erro(c, 404, 'Criança não encontrada.');
  return c.json({ mudo_ate: ate });
});

/* ---- Responsável ---- */

/** Autoriza (ou não) o filho a usar o chat, e a aparecer como "estudando agora". */
app.post('/adulto/familia/:cid/chat', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const k = await doAdulto(c, a.id);
  if (!k) return erro(c, 404, 'Criança não encontrada.');
  const b = await corpo(c);
  const chatOk = typeof b.chat === 'boolean' ? Number(b.chat) : k.chat_ok;
  const online = typeof b.online === 'boolean' ? Number(b.online) : k.mostrar_online;
  await c.env.DB.prepare('UPDATE criancas SET chat_ok = ?, mostrar_online = ? WHERE id = ?').bind(chatOk, online, k.id).run();
  return c.json({ chat_ok: chatOk, mostrar_online: online });
});

/** O responsável lê a conversa da turma do filho (as mensagens dele aparecem destacadas). */
app.get('/adulto/familia/:cid/chat', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const k = await doAdulto(c, a.id);
  if (!k) return erro(c, 404, 'Criança não encontrada.');
  if (!temTurma(k.turma_id)) return c.json({ turma: null, mensagens: [] });
  const t = await turmaChat(c.env.DB, k.turma_id);
  const mensagens = (await mensagensDa(c.env.DB, k.turma_id, { limite: 500, comApagadas: true })).map((m) => ({ ...m, doFilho: m.crianca_id === k.id }));
  return c.json({ turma: t ? { nome: t.nome, chat: t.chat, inicio: t.chat_inicio, fim: t.chat_fim } : null, mensagens });
});


/* ============================ Administradores da turma ============================ */
// O dono (quem criou) convida outros adultos com um código. Eles podem quase tudo na turma;
// só o dono convida e remove administradores.

const LETRAS_CONVITE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function codigoConvite() {
  const b = crypto.getRandomValues(new Uint8Array(8));
  const x = [...b].map((n) => LETRAS_CONVITE[n % LETRAS_CONVITE.length]).join('');
  return `ADM-${x.slice(0, 4)}-${x.slice(4)}`;
}
const normalizarConvite = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^ADM(?=.{8}$)/, '');

app.get('/adulto/turmas/:id/admins', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const t = await turmaDoAdulto(c, a);
  if (!t) return erro(c, 404, 'Turma não encontrada.');
  const r = await c.env.DB.prepare(`SELECT d.id, d.nome, 1 AS dono FROM turmas t JOIN adultos d ON d.id = t.dono_id WHERE t.id = ?1
    UNION ALL SELECT d.id, d.nome, 0 AS dono FROM turma_admins x JOIN adultos d ON d.id = x.adulto_id WHERE x.turma_id = ?1`).bind(t.id).all();
  return c.json({ admins: r.results, eu: a.id, souDono: t.dono });
});

/** O dono gera um código de convite (vale 7 dias, uma vez só). */
app.post('/adulto/turmas/:id/convite', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const t = await turmaDoAdulto(c, a);
  if (!t) return erro(c, 404, 'Turma não encontrada.');
  if (!t.dono) return erro(c, 403, 'Só quem criou a turma pode convidar administradores.');
  const db = c.env.DB;
  await db.prepare('DELETE FROM convites_admin WHERE expira < ? OR usado = 1').bind(Date.now()).run();
  const ativos = await db.prepare('SELECT COUNT(*) n FROM convites_admin WHERE turma_id = ?').bind(t.id).first<{ n: number }>();
  if ((ativos?.n ?? 0) >= 5) return erro(c, 429, 'Já tem 5 convites esperando. Espere usarem ou vencerem (7 dias).');
  const codigo = codigoConvite();
  const expira = Date.now() + 7 * DIA;
  await db.prepare('INSERT INTO convites_admin (codigo_hash, turma_id, criado, expira) VALUES (?, ?, ?, ?)').bind(await sha256(normalizarConvite(codigo)), t.id, Date.now(), expira).run();
  return c.json({ codigo, expira });
});

/** Um adulto usa o código e vira administrador da turma. */
app.post('/adulto/convite', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const db = c.env.DB;
  const h = await sha256(normalizarConvite(String((await corpo(c)).codigo ?? '')));
  const v = await db.prepare('SELECT turma_id, expira, usado FROM convites_admin WHERE codigo_hash = ?').bind(h).first<{ turma_id: string; expira: number; usado: number }>();
  if (!v || v.usado || v.expira < Date.now()) return erro(c, 404, 'Esse convite não vale (já foi usado ou passou de 7 dias). Peça um novo para quem criou a turma.');
  const t = await db.prepare('SELECT id, nome, dono_id FROM turmas WHERE id = ?').bind(v.turma_id).first<{ id: string; nome: string; dono_id: string }>();
  if (!t) return erro(c, 404, 'Essa turma não existe mais.');
  if (t.dono_id === a.id) return erro(c, 409, 'Você já é o dono dessa turma.');
  const usar = await db.prepare('UPDATE convites_admin SET usado = 1 WHERE codigo_hash = ? AND usado = 0').bind(h).run();
  if (!usar.meta.changes) return erro(c, 404, 'Esse convite já foi usado.');
  await db.prepare('INSERT OR IGNORE INTO turma_admins (turma_id, adulto_id, criado) VALUES (?, ?, ?)').bind(t.id, a.id, Date.now()).run();
  return c.json({ turma: { id: t.id, nome: t.nome } });
});

/** O dono remove um administrador, ou o próprio administrador sai. */
app.delete('/adulto/turmas/:id/admins/:aid', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const t = await turmaDoAdulto(c, a);
  if (!t) return erro(c, 404, 'Turma não encontrada.');
  const aid = c.req.param('aid');
  if (!t.dono && aid !== a.id) return erro(c, 403, 'Só quem criou a turma pode remover administradores.');
  const r = await c.env.DB.prepare('DELETE FROM turma_admins WHERE turma_id = ? AND adulto_id = ?').bind(t.id, aid).run();
  if (!r.meta.changes) return erro(c, 404, 'Administrador não encontrado.');
  return c.json({ ok: true });
});

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
