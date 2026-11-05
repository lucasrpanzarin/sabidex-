// Regras do jogo: XP, níveis, fases, pacotes e sequência de dias.
// Funções puras (sem tela), para poder testar.

import type { Capitulo, Raridade, Sabimon } from '../data/tipos';
import type { Compra } from '../shared/sync';

export type Fase = 'ouvir' | 'memoria' | 'linha' | 'quiz' | 'prova';
export const FASES: Fase[] = ['ouvir', 'memoria', 'linha', 'quiz', 'prova'];

export const FASE_INFO: Record<Fase, { titulo: string; sub: string; xp: number }> = {
  ouvir: { titulo: 'Ouvir os temas', sub: 'Escute ou leia cada tema', xp: 50 },
  memoria: { titulo: 'Jogo da memória', sub: 'Ligue cada palavra ao significado', xp: 60 },
  linha: { titulo: 'Linha do tempo', sub: 'Coloque os fatos na ordem certa', xp: 60 },
  quiz: { titulo: 'Quiz relâmpago', sub: 'Verdadeiro ou falso contra o relógio', xp: 80 },
  prova: { titulo: 'Prova do capítulo', sub: 'Nota 7 ou mais libera o pacote épico', xp: 120 },
};

/** Em Matemática, as fases têm outro nome (o XP é o mesmo). */
const FASE_MATEMATICA: Partial<Record<Fase, { titulo: string; sub: string }>> = {
  ouvir: { titulo: 'Ver como se faz', sub: 'Veja o exemplo e resolva um igual' },
  memoria: { titulo: 'Treino de contas', sub: 'Resolva e digite a resposta' },
  linha: { titulo: 'Balança e sequências', sub: 'Descubra o número que falta' },
  prova: { titulo: 'Prova da unidade', sub: 'Nota 7 ou mais libera o pacote épico' },
};

/** Nome e explicação da fase para este capítulo. */
export function infoFase(f: Fase, cap?: { matematica?: { nomeDesafio?: [string, string] } }) {
  const nome = f === 'linha' ? cap?.matematica?.nomeDesafio : undefined;
  if (nome) return { ...FASE_INFO[f], titulo: nome[0], sub: nome[1] };
  const m = cap?.matematica ? FASE_MATEMATICA[f] : undefined;
  return m ? { ...FASE_INFO[f], ...m } : FASE_INFO[f];
}

/** Fases que dão um pacote normal na primeira vez que a criança termina. */
export const FASES_COM_PACOTE: Fase[] = ['memoria', 'quiz'];
export const NOTA_MINIMA = 7;
export const XP_POR_NIVEL = 300;

/** Cada erro tira 10% do XP da fase, até sobrar no mínimo 20% (quem termina sempre ganha algo). */
export const PERDA_POR_ERRO = 0.1;
export const XP_MINIMO = 0.2;
/** XP de uma fase ou jogo depois de descontar os erros. */
export function xpComErros(base: number, erros = 0): number {
  const fator = Math.max(XP_MINIMO, 1 - PERDA_POR_ERRO * Math.max(0, erros));
  return Math.round(base * fator);
}

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
 * Fecha uma atividade que não é fase (jogo extra, revisão) com as mesmas regras de prêmio das fases:
 * XP, dia de estudo, o pacote do dia (1ª atividade do dia) e o pacote de nível novo.
 */
