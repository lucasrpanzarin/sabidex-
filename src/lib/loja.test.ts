import { describe, expect, it } from 'vitest';
import { estadoInicial, type Estado } from './jogo';
import { bonus, comprarItem, destaqueDoDia, evoluir, itensDe, migrarFormas, migrarFormasLocal, mundosCompletos, paraTrocar, podeEvoluir, premiosLivres, saldo, visualDe, VITRINE } from './loja';
import { FIGURINHAS, figurinhaPorId } from './figurinhas';
import { mesclar, progressoVazio, sanitizar } from '../shared/sync';


describe('Sabicoins', () => {
  it('o saldo é o XP menos o que foi gasto', () => {
    const e = { ...estadoInicial(), xp: 500, cartas: { s001: 1 } };
    expect(saldo(e)).toBe(500);
    const r = comprarItem(e, 'vitoria', 's001');
    if (typeof r === 'string') throw new Error(r);
    expect(saldo(r)).toBe(350);
    expect(itensDe(r, 's001')).toEqual(['vitoria']);
  });

  it('não deixa comprar sem saldo, repetido, com espaços cheios ou sem ter o Sabimon', () => {
    const e: Estado = { ...estadoInicial(), xp: 5000, cartas: { s001: 1 } };
    expect(comprarItem({ ...e, xp: 50 }, 'caju', 's001')).toBe('moedas');
    expect(comprarItem(e, 'caju', 's002')).toBe('sabimon');
    let x = e;
    for (const i of ['caju', 'vitoria', 'guarana']) { const r = comprarItem(x, i, 's001'); if (typeof r === 'string') throw new Error(r); x = r; }
    expect(comprarItem(x, 'caju', 's001')).toBe('repetido');
    expect(comprarItem(x, 'ipe', 's001')).toBe('cheio');
  });

  it('comprar o item do desejo limpa o desejo', () => {
    const e = { ...estadoInicial(), xp: 500, cartas: { s001: 1 }, desejo: 'caju' };
    const r = comprarItem(e, 'caju', 's001');
    expect(typeof r !== 'string' && r.desejo).toBe(null);
  });
});

describe('lojinha nova', () => {
  const base: Estado = { ...estadoInicial(), xp: 5000, cartas: { s001: 1, s002: 1 } };
  const ok = (r: Estado | string) => { if (typeof r === 'string') throw new Error(r); return r; };

  it('itens antigos não se compram mais, mas quem tem continua com eles', () => {
    expect(comprarItem(base, 'prata', 's001')).toBe('item');
    const velho = { ...base, compras: [{ id: 'v', sabimon: 's001', item: 'escudo', preco: 250 }] };
    expect(itensDe(velho, 's001')).toEqual(['escudo']);
    expect(bonus(itensDe(velho, 's001')).vida).toBe(20);
  });

  it('item visual muda a carta e não ocupa espaço da faixa', () => {
    let x = base;
    for (const i of ['caju', 'vitoria', 'guarana']) x = ok(comprarItem(x, i, 's001'));
    x = ok(comprarItem(x, 'molduraouro', 's001'));
    expect(visualDe(x, 's001')).toBe('ouro');
    expect(itensDe(x, 's001')).toHaveLength(3);
    x = ok(comprarItem(x, 'holo', 's001'));
    expect(visualDe(x, 's001')).toBe('holo');
    expect(visualDe(x, 's002')).toBeUndefined();
  });

  it('a coroa não se compra: ganha 1 por mundo completo, de graça', () => {
    expect(comprarItem(base, 'coroa', 's001')).toBe('premio');
    // jogos extras não contam como fase do mundo
    expect(mundosCompletos({ 'historia-9:ouvir': true, 'historia-9:extra-lacunas': true, 'historia-9:extra-a': true, 'historia-9:extra-b': true, 'historia-9:extra-c': true })).toBe(0);
    const feitas = Object.fromEntries(['ouvir', 'memoria', 'linha', 'quiz', 'prova'].map((f) => [`historia-9:${f}`, true as const]));
    const e = { ...base, feitas };
    expect(mundosCompletos(feitas)).toBe(1);
    expect(premiosLivres(e)).toBe(1);
    const x = ok(comprarItem(e, 'coroa', 's001'));
    expect(saldo(x)).toBe(5000);
    expect(premiosLivres(x)).toBe(0);
    expect(comprarItem(x, 'coroa', 's002')).toBe('premio');
  });

  it('o destaque do dia muda com o dia e nunca é prêmio nem item antigo', () => {
    const dias = ['2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'];
    const itens = dias.map((d) => destaqueDoDia(d));
    for (const i of itens) expect(i.premio || i.antigo).toBeFalsy();
    expect(new Set(itens.map((i) => i.id)).size).toBeGreaterThan(1);
    expect(destaqueDoDia('2026-11-04').id).toBe(destaqueDoDia('2026-11-04').id);
  });

  it('todo item da vitrine (menos a coroa) tem um fato ou é visual', () => {
    for (const i of VITRINE) if (!i.premio && !i.visual) expect(i.fato).toBeTruthy();
  });
});

