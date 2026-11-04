import { describe, expect, it } from 'vitest';
import { conferirMensagem, dentroDoHorario } from './chat';

const motivo = (t: string) => { const r = conferirMensagem(t); return r.ok ? 'ok' : r.motivo; };

describe('chat: o que pode e o que não pode', () => {
  it('deixa mensagens normais', () => {
    for (const t of ['Oi gente!', 'Consegui a forma 3 do Brasinho!!!', 'Alguém quer trocar carta?', 'Cuidado com a prova amanhã', 'Instalei o app ontem',
      'Meu pintor favorito é Tarsila', 'O macaco e o veado são bichos', 'Fiz 100 XP hoje', 'A pizza estava gostosa', 'Bora estudar o mundo 9?'])
      expect(motivo(t), t).toBe('ok');
  });

  it('bloqueia palavrão, mesmo disfarçado', () => {
    for (const t of ['que porra', 'P0RR4 nenhuma', 'p o r r a', 'seu idiota', 'vsf', 'CARALHOOO', 'vai se foder', 'seu cu']) expect(motivo(t), t).toBe('palavrao');
  });

  it('bloqueia telefone, rede social e endereço', () => {
    for (const t of ['me chama no zap', 'meu numero é 11 98765-4321', '(11) 98765 4321', 'qual seu insta?', 'onde voce mora?', 'w h a t s a p p']) expect(motivo(t), t).toBe('contato');
  });

  it('bloqueia links, e-mails e @', () => {
    for (const t of ['olha www.site.com', 'https://x.y', 'meu email é ana@gmail.com', 'me segue @fulano', 'entra em jogo.gg']) expect(motivo(t), t).toBe('link');
  });

  it('limita o tamanho e limpa espaços', () => {
    expect(motivo('   ')).toBe('vazio');
    expect(motivo('a'.repeat(201))).toBe('grande');
    expect(conferirMensagem('  oi    tudo   bem  ')).toEqual({ ok: true, texto: 'oi tudo bem' });
  });
});

describe('chat: horário (Brasília)', () => {
  const as = (h: number) => Date.UTC(2026, 10, 4, h + 3, 0); // h horas em Brasília
  it('abre às 7h e fecha às 21h', () => {
    expect(dentroDoHorario(7, 21, as(6))).toBe(false);
    expect(dentroDoHorario(7, 21, as(7))).toBe(true);
    expect(dentroDoHorario(7, 21, as(20))).toBe(true);
    expect(dentroDoHorario(7, 21, as(21))).toBe(false);
  });
});
