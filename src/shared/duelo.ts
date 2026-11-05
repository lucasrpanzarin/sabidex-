// Duelo do Saber (decidido pelo Lucas em 05/11/2026).
// Dois colegas da mesma turma respondem as mesmas 10 perguntas, cada um quando puder.
// Quem acerta mais vence. As cartas entram na batalha só como parceiras: ninguém perde carta,
// e a força da carta não decide quem ganha (assim vence quem estudou, não quem tem a carta mais rara).
// Funções puras (usadas pelo app e pelo servidor), para poder testar.

import type { Capitulo } from '../data/tipos';
import { chave } from '../lib/jogo';
import { idProva, idQuiz, itemDe } from '../lib/revisao';

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

/** Pergunta do duelo num formato só: opções e o índice da certa. Verdadeiro ou falso vira 2 opções. */
export interface PerguntaDuelo {
  id: string;
  cap: Capitulo;
  pergunta: string;
  opcoes: string[];
  certa: number;
  explicacao: string;
  vf: boolean;
}

export function perguntaDuelo(id: string, caps: Capitulo[]): PerguntaDuelo | null {
  const it = itemDe(id, caps);
  if (!it || it.tipo === 'conta') return null;
  if (it.tipo === 'quiz') {
    return { id, cap: it.cap, pergunta: it.q.frase, opcoes: ['Verdadeiro', 'Falso'], certa: it.q.verdadeira ? 0 : 1, explicacao: it.q.explicacao, vf: true };
  }
  return { id, cap: it.cap, pergunta: it.q.pergunta, opcoes: [...it.q.opcoes], certa: it.q.certa, explicacao: it.q.explicacao, vf: false };
}

/** Confere as respostas (índice da opção escolhida, na ordem original). Devolve quantas acertou. */
export function corrigir(ids: string[], respostas: unknown, caps: Capitulo[]): number | null {
  if (!Array.isArray(respostas) || respostas.length !== ids.length) return null;
  let acertos = 0;
  for (let i = 0; i < ids.length; i++) {
    const p = perguntaDuelo(ids[i], caps);
    const r = respostas[i];
    if (!p || typeof r !== 'number' || !Number.isInteger(r) || r < 0 || r >= p.opcoes.length) return null;
    if (r === p.certa) acertos++;
  }
  return acertos;
}

export const vencedorDe = (acertosDe: number, acertosPara: number): Vencedor =>
  acertosDe > acertosPara ? 'de' : acertosPara > acertosDe ? 'para' : 'empate';

export const xpDoDuelo = (acertos: number) => Math.max(0, acertos) * XP_POR_ACERTO_DUELO;

/** Dia em Brasília (AAAA-MM-DD), para contar os duelos com XP do dia. */
export const diaBrasilia = (ms: number) => new Date(ms - 3 * 3600_000).toISOString().slice(0, 10);

/**
 * A batalha, rodada por rodada, para mostrar na tela: em cada pergunta, quem acertou dá um golpe.
 * Cada golpe tira 1/10 da Vida do outro Sabimon (a força da carta aparece no golpe, mas não muda o resultado).
 */
export function rodadas(acertouDe: boolean[], acertouPara: boolean[]) {
  let vidaDe = PERGUNTAS_DUELO, vidaPara = PERGUNTAS_DUELO;
  return acertouDe.map((a, i) => {
    const b = !!acertouPara[i];
    if (a) vidaPara--;
    if (b) vidaDe--;
    return { de: a, para: b, vidaDe: vidaDe / PERGUNTAS_DUELO, vidaPara: vidaPara / PERGUNTAS_DUELO };
  });
}

/** Quais perguntas a criança acertou (para a batalha e a correção). */
export function acertosPorPergunta(ids: string[], respostas: number[], caps: Capitulo[]): boolean[] {
  return ids.map((id, i) => perguntaDuelo(id, caps)?.certa === respostas[i]);
}
