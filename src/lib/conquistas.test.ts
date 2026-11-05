import { describe, expect, it } from 'vitest';
import { capitulos } from '../data';
import { conquistasDe, maiorSequencia, numerosDoPerfil } from './conquistas';
import { estadoInicial, FASES } from './jogo';

const ganhou = (e: Parameters<typeof conquistasDe>[0]) => conquistasDe(e).filter((c) => c.ganhou).map((c) => c.id);

describe('conquistas', () => {
  it('conta nova não tem nenhuma', () => {
    expect(ganhou(estadoInicial())).toEqual([]);
  });

  it('mundo completo, nota 10 e primeiro passo', () => {
    const cap = capitulos[0].id;
    const e = { ...estadoInicial(), feitas: Object.fromEntries(FASES.map((f) => [`${cap}:${f}`, true as const])), notas: { [cap]: 10 } };
    expect(ganhou(e)).toEqual(expect.arrayContaining(['primeira-fase', 'mundo', 'nota-10']));
    expect(ganhou(e)).not.toContain('tres-mundos');
  });

  it('cartas: forma 2 e lendária', () => {
    const e = { ...estadoInicial(), cartas: { 's001-2': 1, s010: 1 } };
    const n = numerosDoPerfil(e);
    expect(n.bichos).toBe(2);
    expect(ganhou(e)).toEqual(expect.arrayContaining(['evoluir', 'lendaria']));
  });

  it('mostra quanto falta, sem passar do alvo', () => {
    const e = { ...estadoInicial(), xp: 99_999 };
    const nv = conquistasDe(e).find((c) => c.id === 'nivel-10')!;
    expect(nv).toMatchObject({ tem: 10, alvo: 10, ganhou: true });
  });

  it('maior sequência lembra a melhor, mesmo se parou', () => {
    const dias = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05', '2026-01-06', '2026-01-07', '2026-03-01'];
    expect(maiorSequencia(dias)).toBe(7);
    expect(maiorSequencia([])).toBe(0);
  });
});
