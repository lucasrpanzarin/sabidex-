// Navegação simples pelo endereço (#/...), para o botão "voltar" do celular funcionar.

import { useSyncExternalStore } from 'react';

const ler = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);

let atual = ler();
let texto = location.hash;
window.addEventListener('hashchange', () => { atual = ler(); texto = location.hash; ouvintes.forEach((f) => f()); });
const ouvintes = new Set<() => void>();

export function useRota(): string[] {
  useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f); }, () => texto);
  return atual;
}

export function ir(...partes: string[]) {
  location.hash = '/' + partes.map(encodeURIComponent).join('/');
  window.scrollTo(0, 0);
}

export function voltar(...fallback: string[]) {
  if (history.length > 1) history.back();
  else ir(...fallback);
}
