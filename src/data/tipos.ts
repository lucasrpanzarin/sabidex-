// Formato de um capítulo do Sabidex.
// Para cadastrar um capítulo novo, crie um arquivo em src/data/ com um objeto `Capitulo`
// e adicione-o à lista em src/data/index.ts.
// Textos podem usar **negrito** para destacar palavras importantes.

export type Raridade = 'comum' | 'rara' | 'epica' | 'lendaria';

export interface Tema {
  titulo: string;
  pontos: string[];
  /** caminho do áudio de narração em public/, ex.: "audio/c9-0.mp3" */
  audio?: string;
}

export interface Par {
  palavra: string;
  significado: string;
}

export interface Evento {
  /** como o ano aparece para a criança, ex.: "730 a.C." */
  ano: string;
  /** número usado para ordenar (anos antes de Cristo são negativos) */
  ordem: number;
  fato: string;
}

export interface Afirmacao {
  frase: string;
  verdadeira: boolean;
  explicacao: string;
}

export interface Questao {
  pergunta: string;
  opcoes: [string, string, string, string];
  /** índice da opção certa (0 a 3) */
  certa: 0 | 1 | 2 | 3;
  explicacao: string;
}

export interface Carta {
  id: string;
  numero: number;
  nome: string;
  raridade: Raridade;
  /** letra ou símbolo curto mostrado no centro da carta */
  simbolo: string;
  fato: string;
}

export interface Capitulo {
  id: string;
  materia: string;
  numero: number;
  titulo: string;
  subtitulo: string;
  temas: Tema[];
  pares: Par[];
  linha: Evento[];
  quiz: Afirmacao[];
  prova: Questao[];
  cartas: Carta[];
}
