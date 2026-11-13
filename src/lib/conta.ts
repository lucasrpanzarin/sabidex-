// Conta da criança na turma: entrar, sair e sincronizar com o servidor.

import { useSyncExternalStore } from 'react';
import { aplicarServidor, getEstado, getPendente, limparPendente, progressoDe, setRegistrarCartas, zerarAparelho } from './store';
import type { ProgressoSync } from '../shared/sync';
import { capitulosDe, materiasDe } from '../data';
import type { Capitulo } from '../data/tipos';

/** `codigo` vazio = ainda não está numa turma. `familia` = tem um adulto responsável ligado à conta. */
export interface Conta {
  id: string; apelido: string; cor: string; turma: string; codigo: string; familia?: boolean;
  /** datas das provas da escola (capítulo → AAAA-MM-DD), marcadas pelo professor ou pelo adulto da família */
  provas?: Record<string, string>;
  /** matérias da turma (id em `conteudos`, `src/data/index.ts`); vazio = a turma ainda não tem matérias */
  conteudo?: string;
}
/** Perfis da família que já entraram neste aparelho (para irmãos trocarem só com o PIN). */
export interface PerfilAparelho { id: string; apelido: string; cor: string }
interface RespostaConta { conta: Conta; progresso: ProgressoSync; cartas: Record<string, number> }

const K_TOKEN = 'sabidex:token';
const K_CONTA = 'sabidex:conta';
const K_PERFIS = 'sabidex:perfis';
/** Último código de turma usado neste aparelho, para a criança não precisar decorar. Fica mesmo depois de sair. */
const K_ULTIMO_CODIGO = 'sabidex:ultimo-codigo';

const ler = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
let token = ler(K_TOKEN);
let conta: Conta | null = (() => { try { return JSON.parse(ler(K_CONTA) ?? 'null'); } catch { return null; } })();
let perfis: PerfilAparelho[] = (() => { try { const p = JSON.parse(ler(K_PERFIS) ?? '[]'); return Array.isArray(p) ? p : []; } catch { return []; } })();
let propostasNovas = 0;
/** Desafios do Duelo do Saber esperando a criança jogar. */
let desafiosNovos = 0;
/** Apelidos de quem chamou a criança para duelar (o Ará fala o nome no Início). */
let desafiantes: string[] = [];
/**
 * Resumo do chat da turma para o botão "Conversa da turma" (Lucas, 06/11/2026):
 * se está aberto agora e quantas mensagens dos colegas a criança ainda não viu.
 */
export interface ResumoChat { liberado: boolean; motivo: string | null; horario: { inicio: number; fim: number } | null; novas: number }
let chat: ResumoChat | null = null;
/** Dados mostrados uma vez logo depois de criar a conta (para anotar o PIN). */
setRegistrarCartas(!!token);

const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());
let versao = 0;
const mudou = () => { versao++; avisar(); };

export function useConta() {
  useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f); }, () => versao);
  return { conta, propostasNovas, desafiosNovos, desafiantes, chat, perfis };
}
export const getConta = () => conta;

/**
 * O que a criança pode estudar (Lucas, 05/11/2026): só os capítulos da turma dela.
 * Sem turma ('sem-turma') ou com turma sem matérias ('sem-materias'), não aparece nenhum jogo.
 */
export type SituacaoEstudo = 'ok' | 'sem-turma' | 'sem-materias';
export function estudoDa(c: Conta | null = conta): { caps: Capitulo[]; materias: string[]; situacao: SituacaoEstudo } {
  // Conta guardada por uma versão antiga do app (antes das matérias por turma) ainda não tem `conteudo`:
  // até a próxima sincronização vale o único livro que existia (o da Educativa). O servidor sempre manda o campo.
  const caps = c?.codigo ? capitulosDe(c.conteudo === undefined ? 'educativa-4b' : c.conteudo) : [];
  return { caps, materias: materiasDe(caps), situacao: !c?.codigo ? 'sem-turma' : caps.length ? 'ok' : 'sem-materias' };
}
/** Capítulos da turma da criança (muda sozinho quando a conta muda). */
export function useEstudo() {
  return estudoDa(useConta().conta);
}

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

export const ultimoCodigo = () => ler(K_ULTIMO_CODIGO) ?? '';

