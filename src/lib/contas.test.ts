import { describe, it, expect } from 'vitest';
import { GERADORES, gerarContas, semente, type Conta } from './contas';
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
  const s = c.sentenca!.replace('?', String(c.resposta));
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
        expect(Number.isInteger(c.resposta)).toBe(true);
        expect(c.resposta).toBeGreaterThanOrEqual(0);
        expect(c.resposta).toBeLessThan(10000);
        expect(c.explicacao.length).toBeGreaterThan(10);
        expect(c.explicacao).toContain(String(c.resposta));
        if (c.sentenca && c.sentenca.includes('=') && !c.sentenca.trim().endsWith('?')) expect(sentencaFecha(c)).toBe(true);
        if (c.sentenca?.trim().endsWith('= ?')) expect(vale(c.sentenca.split('=')[0])).toBe(c.resposta);
        if (c.visual?.tipo === 'balanca') {
          const soma = (l: (number | null)[]) => l.reduce<number>((x, y) => x + (y ?? c.resposta), 0);
          if (!c.visual.pende) expect(soma(c.visual.esquerda)).toBe(soma(c.visual.direita));
          else expect(Math.abs(soma(c.visual.esquerda) - soma(c.visual.direita))).toBe(c.resposta);
        }
        for (const s of [c.enunciado, c.sentenca ?? '', c.explicacao]) expect(s).not.toMatch(/NaN|undefined|-\d/);
      }
    });
  }

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
