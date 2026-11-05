import { describe, expect, it } from 'vitest';
import { apelidoLivre, chaveBusca, termosBusca, textoBusca } from './pedidos';

const chave = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

describe('busca de turmas', () => {
  it('acha sem acento e sem maiúscula', () => {
    expect(textoBusca('4º ano B', 'Colégio Educativa')).toBe('4º ano b colegio educativa');
    expect(termosBusca('EDUCATIVA')).toEqual(['educativa']);
    expect(termosBusca('educativa 4º b')).toEqual(['educativa', '4º', 'b']);
  });

  it('não busca com menos de 3 letras (ninguém vê a lista inteira)', () => {
    expect(termosBusca('ab')).toEqual([]);
    expect(termosBusca('  ')).toEqual([]);
    expect(termosBusca('%%%')).toEqual([]);
    expect(termosBusca('a b c')).toEqual(['a', 'b', 'c']);
  });

  it('ignora símbolos que poderiam virar curinga', () => {
    expect(chaveBusca('edu%cativa_')).toBe('edu cativa');
  });
});

describe('apelido repetido na turma nova', () => {
  it('fica igual se ninguém usa', () => {
    expect(apelidoLivre('Ana', new Set(['bia']), chave)).toBe('Ana');
  });
  it('ganha um número se já tem', () => {
    expect(apelidoLivre('Ana', new Set(['ana']), chave)).toBe('Ana 2');
    expect(apelidoLivre('Ána', new Set(['ana', 'ana 2']), chave)).toBe('Ána 3');
  });
  it('não passa de 14 letras', () => {
    const r = apelidoLivre('Maria Eduarda1', new Set(['maria eduarda1']), chave);
    expect(r.length).toBeLessThanOrEqual(14);
    expect(r).toBe('Maria Eduard 2');
  });
});