function guardar(t: string, r: RespostaConta) {
  // Outro perfil (irmão): os avisos do anterior não valem para este.
  if (conta?.id !== r.conta.id) { propostasNovas = 0; desafiosNovos = 0; desafiantes = []; chat = null; }
  token = t; conta = r.conta;
  lembrarPerfil(r.conta);
  try { localStorage.setItem(K_TOKEN, t); localStorage.setItem(K_CONTA, JSON.stringify(r.conta)); } catch { /* ignora */ }
  if (r.conta.codigo) try { localStorage.setItem(K_ULTIMO_CODIGO, r.conta.codigo); } catch { /* ignora */ }
  setRegistrarCartas(true);
  mudou();
  void verPropostas();
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
  token = null; conta = null; propostasNovas = 0; desafiosNovos = 0; desafiantes = []; chat = null;
  try { localStorage.removeItem(K_TOKEN); localStorage.removeItem(K_CONTA); } catch { /* ignora */ }
  setRegistrarCartas(false);
  limparPendente();
  mudou();
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
      try {
        localStorage.setItem(K_CONTA, JSON.stringify(r.conta));
        // A turma pode ter mudado (um adulto aprovou a entrada ou juntou turmas): o aparelho lembra o código novo.
        if (r.conta.codigo) localStorage.setItem(K_ULTIMO_CODIGO, r.conta.codigo);
      } catch { /* ignora */ }
      mudou();
    }
  } finally {
    sincronizando = false;
    if (deNovo) { deNovo = false; void sincronizar(); }
  }
}

/**
 * Abre um pacote pela conta: o servidor sorteia o Sabimon. Precisa de internet.
 * Devolve os ids das cartas que vieram, ou a mensagem de erro.
 */
export async function abrirPacoteNaConta(id: string): Promise<{ cartas: string[] } | { erro: string }> {
  if (!token) return { erro: 'Entre na sua conta.' };
  await sincronizar();
  const r = await api<RespostaConta & { cartasDoPacote?: string[] }>('/crianca/abrir-pacote', { corpo: { id } });
  if (r.status === 0) return { erro: 'Para abrir pacote precisa de internet. Conecte e tente de novo.' };
  if (r.erro) { void sincronizar(); return { erro: r.erro }; }
  aplicarServidor(r, {});
  return { cartas: r.cartasDoPacote ?? [] };
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
  const d = await api<{ eu: string; duelos: { para_id: string; status: string; de_apelido: string }[] }>('/crianca/duelos');
  const meus = d.erro ? null : d.duelos.filter((x) => x.para_id === d.eu && x.status === 'esperando');
  const nd = meus ? meus.length : desafiosNovos;
  const nomes = meus ? [...new Set(meus.map((x) => x.de_apelido))] : desafiantes;
  const visto = chatVisto();
  const ch = await api<ResumoChat>(`/crianca/chat/resumo?depois=${visto}`);
  // Se a criança abriu o chat enquanto a resposta vinha, o número já ficou velho: não volta a aparecer.
  const novas = chatVisto() > visto ? 0 : ch.novas;
  const novoChat = ch.erro ? chat : { liberado: ch.liberado, motivo: ch.motivo, horario: ch.horario, novas };
  if (n !== propostasNovas || nd !== desafiosNovos || nomes.join('|') !== desafiantes.join('|') || JSON.stringify(novoChat) !== JSON.stringify(chat)) {
    propostasNovas = n; desafiosNovos = nd; desafiantes = nomes; chat = novoChat; mudou();
  }
}

// A última mensagem do chat que a criança viu, guardada no aparelho (uma por perfil, para irmãos).
const kChatVisto = () => `sabidex:chat-visto:${conta?.id ?? ''}`;
const chatVisto = () => Number(ler(kChatVisto()) ?? 0) || 0;
/** A tela do chat avisa até qual mensagem a criança já viu (horário da mensagem, no relógio do servidor). */
export function marcarChatVisto(criado: number) {
  if (!conta || criado <= chatVisto()) return;
  try { localStorage.setItem(kChatVisto(), String(criado)); } catch { /* ignora */ }
  if (chat && chat.novas) { chat = { ...chat, novas: 0 }; mudou(); }
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
