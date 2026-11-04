// Regras do jogo: XP, níveis, fases, pacotes e sequência de dias.
// Funções puras (sem tela), para poder testar.

import type { Capitulo, Carta, Raridade } from '../data/tipos';

export type Fase = 'ouvir' | 'memoria' | 'linha' | 'quiz' | 'prova';
export const FASES: Fase[] = ['ouvir', 'memoria', 'linha', 'quiz', 'prova'];

export const FASE_INFO: Record<Fase, { titulo: string; sub: string; xp: number }> = {
  ouvir: { titulo: 'Ouvir os temas', sub: 'Escute ou leia cada tema', xp: 50 },
  memoria: { titulo: 'Jogo da memória', sub: 'Ligue cada palavra ao significado', xp: 60 },
  linha: { titulo: 'Linha do tempo', sub: 'Coloque os fatos na ordem certa', xp: 60 },
  quiz: { titulo: 'Quiz relâmpago', sub: 'Verdadeiro ou falso contra o relógio', xp: 80 },
  prova: { titulo: 'Prova do capítulo', sub: 'Nota 7 ou mais libera o pacote épico', xp: 120 },
};

/** Fases que dão um pacote normal na primeira vez que a criança termina. */
export const FASES_COM_PACOTE: Fase[] = ['memoria', 'quiz'];
export const NOTA_MINIMA = 7;
export const XP_POR_NIVEL = 300;

/* ---------- Jogos extras ---------- */

export type Extra = 'lacunas' | 'quemsou' | 'grupos' | 'causas';
export const EXTRAS: Extra[] = ['lacunas', 'quemsou', 'grupos', 'causas'];
export const EXTRA_INFO: Record<Extra, { titulo: string; sub: string; xp: number }> = {
  lacunas: { titulo: 'Complete a frase', sub: 'Escolha a palavra que falta', xp: 40 },
  quemsou: { titulo: 'Quem sou eu?', sub: 'Adivinhe com o menor número de pistas', xp: 40 },
  grupos: { titulo: 'Separe nos grupos', sub: 'Cada coisa no seu lugar', xp: 40 },
  causas: { titulo: 'Por que aconteceu?', sub: 'Ligue a causa ao que aconteceu depois', xp: 40 },
};
export const chaveExtra = (cap: string, x: Extra) => `${cap}:extra-${x}`;

/** Jogos extras que o capítulo tem material para montar. */
export function extrasDo(cap: Capitulo): Extra[] {
  const tem: Record<Extra, boolean> = {
    lacunas: (cap.lacunas?.length ?? 0) >= 5,
    quemsou: (cap.quemSou?.length ?? 0) >= 3,
    grupos: (cap.classificar?.length ?? 0) >= 1,
    causas: (cap.causas?.length ?? 0) >= 4,
  };
  return EXTRAS.filter((x) => tem[x]);
}

/** Os extras abrem depois de ouvir os temas. */
export const extrasLiberados = (e: Estado, cap: string) => !!e.feitas[chave(cap, 'ouvir')];

/**
 * Termina um jogo extra. 1ª vez: XP cheio; depois, metade.
 * Quem termina todos os extras do capítulo pela 1ª vez ganha um pacote.
 */
export function concluirExtra(e: Estado, cap: Capitulo, x: Extra, agora = new Date()): Resultado {
  const k = chaveExtra(cap.id, x);
  const primeiraVez = !e.feitas[k];
  const xpGanho = primeiraVez ? EXTRA_INFO[x].xp : Math.round(EXTRA_INFO[x].xp / 2);
  const feitas = { ...e.feitas, [k]: true as const };
  const todos = extrasDo(cap);
  const pacoteGanho: TipoPacote | null = primeiraVez && todos.length > 0 && todos.every((y) => feitas[chaveExtra(cap.id, y)]) ? 'normal' : null;
  const d = hoje(agora);
  const estado: Estado = {
    ...e,
    xp: e.xp + xpGanho,
    feitas,
    pacotes: pacoteGanho ? [...e.pacotes, { id: novoId(), tipo: pacoteGanho, capitulo: cap.id }] : e.pacotes,
    dias: e.dias.includes(d) ? e.dias : [...e.dias, d],
  };
  return { estado, xpGanho, subiuNivel: nivel(estado.xp).nivel > nivel(e.xp).nivel, pacoteGanho, primeiraVez };
}

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
  /** Revisão do Ará: id da pergunta → caixa (0–4) e dia em que ela volta. Fica só no aparelho. */
  revisao: Record<string, { caixa: number; proxima: string }>;
  /** último dia em que a revisão deu pacote (no máximo um por dia) */
  ultimaRevisao: string;
}

