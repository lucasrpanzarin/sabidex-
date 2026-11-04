import { describe, expect, it } from 'vitest';
import { abrirPacote, concluirFase, estadoInicial, guardarCartas, liberada, nivel, notaDe, sequencia } from './jogo';
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

  it('dá pacote na primeira vez do jogo da memória e não ao repetir', () => {
    const r1 = concluirFase(estadoInicial(), 'h9', 'memoria');
    expect(r1.pacoteGanho).toBe('normal');
    expect(r1.xpGanho).toBe(60);
    const r2 = concluirFase(r1.estado, 'h9', 'memoria');
    expect(r2.pacoteGanho).toBeNull();
    expect(r2.xpGanho).toBe(30);
    expect(r2.estado.pacotes).toHaveLength(1);
  });

  it('prova só conta com nota 7 ou mais', () => {
    const reprovou = concluirFase(estadoInicial(), 'h9', 'prova', 6.5);
    expect(reprovou.estado.feitas['h9:prova']).toBeUndefined();
    expect(reprovou.pacoteGanho).toBeNull();
    const passou = concluirFase(reprovou.estado, 'h9', 'prova', 8);
    expect(passou.pacoteGanho).toBe('epico');
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
  it('sempre traz 3 cartas diferentes do capítulo', () => {
    for (let t = 0; t < 200; t++) {
      const c = abrirPacote(historia9.cartas, 'normal');
      expect(c).toHaveLength(3);
      expect(new Set(c.map((x) => x.id)).size).toBe(3);
      c.forEach((x) => expect(historia9.cartas).toContain(x));
    }
  });

  it('pacote épico garante épica ou lendária', () => {
    for (let t = 0; t < 200; t++) {
      const c = abrirPacote(historia10.cartas, 'epico');
      expect(c.some((x) => x.raridade === 'epica' || x.raridade === 'lendaria')).toBe(true);
    }
  });

  it('guarda as cartas e remove o pacote', () => {
    const r = concluirFase(estadoInicial(), 'historia-9', 'memoria');
    const p = r.estado.pacotes[0];
    const novas = abrirPacote(historia9.cartas, p.tipo, seq([0.1, 0.5, 0.9]));
    const e = guardarCartas(r.estado, p.id, novas);
    expect(e.pacotes).toHaveLength(0);
    expect(Object.values(e.cartas).reduce((a, b) => a + b, 0)).toBe(3);
  });
});

describe('conteúdo', () => {
  for (const cap of [historia9, historia10]) {
    it(`${cap.titulo} está completo`, () => {
      expect(cap.temas.length).toBeGreaterThan(0);
      expect(cap.pares.length).toBeGreaterThanOrEqual(6);
      expect(cap.linha.length).toBeGreaterThanOrEqual(6);
      expect(cap.prova).toHaveLength(10);
      expect(cap.cartas).toHaveLength(12);
      cap.prova.forEach((q) => expect(q.opcoes[q.certa]).toBeTruthy());
    });
  }
  it('nota vai de 0 a 10 com meio ponto', () => {
    expect(notaDe(7, 10)).toBe(7);
    expect(notaDe(9, 20)).toBe(4.5);
  });
});
