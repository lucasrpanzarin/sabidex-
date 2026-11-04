import { describe, expect, it } from 'vitest';
import { estadoInicial, type Estado } from './jogo';
import { comprarItem, evoluir, formaDe, itensDe, paraTrocar, podeEvoluir, saldo } from './loja';
import { sabimonPorId } from '../data/sabimons';
import { mesclar, progressoVazio, sanitizar } from '../shared/sync';

const estrelim = sabimonPorId.get('s010')!; // tem desenho das 3 formas
const b0 = sabimonPorId.get('s001')!;
// exemplo de Sabimon cuja forma 2 ainda não tem desenho
const brasinho = { ...b0, formas: [b0.formas[0], { ...b0.formas[1], imagem: undefined }, b0.formas[2]] as typeof b0.formas };

describe('Sabicoins', () => {
  it('o saldo é o XP menos o que foi gasto', () => {
    const e = { ...estadoInicial(), xp: 500, cartas: { s001: 1 } };
    expect(saldo(e)).toBe(500);
    const r = comprarItem(e, 'escudo', 's001');
    if (typeof r === 'string') throw new Error(r);
    expect(saldo(r)).toBe(250);
    expect(itensDe(r, 's001')).toEqual(['escudo']);
  });

  it('não deixa comprar sem saldo, repetido, com espaços cheios ou sem ter o Sabimon', () => {
    const e: Estado = { ...estadoInicial(), xp: 5000, cartas: { s001: 1 } };
    expect(comprarItem({ ...e, xp: 50 }, 'prata', 's001')).toBe('moedas');
    expect(comprarItem(e, 'prata', 's002')).toBe('sabimon');
    let x = e;
    for (const i of ['prata', 'escudo', 'raio']) { const r = comprarItem(x, i, 's001'); if (typeof r === 'string') throw new Error(r); x = r; }
    expect(comprarItem(x, 'prata', 's001')).toBe('repetido');
    expect(comprarItem(x, 'coroa', 's001')).toBe('cheio');
  });

  it('comprar o item do desejo limpa o desejo', () => {
    const e = { ...estadoInicial(), xp: 500, cartas: { s001: 1 }, desejo: 'prata' };
    const r = comprarItem(e, 'prata', 's001');
    expect(typeof r !== 'string' && r.desejo).toBe(null);
  });
});

describe('evolução', () => {
  it('forma 2 gasta 2 cópias, forma 3 gasta mais 3', () => {
    let e = { ...estadoInicial(), xp: 1000, cartas: { s010: 6 } };
    expect(podeEvoluir(e, estrelim)).toEqual({ ok: true, forma: 2 });
    e = evoluir(e, estrelim)!;
    expect(formaDe(e, 's010')).toBe(2);
    expect(e.cartas.s010).toBe(4);
    e = evoluir(e, estrelim)!;
    expect(formaDe(e, 's010')).toBe(3);
    expect(e.cartas.s010).toBe(1);
    expect(saldo(e)).toBe(600);
    expect(podeEvoluir(e, estrelim)).toEqual({ ok: false, motivo: 'final' });
  });

  it('explica por que não pode evoluir', () => {
    expect(podeEvoluir({ ...estadoInicial(), xp: 1000, cartas: { s010: 2 } }, estrelim)).toMatchObject({ motivo: 'copias', faltam: 1 });
    expect(podeEvoluir({ ...estadoInicial(), xp: 50, cartas: { s010: 3 } }, estrelim)).toMatchObject({ motivo: 'moedas', faltam: 50 });
    expect(podeEvoluir({ ...estadoInicial(), xp: 1000, cartas: { s001: 9 } }, brasinho)).toMatchObject({ motivo: 'desenho' });
  });

  it('Sabimon evoluído ou com itens fica com a criança nas trocas', () => {
    const e = evoluir({ ...estadoInicial(), xp: 1000, cartas: { s010: 4, s002: 2 } }, estrelim)!;
    expect(paraTrocar(e, 's010')).toBe(1);
    expect(paraTrocar(e, 's002')).toBe(2);
  });
});

describe('compras na sincronização', () => {
  it('junta as compras dos dois lados sem repetir', () => {
    const a = { ...progressoVazio(), compras: [{ id: 'c1', sabimon: 's001', item: 'prata', preco: 100 }] };
    const b = { ...progressoVazio(), compras: [{ id: 'c1', sabimon: 's001', item: 'prata', preco: 100 }, { id: 'evo-s010-2', sabimon: 's010', forma: 2 as const, preco: 100 }] };
    expect(mesclar(a, b).compras.map((c) => c.id)).toEqual(['c1', 'evo-s010-2']);
  });

  it('o servidor limpa compras estranhas', () => {
    const p = sanitizar({ compras: [{ id: 'x', sabimon: 'h-001', item: 'prata', preco: 1 }, { id: 'y', sabimon: 's001', forma: 7, preco: 1 }, { id: 'z', sabimon: 's001', item: 'coroa', preco: -5 }] }, new Set());
    expect(p.compras).toEqual([{ id: 'z', sabimon: 's001', item: 'coroa', preco: 0 }]);
  });
});
