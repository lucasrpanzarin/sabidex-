import type { Capitulo } from "./tipos";

// Matemática do 4º ano, Unidade 9 (páginas 100 a 143 do livro). O livro é a base: os exemplos e as contas
// seguem o mesmo nível e o mesmo método, mas os números das contas mudam a cada partida (src/lib/contas.ts).
// Matemática não usa temas, pares nem linha do tempo: as fases usam `matematica` (veja tipos.ts).
// `quiz` e `prova` (múltipla escolha) continuam: o quiz é a fase 4 e os dois servem para o Duelo do Saber.
export const matematica9: Capitulo = {
  "id": "matematica-9",
  "numero": 9,
  "titulo": "O preparo de alimentos e o pensamento algébrico",
  "subtitulo": "Valor desconhecido, operações inversas, igualdade e múltiplos",
  "materia": "Matemática",
  "temas": [],
  "pares": [],
  "linha": [],
  "quiz": [
    {
      "frase": "Se 24 + 16 = 40, então 40 − 16 = 24.",
      "verdadeira": true,
      "explicacao": "Tirando uma parcela da soma, sobra a outra parcela."
    },
    {
      "frase": "Para achar o número em ? + 8 = 47, fazemos 47 + 8.",
      "verdadeira": false,
      "explicacao": "Usamos a operação inversa, a subtração: 47 − 8 = 39."
    },
    {
      "frase": "Em ? × 9 = 36, o número que falta é 4.",
      "verdadeira": true,
      "explicacao": "A inversa da multiplicação é a divisão: 36 ÷ 9 = 4."
    },
    {
      "frase": "Em ? ÷ 4 = 7, o número que falta é 11.",
      "verdadeira": false,
      "explicacao": "Multiplicamos o quociente pelo divisor: 7 × 4 = 28."
    },
    {
      "frase": "A prova real de 87 − 53 = 34 é fazer 34 + 53.",
      "verdadeira": true,
      "explicacao": "Diferença mais subtraendo dá o minuendo: 34 + 53 = 87."
    },
    {
      "frase": "A multiplicação é a operação inversa da adição.",
      "verdadeira": false,
      "explicacao": "A inversa da multiplicação é a divisão. A da adição é a subtração."
    },
    {
      "frase": "Em 2 × 8 = 16, o número 16 é o produto.",
      "verdadeira": true,
      "explicacao": "O resultado da multiplicação se chama produto."
    },
    {
      "frase": "Em 40 − 16 = 24, o número 16 é o minuendo.",
      "verdadeira": false,
      "explicacao": "O 16 é o subtraendo. O minuendo é o 40."
    },
    {
      "frase": "Se 4 + 3 = 5 + 2, então 4 + 3 + 6 = 5 + 2 + 6.",
      "verdadeira": true,
      "explicacao": "Somando o mesmo número aos dois membros, a igualdade continua verdadeira."
    },
    {
      "frase": "Em 8 + 6 = 10 + ?, o número que falta é 6.",
      "verdadeira": false,
      "explicacao": "8 + 6 = 14. Então 10 + ? = 14, e o número é 4."
    },
    {
      "frase": "O número 30 é múltiplo de 5.",
      "verdadeira": true,
      "explicacao": "5 × 6 = 30."
    },
    {
      "frase": "Dá para dividir 25 por zero.",
      "verdadeira": false,
      "explicacao": "Nenhum número vezes zero dá 25. Por isso é impossível."
    }
  ],
  "prova": [
    {
      "pergunta": "Como se chama o resultado de uma divisão?",
      "opcoes": [
        "Produto",
        "Dividendo",
        "Divisor",
        "Quociente"
      ],
      "certa": 3,
      "explicacao": "Em 16 ÷ 2 = 8, o 8 é o quociente."
    },
    {
      "pergunta": "Como se chama conferir uma conta usando a operação inversa?",
      "opcoes": [
        "Valor desconhecido",
        "Sentença matemática",
        "Prova real",
        "Primeiro membro"
      ],
      "certa": 2,
      "explicacao": "Prova real é conferir o resultado com a operação inversa."
    },
    {
      "pergunta": "Quais são os cinco primeiros múltiplos de 3?",
      "opcoes": [
        "0, 2, 4, 6, 8",
        "0, 3, 6, 9, 12",
        "0, 5, 10, 15, 20",
        "1, 3, 5, 7, 9"
      ],
      "certa": 1,
      "explicacao": "3 × 0 = 0, 3 × 1 = 3, 3 × 2 = 6, 3 × 3 = 9 e 3 × 4 = 12."
    },
    {
      "pergunta": "Se 24 + 16 = 40, qual destas contas também é verdadeira?",
      "opcoes": [
        "24 − 16 = 40",
        "40 − 24 = 14",
        "16 − 40 = 24",
        "40 − 16 = 24"
      ],
      "certa": 3,
      "explicacao": "Tirando a parcela 16 da soma 40, sobra a outra parcela, 24."
    },
    {
      "pergunta": "Que conta descobre o número que falta em ___ × 9 = 36?",
      "opcoes": [
        "36 ÷ 9",
        "36 × 9",
        "36 − 9",
        "36 + 9"
      ],
      "certa": 0,
      "explicacao": "A divisão é a inversa da multiplicação: 36 ÷ 9 = 4."
    },
    {
      "pergunta": "Como conferir se 150 ÷ 50 = 3 está certo?",
      "opcoes": [
        "Fazendo 150 − 50",
        "Fazendo 150 × 3",
        "Fazendo 50 × 3",
        "Fazendo 50 + 3"
      ],
      "certa": 2,
      "explicacao": "Multiplicamos o quociente pelo divisor: 50 × 3 = 150, o dividendo."
    },
    {
      "pergunta": "Numa balança equilibrada, pus mais 4 kg no prato da esquerda. Quanto devo pôr no da direita?",
      "opcoes": [
        "8 kg",
        "4 kg",
        "2 kg",
        "14 kg"
      ],
      "certa": 1,
      "explicacao": "Para manter o equilíbrio, colocamos o mesmo peso nos dois pratos: 4 kg."
    },
    {
      "pergunta": "Marcus usou 3 ovos em cada bolo e gastou 30 ovos. Quantos bolos ele fez?",
      "opcoes": [
        "10",
        "27",
        "33",
        "90"
      ],
      "certa": 0,
      "explicacao": "Um número vezes 3 dá 30. Fazendo a inversa: 30 ÷ 3 = 10."
    },
    {
      "pergunta": "Luma fez 240 brigadeiros. Cada embalagem leva 30. Quantas embalagens ela precisa?",
      "opcoes": [
        "7",
        "8",
        "210",
        "270"
      ],
      "certa": 1,
      "explicacao": "240 ÷ 30 = 8. Prova real: 8 × 30 = 240."
    },
    {
      "pergunta": "Por que é impossível dividir 25 por zero?",
      "opcoes": [
        "Nenhum número vezes zero dá 25",
        "Porque o resultado seria zero",
        "Porque 25 é maior que zero",
        "Porque 25 não é múltiplo de 2"
      ],
      "certa": 0,
      "explicacao": "Qualquer número vezes zero dá zero, nunca 25. Então a divisão não tem resposta."
    }
  ],
  "lacunas": [
    {
      "frase": "A adição e a subtração são operações ___.",
      "resposta": "inversas",
      "distratores": [
        "iguais",
        "desconhecidas",
        "naturais"
      ]
    },
    {
      "frase": "Em 2 × 8 = 16, o número 16 é o ___.",
      "resposta": "produto",
      "distratores": [
        "quociente",
        "fator",
        "dividendo"
      ]
    },
    {
      "frase": "Em 40 − 16 = 24, o número 24 é a ___.",
      "resposta": "diferença",
      "distratores": [
        "soma",
        "parcela",
        "divisão"
      ]
    },
    {
      "frase": "Em 16 ÷ 2 = 8, o número 2 é o ___.",
      "resposta": "divisor",
      "distratores": [
        "dividendo",
        "quociente",
        "produto"
      ]
    },
    {
      "frase": "Conferir a conta com a operação inversa se chama ___.",
      "resposta": "prova real",
      "distratores": [
        "sentença",
        "igualdade",
        "sequência"
      ]
    },
    {
      "frase": "A expressão à esquerda do sinal de igual é o ___ membro.",
      "resposta": "primeiro",
      "distratores": [
        "segundo",
        "terceiro",
        "último"
      ]
    },
    {
      "frase": "Os números 0, 3, 6, 9 e 12 são múltiplos de ___.",
      "resposta": "3",
      "distratores": [
        "2",
        "6",
        "9"
      ]
    },
    {
      "frase": "Com a mesma massa nos dois pratos, a balança fica ___.",
      "resposta": "equilibrada",
      "distratores": [
        "desequilibrada",
        "vazia",
        "quebrada"
      ]
    }
  ],
  "quemSou": [
    {
      "resposta": "Quociente",
      "pistas": [
        "Multiplicado pelo divisor, eu dou o dividendo.",
        "Apareço depois do sinal de igual numa divisão.",
        "Em 16 ÷ 2 = 8, eu sou o 8."
      ],
      "distratores": [
        "Dividendo",
        "Divisor",
        "Produto"
      ]
    },
    {
      "resposta": "Prova real",
      "pistas": [
        "Sou um dos últimos cuidados antes de responder.",
        "Para conferir 34 + 53 = 87, eu faço 87 − 53.",
        "Confiro o resultado com a operação inversa."
      ],
      "distratores": [
        "Valor desconhecido",
        "Sentença matemática",
        "Sequência"
      ]
    },
    {
      "resposta": "Minuendo",
      "pistas": [
        "Somando a diferença e o subtraendo, você me encontra.",
        "Em 40 − 16 = 24, eu sou o 40.",
        "Sou o número de onde se tira na subtração."
      ],
      "distratores": [
        "Subtraendo",
        "Diferença",
        "Parcela"
      ]
    },
    {
      "resposta": "Valor desconhecido",
      "pistas": [
        "Às vezes apareço como um quadradinho com ?.",
        "A operação inversa ajuda a me descobrir.",
        "Sou o número que falta numa conta."
      ],
      "distratores": [
        "Produto",
        "Múltiplo",
        "Primeiro membro"
      ]
    },
    {
      "resposta": "Múltiplo",
      "pistas": [
        "O zero sempre é um de nós.",
        "Nascemos de multiplicar um número por 0, 1, 2, 3...",
        "0, 5, 10 e 15 somos nós, do número 5."
      ],
      "distratores": [
        "Fator",
        "Quociente",
        "Parcela"
      ]
    }
  ],
  "classificar": [
    {
      "pergunta": "Adição ou subtração?",
      "grupos": [
        {
          "nome": "Adição",
          "itens": [
            "1ª parcela",
            "2ª parcela",
            "Soma"
          ]
        },
        {
          "nome": "Subtração",
          "itens": [
            "Minuendo",
            "Subtraendo",
            "Diferença"
          ]
        }
      ]
    },
    {
      "pergunta": "Multiplicação ou divisão?",
      "grupos": [
        {
          "nome": "Multiplicação",
          "itens": [
            "1º fator",
            "2º fator",
            "Produto"
          ]
        },
        {
          "nome": "Divisão",
          "itens": [
            "Dividendo",
            "Divisor",
            "Quociente"
          ]
        }
      ]
    }
  ],
  "causas": [
    {
      "causa": "Queremos juntar as sopas servidas para 34 e para 53 pacientes",
      "consequencia": "Usamos a adição"
    },
    {
      "causa": "A multiplicação e a divisão são operações inversas",
      "consequencia": "Podemos conferir uma multiplicação com uma divisão"
    },
    {
      "causa": "Os dois pratos da balança têm a mesma massa",
      "consequencia": "A balança fica equilibrada"
    },
    {
      "causa": "Os pratos da balança do nhoque tinham massas diferentes",
      "consequencia": "A balança não estava equilibrada"
    },
    {
      "causa": "Nenhum número vezes zero dá 25",
      "consequencia": "É impossível dividir 25 por zero"
    }
  ],
  "matematica": {
    "exemplos": [
      {
        "titulo": "O valor desconhecido",
        "ideia": "Quando falta um número na conta, usamos a **operação inversa**.",
        "situacao": "Marcus separou 30 ovos e usou 3 em cada bolo. Quantos bolos ele fez?",
        "passos": [
          "A conta fica assim: **? × 3 = 30**.",
          "A inversa da multiplicação é a **divisão**.",
          "Fazemos 30 ÷ 3 = **10**.",
          "Marcus fez **10 bolos**."
        ],
        "treino": "falta-multiplicacao"
      },
      {
        "titulo": "Adição e subtração",
        "ideia": "**Adição** e **subtração** são **operações inversas**: uma desfaz a outra.",
        "situacao": "Qual é o número que falta em **? + 8 = 47**?",
        "passos": [
          "O número que falta é uma **parcela**.",
          "Para achar uma parcela, tiramos a outra parcela da **soma**.",
          "Fazemos 47 − 8 = **39**.",
          "Conferindo: 39 + 8 = 47. Certo!"
        ],
        "treino": "falta-soma"
      },
      {
        "titulo": "Multiplicação e divisão",
        "ideia": "**Multiplicação** e **divisão** também são **operações inversas**.",
        "situacao": "Qual é o número que falta em **? ÷ 4 = 7**?",
        "passos": [
          "O número que falta é o **dividendo**.",
          "Multiplicamos o **quociente** pelo **divisor**: 7 × 4 = **28**.",
          "Conferindo: 28 ÷ 4 = 7. Certo!"
        ],
        "treino": "falta-divisao"
      },
      {
        "titulo": "Os 7 passos e a prova real",
        "ideia": "Conferir a conta com a operação inversa se chama **prova real**.",
        "situacao": "Luciana serviu sopa de legumes para 34 pacientes e sopa de abóbora para 53. Quantos pacientes ao todo?",
        "passos": [
          "1º **Compreender a situação**: duas sopas, 34 e 53 pacientes.",
          "2º **Compreender a pergunta**: quantos pacientes ao todo?",
          "3º **Identificar a operação**: adição, porque vamos juntar.",
          "4º **Escrever a operação**: 34 + 53.",
          "5º **Efetuar o cálculo**: 34 + 53 = 87.",
          "6º **Verificar com a prova real**: 87 − 53 = 34. Certo!",
          "7º **Responder**: foram servidos **87 pacientes**."
        ],
        "treino": "problema-soma"
      },
      {
        "titulo": "A balança e a igualdade",
        "ideia": "A igualdade continua verdadeira se pusermos **o mesmo número nos dois membros**.",
        "situacao": "Uma balança equilibrada tem 8 kg e 6 kg na esquerda e 10 kg e 4 kg na direita. Pus mais 4 kg na esquerda.",
        "passos": [
          "Antes: 8 + 6 = 10 + 4. Os dois lados valem 14.",
          "Com mais 4 kg na esquerda: 8 + 6 + 4 = 18.",
          "Para equilibrar, ponho **4 kg** na direita também: 10 + 4 + 4 = 18."
        ],
        "treino": "balanca-falta"
      },
      {
        "titulo": "Sequências e múltiplos",
        "ideia": "Os **múltiplos** de um número saem de multiplicá-lo por 0, 1, 2, 3, 4...",
        "situacao": "Carolina usa 3 ovos em cada torta. Quantos ovos para 4 tortas?",
        "passos": [
          "1 torta: 3 ovos. 2 tortas: 6 ovos. 3 tortas: 9 ovos.",
          "Os números 0, 3, 6, 9, 12... são os **múltiplos de 3**.",
          "4 tortas: 4 × 3 = **12 ovos**."
        ],
        "treino": "multiplos-receita"
      }
    ],
    "treino": [
      "falta-soma",
      "falta-subtracao",
      "falta-multiplicacao",
      "falta-divisao",
      "setas",
      "prova-real",
      "problema-soma",
      "problema-subtracao",
      "problema-vezes",
      "problema-divisao"
    ],
    "desafio": [
      "balanca-falta",
      "balanca-diferenca",
      "sentenca-membros",
      "balanca-falta",
      "sentenca-membros",
      "multiplos-sequencia",
      "multiplos-receita",
      "multiplos-sequencia"
    ],
    "prova": [
      "falta-soma",
      "falta-subtracao",
      "falta-multiplicacao",
      "falta-divisao",
      "problema-subtracao",
      "problema-vezes",
      "problema-divisao",
      "balanca-falta",
      "sentenca-membros",
      "multiplos-receita"
    ]
  }
};
