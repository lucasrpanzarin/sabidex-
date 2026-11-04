# Estudos no Sabidex: como a criança aprende, perguntas, jogos, foco e o robô do livro

Guia de decisão para a parte de estudo. Serve para o Lucas, para professores e para o Claude
quando for criar capítulos ou jogos novos. As regras daqui viraram código em `src/lib/conteudo.ts`
(conferência automática) e `scripts/livro.ts` (robô do livro).

---

## 1. Como a criança aprende de verdade (e o que isso muda no app)

São os resultados mais firmes da pesquisa sobre aprendizagem. Cada um vira uma regra prática.

| O que a pesquisa mostra | Na prática, no Sabidex |
|---|---|
| **Puxar da memória ensina mais do que reler.** Tentar lembrar (mesmo errando) fixa a matéria. | Quase toda tela é pergunta. Ouvir o tema é curto e vem antes de jogar. |
| **Revisar espaçado** (1, 3, 7 e 21 dias depois) vence estudar tudo de uma vez. | Jogo novo "Revisão do Ará": volta as perguntas que a criança errou, nos dias certos. |
| **Misturar assuntos** na revisão ajuda a diferenciar coisas parecidas (khoi-khoi x san). | A revisão e o "chefão misto" sorteiam perguntas de vários temas e capítulos. |
| **Correção na hora, explicando o porquê.** Só "errado" não ensina. | Toda pergunta tem `explicacao`. Depois de errar, a criança vê a certa e tenta de novo mais tarde. |
| **Pouca coisa de cada vez.** Com 10 anos, a memória de curto prazo segura 4 a 6 itens. | Rodadas de 5 a 6 itens; frases curtas; uma ideia por frase. |
| **Palavra + imagem + som** juntos lembram melhor que só texto. | Narração dos temas, símbolo nas cartas, linha do tempo visual. |
| **Explicar o porquê** (causa, consequência, comparação) cria memória mais forte que decorar. | Perguntas de "entender" e jogos de causa e consequência, não só "quem/quando". |
| **Desafio na medida:** acertar uns 80% mantém motivado; 100% entedia, 50% desanima. | Começa fácil e vai subindo; se errar muito, o jogo dá pistas antes de dar a resposta. |
| **Saber o que sabe** (metacognição): marcar "tenho certeza" ou "acho que" melhora o estudo. | Ideia futura: botão de confiança na prova; erro com "tenho certeza" volta mais vezes na revisão. |

---

## 2. As melhores perguntas

### Tipos, do mais ao menos útil para essa idade

| Tipo | Treina | Nível | Onde usar |
|---|---|---|---|
| **Por quê / causa e consequência** ("Por que os holandeses invadiram o Nordeste?") | entender | médio | prova, jogo de ligar |
| **Comparar** ("O que khoi-khoi e san tinham de diferente?") | entender / analisar | médio | prova, separar em grupos |
| **Complete a frase** (lacuna com a palavra-chave) | lembrar com esforço | fácil | jogo novo |
| **Quem sou eu?** (3 pistas, da difícil para a fácil) | lembrar + raciocinar | fácil/médio | jogo novo |
| **Ordenar** (linha do tempo, etapas) | entender sequência | médio | linha do tempo |
| **Aplicar** ("Qual destas palavras que usamos veio dos bantos?") | aplicar | médio | prova |
| **Verdadeiro ou falso com explicação** | reconhecer erros comuns | fácil | quiz |
| **Múltipla escolha de fato solto** ("Em que ano...?") | lembrar | fácil | só 3 das 10 da prova |

**Mistura da prova (10 questões):** 3 lembrar, 4 entender, 2 aplicar, 1 analisar.

### Regras de uma boa pergunta (o robô segue e o teste confere)

