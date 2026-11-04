// Conta da criança na turma: entrar, sair e sincronizar com o servidor.

import { useSyncExternalStore } from 'react';
import { aplicarServidor, getEstado, getPendente, limparPendente, progressoDe, setRegistrarCartas, zerarAparelho } from './store';
import type { ProgressoSync } from '../shared/sync';

/** `codigo` vazio = ainda não está numa turma. `familia` = tem um adulto responsável ligado à conta. */
export interface Conta { id: string; apelido: string; cor: string; turma: string; codigo: string; familia?: boolean }
/** Perfis da família que já entraram neste aparelho (para irmãos trocarem só com o PIN). */
export interface PerfilAparelho { id: string; apelido: string; cor: string }
interface RespostaConta { conta: Conta; progresso: ProgressoSync; cartas: Record<string, number> }

const K_TOKEN = 'sabidex:token';
const K_CONTA = 'sabidex:conta';
const K_PERFIS = 'sabidex:perfis';

const ler = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
let token = ler(K_TOKEN);
let conta: Conta | null = (() => { try { return JSON.parse(ler(K_CONTA) ?? 'null'); } catch { return null; } })();
let perfis: PerfilAparelho[] = (() => { try { const p = JSON.parse(ler(K_PERFIS) ?? '[]'); return Array.isArray(p) ? p : []; } catch { return []; } })();
let propostasNovas = 0;
/** Dados mostrados uma vez logo depois de criar a conta (para anotar o PIN). */
let contaNova: { codigo: string; apelido: string; pin: string } | null = null;
setRegistrarCartas(!!token);

const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());
let versao = 0;
const mudou = () => { versao++; avisar(); };

export function useConta() {
  useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f); }, () => versao);
  return { conta, propostasNovas, contaNova, perfis };
}
export function esquecerContaNova() { contaNova = null; mudou(); }
export const getConta = () => conta;

