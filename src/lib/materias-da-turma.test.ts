import { describe, expect, it } from 'vitest';
import { capitulos, capitulosDe, conteudos } from '../data';
import { estudoDa, type Conta } from './conta';

const conta = (x: Partial<Conta>): Conta => ({ id: 'k', apelido: 'Ana', cor: '#22D3EE', turma: '4º ano B', codigo: 'ARARA-1234', ...x });

describe('matérias de cada turma', () => {
  it('sem turma não tem jogo', () => {
    expect(estudoDa(null)).toMatchObject({ caps: [], situacao: 'sem-turma' });
    // criança só da família: tem conta, mas não tem código de turma
    expect(estudoDa(conta({ codigo: '', turma: '', familia: true, conteudo: 'educativa-4b' }))).toMatchObject({ caps: [], situacao: 'sem-turma' });
  });

  it('turma sem matérias (ou com matérias que não existem) não tem jogo', () => {
    expect(estudoDa(conta({ conteudo: '' }))).toMatchObject({ caps: [], situacao: 'sem-materias' });
    expect(estudoDa(conta({ conteudo: 'nao-existe' }))).toMatchObject({ caps: [], situacao: 'sem-materias' });
  });

  it('a turma da Educativa vê só os capítulos dela', () => {
    const e = estudoDa(conta({ conteudo: 'educativa-4b' }));
    expect(e.situacao).toBe('ok');
    expect(e.caps.map((c) => c.id)).toEqual(capitulosDe('educativa-4b').map((c) => c.id));
    expect(e.materias).toEqual(['História', 'Matemática', 'Geografia', 'Ciências']);
  });

  it('todo capítulo está no livro de alguma turma, sem repetir id', () => {
    const ids = conteudos.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(capitulos.map((c) => c.id)).size).toBe(capitulos.length);
    for (const c of conteudos) expect(c.capitulos.length).toBeGreaterThan(0);
  });
});

describe('vozes de cada matéria', () => {
  it('Geografia só tem Nina e Otto; quem escolheu a Graziella ouve a Nina', async () => {
    const { vozesDaMateria, vozParaMateria } = await import('./voz');
    expect(vozesDaMateria('Geografia').map((v) => v.id)).toEqual(['nina', 'otto']);
    expect(vozesDaMateria('História')).toHaveLength(3);
    expect(vozParaMateria('graziella', 'Geografia')).toBe('nina');
    expect(vozParaMateria('otto', 'Geografia')).toBe('otto');
    expect(vozParaMateria('graziella', 'História')).toBe('graziella');
  });
});
