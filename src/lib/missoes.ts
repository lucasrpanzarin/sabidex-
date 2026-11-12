// Missões do dia e marcos de sequência (decididos pelo Lucas em 05/11/2026).
// - 3 missões curtas de estudo por dia (trocam a cada dia). Cada atividade com nota 7 ou mais vale para UMA missão.
//   Fazer as 3 dá 1 pacote.
// - Marcos de sequência: 3, 7, 14 e 30 dias de estudo seguidos dão 1 pacote cada (uma vez por sequência).
// Os ids dos pacotes são fixos (dia / começo da sequência), então dois aparelhos nunca dão pacote em dobro.
// Funções puras, para poder testar.

import { FASES, NOTA_MINIMA, chave, embaralhar, hoje, sequenciaInfo, type Estado, type Fase, type Resultado } from './jogo';

/** O que a criança acabou de fazer. `nota` de 0 a 10 (ouvir não tem nota). */
export type Evento =
  | { tipo: 'fase'; fase: Fase; nota?: number }
  | { tipo: 'extra'; nota: number }
  | { tipo: 'revisao'; nota: number }
  | { tipo: 'desafio'; nota: number };

export type MissaoId = 'revisao' | 'estrelas' | 'extra' | 'memoria' | 'linha' | 'quiz' | 'fase' | 'duas';

interface Missao {
  texto: string;
  /** quantas atividades precisa */
  alvo: number;
  /** a criança já tem como fazer esta missão? */
  pode: (e: Estado, dia: string) => boolean;
  /** esta atividade (já com nota 7 ou mais) vale para a missão? */
  vale: (ev: Evento) => boolean;
}

const algumCap = (e: Estado, f: Fase) => Object.keys(e.feitas).some((k) => k.endsWith(`:${f}`));

export const MISSOES: Record<MissaoId, Missao> = {
  revisao: { texto: 'Faça a Revisão do Ará', alvo: 1,
    pode: (e, dia) => Object.values(e.revisao ?? {}).some((r) => r.proxima <= dia), vale: (ev) => ev.tipo === 'revisao' },
  estrelas: { texto: 'Ganhe 3 estrelas em um jogo', alvo: 1,
    pode: (e) => algumCap(e, 'ouvir'), vale: (ev) => ev.tipo !== 'revisao' && ev.nota === 10 },
  extra: { texto: 'Jogue um jogo extra', alvo: 1, pode: (e) => algumCap(e, 'ouvir'), vale: (ev) => ev.tipo === 'extra' },
  memoria: { texto: 'Jogue o Jogo da memória', alvo: 1, pode: (e) => algumCap(e, 'ouvir'), vale: (ev) => ev.tipo === 'fase' && ev.fase === 'memoria' },
  linha: { texto: 'Jogue a Linha do tempo', alvo: 1, pode: (e) => algumCap(e, 'memoria'), vale: (ev) => ev.tipo === 'fase' && ev.fase === 'linha' },
  quiz: { texto: 'Jogue o Quiz relâmpago', alvo: 1, pode: (e) => algumCap(e, 'linha'), vale: (ev) => ev.tipo === 'fase' && ev.fase === 'quiz' },
  fase: { texto: 'Termine uma fase de uma unidade', alvo: 1, pode: () => true, vale: (ev) => ev.tipo === 'fase' },
  duas: { texto: 'Faça 2 atividades de estudo', alvo: 2, pode: () => true, vale: () => true },
};

/** Ordem para dar o crédito: a missão mais difícil de encaixar primeiro. */
const PREFERENCIA: MissaoId[] = ['estrelas', 'revisao', 'quiz', 'linha', 'memoria', 'extra', 'fase', 'duas'];

/** Marcos de sequência que dão pacote. */
export const MARCOS = [3, 7, 14, 30];

/** Número que sai sempre igual para o mesmo dia (para as missões não mudarem ao abrir de novo). */
function sorteDoDia(dia: string) {
  let h = 2166136261;
  for (const c of dia) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}

/** Escolhe as missões do dia: a revisão entra sempre que tiver; o resto é sorteado entre as que a criança já consegue fazer. */
export function escolherMissoes(e: Estado, dia: string): MissaoId[] {
  const podem = (Object.keys(MISSOES) as MissaoId[]).filter((m) => MISSOES[m].pode(e, dia));
  const lista: MissaoId[] = podem.includes('revisao') ? ['revisao'] : [];
  // "Termine uma fase" e "2 atividades" são parecidas: só uma das duas por dia.
  let resto = embaralhar(podem.filter((m) => m !== 'revisao'), sorteDoDia(dia));
  const dupla = resto.find((m) => m === 'fase' || m === 'duas');
  if (dupla && resto.length + lista.length > 3) resto = resto.filter((m) => m === dupla || (m !== 'fase' && m !== 'duas'));
  for (const m of resto) if (lista.length < 3) lista.push(m);
  return lista;
}

type Missoes = NonNullable<Estado['missoes']>;

/** As missões guardadas de hoje (ou escolhidas agora), sem trocar nada. */
function guardadasDeHoje(e: Estado, dia: string): Missoes {
  if (e.missoes?.dia === dia) return e.missoes;
  return { dia, lista: escolherMissoes(e, dia), progresso: {} };
}