/** Chamada ao servidor. Devolve { erro } em vez de lançar, com mensagens para a criança. */
export async function api<T = Record<string, unknown>>(caminho: string, opcoes: { metodo?: string; corpo?: unknown; tokenProprio?: string | null } = {}): Promise<T & { erro?: string; status?: number }> {
  const t = opcoes.tokenProprio === undefined ? token : opcoes.tokenProprio;
  try {
    const r = await fetch('/api' + caminho, {
      method: opcoes.metodo ?? (opcoes.corpo !== undefined ? 'POST' : 'GET'),
      headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
      body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && t && t === token && caminho.startsWith('/crianca')) desconectar();
    return { ...j, status: r.status, erro: r.ok ? undefined : (j.erro ?? 'Algo deu errado. Tente de novo.') };
  } catch {
    return { status: 0, erro: 'Sem internet agora. Tente de novo daqui a pouco.' } as T & { erro: string; status: number };
  }
}

function guardar(t: string, r: RespostaConta) {
  token = t; conta = r.conta;
  lembrarPerfil(r.conta);
  try { localStorage.setItem(K_TOKEN, t); localStorage.setItem(K_CONTA, JSON.stringify(r.conta)); } catch { /* ignora */ }
  setRegistrarCartas(true);
  mudou();
}

function lembrarPerfil(c: Conta) {
  if (!c.familia) return;
  perfis = [...perfis.filter((p) => p.id !== c.id), { id: c.id, apelido: c.apelido, cor: c.cor }].slice(-6);
  try { localStorage.setItem(K_PERFIS, JSON.stringify(perfis)); } catch { /* ignora */ }
}

export function esquecerPerfil(id: string) {
  perfis = perfis.filter((p) => p.id !== id);
  try { localStorage.setItem(K_PERFIS, JSON.stringify(perfis)); } catch { /* ignora */ }
  mudou();
}

function desconectar() {
  token = null; conta = null; propostasNovas = 0;
  try { localStorage.removeItem(K_TOKEN); localStorage.removeItem(K_CONTA); } catch { /* ignora */ }
  setRegistrarCartas(false);
  limparPendente();
  mudou();
}

/** Primeira vez na turma: cria a conta levando o progresso deste aparelho. */
export async function entrarNaTurma(codigo: string, apelido: string, cor: string, pin: string) {
  const e = getEstado();
  const r = await api<RespostaConta & { token: string }>('/crianca/entrar-turma', {
    corpo: { codigo, apelido, cor, pin, progresso: progressoDe(e), cartas: e.cartas }, tokenProprio: null,
  });
  if (r.erro) return r.erro;
  limparPendente();
  aplicarServidor(r, {}, true);
  contaNova = { codigo: r.conta.codigo, apelido: r.conta.apelido, pin };
  guardar(r.token, r);
  return null;
}

/** Entrar na conta que já existe (em outro aparelho): o progresso da conta substitui o deste aparelho. */
export async function entrarNaConta(codigo: string, apelido: string, pin: string) {
  const r = await api<RespostaConta & { token: string }>('/crianca/entrar', { corpo: { codigo, apelido, pin }, tokenProprio: null });
  if (r.erro) return r.erro;
  limparPendente();
  aplicarServidor(r, {}, true);
  guardar(r.token, r);
  return null;
}

/**
 * Entra numa conta com um token já pronto (o adulto abriu o perfil, ou a criança digitou o PIN).
 * O progresso deste aparelho é trocado pelo da conta; antes, o que estava pendente vai para a conta antiga.
 */
async function entrarCom(r: RespostaConta & { token: string }) {
  if (token) { await sincronizar(); await api('/crianca/sair', { corpo: {} }); }
  limparPendente();
  aplicarServidor(r, {}, true);
  guardar(r.token, r);
}

/** A conta da família foi apagada: esquece esses perfis e limpa o aparelho se um deles estava aberto. */
export function esquecerContas(ids: string[]) {
  perfis = perfis.filter((p) => !ids.includes(p.id));
  try { localStorage.setItem(K_PERFIS, JSON.stringify(perfis)); } catch { /* ignora */ }
  if (conta && ids.includes(conta.id)) { desconectar(); zerarAparelho(); }
  mudou();
}

/** O adulto abriu o perfil do filho neste aparelho. */
export async function usarPerfilDoAdulto(tokenAdulto: string, criancaId: string) {
  const r = await api<RespostaConta & { token: string }>(`/adulto/familia/${criancaId}/aparelho`, { corpo: {}, tokenProprio: tokenAdulto });
  if (r.erro) return r.erro;
  await entrarCom(r);
  return null;
}

/** Irmão escolhe o próprio perfil neste aparelho e digita o PIN. */
export async function entrarNoPerfil(id: string, pin: string) {
  const r = await api<RespostaConta & { token: string }>('/crianca/entrar-perfil', { corpo: { id, pin }, tokenProprio: null });
  if (r.status === 404) esquecerPerfil(id);
  if (r.erro) return r.erro;
  await entrarCom(r);
  return null;
}

/** Criança que já tem conta (da família) entra numa turma: a conta continua a mesma. */
export async function entrarNaTurmaComConta(codigo: string, apelido: string) {
  await sincronizar();
  const r = await api<RespostaConta>('/crianca/turma', { corpo: { codigo, apelido } });
  if (r.erro) return r.erro;
  aplicarServidor(r, {});
  conta = r.conta;
  try { localStorage.setItem(K_CONTA, JSON.stringify(r.conta)); } catch { /* ignora */ }
  mudou();
  return null;
}

/**
 * Sai da conta neste aparelho. Antes, manda para a conta o que ainda não foi;
 * sem internet, não sai (para nenhuma carta se perder). Depois limpa o aparelho.
 */
export async function sair() {
  await sincronizar();
  if (Object.keys(getPendente()).length > 0) return 'Sem internet agora. Conecte para não perder nenhuma carta e tente de novo.';
  await api('/crianca/sair', { corpo: {} });
  desconectar();
  zerarAparelho();
  return null;
}

let sincronizando = false;
let deNovo = false;
export async function sincronizar() {
  if (!token) return;
  if (sincronizando) { deNovo = true; return; }
  sincronizando = true;
  try {
    const enviado = { ...getPendente() };
    const r = await api<RespostaConta>('/crianca/sync', { corpo: { progresso: progressoDe(getEstado()), cartas: enviado } });
    if (!r.erro) {
      aplicarServidor(r, enviado);
      conta = r.conta;
      try { localStorage.setItem(K_CONTA, JSON.stringify(r.conta)); } catch { /* ignora */ }
      mudou();
    }
  } finally {
    sincronizando = false;
    if (deNovo) { deNovo = false; void sincronizar(); }
  }
}

/** Evolui uma carta pela conta (o servidor gasta as cartas). Devolve a mensagem de erro, se houver. */
export async function evoluirNaConta(carta: string) {
  if (!token) return 'Entre na sua conta.';
  await sincronizar();
  const r = await api<RespostaConta>('/crianca/evoluir', { corpo: { carta } });
  if (r.erro) return r.erro;
  aplicarServidor(r, {});
  return null;
}

export async function verPropostas() {
  if (!token || !conta?.codigo) return;
  const r = await api<{ eu: string; trocas: { para_id: string; status: string }[] }>('/crianca/trocas');
  if (r.erro) return;
  const n = r.trocas.filter((t) => t.para_id === r.eu && t.status === 'pendente').length;
  if (n !== propostasNovas) { propostasNovas = n; mudou(); }
}

/** Liga a sincronização automática: ao mudar algo, ao voltar a internet e a cada minuto. */
export function iniciarSincronizacao(assinar: (f: () => void) => () => void) {
  let espera: ReturnType<typeof setTimeout> | undefined;
  assinar(() => { clearTimeout(espera); espera = setTimeout(() => void sincronizar(), 1500); });
  const tudo = () => { void sincronizar(); void verPropostas(); };
  window.addEventListener('online', tudo);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tudo(); });
  setInterval(() => { if (document.visibilityState === 'visible') tudo(); }, 60_000);
  tudo();
}
