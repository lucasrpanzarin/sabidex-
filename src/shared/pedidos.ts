// Pedidos para entrar numa turma (Lucas, 05/11/2026).
// O adulto busca a turma pelo nome ou pela escola e pede para o filho entrar;
// o dono de uma turma repetida pode pedir para juntar com outra. Um administrador da turma aprova.
// Em nenhum caso a criança perde cartas ou progresso: a conta é a mesma, só muda o grupo.

/** Letras mínimas para buscar (ninguém vê a lista inteira de turmas). */
export const MIN_BUSCA = 3;
/** Resultados por busca. */
export const MAX_RESULTADOS = 10;
/** Pedidos esperando resposta, por adulto. */
export const MAX_PEDIDOS_ESPERANDO = 5;
/** Crianças por turma (o mesmo limite de quando entra pelo código). */
export const MAX_NA_TURMA = 60;
/** Pedidos respondidos continuam aparecendo para quem pediu por alguns dias. */
export const MOSTRAR_RESPONDIDOS_MS = 7 * 86_400_000;

/** Tira acentos, deixa minúsculo e junta espaços: "Colégio  Educativa" → "colegio educativa". */
export const chaveBusca = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9ºª]+/g, ' ').trim();

/** O texto guardado na turma para a busca achar pelo nome ou pela escola. */
export const textoBusca = (nome: string, escola: string) => chaveBusca(`${nome} ${escola}`);

/** Palavras da busca (cada uma precisa aparecer). Vazio se a busca é curta demais. */
export function termosBusca(q: string): string[] {
  const chave = chaveBusca(q);
  if (chave.replace(/ /g, '').length < MIN_BUSCA) return [];
  return chave.split(' ').filter(Boolean).slice(0, 5);
}

/** Nome da escola como foi digitado, sem espaços sobrando. */
export const normalizarEscola = (s: string) => s.trim().replace(/\s+/g, ' ').slice(0, 60);

/**
 * Apelido que ainda não existe na turma. Se já tem uma "Ana", a nova vira "Ana 2" (ou "Ana 3"...).
 * `usados` são as chaves (sem acento, minúsculas) dos apelidos da turma.
 */
export function apelidoLivre(apelido: string, usados: Set<string>, chave: (s: string) => string): string {
  if (!usados.has(chave(apelido))) return apelido;
  for (let n = 2; n < 100; n++) {
    const fim = ` ${n}`;
    const novo = apelido.slice(0, 14 - fim.length).trimEnd() + fim;
    if (!usados.has(chave(novo))) return novo;
  }
  return apelido.slice(0, 9) + ' ' + Math.random().toString(36).slice(2, 6);
}
