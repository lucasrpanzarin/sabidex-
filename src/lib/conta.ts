// Conta da criança na turma: entrar, sair e sincronizar com o servidor.

import { useSyncExternalStore } from 'react';
import { aplicarServidor, getEstado, getPendente, limparPendente, progressoDe, setRegistrarCartas } from './store';
import type { ProgressoSync } from '../shared/sync';

export interface Conta { id: string; apelido: string; cor: string; turma: string; codigo: string }
interface RespostaConta { conta: Conta; progresso: ProgressoSync; cartas: Record<string, number> }

const K_TOKEN = 'sabidex:token';
const K_CONTA = 'sabidex:conta';

const ler = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
let token = ler(K_TOKEN);
let conta: Conta | null = (() => { try { return JSON.parse(ler(K_CONTA) ?? 'null'); } catch { return null; } })();
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
  return { conta, propostasNovas, contaNova };
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
  try { localStorage.setItem(K_TOKEN, t); localStorage.setItem(K_CONTA, JSON.stringify(r.conta)); } catch { /* ignora */ }
  setRegistrarCartas(true);
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

export async function sair() {
  await api('/crianca/sair', { corpo: {} });
  desconectar();
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

/** Evolui um Sabimon pela conta da turma (o servidor gasta as cópias). Devolve a mensagem de erro, se houver. */
export async function evoluirNaConta(sabimon: string) {
  if (!token) return 'Entre na sua conta.';
  await sincronizar();
  const r = await api<RespostaConta>('/crianca/evoluir', { corpo: { sabimon } });
  if (r.erro) return r.erro;
  aplicarServidor(r, {});
  return null;
}

export async function verPropostas() {
  if (!token) return;
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
