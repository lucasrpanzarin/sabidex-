// Regras do jogo: XP, níveis, fases, pacotes e sequência de dias.
// Funções puras (sem tela), para poder testar.

import type { Raridade, Sabimon } from '../data/tipos';
import type { Compra } from '../shared/sync';

export type Fase = 'ouvir' | 'memoria' | 'linha' | 'quiz' | 'prova';
export const FASES: Fase[] = ['ouvir', 'memoria', 'linha', 'quiz', 'prova'];

export const FASE_INFO: Record<Fase, { titulo: string; sub: string; xp: number }> = {
  ouvir: { titulo: 'Ouvir os temas', sub: 'Escute a explicação de cada tema', xp: 50 },
  memoria: { titulo: 'Jogo da memória', sub: 'Ligue cada palavra ao significado', xp: 60 },
  linha: { titulo: 'Linha do tempo', sub: 'Coloque os fatos na ordem certa', xp: 60 },
  quiz: { titulo: 'Quiz relâmpago', sub: 'Verdadeiro ou falso contra o relógio', xp: 80 },
  prova: { titulo: 'Prova do capítulo', sub: 'Nota 7 ou mais libera o pacote épico', xp: 120 },
};

/** Fases que dão um pacote normal na primeira vez que a criança termina. */
export const FASES_COM_PACOTE: Fase[] = ['memoria', 'quiz'];
export const NOTA_MINIMA = 7;
export const XP_POR_NIVEL = 300;

export type TipoPacote = 'normal' | 'epico';
export interface Pacote {
  id: string;
  tipo: TipoPacote;
  capitulo: string;
}

export interface Estado {
  perfil: { nome: string; cor: string } | null;
  xp: number;
  /** chave "capitulo:fase" → fase concluída */
  feitas: Record<string, true>;
  /** maior nota (0–10) na prova de cada capítulo */
  notas: Record<string, number>;
  pacotes: Pacote[];
  /** id da carta → quantas a criança tem */
  cartas: Record<string, number>;
  /** dias em que estudou, no formato AAAA-MM-DD */
  dias: string[];
  /** ids dos pacotes já abertos (para não voltarem ao sincronizar) */
  abertos: string[];
  /** pacotes seguidos sem nenhum Sabimon novo (para a garantia) */
  semNovo: number;
  /** dia (AAAA-MM-DD) em que a criança já ganhou o pacote do dia */
  pacoteDia: string;
  /** compras da lojinha (itens e evoluções); o saldo é XP − soma dos preços */
  compras: Compra[];
  /** item da loja que a criança escolheu como "meu desejo" */
  desejo: string | null;
}

export const estadoInicial = (): Estado => ({
  perfil: null, xp: 0, feitas: {}, notas: {}, pacotes: [], cartas: {}, dias: [], abertos: [], semNovo: 0, pacoteDia: '', compras: [], desejo: null,
});

export function nivel(xp: number) {
  return { nivel: Math.floor(xp / XP_POR_NIVEL) + 1, noNivel: xp % XP_POR_NIVEL, total: XP_POR_NIVEL };
}

export const chave = (cap: string, f: Fase) => `${cap}:${f}`;

/** Uma fase está liberada quando a anterior do mesmo capítulo foi concluída. */
export function liberada(e: Estado, cap: string, f: Fase) {
  const i = FASES.indexOf(f);
  return i === 0 || !!e.feitas[chave(cap, FASES[i - 1])];
}

