// Datas das provas da escola: o professor (ou o adulto da família) marca o dia da prova de cada capítulo.
// Antes da data, o capítulo fica em destaque ("Prova em 5 dias!"). Depois, vai para "Já teve prova":
// continua aberto e valendo os mesmos XP e pacotes, para quem chegou depois ou quer revisar.

/** capítulo → data da prova (AAAA-MM-DD) */
export type DatasProva = Record<string, string>;

export type Situacao = { tipo: 'chegando'; dias: number } | { tipo: 'passou' } | { tipo: 'sem' };

const FORMATO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A data existe de verdade no calendário (nada de 31/02). */
export function dataValida(s: unknown): s is string {
  const m = typeof s === 'string' ? FORMATO.exec(s) : null;
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/** Quantos dias faltam de `hoje` até `data` (as duas no formato AAAA-MM-DD). Negativo = já passou. */
export function diasAte(data: string, hoje: string): number {
  const ms = (s: string) => { const [a, m, d] = s.split('-').map(Number); return Date.UTC(a, m - 1, d); };
  return Math.round((ms(data) - ms(hoje)) / 86_400_000);
}

export function situacao(datas: DatasProva | undefined, cap: string, hoje: string): Situacao {
  const data = datas?.[cap];
  if (!data || !dataValida(data)) return { tipo: 'sem' };
  const dias = diasAte(data, hoje);
  return dias >= 0 ? { tipo: 'chegando', dias } : { tipo: 'passou' };
}

/** Frase curta para a criança. */
export function textoProva(s: Situacao): string | null {
  if (s.tipo === 'sem') return null;
  if (s.tipo === 'passou') return 'Já teve prova';
  return s.dias === 0 ? 'Prova hoje!' : s.dias === 1 ? 'Prova amanhã!' : `Prova em ${s.dias} dias`;
}

/**
 * Ordem dos capítulos: a ordem do livro (8, 9, 10...), e os que já tiveram prova vão para o fim.
 * A data da prova só aparece no selo, não muda a ordem (Lucas, 06/11/2026: a unidade 9 com prova
 * marcada ia para antes da 8 e o "Continuar" pulava para ela).
 */
export function ordenarCapitulos<T extends { id: string }>(caps: T[], datas: DatasProva | undefined, hoje: string): T[] {
  const peso = (c: T) => (situacao(datas, c.id, hoje).tipo === 'passou' ? 1 : 0);
  return caps.map((c, i) => ({ c, i, p: peso(c) })).sort((a, b) => a.p - b.p || a.i - b.i).map((x) => x.c);
}

/**
 * Unidades com prova hoje ou amanhã (Lucas, 13/11/2026: no dia da prova de Ciências o "Continuar"
 * mostrava Matemática). Elas passam na frente no "Continuar"; a mais perto primeiro, depois a ordem do livro.
 * A lista das unidades (mapa) continua na ordem do livro.
 */
export function provasPerto<T extends { id: string }>(caps: T[], datas: DatasProva | undefined, hoje: string): T[] {
  const dias = (c: T) => { const s = situacao(datas, c.id, hoje); return s.tipo === 'chegando' && s.dias <= 1 ? s.dias : null; };
  return caps.map((c, i) => ({ c, i, d: dias(c) })).filter((x) => x.d !== null)
    .sort((a, b) => a.d! - b.d! || a.i - b.i).map((x) => x.c);
}

/** "12/11" para mostrar a data ao adulto e à criança. */
export const diaMes = (data: string) => `${data.slice(8, 10)}/${data.slice(5, 7)}`;
