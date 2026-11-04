import { describe, it, expect } from 'vitest';
import { registrarResposta, paraHoje, concluirRevisao, somarDias, idQuiz, idProva, proximaData, quantasHoje } from './revisao';
import { estadoInicial } from './jogo';
import { historia9, } from '../data/historia9';
import { historia10 } from '../data/historia10';

const caps = [historia9, historia10];
const D = '2026-11-04';

describe('revisão do Ará', () => {
  it('soma dias atravessando o mês', () => {
    expect(somarDias('2026-11-29', 3)).toBe('2026-12-02');
  });

  it('erro volta amanhã; acerto novo volta em 3 dias', () => {
    let r = registrarResposta({}, 'a', false, D);
    expect(r.a).toEqual({ caixa: 0, proxima: '2026-11-05' });
    r = registrarResposta({}, 'b', true, D);
    expect(r.b).toEqual({ caixa: 1, proxima: '2026-11-07' });
  });

  it('acertar de novo antes da hora não sobe de caixa', () => {
    const r = registrarResposta({}, 'a', true, D);
    expect(registrarResposta(r, 'a', true, D)).toBe(r);
  });

  it('acertar na hora certa sobe de caixa, até a última', () => {
    let r = registrarResposta({}, 'a', true, D);
    for (let i = 0; i < 10; i++) r = registrarResposta(r, 'a', true, r.a.proxima);
    expect(r.a.caixa).toBe(4);
    expect(registrarResposta(r, 'a', false, r.a.proxima).a.caixa).toBe(0);
  });

  it('mistura capítulos e respeita o máximo', () => {
    let r = {};
    for (let i = 0; i < 6; i++) r = registrarResposta(r, idQuiz('historia-9', i), false, D);
    for (let i = 0; i < 6; i++) r = registrarResposta(r, idProva('historia-10', i), false, D);
    r = registrarResposta(r, 'capitulo-que-sumiu:q0', false, D);
    const amanha = somarDias(D, 1);
    expect(paraHoje(r, caps, D)).toHaveLength(0);
    const itens = paraHoje(r, caps, amanha);
    expect(itens).toHaveLength(8);
    expect(itens[0].cap.id).not.toBe(itens[1].cap.id);
    expect(quantasHoje(r, caps, amanha)).toBe(12);
    expect(proximaData(r, D)).toBe(amanha);
  });

  it('dá XP sempre e pacote só uma vez por dia', () => {
    const e = estadoInicial();
    const a = concluirRevisao(e, 4, 5, ['historia-9'], D);
    expect(a.xpGanho).toBe(50);
    expect(a.pacote).toBe(true);
    expect(a.estado.pacotes).toHaveLength(1);
    expect(a.estado.dias).toContain(D);
    const b = concluirRevisao(a.estado, 5, 5, ['historia-9'], D);
    expect(b.pacote).toBe(false);
    expect(concluirRevisao(e, 3, 3, ['historia-9'], D).pacote).toBe(false);
  });
});