export function hoje(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Dias seguidos estudando, contando até hoje (ou até ontem, se ainda não estudou hoje). */
export function sequencia(dias: string[], agora = new Date()) {
  const set = new Set(dias);
  const d = new Date(agora);
  if (!set.has(hoje(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(hoje(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/** Por que a criança ganhou o pacote. */
export type MotivoPacote = 'fase' | 'prova' | 'dia' | 'nivel';

export interface Resultado {
  estado: Estado;
  xpGanho: number;
  subiuNivel: boolean;
  /** pacotes ganhos nesta fase (pode ser mais de um) */
  pacotesGanhos: { tipo: TipoPacote; motivo: MotivoPacote }[];
  primeiraVez: boolean;
}

let contador = 0;
const novoId = () => `p${Date.now().toString(36)}${(contador++).toString(36)}`;

/**
 * Registra uma fase terminada. Na primeira vez dá XP cheio (e pacote, se for o caso);
 * repetir a fase dá metade do XP. A prova só conta como feita com nota ≥ 7.
 * Pacotes: memória e quiz na 1ª vez (normal), prova aprovada na 1ª vez (épico),
 * a 1ª fase terminada de cada dia (normal) e cada nível novo (normal).
 */
export function concluirFase(e: Estado, cap: string, f: Fase, nota?: number, agora = new Date()): Resultado {
  const k = chave(cap, f);
  const aprovado = f !== 'prova' || (nota ?? 0) >= NOTA_MINIMA;
  const primeiraVez = aprovado && !e.feitas[k];
  const base = FASE_INFO[f].xp;
  const xpGanho = aprovado ? (primeiraVez ? base : Math.round(base / 2)) : Math.round(base / 4);
  const d = hoje(agora);
  const pacotesGanhos: Resultado['pacotesGanhos'] = [];
  if (primeiraVez && FASES_COM_PACOTE.includes(f)) pacotesGanhos.push({ tipo: 'normal', motivo: 'fase' });
  if (primeiraVez && f === 'prova') pacotesGanhos.push({ tipo: 'epico', motivo: 'prova' });
  const ganhaDoDia = aprovado && e.pacoteDia !== d;
  if (ganhaDoDia) pacotesGanhos.push({ tipo: 'normal', motivo: 'dia' });
  const subiuNivel = nivel(e.xp + xpGanho).nivel > nivel(e.xp).nivel;
  if (subiuNivel) pacotesGanhos.push({ tipo: 'normal', motivo: 'nivel' });

  const estado: Estado = {
    ...e,
    xp: e.xp + xpGanho,
    feitas: aprovado ? { ...e.feitas, [k]: true } : e.feitas,
    notas: f === 'prova' && nota !== undefined ? { ...e.notas, [cap]: Math.max(nota, e.notas[cap] ?? 0) } : e.notas,
    pacotes: [...e.pacotes, ...pacotesGanhos.map((p) => ({ id: novoId(), tipo: p.tipo, capitulo: cap }))],
    dias: e.dias.includes(d) ? e.dias : [...e.dias, d],
    pacoteDia: ganhaDoDia ? d : e.pacoteDia,
  };
  return { estado, xpGanho, subiuNivel, pacotesGanhos, primeiraVez };
}

export const PESOS: Record<Raridade, number> = { comum: 62, rara: 26, epica: 9, lendaria: 3 };

function sortearRaridade(rng: () => number, pesos: Partial<Record<Raridade, number>>): Raridade {
  const lista = Object.entries(pesos) as [Raridade, number][];
  const soma = lista.reduce((s, [, p]) => s + p, 0);
  let r = rng() * soma;
  for (const [rar, p] of lista) { if ((r -= p) < 0) return rar; }
  return lista[lista.length - 1][0];
}

/** Depois de tantos pacotes seguidos sem Sabimon novo, o próximo traz um que a criança não tem. */
export const GARANTIA = 10;

const ORDEM: Raridade[] = ['comum', 'rara', 'epica', 'lendaria'];

/** Quantos Sabimons vêm em cada pacote. */
export const POR_PACOTE = 1;

/**
 * Sorteia os Sabimons do pacote (sem repetir dentro dele). No pacote épico o último é épico ou lendário.
 * Com `garantia`, se nenhum for novo, troca o mais comum por um Sabimon que a criança ainda não tem.
 */
export function abrirPacote(
  lista: Sabimon[], tipo: TipoPacote, rng: () => number = Math.random,
  opcoes: { tem?: Record<string, number>; garantia?: boolean } = {},
): Sabimon[] {
  const saida: Sabimon[] = [];
  for (let i = 0; i < POR_PACOTE; i++) {
    const especial = tipo === 'epico' && i === POR_PACOTE - 1;
    const rar = sortearRaridade(rng, especial ? { epica: 80, lendaria: 20 } : PESOS);
    let escolha = lista.filter((c) => c.raridade === rar && !saida.includes(c));
    if (!escolha.length) escolha = lista.filter((c) => !saida.includes(c));
    saida.push(escolha[Math.floor(rng() * escolha.length)]);
  }
  const tem = opcoes.tem ?? {};
  const faltam = lista.filter((c) => !(tem[c.id] > 0) && !saida.includes(c));
  if (opcoes.garantia && faltam.length && saida.every((c) => tem[c.id] > 0)) {
    // troca o mais comum do pacote, para não tirar o épico garantido
    const idx = saida.reduce((m, c, i) => (ORDEM.indexOf(c.raridade) < ORDEM.indexOf(saida[m].raridade) ? i : m), 0);
    saida[idx] = faltam[Math.floor(rng() * faltam.length)];
  }
  return saida.sort((a, b) => ORDEM.indexOf(a.raridade) - ORDEM.indexOf(b.raridade));
}

/** Guarda os Sabimons do pacote e atualiza a contagem da garantia. */
export function guardarCartas(e: Estado, pacoteId: string, novas: Sabimon[]): Estado {
  const cartas = { ...e.cartas };
  const algumNovo = novas.some((c) => !(cartas[c.id] > 0));
  for (const c of novas) cartas[c.id] = (cartas[c.id] ?? 0) + 1;
  return {
    ...e, cartas, semNovo: algumNovo ? 0 : (e.semNovo ?? 0) + 1,
    pacotes: e.pacotes.filter((p) => p.id !== pacoteId), abertos: [...e.abertos, pacoteId].slice(-500),
  };
}

/** A garantia vale para o próximo pacote? */
export const garantiaAtiva = (e: Estado) => (e.semNovo ?? 0) >= GARANTIA - 1;

/**
 * As cartas antigas dos capítulos (ids "h-…") deixaram de existir.
 * Quem tinha cartas antigas ganha pacotes de Sabimons no lugar: 1 pacote para cada carta (até 30).
 * Os ids dos pacotes são fixos, então isso nunca dá pacote em dobro (nem em dois aparelhos).
 */
export function migrarCartasAntigas(e: Estado, validos: Set<string>): Estado {
  const antigas = Object.entries(e.cartas).filter(([id]) => !validos.has(id));
  if (!antigas.length) return e;
  const total = antigas.reduce((s, [, n]) => s + Math.max(0, n), 0);
  const ja = new Set([...e.abertos, ...e.pacotes.map((p) => p.id)]);
  const extras: Pacote[] = [];
  for (let i = 1; i <= Math.min(total, 30); i++) {
    const id = `antigas-${i}`;
    if (!ja.has(id)) extras.push({ id, tipo: 'normal', capitulo: 'antigas' });
  }
  const cartas = Object.fromEntries(Object.entries(e.cartas).filter(([id]) => validos.has(id)));
  return { ...e, cartas, pacotes: [...e.pacotes, ...extras] };
}

export function embaralhar<T>(lista: T[], rng: () => number = Math.random): T[] {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Nota de 0 a 10, com meio ponto. */
export const notaDe = (acertos: number, total: number) => Math.round((acertos / total) * 20) / 2;
