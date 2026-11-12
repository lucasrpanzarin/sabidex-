import { describe, it, expect } from 'vitest';
import { concluirDesafio, continuarDe, idPacoteDesafio, marcaDoDesafio, materiasDoDesafio, montarDesafio, PERGUNTAS_DESAFIO, situacaoDesafio } from './desafio';
import { estadoInicial, type Estado } from './jogo';
import { historia9 } from '../data/historia9';
import { historia10 } from '../data/historia10';
import { matematica9 } from '../data/matematica9';

const caps = [historia9, historia10, matematica9];
const agora = new Date(2026, 10, 12, 10);
const D = '2026-11-12';
const comecou = (...ids: string[]): Estado => ({ ...estadoInicial(), feitas: Object.fromEntries(ids.map((id) => [`${id}:ouvir`, true as const])) });

describe('desafio do dia', () => {
  it('só libera matéria com unidade começada', () => {
    const m = materiasDoDesafio(comecou('historia-9'), caps);
    expect(m.find((x) => x.materia === historia9.materia)?.pode).toBe(true);
    expect(m.find((x) => x.materia === matematica9.materia)?.pode).toBe(false);
    expect(montarDesafio(comecou(), caps, historia9.materia, D)).toEqual([]);
  });

  it('10 perguntas, só das unidades começadas, iguais no mesmo dia', () => {
    const e = comecou('historia-9');
    const a = montarDesafio(e, caps, historia9.materia, D);
    expect(a).toHaveLength(PERGUNTAS_DESAFIO);
    expect(a.every((x) => x.cap.id === 'historia-9')).toBe(true);
    const b = montarDesafio(e, caps, historia9.materia, D);
    expect(JSON.stringify(b.map((x) => x.tipo === 'quiz' ? x.q.frase : x.tipo === 'escolha' ? x.pergunta : ''))).toBe(
      JSON.stringify(a.map((x) => x.tipo === 'quiz' ? x.q.frase : x.tipo === 'escolha' ? x.pergunta : '')));
    const outro = montarDesafio(e, caps, historia9.materia, '2026-11-13');
    expect(outro.map((x) => x.tipo === 'escolha' ? x.pergunta : x.tipo)).not.toEqual(a.map((x) => x.tipo === 'escolha' ? x.pergunta : x.tipo));
  });

  it('mistura as duas unidades e a opção certa está no lugar certo', () => {
    const a = montarDesafio(comecou('historia-9', 'historia-10'), caps, historia9.materia, D);
    expect(new Set(a.map((x) => x.cap.id)).size).toBe(2);
    for (const x of a) if (x.tipo === 'escolha') { expect(x.opcoes).toHaveLength(4); expect(x.certa).toBeGreaterThanOrEqual(0); expect(new Set(x.opcoes).size).toBe(4); }
  });

  it('Matemática vem com contas digitadas', () => {
    const a = montarDesafio(comecou('matematica-9'), caps, matematica9.materia, D);
    expect(a).toHaveLength(PERGUNTAS_DESAFIO);
    expect(a.every((x) => x.tipo === 'conta')).toBe(true);
  });

  it('nota 7 dá 1 pacote por matéria por dia, nunca em dobro', () => {
    let e = comecou('historia-9');
    const r1 = concluirDesafio(e, historia9.materia, 8, 10, 'historia-9', agora);
    expect(r1.pacotesGanhos.filter((p) => p.motivo === 'desafio')).toHaveLength(1);
    expect(r1.estado.pacotes.some((p) => p.id === idPacoteDesafio(historia9.materia, D))).toBe(true);
    expect(r1.xpGanho).toBe(8 * 8 + 10);
    e = r1.estado;
    expect(situacaoDesafio(e, historia9.materia, agora).feito).toBe(true);
    const r2 = concluirDesafio(e, historia9.materia, 10, 10, 'historia-9', agora);
    expect(r2.pacotesGanhos.filter((p) => p.motivo === 'desafio')).toHaveLength(0);
    // Outra matéria no mesmo dia ganha o dela.
    const r3 = concluirDesafio(e, matematica9.materia, 7, 10, 'matematica-9', agora);
    expect(r3.pacotesGanhos.filter((p) => p.motivo === 'desafio')).toHaveLength(1);
  });

  it('abaixo de 7 não dá pacote; tentar de novo dá metade do XP', () => {
    const r1 = concluirDesafio(comecou('historia-9'), historia9.materia, 5, 10, 'historia-9', agora);
    expect(r1.pacotesGanhos).toHaveLength(0);
    expect(situacaoDesafio(r1.estado, historia9.materia, agora)).toMatchObject({ feito: false, tentativas: 1 });
    const r2 = concluirDesafio(r1.estado, historia9.materia, 9, 10, 'historia-9', agora);
    expect(r2.xpGanho).toBe(Math.round((9 * 8 + 10) / 2));
    expect(r2.pacotesGanhos.some((p) => p.motivo === 'desafio')).toBe(true);
    // Tentativa nova = perguntas novas.
    const a = montarDesafio(r1.estado, caps, historia9.materia, D, 0).map((x) => x.tipo === 'escolha' ? x.pergunta : x.tipo === 'quiz' ? x.q.frase : '');
    const b = montarDesafio(r1.estado, caps, historia9.materia, D, 1).map((x) => x.tipo === 'escolha' ? x.pergunta : x.tipo === 'quiz' ? x.q.frase : '');
    expect(a).not.toEqual(b);
  });
});

