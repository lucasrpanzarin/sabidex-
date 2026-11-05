import type { Capitulo } from "./tipos";

// Conteúdo conferido com o livro de Matemática do 4º ano (Unidade 9, páginas 100 a 143).
export const matematica9: Capitulo = {
  "id": "matematica-9",
  "numero": 9,
  "titulo": "O preparo de alimentos e o pensamento algébrico",
  "subtitulo": "Valor desconhecido, operações inversas, igualdade e múltiplos",
  "materia": "Matemática",
  "passos": true,
  "temas": [
    {
      "titulo": "O valor desconhecido",
      "pontos": [
        "Às vezes falta um número na conta. Esse número é o **valor desconhecido**.",
        "Lívia usou 6 batatas no purê e sobraram 8. Quantas ela comprou? Um número menos 6 é igual a 8.",
        "Marcus usou 3 ovos em cada bolo e gastou 30 ovos. Um número vezes 3 é igual a 30.",
        "Para descobrir o número que falta, usamos a **operação inversa**. Assim, Marcus fez **10 bolos**."
      ]
    },
    {
      "titulo": "Adição e subtração",
      "pontos": [
        "A **adição** e a **subtração** são **operações inversas**: uma desfaz a outra.",
        "Tânia fez 24 croquetes e depois mais 16. Ao todo, 24 + 16 = 40. Se já fritou 16, faltam 40 − 16 = 24.",
        "Na adição, os números que somamos são as **parcelas**. O resultado é a **soma**.",
        "Na subtração, o **minuendo** menos o **subtraendo** dá a **diferença**.",
        "Para achar a parcela que falta em ___ + 8 = 47, fazemos 47 − 8. A parcela é **39**."
      ]
    },
    {
      "titulo": "Multiplicação e divisão",
      "pontos": [
        "A **multiplicação** e a **divisão** também são **operações inversas**.",
        "Ana assou 2 fileiras com 8 biscoitos: 2 × 8 = 16. Em cada fileira: 16 ÷ 2 = 8.",
        "Na multiplicação, os números são os **fatores**. O resultado é o **produto**.",
        "Na divisão, o **dividendo** dividido pelo **divisor** dá o **quociente**.",
        "Para achar o fator que falta em ___ × 9 = 36, fazemos 36 ÷ 9. O fator é **4**."
      ]
    },
    {
      "titulo": "Os 7 passos e a prova real",
      "pontos": [
        "Primeiro: **compreender a situação**, **compreender a pergunta** e **identificar a operação**.",
        "Depois: **escrever a operação**, **efetuar o cálculo**, **verificar o resultado** e **responder à pergunta**.",
        "Conferir o resultado com a operação inversa se chama **prova real**.",
        "Luciana serviu sopa para 34 e para 53 pacientes: 34 + 53 = 87. Prova real: 87 − 53 = 34.",
        "Para conferir 150 ÷ 50 = 3, multiplicamos o quociente pelo divisor: 50 × 3 = 150."
      ]
    },
    {
      "titulo": "A igualdade e a balança",
      "pontos": [
        "A **balança de pratos** fica **equilibrada** quando os dois pratos têm a mesma massa.",
        "**Sentenças matemáticas** são frases escritas em linguagem matemática. Algumas usam o sinal **=** (igual).",
        "Em 4 + 3 = 5 + 2, o lado esquerdo é o **primeiro membro**. O lado direito é o **segundo membro**.",
        "A igualdade continua verdadeira se **adicionarmos ou subtrairmos o mesmo número** dos dois membros."
      ]
    },
    {
      "titulo": "Sequências e múltiplos",
      "pontos": [
        "Carolina usa 2 copos de leite e 3 ovos em cada torta. Os números formam **sequências** com um **padrão**.",
        "Os **múltiplos** de um número saem de multiplicá-lo pelos **números naturais**: 0, 1, 2, 3, 4...",
        "Múltiplos de 2, os **pares**: 0, 2, 4, 6, 8. Múltiplos de 3: 0, 3, 6, 9, 12.",
        "Múltiplos de 5: 0, 5, 10, 15, 20.",
        "É **impossível dividir por zero**. Nenhum número vezes zero dá 25, então 25 ÷ 0 não tem resposta."
      ]
    }
  ],
  "pares": [
    {
      "palavra": "Valor desconhecido",
      "significado": "O número que falta descobrir na conta"
    },
    {
      "palavra": "Operações inversas",
      "significado": "Uma operação desfaz a outra"
    },
    {
      "palavra": "Parcela",
      "significado": "Cada número que somamos na adição"
    },
    {
      "palavra": "Minuendo",
      "significado": "O número de onde tiramos na subtração"
    },
    {
      "palavra": "Diferença",
      "significado": "O resultado da subtração"
    },
    {
      "palavra": "Fator",
      "significado": "Cada número que multiplicamos"
    },
    {
      "palavra": "Produto",
      "significado": "O resultado da multiplicação"
    },
    {
      "palavra": "Quociente",
      "significado": "O resultado da divisão"
    },
    {
      "palavra": "Prova real",
      "significado": "Conferir a conta com a operação inversa"
    },
    {
      "palavra": "Múltiplo",
      "significado": "Um número vezes 0, 1, 2, 3..."
    }
  ],
  "linha": [
    {
      "ano": "1º",
      "ordem": 1,
      "fato": "Compreender a situação"
    },
    {
      "ano": "2º",
      "ordem": 2,
      "fato": "Compreender a pergunta"
    },
    {
      "ano": "3º",
      "ordem": 3,
      "fato": "Identificar a operação matemática"
    },
    {
      "ano": "4º",
      "ordem": 4,
      "fato": "Identificar os dados e escrever a operação"
    },
    {
      "ano": "5º",
      "ordem": 5,
      "fato": "Efetuar o cálculo"
    },
    {
      "ano": "6º",
      "ordem": 6,
      "fato": "Verificar o resultado com a prova real"
    },
    {
      "ano": "7º",
      "ordem": 7,
      "fato": "Responder à pergunta do problema"
    }
  ],
  "quiz": [
    {
      "frase": "A adição e a subtração são operações inversas.",
      "verdadeira": true,
      "explicacao": "Isso mesmo: uma desfaz a outra."
    },
    {
      "frase": "A multiplicação é a operação inversa da adição.",
      "verdadeira": false,
      "explicacao": "A inversa da multiplicação é a divisão."
    },
    {
      "frase": "Se 24 + 16 = 40, então 40 − 16 = 24.",
      "verdadeira": true,
      "explicacao": "Tirando uma parcela da soma, sobra a outra parcela."
    },
    {
      "frase": "Em 40 − 16 = 24, o número 16 é o minuendo.",
      "verdadeira": false,
      "explicacao": "O 16 é o subtraendo. O minuendo é o 40."
    },
    {
      "frase": "Em 2 × 8 = 16, o número 16 é o produto.",
      "verdadeira": true,
      "explicacao": "O resultado da multiplicação se chama produto."
    },
    {
      "frase": "Para achar o número em ___ + 8 = 47, fazemos 47 + 8.",
      "verdadeira": false,
      "explicacao": "Usamos a operação inversa, a subtração: 47 − 8 = 39."
    },
    {
      "frase": "Prova real é conferir o resultado usando a operação inversa.",
      "verdadeira": true,
      "explicacao": "Exemplo: 34 + 53 = 87 e 87 − 53 = 34."
    },
    {
      "frase": "Para conferir 95 − 42 = 53, fazemos 53 − 42.",
      "verdadeira": false,
      "explicacao": "Somamos a diferença ao subtraendo: 53 + 42 = 95."
    },
    {
      "frase": "Se somarmos o mesmo número aos dois membros, a igualdade continua verdadeira.",
      "verdadeira": true,
      "explicacao": "É como pôr o mesmo peso nos dois pratos da balança."
    },
    {
      "frase": "Em 4 + 3 = 5 + 2, o primeiro membro é 5 + 2.",
      "verdadeira": false,
      "explicacao": "O primeiro membro fica à esquerda do sinal de igual: 4 + 3."
    },
    {
      "frase": "Os múltiplos de 5 são 0, 5, 10, 15, 20...",
      "verdadeira": true,
      "explicacao": "É só multiplicar o 5 por 0, 1, 2, 3, 4..."
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
  ]
};
