# Estudos no Sabidex: como a criança aprende, perguntas, jogos, foco e do livro para o app

Guia de decisão para a parte de estudo. Serve para o Lucas, para professores e para o Claude
quando for criar capítulos ou jogos novos. As regras daqui viraram código em `src/lib/conteudo.ts`
(conferência automática, `npm run conferir`) e `.claude/skills/capitulo-do-livro/SKILL.md` (roteiro para criar capítulos a partir das fotos).

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
| **Palavra + imagem + som** juntos lembram melhor que só texto. | Narração dos temas, desenhos dos Sabimons, linha do tempo visual. |
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

### Regras de uma boa pergunta (o Claude segue e `npm run conferir` confere)

1. Uma pergunta, uma ideia. Até ~20 palavras.
2. **As erradas precisam ser plausíveis**: do mesmo tipo da certa (se a certa é um povo, as outras também são povos do capítulo) e com **tamanho parecido**.
3. A certa **não pode ser a mais comprida**. Crianças aprendem rápido que "a maior é a certa".
4. Resposta certa espalhada entre A, B, C e D.
5. Proibido: "todas/nenhuma das anteriores", "NÃO", "EXCETO", "incorreta", pegadinha.
6. Verdadeiro ou falso: metade de cada; as falsas são **erros que a criança realmente comete** (trocar dois povos, inverter causa e efeito), não absurdos.
7. A explicação ensina: diz por que a certa é certa em uma frase.

### Revisão dos capítulos 9 e 10 (feita em 04/11/2026)

A conferência automática achou respostas certas bem mais compridas que as outras (7 de 20) e opções erradas
absurdas ("Uma viagem de férias dos portugueses"). Foram corrigidas: as certas ficaram curtas e as erradas agora
usam coisas do próprio capítulo que a criança pode confundir (Obá x Oni, khoi-khoi x san, assírios x núbios,
bantos x diáspora). Nenhum fato novo entrou. Além disso, a prova agora **embaralha as opções** a cada tentativa.

---

## 3. Os jogos

### O que já existe (e como melhorar)

| Fase | Bom para | Melhoria sugerida |
|---|---|---|
| Ouvir os temas | primeiro contato, palavra + som | **Feito:** botão "Já li este tema" (para quem está sem som ou prefere ler). Ideia: 1 pergunta rápida depois de cada tema |
| Jogo da memória | vocabulário | ok; na revisão, misturar palavras de capítulos diferentes |
| Linha do tempo | ordem e contexto | ok |
| Quiz relâmpago | erros comuns | **Feito:** o relógio para enquanto a criança lê a explicação; as respostas vão para a revisão |
| Prova (chefão) | tudo junto | **Feito:** opções embaralhadas a cada tentativa; as respostas vão para a revisão |

### Jogos novos, por ordem de impacto

1. **Revisão do Ará (repetição espaçada) — FEITO.** Toda pergunta do quiz e da prova entra na revisão.
   Errou: volta amanhã. Acertou: volta em 3 dias, depois 7, 21 e 60 (só sobe se acertar no dia certo, então repetir a
   fase no mesmo dia não "engana"). A revisão tem até 8 perguntas, mistura capítulos e mostra a explicação na hora.
   Dá 10 XP (e Sabicoins) por acerto e segue as mesmas regras de pacote das fases: conta como a atividade que dá o pacote do dia. Aparece no Início quando
   tem pergunta para hoje. Código: `src/lib/revisao.ts` e `src/screens/Revisao.tsx`.
   Por enquanto a agenda da revisão fica só no aparelho (não vai para o servidor da turma).
2. **Jogos extras — FEITOS** (`src/screens/Extras.tsx`). Ficam no mapa de cada mundo, abrem depois de "Ouvir os temas",
   valem 40 XP cada e, quem termina os quatro com nota 7 ou mais em cada um, ganha um pacote (se tirar menos, o pacote espera até jogar de novo e passar). Só aparecem se o capítulo tiver o material
   (campos `lacunas`, `quemSou`, `classificar` e `causas` em `tipos.ts`):
   - **Complete a frase:** frase com uma lacuna e 4 palavras. Treina lembrar a palavra exata.
   - **Quem sou eu?:** 3 pistas, da mais difícil para a mais fácil. Acertar com 1 pista vale 3 pontos; errar abre a próxima pista.
   - **Separe nos grupos:** cada frase vai para o grupo certo (ex.: khoi-khoi x san). Ótimo para o que a criança confunde.
   - **Por que aconteceu?:** ligar cada causa ao que aconteceu depois. Treina o "porquê", não só o "quando".
