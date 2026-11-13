---
name: capitulo-do-livro
description: Cria um capítulo do Sabidex a partir de fotos das páginas do livro da escola que o Lucas manda na conversa. Use quando ele mandar fotos de páginas do livro, pedir um capítulo novo, ou pedir para ler/transcrever páginas. Tudo é feito na conversa, sem API paga.
---

# Capítulo a partir das fotos do livro

O Lucas manda as fotos aqui na conversa. Você faz as 4 etapas, nesta ordem, e só no fim coloca no app.
Regras de pedagogia: `docs/ESTUDOS.md`. Regras por idade: `perfilDoAno` / `guiaDaIdade` em `src/lib/conteudo.ts`.
Antes de começar, confirme o capítulo (ex.: `historia-11`), a matéria e o ano escolar (padrão: 4º ano).
Se ele mandar muitas fotos, peça em lotes de 4 a 6 e vá transcrevendo cada lote.
**Peça a unidade inteira**, da primeira à última página (abertura, atividades e "O que eu aprendi" incluídos). Se faltar
uma página na numeração, avise o Lucas e peça a foto antes de criar.

## Etapa 1 — Ler (transcrição fiel)

Escreva `livro/<capitulo>/paginas.md`. Para cada foto:

- Comece com `## Página N` (número impresso na página; `?` se não aparecer).
- Copie o texto **exatamente** como está, na ordem de leitura: títulos (`#`, `##`), parágrafos, boxes (`> `), legendas.
- Imagem, mapa, gráfico ou ilustração: `[IMAGEM: ...]` + a legenda. A professora faz pergunta sobre imagem, então
  descreva **tudo o que dá para perguntar**, não só o assunto:
  - **mapa:** título, a legenda inteira (cada cor ou símbolo e o que quer dizer), onde fica cada cor ou região
    ("verde perto do litoral e ao longo dos rios do Norte; marrom no Sudeste"), os nomes escritos e a rosa dos ventos;
  - **ilustração com setas ou etapas:** cada item, na ordem, e para onde aponta cada seta;
  - **foto:** o que aparece e o lugar da legenda (as perguntas "qual foto é do campo?" dependem disso);
  - **gráfico:** cada barra ou fatia com o seu número.
  Só o que você **vê** de fato; se não der para ver a cor ou o número, escreva `[ILEGÍVEL]` naquele pedaço.
- História em quadrinhos ou tirinha: cada balão, na ordem, com quem fala (`João: "..."`), e o que cada quadrinho mostra.
- Linhas do tempo e tabelas: todas as datas e valores, em lista ou tabela.
- Boxes de canto (glossário, "Sabia?", "Ampliando", "Família e escola", "+ Ação", indicação de livro ou site): copie
  inteiros. São fáceis de pular porque ficam na margem: olhe os quatro cantos de cada foto antes de passar para a próxima.
- Exercícios do livro: em `### Atividades do livro`, copiados inteiros, com o número, as letras (a, b, c...) e as opções.
  Mostram o que a professora vai cobrar.
- Borrado, cortado ou ilegível: `[ILEGÍVEL]`. **Nunca complete com o que "deveria" estar escrito.**
  Diga ao Lucas qual foto refazer (mais luz, de cima, sem tremer).
- Não resuma, não corrija, não comente.

No fim de cada lote, confira e diga ao Lucas em uma linha: as páginas que chegaram, **alguma página pulada na
numeração** e alguma foto para refazer. Só passe para a Etapa 2 com a unidade inteira copiada.

Não guarde as fotos no repositório (o livro tem direitos autorais, e foto pesa). Só a transcrição.

## Etapa 2 — Mapa de cobertura (antes de escrever qualquer pergunta)

**Regra do Lucas (13/11/2026): tudo o que está no livro tem que estar no app.** Uma mãe contou que caíram na prova
coisas que o app não tinha. A conferência mostrou que só ~58% do livro de Geografia era treinado: a receita antiga
limitava o tamanho e deixava de fora atividades do livro e páginas inteiras. Agora o tamanho segue o livro.

