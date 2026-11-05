// Revisão do Ará: repetição espaçada (método das caixas).
// Cada pergunta respondida entra numa "caixa". Acertou na hora certa → sobe de caixa e demora mais para voltar.
// Errou → volta para a caixa 0 e aparece de novo amanhã. Funções puras, para poder testar.

import type { Capitulo, Afirmacao, Questao } from '../data/tipos';
import { gerarConta, type Conta } from './contas';
import { hoje as hojeStr, premiar, type Estado, type Resultado } from './jogo';

/** Dias até a pergunta voltar, para cada caixa. */
export const INTERVALOS = [1, 3, 7, 21, 60];
export const MAX_POR_REVISAO = 8;
export const XP_POR_ACERTO = 10;

export type Revisao = Estado['revisao'];

export function somarDias(dia: string, n: number) {
  const [a, m, d] = dia.split('-').map(Number);
  return hojeStr(new Date(a, m - 1, d + n));
}

/** id de uma pergunta: "historia-9:q3" (quiz) ou "historia-9:p0" (prova). */
export const idQuiz = (cap: string, i: number) => `${cap}:q${i}`;
export const idProva = (cap: string, i: number) => `${cap}:p${i}`;
/** Matemática: guarda o TIPO de conta ("matematica-9:c-falta-soma"); na revisão vem uma conta nova desse tipo. */
export const idConta = (cap: string, tipo: string) => `${cap}:c-${tipo}`;

/**
 * Registra uma resposta. Acerto só sobe de caixa se a pergunta é nova ou já estava na hora de revisar
 * (repetir a mesma fase no mesmo dia não "engana" a revisão). Erro sempre volta para amanhã.
 */
export function registrarResposta(rev: Revisao, id: string, acertou: boolean, dia: string): Revisao {
  const atual = rev[id];
  if (!acertou) return { ...rev, [id]: { caixa: 0, proxima: somarDias(dia, INTERVALOS[0]) } };
  if (atual && atual.proxima > dia) return rev;
  const caixa = atual ? Math.min(atual.caixa + 1, INTERVALOS.length - 1) : 1;
  return { ...rev, [id]: { caixa, proxima: somarDias(dia, INTERVALOS[caixa]) } };
}

export type ItemRevisao =
  | { id: string; cap: Capitulo; tipo: 'quiz'; q: Afirmacao }
  | { id: string; cap: Capitulo; tipo: 'prova'; q: Questao }
  | { id: string; cap: Capitulo; tipo: 'conta'; q: Conta };

export function itemDe(id: string, capitulos: Capitulo[]): ItemRevisao | null {
  const c = id.match(/^(.+):c-([a-z-]+)$/);
  if (c) {
    const cap = capitulos.find((x) => x.id === c[1]);
    const q = cap ? gerarConta(c[2]) : null;
    return cap && q ? { id, cap, tipo: 'conta', q } : null;
  }
  const m = id.match(/^(.+):([qp])(\d+)$/);
  if (!m) return null;
  const cap = capitulos.find((c) => c.id === m[1]);
  const i = Number(m[3]);
  if (!cap) return null;
  if (m[2] === 'q') return cap.quiz[i] ? { id, cap, tipo: 'quiz', q: cap.quiz[i] } : null;
  return cap.prova[i] ? { id, cap, tipo: 'prova', q: cap.prova[i] } : null;
}

/**
 * Perguntas para revisar hoje: as mais atrasadas e de caixa mais baixa primeiro,
 * alternando capítulos (misturar assuntos ajuda a não confundir).
 */
export function paraHoje(rev: Revisao, capitulos: Capitulo[], dia: string, max = MAX_POR_REVISAO): ItemRevisao[] {
  const itens = Object.entries(rev)
    .filter(([, r]) => r.proxima <= dia)
    .sort(([a, x], [b, y]) => x.proxima.localeCompare(y.proxima) || x.caixa - y.caixa || a.localeCompare(b))
    .map(([id]) => itemDe(id, capitulos))
    .filter((x): x is ItemRevisao => !!x);
  const porCap = new Map<string, ItemRevisao[]>();
  for (const it of itens) porCap.set(it.cap.id, [...(porCap.get(it.cap.id) ?? []), it]);
  const filas = [...porCap.values()];
  const saida: ItemRevisao[] = [];
  while (saida.length < max && filas.some((f) => f.length)) {
    for (const f of filas) if (f.length && saida.length < max) saida.push(f.shift()!);
  }
  return saida;
}

export function quantasHoje(rev: Revisao, capitulos: Capitulo[], dia: string) {
  return paraHoje(rev, capitulos, dia, Infinity).length;
}

/** Quando é a próxima revisão (para avisar a criança). */
export function proximaData(rev: Revisao, dia: string): string | null {
  const futuras = Object.values(rev).map((r) => r.proxima).filter((d) => d > dia).sort();
  return futuras[0] ?? null;
}

/**
 * Fecha uma sessão de revisão: 10 XP por acerto (+10 por terminar), conta o dia de estudo
 * e segue as regras de prêmio das fases (pacote do dia e pacote de nível novo).
 */
export function concluirRevisao(e: Estado, acertos: number, total: number, caps: string[], agora = new Date()): Resultado {
  const xpGanho = acertos * XP_POR_ACERTO + (total ? 10 : 0);
  return premiar(e, caps[0] ?? 'revisao', xpGanho, [], false, e.feitas, agora);
}
