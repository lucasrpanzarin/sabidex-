import { describe, expect, it } from 'vitest';
import { concluirExtra, concluirFase, estadoInicial, hoje, type Estado } from './jogo';
import { concluirRevisao } from './revisao';
import { aplicarMissoes, escolherMissoes, missoesDeHoje, quantasFeitas } from './missoes';
import { capitulos } from '../data';

const cap = capitulos[0];
const agora = new Date(2026, 10, 5, 10);
const dia = hoje(agora);

/** Criança que já ouviu, jogou memória e linha do tempo no capítulo. */
const adiantada = (): Estado => ({
  ...estadoInicial(),
  feitas: { [`${cap.id}:ouvir`]: true, [`${cap.id}:memoria`]: true, [`${cap.id}:linha`]: true },
  pacoteDia: dia,
});

describe('missões do dia', () => {
  it('sempre iguais no mesmo dia, e com a revisão quando tem revisão', () => {
    const e = { ...adiantada(), revisao: { [`${cap.id}:q0`]: { caixa: 0, proxima: dia } } };
    const a = escolherMissoes(e, dia);
    expect(a).toEqual(escolherMissoes(e, dia));
    expect(a).toHaveLength(3);
    expect(a[0]).toBe('revisao');
    expect(new Set(a).size).toBe(3);
    expect(a.includes('fase') && a.includes('duas')).toBe(false);
  });

  it('criança nova só recebe missões que consegue fazer', () => {
    const l = escolherMissoes(estadoInicial(), dia);
    expect(l.length).toBeGreaterThan(0);
    l.forEach((m) => expect(['fase', 'duas']).toContain(m));
  });

  it('cada atividade vale para uma missão só, e nota abaixo de 7 não conta', () => {
    const e0 = { ...adiantada(), missoes: { dia, lista: ['quiz', 'fase', 'duas'], progresso: {} } };
    const baixa = aplicarMissoes(e0, concluirFase(e0, cap.id, 'quiz', 5, agora), { tipo: 'fase', fase: 'quiz', nota: 5 }, agora);
    expect(quantasFeitas(baixa.estado.missoes!)).toBe(0);
    const r = aplicarMissoes(e0, concluirFase(e0, cap.id, 'quiz', 10, agora), { tipo: 'fase', fase: 'quiz', nota: 10 }, agora);
    expect(r.estado.missoes!.progresso).toEqual({ quiz: 1 });
    expect(r.missao).toEqual({ texto: 'Jogue o Quiz relâmpago', feitas: 1, total: 3 });
  });

  it('as 3 missões dão 1 pacote, uma vez só no dia', () => {
    let e: Estado = { ...adiantada(), missoes: { dia, lista: ['extra', 'fase', 'duas'], progresso: {} } };
    const passo = (r: ReturnType<typeof aplicarMissoes>) => { e = r.estado; return r; };
    passo(aplicarMissoes(e, concluirExtra(e, cap, 'lacunas', agora, 0, 8), { tipo: 'extra', nota: 8 }, agora));
    passo(aplicarMissoes(e, concluirFase(e, cap.id, 'quiz', 8, agora), { tipo: 'fase', fase: 'quiz', nota: 8 }, agora));
    passo(aplicarMissoes(e, concluirRevisao(e, 4, 5, [cap.id], agora), { tipo: 'revisao', nota: 8 }, agora));
    const ultimo = passo(aplicarMissoes(e, concluirRevisao(e, 5, 5, [cap.id], agora), { tipo: 'revisao', nota: 10 }, agora));
    expect(ultimo.pacotesGanhos.filter((p) => p.motivo === 'missoes')).toHaveLength(1);
    expect(e.pacotes.filter((p) => p.id === `missoes-${dia}`)).toHaveLength(1);
    const depois = aplicarMissoes(e, concluirFase(e, cap.id, 'quiz', 10, agora), { tipo: 'fase', fase: 'quiz', nota: 10 }, agora);
    expect(depois.pacotesGanhos.some((p) => p.motivo === 'missoes')).toBe(false);
  });

  it('no outro dia as missões começam de novo', () => {
    const e = { ...adiantada(), missoes: { dia: '2026-11-04', lista: ['fase'], progresso: { fase: 1 } } };
    expect(missoesDeHoje(e, agora).progresso).toEqual({});
  });
});

describe('marcos de sequência', () => {
  it('3 dias seguidos dão 1 pacote, uma vez por sequência', () => {
    const e0 = { ...adiantada(), dias: ['2026-11-03', '2026-11-04'] };
    const r = aplicarMissoes(e0, concluirFase(e0, cap.id, 'quiz', 8, agora), { tipo: 'fase', fase: 'quiz', nota: 8 }, agora);
    expect(r.pacotesGanhos.filter((p) => p.motivo === 'marco')).toHaveLength(1);
    const de_novo = aplicarMissoes(r.estado, concluirFase(r.estado, cap.id, 'quiz', 8, agora), { tipo: 'fase', fase: 'quiz', nota: 8 }, agora);
    expect(de_novo.pacotesGanhos.some((p) => p.motivo === 'marco')).toBe(false);
  });

  it('com nota abaixo de 7 o marco espera', () => {
    const e0 = { ...adiantada(), dias: ['2026-11-03', '2026-11-04'] };
    const r = aplicarMissoes(e0, concluirFase(e0, cap.id, 'quiz', 4, agora), { tipo: 'fase', fase: 'quiz', nota: 4 }, agora);
    expect(r.pacotesGanhos.some((p) => p.motivo === 'marco')).toBe(false);
  });
});