Escreva `livro/<capitulo>/cobertura.md`, **página por página**, com uma linha para cada coisa que a professora pode cobrar:

- cada palavra em **negrito**, cada definição ("é chamado de", "é a", "significa") e cada palavra do glossário;
- cada exemplo com nome (lugar, rio, pessoa, povo, produto), cada número, data e porcentagem;
- cada etapa de processo e cada ligação de causa e consequência;
- **cada atividade do livro** (O que eu sei, Atividades, Você é o geógrafo, Mãos à obra, O que eu aprendi) e cada
  pergunta de imagem, mapa, tabela ou história em quadrinhos;
- cada box (Ampliando, Sabia?, Família e escola, + Ação, indicação de livro ou pessoa citada).

Formato (uma tabela; a coluna "Onde no app" é preenchida enquanto você cria e conferida na Etapa 4):

```
| Página | O que o livro cobra | Situação | Onde no app |
|---|---|---|---|
| 71 | Bacia hidrográfica: área drenada por um rio principal e seus afluentes | COBERTO | pares 4, quiz 11, prova 3 |
| 69 | Cor de cada cidade no mapa da Paraíba | FORA | depende de ver a cor na foto |
```

Cada pedaço de `### Atividades do livro` (cada letra a, b, c...) é **uma linha** do mapa, e cada item do "O que eu aprendi" também.

Situação: `COBERTO` = **algum jogo pergunta** (quiz, prova, pares, lacunas, quem sou eu, grupos, causas ou linha);
estar só no texto dos temas **não conta**. `PARCIAL` = aparece, mas nenhum jogo pergunta. `FALTA` = não aparece.
`FORA` = de propósito, com o motivo. Só quatro motivos valem:
- a foto não deixou ver a cor, o número ou o nome (`[ILEGÍVEL]` na transcrição; antes, peça a foto de novo);
- pergunta sobre a cidade, o estado ou a vida da própria criança ("Como é o relevo onde você mora?");
- opinião ou conversa sem resposta certa no livro ("O que você acha?", "Converse com os colegas");
- passatempo (caça-palavras, quebra-cabeça, desenhar): o **conteúdo** dele precisa estar coberto de outro jeito.
Pergunta de mapa ou imagem **não** é motivo: se a transcrição descreve o mapa, vira pergunta com a descrição
("No mapa do relevo, onde ficam as terras mais baixas?"). Conte ao Lucas tudo o que ficou `FORA`.

## Etapa 3 — Criar (só com o que está em paginas.md)

Não use nenhum fato, data, nome ou número que não esteja na transcrição, mesmo que você tenha certeza.
Siga o guia da idade (`guiaDaIdade(ano)`). **Use as palavras do livro** (é assim que cai na prova da escola) e explique as difíceis ao lado, em palavras simples; nunca troque o termo do livro por um sinônimo. As perguntas seguem o estilo das atividades do livro, sem copiar. Cubra **todas as páginas e todos os subtítulos**, do começo ao fim, até toda linha do mapa de cobertura virar `COBERTO` (ou `FORA`).

**Cada atividade do livro vira pelo menos uma pergunta** no app, no mesmo jeito (a mesma pergunta pode ir para mais de
um jogo). O "O que eu aprendi" inteiro tem que estar na prova ou no quiz.

Crie `src/data/<materia><numero>.ts` no formato de `src/data/tipos.ts` (veja `historia9.ts` como modelo):

1. **temas**: um por subtítulo, na ordem do livro, **quantos o livro tiver** (sem limite; páginas sem subtítulo, como uma história em quadrinhos, também ganham tema; subtítulo com muita coisa vira dois temas). 3 a 6 `pontos` cada, frases curtas, palavras-chave em `**negrito**`.
   Eles viram narração: precisam soar bem em voz alta. `audio`: `audio/c<numero>-<índice>.mp3`.
