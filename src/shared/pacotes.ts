// Abrir pacote no servidor (criança com conta): quem sorteia o Sabimon é o servidor, não o aparelho.
// Assim ninguém consegue escolher a carta que vem no pacote mexendo no aparelho.

import { sabimons } from '../data';
import { abrirPacote, GARANTIA, type TipoPacote } from '../lib/jogo';
import type { ProgressoSync } from './sync';

/** No máximo tantos pacotes abertos por dia (uma criança estudando muito abre bem menos). */
export const PACOTES_POR_DIA = 60;

/** Contadores que o servidor guarda de cada criança. */
export interface Contadores {
  /** pacotes seguidos sem Sabimon novo (para a garantia) */
  semNovo: number;
  /** dia (AAAA-MM-DD, Brasília) dos pacotes contados em `hoje` */
  dia: string;
  hoje: number;
  /** pacotes épicos já abertos pelo servidor */
  epicos: number;
}

/** Dia de hoje em Brasília (AAAA-MM-DD). */
export const diaBR = (agora = Date.now()) => new Date(agora - 3 * 3600_000).toISOString().slice(0, 10);

/** Número sorteado com a segurança do servidor (0 ≤ n < 1). */
export const rngSeguro = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;

/**
 * Sorteia o pacote `id`. Só abre pacote que o servidor conhece e que ainda não foi aberto.
 * O pacote épico só vem da prova: precisa da prova do capítulo feita e no máximo 1 por capítulo;
 * se não fechar, abre como pacote normal.
 */
export function sortearPacote(
  prog: ProgressoSync, id: string, cartas: Record<string, number>, cont: Contadores,
  opcoes: { capitulos: number; dia: string; rng?: () => number },
): { erro: string } | { cartas: string[]; progresso: ProgressoSync; contadores: Contadores } {
  const p = prog.pacotes.find((x) => x.id === id);
  if (!p || prog.abertos.includes(id)) return { erro: 'Esse pacote não está mais aqui.' };
  const hoje = cont.dia === opcoes.dia ? cont.hoje : 0;
  if (hoje >= PACOTES_POR_DIA) return { erro: 'Você já abriu muitos pacotes hoje. Amanhã tem mais!' };
  const epicoOk = p.tipo === 'epico' && !!prog.feitas[`${p.capitulo}:prova`] && cont.epicos < opcoes.capitulos;
  const tipo: TipoPacote = epicoOk ? 'epico' : 'normal';
  const novas = abrirPacote(sabimons, tipo, opcoes.rng ?? rngSeguro, { tem: cartas, garantia: cont.semNovo >= GARANTIA - 1 });
  const algumNovo = novas.some((s) => !(cartas[s.id] > 0));
  return {
    cartas: novas.map((s) => s.id),
    progresso: { ...prog, pacotes: prog.pacotes.filter((x) => x.id !== id), abertos: [...prog.abertos, id].slice(-500) },
    contadores: { semNovo: algumNovo ? 0 : cont.semNovo + 1, dia: opcoes.dia, hoje: hoje + 1, epicos: cont.epicos + (epicoOk ? 1 : 0) },
  };
}