1. Uma pergunta, uma ideia. Até ~20 palavras.
2. **As erradas precisam ser plausíveis**: do mesmo tipo da certa (se a certa é um povo, as outras também são povos do capítulo) e com **tamanho parecido**.
3. A certa **não pode ser a mais comprida**. Crianças aprendem rápido que "a maior é a certa".
4. Resposta certa espalhada entre A, B, C e D.
5. Proibido: "todas/nenhuma das anteriores", "NÃO", "EXCETO", "incorreta", pegadinha.
6. Verdadeiro ou falso: metade de cada; as falsas são **erros que a criança realmente comete** (trocar dois povos, inverter causa e efeito), não absurdos.
7. A explicação ensina: diz por que a certa é certa em uma frase.

### O que achamos nos capítulos 9 e 10

A conferência automática (`validarCapitulo`) achou pontos para melhorar:

- **7 das 20 questões** da prova têm a resposta certa bem mais comprida que as outras (ex.: "Quem foi Piye?" → só a certa é uma frase completa).
- Algumas erradas são absurdas e fáceis de descartar ("Uma viagem de férias dos portugueses", "Mandando cartas").
- No capítulo 9, **nenhuma resposta certa está na letra D**.
- A prova não muda a ordem das opções a cada vez; quem refaz decora a posição.

Nada disso quebra o jogo, mas deixa a prova mais fácil do que parece. Vale corrigir (conferindo com o livro).

---

## 3. Os jogos

### O que já existe (e como melhorar)

| Fase | Bom para | Melhoria sugerida |
|---|---|---|
| Ouvir os temas | primeiro contato, palavra + som | 1 pergunta rápida depois de cada tema ("o que você lembra?") |
| Jogo da memória | vocabulário | ok; na revisão, misturar palavras de capítulos diferentes |
| Linha do tempo | ordem e contexto | ok |
| Quiz relâmpago | erros comuns | opção "sem relógio" para quem fica ansioso |
| Prova (chefão) | tudo junto | embaralhar opções; mostrar explicação de cada erro (já mostra a certa) |

### Jogos novos, por ordem de impacto

O robô do livro **já cria o material** dos jogos 2 a 5 (fica em `livro/<capitulo>/capitulo.json`, parte `extras`).

1. **Revisão do Ará (repetição espaçada).** Todo dia, 5 a 8 perguntas que a criança errou ou acertou há tempo. Acertou: a pergunta volta daqui a mais dias (1 → 3 → 7 → 21). Errou: volta amanhã. É o que mais faz a matéria ficar para a prova da escola. Dá XP e, a cada 5 revisões, um pacote.
2. **Complete a frase.** Frase do livro com uma lacuna e 4 palavras para escolher. Treina lembrar a palavra exata.
3. **Quem sou eu?** 3 pistas, uma de cada vez. Acertar na 1ª pista vale mais XP.
4. **Separe nos grupos.** Arrastar itens para 2 ou 3 caixas (ex.: "khoi-khoi" x "san"). Ótimo para coisas que a criança confunde.
5. **Causa e consequência.** Ligar cada causa ao que aconteceu depois.
6. **Chefão misto.** Prova com perguntas de todos os capítulos já feitos, perto da prova da escola.

---

## 4. Como prender o foco (sem viciar)

**Fazer:**
- **Sessões curtas:** 5 a 10 minutos. Cada fase dura 2 a 4 minutos.
- **Meta clara do dia:** "Hoje: 1 revisão + 1 fase". Barra de progresso sempre visível.
- **Trocar de atividade** a cada 2–3 minutos (ouvir → ligar → ordenar → responder).
- **Prêmio por aprender, não por tempo de tela:** XP e pacotes vêm de acertar e terminar fases, nunca de ficar mais tempo.
- **Surpresa boa:** o pacote de cartas e a carta lendária são o "momento uau"; animação só nesses momentos.
- **O Ará reage** ao acerto, ao erro ("quase! olha a dica") e ao recorde; fala na 2ª pessoa e chama pelo apelido.
- **Começar fácil:** a primeira pergunta de cada fase é a mais fácil, para entrar no ritmo.
- **Erro sem castigo:** errar dá menos XP, mas nunca tira o que já ganhou.
- **Parar no alto:** depois da meta do dia, o Ará comemora e sugere voltar amanhã.

