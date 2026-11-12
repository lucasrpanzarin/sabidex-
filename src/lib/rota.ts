// Navegação simples pelo endereço (#/...), para o botão "voltar" do celular funcionar.

import { useSyncExternalStore } from 'react';
import { destinoVoltar } from './caminho';

const ler = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);

let atual = ler();
let texto = location.hash;

/**
 * Caminho da criança (Lucas, 12/11/2026): o botão "Voltar" do topo leva para a tela em que ela estava antes,
 * não para uma tela fixa. Guardamos as telas por onde ela passou nesta visita ao app (some ao fechar).
 */
const K_PILHA = 'sabidex:caminho';
let pilha: string[] = (() => { try { const p = JSON.parse(sessionStorage.getItem(K_PILHA) ?? '[]'); return Array.isArray(p) ? p : []; } catch { return []; } })();
const guardarPilha = () => { try { sessionStorage.setItem(K_PILHA, JSON.stringify(pilha.slice(-30))); } catch { /* ignora */ } };
let porVoltar = false;

window.addEventListener('hashchange', (ev) => {
  const de = '#' + (ev.oldURL.split('#')[1] ?? '/');
  if (porVoltar) porVoltar = false;
  // Voltar do celular: a tela nova é a última do caminho, então tira ela de lá.
  else if (pilha[pilha.length - 1] === location.hash) pilha.pop();
  else pilha.push(de);
  guardarPilha();
  atual = ler(); texto = location.hash; ouvintes.forEach((f) => f());
});
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

/**
 * Botão "Voltar" do topo: volta para a tela anterior do caminho da criança.
 * Se o app acabou de abrir nesta tela (não tem caminho), vai para `padrao` (a tela "de cima").
 */
export function voltarTela(...padrao: string[]) {
  const { destino, resto } = destinoVoltar(pilha, location.hash || '#/');
  pilha = resto; guardarPilha();
  porVoltar = true;
  const novo = destino ?? '#/' + padrao.map(encodeURIComponent).join('/');
  if (novo === location.hash) { porVoltar = false; return; }
  location.hash = novo;
  window.scrollTo(0, 0);
}
