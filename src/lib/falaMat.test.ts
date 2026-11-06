import { describe, it, expect } from 'vitest';
import { audiosDoExemplo, falaDaConta, vozDaMatematica } from './falaMat';
import { capitulos } from '../data';

describe('falaDaConta', () => {
  it('lê frações, vírgulas, dinheiro e sinais', () => {
    expect(falaDaConta('Ela pintou **2/3** da parede.')).toBe('Ela pintou dois terços da parede.');
    expect(falaDaConta('6 centésimos = **0,06**.')).toBe('6 centésimos é igual a zero vírgula zero seis.');
    expect(falaDaConta('Centésimos: 9 > 6. Então **50,89 > 50,86**.')).toBe('Centésimos: 9 é maior que 6. Então cinquenta vírgula oitenta e nove é maior que cinquenta vírgula oitenta e seis.');
    expect(falaDaConta('O troco é **R$ 12,50**.')).toBe('O troco é doze reais e cinquenta centavos.');
    expect(falaDaConta('A conta fica assim: **? × 3 = 30**.')).toBe('A conta fica assim: um número vezes 3 é igual a 30.');
    expect(falaDaConta('25/100 = **25%**: vinte e cinco por cento.')).toBe('vinte e cinco centésimos é igual a 25 por cento: vinte e cinco por cento.');
    expect(falaDaConta('Ponho **4 kg** na direita.')).toBe('Ponho 4 quilos na direita.');
  });
  it('Graziella ouve a Nina na Matemática', () => {
    expect(vozDaMatematica('graziella')).toBe('nina');
    expect(vozDaMatematica('otto')).toBe('otto');
  });
  it('todo passo de todo exemplo tem áudio e a fala não sobra sinal de conta', () => {
    for (const c of capitulos) for (const [i, e] of (c.matematica?.exemplos ?? []).entries()) {
      const a = audiosDoExemplo(c.id, i, e);
      expect(a).toHaveLength(e.passos.length);
      for (const x of a) expect(x.texto).not.toMatch(/[×÷=<>/%→*]|R\$|\d,\d|(^|\s)\?(\s|$)/);
    }
  });
});