**Não fazer** (são crianças):
- Sequência de dias que "quebra" e dá culpa. Melhor: 1 dia de folga por semana sem perder a sequência.
- Notificações insistentes, contagem regressiva para comprar, pacotes pagos ou sorteio por dinheiro.
- Ranking que humilha: o ranking da turma mostra só os primeiros e o próprio lugar da criança.
- Relógio obrigatório em tudo: cronômetro só no quiz relâmpago, e com opção de desligar.

---

## 5. O robô do livro

Fica em `scripts/livro.ts` e roda no GitHub (`.github/workflows/livro.yml`), igual às vozes e à arte.
Passo a passo de uso: `livro/LEIAME.md`.

### Como funciona (3 robôs separados)

```
fotos das páginas ──► 1. LEITOR ──► paginas.md (texto fiel do livro)
                                         │
                                         ▼
                                    2. CRIADOR ──► src/data/<capitulo>.ts  (rascunho)
                                         │          capitulo.json (com a página de cada item)
                                         ▼
                                    3. CONFERENTE ──► conferencia.md (erros e avisos)
                                         +
                                    conferência automática (src/lib/conteudo.ts)
```

**1. Como ele lê as imagens.** O Claude olha cada foto (uma por vez, reduzida para 2000 px) e **só copia**:
títulos, parágrafos, boxes, legendas, datas das linhas do tempo e as atividades do livro. Cada imagem do livro
vira uma descrição curta (`[IMAGEM: ...]`). Se algo está borrado ou cortado ele escreve `[ILEGÍVEL]` em vez de
adivinhar, e o resultado avisa qual foto refazer. Separar "ler" de "criar" é o que impede o robô de inventar:
o criador só enxerga o que foi copiado do livro.

**2. Como ele escolhe o que é mais importante.** O livro já mostra o que importa. O criador procura:
palavras em **negrito**, boxes, o que se repete, as atividades do fim do capítulo e o resumo. E cobre
**todos** os subtítulos, não só o começo.

**3. Como ele escreve para cada idade.** O pedido leva o ano escolar (`"ano": 4`). As regras mudam:

| Ano | Idade | Frase | Perguntas |
|---|---|---|---|
| 1º–2º | 6–7 | até 10 palavras, sem datas difíceis | lembrar e reconhecer |
| 3º–5º | 8–11 | até 15–20 palavras, ordem direta, palavra nova explicada | entender, comparar, causa e consequência |
| 6º–9º | 11–14 | até 25 palavras, termos técnicos definidos | analisar, pontos de vista, fontes |

**4. Como ele gera os textos.** Usa o formato do app (`src/data/tipos.ts`) com as regras da seção 2:
mistura de níveis na prova, erradas plausíveis, quiz com metade verdadeira, 12 cartas (5 comuns, 3 raras,
2 épicas, 2 lendárias). Depois o código **espalha as respostas certas** entre A, B, C e D.

**5. Como ele se confere.** Um segundo robô, que não criou o conteúdo, compara item por item com o livro e
aponta "erros" (fato fora do livro, resposta errada, duas certas) e "atenção" (frase difícil, distrator óbvio).
A conferência automática olha tamanhos, quantidades e pegadinhas.

**Importante:** o rascunho nunca entra no app sozinho. Uma pessoa lê a conferência e coloca o capítulo em
`src/data/index.ts`.

**Custo:** cada capítulo de ~20 páginas deve custar por volta de 1 a 3 dólares de uso do Claude (estimativa;
o valor real aparece no painel da Anthropic).

---

## 6. Próximos passos sugeridos

1. Testar o robô com um capítulo de verdade (fotos + chave `ANTHROPIC_API_KEY` no GitHub).
2. Corrigir as questões dos capítulos 9 e 10 apontadas na seção 2.
3. Criar a **Revisão do Ará** (repetição espaçada): é o jogo que mais ajuda na prova da escola.
4. Criar "Complete a frase" e "Quem sou eu?" usando os `extras` do robô (precisa acrescentar esses campos em `tipos.ts`).
5. Painel do professor: mostrar quais perguntas a turma mais erra.
