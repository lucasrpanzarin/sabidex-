import type { Capitulo } from "./tipos";

// Conteúdo conferido com o livro de Inglês do 4º ano (Unit 6, p. 68) e com a folha "Review for the test" da professora.
// Transcrição em livro/ingles-6/paginas.md; de onde veio cada item em livro/ingles-6/fontes.md.
export const ingles6: Capitulo = {
  "id": "ingles-6",
  "numero": 6,
  "titulo": "Places: os lugares",
  "subtitulo": "hospital, library, airport e \"Is there...?\"",
  "materia": "Inglês",
  "nomeLinha": [
    "Monte a pergunta",
    "Coloque as palavras na ordem da frase"
  ],
  "temas": [
    {
      "titulo": "Places: lugares (parte 1)",
      "pontos": [
        "Em inglês, **places** são os lugares. O livro mostra 8 lugares com fotos.",
        "**Hospital** é o hospital. Na foto, uma mulher de touca e máscara azul trabalha numa sala de cirurgia.",
        "**Café** é a cafeteria. Na foto, um homem bebe numa xícara na frente do notebook.",
        "**Supermarket** é o supermercado. Na foto, uma mulher de avental verde arruma os produtos.",
        "**Library** é a biblioteca, o lugar com estantes cheias de livros. Cuidado: library não é livraria!"
      ],
      "falar": [
        "places",
        "hospital",
        "café",
        "supermarket",
        "library"
      ]
    },
    {
      "titulo": "Places: lugares (parte 2)",
      "pontos": [
        "**Museum** é o museu. Na foto, um grupo olha uma vitrine iluminada numa sala escura.",
        "**Movie theater** é o cinema. Na foto, três jovens comem pipoca numa sala escura.",
        "**Airport** é o aeroporto. Na foto, um senhor lê um livro sentado, com as malas ao lado.",
        "**Farm** é a fazenda. Na foto, um homem de chapéu mexe nas plantas. Cuidado: farm não é farmácia!"
      ],
      "falar": [
        "museum",
        "movie theater",
        "airport",
        "farm"
      ]
    },
    {
      "titulo": "She's at the... / They're at the...",
      "pontos": [
        "Para dizer onde alguém está, o livro usa **at the** antes do lugar: \"at the hospital\" é \"no hospital\".",
        "**She's at the** fala de uma mulher ou menina: \"She's at the hospital\" é \"Ela está no hospital\".",
        "**He's at the** fala de um homem ou menino: \"He's at the café\" é \"Ele está na cafeteria\".",
        "**They're at the** fala de várias pessoas: \"They're at the museum\" é \"Eles estão no museu\"."
      ],
      "falar": [
        "at the hospital",
        "She's at the hospital.",
        "He's at the café.",
        "They're at the museum."
      ]
    },
    {
      "titulo": "Is there a... in your neighborhood?",
      "pontos": [
        "**Neighborhood** é o bairro, o pedaço da cidade onde você mora.",
        "Para perguntar se tem um lugar no bairro, o livro usa **Is there a...?**, isto é, \"Tem um...?\".",
        "\"**Is there a supermarket in your neighborhood?**\" quer dizer \"Tem um supermercado no seu bairro?\".",
        "A resposta do livro é **Yes, there is.**, isto é, \"Sim, tem\".",
        "Depois, a criança do livro pergunta de volta: \"Is there a museum in your neighborhood?\"."
      ],
      "falar": [
        "neighborhood",
        "Is there a supermarket in your neighborhood?",
        "Yes, there is.",
        "Is there a museum in your neighborhood?"
      ]
    }
  ],
  "pares": [
    {
      "palavra": "hospital",
      "significado": "hospital"
    },
    {
      "palavra": "café",
      "significado": "cafeteria"
    },
    {
      "palavra": "supermarket",
      "significado": "supermercado"
    },
    {
      "palavra": "library",
      "significado": "biblioteca (lugar com estantes de livros)"
    },
    {
      "palavra": "museum",
      "significado": "museu"
    },
    {
      "palavra": "movie theater",
      "significado": "cinema"
    },
    {
      "palavra": "airport",
      "significado": "aeroporto"
    },
    {
      "palavra": "farm",
      "significado": "fazenda"
    },
    {
      "palavra": "neighborhood",
      "significado": "bairro"
    },
    {
      "palavra": "She's at the...",
      "significado": "Ela está no / na..."
    },
    {
      "palavra": "They're at the...",
      "significado": "Eles / Elas estão no / na..."
    },
    {
      "palavra": "Yes, there is.",
      "significado": "Sim, tem."
    }
  ],
  "linha": [
    {
      "ano": "1º",
      "ordem": 1,
      "fato": "Is"
    },
    {
      "ano": "2º",
      "ordem": 2,
      "fato": "there"
    },
    {
      "ano": "3º",
      "ordem": 3,
      "fato": "a supermarket"
    },
    {
      "ano": "4º",
      "ordem": 4,
      "fato": "in"
    },
    {
      "ano": "5º",
      "ordem": 5,
      "fato": "your"
    },
    {
      "ano": "6º",
      "ordem": 6,
      "fato": "neighborhood?"
    }
  ],
  "quiz": [
    {
      "frase": "Library quer dizer livraria.",
      "verdadeira": false,
      "explicacao": "Library é a biblioteca, o lugar com estantes de livros."
    },
    {
      "frase": "Movie theater é o cinema.",
      "verdadeira": true,
      "explicacao": "Isso! Na foto, três jovens comem pipoca vendo um filme."
    },
    {
      "frase": "Farm quer dizer farmácia.",
      "verdadeira": false,
      "explicacao": "Farm é a fazenda. Na foto, um homem de chapéu mexe nas plantas."
    },
    {
      "frase": "Airport é o aeroporto.",
      "verdadeira": true,
      "explicacao": "Certo! Na foto, um senhor espera sentado com as malas."
    },
    {
      "frase": "Supermarket é o supermercado.",
      "verdadeira": true,
      "explicacao": "Isso! Na foto, a mulher de avental verde arruma os produtos."
    },
    {
      "frase": "Museum é o lugar onde a gente assiste a um filme.",
      "verdadeira": false,
      "explicacao": "Filme é no movie theater, o cinema. Museum é o museu."
    },
    {
      "frase": "Na foto do hospital, a mulher usa touca e máscara azul.",
      "verdadeira": true,
      "explicacao": "Certo! Ela está numa sala de cirurgia."
    },
    {
      "frase": "\"They're at the museum\" fala de uma pessoa só.",
      "verdadeira": false,
      "explicacao": "They're fala de várias pessoas: \"Eles estão no museu\"."
    },
    {
      "frase": "\"He's at the café\" fala de um homem.",
      "verdadeira": true,
      "explicacao": "Isso! He's é \"ele está\". Para mulher, o livro usa She's."
    },
    {
      "frase": "Neighborhood quer dizer bairro.",
      "verdadeira": true,
      "explicacao": "Certo! \"In your neighborhood\" é \"no seu bairro\"."
    },
    {
      "frase": "A resposta \"Yes, there is.\" quer dizer \"Não tem\".",
      "verdadeira": false,
      "explicacao": "\"Yes, there is.\" quer dizer \"Sim, tem\"."
    },
    {
      "frase": "\"Is there a museum in your neighborhood?\" pergunta se tem um museu no seu bairro.",
      "verdadeira": true,
      "explicacao": "Isso! Is there a...? é \"Tem um...?\"."
    },
    {
      "frase": "Na foto da farm, o homem está numa sala cheia de livros.",
      "verdadeira": false,
      "explicacao": "A sala com livros é a library. Na farm, o homem mexe nas plantas."
    },
    {
      "frase": "\"She's at the hospital\" quer dizer \"Ele está no hospital\".",
      "verdadeira": false,
      "explicacao": "She's é \"ela está\": \"Ela está no hospital\"."
    },
    {
      "frase": "Na foto do supermarket, a mulher usa avental verde e arruma os produtos.",
      "verdadeira": true,
      "explicacao": "Certo! Supermarket é o supermercado."
    },
    {
      "frase": "Na foto do café, o homem mexe nas plantas.",
      "verdadeira": false,
      "explicacao": "No café, o homem bebe numa xícara e usa o notebook. Quem mexe nas plantas está na farm."
    }
  ],
  "prova": [
    {
      "pergunta": "Como se diz \"biblioteca\" em inglês?",
      "opcoes": [
        "museum",
        "farm",
        "café",
        "library"
      ],
      "certa": 3,
      "explicacao": "Biblioteca é library. Cuidado: library não é livraria."
    },
    {
      "pergunta": "O que quer dizer \"movie theater\"?",
      "opcoes": [
        "teatro",
        "museu",
        "cinema",
        "mercado"
      ],
      "certa": 2,
      "explicacao": "Movie theater é o cinema, onde se assiste a filmes."
    },
    {
      "pergunta": "Em qual lugar as pessoas esperam com malas para viajar de avião?",
      "opcoes": [
        "farm",
        "airport",
        "café",
        "hospital"
      ],
      "certa": 1,
      "explicacao": "Airport é o aeroporto. Na foto, o senhor espera com as malas."
    },
    {
      "pergunta": "Uma mulher de máscara e touca azul trabalha numa sala de cirurgia. She's at the ___.",
      "opcoes": [
        "supermarket",
        "library",
        "museum",
        "hospital"
      ],
      "certa": 3,
      "explicacao": "Ela está no hospital: She's at the hospital."
    },
    {
      "pergunta": "Um homem bebe numa xícara e usa o notebook. He's at the ___.",
      "opcoes": [
        "café",
        "farm",
        "airport",
        "museum"
      ],
      "certa": 0,
      "explicacao": "Ele está na cafeteria: He's at the café."
    },
    {
      "pergunta": "Três jovens comem pipoca numa sala escura vendo um filme. They're at the ___.",
      "opcoes": [
        "museum",
        "library",
        "movie theater",
        "airport"
      ],
      "certa": 2,
      "explicacao": "Eles estão no cinema: They're at the movie theater."
    },
    {
      "pergunta": "Um grupo olha uma vitrine iluminada numa sala escura. They're at the ___.",
      "opcoes": [
        "farm",
        "museum",
        "hospital",
        "café"
      ],
      "certa": 1,
      "explicacao": "Eles estão no museu: They're at the museum."
    },
    {
      "pergunta": "Qual frase fala de um homem?",
      "opcoes": [
        "He's at the library.",
        "She's at the library.",
        "They're at the library.",
        "She's at the farm."
      ],
      "certa": 0,
      "explicacao": "He's é \"ele está\". She's é \"ela está\" e They're é \"eles estão\"."
    },
    {
      "pergunta": "Como perguntar \"Tem um supermercado no seu bairro?\"",
      "opcoes": [
        "Is there supermarket a in your neighborhood?",
        "Is there a supermarket in your neighborhood?",
        "Is a there supermarket in your neighborhood?",
        "Is there your neighborhood in a supermarket?"
      ],
      "certa": 1,
      "explicacao": "Na pergunta, Is vem primeiro: Is there a supermarket in your neighborhood?"
    },
    {
      "pergunta": "Perguntaram: \"Is there a museum in your neighborhood?\". No seu bairro tem museu. O que você responde?",
      "opcoes": [
        "Yes, there is.",
        "Yes, it is.",
        "Yes, he is.",
        "Yes, they are."
      ],
      "certa": 0,
      "explicacao": "Como no livro: \"Yes, there is.\", isto é, \"Sim, tem\"."
    }
  ],
  "lacunas": [
    {
      "frase": "Library quer dizer ___.",
      "resposta": "biblioteca",
      "distratores": [
        "livraria",
        "museu",
        "cinema"
      ]
    },
    {
      "frase": "He's at the ___. (ele pega livros entre as estantes)",
      "resposta": "library",
      "distratores": [
        "museum",
        "café",
        "airport"
      ]
    },
    {
      "frase": "She's at the ___. (ela arruma os produtos, de avental verde)",
      "resposta": "supermarket",
      "distratores": [
        "hospital",
        "farm",
        "library"
      ]
    },
    {
      "frase": "They're at the ___. (eles comem pipoca e veem um filme)",
      "resposta": "movie theater",
      "distratores": [
        "museum",
        "airport",
        "farm"
      ]
    },
    {
      "frase": "He's at the ___. (ele mexe nas plantas, de chapéu)",
      "resposta": "farm",
      "distratores": [
        "café",
        "hospital",
        "library"
      ]
    },
    {
      "frase": "He's at the ___. (ele lê um livro, com as malas ao lado)",
      "resposta": "airport",
      "distratores": [
        "farm",
        "museum",
        "supermarket"
      ]
    },
    {
      "frase": "Is ___ a supermarket in your neighborhood?",
      "resposta": "there",
      "distratores": [
        "they",
        "the",
        "she"
      ]
    },
    {
      "frase": "Yes, there ___.",
      "resposta": "is",
      "distratores": [
        "it",
        "at",
        "the"
      ]
    },
    {
      "frase": "Neighborhood quer dizer ___.",
      "resposta": "bairro",
      "distratores": [
        "vizinho",
        "cidade",
        "escola"
      ]
    },
    {
      "frase": "They're at the ___. (o grupo olha uma vitrine iluminada)",
      "resposta": "museum",
      "distratores": [
        "café",
        "farm",
        "hospital"
      ]
    },
    {
      "frase": "She's at the ___. (ela usa touca e máscara azul)",
      "resposta": "hospital",
      "distratores": [
        "supermarket",
        "library",
        "airport"
      ]
    },
    {
      "frase": "He's at the ___. (ele bebe numa xícara e usa o notebook)",
      "resposta": "café",
      "distratores": [
        "farm",
        "museum",
        "airport"
      ]
    }
  ],
  "quemSou": [
    {
      "resposta": "hospital",
      "pistas": [
        "Aqui tem gente de roupa azul.",
        "Na foto, a mulher usa touca e máscara.",
        "Em português, meu nome se escreve igual."
      ],
      "distratores": [
        "café",
        "library",
        "farm"
      ]
    },
    {
      "resposta": "library",
      "pistas": [
        "Tenho muitas estantes.",
        "Aqui tem livros para ler.",
        "Em português, sou a biblioteca."
      ],
      "distratores": [
        "museum",
        "café",
        "supermarket"
      ]
    },
    {
      "resposta": "airport",
      "pistas": [
        "Aqui as pessoas esperam sentadas.",
        "Na foto, o senhor tem malas ao lado.",
        "Em português, sou o aeroporto."
      ],
      "distratores": [
        "farm",
        "hospital",
        "museum"
      ]
    },
    {
      "resposta": "farm",
      "pistas": [
        "Fico ao ar livre.",
        "Tenho plantas e terra.",
        "Em português, sou a fazenda."
      ],
      "distratores": [
        "café",
        "library",
        "airport"
      ]
    },
    {
      "resposta": "movie theater",
      "pistas": [
        "Sou uma sala escura.",
        "Aqui a turma come pipoca.",
        "Em português, sou o cinema."
      ],
      "distratores": [
        "museum",
        "airport",
        "library"
      ]
    },
    {
      "resposta": "supermarket",
      "pistas": [
        "Tenho prateleiras e geladeiras.",
        "Na foto, a mulher usa avental verde.",
        "Em português, sou o supermercado."
      ],
      "distratores": [
        "hospital",
        "museum",
        "farm"
      ]
    },
    {
      "resposta": "museum",
      "pistas": [
        "Na foto, sou uma sala escura.",
        "Tenho uma vitrine iluminada.",
        "Em português, sou o museu."
      ],
      "distratores": [
        "movie theater",
        "library",
        "café"
      ]
    }
  ],
  "classificar": [
    {
      "pergunta": "Uma pessoa ou várias pessoas?",
      "grupos": [
        {
          "nome": "Uma pessoa",
          "itens": [
            "She's at the hospital.",
            "He's at the café.",
            "He's at the library."
          ]
        },
        {
          "nome": "Várias pessoas",
          "itens": [
            "They're at the museum.",
            "They're at the movie theater."
          ]
        }
      ]
    },
    {
      "pergunta": "Na foto do livro: He's (ele) ou She's (ela)?",
      "grupos": [
        {
          "nome": "He's at the...",
          "itens": [
            "o homem com a xícara (café)",
            "o homem entre as estantes (library)",
            "o senhor com as malas (airport)"
          ]
        },
        {
          "nome": "She's at the...",
          "itens": [
            "a mulher de touca e máscara (hospital)",
            "a mulher de avental verde (supermarket)"
          ]
        }
      ]
    }
  ]
};
