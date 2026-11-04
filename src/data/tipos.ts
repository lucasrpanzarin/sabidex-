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

export type TipoSabimon = 'Fogo' | 'Água' | 'Planta' | 'Raio' | 'Pedra' | 'Vento' | 'Areia' | 'Gelo' | 'Som' | 'Estrela';

export interface FormaSabimon {
  nome: string;
  /** nomes dos dois poderes (a força é calculada em src/lib/sabimon.ts). Por enquanto são só enfeite. */
  poderes: [string, string];
  /** caminho do desenho em public/; sem desenho a forma aparece como "Em breve" */
  imagem?: string;
}

/** Um Sabimon: bicho colecionável que vem nos pacotes e evolui em 3 formas. */
export interface Sabimon {
  /** ex.: "s001" */
  id: string;
  numero: number;
  tipo: TipoSabimon;
  raridade: Raridade;
  /** fato verdadeiro sobre o bicho brasileiro que inspirou o Sabimon */
  fato: string;
  formas: [FormaSabimon, FormaSabimon, FormaSabimon];
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
}