describe('álbum', () => {
  it('tem 60 figurinhas numeradas de 1 a 60, com as 3 formas de cada Sabimon', () => {
    expect(FIGURINHAS).toHaveLength(60);
    expect(FIGURINHAS.map((f) => f.numero)).toEqual(Array.from({ length: 60 }, (_, i) => i + 1));
    expect(figurinhaPorId.get('s001')).toMatchObject({ numero: 1, forma: 1 });
    expect(figurinhaPorId.get('s001-3')).toMatchObject({ numero: 3, forma: 3 });
    expect(figurinhaPorId.get('s002')).toMatchObject({ numero: 4, forma: 1 });
  });
});

describe('evolução', () => {
  it('3 cartas da forma 1 viram 1 da forma 2; 2 da forma 2 viram 1 da forma 3; as trocadas somem', () => {
    let e = { ...estadoInicial(), xp: 1000, cartas: { s010: 6 } as Record<string, number> };
    expect(podeEvoluir(e, 's010')).toEqual({ ok: true, forma: 2, gasta: 3 });
    e = evoluir(e, 's010', 'a')!;
    expect(e.cartas).toEqual({ s010: 3, 's010-2': 1 });
    e = evoluir(e, 's010', 'b')!;
    expect(e.cartas).toEqual({ s010: 0, 's010-2': 2 });
    expect(podeEvoluir(e, 's010-2')).toEqual({ ok: true, forma: 3, gasta: 2 });
    e = evoluir(e, 's010-2', 'c')!;
    expect(e.cartas).toEqual({ s010: 0, 's010-2': 0, 's010-3': 1 });
    expect(saldo(e)).toBe(1000 - 100 - 100 - 300);
    expect(podeEvoluir(e, 's010-3')).toEqual({ ok: false, motivo: 'final' });
  });

  it('explica por que não pode evoluir', () => {
    expect(podeEvoluir({ ...estadoInicial(), xp: 1000, cartas: { s010: 2 } }, 's010')).toMatchObject({ motivo: 'copias', faltam: 1 });
    expect(podeEvoluir({ ...estadoInicial(), xp: 1000, cartas: { 's010-2': 1 } }, 's010-2')).toMatchObject({ motivo: 'copias', faltam: 1 });
    expect(podeEvoluir({ ...estadoInicial(), xp: 50, cartas: { s010: 3 } }, 's010')).toMatchObject({ motivo: 'moedas', faltam: 50 });
  });

  it('a carta com itens fica com a criança: precisa de uma a mais para evoluir e não sai em troca', () => {
    const r = comprarItem({ ...estadoInicial(), xp: 2000, cartas: { s010: 3, s002: 2 } }, 'caju', 's010');
    if (typeof r === 'string') throw new Error(r);
    expect(podeEvoluir(r, 's010')).toMatchObject({ ok: false, motivo: 'copias', faltam: 1 });
    expect(paraTrocar(r, 's010')).toBe(2);
    expect(paraTrocar(r, 's002')).toBe(2);
    // o item é só da forma 1: a forma 2 nasce sem itens
    const e = evoluir({ ...r, cartas: { ...r.cartas, s010: 4 } }, 's010')!;
    expect(itensDe(e, 's010')).toEqual(['caju']);
    expect(itensDe(e, 's010-2')).toEqual([]);
  });
});

describe('mudança para "cada forma é uma carta"', () => {
  const antigo = {
    ...estadoInicial(), xp: 2000, cartas: { s010: 2, s002: 3 } as Record<string, number>,
    compras: [
      { id: 'evo-s010-2', sabimon: 's010', forma: 2 as const, preco: 100 },
      { id: 'evo-s010-3', sabimon: 's010', forma: 3 as const, preco: 300 },
      { id: 'c1', sabimon: 's010', item: 'caju', preco: 150 },
    ],
  };

  it('quem evoluiu antes ganha a carta da forma que tinha, com os itens dela', () => {
    const e = migrarFormasLocal(antigo);
    expect(e.cartas).toEqual({ s010: 1, 's010-3': 1, s002: 3 });
    expect(itensDe(e, 's010-3')).toEqual(['caju']);
    expect(itensDe(e, 's010')).toEqual([]);
    expect(saldo(e)).toBe(saldo(antigo));
  });

  it('acontece uma vez só', () => {
    const e = migrarFormasLocal(antigo);
    expect(migrarFormas(e)).toBeNull();
    expect(migrarFormasLocal(e)).toBe(e);
  });

  it('quem nunca evoluiu não muda nada', () => {
    expect(migrarFormas({ ...estadoInicial(), cartas: { s001: 4 } })).toBeNull();
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
