// Números da carta de cada Sabimon: Vida, força dos poderes, cores e evolução.
// Tudo calculado aqui para ser fácil de ajustar num lugar só.

import type { Raridade, Sabimon, TipoSabimon } from '../data/tipos';

export type Forma = 1 | 2 | 3;

export const COR_TIPO: Record<TipoSabimon, string> = {
  Fogo: '#FB923C', Água: '#60A5FA', Planta: '#4ADE80', Raio: '#FACC15', Pedra: '#C08457',
  Vento: '#5EEAD4', Areia: '#E7C89A', Gelo: '#7DD3FC', Som: '#F472B6', Estrela: '#818CF8',
};

/** Cores do corpo da carta por tipo: claro (em cima) e escuro (embaixo). */
export const TEMA_TIPO: Record<TipoSabimon, { claro: string; escuro: string; classe: string }> = {
  Fogo: { claro: '#FDBA74', escuro: '#C2410C', classe: 'fogo' },
  Água: { claro: '#7DD3FC', escuro: '#1D4ED8', classe: 'agua' },
  Planta: { claro: '#86EFAC', escuro: '#15803D', classe: 'planta' },
  Raio: { claro: '#FDE68A', escuro: '#CA8A04', classe: 'raio' },
  Pedra: { claro: '#D6B48C', escuro: '#7C4A26', classe: 'pedra' },
  Vento: { claro: '#99F6E4', escuro: '#0F766E', classe: 'vento' },
  Areia: { claro: '#F5DEB3', escuro: '#A16207', classe: 'areia' },
  Gelo: { claro: '#E0F2FE', escuro: '#3B82C4', classe: 'gelo' },
  Som: { claro: '#F9A8D4', escuro: '#BE185D', classe: 'som' },
  Estrela: { claro: '#A5B4FC', escuro: '#1E1B6B', classe: 'estrela' },
};

export const ROTULO: Record<Raridade, string> = {
  comum: '★ Comum', rara: '★★ Rara', epica: '★★★ Épica', lendaria: '★★★★ Lendária',
};

const VIDA_BASE: Record<Raridade, number> = { comum: 50, rara: 60, epica: 70, lendaria: 90 };
const VIDA_FORMA: Record<Forma, number> = { 1: 0, 2: 30, 3: 70 };
const FORCA_BASE: Record<Raridade, number> = { comum: 10, rara: 20, epica: 30, lendaria: 20 };
const FORCA_FORMA: Record<Forma, number> = { 1: 1, 2: 1.7, 3: 2.6 };

export const vida = (s: Sabimon, forma: Forma) => VIDA_BASE[s.raridade] + VIDA_FORMA[forma];

/** Força do poder `i` (0 ou 1), arredondada de 10 em 10. */
export const forca = (s: Sabimon, forma: Forma, i: 0 | 1) =>
  Math.round(((FORCA_BASE[s.raridade] + i * 10) * FORCA_FORMA[forma]) / 10) * 10;

/** Total de cópias necessárias para chegar em cada forma (a 1ª cópia já é a forma 1). */
export const COPIAS_PARA: Record<Forma, number> = { 1: 1, 2: 3, 3: 6 };
