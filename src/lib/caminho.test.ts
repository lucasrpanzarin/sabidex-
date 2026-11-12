import { describe, it, expect } from 'vitest';
import { destinoVoltar, telaDeJogo } from './caminho';

describe('botão Voltar', () => {
  it('volta para a tela anterior', () => {
    expect(destinoVoltar(['#/', '#/mundos/Geografia'], '#/mundo/geografia-9')).toEqual({ destino: '#/mundos/Geografia', resto: ['#/'] });
  });
  it('quem entrou pelo atalho do Início volta para o Início', () => {
    expect(destinoVoltar(['#/'], '#/fase/geografia-9/quiz').destino).toBe('#/');
  });
  it('pula telas de jogo e de pacote (não recomeça o jogo)', () => {
    expect(destinoVoltar(['#/', '#/mundo/geografia-9', '#/fase/geografia-9/quiz', '#/pacote'], '#/mundo/geografia-9')).toEqual({ destino: '#/', resto: [] });
    expect(telaDeJogo('#/desafio/Hist%C3%B3ria')).toBe(true);
    expect(telaDeJogo('#/mundos/Geografia')).toBe(false);
  });
  it('sem caminho (app acabou de abrir), não tem destino', () => {
    expect(destinoVoltar([], '#/mundo/geografia-9').destino).toBeNull();
  });
});
