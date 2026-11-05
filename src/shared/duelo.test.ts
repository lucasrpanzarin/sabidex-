import { describe, expect, it } from 'vitest';
import { historia9 } from '../data/historia9';
import { historia10 } from '../data/historia10';
import { corrigir, montarDuelo, mundosEmComum, perguntaDuelo, PERGUNTAS_DUELO, rodadas, vencedorDe, xpDoDuelo } from './duelo';

const caps = [historia9, historia10];
const seq = (vals: number[]) => { let i = 0; return () => vals[i++ % vals.length]; };

describe('Duelo do Saber', () => {
  it('só usa mundos que os dois já ouviram', () => {
    const a = { [`${historia9.id}:ouvir`]: true as const, [`${historia10.id}:ouvir`]: true as const };
    const b = { [`${historia10.id}:ouvir`]: true as const };
    expect(mundosEmComum(caps, a, b).map((c) => c.id)).toEqual([historia10.id]);
    expect(mundosEmComum(caps, a, {})).toEqual([]);
  });

  it('sorteia 10 perguntas diferentes, 6 de escolher e 4 de verdadeiro ou falso, misturando os mundos', () => {
    const ids = montarDuelo(caps, seq([0.1, 0.7, 0.4, 0.9, 0.2]));
    expect(ids).toHaveLength(PERGUNTAS_DUELO);
    expect(new Set(ids).size).toBe(PERGUNTAS_DUELO);
    const ps = ids.map((id) => perguntaDuelo(id, caps)!);
    expect(ps.filter((p) => p.vf)).toHaveLength(4);
    expect(new Set(ps.map((p) => p.cap.id)).size).toBe(2);
  });

  it('corrige pelo índice original e recusa respostas estranhas', () => {
    const ids = montarDuelo([historia9]);
    const certas = ids.map((id) => perguntaDuelo(id, caps)!.certa);
    expect(corrigir(ids, certas, caps)).toBe(10);
    const umaErrada = certas.map((c, i) => (i === 0 ? (c + 1) % perguntaDuelo(ids[0], caps)!.opcoes.length : c));
    expect(corrigir(ids, umaErrada, caps)).toBe(9);
    expect(corrigir(ids, certas.slice(1), caps)).toBeNull();
    expect(corrigir(ids, certas.map(() => 7), caps)).toBeNull();
    expect(corrigir(ids, 'oi', caps)).toBeNull();
  });

  it('vence quem acerta mais; a carta não muda o resultado', () => {
    expect(vencedorDe(8, 6)).toBe('de');
    expect(vencedorDe(5, 9)).toBe('para');
    expect(vencedorDe(7, 7)).toBe('empate');
    const r = rodadas([true, true, false], [false, true, true]);
    expect(r[2]).toEqual({ de: false, para: true, vidaDe: 0.8, vidaPara: 0.8 });
  });

  it('dá 4 XP por acerto (no máximo 40)', () => {
    expect(xpDoDuelo(10)).toBe(40);
    expect(xpDoDuelo(0)).toBe(0);
  });
});
