import type { Capitulo } from "./tipos";

// Matemática do 4º ano, Unidade 8 (páginas 52 a 99 do livro). O livro é a base: os exemplos e as contas
// seguem o mesmo nível e o mesmo método, mas os números das contas mudam a cada partida (src/lib/contas.ts).
// Respostas com vírgula: o teclado ganha a tecla "," (campo `decimal` da conta).
// Matemática não usa temas, pares nem linha do tempo: as fases usam `matematica` (veja tipos.ts).
// `quiz` e `prova` (múltipla escolha) continuam: o quiz é a fase 4 e os dois servem para o Duelo do Saber.
export const matematica8: Capitulo = {
  "id": "matematica-8",
  "numero": 8,
  "titulo": "Venda de produtos e números em representação decimal",
  "subtitulo": "Real e centavos, décimos e centésimos, comparar, somar e subtrair com vírgula",
  "materia": "Matemática",
  "temas": [],
  "pares": [],
  "linha": [],
  "quiz": [
    { "frase": "Dividindo 1 real em 10 partes iguais, cada parte é 1 décimo, ou 10 centavos.", "verdadeira": true, "explicacao": "Cada décimo de real é uma moeda de 10 centavos: R$ 0,10." },
    { "frase": "Um décimo se escreve 0,01.", "verdadeira": false, "explicacao": "Um décimo é 0,1. O número 0,01 é um centésimo." },
    { "frase": "1 centavo é 1 centésimo do real: R$ 0,01.", "verdadeira": true, "explicacao": "Dividindo 1 real em 100 partes iguais, cada parte é 1 centavo." },
    { "frase": "Escrevemos 10 centavos como R$ 10,00.", "verdadeira": false, "explicacao": "R$ 10,00 são dez reais. Dez centavos se escrevem R$ 0,10." },
    { "frase": "No número 87,99, a parte inteira é 87.", "verdadeira": true, "explicacao": "A parte inteira fica à esquerda da vírgula: 87." },
    { "frase": "A parte decimal fica à esquerda da vírgula.", "verdadeira": false, "explicacao": "A parte decimal fica à direita da vírgula. À esquerda fica a parte inteira." },
    { "frase": "50 centavos correspondem a 5 décimos de 1 real.", "verdadeira": true, "explicacao": "Cada décimo de real vale 10 centavos: 50 ÷ 10 = 5 décimos." },
    { "frase": "18,40 é maior do que 18,95.", "verdadeira": false, "explicacao": "As partes inteiras são iguais (18). Nos décimos, 4 é menor que 9. Então 18,40 é menor." },
    { "frase": "Para somar 75,50 + 90,99, colocamos vírgula embaixo de vírgula.", "verdadeira": true, "explicacao": "Alinhando as ordens, as vírgulas ficam alinhadas: 75,50 + 90,99 = 166,49." },
    { "frase": "52,84 + 69,7 = 59,81.", "verdadeira": false, "explicacao": "Esse erro acontece quando a vírgula não fica alinhada. O certo é 52,84 + 69,70 = 122,54." },
    { "frase": "Na calculadora, para fazer 14,9 + 5,6, digitamos 14.9 + 5.6.", "verdadeira": true, "explicacao": "Na calculadora, o ponto faz o papel da vírgula. O resultado é 20.5, ou seja, 20,5." },
    { "frase": "100 − 88,88 = 12,12.", "verdadeira": false, "explicacao": "Escrevemos 100 como 100,00 e subtraímos trocando: 100,00 − 88,88 = 11,12." }
  ],
  "prova": [
    {
      "pergunta": "Como se escreve um décimo com algarismos e vírgula?",
      "opcoes": ["0,1", "0,01", "1,0", "10,0"],
      "certa": 0,
      "explicacao": "Um décimo fica na 1ª casa depois da vírgula: 0,1."
    },
    {
      "pergunta": "Um centésimo de real é o mesmo que:",
      "opcoes": ["10 centavos", "1 centavo", "1 real", "100 reais"],
      "certa": 1,
      "explicacao": "Dividindo 1 real em 100 partes iguais, cada parte é 1 centavo: R$ 0,01."
    },
    {
      "pergunta": "Quando dividimos o todo em dez partes iguais, cada parte se chama:",
      "opcoes": ["centésimo", "dezena", "décimo", "centavo"],
      "certa": 2,
      "explicacao": "Cada uma das 10 partes iguais do todo é um décimo."
    },
    {
      "pergunta": "Como se lê o valor R$ 87,99?",
      "opcoes": ["Oitenta e sete centavos e noventa e nove reais", "Oito reais e setenta e nove centavos", "Oitocentos e setenta e nove reais", "Oitenta e sete reais e noventa e nove centavos"],
      "certa": 3,
      "explicacao": "Os reais vêm antes da vírgula (87) e os centavos depois (99)."
    },
    {
      "pergunta": "No número 64,78, quanto vale o algarismo 7?",
      "opcoes": ["7 décimos, ou 0,7", "7 centésimos, ou 0,07", "7 unidades, ou 7", "7 dezenas, ou 70"],
      "certa": 0,
      "explicacao": "O 7 é o 1º algarismo depois da vírgula: está na ordem dos décimos e vale 0,7."
    },
    {
      "pergunta": "Qual é o jeito certo de escrever 10 centavos?",
      "opcoes": ["R$ 10,00", "R$ 0,10", "R$ 1,00", "R$ 0,01"],
      "certa": 1,
      "explicacao": "10 centavos é 1 décimo de real: R$ 0,10. R$ 10,00 são dez reais."
    },
    {
      "pergunta": "Qual livro é o mais barato? Cinderela: R$ 18,95. O patinho feio: R$ 18,40. O gato de botas: R$ 19,20. Os três porquinhos: R$ 18,49.",
      "opcoes": ["Cinderela", "O gato de botas", "O patinho feio", "Os três porquinhos"],
      "certa": 2,
      "explicacao": "18,95, 18,40 e 18,49 têm a mesma parte inteira (18). Nos décimos, 4 é o menor; entre 18,40 e 18,49, nos centésimos, 0 é menor que 9. O patinho feio é o mais barato."
    },
    {
      "pergunta": "Vicente vendeu duas blusas: uma de R$ 75,50 e outra de R$ 90,99. Qual foi o total da compra?",
      "opcoes": ["R$ 165,49", "R$ 166,59", "R$ 156,49", "R$ 166,49"],
      "certa": 3,
      "explicacao": "Vírgula embaixo de vírgula: 75,50 + 90,99 = 166,49."
    },
    {
      "pergunta": "O protetor solar custava R$ 118,99 e agora custa R$ 87,50. Qual é o valor do desconto?",
      "opcoes": ["R$ 31,49", "R$ 31,59", "R$ 30,49", "R$ 41,49"],
      "certa": 0,
      "explicacao": "O desconto é a diferença: 118,99 − 87,50 = 31,49."
    },
    {
      "pergunta": "Igor pagou um iogurte de R$ 4,50 com uma cédula de 10 reais. Como ele deve armar a conta do troco?",
      "opcoes": ["0,10 − 4,50, com o 10 depois da vírgula", "10,00 − 4,50, com vírgula embaixo de vírgula", "10 − 450, sem usar a vírgula", "4,50 − 10,00, com o menor em cima"],
      "certa": 1,
      "explicacao": "10 reais se escreve 10,00. Com vírgula embaixo de vírgula: 10,00 − 4,50 = 5,50 de troco."
    }
  ],
  "lacunas": [
    { "frase": "Dividindo 1 real em 10 partes iguais, cada parte é 1 ___.", "resposta": "décimo", "distratores": ["centésimo", "centavo", "inteiro"] },
    { "frase": "Dividindo 1 real em 100 partes iguais, cada parte é 1 ___.", "resposta": "centésimo", "distratores": ["décimo", "dezena", "real"] },
    { "frase": "No Brasil, a moeda oficial se chama ___.", "resposta": "real", "distratores": ["centavo", "cédula", "troco"] },
    { "frase": "A parte ___ fica à esquerda da vírgula.", "resposta": "inteira", "distratores": ["decimal", "menor", "centésima"] },
    { "frase": "A parte ___ fica à direita da vírgula.", "resposta": "decimal", "distratores": ["inteira", "maior", "dezena"] },
    { "frase": "O quadro de ___ ajuda a escrever números com vírgula.", "resposta": "ordens", "distratores": ["preços", "moedas", "cores"] },
    { "frase": "Na calculadora, usamos o ___ no lugar da vírgula.", "resposta": "ponto", "distratores": ["traço", "zero", "sinal de mais"] },
    { "frase": "Para somar números com vírgula, pomos vírgula embaixo de ___.", "resposta": "vírgula", "distratores": ["zero", "ponto", "unidade"] }
  ],
  "quemSou": [
    {
      "resposta": "Décimo",
      "pistas": ["Sou 1 de 10 partes iguais do inteiro.", "Fico na 1ª casa depois da vírgula.", "Me escrevem assim: 0,1."],
      "distratores": ["Centésimo", "Centavo", "Inteiro"]
    },
    {
      "resposta": "Centésimo",
      "pistas": ["Sou 1 de 100 partes iguais do inteiro.", "Fico na 2ª casa depois da vírgula.", "Me escrevem assim: 0,01."],
      "distratores": ["Décimo", "Dezena", "Real"]
    },
    {
      "resposta": "Vírgula",
      "pistas": ["Separo a parte inteira da parte decimal.", "Na calculadora, o ponto faz o meu papel.", "Em R$ 87,99, eu fico entre o 7 e o 9."],
      "distratores": ["Ponto final", "Quadro de ordens", "Sinal de igual"]
    },
    {
      "resposta": "Troco",
      "pistas": ["Apareço quando alguém paga com mais dinheiro do que o preço.", "Para me achar, fazemos uma subtração.", "Igor pagou R$ 10,00 por um iogurte de R$ 4,50: eu sou R$ 5,50."],
      "distratores": ["Desconto", "Comissão", "Preço"]
    },
    {
      "resposta": "Comissão",
      "pistas": ["Sou uma recompensa em dinheiro.", "Alguns vendedores me recebem.", "Sou calculada sobre o valor da venda realizada."],
      "distratores": ["Troco", "Desconto", "Centavo"]
    }
  ],
  "classificar": [
    {
      "pergunta": "Quanto vale o 5?",
      "grupos": [
        { "nome": "5 décimos", "itens": ["0,5", "2,5", "10,5"] },
        { "nome": "5 centésimos", "itens": ["0,05", "2,05", "10,05"] }
      ]
    },
    {
      "pergunta": "Menos de 1 real ou 1 real ou mais?",
      "grupos": [
        { "nome": "Menos de 1 real", "itens": ["R$ 0,99", "R$ 0,10", "50 centavos"] },
        { "nome": "1 real ou mais", "itens": ["R$ 1,00", "R$ 10,00", "R$ 1,05"] }
      ]
    }
  ],
  "causas": [
    { "causa": "Dividimos 1 real em 10 partes iguais", "consequencia": "Cada parte é 1 décimo, ou 10 centavos" },
    { "causa": "18,40 e 18,95 têm a mesma parte inteira", "consequencia": "Começamos a comparar pelos décimos" },
    { "causa": "Entre 18,40, 18,95 e 19,20, a maior parte inteira é 19", "consequencia": "19,20 é o maior dos três preços" },
    { "causa": "Na calculadora, o ponto separa a parte inteira da decimal", "consequencia": "Digitamos 14.9 + 5.6 para somar 14,9 + 5,6" },
    { "causa": "Alinhamos os algarismos conforme a ordem", "consequencia": "As vírgulas também ficam alinhadas" }
  ],
  "matematica": {
    "nomeDesafio": ["Retas e preços", "Compare, faça as contas da loja e o troco"],
    "exemplos": [
      {
        "titulo": "Décimos",
        "ideia": "Dividindo 1 real em **10 partes iguais**, cada parte é **1 décimo**: 10 centavos, ou **0,1**.",
        "situacao": "Rayane pagou o anel com 10 moedas de 10 centavos. Quanto valem 3 dessas moedas?",
        "passos": ["Cada moeda de 10 centavos é **1 décimo** do real.", "3 moedas são **3 décimos**.", "Escrevemos **0,3**, ou R$ 0,30."],
        "treino": "decimos"
      },
      {
        "titulo": "Centésimos",
        "ideia": "Dividindo 1 real em **100 partes iguais**, cada parte é **1 centésimo**: 1 centavo, ou **0,01**.",
        "situacao": "Como escrever 6 centésimos com algarismos e vírgula?",
        "passos": ["Centésimo é a **2ª casa** depois da vírgula.", "Não há décimos, então a 1ª casa fica com **0**.", "6 centésimos = **0,06**."],
        "treino": "centesimos"
      },
      {
        "titulo": "Parte inteira e parte decimal",
        "ideia": "A **parte inteira** fica antes da vírgula; a **parte decimal**, depois. O **quadro de ordens** mostra quanto vale cada algarismo.",
        "situacao": "O carrinho de controle remoto custa R$ 87,99. Quanto vale cada algarismo?",
        "passos": ["Parte inteira: **87** → 8 dezenas (80) e 7 unidades (7).", "Parte decimal: **99** → 9 décimos (0,9) e 9 centésimos (0,09).", "Lemos: **oitenta e sete reais e noventa e nove centavos**."],
        "treino": "valor-algarismo"
      },
      {
        "titulo": "Qual é o maior?",
        "ideia": "Para comparar, olhamos primeiro a **parte inteira**, depois os **décimos** e depois os **centésimos**.",
        "situacao": "Qual é maior: 50,89 ou 50,86?",
        "passos": ["Parte inteira: 50 = 50. Empatou.", "Décimos: 8 = 8. Empatou de novo.", "Centésimos: 9 > 6. Então **50,89 > 50,86**."],
        "treino": "decimal-comparar"
      },
      {
        "titulo": "Adição com vírgula",
        "ideia": "Armamos a conta com **vírgula embaixo de vírgula** e somamos da direita para a esquerda.",
        "situacao": "Vicente vendeu duas blusas: uma de R$ 75,50 e outra de R$ 90,99. Qual foi o total?",
        "passos": ["Armamos 75,50 em cima e 90,99 embaixo, **vírgula embaixo de vírgula**.", "Somamos centésimos, décimos, unidades e dezenas, com o \"vai um\".", "Pomos a vírgula no lugar: **166,49**. O total foi R$ 166,49."],
        "treino": "decimal-soma"
      },
      {
        "titulo": "Subtração e troco",
        "ideia": "Número inteiro ganha **vírgula e zeros**: 100 = **100,00**. Depois subtraímos com vírgula embaixo de vírgula.",
        "situacao": "O protetor solar custa R$ 87,50, e o cliente pagou com uma cédula de 100 reais. Qual é o troco?",
        "passos": ["Escrevemos 100 como **100,00**.", "Armamos 100,00 − 87,50, vírgula embaixo de vírgula.", "Subtraímos da direita para a esquerda, trocando quando precisa: **12,50**.", "O troco é **R$ 12,50**."],
        "treino": "problema-troco"
      }
    ],
    "treino": ["decimos", "decimal-moedas", "centesimos", "decimos-centavos", "decimal-escrita", "valor-algarismo", "decimal-soma", "decimal-soma", "decimal-subtracao", "decimal-subtracao"],
    "desafio": ["decimal-reta", "decimal-reta", "decimal-comparar", "decimal-medida", "falta-um-real", "decimal-comparar", "problema-compra", "problema-desconto", "problema-troco", "problema-troco"],
    "prova": ["decimos", "centesimos", "decimal-moedas", "valor-algarismo", "decimal-escrita", "decimal-comparar", "decimal-soma", "decimal-subtracao", "problema-compra", "problema-troco"]
  }
};