export function premiar(
  e: Estado, cap: string, xpGanho: number, extras: Resultado['pacotesGanhos'], primeiraVez: boolean,
  feitas: Estado['feitas'] = e.feitas, agora = new Date(), passou = true,
): Resultado {
  const d = hoje(agora);
  const pacotesGanhos = [...extras];
  const ganhaDoDia = passou && e.pacoteDia !== d;
  if (ganhaDoDia) pacotesGanhos.push({ tipo: 'normal', motivo: 'dia' });
  const subiuNivel = nivel(e.xp + xpGanho).nivel > nivel(e.xp).nivel;
  if (subiuNivel) pacotesGanhos.push({ tipo: 'normal', motivo: 'nivel' });
  const estado: Estado = {
    ...e,
    xp: e.xp + xpGanho,
    feitas,
    pacotes: [...e.pacotes, ...pacotesGanhos.map((p) => ({ id: novoId(), tipo: p.tipo, capitulo: cap }))],
    dias: e.dias.includes(d) ? e.dias : [...e.dias, d],
    pacoteDia: ganhaDoDia ? d : e.pacoteDia,
  };
  return { estado, xpGanho, subiuNivel, pacotesGanhos, primeiraVez };
}

/**
 * Termina um jogo extra. 1ª vez: XP cheio; depois, metade. Cada erro tira 10% do XP.
 * O pacote do dia só vem com nota 7 ou mais.
 * Quem termina todos os extras do capítulo com nota 7 ou mais ganha um pacote (uma vez só).
 * Se tirar menos de 7 em algum, o pacote fica esperando: vem quando jogar de novo e passar.
 */
export function concluirExtra(e: Estado, cap: Capitulo, x: Extra, agora = new Date(), erros = 0, nota?: number): Resultado {
  const k = chaveExtra(cap.id, x);
  const primeiraVez = !e.feitas[k];
  const cheio = primeiraVez ? EXTRA_INFO[x].xp : Math.round(EXTRA_INFO[x].xp / 2);
  const xpGanho = xpComErros(cheio, erros);
  const feitas = { ...e.feitas, [k]: true as const };
  const todos = extrasDo(cap);
  const notasDepois = nota === undefined ? e.notas : { ...e.notas, [k]: Math.max(nota, e.notas[k] ?? 0) };
  // Extra feito antes de o app guardar a nota conta como passado (quem jogava antes não perde nada).
  const todosPassados = (f: Estado['feitas'], n: Estado['notas']) =>
    todos.length > 0 && todos.every((y) => { const ky = chaveExtra(cap.id, y); return f[ky] && (n[ky] ?? NOTA_MINIMA) >= NOTA_MINIMA; });
  const completou = !todosPassados(e.feitas, e.notas) && todosPassados(feitas, notasDepois);
  const passou = nota === undefined || nota >= NOTA_MINIMA;
  const r = premiar(e, cap.id, xpGanho, completou ? [{ tipo: 'normal', motivo: 'extras' }] : [], primeiraVez, feitas, agora, passou);
  const estado = nota === undefined ? r.estado : { ...r.estado, notas: { ...r.estado.notas, [k]: notasDepois[k] } };
  return { ...r, estado, erros, xpSemErros: cheio };
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
  /** maior nota (0–10): "capitulo" = prova; "capitulo:fase" e "capitulo:extra-x" = outras fases e jogos extras */
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
  /** Revisão do Ará: id da pergunta → caixa (0–4) e dia em que ela volta. Fica só no aparelho. */
  revisao: Record<string, { caixa: number; proxima: string }>;
  /** Fase "ouvir" pela metade: id do capítulo → temas já ouvidos. Fica só no aparelho; some ao terminar a fase. */
  ouvidos: Record<string, number[]>;
  /** Missões do dia (src/lib/missoes.ts). Fica só no aparelho. */
  missoes: { dia: string; lista: string[]; progresso: Record<string, number> } | null;
  /** ids dos pacotes de marco de sequência já ganhos (para não ganhar duas vezes). Fica só no aparelho. */
  marcos: string[];
}

