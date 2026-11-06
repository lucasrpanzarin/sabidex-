// Duelo do Saber (decidido pelo Lucas em 05/11/2026).
// Dois colegas da mesma turma respondem as mesmas 10 perguntas, cada um quando puder.
// Quem acerta mais vence. As cartas entram na batalha só como parceiras: ninguém perde carta,
// e a força da carta não decide quem ganha (assim vence quem estudou, não quem tem a carta mais rara).
// Funções puras (usadas pelo app e pelo servidor), para poder testar.

import type { Capitulo } from '../data/tipos';
import { confere, GERADORES, gerarConta, semente, type Conta, type Resposta } from '../lib/contas';
import { chave } from '../lib/jogo';
import { idConta, idProva, idQuiz, itemDe } from '../lib/revisao';

export const PERGUNTAS_DUELO = 10;
/** Quantas são de escolher entre 4 (o resto é verdadeiro ou falso). */
const DE_ESCOLHA = 6;
/** XP (e Sabicoins) por acerto. 10 acertos = 40, igual a um jogo extra. */
export const XP_POR_ACERTO_DUELO = 4;
/** Só os primeiros duelos de cada dia dão XP (para ninguém ficar só duelando). */
export const DUELOS_COM_XP_POR_DIA = 3;
/** Desafios esperando resposta que cada criança pode ter mandado. */
export const MAX_DESAFIOS_ESPERANDO = 5;
/** Depois de 7 dias sem resposta, o desafio vence. */
export const VALIDADE_DUELO_MS = 7 * 86_400_000;

export type Vencedor = 'de' | 'para' | 'empate';

/**
 * Jeitos de duelar (Lucas, 06/11/2026). Os dois jogam sempre o mesmo jogo, com as mesmas perguntas.
 * - perguntas: as 10 perguntas de sempre (escolher + verdadeiro ou falso).
 * - relogio: "Contra o relógio": acertar o máximo no tempo. Em Matemática são contas digitadas,
 *   com os mesmos números para os dois. O relógio para enquanto a criança lê a explicação.
 */
export type ModoDuelo = 'perguntas' | 'relogio';
export const MODOS_DUELO: ModoDuelo[] = ['perguntas', 'relogio'];
export const NOME_MODO: Record<ModoDuelo, string> = { perguntas: 'Perguntas', relogio: 'Contra o relógio' };
export const modoValido = (m: unknown): ModoDuelo => (m === 'relogio' ? 'relogio' : 'perguntas');
/** Quantas perguntas (ou contas) o "Contra o relógio" prepara, no máximo. Se acabarem antes do tempo, o jogo termina. */
export const MAX_RELOGIO = 30;
/** Segundos do "Contra o relógio": Matemática tem mais tempo, porque a resposta é digitada. */
export const tempoRelogio = (caps: Capitulo[]) => (caps.some((c) => c.matematica) ? 90 : 60);
/** No "Contra o relógio" pode acertar mais de 10, mas o XP para em 10 acertos (igual ao duelo normal). */
export const ACERTOS_COM_XP = PERGUNTAS_DUELO;

/** Mundos em que as duas crianças já ouviram os temas (só caem perguntas do que os dois estudaram). */
export function mundosEmComum(caps: Capitulo[], feitasA: Record<string, true>, feitasB: Record<string, true>): Capitulo[] {
  return caps.filter((c) => feitasA[chave(c.id, 'ouvir')] && feitasB[chave(c.id, 'ouvir')]);
}

/**
 * Sorteia as 10 perguntas do duelo, alternando os mundos: 6 de escolher (da prova) e 4 de verdadeiro ou falso (do quiz).
 * Os ids são os mesmos da Revisão do Ará ("historia-9:p3", "historia-9:q5").
 */
