import { describe, it, expect } from 'vitest';
import { resumoMaterias } from './materias';
import { estadoInicial, FASES, type Estado } from './jogo';
import { historia9 } from '../data/historia9';
import { historia10 } from '../data/historia10';
import { ciencias9 } from '../data/ciencias9';
import { matematica9 } from '../data/matematica9';

const caps = [historia9, historia10, matematica9, ciencias9];
const materias = [historia9.materia, matematica9.materia, ciencias9.materia];
const tudo = (...ids: string[]) => Object.fromEntries(ids.flatMap((id) => FASES.map((f) => [`${id}:${f}`, true as const])));
const est = (feitas: Record<string, true>): Estado => ({ ...estadoInicial(), feitas });
const des = (pode: string[], feito: string[] = []) => materias.map((m) => ({ materia: m, pode: pode.includes(m), feito: feito.includes(m) }));

describe('ordem das matérias no Início', () => {
  it('matéria que a criança não começou vem primeiro; a terminada, por último', () => {
    const e = est({ ...tudo('historia-9', 'historia-10'), [`${matematica9.id}:ouvir`]: true });
    const r = resumoMaterias(e, caps, materias, des([historia9.materia, matematica9.materia], [historia9.materia]));
    expect(r.map((x) => [x.materia, x.situacao])).toEqual([
      [ciencias9.materia, 'nova'], [matematica9.materia, 'faltam'], [historia9.materia, 'feito']]);
    expect(r[1].faltam).toBe(FASES.length - 1);
  });

  it('unidade nova numa matéria já começada sobe; desafio pendente fica antes do que já acabou', () => {
    const e = est({ ...tudo('historia-9', matematica9.id, ciencias9.id) });
    const r = resumoMaterias(e, caps, materias, des(materias, [ciencias9.materia]));
    expect(r.map((x) => x.situacao)).toEqual(['unidade-nova', 'desafio', 'feito']);
    expect(r[0].unidadeNova?.id).toBe('historia-10');
    expect(r[1].materia).toBe(matematica9.materia);
  });
});
