// Desafio do dia (Lucas, 12/11/2026): um desafio de 10 perguntas por matéria, todo dia.
// As perguntas saem das unidades que a criança já começou (ouviu os temas), misturadas.
// Nada é inventado: usa as perguntas que já existem no capítulo (quiz, prova, complete a frase,
// palavras e significados, quem sou eu) e, em Matemática, contas novas dos mesmos tipos.
// O sorteio depende do dia e da matéria: a turma toda recebe o mesmo desafio no mesmo dia.
// Nota 7 ou mais dá 1 pacote por matéria por dia (id fixo: nunca vem em dobro, nem em dois aparelhos).
// Funções puras, para poder testar.

import type { Afirmacao, Capitulo } from '../data/tipos';
import { gerarConta, semente, type Conta } from './contas';
import { NOTA_MINIMA, chave, embaralhar, hoje, notaDe, premiar, type Estado, type Resultado } from './jogo';
import { idConta, idProva, idQuiz } from './revisao';

export const PERGUNTAS_DESAFIO = 10;
export const XP_POR_ACERTO_DESAFIO = 8;

export type ItemDesafio =
  | { tipo: 'quiz'; id: string; cap: Capitulo; q: Afirmacao }
  | { tipo: 'escolha'; id?: string; cap: Capitulo; pergunta: string; opcoes: string[]; certa: number; explicacao: string }
  | { tipo: 'conta'; id: string; cap: Capitulo; q: Conta };

/** "Ciências" → "ciencias" (para o id do pacote). */
export const slugMateria = (m: string) => m.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** Id fixo do pacote do desafio: um por matéria por dia. */
export const idPacoteDesafio = (materia: string, dia: string) => `desafio-${slugMateria(materia)}-${dia}`;