6. **Chefão misto.** Prova com perguntas de todos os capítulos já feitos, perto da prova da escola.

### Data da prova da escola

O professor (na turma) ou o adulto (na família) marca o dia da prova de cada capítulo, na área dos adultos.
Antes da data, o capítulo vem primeiro, com o selo "Prova em 5 dias", e o Ará avisa na semana da prova.
Depois da data, o capítulo vai para **"Já teve prova na escola"**: continua aberto e valendo os mesmos XP e pacotes,
para quem chegou depois, faltou ou quer revisar (a matéria volta no bimestre). Não damos bônus por estudar antes da
data: isso seria pressão de tempo e deixaria para trás quem chegou depois. Se a turma e a família marcarem datas
diferentes, vale a da turma. Código: `src/lib/provas.ts` e a tabela `datas_prova` no servidor.

### Matemática: aprender fazendo (Lucas, 05/11/2026)

Em História a criança precisa lembrar e entender; em Matemática, precisa **saber fazer**. Ouvir explicação ajuda
pouco: o que ensina é ver um exemplo resolvido e logo depois resolver um igual, muitas vezes, com correção na hora.
Por isso, nos capítulos de Matemática (campo `matematica`), as fases do mapa mudam por dentro:

| Fase | Em Matemática | Por quê |
|---|---|---|
| Ouvir os temas | **Ver como se faz**: exemplo resolvido passo a passo, e "Agora você" com uma conta igual | exemplo resolvido + prática logo em seguida é o jeito mais eficiente de começar |
| Jogo da memória | **Treino de contas**: 10 contas digitadas | digitar o número impede o chute e a eliminação de opções |
| Linha do tempo | **Balança e sequências**: balança desenhada, setas de ida e volta, múltiplos | os desenhos do próprio livro, para "ver" a igualdade e a operação inversa |
| Quiz relâmpago | igual (verdadeiro ou falso, com contas) | erros comuns |
| Prova | **Prova da unidade**: 10 contas e problemas digitados, correção no fim | o que a professora cobra |

- **Números novos a cada partida** (`src/lib/contas.ts`): jogar de novo é treinar, não decorar. O livro é a base;
  as contas seguem o mesmo nível e o mesmo método.
- **Revisão do Ará**: guarda o *tipo* de conta errado e traz uma conta nova desse tipo.
- A explicação de cada conta mostra o método (a operação inversa, a prova real), não só o resultado.
- **Papel e lápis** (Lucas, 05/11/2026): fazer a conta no papel não é trapaça, é o que a escola cobra (conta no papel, prova real). No começo de cada fase de Matemática o Ará pede papel e lápis (botão "Já peguei!"); nas contas mais difíceis aparece "Dica: faça a conta no papel" (`TIPOS_PAPEL` em `src/lib/contas.ts`). Rascunho na tela não: escrever número com o dedo no celular atrapalha mais do que ajuda.

---

## 4. Como prender o foco (sem viciar)

**Fazer:**
- **Sessões curtas:** 5 a 10 minutos. Cada fase dura 2 a 4 minutos.
- **Meta clara do dia:** "Hoje: 1 revisão + 1 fase". Barra de progresso sempre visível.
- **Trocar de atividade** a cada 2–3 minutos (ouvir → ligar → ordenar → responder).
- **Prêmio por aprender, não por tempo de tela:** XP e pacotes vêm de acertar e terminar fases, nunca de ficar mais tempo.
- **Uma chance por item:** em todos os jogos de ligar e ordenar (memória, linha do tempo, separe nos grupos,
  por que aconteceu?), cada item tem uma chance só. Errou, o app mostra o certo, marca como erro e segue.
  Assim não dá para ir clicando até acertar. O resultado é igual em todos os jogos: estrelas, "X de Y certas" e a nota
  (3 estrelas = nota 10, 2 = nota 7 ou mais, 1 = abaixo de 7).
