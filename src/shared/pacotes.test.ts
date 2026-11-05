import { describe, expect, it } from 'vitest';
import { sabimonPorId } from '../data';
import { PACOTES_POR_DIA, diaBR, sortearPacote, type Contadores } from './pacotes';
import { progressoVazio } from './sync';

const cont = (o: Partial<Contadores> = {}): Contadores => ({ semNovo: 0, dia: '2026-11-05', hoje: 0, epicos: 0, ...o });
const op = { capitulos: 3, dia: '2026-11-05' };
const comPacote = (tipo: 'normal' | 'epico', feitas: Record<string, true> = {}) =>
  ({ ...progressoVazio(), feitas, pacotes: [{ id: 'p1', tipo, capitulo: 'historia-9' }] });

describe('abrir pacote no servidor', () => {
  it('sorteia 1 Sabimon, tira o pacote da lista e marca como aberto', () => {
    const r = sortearPacote(comPacote('normal'), 'p1', {}, cont(), op);
    if ('erro' in r) throw new Error(r.erro);
    expect(r.cartas).toHaveLength(1);
    expect(sabimonPorId.has(r.cartas[0])).toBe(true);
    expect(r.progresso.pacotes).toHaveLength(0);
    expect(r.progresso.abertos).toEqual(['p1']);
    expect(r.contadores.hoje).toBe(1);
  });

  it('não abre pacote que não existe nem pacote já aberto', () => {
    expect('erro' in sortearPacote(comPacote('normal'), 'outro', {}, cont(), op)).toBe(true);
    expect('erro' in sortearPacote({ ...comPacote('normal'), abertos: ['p1'] }, 'p1', {}, cont(), op)).toBe(true);
  });

  it('para no limite do dia, e o limite volta no dia seguinte', () => {
    expect('erro' in sortearPacote(comPacote('normal'), 'p1', {}, cont({ hoje: PACOTES_POR_DIA }), op)).toBe(true);
    const r = sortearPacote(comPacote('normal'), 'p1', {}, cont({ dia: '2026-11-04', hoje: PACOTES_POR_DIA }), op);
    expect('erro' in r).toBe(false);
  });

  it('pacote épico só vale com a prova feita e até 1 por capítulo; senão abre como normal', () => {
    const raroDemais = (cartas: string[]) => cartas.every((id) => ['epica', 'lendaria'].includes(sabimonPorId.get(id)!.raridade));
    for (let t = 0; t < 100; t++) {
      const ok = sortearPacote(comPacote('epico', { 'historia-9:prova': true }), 'p1', {}, cont(), { ...op, rng: Math.random });
      if ('erro' in ok) throw new Error(ok.erro);
      expect(raroDemais(ok.cartas)).toBe(true);
      expect(ok.contadores.epicos).toBe(1);
    }
    // sem a prova feita: abre como normal (rng 0 = sempre comum)
    const sem = sortearPacote(comPacote('epico'), 'p1', {}, cont(), { ...op, rng: () => 0 });
    if ('erro' in sem) throw new Error(sem.erro);
    expect(sabimonPorId.get(sem.cartas[0])!.raridade).toBe('comum');
    expect(sem.contadores.epicos).toBe(0);
    // já abriu um épico por capítulo
    const cheio = sortearPacote(comPacote('epico', { 'historia-9:prova': true }), 'p1', {}, cont({ epicos: 3 }), { ...op, rng: () => 0 });
    if ('erro' in cheio) throw new Error(cheio.erro);
    expect(sabimonPorId.get(cheio.cartas[0])!.raridade).toBe('comum');
  });

  it('a garantia traz um Sabimon novo e zera a contagem', () => {
    const tem = { s001: 2 };
    const r = sortearPacote(comPacote('normal'), 'p1', tem, cont({ semNovo: 9 }), op);
    if ('erro' in r) throw new Error(r.erro);
    expect(tem[r.cartas[0] as 's001']).toBeUndefined();
    expect(r.contadores.semNovo).toBe(0);
  });

  it('dia de Brasília vira 3 horas depois de Londres', () => {
    expect(diaBR(Date.UTC(2026, 10, 6, 2, 0))).toBe('2026-11-05');
    expect(diaBR(Date.UTC(2026, 10, 6, 4, 0))).toBe('2026-11-06');
  });
});
