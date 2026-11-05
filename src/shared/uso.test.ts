import { describe, expect, it } from 'vitest';
import { progressoVazio } from './sync';
import { resumirUso } from './uso';

const caps = [{ id: 'h9', nome: 'Cap. 9', itens: [
  { chave: 'h9:quiz', nome: 'Quiz', nota: 'h9:quiz' },
  { chave: 'h9:prova', nome: 'Prova', nota: 'h9' },
] }];

describe('resumirUso', () => {
  it('soma fases, notas e recursos sem misturar crianças', () => {
    const a = { ...progressoVazio(), feitas: { 'h9:quiz': true as const, 'h9:prova': true as const }, notas: { 'h9:quiz': 9, h9: 6 }, dias: ['2026-11-04', '2026-11-05'],
      compras: [{ id: 'c1', sabimon: 's001', item: 'gorro', preco: 50 }] };
    const b = { ...progressoVazio(), feitas: { 'h9:quiz': true as const }, notas: { 'h9:quiz': 5 }, dias: ['2026-11-05'] };
    const u = resumirUso([
      { progresso: a, duelos: 1, trocas: 0, mensagens: 0 },
      { progresso: b, duelos: 0, trocas: 0, mensagens: 0 },
      { progresso: progressoVazio(), duelos: 0, trocas: 0, mensagens: 0 },
    ], caps);
    expect(u.criancas).toBe(3);
    expect(u.estudaram).toBe(2);
    expect(u.voltaram).toBe(1);
    expect(u.mediaDias).toBe(1.5);
    expect(u.recursos.find((r) => r.nome.includes('lojinha'))?.criancas).toBe(1);
    expect(u.recursos.find((r) => r.nome.includes('Duelo'))?.criancas).toBe(1);
    const c = u.capitulos[0];
    expect(c.comecaram).toBe(2);
    expect(c.itens[0]).toEqual({ nome: 'Quiz', fizeram: 2, media: 7, abaixo7: 1 });
    expect(c.itens[1]).toEqual({ nome: 'Prova', fizeram: 1, media: 6, abaixo7: 1 });
  });
});
