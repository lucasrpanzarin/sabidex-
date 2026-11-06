import { describe, it, expect } from 'vitest';
import { GERADORES, confere, ehFracao, extenso, gerarContas, reaisPorExtenso, semente, textoCerto, tempoDeLeitura, textoResposta, virgula, type Conta } from './contas';
import { capitulos } from '../data';
import { itemDe, idConta } from './revisao';

/** Calcula uma sentença com "?" trocado pelo número (só + − × ÷, da esquerda para a direita em cada membro). */
function vale(expr: string): number {
  const t = expr.trim().split(/\s+/);
  const n0 = (x: string) => Number(x.replace(',', '.'));
  let v = n0(t[0]);
  for (let i = 1; i < t.length; i += 2) {
    const n = n0(t[i + 1]);
    v = t[i] === '+' ? v + n : t[i] === '−' ? v - n : t[i] === '×' ? v * n : v / n;
  }
  return v;
}
function sentencaFecha(c: Conta) {
  const s = c.sentenca!.replace('?', textoResposta(c.resposta));
  if (s.includes(', ')) return true; // sequência: conferida à parte
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
          // Resposta com vírgula: no máximo 2 casas (centavos/centésimos).
          if (c.decimal) expect(Math.abs(n * 100 - Math.round(n * 100))).toBeLessThan(1e-6);
          else expect(Number.isInteger(n)).toBe(true);
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
        if (c.sentenca?.trim().endsWith('= ?')) expect(vale(c.sentenca.split('=')[0])).toBeCloseTo(c.resposta as number, 6);
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

  it('número com vírgula: 12,5 = 12,50 e escreve como no livro', () => {
    const c: Conta = { tipo: 'x', enunciado: '', resposta: 12.5, decimal: true, explicacao: '' };
    expect(confere(c, 12.50)).toBe(true);
    expect(confere(c, 0.1 + 12.4)).toBe(true);
    expect(confere(c, 125)).toBe(false);
    expect(textoResposta(12.5)).toBe('12,5');
    expect(textoResposta(12.5, true)).toBe('12,50');
    expect(textoResposta(0.06)).toBe('0,06');
    expect(textoCerto({ ...c, reais: true })).toBe('R$ 12,50');
    expect(extenso(87)).toBe('oitenta e sete');
    expect(extenso(100)).toBe('cem');
    expect(extenso(115)).toBe('cento e quinze');
    expect(reaisPorExtenso(8799)).toBe('oitenta e sete reais e noventa e nove centavos');
    expect(reaisPorExtenso(101)).toBe('um real e um centavo');
    expect(reaisPorExtenso(2800)).toBe('vinte e oito reais');
    expect(virgula(16649, 2)).toBe('166,49');
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

describe('tempoDeLeitura', () => {
  it('espera mais em texto longo, com mínimo de 2 s e máximo de 7 s', () => {
    expect(tempoDeLeitura('Escrevemos **0,3**.')).toBe(2000);
    expect(tempoDeLeitura('A parede tem **3** partes iguais: o denominador é 3.')).toBe(4000);
    expect(tempoDeLeitura('palavra '.repeat(40))).toBe(7000);
    expect(tempoDeLeitura('um dois três', 'quatro cinco', 'seis')).toBe(2400);
  });
});
