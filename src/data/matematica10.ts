import type { Capitulo } from "./tipos";

// Matemática do 4º ano, Unidade 10 (páginas 144 a 177 do livro). O livro é a base: os exemplos e as contas
// seguem o mesmo nível e o mesmo método, mas os números das contas mudam a cada partida (src/lib/contas.ts).
// Matemática não usa temas, pares nem linha do tempo: as fases usam `matematica` (veja tipos.ts).
// `quiz` e `prova` (múltipla escolha) continuam: o quiz é a fase 4 e os dois servem para o Duelo do Saber.
export const matematica10: Capitulo = {
  "id": "matematica-10",
  "numero": 10,
  "titulo": "Os construtores e os números fracionários",
  "subtitulo": "Frações unitárias, numerador e denominador, reta numérica e fração de quantidade",
  "materia": "Matemática",
  "temas": [],
  "pares": [],
  "linha": [],
  "quiz": [
    { "frase": "Em 2/3, o número 3 é o denominador.", "verdadeira": true, "explicacao": "O denominador fica embaixo e diz em quantas partes iguais o inteiro foi dividido." },
    { "frase": "Em 3/4, o numerador é o 4.", "verdadeira": false, "explicacao": "O numerador fica em cima: em 3/4, é o 3." },
    { "frase": "A fração 1/4 se lê \"um quarto\".", "verdadeira": true, "explicacao": "1/4 é uma parte de 4 partes iguais: um quarto." },
    { "frase": "A fração 7/10 se lê \"sete décimo\".", "verdadeira": false, "explicacao": "Quando o numerador não é 1, o denominador vai para o plural: sete décimos." },
    { "frase": "1/2 é o mesmo que metade.", "verdadeira": true, "explicacao": "Dividir em 2 partes iguais e pegar 1: é a metade." },
    { "frase": "A fração 1/5 é maior do que 1 inteiro.", "verdadeira": false, "explicacao": "As frações unitárias são menores do que 1: são uma parte do inteiro." },
    { "frase": "Para achar 1/3 de 150, fazemos 150 ÷ 3.", "verdadeira": true, "explicacao": "1/3 de 150 é dividir por 3: 150 ÷ 3 = 50." },
    { "frase": "3/5 de 10 é igual a 3.", "verdadeira": false, "explicacao": "1/5 de 10 é 10 ÷ 5 = 2. Então 3/5 é 2 × 3 = 6." },
    { "frase": "0,1 é o mesmo que 1/10.", "verdadeira": true, "explicacao": "0,1 é a forma decimal de um décimo." },
    { "frase": "8% é o mesmo que 8/10.", "verdadeira": false, "explicacao": "Por cento quer dizer a cada 100: 8% = 8/100." },
    { "frase": "Para marcar 1/10 na reta, dividimos do 0 ao 1 em 10 partes iguais.", "verdadeira": true, "explicacao": "E 1/10 é a primeira marcação depois do zero." },
    { "frase": "Se 7/10 dos tijolos já foram assentados, falta 3/7.", "verdadeira": false, "explicacao": "O inteiro é 10/10. Se já foram 7/10, faltam 3/10." }
  ],
  "prova": [
    {
      "pergunta": "Como se lê a fração 3/4?",
      "opcoes": ["Três quartos", "Três quatros", "Quatro terços", "Três quintos"],
      "certa": 0,
      "explicacao": "Numerador 3 (três) e denominador 4 (quartos): três quartos."
    },
    {
      "pergunta": "Na fração 2/5, como se chama o número 5?",
      "opcoes": ["Numerador", "Denominador", "Quociente", "Inteiro"],
      "certa": 1,
      "explicacao": "O número de baixo é o denominador: o inteiro foi dividido em 5 partes iguais."
    },
    {
      "pergunta": "Qual destas frações é uma fração unitária?",
      "opcoes": ["3/4", "2/5", "1/4", "7/10"],
      "certa": 2,
      "explicacao": "Fração unitária tem numerador 1: 1/4."
    },
    {
      "pergunta": "Um cano foi cortado em 10 partes iguais. Que fração do cano é cada parte?",
      "opcoes": ["10/1", "1/5", "9/10", "1/10"],
      "certa": 3,
      "explicacao": "Cada parte é 1 de 10 partes iguais: 1/10, um décimo."
    },
    {
      "pergunta": "Quanto é 1/3 de 150?",
      "opcoes": ["50", "30", "147", "450"],
      "certa": 0,
      "explicacao": "Para achar 1/3, dividimos por 3: 150 ÷ 3 = 50."
    },
    {
      "pergunta": "Quanto é 3/5 de 10?",
      "opcoes": ["2", "6", "3", "30"],
      "certa": 1,
      "explicacao": "1/5 de 10 é 10 ÷ 5 = 2. Depois, 2 × 3 = 6."
    },
    {
      "pergunta": "Andressa dividiu o muro em 3 partes iguais e pintou 2. Que fração ela pintou?",
      "opcoes": ["3/2", "1/3", "2/3", "2/5"],
      "certa": 2,
      "explicacao": "São 3 partes iguais (denominador) e 2 pintadas (numerador): 2/3."
    },
    {
      "pergunta": "Gustavo usou 1/4 de um rolo de 100 metros de fio. Quantos metros ainda há no rolo?",
      "opcoes": ["25 metros", "96 metros", "50 metros", "75 metros"],
      "certa": 3,
      "explicacao": "1/4 de 100 é 100 ÷ 4 = 25. Ainda há 100 − 25 = 75 metros."
    },
    {
      "pergunta": "Dos 12 operários, 3 não usavam capacete. Que fração dos operários usava capacete?",
      "opcoes": ["9/12", "3/12", "12/9", "3/9"],
      "certa": 0,
      "explicacao": "12 − 3 = 9 usavam capacete, de 12 ao todo: 9/12."
    },
    {
      "pergunta": "Rose já assentou 7/10 dos tijolos. Que fração ainda falta assentar?",
      "opcoes": ["7/10", "3/10", "3/7", "10/7"],
      "certa": 1,
      "explicacao": "O inteiro é 10/10. Já foram 7/10, então faltam 3/10."
    }
  ],
  "lacunas": [
    { "frase": "Em 3/4, o número de cima é o ___.", "resposta": "numerador", "distratores": ["denominador", "quociente", "produto"] },
    { "frase": "O número de baixo da fração é o ___.", "resposta": "denominador", "distratores": ["numerador", "divisor", "fator"] },
    { "frase": "A fração 1/2 é o mesmo que ___.", "resposta": "metade", "distratores": ["terça parte", "quarta parte", "décima parte"] },
    { "frase": "A fração 1/3 se lê um ___.", "resposta": "terço", "distratores": ["quarto", "quinto", "meio"] },
    { "frase": "Frações com numerador 1 são frações ___.", "resposta": "unitárias", "distratores": ["inteiras", "decimais", "inversas"] },
    { "frase": "A fração 1/100 se lê um ___.", "resposta": "centésimo", "distratores": ["décimo", "quinto", "cento"] },
    { "frase": "0,1 é a forma ___ de 1/10.", "resposta": "decimal", "distratores": ["fracionária", "unitária", "inteira"] },
    { "frase": "25/100 é o mesmo que 25 ___.", "resposta": "por cento", "distratores": ["décimos", "inteiros", "metades"] }
  ],
  "quemSou": [
    {
      "resposta": "Denominador",
      "pistas": ["Fico embaixo da barra da fração.", "Digo em quantas partes iguais o inteiro foi dividido.", "Em 2/3, eu sou o 3."],
      "distratores": ["Numerador", "Quociente", "Divisor"]
    },
    {
      "resposta": "Numerador",
      "pistas": ["Conto as partes que estamos considerando.", "Fico em cima da barra da fração.", "Em 2/3, eu sou o 2."],
      "distratores": ["Denominador", "Fator", "Produto"]
    },
    {
      "resposta": "Fração unitária",
      "pistas": ["Sou sempre menor do que 1 inteiro.", "Meu numerador é sempre 1.", "1/2, 1/3 e 1/10 são exemplos de mim."],
      "distratores": ["Porcentagem", "Número decimal", "Número inteiro"]
    },
    {
      "resposta": "Porcentagem",
      "pistas": ["Sou uma fração com denominador 100 escrita de outro jeito.", "Me leem como \"por cento\".", "Uso o símbolo %."],
      "distratores": ["Fração unitária", "Numerador", "Reta numérica"]
    },
    {
      "resposta": "Reta numérica",
      "pistas": ["O 0 e o 1 ficam nas minhas pontas.", "Divido a unidade em partes iguais com marcações.", "Sou uma linha com seta que mostra onde fica 1/2."],
      "distratores": ["Quadriculado", "Gráfico de setores", "Tabela"]
    }
  ],
  "classificar": [
    {
      "pergunta": "É fração unitária?",
      "grupos": [
        { "nome": "Unitária", "itens": ["1/2", "1/5", "1/100"] },
        { "nome": "Não unitária", "itens": ["2/3", "3/4", "7/10"] }
      ]
    },
    {
      "pergunta": "Menor que 1 ou igual a 1 inteiro?",
      "grupos": [
        { "nome": "Menor que 1", "itens": ["1/2", "2/3", "9/10"] },
        { "nome": "Igual a 1 inteiro", "itens": ["3/3", "4/4", "10/10"] }
      ]
    }
  ],
  "causas": [
    { "causa": "Queremos saber quanto é 1/3 de 150 pisos", "consequencia": "Dividimos 150 por 3" },
    { "causa": "3/5 é o mesmo que 3 vezes 1/5", "consequencia": "Multiplicamos 1/5 de 10 por 3" },
    { "causa": "O numerador da fração é o número 1", "consequencia": "O denominador é lido no singular" },
    { "causa": "Andressa pintou 2 de 3 partes iguais da parede", "consequencia": "A parte pintada é 2/3 da parede" },
    { "causa": "Rose já assentou 7/10 dos tijolos", "consequencia": "Faltam 3/10 dos tijolos" }
  ],
  "matematica": {
    "nomeDesafio": ["Retas e partes", "Descubra a fração"],
    "exemplos": [
      {
        "titulo": "Frações unitárias",
        "ideia": "Quando dividimos um inteiro em partes **iguais**, cada parte é uma **fração unitária**.",
        "situacao": "Marcelo cortou um cano em 4 partes iguais. Que fração do cano é cada parte?",
        "passos": ["O cano foi dividido em **4** partes iguais.", "Cada parte é **1 parte de 4**.", "Escrevemos **1/4** e lemos **um quarto**."],
        "treino": "fracao-unitaria"
      },
      {
        "titulo": "Numerador e denominador",
        "ideia": "O **denominador** (embaixo) diz em quantas partes iguais o inteiro foi dividido. O **numerador** (em cima) diz quantas partes contamos.",
        "situacao": "Andressa dividiu a parede em 3 partes iguais e pintou 2. Que fração ela pintou?",
        "passos": ["A parede tem **3** partes iguais: o denominador é 3.", "Ela pintou **2** partes: o numerador é 2.", "Ela pintou **2/3** da parede: **dois terços**."],
        "treino": "fracao-figura"
      },
      {
        "titulo": "Frações na reta numérica",
        "ideia": "Na reta, dividimos do **0 ao 1** em partes iguais e contamos as marcações a partir do zero.",
        "situacao": "Onde fica **3/4** na reta numérica?",
        "passos": ["Dividimos do 0 ao 1 em **4** partes iguais.", "Contamos a partir do zero: 1/4, 2/4, **3/4**.", "3/4 é a **terceira marcação** depois do zero."],
        "treino": "fracao-reta"
      },
      {
        "titulo": "Fração unitária de uma quantidade",
        "ideia": "Para achar **1/5** de uma quantidade, dividimos a quantidade **por 5**.",
        "situacao": "Roberto tem 50 pisos para cortar e já cortou 1/5 deles. Quantos pisos ele cortou?",
        "passos": ["1/5 de 50 é dividir 50 em 5 partes iguais.", "Fazemos 50 ÷ 5 = **10**.", "Roberto cortou **10 pisos**."],
        "treino": "fracao-unitaria-quantidade"
      },
      {
        "titulo": "Fração de uma quantidade em duas etapas",
        "ideia": "Para achar **3/5** de uma quantidade: primeiro achamos **1/5**, depois multiplicamos **por 3**.",
        "situacao": "O prédio tem 10 andares, e 3/5 deles estão prontos. Quantos andares estão prontos?",
        "passos": ["1ª etapa: 1/5 de 10 → 10 ÷ 5 = **2**.", "2ª etapa: 3/5 é 3 vezes 1/5 → 2 × 3 = **6**.", "**6 andares** estão prontos."],
        "treino": "fracao-quantidade"
      },
      {
        "titulo": "Centésimos e por cento",
        "ideia": "Frações com denominador **100** podem ser escritas como **porcentagem**, com o símbolo **%**.",
        "situacao": "Como escrever 25/100 com o símbolo %?",
        "passos": ["% se lê **por cento** e quer dizer \"a cada 100\".", "O numerador vira o número antes do %.", "25/100 = **25%**: vinte e cinco por cento."],
        "treino": "porcentagem"
      }
    ],
    "treino": ["fracao-unitaria", "fracao-figura", "fracao-escrita", "fracao-figura", "fracao-unitaria-quantidade", "fracao-unitaria-quantidade", "fracao-quantidade", "fracao-quantidade", "fracao-problema", "porcentagem"],
    "desafio": ["fracao-reta", "fracao-reta", "fracao-figura", "fracao-parte-todo", "fracao-reta", "fracao-resto", "fracao-parte-todo", "fracao-resto"],
    "prova": ["fracao-unitaria", "fracao-figura", "fracao-reta", "fracao-escrita", "fracao-unitaria-quantidade", "fracao-quantidade", "fracao-quantidade", "fracao-problema", "fracao-resto", "porcentagem"]
  }
};