2. **pares** (no mínimo 8; um para cada palavra em negrito e cada definição do livro): palavra-chave + significado de até 10 palavras. O jogo sorteia 6 por vez, então lista grande é bom: cada partida é diferente.
3. **linha** (6 a 10): fatos com data. `ordem` numérica (a.C. negativo; século 16 → 1550). Sem datas no capítulo:
   etapas de um processo (`ano`: "1º", "2º"...; `ordem`: 1, 2, 3...).
   Com etapas, dê também `nomeLinha` (nome da fase e explicação, ex.: ["Do campo ao mercado", "Coloque as etapas do leite na ordem"]; veja `geografia9.ts`).
4. **quiz** (de 12 a 20; o jogo usa todas): metade verdadeira. As falsas são erros que a criança realmente comete (trocar dois povos,
   inverter causa e efeito), nunca absurdos. `explicacao` corrige em uma frase.
5. **prova** (exatamente 10; o app exige): 4 opções, uma certa. Dê preferência às **atividades do livro** e ao "O que eu aprendi": é o mais parecido com a prova da escola. 3 de lembrar, 4 de entender, 2 de aplicar, 1 de analisar.
   - As erradas são do mesmo tipo da certa (povo com povo, data com data) e com **tamanho parecido**.
   - A certa **não** pode ser a mais comprida.
   - Proibido: "todas/nenhuma das anteriores", "NÃO", "EXCETO", "incorreta", pegadinha.
6. **Jogos extras** (veja `historia9.ts` como modelo). São os jogos que levam **o resto do livro**: o app sorteia alguns a cada partida (lacunas 6, quem sou eu 4, grupos 2, causas 5), então ponha quantos o mapa de cobertura pedir, além do mínimo:
   - `lacunas` (8 ou mais): frase com `___` no lugar da palavra-chave, `resposta` e 3 `distratores` do mesmo tipo.
   - `quemSou` (5 ou mais): `resposta`, 3 `pistas` da mais difícil para a mais fácil (nenhuma pista diz o nome) e 3 `distratores` do mesmo tipo.
   - `classificar` (2 ou mais): uma `pergunta` ("Khoi-khoi ou san?") e 2 grupos com 3 itens curtos cada. Escolha coisas que a criança confunde.
   - `causas` (5 ou mais): causa e consequência que o livro liga de forma clara ("por isso", "em troca", "porque"). Nada de causa inventada.

Guarde também, em `livro/<capitulo>/fontes.md`, uma lista curta de "item → página do livro" para conferência.

Capítulo já publicado: não reordene nem apague perguntas do `quiz` e da `prova` (a Revisão do Ará guarda pela posição).
Para corrigir, edite o texto no mesmo lugar; para acrescentar, ponha no fim.

### Matemática (diferente de História)

Matemática se aprende fazendo (decisão do Lucas, 05/11/2026). O livro é a **base**: pode usar outras contas e
exemplos, desde que sejam do **mesmo nível** (tamanho dos números, tipo de conta) e usem o **mesmo método** do livro.
Veja `src/data/matematica9.ts` como modelo:

- `temas`, `pares` e `linha` ficam vazios. No lugar, o campo `matematica`:
  - `exemplos` (4 a 6): um por assunto do livro, na ordem dele. `ideia` (uma frase com **negrito**), `situacao`
    (do livro ou parecida), `passos` (de 2 a 7, um de cada vez) e `treino` (tipo de conta do "Agora você").
  - `treino` (10), `desafio` (6 a 10) e `prova` (10): listas de tipos de conta de `src/lib/contas.ts`,
    do mais fácil para o mais difícil. Os números mudam a cada partida.
