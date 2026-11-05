// "Como usam" no painel do dono (Lucas, 05/11/2026).
// Só números somados de todas as crianças com conta, a partir do que o servidor já guarda
// (fases feitas, melhores notas, dias de estudo, compras, duelos, trocas, chat).
// Nunca mostra quem é quem.

import type { ProgressoSync } from './sync';

/** Uma fase ou jogo extra de um capítulo. `nota`: onde fica a melhor nota (a prova fica em notas[capítulo]). */
export interface ItemCapitulo { chave: string; nome: string; nota: string }
export interface CapituloUso { id: string; nome: string; itens: ItemCapitulo[] }

export interface CriancaUso {
  progresso: ProgressoSync;
  duelos: number;
  trocas: number;
  mensagens: number;
}

export interface ItemUso {
  nome: string;
  /** Quantas crianças terminaram. */
  fizeram: number;
  /** Média das melhores notas (null quando o jogo não dá nota). */
  media: number | null;
  /** Quantas ficaram com a melhor nota abaixo de 7. */
  abaixo7: number;
}

export interface Uso {
  criancas: number;
  /** Fizeram pelo menos uma fase. */
  estudaram: number;
  /** Estudaram em 2 dias ou mais. */
  voltaram: number;
  mediaDias: number;
  recursos: { nome: string; criancas: number }[];
  capitulos: { id: string; nome: string; comecaram: number; itens: ItemUso[] }[];
}

const NOTA_MINIMA = 7;
const umaCasa = (n: number) => Math.round(n * 10) / 10;

export function resumirUso(lista: CriancaUso[], caps: CapituloUso[]): Uso {
  const conta = (f: (k: CriancaUso) => boolean) => lista.filter(f).length;
  const estudaram = lista.filter((k) => Object.keys(k.progresso.feitas).length > 0);
  return {
    criancas: lista.length,
    estudaram: estudaram.length,
    voltaram: conta((k) => new Set(k.progresso.dias).size >= 2),
    mediaDias: estudaram.length ? umaCasa(estudaram.reduce((s, k) => s + new Set(k.progresso.dias).size, 0) / estudaram.length) : 0,
    recursos: [
      { nome: 'Comprou item na lojinha', criancas: conta((k) => k.progresso.compras.some((c) => !!c.item)) },
      { nome: 'Evoluiu um Sabimon', criancas: conta((k) => k.progresso.compras.some((c) => !!c.forma)) },
      { nome: 'Fez uma troca de cartas', criancas: conta((k) => k.trocas > 0) },
      { nome: 'Jogou o Duelo do Saber', criancas: conta((k) => k.duelos > 0) },
      { nome: 'Escreveu no chat da turma', criancas: conta((k) => k.mensagens > 0) },
      { nome: 'Tem pacote fechado esperando', criancas: conta((k) => k.progresso.pacotes.length > 0) },
    ],
    capitulos: caps.map((c) => ({
      id: c.id,
      nome: c.nome,
      comecaram: conta((k) => c.itens.some((i) => k.progresso.feitas[i.chave])),
      itens: c.itens.map((i) => {
        const notas = lista.map((k) => k.progresso.notas[i.nota]).filter((n): n is number => typeof n === 'number');
        return {
          nome: i.nome,
          fizeram: conta((k) => !!k.progresso.feitas[i.chave]),
          media: notas.length ? umaCasa(notas.reduce((s, n) => s + n, 0) / notas.length) : null,
          abaixo7: notas.filter((n) => n < NOTA_MINIMA).length,
        };
      }),
    })),
  };
}
