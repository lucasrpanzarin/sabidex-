import { describe, expect, it } from 'vitest';
import { comBoasVindas, gerarCodigo, PACOTE_BOAS_VINDAS, mesclar, normalizarCodigo, progressoVazio, sanitizar, sanitizarDelta, semanaDe } from './sync';

describe('mesclar', () => {
  it('guarda o maior XP, junta fases, dias e notas', () => {
    const s = { ...progressoVazio(), xp: 300, feitas: { 'a:ouvir': true as const }, notas: { a: 6 }, dias: ['2026-11-01'] };
    const c = { ...progressoVazio(), xp: 250, feitas: { 'a:memoria': true as const }, notas: { a: 8 }, dias: ['2026-11-02'] };
    const m = mesclar(s, c);
    expect(m.xp).toBe(300);
    expect(Object.keys(m.feitas).sort()).toEqual(['a:memoria', 'a:ouvir']);
    expect(m.notas.a).toBe(8);
    expect(m.dias).toEqual(['2026-11-01', '2026-11-02']);
  });

  it('pacote aberto em um aparelho não volta pelo outro', () => {
    const p = { id: 'p1', tipo: 'normal' as const, capitulo: 'x' };
    const s = { ...progressoVazio(), pacotes: [p] };
    const c = { ...progressoVazio(), abertos: ['p1'] };
    expect(mesclar(s, c).pacotes).toHaveLength(0);
    expect(mesclar(c, s).pacotes).toHaveLength(0);
  });
});

describe('sanitizar', () => {
  it('ignora fases e cartas que não existem', () => {
    const r = sanitizar({ xp: -5, feitas: { 'ok:ouvir': true, 'falsa:x': true }, notas: { a: 99, b: 7.3 } }, new Set(['ok:ouvir']));
    expect(r.xp).toBe(0);
    expect(r.feitas).toEqual({ 'ok:ouvir': true });
    expect(r.notas).toEqual({ b: 7.5 });
    expect(sanitizarDelta({ 'h-001': 2, nada: 5, 'h-002': -1, 'h-003': 999 }, new Set(['h-001', 'h-002', 'h-003']))).toEqual({ 'h-001': 2, 'h-003': 30 });
  });
});

describe('semana do ranking', () => {
  it('começa na segunda-feira, horário de Brasília', () => {
    expect(semanaDe(new Date('2026-11-04T15:00:00Z'))).toBe('2026-11-02'); // quarta
    expect(semanaDe(new Date('2026-11-09T02:00:00Z'))).toBe('2026-11-02'); // domingo 23h em Brasília
    expect(semanaDe(new Date('2026-11-09T04:00:00Z'))).toBe('2026-11-09'); // segunda 1h
  });
});

describe('códigos de turma', () => {
  it('têm palavra e 4 números', () => {
    for (let i = 0; i < 50; i++) expect(gerarCodigo()).toMatch(/^[A-Z]+-\d{4}$/);
    expect(normalizarCodigo(' arara - 4821 ')).toBe('ARARA-4821');
  });
});

describe('pacote de boas-vindas', () => {
  it('conta nova ganha 1 pacote, uma vez só', () => {
    const p = comBoasVindas(progressoVazio());
    expect(p.pacotes).toEqual([{ id: PACOTE_BOAS_VINDAS, tipo: 'normal', capitulo: PACOTE_BOAS_VINDAS }]);
    expect(comBoasVindas(p).pacotes).toHaveLength(1);
    expect(comBoasVindas({ ...progressoVazio(), abertos: [PACOTE_BOAS_VINDAS] }).pacotes).toHaveLength(0);
  });
});
