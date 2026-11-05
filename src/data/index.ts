import type { Capitulo } from './tipos';
import { historia9 } from './historia9';
import { historia10 } from './historia10';
import { matematica9 } from './matematica9';
import { matematica10 } from './matematica10';

/** Capítulos na ordem em que aparecem no app. Adicione novos aqui. */
export const capitulos: Capitulo[] = [historia9, historia10, matematica9, matematica10];

/** Matérias que já têm capítulos, na ordem em que aparecem. */
export const materias: string[] = [...new Set(capitulos.map((c) => c.materia))];

export function capituloPorId(id: string): Capitulo | undefined {
  return capitulos.find((c) => c.id === id);
}

export { sabimons, sabimonPorId } from './sabimons';
