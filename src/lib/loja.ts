// Lojinha de Sabicoins: itens para a faixa embaixo da carta e evolução dos Sabimons.
// Funções puras, usadas pelo app e pelo servidor. Os preços ficam todos aqui.
//
// Como os preços foram pensados (cerca de 140 Sabicoins por dia de estudo):
// 1ª compra no 1º dia · algo novo a cada 2 dias · prêmio da semana · item dos sonhos em ~3 semanas.
// A evolução é barata em Sabicoins porque o difícil é juntar as cópias.

import type { Sabimon } from '../data/tipos';
import type { Estado } from './jogo';
import { COPIAS_PARA, type Forma } from './sabimon';
import type { Compra } from '../shared/sync';

export interface Item {
  id: string;
  nome: string;
  preco: number;
  /** o que o item faz, em palavras da criança */
  efeito: string;
  vida?: number;
  forca?: number;
}

export const ITENS: Item[] = [
  { id: 'prata', nome: 'Medalha de prata', preco: 100, efeito: 'Enfeite' },
  { id: 'escudo', nome: 'Escudo', preco: 250, efeito: '+20 de Vida', vida: 20 },
  { id: 'raio', nome: 'Raio de força', preco: 250, efeito: '+10 nos 2 poderes', forca: 10 },
  { id: 'ouro', nome: 'Medalha de ouro', preco: 400, efeito: 'Enfeite' },
  { id: 'ouro2', nome: 'Duas estrelas de ouro', preco: 800, efeito: 'Enfeite raro' },
  { id: 'coroa', nome: 'Coroa', preco: 1500, efeito: 'Enfeite de campeão' },
];
export const itemPorId = new Map(ITENS.map((i) => [i.id, i]));

/** Espaços para itens embaixo de cada carta. */
export const ESPACOS = 3;

/** Sabicoins para evoluir (além das cópias). */
export const PRECO_EVOLUCAO: Record<2 | 3, number> = { 2: 100, 3: 300 };

/** Cópias gastas para chegar na forma (a carta evoluída continua no álbum). */
export const copiasGastas = (forma: 2 | 3) => COPIAS_PARA[forma] - COPIAS_PARA[(forma - 1) as Forma];

type ComCompras = Pick<Estado, 'xp' | 'compras'>;

export const gasto = (e: ComCompras) => e.compras.reduce((s, c) => s + c.preco, 0);
/** Sabicoins disponíveis: tudo que a criança ganhou (igual ao XP) menos o que gastou. */
export const saldo = (e: ComCompras) => Math.max(0, e.xp - gasto(e));

export function formaDe(e: Pick<Estado, 'compras'>, id: string): Forma {
  let f: Forma = 1;
  for (const c of e.compras) if (c.sabimon === id && c.forma && c.forma > f) f = c.forma;
  return f;
}

/** Itens colocados no Sabimon, na ordem da compra (no máximo 3, sem repetir). */
export function itensDe(e: Pick<Estado, 'compras'>, id: string): string[] {
  const out: string[] = [];
  for (const c of e.compras) if (c.sabimon === id && c.item && !out.includes(c.item) && out.length < ESPACOS) out.push(c.item);
  return out;
}

/** Sabimon evoluído ou com itens: a criança sempre fica com ele (não sai em troca). */
export const protegido = (e: Pick<Estado, 'compras'>, id: string) => e.compras.some((c) => c.sabimon === id);

/** Quantas cópias do Sabimon a criança pode dar numa troca. */
export const paraTrocar = (e: Pick<Estado, 'compras' | 'cartas'>, id: string) =>
  Math.max(0, (e.cartas[id] ?? 0) - (protegido(e, id) ? 1 : 0));

export const idEvolucao = (id: string, forma: 2 | 3) => `evo-${id}-${forma}`;

export type Bloqueio = 'final' | 'desenho' | 'copias' | 'moedas';

/** Diz se o Sabimon pode evoluir agora e, se não, o motivo. */
export function podeEvoluir(e: Pick<Estado, 'xp' | 'compras' | 'cartas'>, s: Sabimon):
  { ok: true; forma: 2 | 3 } | { ok: false; motivo: Bloqueio; forma?: 2 | 3; faltam?: number } {
  const atual = formaDe(e, s.id);
  if (atual === 3) return { ok: false, motivo: 'final' };
  const forma = (atual + 1) as 2 | 3;
  if (!s.formas[forma - 1].imagem) return { ok: false, motivo: 'desenho', forma };
  const precisa = 1 + copiasGastas(forma);
  const tem = e.cartas[s.id] ?? 0;
  if (tem < precisa) return { ok: false, motivo: 'copias', forma, faltam: precisa - tem };
  const falta = PRECO_EVOLUCAO[forma] - saldo(e);
  if (falta > 0) return { ok: false, motivo: 'moedas', forma, faltam: falta };
  return { ok: true, forma };
}

/** Evolui no aparelho (quando a criança não está numa turma). Devolve null se não puder. */
export function evoluir<E extends Pick<Estado, 'xp' | 'compras' | 'cartas'>>(e: E, s: Sabimon): E | null {
  const p = podeEvoluir(e, s);
  if (!p.ok) return null;
  const compra: Compra = { id: idEvolucao(s.id, p.forma), sabimon: s.id, forma: p.forma, preco: PRECO_EVOLUCAO[p.forma] };
  return { ...e, compras: [...e.compras, compra], cartas: { ...e.cartas, [s.id]: (e.cartas[s.id] ?? 0) - copiasGastas(p.forma) } };
}

export type ErroCompra = 'item' | 'sabimon' | 'repetido' | 'cheio' | 'moedas';

/** Compra um item e coloca no Sabimon. */
export function comprarItem(e: Estado, itemId: string, sabimonId: string, id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`): Estado | ErroCompra {
  const item = itemPorId.get(itemId);
  if (!item) return 'item';
  if (!(e.cartas[sabimonId] > 0)) return 'sabimon';
  const ja = itensDe(e, sabimonId);
  if (ja.includes(itemId)) return 'repetido';
  if (ja.length >= ESPACOS) return 'cheio';
  if (saldo(e) < item.preco) return 'moedas';
  return { ...e, compras: [...e.compras, { id, sabimon: sabimonId, item: itemId, preco: item.preco }], desejo: e.desejo === itemId ? null : e.desejo };
}

/** Bônus dos itens para a carta. */
export function bonus(itens: string[]) {
  let vida = 0, forca = 0;
  for (const i of itens) { const it = itemPorId.get(i); vida += it?.vida ?? 0; forca += it?.forca ?? 0; }
  return { vida, forca };
}
