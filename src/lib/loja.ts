// Lojinha de Sabicoins: itens para a faixa embaixo da carta e evolução dos Sabimons.
// Funções puras, usadas pelo app e pelo servidor. Os preços ficam todos aqui.
//
// Como os preços foram pensados (cerca de 140 Sabicoins por dia de estudo):
// 1ª compra no 1º dia · algo novo a cada 2 dias · prêmio da semana · item dos sonhos em ~3 semanas.
// A evolução é barata em Sabicoins porque o difícil é juntar as cartas.

import type { Raridade } from '../data/tipos';
import { FASES, type Estado } from './jogo';
import { CARTAS_PARA_EVOLUIR, type Forma } from './sabimon';
import { figurinhaPorId, idCarta } from './figurinhas';
import type { Compra } from '../shared/sync';

export type TipoItem = 'vida' | 'forca' | 'enfeite' | 'visual';

export interface Item {
  id: string;
  nome: string;
  preco: number;
  /** o que o item faz, em palavras da criança */
  efeito: string;
  /** mesma raridade (e moldura) das cartas */
  raridade: Raridade;
  tipo: TipoItem;
  /** fato real e curto sobre a coisa do Brasil que inspirou o item */
  fato?: string;
  vida?: number;
  forca?: number;
  /** item visual: muda a moldura da carta (não ocupa espaço da faixa) */
  visual?: 'ouro' | 'holo';
  /** prêmio de estudo: não se compra (custa 0), ganha 1 por mundo completo */
  premio?: true;
  /** item antigo: não aparece mais na vitrine, mas continua valendo para quem comprou */
  antigo?: true;
}

export const ITENS: Item[] = [
  { id: 'caju', nome: 'Caju', preco: 100, efeito: 'Enfeite', raridade: 'comum', tipo: 'enfeite',
    fato: 'A castanha do caju fica do lado de fora da fruta.' },
  { id: 'vitoria', nome: 'Folha de vitória-régia', preco: 150, efeito: '+20 de Vida', raridade: 'comum', tipo: 'vida', vida: 20,
    fato: 'A folha da vitória-régia pode passar de 2 metros de largura.' },
  { id: 'guarana', nome: 'Fruto de guaraná', preco: 150, efeito: '+10 de força', raridade: 'comum', tipo: 'forca', forca: 10,
    fato: 'O guaraná nasce na Amazônia e tem cafeína, que dá energia.' },
  { id: 'castanha', nome: 'Ouriço de castanha', preco: 350, efeito: '+35 de Vida', raridade: 'rara', tipo: 'vida', vida: 35,
    fato: 'A castanheira-do-pará pode passar de 50 metros de altura.' },
  { id: 'ipe', nome: 'Flor de ipê-amarelo', preco: 350, efeito: '+20 de força', raridade: 'rara', tipo: 'forca', forca: 20,
    fato: 'No fim do inverno, o ipê-amarelo perde as folhas e fica coberto de flores.' },
  { id: 'ametista', nome: 'Cristal de ametista', preco: 400, efeito: 'Enfeite raro', raridade: 'rara', tipo: 'enfeite',
    fato: 'O Rio Grande do Sul tem muitas pedras de ametista.' },
  { id: 'escama', nome: 'Escama de pirarucu', preco: 700, efeito: '+50 de Vida', raridade: 'epica', tipo: 'vida', vida: 50,
    fato: 'A escama do pirarucu é tão dura que aguenta mordida de piranha.' },
  { id: 'molduraouro', nome: 'Moldura de ouro', preco: 700, efeito: 'Carta dourada', raridade: 'epica', tipo: 'visual', visual: 'ouro' },
  { id: 'holo', nome: 'Brilho holográfico', preco: 1500, efeito: 'Carta com brilho', raridade: 'lendaria', tipo: 'visual', visual: 'holo' },
  { id: 'coroa', nome: 'Coroa do álbum', preco: 0, efeito: 'Prêmio de estudo', raridade: 'lendaria', tipo: 'enfeite', premio: true },
  // Itens antigos (quem comprou continua com eles)
  { id: 'prata', nome: 'Medalha de prata', preco: 100, efeito: 'Enfeite', raridade: 'comum', tipo: 'enfeite', antigo: true },
  { id: 'escudo', nome: 'Escudo', preco: 250, efeito: '+20 de Vida', raridade: 'comum', tipo: 'vida', vida: 20, antigo: true },
  { id: 'raio', nome: 'Raio de força', preco: 250, efeito: '+10 de força', raridade: 'comum', tipo: 'forca', forca: 10, antigo: true },
  { id: 'ouro', nome: 'Medalha de ouro', preco: 400, efeito: 'Enfeite', raridade: 'rara', tipo: 'enfeite', antigo: true },
  { id: 'ouro2', nome: 'Duas estrelas de ouro', preco: 800, efeito: 'Enfeite raro', raridade: 'epica', tipo: 'enfeite', antigo: true },
];
export const itemPorId = new Map(ITENS.map((i) => [i.id, i]));
/** Itens que aparecem na vitrine da lojinha. */
export const VITRINE = ITENS.filter((i) => !i.antigo);

