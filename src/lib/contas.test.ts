import { describe, it, expect } from 'vitest';
import { GERADORES, confere, ehFracao, gerarContas, semente, textoResposta, type Conta } from './contas';
import { capitulos } from '../data';
import { itemDe, idConta } from './revisao';

/** Calcula uma sentença com "?" trocado pelo número (só + − × ÷, da esquerda para a direita em cada membro). */
function vale(expr: string): number {
  const t = expr.trim().split(/\s+/);
  let v = Number(t[0]);
  for (let i = 1; i < t.length; i += 2) {
    const n = Number(t[i + 1]);
    v = t[i] === '+' ? v + n : t[i] === '−' ? v - n : t[i] === '×' ? v * n : v / n;
  }
  return v;
}
function sentencaFecha(c: Conta) {
  const s = c.sentenca!.replace('?', textoResposta(c.resposta));
  if (s.includes(',')) return true; // sequência: conferida à parte
  const [a, b] = s.split('=');
  return b.trim() === '' || vale(a) === vale(b);
}

describe('contas de Matemática', () => {
  for (const [tipo, g] of Object.entries(GERADORES)) {
    it(`${tipo}: 500 contas com resposta certa, inteira e sem número negativo`, () => {
      const r = semente(tipo.length * 97);
      for (let k = 0; k < 500; k++) {
        const c = g(r);
        expect(c.tipo).toBe(tipo);
        const partes = ehFracao(c.resposta) ? c.resposta : [c.resposta];
        for (const n of partes) {
          expect(Number.isInteger(n)).toBe(true);
          expect(n).toBeGreaterThanOrEqual(0);
          expect(n).toBeLessThan(10000);
        }
        if (ehFracao(c.resposta)) {
          expect(c.resposta[1]).toBeGreaterThan(0);
          expect(c.resposta[0]).toBeLessThanOrEqual(c.resposta[1]);
        }
        expect(c.explicacao.length).toBeGreaterThan(10);
        expect(c.explicacao).toContain(textoResposta(c.resposta));
        expect(confere(c, c.resposta)).toBe(true);
        if (c.visual?.tipo === 'barra' && ehFracao(c.resposta) && tipo !== 'fracao-resto') expect(c.resposta).toEqual([c.visual.pintadas, c.visual.partes]);
        if (c.visual?.tipo === 'reta' && ehFracao(c.resposta)) expect(c.resposta).toEqual([c.visual.marca, c.visual.partes]);
        if (c.sentenca && c.sentenca.includes('=') && !c.sentenca.trim().endsWith('?')) expect(sentencaFecha(c)).toBe(true);
        if (c.sentenca?.trim().endsWith('= ?')) expect(vale(c.sentenca.split('=')[0])).toBe(c.resposta);
        if (tipo.startsWith('fracao-') && tipo.endsWith('quantidade')) expect(c.explicacao).toMatch(/÷/);
        if (c.visual?.tipo === 'balanca') {
          const kg = c.resposta as number;
          const soma2 = (l: (number | null)[]) => l.reduce<number>((x, y) => x + (y ?? kg), 0);
          if (!c.visual.pende) expect(soma2(c.visual.esquerda)).toBe(soma2(c.visual.direita));
          else expect(Math.abs(soma2(c.visual.esquerda) - soma2(c.visual.direita))).toBe(kg);
        }
        for (const s of [c.enunciado, c.sentenca ?? '', c.explicacao]) expect(s).not.toMatch(/NaN|undefined|-\d/);
      }
    });
  }

  it('fração: aceita outra escrita do mesmo valor, menos quando pede escrita exata', () => {
    const c: Conta = { tipo: 'x', enunciado: '', resposta: [1, 2], explicacao: '' };
    expect(confere(c, [2, 4])).toBe(true);
    expect(confere(c, [1, 3])).toBe(false);
    expect(confere(c, 1)).toBe(false);
    expect(confere({ ...c, exata: true }, [2, 4])).toBe(false);
    expect(confere(c, [1, 0])).toBe(false);
  });

  it('a mesma semente dá as mesmas contas', () => {
    expect(gerarContas(['falta-soma', 'setas'], semente(1))).toEqual(gerarContas(['falta-soma', 'setas'], semente(1)));
  });

  it('todo tipo usado nos capítulos existe e a Revisão monta a conta', () => {
    for (const cap of capitulos.filter((c) => c.matematica)) {
      const m = cap.matematica!;
      for (const t of [...m.treino, ...m.desafio, ...m.prova, ...m.exemplos.map((e) => e.treino)]) {
        expect(GERADORES[t], t).toBeDefined();
        expect(itemDe(idConta(cap.id, t), capitulos)?.tipo).toBe('conta');
      }
    }
  });
});
