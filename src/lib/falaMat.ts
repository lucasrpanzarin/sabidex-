// Narração do "Ver como se faz" de Matemática (Lucas, 06/11/2026): só as vozes Nina e Otto.
// O mesmo texto da tela, escrito do jeito que a voz deve falar (frações, vírgulas, dinheiro, sinais).
import type { Capitulo } from '../data/tipos';
import { extenso, lerFracao, reaisPorExtenso } from './contas';
import type { IdVoz } from './voz';

/** Matemática só tem áudio da Nina e do Otto; quem escolheu outra voz ouve a Nina. */
export const vozDaMatematica = (v: IdVoz): 'nina' | 'otto' => (v === 'otto' ? 'otto' : 'nina');

type Exemplo = NonNullable<Capitulo['matematica']>['exemplos'][number];

const DENOMINADORES = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 100]);
function fracaoFalada(n: number, d: number) {
  if (DENOMINADORES.has(d) && n <= 10) return lerFracao(n, d);
  if (d === 100) return `${extenso(n)} ${n === 1 ? 'centésimo' : 'centésimos'}`;
  return `${extenso(n)} ${d <= 999 ? extenso(d) : d} avos`;
}
/** "0,06" → "zero vírgula zero seis"; "50,89" → "cinquenta vírgula oitenta e nove". */
function decimalFalado(inteiro: string, dec: string) {
  const depois = dec.startsWith('0') ? [...dec].map((c) => extenso(Number(c))).join(' ') : extenso(Number(dec));
  return `${extenso(Number(inteiro))} vírgula ${depois}`;
}

/** Transforma um texto da tela no que a voz vai falar. */
export function falaDaConta(t: string): string {
  return t
    .replace(/\*\*/g, '')
    .replace(/R\$\s?(\d+),(\d{2})/g, (_, r, c) => reaisPorExtenso(Number(r) * 100 + Number(c)))
    .replace(/(\d+)\/(\d+)/g, (_, n, d) => fracaoFalada(Number(n), Number(d)))
    .replace(/(\d+),(\d+)/g, (_, i, d) => decimalFalado(i, d))
    .replace(/(do|o símbolo) %/g, (_, a) => (a === 'do' ? 'do símbolo de por cento' : 'o símbolo de por cento'))
    .replace(/(^|\s)%(?=\s)/g, '$1o símbolo de por cento')
    .replace(/(\d+)\s?%/g, '$1 por cento')
    .replace(/(\d+)\s?kg\b/g, (_, n) => `${n} ${n === '1' ? 'quilo' : 'quilos'}`)
    .replace(/(^|\s)\?(?=\s)/g, '$1um número')
    .replace(/\s*×\s*/g, ' vezes ').replace(/\s*÷\s*/g, ' dividido por ').replace(/\s+−\s+/g, ' menos ')
    .replace(/\s+\+\s+/g, ' mais ').replace(/\s+=\s+/g, ' é igual a ').replace(/\s+>\s+/g, ' é maior que ').replace(/\s+<\s+/g, ' é menor que ')
    .replace(/\s*→\s*/g, ', ')
    .replace(/\.{3}(?=\s+[a-zà-ú])/g, ', e assim por diante,').replace(/\.{3}/g, ', e assim por diante.')
    .replace(/\s+/g, ' ').trim();
}

/** Os áudios de um exemplo: o 1º junta o título, a ideia, o exemplo e o 1º passo; depois, um por passo. */
export function audiosDoExemplo(capId: string, ex: number, e: Exemplo): { arquivo: string; texto: string }[] {
  return e.passos.map((p, i) => ({
    arquivo: `audio/${capId}-e${ex}-p${i}.mp3`,
    texto: falaDaConta(i === 0 ? `${e.titulo}${/[.?!]$/.test(e.titulo) ? '' : '.'} ${e.ideia} Exemplo: ${e.situacao} ${p}` : p),
  }));
}
