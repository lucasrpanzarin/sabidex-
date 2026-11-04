// Guarda o progresso da criança no aparelho (localStorage).
// Quando ela está numa turma, as cartas ganhas aqui ficam numa fila ("pendente")
// até o servidor confirmar; assim nenhuma carta se perde nem é contada duas vezes.

import { useSyncExternalStore } from 'react';
import { estadoInicial, type Estado } from './jogo';
import { mesclar, type ProgressoSync } from '../shared/sync';

const CHAVE = 'sabidex:v1';
const CHAVE_PENDENTE = 'sabidex:pendente';

const ler = <T,>(k: string, padrao: T): T => {
  try { const b = localStorage.getItem(k); if (b) return JSON.parse(b) as T; } catch { /* sem armazenamento */ }
  return padrao;
};
const gravar = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignora */ } };

let estado: Estado = { ...estadoInicial(), ...ler<Partial<Estado>>(CHAVE, {}) };
let pendente: Record<string, number> = ler(CHAVE_PENDENTE, {});
let registrarCartas = false;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());
const locais = new Set<() => void>();

/** Avisa só quando a criança muda algo neste aparelho (não quando vem do servidor). */
export function onMudancaLocal(f: () => void) { locais.add(f); return () => { locais.delete(f); }; }

export function getEstado() { return estado; }
export function getPendente() { return pendente; }

/** Liga a fila de cartas pendentes (só quando a criança tem conta na turma). */
export function setRegistrarCartas(v: boolean) { registrarCartas = v; }

export function setEstado(novo: Estado | ((e: Estado) => Estado)) {
  const antes = estado;
  estado = typeof novo === 'function' ? novo(estado) : novo;
  if (registrarCartas) {
    for (const [id, n] of Object.entries(estado.cartas)) {
      const d = n - (antes.cartas[id] ?? 0);
      if (d > 0) pendente = { ...pendente, [id]: (pendente[id] ?? 0) + d };
    }
    gravar(CHAVE_PENDENTE, pendente);
  }
  gravar(CHAVE, estado);
  avisar();
  locais.forEach((f) => f());
}

export const progressoDe = (e: Estado): ProgressoSync => ({
  xp: e.xp, feitas: e.feitas, notas: e.notas, pacotes: e.pacotes, abertos: e.abertos, dias: e.dias,
});

/**
 * Aplica o que veio do servidor. `enviado` são as cartas pendentes que o servidor já recebeu.
 * Com `substituir`, troca todo o progresso do aparelho pelo da conta (ao entrar em outro aparelho).
 */
export function aplicarServidor(
  r: { progresso: ProgressoSync; cartas: Record<string, number>; conta: { apelido: string; cor: string } },
  enviado: Record<string, number>,
  substituir = false,
) {
  const resto: Record<string, number> = {};
  for (const [id, n] of Object.entries(substituir ? {} : pendente)) {
    const falta = n - (enviado[id] ?? 0);
    if (falta > 0) resto[id] = falta;
  }
  pendente = resto;
  gravar(CHAVE_PENDENTE, pendente);
  const prog = substituir ? r.progresso : mesclar(r.progresso, progressoDe(estado));
  const cartas: Record<string, number> = { ...r.cartas };
  for (const [id, n] of Object.entries(resto)) cartas[id] = (cartas[id] ?? 0) + n;
  estado = { ...estado, ...prog, cartas, perfil: { nome: r.conta.apelido, cor: r.conta.cor } };
  gravar(CHAVE, estado);
  avisar();
}

export function limparPendente() { pendente = {}; gravar(CHAVE_PENDENTE, pendente); }

export function useEstado() {
  return useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f); }, () => estado);
}