export function montarDuelo(caps: Capitulo[], rng: () => number = Math.random): string[] {
  const embaralhar = <T,>(l: T[]) => { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const filas = (tipo: 'p' | 'q') => caps.map((c) => embaralhar((tipo === 'p' ? c.prova : c.quiz).map((_, i) => (tipo === 'p' ? idProva : idQuiz)(c.id, i))));
  const tirar = (fs: string[][], n: number) => {
    const saida: string[] = [];
    while (saida.length < n && fs.some((f) => f.length)) for (const f of fs) if (f.length && saida.length < n) saida.push(f.shift()!);
    return saida;
  };
  const escolha = tirar(filas('p'), DE_ESCOLHA);
  const vf = tirar(filas('q'), PERGUNTAS_DUELO - escolha.length);
  return embaralhar([...escolha, ...vf]);
}

/** Só as unidades que a criança escolheu: uma matéria (ou todas, nos duelos antigos) e uma unidade (ou todas). */
export function filtrarUnidades(caps: Capitulo[], materia: string, mundo: string): Capitulo[] {
  return caps.filter((c) => (!materia || c.materia === materia) && (!mundo || c.id === mundo));
}

/** Conta do duelo: o id leva o tipo e a semente ("matematica-9:c-falta-soma@12345"), então os dois recebem os mesmos números. */
const ID_CONTA = /^(.+):c-([a-z0-9-]+)@(\d+)$/;
export const idContaDuelo = (cap: string, tipo: string, s: number) => `${cap}:c-${tipo}@${s}`;
/** O id que vai para a Revisão do Ará (a conta do duelo vira o tipo de conta, que volta com números novos). */
export const idRevisaoDuelo = (id: string) => { const m = id.match(ID_CONTA); return m ? idConta(m[1], m[2]) : id; };

/**
 * Prepara o "Contra o relógio". Matemática: contas digitadas dos tipos do treino, alternando as unidades.
 * As outras matérias: verdadeiro ou falso e perguntas de escolher, tudo misturado.
 */
export function montarRelogio(caps: Capitulo[], rng: () => number = Math.random): string[] {
  const embaralhar = <T,>(l: T[]) => { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const deMat = caps.filter((c) => c.matematica?.treino.some((t) => GERADORES[t]));
  if (deMat.length) {
    const filas = deMat.map((c) => embaralhar([...new Set(c.matematica!.treino.filter((t) => GERADORES[t]))]).map((t) => [c.id, t] as const));
    const ids: string[] = [];
    for (let volta = 0; ids.length < MAX_RELOGIO; volta++) {
      for (const f of filas) if (ids.length < MAX_RELOGIO) { const [cap, t] = f[volta % f.length]; ids.push(idContaDuelo(cap, t, 1 + Math.floor(rng() * 2_000_000_000))); }
    }
    return ids;
  }
  const todas = caps.flatMap((c) => [...c.quiz.map((_, i) => idQuiz(c.id, i)), ...c.prova.map((_, i) => idProva(c.id, i))]);
  return embaralhar(todas).slice(0, MAX_RELOGIO);
}

/**
 * Pergunta do duelo num formato só: opções e o índice da certa. Verdadeiro ou falso vira 2 opções.
 * Conta de Matemática (só no "Contra o relógio"): vem em `conta`, sem opções; a criança digita.
 */
export interface PerguntaDuelo {
  id: string;
  cap: Capitulo;
  pergunta: string;
  opcoes: string[];
  certa: number;
  explicacao: string;
  vf: boolean;
  conta?: Conta;
}

export function perguntaDuelo(id: string, caps: Capitulo[]): PerguntaDuelo | null {
  const mc = id.match(ID_CONTA);
  if (mc) {
    const cap = caps.find((c) => c.id === mc[1]);
    const conta = cap ? gerarConta(mc[2], semente(Number(mc[3]))) : null;
    if (!cap || !conta) return null;
    return { id, cap, pergunta: conta.enunciado, opcoes: [], certa: -1, explicacao: conta.explicacao, vf: false, conta };
  }
  const it = itemDe(id, caps);
  if (!it || it.tipo === 'conta') return null;
  if (it.tipo === 'quiz') {
    return { id, cap: it.cap, pergunta: it.q.frase, opcoes: ['Verdadeiro', 'Falso'], certa: it.q.verdadeira ? 0 : 1, explicacao: it.q.explicacao, vf: true };
  }
  return { id, cap: it.cap, pergunta: it.q.pergunta, opcoes: [...it.q.opcoes], certa: it.q.certa, explicacao: it.q.explicacao, vf: false };
}

/** A resposta tem o formato certo para essa pergunta? (índice de opção, ou número/fração digitado na conta) */
function respostaValida(p: PerguntaDuelo, r: unknown): r is number | Resposta {
  const num = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && Math.abs(x) < 1e9;
  if (p.conta) return num(r) || (Array.isArray(r) && r.length === 2 && num(r[0]) && num(r[1]));
  return typeof r === 'number' && Number.isInteger(r) && r >= 0 && r < p.opcoes.length;
}

/** A criança acertou essa pergunta? */
export function acertou(p: PerguntaDuelo, r: unknown): boolean {
  if (!respostaValida(p, r)) return false;
  return p.conta ? confere(p.conta, r as Resposta) : r === p.certa;
}

/**
 * Confere as respostas (índice da opção escolhida, na ordem original; nas contas, o número digitado). Devolve quantas acertou.
 * No duelo normal tem que responder todas; no "Contra o relógio", só as que deu tempo (na ordem).
 */
export function corrigir(ids: string[], respostas: unknown, caps: Capitulo[], modo: ModoDuelo = 'perguntas'): number | null {
  if (!Array.isArray(respostas)) return null;
  if (modo === 'perguntas' ? respostas.length !== ids.length : respostas.length > ids.length) return null;
  let acertos = 0;
  for (let i = 0; i < respostas.length; i++) {
    const p = perguntaDuelo(ids[i], caps);
    if (!p || !respostaValida(p, respostas[i])) return null;
    if (acertou(p, respostas[i])) acertos++;
  }
  return acertos;
}

export const vencedorDe = (acertosDe: number, acertosPara: number): Vencedor =>
  acertosDe > acertosPara ? 'de' : acertosPara > acertosDe ? 'para' : 'empate';

export const xpDoDuelo = (acertos: number) => Math.min(ACERTOS_COM_XP, Math.max(0, acertos)) * XP_POR_ACERTO_DUELO;

/** Dia em Brasília (AAAA-MM-DD), para contar os duelos com XP do dia. */
export const diaBrasilia = (ms: number) => new Date(ms - 3 * 3600_000).toISOString().slice(0, 10);

/**
 * A batalha, rodada por rodada, para mostrar na tela: em cada pergunta, quem acertou dá um golpe.
 * Cada golpe tira 1/10 da Vida do outro Sabimon (a força da carta aparece no golpe, mas não muda o resultado).
 * No "Contra o relógio" cada um pode ter respondido um tanto; se alguém acertou mais de 10, o golpe tira menos.
 */
export function rodadas(acertouDe: boolean[], acertouPara: boolean[]) {
  const n = Math.max(acertouDe.length, acertouPara.length);
  const total = Math.max(PERGUNTAS_DUELO, acertouDe.filter(Boolean).length, acertouPara.filter(Boolean).length);
  let vidaDe = total, vidaPara = total;
  return Array.from({ length: n }, (_, i) => {
    const a = !!acertouDe[i], b = !!acertouPara[i];
    if (a) vidaPara--;
    if (b) vidaDe--;
    return { de: a, para: b, vidaDe: vidaDe / total, vidaPara: vidaPara / total };
  });
}

/** Quais perguntas a criança acertou (para a batalha e a correção). No "Contra o relógio", só as que ela respondeu. */
export function acertosPorPergunta(ids: string[], respostas: unknown[], caps: Capitulo[]): boolean[] {
  return respostas.slice(0, ids.length).map((r, i) => { const p = perguntaDuelo(ids[i], caps); return !!p && acertou(p, r); });
}