export const estadoInicial = (): Estado => ({
  perfil: null, xp: 0, feitas: {}, notas: {}, pacotes: [], cartas: {}, dias: [], abertos: [], semNovo: 0, pacoteDia: '', compras: [], desejo: null, revisao: {}, ouvidos: {}, missoes: null, marcos: [],
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

/** Quantos dias separam dois dias "AAAA-MM-DD". */
function entre(a: string, b: string) {
  const [x, y] = [a, b].map((t) => { const [ano, m, d] = t.split('-').map(Number); return Date.UTC(ano, m - 1, d); });
  return Math.round((y - x) / 86_400_000);
}

/**
 * Sequência de dias estudando, contando até hoje (ou até ontem, se ainda não estudou hoje).
 * Regra de docs/ESTUDOS.md: faltar 1 dia por semana não quebra a sequência (a folga não conta como dia estudado).
 * Devolve os dias estudados e o primeiro dia da sequência.
 */
export function sequenciaInfo(dias: string[], agora = new Date()): { dias: number; inicio: string | null } {
  const set = new Set(dias);
  const d = new Date(agora);
  if (!set.has(hoje(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  let inicio: string | null = null;
  let folga: string | null = null;
  for (let i = 0; i < 800; i++) {
    const dia = hoje(d);
    if (set.has(dia)) { n++; inicio = dia; d.setDate(d.getDate() - 1); continue; }
    // Faltou este dia: vira folga se o dia antes foi estudado e a última folga foi há 7 dias ou mais.
    const antes = new Date(d); antes.setDate(antes.getDate() - 1);
    if (!set.has(hoje(antes)) || (folga && entre(dia, folga) < 7)) break;
    folga = dia;
    d.setDate(d.getDate() - 1);
  }
  return { dias: n, inicio };
}

/** Dias de estudo seguidos (com 1 folga por semana). */
export const sequencia = (dias: string[], agora = new Date()) => sequenciaInfo(dias, agora).dias;

/** Por que a criança ganhou o pacote. */
export type MotivoPacote = 'fase' | 'prova' | 'dia' | 'nivel' | 'extras' | 'missoes' | 'marco';

export interface Resultado {
  estado: Estado;
  xpGanho: number;
  subiuNivel: boolean;
  /** pacotes ganhos nesta fase (pode ser mais de um) */
  pacotesGanhos: { tipo: TipoPacote; motivo: MotivoPacote }[];
  primeiraVez: boolean;
  /** quantos erros a criança teve (cada um tira 10% do XP) */
  erros?: number;
  /** XP que ganharia sem nenhum erro */
  xpSemErros?: number;
  /** a fase tem pacote esperando, mas faltou nota 7 para ganhar */
  faltouPacote?: boolean;
  /** missão do dia que esta atividade completou (veja src/lib/missoes.ts) */
  missao?: { texto: string; feitas: number; total: number };
}

let contador = 0;
export const novoId = () => `p${Date.now().toString(36)}${(contador++).toString(36)}`;

/**
 * Registra uma fase terminada. Na primeira vez dá XP cheio (e pacote, se for o caso);
 * repetir a fase dá metade do XP. Cada erro tira 10% do XP (mínimo 20%).
 * A prova só conta como feita com nota ≥ 7.
 * Pacotes: memória e quiz com nota 7 ou mais (normal, uma vez só), prova aprovada na 1ª vez (épico),
 * a 1ª fase do dia com nota 7 ou mais (normal) e cada nível novo (normal).
 */
export function concluirFase(e: Estado, cap: string, f: Fase, nota?: number, agora = new Date(), erros = 0): Resultado {
  const k = chave(cap, f);
  // Nota 7 ou mais (7 de cada 10 certas) para ganhar pacote. Fase sem nota (ouvir) sempre passa.
  const passou = nota === undefined || nota >= NOTA_MINIMA;
  const aprovado = f !== 'prova' || passou;
  const primeiraVez = aprovado && !e.feitas[k];
  const base = FASE_INFO[f].xp;
  const cheio = aprovado ? (primeiraVez ? base : Math.round(base / 2)) : Math.round(base / 4);
  // Prova reprovada já ganha só 1/4: não desconta de novo pelos erros.
  const xpGanho = aprovado ? xpComErros(cheio, erros) : cheio;
  const d = hoje(agora);
  const pacotesGanhos: Resultado['pacotesGanhos'] = [];
  // O pacote da fase (memória, quiz) fica guardado até a criança tirar nota 7.
  // notas['cap:fase'] guarda a melhor nota; abaixo de 7 quer dizer que o pacote ainda está esperando.
  const nk = `${cap}:${f}`;
  const temPacote = FASES_COM_PACOTE.includes(f);
  const pacoteEsperando = primeiraVez || (e.notas[nk] !== undefined && e.notas[nk] < NOTA_MINIMA);
  if (temPacote && pacoteEsperando && passou) pacotesGanhos.push({ tipo: 'normal', motivo: 'fase' });
  if (primeiraVez && f === 'prova') pacotesGanhos.push({ tipo: 'epico', motivo: 'prova' });
  const ganhaDoDia = passou && e.pacoteDia !== d;
  if (ganhaDoDia) pacotesGanhos.push({ tipo: 'normal', motivo: 'dia' });
  const subiuNivel = nivel(e.xp + xpGanho).nivel > nivel(e.xp).nivel;
  if (subiuNivel) pacotesGanhos.push({ tipo: 'normal', motivo: 'nivel' });

  const estado: Estado = {
    ...e,
    xp: e.xp + xpGanho,
    feitas: aprovado ? { ...e.feitas, [k]: true } : e.feitas,
    notas: nota === undefined ? e.notas
      : f === 'prova' ? { ...e.notas, [cap]: Math.max(nota, e.notas[cap] ?? 0) }
      : { ...e.notas, [nk]: Math.max(nota, e.notas[nk] ?? 0) },
    pacotes: [...e.pacotes, ...pacotesGanhos.map((p) => ({ id: novoId(), tipo: p.tipo, capitulo: cap }))],
    dias: e.dias.includes(d) ? e.dias : [...e.dias, d],
    pacoteDia: ganhaDoDia ? d : e.pacoteDia,
  };
  return { estado, xpGanho, subiuNivel, pacotesGanhos, primeiraVez, erros: aprovado ? erros : 0, xpSemErros: cheio,
    faltouPacote: temPacote && pacoteEsperando && !passou };
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
export const notaDe = (acertos: number, total: number) => (total > 0 ? Math.round((acertos / total) * 20) / 2 : 0);

/** Estrelas do resultado (iguais em todos os jogos): 3 = nota 10, 2 = nota 7 ou mais, 1 = abaixo de 7. */
export const estrelasDaNota = (nota: number) => (nota >= 10 ? 3 : nota >= NOTA_MINIMA ? 2 : 1);

/** Melhor nota guardada de uma fase ou jogo extra (a prova fica na chave do capítulo). Ouvir não tem nota. */
export function melhorNota(e: Estado, cap: string, item: Fase | Extra): number | undefined {
  if (item === 'prova') return e.notas[cap];
  if (item === 'ouvir') return undefined;
  return e.notas[(EXTRAS as string[]).includes(item) ? chaveExtra(cap, item as Extra) : chave(cap, item as Fase)];
}

/** Estrelas da melhor vez (0 = ainda não tem nota). A prova só conta depois de aprovada. */
export function estrelasDe(e: Estado, cap: string, item: Fase | Extra): number {
  const n = melhorNota(e, cap, item);
  if (n === undefined) return 0;
  if (item === 'prova' && !e.feitas[chave(cap, 'prova')]) return 0;
  return estrelasDaNota(n);
}

/** Estrelas juntadas no mundo (fases com nota + jogos extras) e o máximo possível. */
export function estrelasDoMundo(e: Estado, cap: Capitulo) {
  const itens: (Fase | Extra)[] = [...FASES.filter((f) => f !== 'ouvir'), ...extrasDo(cap)];
  return { tem: itens.reduce((s, i) => s + estrelasDe(e, cap.id, i), 0), max: itens.length * 3 };
}