- **Chutar não compensa:** cada erro tira 10% do XP da fase (sobra no mínimo 20%). Pacote da fase (memória, quiz), pacote do dia e pacote épico da prova só vêm com nota 7 ou mais (7 de cada 10 certas). Se a nota não der, o pacote da fase fica esperando: ela joga de novo e ganha quando tirar 7.
- **Surpresa boa:** o pacote de Sabimons e o lendário são o "momento uau"; animação só nesses momentos.
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

## 5. Do livro para o app (feito na conversa, sem custo de API)

O Lucas manda as fotos das páginas na conversa com o Claude, que segue sempre o mesmo roteiro
(`.claude/skills/capitulo-do-livro/SKILL.md`). Passo a passo para o Lucas: `livro/LEIAME.md`.

```
fotos na conversa ──► 1. LER ──► livro/<capitulo>/paginas.md (texto fiel do livro)
                                     │
                                     ▼
                                2. CRIAR ──► src/data/<capitulo>.ts + livro/<capitulo>/fontes.md
                                     │
                                     ▼
                                3. CONFERIR ──► npm run conferir + releitura item por item contra o livro
```

**1. Como as imagens são lidas.** O Claude olha cada foto e **só copia**: títulos, parágrafos, boxes, legendas,
datas das linhas do tempo e as atividades do livro. Cada imagem do livro vira uma descrição curta (`[IMAGEM: ...]`).
O que está borrado ou cortado vira `[ILEGÍVEL]`, e ele pede outra foto em vez de adivinhar. Separar "ler" de
"criar" é o que impede de inventar: o capítulo é feito só com o que foi copiado do livro.

**2. Tudo o que o livro cobra entra no app** (Lucas, 13/11/2026). Antes, a receita limitava o tamanho (até 7 temas,
10 perguntas) e o Claude escolhia "o mais importante": a conferência de 13/11 mostrou que só ~58% da Geografia
era treinada, e uma mãe contou que caíram na prova coisas que o app não tinha. Agora, antes de escrever as perguntas,
o Claude faz o **mapa de cobertura** (`livro/<capitulo>/cobertura.md`): uma linha para cada coisa que a professora pode
cobrar, página por página (negrito, definição, exemplo com nome, número, cada atividade do livro, "O que eu aprendi",
boxes). Cada linha precisa estar num **jogo** (estar só no texto do tema não conta). Os jogos extras e o jogo da
memória sorteiam alguns itens por partida, então as listas podem ser grandes. Só fica de fora, com o motivo dito ao
Lucas, o que depende de ler a cor de um mapa na foto, o que pergunta sobre a cidade da própria criança e passatempos.

**3. Como escrever para cada idade.** As regras mudam com o ano escolar (`perfilDoAno` em `src/lib/conteudo.ts`):

| Ano | Idade | Frase | Perguntas |
|---|---|---|---|
| 1º–2º | 6–7 | até 10 palavras, sem datas difíceis | lembrar e reconhecer |
| 3º–5º | 8–11 | até 15–20 palavras, ordem direta, palavra nova explicada | entender, comparar, causa e consequência |
| 6º–9º | 11–14 | até 25 palavras, termos técnicos definidos | analisar, pontos de vista, fontes |

**4. Como os textos são gerados.** No formato do app (`src/data/tipos.ts`), com as regras da seção 2:
mistura de níveis na prova, erradas plausíveis, quiz com metade verdadeira e o material dos jogos extras.
(Os capítulos não têm mais cartas próprias: os pacotes trazem Sabimons.)

**5. Como é conferido.** `npm run conferir -- <capitulo> --espalhar` espalha as respostas certas entre A, B, C e D,
aponta tamanhos, quantidades e pegadinhas, e lê o mapa de cobertura (dá ERRO se sobrar item `PARCIAL` ou `FALTA`
e mostra a porcentagem coberta). Um revisor separado confere a cobertura página por página. Depois o Claude relê cada item contra o livro como revisor.
Por último, o Lucas confere datas e nomes principais no livro (`fontes.md` diz a página).

## 6. Próximos passos sugeridos

1. Criar o próximo capítulo mandando as fotos na conversa.
2. Levar a agenda da Revisão do Ará para o servidor (para não perder ao trocar de aparelho).
3. Opção "sem relógio" no quiz relâmpago.
4. Levar os erros dos jogos extras para a Revisão do Ará.
5. Painel do professor: mostrar quais perguntas a turma mais erra.