/**
 * A revisão de hoje pode acabar sem a missão ficar feita (ex.: 2 perguntas, 1 certa = nota 5).
 * Aí não sobra nada para revisar e a missão ficaria impossível: troca por outra que a criança consegue fazer.
 */
function trocarRevisaoSemNada(e: Estado, m: Missoes): Missoes {
  if (!m.lista.includes('revisao') || missaoFeita(m, 'revisao') || MISSOES.revisao.pode(e, m.dia)) return m;
  const outras = m.lista.filter((id) => id !== 'revisao');
  const temPar = outras.includes('fase') || outras.includes('duas');
  const podem = (Object.keys(MISSOES) as MissaoId[])
    .filter((id) => id !== 'revisao' && !outras.includes(id) && MISSOES[id].pode(e, m.dia));
  // "Termine uma fase" e "2 atividades" são parecidas: só uma das duas, se der.
  const opcoes = embaralhar(podem, sorteDoDia(`${m.dia}-troca`));
  const nova = opcoes.find((id) => !(temPar && (id === 'fase' || id === 'duas'))) ?? opcoes[0];
  return { ...m, lista: m.lista.map((id) => (id === 'revisao' ? nova : id)).filter((id): id is string => !!id) };
}

/** As missões de hoje (já guardadas ou escolhidas agora). */
export function missoesDeHoje(e: Estado, agora = new Date()): Missoes {
  return trocarRevisaoSemNada(e, guardadasDeHoje(e, hoje(agora)));
}

export const missaoFeita = (m: NonNullable<Estado['missoes']>, id: string) => (m.progresso[id] ?? 0) >= (MISSOES[id as MissaoId]?.alvo ?? 1);
export const quantasFeitas = (m: NonNullable<Estado['missoes']>) => m.lista.filter((id) => missaoFeita(m, id)).length;

/** Próximo marco de sequência que a criança ainda vai alcançar (ou null depois do último). */
export const proximoMarco = (dias: number) => MARCOS.find((n) => n > dias) ?? null;

/**
 * Soma a atividade às missões do dia e confere os marcos de sequência.
 * `antes` é o estado de antes da atividade (as missões do dia são escolhidas com ele).
 * Só vale com nota 7 ou mais (ou atividade sem nota, como ouvir os temas).
 */
export function aplicarMissoes(antes: Estado, r: Resultado, ev: Evento, agora = new Date()): Resultado {
  const dia = hoje(agora);
  const passou = ev.nota === undefined || ev.nota >= NOTA_MINIMA;
  // Na revisão, `antes` já tem as respostas registradas: não troca a missão da revisão antes de dar o crédito.
  const guardadas = guardadasDeHoje(antes, dia);
  const m = ev.tipo === 'revisao' ? guardadas : trocarRevisaoSemNada(antes, guardadas);
  const progresso = { ...m.progresso };
  const pacotesGanhos = [...r.pacotesGanhos];
  const pacotes = [...r.estado.pacotes];
  const ja = new Set([...r.estado.pacotes.map((p) => p.id), ...r.estado.abertos, ...(r.estado.marcos ?? [])]);
  let missao: Resultado['missao'];

  if (passou) {
    const alvo = PREFERENCIA.find((id) => m.lista.includes(id) && !missaoFeita({ ...m, progresso }, id) && MISSOES[id].vale(ev));
    if (alvo) {
      progresso[alvo] = (progresso[alvo] ?? 0) + 1;
      const nova = { ...m, progresso };
      if (missaoFeita(nova, alvo)) missao = { texto: MISSOES[alvo].texto, feitas: quantasFeitas(nova), total: m.lista.length };
      const id = `missoes-${dia}`;
      if (m.lista.length > 0 && quantasFeitas(nova) === m.lista.length && !ja.has(id)) {
        pacotes.push({ id, tipo: 'normal', capitulo: 'missoes' });
        pacotesGanhos.push({ tipo: 'normal', motivo: 'missoes' });
        ja.add(id);
      }
    }
  }

  const marcos = [...(r.estado.marcos ?? [])];
  if (passou) {
    const s = sequenciaInfo(r.estado.dias, agora);
    for (const n of MARCOS) {
      const id = `marco${n}-${s.inicio}`;
      if (s.inicio && s.dias >= n && !ja.has(id)) {
        pacotes.push({ id, tipo: 'normal', capitulo: 'marco' });
        pacotesGanhos.push({ tipo: 'normal', motivo: 'marco' });
        marcos.push(id);
        ja.add(id);
      }
    }
  }

  return {
    ...r, pacotesGanhos, missao,
    estado: { ...r.estado, pacotes, marcos: marcos.slice(-50), missoes: trocarRevisaoSemNada(r.estado, { ...m, progresso }) },
  };
}

/** Para onde a missão leva quando a criança toca em "Ir". */
export function destinoMissao(e: Estado, id: string, caps: { id: string }[]): string[] {
  const comFase = (f: Fase) => {
    const i = FASES.indexOf(f);
    const c = caps.find((x) => !!e.feitas[chave(x.id, FASES[i - 1])]);
    return c ? ['fase', c.id, f] : null;
  };
  if (id === 'revisao') return ['revisao'];
  if (id === 'memoria' || id === 'linha' || id === 'quiz') return comFase(id) ?? ['mundos'];
  if (id === 'extra') { const c = caps.find((x) => !!e.feitas[chave(x.id, 'ouvir')]); return c ? ['mundo', c.id] : ['mundos']; }
  return [];
}
