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

/** Complete a frase: `frase` tem ___ no lugar da palavra-chave. */
export interface Lacuna {
  frase: string;
  resposta: string;
  distratores: [string, string, string];
}

/** Quem sou eu? 3 pistas, da mais difícil para a mais fácil. */
export interface QuemSouEu {
  resposta: string;
  pistas: [string, string, string];
  distratores: [string, string, string];
}

/** Separe nos grupos: 2 ou 3 grupos com 2 a 4 itens cada. */
export interface Classificar {
  pergunta: string;
  grupos: { nome: string; itens: string[] }[];
}

export interface CausaEfeito {
  causa: string;
  consequencia: string;
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

/** Exemplo resolvido passo a passo (fase "Ver como se faz"). Depois dele, a criança resolve uma conta do mesmo tipo. */
export interface ExemploResolvido {
  titulo: string;
  /** a ideia principal, em uma frase (pode ter **negrito**) */
  ideia: string;
  /** a situação do exemplo (do livro ou no mesmo nível) */
  situacao: string;
  /** cada passo aparece de um em um */
  passos: string[];
  /** tipo de conta para o "Agora você" (chave de GERADORES em src/lib/contas.ts) */
  treino: string;
}

/**
 * Matemática se aprende fazendo. As fases do mapa continuam as mesmas (estrelas, nota 7, pacotes),
 * mas o que tem dentro muda: ouvir → "Ver como se faz", memória → "Treino de contas",
 * linha → "Balança e sequências", prova → contas digitadas. O quiz continua de verdadeiro ou falso.
 * As listas são tipos de conta de src/lib/contas.ts, na ordem em que aparecem (do mais fácil ao mais difícil).
 * Os números mudam a cada partida. `prova` (múltipla escolha) do capítulo continua valendo para o Duelo do Saber.
 */
export interface Matematica {
  exemplos: ExemploResolvido[];
  treino: string[];
  desafio: string[];
  prova: string[];
}

export interface Capitulo {
  id: string;
  materia: string;
  numero: number;
  titulo: string;
  subtitulo: string;
  /** Só em Matemática: as fases viram exemplo resolvido, treino de contas digitadas e prova de contas (veja `Matematica`). */
  matematica?: Matematica;
  temas: Tema[];
  pares: Par[];
  linha: Evento[];
  /** Não reordene nem apague itens de um capítulo publicado: a Revisão do Ará guarda as perguntas pela posição. Acrescente no fim. */
  quiz: Afirmacao[];
  prova: Questao[];
  /** Jogos extras (opcionais). Só aparecem no app quando o capítulo tem material suficiente. */
  lacunas?: Lacuna[];
  quemSou?: QuemSouEu[];
  classificar?: Classificar[];
  causas?: CausaEfeito[];
}
