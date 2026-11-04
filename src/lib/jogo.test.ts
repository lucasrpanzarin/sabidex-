import { describe, expect, it } from 'vitest';
import { GARANTIA, abrirPacote, concluirFase, estadoInicial, garantiaAtiva, guardarCartas, liberada, migrarCartasAntigas, nivel, notaDe, sequencia } from './jogo';
import { sabimons } from '../data/sabimons';
const desenhos = import.meta.glob('/public/sabimons/*.webp');
import { historia9 } from '../data/historia9';
import { historia10 } from '../data/historia10';

const seq = (vals: number[]) => { let i = 0; return () => vals[i++ % vals.length]; };

describe('níveis', () => {
  it('sobe a cada 300 XP', () => {
    expect(nivel(0).nivel).toBe(1);
    expect(nivel(299).nivel).toBe(1);
    expect(nivel(300)).toEqual({ nivel: 2, noNivel: 0, total: 300 });
  });
});

describe('fases', () => {
  it('libera em ordem', () => {
    let e = estadoInicial();
    expect(liberada(e, 'h9', 'ouvir')).toBe(true);
    expect(liberada(e, 'h9', 'memoria')).toBe(false);
    e = concluirFase(e, 'h9', 'ouvir').estado;
    expect(liberada(e, 'h9', 'memoria')).toBe(true);
  });

  const dia = new Date(2026, 10, 4, 10);
  const motivos = (r: { pacotesGanhos: { motivo: string }[] }) => r.pacotesGanhos.map((p) => p.motivo);

  it('dá pacote na primeira vez do jogo da memória e não ao repetir', () => {
    const r1 = concluirFase(estadoInicial(), 'h9', 'memoria', undefined, dia);
    expect(motivos(r1)).toEqual(['fase', 'dia']);
    expect(r1.xpGanho).toBe(60);
    const r2 = concluirFase(r1.estado, 'h9', 'memoria', undefined, dia);
    expect(r2.pacotesGanhos).toEqual([]);
    expect(r2.xpGanho).toBe(30);
    expect(r2.estado.pacotes).toHaveLength(2);
  });

  it('dá um pacote do dia na primeira fase de cada dia', () => {
    const r1 = concluirFase(estadoInicial(), 'h9', 'ouvir', undefined, dia);
    expect(motivos(r1)).toEqual(['dia']);
    const r2 = concluirFase(r1.estado, 'h9', 'ouvir', undefined, dia);
    expect(motivos(r2)).toEqual([]);
    const r3 = concluirFase(r2.estado, 'h9', 'ouvir', undefined, new Date(2026, 10, 5, 10));
    expect(motivos(r3)).toEqual(['dia']);
  });

  it('dá um pacote de presente ao subir de nível', () => {
    const e = { ...estadoInicial(), xp: 290, pacoteDia: '2026-11-04' };
    const r = concluirFase(e, 'h9', 'ouvir', undefined, dia);
    expect(r.subiuNivel).toBe(true);
    expect(motivos(r)).toEqual(['nivel']);
  });

  it('prova só conta com nota 7 ou mais', () => {
    const reprovou = concluirFase(estadoInicial(), 'h9', 'prova', 6.5);
    expect(reprovou.estado.feitas['h9:prova']).toBeUndefined();
    expect(reprovou.pacotesGanhos).toEqual([]);
    const passou = concluirFase(reprovou.estado, 'h9', 'prova', 8);
    expect(passou.pacotesGanhos[0]).toEqual({ tipo: 'epico', motivo: 'prova' });
    expect(passou.estado.notas.h9).toBe(8);
  });
});

describe('sequência de dias', () => {
  it('conta dias seguidos até hoje ou ontem', () => {
    const agora = new Date(2026, 10, 4, 10);
    expect(sequencia(['2026-11-02', '2026-11-03', '2026-11-04'], agora)).toBe(3);
    expect(sequencia(['2026-11-02', '2026-11-03'], agora)).toBe(2);
    expect(sequencia(['2026-11-01'], agora)).toBe(0);
  });
});

