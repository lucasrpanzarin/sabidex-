import { describe, expect, it } from 'vitest';
import { dataValida, diasAte, ordenarCapitulos, situacao, textoProva } from './provas';

describe('datas das provas', () => {
  it('confere a data', () => {
    expect(dataValida('2026-11-09')).toBe(true);
    expect(dataValida('2026-02-31')).toBe(false);
    expect(dataValida('09/11/2026')).toBe(false);
    expect(dataValida(undefined)).toBe(false);
  });

  it('conta os dias até a prova', () => {
    expect(diasAte('2026-11-09', '2026-11-04')).toBe(5);
    expect(diasAte('2026-11-04', '2026-11-04')).toBe(0);
    expect(diasAte('2026-11-01', '2026-11-04')).toBe(-3);
    expect(diasAte('2027-01-02', '2026-12-30')).toBe(3);
  });

  it('diz se a prova está chegando ou já passou', () => {
    const datas = { h9: '2026-11-09', h10: '2026-10-20' };
    expect(situacao(datas, 'h9', '2026-11-04')).toEqual({ tipo: 'chegando', dias: 5 });
    expect(situacao(datas, 'h10', '2026-11-04')).toEqual({ tipo: 'passou' });
    expect(situacao(datas, 'h11', '2026-11-04')).toEqual({ tipo: 'sem' });
    expect(textoProva({ tipo: 'chegando', dias: 0 })).toBe('Prova hoje!');
    expect(textoProva({ tipo: 'chegando', dias: 1 })).toBe('Prova amanhã!');
    expect(textoProva({ tipo: 'chegando', dias: 5 })).toBe('Prova em 5 dias');
    expect(textoProva({ tipo: 'passou' })).toBe('Já teve prova');
  });

  it('põe a prova mais perto primeiro e as que já passaram no fim', () => {
    const caps = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    const datas = { a: '2026-10-01', c: '2026-11-20', d: '2026-11-06' };
    expect(ordenarCapitulos(caps, datas, '2026-11-04').map((c) => c.id)).toEqual(['b', 'c', 'd', 'a']);
    expect(ordenarCapitulos(caps, undefined, '2026-11-04').map((c) => c.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});
