// Voz que lê os temas. A escolha fica salva no aparelho.
import { useSyncExternalStore } from 'react';

export const VOZES = [
  { id: 'nina', nome: 'Nina', descricao: 'Professora', cor: '#F472B6' },
  { id: 'otto', nome: 'Otto', descricao: 'Professor', cor: '#22D3EE' },
  { id: 'graziella', nome: 'Graziella', descricao: 'Jovem animada', cor: '#FACC15' },
] as const;
export type IdVoz = (typeof VOZES)[number]['id'];

const K = 'sabidex:voz';
let atual: IdVoz = (() => {
  try { const v = localStorage.getItem(K); if (VOZES.some((x) => x.id === v)) return v as IdVoz; } catch { /* */ }
  return 'nina';
})();
const ouvintes = new Set<() => void>();

export function setVoz(v: IdVoz) {
  atual = v;
  try { localStorage.setItem(K, v); } catch { /* */ }
  ouvintes.forEach((f) => f());
}
export function useVoz() {
  return useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f); }, () => atual);
}

/** "audio/c9-0.mp3" → "audio/nina/c9-0.mp3" */
export const audioDaVoz = (caminho: string, voz: IdVoz) => caminho.replace(/^audio\//, `audio/${voz}/`);

/**
 * Vozes gravadas para os temas de cada matéria. História tem as três; Geografia (Lucas, 08/11/2026),
 * como Matemática, só Nina e Otto, para gastar menos créditos. Quem escolheu outra voz ouve a Nina.
 */
export const vozesDaMateria = (materia: string) =>
  materia === 'História' ? VOZES : VOZES.filter((v) => v.id === 'nina' || v.id === 'otto');
export const vozParaMateria = (v: IdVoz, materia: string): IdVoz =>
  vozesDaMateria(materia).some((x) => x.id === v) ? v : 'nina';