describe('pacotes', () => {
  it('sempre traz 3 Sabimons diferentes', () => {
    for (let t = 0; t < 200; t++) {
      const c = abrirPacote(sabimons, 'normal');
      expect(c).toHaveLength(3);
      expect(new Set(c.map((x) => x.id)).size).toBe(3);
      c.forEach((x) => expect(sabimons).toContain(x));
    }
  });

  it('pacote épico garante épico ou lendário', () => {
    for (let t = 0; t < 200; t++) {
      const c = abrirPacote(sabimons, 'epico');
      expect(c.some((x) => x.raridade === 'epica' || x.raridade === 'lendaria')).toBe(true);
    }
  });

  it('guarda os Sabimons e remove o pacote', () => {
    const r = concluirFase(estadoInicial(), 'historia-9', 'memoria');
    const p = r.estado.pacotes[0];
    const novas = abrirPacote(sabimons, p.tipo, seq([0.1, 0.5, 0.9]));
    const e = guardarCartas(r.estado, p.id, novas);
    expect(e.pacotes).toHaveLength(r.estado.pacotes.length - 1);
    expect(e.abertos).toContain(p.id);
    expect(Object.values(e.cartas).reduce((a, b) => a + b, 0)).toBe(3);
    expect(e.semNovo).toBe(0);
  });

  it('garantia: depois de muitos pacotes repetidos, vem um Sabimon novo', () => {
    const quase = Object.fromEntries(sabimons.slice(0, 9).map((s) => [s.id, 2]));
    let e = { ...estadoInicial(), cartas: quase, semNovo: GARANTIA - 1 };
    expect(garantiaAtiva(e)).toBe(true);
    for (let t = 0; t < 50; t++) {
      const c = abrirPacote(sabimons, 'normal', Math.random, { tem: e.cartas, garantia: true });
      expect(c.some((x) => x.id === 's010')).toBe(true);
    }
    e = guardarCartas({ ...e, pacotes: [{ id: 'x', tipo: 'normal', capitulo: 'h9' }] }, 'x', [sabimons[0], sabimons[1], sabimons[2]]);
    expect(e.semNovo).toBe(GARANTIA);
  });

  it('cartas antigas viram pacotes, uma vez só', () => {
    const validos = new Set(sabimons.map((s) => s.id));
    const e = { ...estadoInicial(), cartas: { 'h-001': 2, 'h-020': 5, s001: 1 } };
    const m = migrarCartasAntigas(e, validos);
    expect(m.cartas).toEqual({ s001: 1 });
    expect(m.pacotes.map((p) => p.id)).toEqual(['antigas-1', 'antigas-2', 'antigas-3']);
    // abrir um e migrar de novo (outro aparelho com cartas antigas) não dá pacote em dobro
    const outra = migrarCartasAntigas({ ...m, cartas: { 'h-001': 7 }, pacotes: m.pacotes.slice(1), abertos: ['antigas-1'] }, validos);
    expect(outra.pacotes.map((p) => p.id)).toEqual(['antigas-2', 'antigas-3']);
  });
});

describe('conteúdo', () => {
  for (const cap of [historia9, historia10]) {
    it(`${cap.titulo} está completo`, () => {
      expect(cap.temas.length).toBeGreaterThan(0);
      expect(cap.pares.length).toBeGreaterThanOrEqual(6);
      expect(cap.linha.length).toBeGreaterThanOrEqual(6);
      expect(cap.prova).toHaveLength(10);
      cap.prova.forEach((q) => expect(q.opcoes[q.certa]).toBeTruthy());
    });
  }
  it('Sabimons têm ids únicos e desenhos que existem', () => {
    expect(new Set(sabimons.map((s) => s.id)).size).toBe(sabimons.length);
    for (const s of sabimons) {
      expect(s.formas[0].imagem).toBeTruthy();
      for (const f of s.formas) if (f.imagem) expect(desenhos[`/public/${f.imagem}`]).toBeTruthy();
    }
  });
  it('nota vai de 0 a 10 com meio ponto', () => {
    expect(notaDe(7, 10)).toBe(7);
    expect(notaDe(9, 20)).toBe(4.5);
  });
});

describe('jogos extras', () => {
  it('os dois capítulos têm os 4 jogos extras', async () => {
    const { extrasDo } = await import('./jogo');
    expect(extrasDo(historia9)).toEqual(['lacunas', 'quemsou', 'grupos', 'causas']);
    expect(extrasDo(historia10)).toHaveLength(4);
  });

  it('dá XP e um pacote quando termina todos', async () => {
    const { concluirExtra, extrasLiberados, estadoInicial: ini } = await import('./jogo');
    let e = ini();
    expect(extrasLiberados(e, 'historia-9')).toBe(false);
    const r1 = concluirExtra(e, historia9, 'lacunas');
    expect(r1.xpGanho).toBe(40);
    expect(r1.pacotesGanhos.map((p) => p.motivo)).not.toContain('extras');
    e = r1.estado;
    e = concluirExtra(e, historia9, 'quemsou').estado;
    e = concluirExtra(e, historia9, 'grupos').estado;
    const ultimo = concluirExtra(e, historia9, 'causas');
    expect(ultimo.pacotesGanhos.map((p) => p.motivo)).toContain('extras');
    const repetido = concluirExtra(ultimo.estado, historia9, 'causas');
    expect(repetido.xpGanho).toBe(20);
    expect(repetido.pacotesGanhos.map((p) => p.motivo)).not.toContain('extras');
  });
});