- `nomeDesafio` (opcional): nome da fase 3 quando não for balança (ex.: ["Retas e partes", "Descubra a fração"]).
- A resposta pode ser um número ou uma fração `[numerador, denominador]` (a criança digita em duas caixas).
  Desenhos prontos: balança, setas, cano dividido (`barra`) e reta numérica (`reta`).
- Unidade com assunto novo (medidas, geometria...): crie os geradores em `src/lib/contas.ts`,
  no nível do livro, com explicação que ensina o método, e rode `npm test` (o teste confere 500 contas de cada tipo).
- O mapa de cobertura vale também aqui: cada assunto e cada tipo de atividade do livro tem que virar um `exemplo` ou um tipo de conta no `treino`/`prova` (linha `COBERTO` com o tipo de conta em "Onde no app").
- `quiz` (12 a 20, V/F) e `prova` (10, múltipla escolha) continuam: o quiz é a fase 4 e os dois entram no Duelo do Saber.
  Prefira frases com conta ("Em ? × 9 = 36, o número que falta é 4.").
- Jogos extras (lacunas, quem sou eu, grupos, causas) ficam com os nomes e as ideias (parcela, quociente, prova real...).
- Problema do livro sem resposta impressa e que pode ser contado de dois jeitos: deixe de fora e avise o Lucas.

## Etapa 4 — Conferir

1. `npm run conferir -- <capitulo> --espalhar` (espalha as respostas certas entre A–D e mostra os problemas).
   Corrija todo `ERRO` e o máximo de `AVISO`.
2. **Conferência de cobertura**, com um revisor que não escreveu o conteúdo (um agente separado, sem acesso à sua
   conversa). Mande para ele, mais ou menos assim:
   > Só leia, não edite. Compare `livro/<capitulo>/paginas.md` com `src/data/<arquivo>.ts` (formato em `src/data/tipos.ts`).
   > Página por página, liste tudo o que uma professora pode cobrar (negrito, definição, exemplo com nome, número,
   > cada letra de cada atividade, "O que eu aprendi", boxes, perguntas de mapa, imagem e quadrinhos). Marque
   > COBERTO (diga o jogo e o número do item), PARCIAL (só no texto dos temas ou só como alternativa errada) ou FALTA.
   > Seja rigoroso. Depois compare com `livro/<capitulo>/cobertura.md` e aponte o que ele esqueceu ou marcou errado.
   Tudo o que vier `PARCIAL` ou `FALTA` vira pergunta (ou `FORA`, com um dos quatro motivos), e o revisor confere de
   novo até não sobrar nada. `npm run conferir` conta as linhas e dá ERRO se sobrar alguma.
3. Releia cada item contra `paginas.md`, como um revisor que não escreveu o conteúdo:
   fato fora do livro? resposta certa errada? duas opções certas? verdadeiro/falso ambíguo? frase difícil para a idade?
   distrator óbvio? Corrija.
4. Coloque o capítulo em `src/data/index.ts`, **dentro do conteúdo da turma que usa esse livro** (`conteudos`; hoje só `educativa-4b`). Cada turma só vê os capítulos do conteúdo dela. Livro de outra turma/escola = conteúdo novo, e o Lucas liga na turma pelo Painel do dono (aba Turmas).
5. `npm test` e `npm run build` precisam passar.
6. Commit e push. Explique ao Lucas, em português simples, o que entrou, **o que ficou `FORA` e por quê**, e o que ele deve conferir no livro
   (as datas e nomes principais). Diga a cobertura que o `npm run conferir` mostrou ("Cobertura do livro: 74 de 74 itens"). Lembre que as narrações são pedidas à parte (`vozes/pedido.json`) e diga quantos temas há, porque mais temas é mais narração. Em Matemática, os passos do "Ver como se faz" são narrados só com Nina e Otto: pedido `{"acao": "matematica", "capitulos": ["<id>"], "vozes": [nina, otto]}`; confira a fala com `falaDaConta` (`src/lib/falaMat.ts`).
