import { describe, it, expect } from 'vitest';
import { validarCapitulo, espalharRespostas, guiaDaIdade } from './conteudo';
import { capitulos } from '../data/index';
import type { Questao } from '../data/tipos';

describe('regras do conteúdo', () => {
  for (const cap of capitulos) {
    it(`${cap.titulo} não tem erros que quebram o jogo`, () => {
      expect(validarCapitulo(cap).filter((p) => p.startsWith('ERRO'))).toEqual([]);
    });
  }

  it('acha pegadinhas e prova incompleta', () => {
    const cap = structuredClone(capitulos[0]);
    cap.prova = cap.prova.slice(0, 9);
    cap.prova[0] = { ...cap.prova[0], pergunta: 'Qual frase NÃO é verdadeira?' };
    const p = validarCapitulo(cap);
    expect(p.some((x) => x.includes('10'))).toBe(true);
    expect(p.some((x) => x.includes('prova 1') && x.includes('NÃO'))).toBe(true);
  });

  it('espalha as respostas certas e mantém a opção certa', () => {
    const prova: Questao[] = Array.from({ length: 10 }, (_, i) => ({
      pergunta: `P${i}`, opcoes: [`certa${i}`, 'b', 'c', 'd'], certa: 0, explicacao: '',
    }));
    const r = espalharRespostas(prova);
    r.forEach((q, i) => expect(q.opcoes[q.certa]).toBe(`certa${i}`));
    for (const pos of [0, 1, 2, 3]) expect(r.filter((q) => q.certa === pos).length).toBeLessThanOrEqual(3);
    expect(espalharRespostas(prova)).toEqual(r);
  });

  it('o guia muda com a idade', () => {
    expect(guiaDaIdade(4)).toContain('9 a 11 anos');
    expect(guiaDaIdade(1)).not.toEqual(guiaDaIdade(8));
  });
});
