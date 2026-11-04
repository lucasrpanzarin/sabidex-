// Servidor do Sabidex: turmas, contas das crianças (PIN), sincronização, trocas e ranking.
// Roda na Cloudflare (Worker + banco D1). Tudo fora de /api/* é o app (arquivos estáticos).

import { Hono, type Context } from 'hono';
import { capitulos, todasCartas } from '../data';
import { FASES, chaveExtra, extrasDo } from '../lib/jogo';
import {
  gerarCodigo, mesclar, normalizarApelido, normalizarCodigo, pinValido, progressoVazio,
  sanitizar, sanitizarDelta, semanaDe, type ProgressoSync,
} from '../shared/sync';
import { ESQUEMA } from './esquema';
import { aleatorio, hashSegredo, iguais, pinAleatorio, sha256 } from './seguranca';

interface Env { DB: D1Database; ASSETS: Fetcher; ADMIN_EMAILS?: string }
type C = Context<{ Bindings: Env }>;

const DIA = 86_400_000;
const FASES_VALIDAS = new Set(capitulos.flatMap((c) => [...FASES.map((f) => `${c.id}:${f}`), ...extrasDo(c).map((x) => chaveExtra(c.id, x))]));
const CARTAS_VALIDAS = new Set(todasCartas.map((c) => c.id));
const COR = /^#[0-9A-Fa-f]{6}$/;
const MAX_FALHAS = 5;
const BLOQUEIO_MS = 15 * 60_000;

const chaveApelido = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const erro = (c: C, status: 400 | 401 | 403 | 404 | 409 | 423 | 429, mensagem: string) => c.json({ erro: mensagem }, status);

let esquemaPronto = false;
const app = new Hono<{ Bindings: Env }>().basePath('/api');