/** Item em destaque no dia (muda todo dia, igual para todo mundo). Sem desconto: só chama atenção. */
export function destaqueDoDia(dia: string): Item {
  const lista = VITRINE.filter((i) => !i.premio);
  let h = 0;
  for (const ch of dia) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return lista[h % lista.length];
}

/** Mundos (capítulos) com as 5 fases feitas. */
export function mundosCompletos(feitas: Record<string, true>): number {
  const por = new Map<string, number>();
  for (const k of Object.keys(feitas)) {
    const [cap, fase] = k.split(':');
    if ((FASES as string[]).includes(fase)) por.set(cap, (por.get(cap) ?? 0) + 1); // jogos extras não contam
  }
  return [...por.values()].filter((n) => n >= FASES.length).length;
}

/** Quantos prêmios de estudo (coroas) a criança ainda pode pegar. */
export function premiosLivres(e: Pick<Estado, 'feitas' | 'compras'>): number {
  const usados = e.compras.filter((c) => c.item && itemPorId.get(c.item)?.premio && c.preco === 0).length;
  return Math.max(0, mundosCompletos(e.feitas) - usados);
}

/** Espaços para itens embaixo de cada carta. */
export const ESPACOS = 3;

/** Sabicoins para evoluir (além das cartas). */
export const PRECO_EVOLUCAO: Record<2 | 3, number> = { 2: 100, 3: 300 };

type ComCompras = Pick<Estado, 'xp' | 'compras'>;

export const gasto = (e: ComCompras) => e.compras.reduce((s, c) => s + c.preco, 0);
/** Sabicoins disponíveis: tudo que a criança ganhou (igual ao XP) menos o que gastou. */
export const saldo = (e: ComCompras) => Math.max(0, e.xp - gasto(e));

/*
 * Para qual carta vai cada compra (item ou moldura).
 * Compras novas dizem a carta: "s001-1", "s001-2", "s001-3".
 * Compras antigas dizem só o Sabimon ("s001"): vão para a forma que ele tinha quando a
 * criança comprou (o marcador "migrou-s001" guarda essa forma), ou para a forma 1.
 */
export const refCompra = (cartaId: string) => (/-[23]$/.test(cartaId) ? cartaId : `${cartaId}-1`);
const MIGROU = 'migrou-';
function cartaDaCompra(compras: Compra[], c: Compra): string {
  const m = /^(s\d{3})-([123])$/.exec(c.sabimon);
  if (m) return idCarta(m[1], Number(m[2]) as Forma);
  const marca = compras.find((x) => x.id === MIGROU + c.sabimon);
  return idCarta(c.sabimon, (marca?.forma ?? 1) as Forma);
}
const comprasDaCarta = (compras: Compra[], cartaId: string) => compras.filter((c) => c.item && cartaDaCompra(compras, c) === cartaId);

/** Itens colocados na carta, na ordem da compra (no máximo 3, sem repetir). */
export function itensDe(e: Pick<Estado, 'compras'>, cartaId: string): string[] {
  const out: string[] = [];
  for (const c of comprasDaCarta(e.compras, cartaId)) if (!itemPorId.get(c.item!)?.visual && !out.includes(c.item!) && out.length < ESPACOS) out.push(c.item!);
  return out;
}

/** Moldura especial da carta (o último item visual colocado nela). */
export function visualDe(e: Pick<Estado, 'compras'>, cartaId: string): 'ouro' | 'holo' | undefined {
  let v: 'ouro' | 'holo' | undefined;
  for (const c of comprasDaCarta(e.compras, cartaId)) v = itemPorId.get(c.item!)?.visual ?? v;
  return v;
}

/** A carta já tem esse item? */
export const temItem = (e: Pick<Estado, 'compras'>, cartaId: string, itemId: string) => comprasDaCarta(e.compras, cartaId).some((c) => c.item === itemId);

/** Carta com itens da lojinha: a criança sempre fica com uma (não sai em troca nem na evolução). */
export const protegido = (e: Pick<Estado, 'compras'>, cartaId: string) => comprasDaCarta(e.compras, cartaId).length > 0;

/** Quantas cópias da carta a criança pode dar numa troca. */
export const paraTrocar = (e: Pick<Estado, 'compras' | 'cartas'>, cartaId: string) =>
  Math.max(0, (e.cartas[cartaId] ?? 0) - (protegido(e, cartaId) ? 1 : 0));

/**
 * Antes, o Sabimon subia de forma e continuava sendo uma carta só.
 * Agora cada forma é uma carta. Quem já tinha evoluído ganha a carta da forma que tinha
 * (no lugar de 1 cópia da forma 1). O marcador "migrou-<id>" garante que isso acontece uma vez só.
 */
