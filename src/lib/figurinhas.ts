// As 60 figurinhas do álbum: cada forma de cada Sabimon é uma carta separada.
// Ids das cartas: forma 1 = "s001" (é a que vem nos pacotes), forma 2 = "s001-2", forma 3 = "s001-3".
// Número no álbum: Brasinho (s001 forma 1) = 1, Brasão = 2, Fornalhuda = 3, Pingoró = 4...

import { sabimons } from '../data/sabimons';
import type { Sabimon } from '../data/tipos';
import type { Forma } from './sabimon';

export interface Figurinha {
  /** id da carta (chave em `cartas`) */
  id: string;
  s: Sabimon;
  forma: Forma;
  /** número no álbum, de 1 a 60 */
  numero: number;
}

export const idCarta = (sabimonId: string, forma: Forma) => (forma === 1 ? sabimonId : `${sabimonId}-${forma}`);

/** Todas as figurinhas, na ordem do álbum. */
export const FIGURINHAS: Figurinha[] = sabimons
  .slice().sort((a, b) => a.numero - b.numero)
  .flatMap((s) => ([1, 2, 3] as Forma[]).map((forma) => ({ id: idCarta(s.id, forma), s, forma, numero: (s.numero - 1) * 3 + forma })));

export const figurinhaPorId = new Map(FIGURINHAS.map((f) => [f.id, f]));

/** Ids de todas as cartas (para trocas e para guardar). */
export const IDS_CARTAS = new Set(FIGURINHAS.map((f) => f.id));
/** Só as cartas que vêm nos pacotes (forma 1). */
export const IDS_PACOTE = new Set(sabimons.map((s) => s.id));

/** Próxima forma da carta (ou nada, se já é a forma 3). */
export const proxima = (f: Figurinha) => (f.forma < 3 ? figurinhaPorId.get(idCarta(f.s.id, (f.forma + 1) as Forma)) : undefined);
