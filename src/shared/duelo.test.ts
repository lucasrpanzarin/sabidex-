import { describe, expect, it } from 'vitest';
import { historia9 } from '../data/historia9';
import { historia10 } from '../data/historia10';
import { matematica9 } from '../data/matematica9';
import { matematica10 } from '../data/matematica10';
import { semente } from '../lib/contas';
import {
  acertosPorPergunta, corrigir, filtrarUnidades, idRevisaoDuelo, MAX_RELOGIO, montarDuelo, montarRelogio, mundosEmComum, perguntaDuelo,
  PERGUNTAS_DUELO, rodadas, tempoRelogio, vencedorDe, xpDoDuelo,
} from './duelo';

const caps = [historia9, historia10, matematica9, matematica10];
const seq = (vals: number[]) => { let i = 0; return () => vals[i++ % vals.length]; };

describe('Duelo do Saber', () => {
  it('só usa mundos que os dois já ouviram', () => {
    const a = { [`${historia9.id}:ouvir`]: true as const, [`${historia10.id}:ouvir`]: true as const };
    const b = { [`${historia10.id}:ouvir`]: true as const };
    expect(mundosEmComum(caps, a, b).map((c) => c.id)).toEqual([historia10.id]);
    expect(mundosEmComum(caps, a, {})).toEqual([]);
  });

  it('sorteia 10 perguntas diferentes, 6 de escolher e 4 de verdadeiro ou falso, misturando os mundos', () => {
    const ids = montarDuelo([historia9, historia10], seq([0.1, 0.7, 0.4, 0.9, 0.2]));
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

  it('escolhe só a matéria e a unidade pedidas', () => {
    expect(filtrarUnidades(caps, 'Matemática', '').map((c) => c.id)).toEqual([matematica9.id, matematica10.id]);
    expect(filtrarUnidades(caps, 'História', historia10.id).map((c) => c.id)).toEqual([historia10.id]);
    expect(filtrarUnidades(caps, 'História', matematica9.id)).toEqual([]);
    expect(filtrarUnidades(caps, '', '')).toHaveLength(4); // duelo antigo: tudo misturado
    const ids = montarDuelo(filtrarUnidades(caps, 'História', historia9.id));
    expect(ids.every((id) => id.startsWith(`${historia9.id}:`))).toBe(true);
  });

  it('contra o relógio em Matemática: contas com os mesmos números para os dois', () => {
    const ids = montarRelogio([matematica9, matematica10], semente(7));
    expect(ids).toHaveLength(MAX_RELOGIO);
    const a = perguntaDuelo(ids[0], caps)!, b = perguntaDuelo(ids[0], caps)!;
    expect(a.conta).toBeTruthy();
    expect(a.conta!.resposta).toEqual(b.conta!.resposta);
    expect(a.pergunta).toBe(b.pergunta);
    expect(new Set(ids.map((id) => perguntaDuelo(id, caps)!.cap.id)).size).toBe(2);
    expect(idRevisaoDuelo(ids[0])).toMatch(/^matematica-\d+:c-[a-z0-9-]+$/);
    expect(tempoRelogio([matematica9])).toBe(90);
    expect(tempoRelogio([historia9])).toBe(60);
  });

  it('contra o relógio: corrige só as que deu tempo, contas digitadas também', () => {
    const ids = montarRelogio([matematica9], semente(3));
    const certas = ids.slice(0, 4).map((id) => perguntaDuelo(id, caps)!.conta!.resposta);
    expect(corrigir(ids, certas, caps, 'relogio')).toBe(4);
    expect(corrigir(ids, [], caps, 'relogio')).toBe(0);
    expect(corrigir(ids, certas, caps)).toBeNull(); // no duelo normal tem que responder todas
    expect(corrigir(ids, ['oi'], caps, 'relogio')).toBeNull();
    expect(corrigir(ids, new Array(ids.length + 1).fill(1), caps, 'relogio')).toBeNull();
    expect(acertosPorPergunta(ids, [certas[0], -999], caps)).toEqual([true, false]);
    const hist = montarRelogio([historia9, historia10], semente(5));
    expect(hist.every((id) => perguntaDuelo(id, caps) && !perguntaDuelo(id, caps)!.conta)).toBe(true);
    expect(new Set(hist).size).toBe(hist.length);
  });

  it('no relógio o XP para em 10 acertos e a batalha aceita tamanhos diferentes', () => {
    expect(xpDoDuelo(15)).toBe(40);
    const r = rodadas(new Array(12).fill(true), [true, false]);
    expect(r).toHaveLength(12);
    expect(r[11].vidaPara).toBe(0);
    expect(r[1].vidaDe).toBeCloseTo(11 / 12);
  });
});
