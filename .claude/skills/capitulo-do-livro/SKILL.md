---
name: capitulo-do-livro
description: Cria um capítulo do Sabidex a partir de fotos das páginas do livro da escola que o Lucas manda na conversa. Use quando ele mandar fotos de páginas do livro, pedir um capítulo novo, ou pedir para ler/transcrever páginas. Tudo é feito na conversa, sem API paga.
---

# Capítulo a partir das fotos do livro

O Lucas manda as fotos aqui na conversa. Você faz as 3 etapas, nesta ordem, e só no fim coloca no app.
Regras de pedagogia: `docs/ESTUDOS.md`. Regras por idade: `perfilDoAno` / `guiaDaIdade` em `src/lib/conteudo.ts`.
Antes de começar, confirme o capítulo (ex.: `historia-11`), a matéria e o ano escolar (padrão: 4º ano).
Se ele mandar muitas fotos, peça em lotes de 4 a 6 e vá transcrevendo cada lote.

## Etapa 1 — Ler (transcrição fiel)

Escreva `livro/<capitulo>/paginas.md`. Para cada foto:

- Comece com `## Página N` (número impresso na página; `?` se não aparecer).
- Copie o texto **exatamente** como está, na ordem de leitura: títulos (`#`, `##`), parágrafos, boxes (`> `), legendas.
- Imagem, mapa, gráfico ou ilustração: `[IMAGEM: o que mostra, em 1–2 frases]` + a legenda.
- Linhas do tempo e tabelas: todas as datas e valores, em lista ou tabela.
- Exercícios do livro: em `### Atividades do livro` (mostram o que a professora vai cobrar).
- Borrado, cortado ou ilegível: `[ILEGÍVEL]`. **Nunca complete com o que "deveria" estar escrito.**
  Diga ao Lucas qual foto refazer (mais luz, de cima, sem tremer).
- Não resuma, não corrija, não comente.

Não guarde as fotos no repositório (o livro tem direitos autorais, e foto pesa). Só a transcrição.

## Etapa 2 — Criar (só com o que está em paginas.md)

Não use nenhum fato, data, nome ou número que não esteja na transcrição, mesmo que você tenha certeza.
Siga o guia da idade (`guiaDaIdade(ano)`). Priorize o que o livro destaca: **negrito**, boxes, o que se repete,
atividades e resumo. Cubra todos os subtítulos, não só o começo.

Crie `src/data/<materia><numero>.ts` no formato de `src/data/tipos.ts` (veja `historia9.ts` como modelo):

1. **temas** (4 a 7): um por subtítulo, na ordem do livro. 3 a 5 `pontos` cada, frases curtas, palavras-chave em `**negrito**`.
   Eles viram narração: precisam soar bem em voz alta. `audio`: `audio/c<numero>-<índice>.mp3`.
2. **pares** (8 a 10): palavra-chave + significado de até 10 palavras.
3. **linha** (6 a 10): fatos com data. `ordem` numérica (a.C. negativo; século 16 → 1550). Sem datas no capítulo:
   etapas de um processo (`ano`: "1º", "2º"...; `ordem`: 1, 2, 3...).
4. **quiz** (10 a 12): metade verdadeira. As falsas são erros que a criança realmente comete (trocar dois povos,
   inverter causa e efeito), nunca absurdos. `explicacao` corrige em uma frase.
5. **prova** (exatamente 10): 4 opções, uma certa. 3 de lembrar, 4 de entender, 2 de aplicar, 1 de analisar.
   - As erradas são do mesmo tipo da certa (povo com povo, data com data) e com **tamanho parecido**.
   - A certa **não** pode ser a mais comprida.
   - Proibido: "todas/nenhuma das anteriores", "NÃO", "EXCETO", "incorreta", pegadinha.
6. **Jogos extras** (veja `historia9.ts` como modelo):
   - `lacunas` (8): frase com `___` no lugar da palavra-chave, `resposta` e 3 `distratores` do mesmo tipo.
   - `quemSou` (5): `resposta`, 3 `pistas` da mais difícil para a mais fácil (nenhuma pista diz o nome) e 3 `distratores` do mesmo tipo.
   - `classificar` (2): uma `pergunta` ("Khoi-khoi ou san?") e 2 grupos com 3 itens curtos cada. Escolha coisas que a criança confunde.
   - `causas` (5): causa e consequência que o livro liga de forma clara ("por isso", "em troca", "porque"). Nada de causa inventada.

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
- `quiz` (10 a 12, V/F) e `prova` (10, múltipla escolha) continuam: o quiz é a fase 4 e os dois entram no Duelo do Saber.
  Prefira frases com conta ("Em ? × 9 = 36, o número que falta é 4.").
- Jogos extras (lacunas, quem sou eu, grupos, causas) ficam com os nomes e as ideias (parcela, quociente, prova real...).
- Problema do livro sem resposta impressa e que pode ser contado de dois jeitos: deixe de fora e avise o Lucas.

## Etapa 3 — Conferir

1. `npm run conferir -- <capitulo> --espalhar` (espalha as respostas certas entre A–D e mostra os problemas).
   Corrija todo `ERRO` e o máximo de `AVISO`.
2. Releia cada item contra `paginas.md`, como um revisor que não escreveu o conteúdo:
   fato fora do livro? resposta certa errada? duas opções certas? verdadeiro/falso ambíguo? frase difícil para a idade?
   distrator óbvio? Corrija.
3. Coloque o capítulo em `src/data/index.ts`, **dentro do conteúdo da turma que usa esse livro** (`conteudos`; hoje só `educativa-4b`). Cada turma só vê os capítulos do conteúdo dela. Livro de outra turma/escola = conteúdo novo, e o Lucas liga na turma pelo Painel do dono (aba Turmas).
4. `npm test` e `npm run build` precisam passar.
5. Commit e push. Explique ao Lucas, em português simples, o que entrou e o que ele deve conferir no livro
   (as datas e nomes principais). Lembre que as narrações são pedidas à parte (`vozes/pedido.json`). Em Matemática, os passos do "Ver como se faz" são narrados só com Nina e Otto: pedido `{"acao": "matematica", "capitulos": ["<id>"], "vozes": [nina, otto]}`; confira a fala com `falaDaConta` (`src/lib/falaMat.ts`).
