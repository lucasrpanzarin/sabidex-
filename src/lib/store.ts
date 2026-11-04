// Guarda o progresso da criança no próprio aparelho (localStorage).
// Na etapa 2 isso passa a sincronizar com o servidor da turma.

import { useSyncExternalStore } from 'react';
import { estadoInicial, type Estado } from './jogo';

const CHAVE = 'sabidex:v1';

function carregar(): Estado {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) return { ...estadoInicial(), ...JSON.parse(bruto) };
  } catch { /* sem armazenamento: começa do zero */ }
  return estadoInicial();
}

let estado = carregar();
const ouvintes = new Set<() => void>();

export function getEstado() { return estado; }

export function setEstado(novo: Estado | ((e: Estado) => Estado)) {
  estado = typeof novo === 'function' ? novo(estado) : novo;
  try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch { /* ignora */ }
  ouvintes.forEach((f) => f());
}

export function useEstado() {
  return useSyncExternalStore(
    (f) => { ouvintes.add(f); return () => ouvintes.delete(f); },
    () => estado,
  );
}
