import type { Capitulo, Carta } from './tipos';
import { historia9 } from './historia9';
import { historia10 } from './historia10';

/** Capítulos na ordem em que aparecem no app. Adicione novos aqui. */
export const capitulos: Capitulo[] = [historia9, historia10];

export const todasCartas: Carta[] = capitulos.flatMap((c) => c.cartas);

export function capituloPorId(id: string): Capitulo | undefined {
  return capitulos.find((c) => c.id === id);
}
