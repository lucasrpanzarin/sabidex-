import type { Capitulo } from './tipos';
import { historia9 } from './historia9';
import { historia10 } from './historia10';
import { matematica9 } from './matematica9';
import { matematica10 } from './matematica10';

/**
 * Matérias de cada turma (Lucas, 05/11/2026): cada turma estuda o livro dela.
 * Uma turma do servidor aponta para um destes pela coluna `turmas.conteudo`
 * (quem escolhe é o dono do app, no Painel do dono). Turma sem conteúdo não mostra jogos.
 * Capítulo novo: crie o arquivo em `src/data/` e coloque aqui no conteúdo da turma certa.
 */
export interface Conteudo { id: string; nome: string; capitulos: Capitulo[] }

export const conteudos: Conteudo[] = [
  { id: 'educativa-4b', nome: 'Educativa · 4º ano B', capitulos: [historia9, historia10, matematica9, matematica10] },
];

/** Todos os capítulos que existem (para conferências e para o servidor validar o progresso). */
export const capitulos: Capitulo[] = [...new Map(conteudos.flatMap((c) => c.capitulos).map((c) => [c.id, c])).values()];

export function conteudoPorId(id: string | null | undefined): Conteudo | undefined {
  return id ? conteudos.find((c) => c.id === id) : undefined;
}

/** Capítulos de um conteúdo (vazio se a turma ainda não tem matérias). */
export const capitulosDe = (id: string | null | undefined): Capitulo[] => conteudoPorId(id)?.capitulos ?? [];

/** Matérias que já têm capítulos, na ordem em que aparecem. */
export const materiasDe = (caps: Capitulo[]): string[] => [...new Set(caps.map((c) => c.materia))];

export function capituloPorId(id: string): Capitulo | undefined {
  return capitulos.find((c) => c.id === id);
}

export { sabimons, sabimonPorId } from './sabimons';