export function migrarFormas(e: Pick<Estado, 'compras' | 'cartas'>): { compras: Compra[]; delta: Record<string, number> } | null {
  const formaAntiga = new Map<string, number>();
  for (const c of e.compras) {
    if (c.forma && /^s\d{3}$/.test(c.sabimon) && !c.id.startsWith(MIGROU)) formaAntiga.set(c.sabimon, Math.max(c.forma, formaAntiga.get(c.sabimon) ?? 1));
  }
  const marcas: Compra[] = [];
  const delta: Record<string, number> = {};
  for (const [sid, forma] of formaAntiga) {
    if (e.compras.some((c) => c.id === MIGROU + sid)) continue;
    marcas.push({ id: MIGROU + sid, sabimon: sid, forma: forma as 2 | 3, preco: 0 });
    if ((e.cartas[sid] ?? 0) > 0) {
      delta[sid] = -1;
      delta[idCarta(sid, forma as Forma)] = 1;
    }
  }
  return marcas.length ? { compras: [...e.compras, ...marcas], delta } : null;
}

/** Aplica a mudança acima no aparelho. */
export function migrarFormasLocal<E extends Pick<Estado, 'compras' | 'cartas'>>(e: E): E {
  const m = migrarFormas(e);
  if (!m) return e;
  const cartas = { ...e.cartas };
  for (const [id, n] of Object.entries(m.delta)) cartas[id] = Math.max(0, (cartas[id] ?? 0) + n);
  return { ...e, compras: m.compras, cartas };
}

export type Bloqueio = 'final' | 'desenho' | 'copias' | 'moedas';

/**
 * Diz se a carta pode evoluir agora e, se não, o motivo.
 * Regra: 3 cartas da forma 1 viram 1 da forma 2; 2 da forma 2 viram 1 da forma 3. As trocadas somem.
 */
export function podeEvoluir(e: Pick<Estado, 'xp' | 'compras' | 'cartas'>, cartaId: string):
  { ok: true; forma: 2 | 3; gasta: number } | { ok: false; motivo: Bloqueio; forma?: 2 | 3; faltam?: number; gasta?: number } {
  const f = figurinhaPorId.get(cartaId);
  if (!f || f.forma === 3) return { ok: false, motivo: 'final' };
  const forma = (f.forma + 1) as 2 | 3;
  const gasta = CARTAS_PARA_EVOLUIR[forma];
  if (!f.s.formas[forma - 1].imagem) return { ok: false, motivo: 'desenho', forma, gasta };
  // A carta com itens fica com a criança: precisa de uma a mais.
  const precisa = gasta + (protegido(e, cartaId) ? 1 : 0);
  const tem = e.cartas[cartaId] ?? 0;
  if (tem < precisa) return { ok: false, motivo: 'copias', forma, faltam: precisa - tem, gasta };
  const falta = PRECO_EVOLUCAO[forma] - saldo(e);
  if (falta > 0) return { ok: false, motivo: 'moedas', forma, faltam: falta, gasta };
  return { ok: true, forma, gasta };
}

export const idEvolucao = (sabimonId: string, forma: 2 | 3, sufixo = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`) =>
  `evo-${sabimonId}-${forma}-${sufixo}`;

/** Evolui no aparelho (quando a criança não está numa turma). Devolve null se não puder. */
export function evoluir<E extends Pick<Estado, 'xp' | 'compras' | 'cartas'>>(e: E, cartaId: string, sufixo?: string): E | null {
  const p = podeEvoluir(e, cartaId);
  const f = figurinhaPorId.get(cartaId);
  if (!p.ok || !f) return null;
  const nova = idCarta(f.s.id, p.forma);
  const compra: Compra = { id: idEvolucao(f.s.id, p.forma, sufixo), sabimon: refCompra(nova), forma: p.forma, preco: PRECO_EVOLUCAO[p.forma] };
  return { ...e, compras: [...e.compras, compra], cartas: { ...e.cartas, [cartaId]: (e.cartas[cartaId] ?? 0) - p.gasta, [nova]: (e.cartas[nova] ?? 0) + 1 } };
}

export type ErroCompra = 'item' | 'sabimon' | 'repetido' | 'cheio' | 'moedas' | 'premio';

/** Compra um item e coloca na carta. */
export function comprarItem(e: Estado, itemId: string, cartaId: string, id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`): Estado | ErroCompra {
  const item = itemPorId.get(itemId);
  if (!item || item.antigo) return 'item';
  if (!figurinhaPorId.has(cartaId) || !(e.cartas[cartaId] > 0)) return 'sabimon';
  if (comprasDaCarta(e.compras, cartaId).some((c) => c.item === itemId)) return 'repetido';
  if (!item.visual && itensDe(e, cartaId).length >= ESPACOS) return 'cheio';
  if (item.premio && premiosLivres(e) < 1) return 'premio';
  if (saldo(e) < item.preco) return 'moedas';
  return { ...e, compras: [...e.compras, { id, sabimon: refCompra(cartaId), item: itemId, preco: item.preco }], desejo: e.desejo === itemId ? null : e.desejo };
}

/** Bônus dos itens para a carta. */
export function bonus(itens: string[]) {
  let vida = 0, forca = 0;
  for (const i of itens) { const it = itemPorId.get(i); vida += it?.vida ?? 0; forca += it?.forca ?? 0; }
  return { vida, forca };
}