export const estadoInicial = (): Estado => ({
  perfil: null, xp: 0, feitas: {}, notas: {}, pacotes: [], cartas: {}, dias: [], abertos: [], revisao: {}, ultimaRevisao: '',
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

export interface Resultado {
  estado: Estado;
  xpGanho: number;
  subiuNivel: boolean;
  pacoteGanho: TipoPacote | null;
  primeiraVez: boolean;
}

let contador = 0;
export const novoId = () => `p${Date.now().toString(36)}${(contador++).toString(36)}`;

/**
 * Registra uma fase terminada. Na primeira vez dá XP cheio (e pacote, se for o caso);
 * repetir a fase dá metade do XP e nenhum pacote. A prova só conta como feita com nota ≥ 7.
 */
export function concluirFase(e: Estado, cap: string, f: Fase, nota?: number, agora = new Date()): Resultado {
  const k = chave(cap, f);
  const aprovado = f !== 'prova' || (nota ?? 0) >= NOTA_MINIMA;
  const primeiraVez = aprovado && !e.feitas[k];
  const base = FASE_INFO[f].xp;
  const xpGanho = aprovado ? (primeiraVez ? base : Math.round(base / 2)) : Math.round(base / 4);
  let pacoteGanho: TipoPacote | null = null;
  if (primeiraVez && FASES_COM_PACOTE.includes(f)) pacoteGanho = 'normal';
  if (primeiraVez && f === 'prova') pacoteGanho = 'epico';

  const d = hoje(agora);
  const estado: Estado = {
    ...e,
    xp: e.xp + xpGanho,
    feitas: aprovado ? { ...e.feitas, [k]: true } : e.feitas,
    notas: f === 'prova' && nota !== undefined ? { ...e.notas, [cap]: Math.max(nota, e.notas[cap] ?? 0) } : e.notas,
    pacotes: pacoteGanho ? [...e.pacotes, { id: novoId(), tipo: pacoteGanho, capitulo: cap }] : e.pacotes,
    dias: e.dias.includes(d) ? e.dias : [...e.dias, d],
  };
  return { estado, xpGanho, subiuNivel: nivel(estado.xp).nivel > nivel(e.xp).nivel, pacoteGanho, primeiraVez };
}

export const PESOS: Record<Raridade, number> = { comum: 62, rara: 26, epica: 9, lendaria: 3 };

function sortearRaridade(rng: () => number, pesos: Partial<Record<Raridade, number>>): Raridade {
  const lista = Object.entries(pesos) as [Raridade, number][];
  const soma = lista.reduce((s, [, p]) => s + p, 0);
  let r = rng() * soma;
  for (const [rar, p] of lista) { if ((r -= p) < 0) return rar; }
  return lista[lista.length - 1][0];
}

/**
 * Sorteia 3 cartas do capítulo. No pacote épico a última carta é épica ou lendária.
 * Não repete a mesma carta dentro de um pacote.
 */
export function abrirPacote(cartas: Carta[], tipo: TipoPacote, rng: () => number = Math.random): Carta[] {
  const saida: Carta[] = [];
  for (let i = 0; i < 3; i++) {
    const especial = tipo === 'epico' && i === 2;
    let rar = sortearRaridade(rng, especial ? { epica: 80, lendaria: 20 } : PESOS);
    let opcoes = cartas.filter((c) => c.raridade === rar && !saida.includes(c));
    if (!opcoes.length) opcoes = cartas.filter((c) => !saida.includes(c));
    saida.push(opcoes[Math.floor(rng() * opcoes.length)]);
  }
  const ordem: Raridade[] = ['comum', 'rara', 'epica', 'lendaria'];
  return saida.sort((a, b) => ordem.indexOf(a.raridade) - ordem.indexOf(b.raridade));
}

export function guardarCartas(e: Estado, pacoteId: string, novas: Carta[]): Estado {
  const cartas = { ...e.cartas };
  for (const c of novas) cartas[c.id] = (cartas[c.id] ?? 0) + 1;
  return { ...e, cartas, pacotes: e.pacotes.filter((p) => p.id !== pacoteId), abertos: [...e.abertos, pacoteId].slice(-500) };
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