/** Número que sai sempre igual para o mesmo texto. */
function hash(t: string) {
  let h = 2166136261;
  for (const c of t) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Unidades da matéria que a criança já começou (ouviu os temas / viu como se faz). */
export const unidadesDoDesafio = (e: Estado, caps: Capitulo[], materia: string) =>
  caps.filter((c) => c.materia === materia && !!e.feitas[chave(c.id, 'ouvir')]);

/** Matérias da turma, cada uma dizendo se já dá para fazer o desafio. */
export function materiasDoDesafio(e: Estado, caps: Capitulo[]) {
  const materias = [...new Set(caps.map((c) => c.materia))];
  return materias.map((m) => ({ materia: m, pode: unidadesDoDesafio(e, caps, m).length > 0 }));
}

/** Todas as perguntas que um capítulo (não de Matemática) pode dar ao desafio. */
function perguntasDo(cap: Capitulo, rng: () => number): ItemDesafio[] {
  const lista: ItemDesafio[] = [];
  const opcoes = (certa: string, erradas: string[]) => {
    const todas = embaralhar([certa, ...erradas.slice(0, 3)], rng);
    return { opcoes: todas, certa: todas.indexOf(certa) };
  };
  cap.quiz.forEach((q, i) => lista.push({ tipo: 'quiz', id: idQuiz(cap.id, i), cap, q }));
  cap.prova.forEach((q, i) => {
    const o = opcoes(q.opcoes[q.certa], q.opcoes.filter((_, k) => k !== q.certa));
    lista.push({ tipo: 'escolha', id: idProva(cap.id, i), cap, pergunta: q.pergunta, ...o, explicacao: q.explicacao });
  });
  for (const l of cap.lacunas ?? []) {
    lista.push({ tipo: 'escolha', cap, pergunta: `Complete a frase: ${l.frase}`, ...opcoes(l.resposta, l.distratores),
      explicacao: l.frase.replace('___', `**${l.resposta}**`) });
  }
  for (const p of cap.pares) {
    const outras = embaralhar(cap.pares.filter((x) => x !== p), rng).map((x) => x.significado);
    if (outras.length < 3) continue;
    lista.push({ tipo: 'escolha', cap, pergunta: `O que quer dizer **${p.palavra}**?`, ...opcoes(p.significado, outras),
      explicacao: '' });
  }
  for (const s of cap.quemSou ?? []) {
    lista.push({ tipo: 'escolha', cap, pergunta: `Quem sou eu? ${s.pistas.join(' ')}`, ...opcoes(s.resposta, s.distratores),
      explicacao: '' });
  }
  return lista;
}

/** Contas de Matemática: tipos das unidades começadas, com números novos. */
function contasDe(caps: Capitulo[], rng: () => number, n: number): ItemDesafio[] {
  const tipos = caps.flatMap((cap) => {
    const m = cap.matematica;
    return m ? [...new Set([...m.treino, ...m.desafio, ...m.prova])].map((tipo) => ({ cap, tipo })) : [];
  });
  if (!tipos.length) return [];
  const saida: ItemDesafio[] = [];
  let fila: typeof tipos = [];
  for (let tentativa = 0; saida.length < n && tentativa < n * 5; tentativa++) {
    if (!fila.length) fila = embaralhar(tipos, rng);
    const t = fila.shift()!;
    const q = gerarConta(t.tipo, rng);
    if (q) saida.push({ tipo: 'conta', id: idConta(t.cap.id, t.tipo), cap: t.cap, q });
  }
  return saida;
}

/**
 * Monta o desafio de hoje da matéria. Mesmo dia + mesma matéria + mesmas unidades = mesmo desafio.
 * `tentativa` muda as perguntas quando a criança tenta de novo (para não decorar a ordem).
 */
export function montarDesafio(e: Estado, caps: Capitulo[], materia: string, dia: string, tentativa = 0): ItemDesafio[] {
  const unidades = unidadesDoDesafio(e, caps, materia);
  if (!unidades.length) return [];
  const rng = semente(hash(`${dia}:${materia}:${tentativa}`));
  if (unidades.some((c) => c.matematica)) return contasDe(unidades, rng, PERGUNTAS_DESAFIO);
  // Mistura as unidades: uma pergunta de cada, em rodízio.
  const filas = unidades.map((c) => embaralhar(perguntasDo(c, rng), rng));
  const saida: ItemDesafio[] = [];
  while (saida.length < PERGUNTAS_DESAFIO && filas.some((f) => f.length)) {
    for (const f of filas) if (f.length && saida.length < PERGUNTAS_DESAFIO) saida.push(f.shift()!);
  }
  return embaralhar(saida, rng);
}

/** Como está o desafio de hoje desta matéria. */
export function situacaoDesafio(e: Estado, materia: string, agora = new Date()) {
  const dia = hoje(agora);
  const id = idPacoteDesafio(materia, dia);
  const hojeGuardado = e.desafios?.dia === dia ? e.desafios.feitos[materia] : undefined;
  const ganhou = e.abertos.includes(id) || e.pacotes.some((p) => p.id === id);
  return { feito: ganhou, tentativas: hojeGuardado?.tentativas ?? 0, nota: hojeGuardado?.nota };
}

/**
 * Fecha o desafio: 8 XP por acerto (+10 por terminar; metade se for nova tentativa no dia),
 * conta o dia de estudo, o pacote do dia e o de nível novo (como na revisão),
 * e com nota 7 ou mais o pacote do desafio da matéria (uma vez por dia).
 */
export function concluirDesafio(e: Estado, materia: string, acertos: number, total: number, cap: string, agora = new Date()): Resultado {
  const dia = hoje(agora);
  const nota = notaDe(acertos, total);
  const passou = nota >= NOTA_MINIMA;
  const s = situacaoDesafio(e, materia, agora);
  const cheio = acertos * XP_POR_ACERTO_DESAFIO + (total ? 10 : 0);
  const xpGanho = s.tentativas > 0 ? Math.round(cheio / 2) : cheio;
  const r = premiar(e, cap, xpGanho, [], s.tentativas === 0, e.feitas, agora, passou);
  const id = idPacoteDesafio(materia, dia);
  const ganha = passou && !s.feito;
  const anteriores = e.desafios?.dia === dia ? e.desafios.feitos : {};
  const antes = anteriores[materia];
  const desafios = { dia, feitos: { ...anteriores, [materia]: { tentativas: s.tentativas + 1, nota: Math.max(nota, antes?.nota ?? 0) } } };
  return {
    ...r,
    pacotesGanhos: ganha ? [...r.pacotesGanhos, { tipo: 'normal', motivo: 'desafio' }] : r.pacotesGanhos,
    estado: { ...r.estado, desafios, pacotes: ganha ? [...r.estado.pacotes, { id, tipo: 'normal', capitulo: 'desafio' }] : r.estado.pacotes },
  };
}

/**
 * Desafio pela metade (Lucas, 12/11/2026): se a criança sai no meio (botão "Início" ou fecha o app),
 * ao voltar ela continua de onde parou, com as mesmas perguntas e os acertos que já tinha.
 * Fica só no aparelho, um por perfil. `marca` confere que as perguntas são as mesmas
 * (se ela começou outra unidade nesse meio tempo, as perguntas mudam e o desafio começa do zero).
 */
export interface AndamentoDesafio { dia: string; materia: string; marca: string; i: number; acertos: number }

/** Impressão digital das perguntas de um desafio (mesmas perguntas = mesma marca). */
export const marcaDoDesafio = (itens: ItemDesafio[]) =>
  String(hash(JSON.stringify(itens.map(({ cap, ...resto }) => [cap.id, resto]))));

/** De onde continuar: só vale no mesmo dia, na mesma matéria e com as mesmas perguntas. */
export function continuarDe(salvo: AndamentoDesafio | null | undefined, itens: ItemDesafio[], materia: string, dia: string) {
  if (!salvo || salvo.dia !== dia || salvo.materia !== materia || salvo.marca !== marcaDoDesafio(itens)) return { i: 0, acertos: 0, voltou: false };
  const i = Math.max(0, Math.min(salvo.i, itens.length));
  return { i, acertos: Math.max(0, Math.min(salvo.acertos, i)), voltou: i > 0 };
}