app.use('*', async (c, next) => {
  if (!esquemaPronto) {
    await c.env.DB.batch(ESQUEMA.map((s) => c.env.DB.prepare(s)));
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
}

async function cartasDe(db: D1Database, id: string) {
  const r = await db.prepare('SELECT carta_id, qtd FROM cartas WHERE crianca_id = ? AND qtd > 0').bind(id).all<{ carta_id: string; qtd: number }>();
  return Object.fromEntries(r.results.map((x) => [x.carta_id, x.qtd]));
}

function upsertCartas(db: D1Database, id: string, delta: Record<string, number>) {
  return Object.entries(delta).map(([carta, n]) =>
    db.prepare('INSERT INTO cartas (crianca_id, carta_id, qtd) VALUES (?, ?, ?) ON CONFLICT (crianca_id, carta_id) DO UPDATE SET qtd = qtd + excluded.qtd')
      .bind(id, carta, n));
}

async function respostaConta(db: D1Database, k: Crianca, progresso: ProgressoSync) {
  const turma = await db.prepare('SELECT nome, codigo FROM turmas WHERE id = ?').bind(k.turma_id).first<{ nome: string; codigo: string }>();
  return {
    conta: { id: k.id, apelido: k.apelido, cor: k.cor, turma: turma?.nome ?? '', codigo: turma?.codigo ?? '' },
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
  const total = await c.env.DB.prepare('SELECT COUNT(*) n FROM criancas WHERE turma_id = ?').bind(t.id).first<{ n: number }>();
  if ((total?.n ?? 0) >= 60) return erro(c, 409, 'Essa turma já está cheia.');

  const id = aleatorio(8);
  const sal = aleatorio(16);
  const progresso = mesclar(progressoVazio(), sanitizar(b.progresso, FASES_VALIDAS));
  const semana = semanaDe();
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO criancas (id, turma_id, apelido, apelido_chave, cor, pin_hash, pin_sal, progresso, xp_semana, semana, criado, visto)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`)
        .bind(id, t.id, apelido, chaveApelido(apelido), cor, await hashSegredo(b.pin as string, sal), sal, JSON.stringify(progresso), semana, Date.now(), Date.now()),
      ...upsertCartas(c.env.DB, id, sanitizarDelta(b.cartas, CARTAS_VALIDAS)),
    ]);
  } catch (e) {
    if (String(e).includes('UNIQUE')) return erro(c, 409, 'Já tem alguém com esse apelido na turma. Escolha outro, ou entre com o seu PIN se a conta for sua.');
    throw e;
  }
  const k = await c.env.DB.prepare('SELECT * FROM criancas WHERE id = ?').bind(id).first<Crianca>();
  return c.json({ token: await novaSessao(c.env.DB, 'crianca', id), ...(await respostaConta(c.env.DB, k!, progresso)) });
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
  if (k.bloqueado_ate > Date.now()) return erro(c, 423, 'Muitas tentativas erradas. Espere 15 minutos ou peça para um adulto trocar seu PIN.');
  if (!iguais(await hashSegredo(b.pin as string, k.pin_sal), k.pin_hash)) {
    const falhas = k.falhas + 1;
    await c.env.DB.prepare('UPDATE criancas SET falhas = ?, bloqueado_ate = ? WHERE id = ?')
      .bind(falhas >= MAX_FALHAS ? 0 : falhas, falhas >= MAX_FALHAS ? Date.now() + BLOQUEIO_MS : 0, k.id).run();
    return erro(c, 401, falhas >= MAX_FALHAS ? 'Muitas tentativas erradas. Espere 15 minutos ou peça para um adulto trocar seu PIN.' : generico);
  }
  await c.env.DB.prepare('UPDATE criancas SET falhas = 0, bloqueado_ate = 0, visto = ? WHERE id = ?').bind(Date.now(), k.id).run();
  return c.json({ token: await novaSessao(c.env.DB, 'crianca', k.id), ...(await respostaConta(c.env.DB, k, sanitizar(JSON.parse(k.progresso), FASES_VALIDAS))) });
});

async function crianca(c: C) {
  const id = await sessao(c, 'crianca');
  if (!id) return null;
  return c.env.DB.prepare('SELECT * FROM criancas WHERE id = ?').bind(id).first<Crianca>();
}

app.post('/crianca/sair', sairSessao);

/** Sincroniza o progresso: junta o do aparelho com o do servidor e aplica as cartas novas. */
app.post('/crianca/sync', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  const b = await corpo(c);
  const antes = sanitizar(JSON.parse(k.progresso), FASES_VALIDAS);
  const m = mesclar(antes, sanitizar(b.progresso, FASES_VALIDAS));
  const semana = semanaDe();
  const ganho = Math.max(0, m.xp - antes.xp);
  const xpSemana = (k.semana === semana ? k.xp_semana : 0) + Math.min(ganho, 2000);
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE criancas SET progresso = ?, xp_semana = ?, semana = ?, visto = ? WHERE id = ?')
      .bind(JSON.stringify(m), xpSemana, semana, Date.now(), k.id),
    ...upsertCartas(c.env.DB, k.id, sanitizarDelta(b.cartas, CARTAS_VALIDAS)),
  ]);
  return c.json(await respostaConta(c.env.DB, k, m));
});

app.get('/crianca/turma', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  const r = await c.env.DB.prepare(`SELECT id, apelido, cor, (SELECT COUNT(*) FROM cartas WHERE crianca_id = criancas.id AND qtd > 0) AS cartas
    FROM criancas WHERE turma_id = ? AND id != ? ORDER BY apelido_chave`).bind(k.turma_id, k.id).all();
  return c.json({ colegas: r.results });
});

app.get('/crianca/colega/:id', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
  const o = await c.env.DB.prepare('SELECT id, apelido, cor FROM criancas WHERE id = ? AND turma_id = ?').bind(c.req.param('id'), k.turma_id).first();
  if (!o) return erro(c, 404, 'Colega não encontrado.');
  return c.json({ colega: o, cartas: await cartasDe(c.env.DB, o.id as string) });
});

app.get('/crianca/ranking', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
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
  const r = await c.env.DB.prepare(`SELECT t.*, de.apelido AS de_apelido, de.cor AS de_cor, pa.apelido AS para_apelido, pa.cor AS para_cor
    FROM trocas t LEFT JOIN criancas de ON de.id = t.de_id LEFT JOIN criancas pa ON pa.id = t.para_id
    WHERE (t.de_id = ? OR t.para_id = ?) AND (t.status = 'pendente' OR t.resolvido > ?)
    ORDER BY t.criado DESC LIMIT 40`).bind(k.id, k.id, Date.now() - 7 * DIA).all();
  return c.json({ eu: k.id, trocas: r.results });
});

app.post('/crianca/trocas', async (c) => {
  const k = await crianca(c);
  if (!k) return erro(c, 401, 'Entre de novo na sua conta.');
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
  if (!dele || dele.qtd < 1) return erro(c, 409, 'Seu colega não tem mais essa carta.');
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
  const trava = aleatorio(12);
  const travada = `EXISTS (SELECT 1 FROM trocas WHERE id = '${t.id}' AND trava = '${trava}')`;
  const res = await db.batch([
    db.prepare(`UPDATE trocas SET status = 'aceita', trava = ?, resolvido = ? WHERE id = ? AND status = 'pendente'
      AND EXISTS (SELECT 1 FROM cartas WHERE crianca_id = ? AND carta_id = ? AND qtd >= 1)
      AND EXISTS (SELECT 1 FROM cartas WHERE crianca_id = ? AND carta_id = ? AND qtd >= 1)`)
      .bind(trava, agora, t.id, t.de_id, t.carta_dar, t.para_id, t.carta_receber),
    db.prepare(`UPDATE cartas SET qtd = qtd - 1 WHERE crianca_id = ? AND carta_id = ? AND ${travada}`).bind(t.de_id, t.carta_dar),
    db.prepare(`UPDATE cartas SET qtd = qtd - 1 WHERE crianca_id = ? AND carta_id = ? AND ${travada}`).bind(t.para_id, t.carta_receber),
    db.prepare(`INSERT INTO cartas (crianca_id, carta_id, qtd) SELECT ?, ?, 1 WHERE ${travada}
      ON CONFLICT (crianca_id, carta_id) DO UPDATE SET qtd = qtd + 1`).bind(t.para_id, t.carta_dar),
    db.prepare(`INSERT INTO cartas (crianca_id, carta_id, qtd) SELECT ?, ?, 1 WHERE ${travada}
      ON CONFLICT (crianca_id, carta_id) DO UPDATE SET qtd = qtd + 1`).bind(t.de_id, t.carta_receber),
  ]);
  if (res[0].meta.changes !== 1) {
    await db.prepare(`UPDATE trocas SET status = 'invalida', resolvido = ? WHERE id = ? AND status = 'pendente'`).bind(agora, t.id).run();
    return erro(c, 409, 'Essa troca não dá mais: uma das cartas já foi trocada com outra pessoa.');
  }
  return c.json({ ok: true, cartas: await cartasDe(db, k.id) });
});

/* ============================ Adultos ============================ */

interface Adulto { id: string; nome: string; email: string; senha_hash: string; senha_sal: string; falhas: number; bloqueado_ate: number }

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
  const id = aleatorio(8), sal = aleatorio(16);
  try {
    await c.env.DB.prepare('INSERT INTO adultos (id, nome, email, senha_hash, senha_sal, criado) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, nome, email, await hashSegredo(senha, sal), sal, Date.now()).run();
  } catch (e) {
    if (String(e).includes('UNIQUE')) return erro(c, 409, 'Já existe uma conta com esse e-mail. Use "Entrar".');
    throw e;
  }
  return c.json({ token: await novaSessao(c.env.DB, 'adulto', id), adulto: { nome, email, admin: ehAdmin(c.env, email) } });
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
  return c.json({ token: await novaSessao(c.env.DB, 'adulto', a.id), adulto: { nome: a.nome, email: a.email, admin: ehAdmin(c.env, a.email) } });
});

async function adulto(c: C) {
  const id = await sessao(c, 'adulto');
  if (!id) return null;
  const a = await c.env.DB.prepare('SELECT id, nome, email FROM adultos WHERE id = ?').bind(id).first<{ id: string; nome: string; email: string }>();
  return a ? { ...a, admin: ehAdmin(c.env, a.email) } : null;
}

app.post('/adulto/sair', sairSessao);

app.get('/adulto/eu', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  return c.json({ adulto: { nome: a.nome, email: a.email, admin: a.admin } });
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
  const r = await c.env.DB.prepare(`SELECT id, apelido, cor, criado, visto, bloqueado_ate, CASE WHEN semana = ? THEN xp_semana ELSE 0 END AS xp_semana,
    json_extract(progresso, '$.xp') AS xp, (SELECT COUNT(*) FROM cartas WHERE crianca_id = criancas.id AND qtd > 0) AS cartas
    FROM criancas WHERE turma_id = ? ORDER BY apelido_chave`).bind(semanaDe(), t.id).all();
  return c.json({ turma: t, criancas: r.results });
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

app.delete('/adulto/turmas/:id/criancas/:cid', async (c) => {
  const a = await adulto(c);
  if (!a) return erro(c, 401, 'Entre de novo.');
  const t = await turmaDoAdulto(c, a);
  if (!t) return erro(c, 404, 'Turma não encontrada.');
  const cid = c.req.param('cid');
  const k = await c.env.DB.prepare('SELECT id FROM criancas WHERE id = ? AND turma_id = ?').bind(cid, t.id).first();
  if (!k) return erro(c, 404, 'Criança não encontrada.');
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM cartas WHERE crianca_id = ?').bind(cid),
    c.env.DB.prepare(`UPDATE trocas SET status = 'cancelada', resolvido = ? WHERE (de_id = ? OR para_id = ?) AND status = 'pendente'`).bind(Date.now(), cid, cid),
    c.env.DB.prepare(`DELETE FROM sessoes WHERE tipo = 'crianca' AND ref_id = ?`).bind(cid),
    c.env.DB.prepare('DELETE FROM criancas WHERE id = ?').bind(cid),
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

export default {
  fetch(req: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(req.url);
    if (REDIRECIONAR.has(url.hostname)) {
      url.hostname = PRINCIPAL;
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return app.fetch(req, env, ctx);
    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;