describe('desafio com todas as unidades do app', () => {
  it('todas as perguntas têm 4 opções diferentes e as frases têm o espaço da palavra', async () => {
    const { capitulos } = await import('../data');
    const e = comecou(...capitulos.map((c) => c.id));
    for (const m of new Set(capitulos.map((c) => c.materia))) {
      for (let d = 1; d <= 30; d++) {
        const itens = montarDesafio(e, capitulos, m, `2026-12-${String(d).padStart(2, '0')}`);
        expect(itens).toHaveLength(PERGUNTAS_DESAFIO);
        for (const x of itens) {
          if (x.tipo !== 'escolha') continue;
          expect(new Set(x.opcoes).size, x.pergunta).toBe(4);
          expect(x.opcoes[x.certa]).toBeTruthy();
          if (x.pergunta.startsWith('Complete')) expect(x.pergunta).toContain('___');
        }
      }
    }
  });
});

describe('desafio pela metade', () => {
  const e = comecou('historia-9', 'historia-10');
  const itens = montarDesafio(e, caps, historia9.materia, D);
  const marca = marcaDoDesafio(itens);
  it('continua de onde parou, com os mesmos acertos', () => {
    expect(continuarDe({ dia: D, materia: historia9.materia, marca, i: 4, acertos: 3 }, itens, historia9.materia, D)).toEqual({ i: 4, acertos: 3, voltou: true });
  });
  it('começa do zero em outro dia, outra matéria ou com outras perguntas', () => {
    const zero = { i: 0, acertos: 0, voltou: false };
    expect(continuarDe({ dia: '2026-11-11', materia: historia9.materia, marca, i: 4, acertos: 3 }, itens, historia9.materia, D)).toEqual(zero);
    expect(continuarDe({ dia: D, materia: 'Geografia', marca, i: 4, acertos: 3 }, itens, historia9.materia, D)).toEqual(zero);
    const outras = montarDesafio(e, caps, historia9.materia, D, 1);
    expect(continuarDe({ dia: D, materia: historia9.materia, marca, i: 4, acertos: 3 }, outras, historia9.materia, D)).toEqual(zero);
    expect(continuarDe(null, itens, historia9.materia, D)).toEqual(zero);
  });
  it('as mesmas perguntas dão a mesma marca', () => {
    expect(marcaDoDesafio(montarDesafio(e, caps, historia9.materia, D))).toBe(marca);
  });
});
