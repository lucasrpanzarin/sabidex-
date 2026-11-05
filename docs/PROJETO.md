# Caderno do projeto Sabidex

Este é o resumo de **tudo o que já existe e já foi decidido** no Sabidex.
O Claude lê este arquivo no começo de cada conversa (está pedido no `CLAUDE.md`).

**Para que serve:**
- Quando o Lucas der uma ideia nova, o Claude confere aqui antes e avisa: "isso já existe", "isso já foi testado e trocado por X" ou "isso vai contra a regra Y".
- Ao terminar qualquer mudança, o Claude atualiza este caderno (o que mudou, a data e quem decidiu).

Última revisão geral: **04/11/2026**. Última mudança: **05/11/2026** (estrelas no mapa e Duelo do Saber).

---

## 1. O que é

App de estudo gamificado para crianças de 9 a 11 anos (4º ano). A criança estuda a matéria do livro da escola em fases curtas, ganha XP, Sabicoins e pacotes de **Sabimons** (bichos da fauna brasileira, com 3 formas cada) e completa o **álbum de 60 figurinhas**.

- Endereço: **https://sabidex.com.br** (o antigo `sabidex.fastlabs.workers.dev` continua funcionando; `sabidex.com` ainda não está ligado).
- Hospedagem: Cloudflare (conta do Lucas). Banco de dados D1 `sabidex`.
- Dono: Lucas (não é programador: tudo explicado em português simples).

## 2. Identidade visual (decidida pelo Lucas, não mudar sem ele pedir)

| Coisa | Como é | Onde está |
|---|---|---|
| **Logo** | "Letras-figurinha": cada letra de Sabidex é uma figurinha colorida e torta (coral, amarelo, turquesa, rosa, verde, coral, amarelo), fonte Lilita One, contorno escuro e sombra de adesivo | `src/components/Logo.tsx` (sempre usar esse componente) |
| **Ícone do celular** | Mini carta lendária amarela com o "S" branco do logo, num fundo holográfico | `public/icons/icon.svg` (PNG 192/512 saem dele) |
| **Estilo** | "Álbum de figurinhas": papel claro, contorno escuro grosso, sombra de adesivo | `src/styles.css`, `design-system/sabidex/MASTER.md` |
| **Cores** | Coral, amarelo, turquesa, rosa, verde. Texto colorido só nas versões escuras (`--t-...`). Roxo pode ser usado; só não pode ficar uma cópia do Baobab (Lucas, 05/11/2026) | `src/styles.css` |
| **Fontes** | Lilita One (títulos e botões), Nunito (textos) | |
| **Mascote** | **Ará**, a arara, com mochila e lápis. É a guia, não é um Sabimon. 4 caras 3D: feliz, pensando, comemorando, triste | `src/components/Ara.tsx`, `public/mascote/` |
| **Raridades** | comum ★ cinza · rara ★★ turquesa · épica ★★★ rosa · lendária ★★★★ amarelo com borda holográfica | |
| **Pacote** | Embalagem metálica holográfica 3D, rasga com o dedo; a carta pula de costas e a criança toca para virar | `src/components/RasgarPacote.tsx` |
| **Verso das cartas** | Azul-noite com o logo do app | `src/components/CartaView.tsx` |
| **Animação** | Só em momento de prêmio. Respeita "reduzir movimento" do celular | |

## 3. O que já existe (confira aqui antes de criar algo "novo")

### Estudo
- **Mundos** = capítulos do livro. Hoje: **História cap. 9** ("Um continente chamado África") e **cap. 10** ("Terra à vista!"). Ciências e Geografia aparecem como "Em breve".
- Cada mundo tem **5 fases** em ordem (uma libera a próxima):
  1. **Ouvir os temas** (áudio com 3 vozes: Nina, Otto, Graziella; o app lembra os temas já ouvidos)
  2. **Jogo da memória** (ligar palavra e significado)
  3. **Linha do tempo** (pôr fatos em ordem)
  4. **Quiz relâmpago** (verdadeiro ou falso, 60 segundos; o relógio para enquanto lê a explicação)
  5. **Prova do capítulo** (chefão, 10 questões, nota 7 passa)
- **4 jogos extras** por mundo (abrem depois de ouvir os temas): Complete a frase, Quem sou eu?, Separe nos grupos, Por que aconteceu?
- **Revisão do Ará**: as perguntas erradas voltam no dia seguinte; as certas voltam depois de alguns dias (repetição espaçada).
- **Uma chance por item** em todos os jogos: errou, o app mostra o certo e segue.
- **Placar igual em todos os jogos**: estrelas (3 = nota 10, 2 = nota 7 ou mais, 1 = abaixo de 7), "X de Y certas" e nota.
- **Estrelas no mapa do mundo** (Lucas, 05/11/2026): cada fase feita e cada jogo extra mostra as estrelas da **melhor vez** num adesivo embaixo da bolinha; no topo aparece "X de Y estrelas" do mundo. Ouvir os temas não tem nota (não tem estrela); a prova só mostra depois de aprovada. Fases feitas antes disso sem nota guardada só ganham estrela quando a criança jogar de novo. Melhor nota em `notas['capitulo:fase']` e `notas['capitulo:extra-x']` (`estrelasDe` em `src/lib/jogo.ts`).
- **Data da prova da escola**: o professor (turma) ou o adulto (família) marca. Depois da data o capítulo vai para "Já teve prova na escola" (continua valendo tudo).
- Capítulo novo: o Lucas manda fotos do livro na conversa e o Claude segue a skill **capitulo-do-livro**. Regras pedagógicas em `docs/ESTUDOS.md`. Conferência automática: `npm run conferir -- historia-9`.

### Prêmios e números do jogo
| Regra | Valor | Arquivo |
|---|---|---|
| XP das fases | ouvir 50 · memória 60 · linha 60 · quiz 80 · prova 120 · cada extra 40 | `src/lib/jogo.ts` |
| Repetir uma fase | metade do XP | |
| Prova reprovada | 1/4 do XP, não conta como feita | |
| Cada erro | tira 10% do XP da fase (mínimo 20%) | |
| Nível | a cada 300 XP | |
| **Sabicoins** | cada fase dá o mesmo número de XP e de Sabicoins. Saldo = XP total − compras | `src/lib/loja.ts` |
| Pacotes (só do estudo) | memória e quiz (1ª vez com nota 7), prova aprovada (pacote **épico**), terminar os 4 extras, 1ª atividade do dia com nota 7, cada nível novo | `src/lib/jogo.ts` |
| **Pacote de boas-vindas** (única exceção à regra acima; Lucas, 05/11/2026) | toda conta nova de criança (família ou turma) já nasce com 1 pacote normal; a carta sai na sorte. O Ará apresenta na tela inicial e, depois de abrir, explica que os próximos vêm do estudo. Quem já tinha conta não ganha | `src/shared/sync.ts` (`comBoasVindas`) |
| Pacote | **1 Sabimon** (sempre a forma 1). Chances: comum 62%, rara 26%, épica 9%, lendária 3%. Épico: 80% épica, 20% lendária | |
| Garantia | depois de 9 pacotes sem bicho novo, o 10º traz um que a criança não tem | |
| **Nunca** | vender pacote (nem por moeda do jogo, nem por dinheiro), desconto ou pressão de tempo | |

### Cartas e álbum
- **Álbum de 60 figurinhas**: 20 Sabimons × 3 formas. Número no álbum = (nº do Sabimon − 1) × 3 + forma. Ids: `s001`, `s001-2`, `s001-3`.
- **Evolução** (Lucas, 04/11/2026): **3 cartas da forma 1 → 1 da forma 2** (+100 Sabicoins); **2 da forma 2 → 1 da forma 3** (+300 Sabicoins). As cartas usadas somem. Na turma, a evolução é feita pelo servidor.
- Vida e força da carta: calculadas em `src/lib/sabimon.ts` (pela raridade e pela forma). Forma 1: comum Vida 50, força 10/20 · rara 60, 20/30 · épica 70, 30/40 · **lendária 90, 40/50**. Forma 2: +30 Vida, força ×1,7. Forma 3: +70 Vida, força ×2,6.
- **Lendária tem brilho**: estrela-figurinha amarela no canto da moldura e reflexo dourado em cima do desenho.
- Carta com itens da lojinha não sai em troca nem na evolução (só as cópias repetidas).

### Lojinha
- Itens com raridade e um **fato real do Brasil**. Vitrine atual: Caju (100), Folha de vitória-régia +20 Vida (150), Fruto de guaraná +10 força (150), Ouriço de castanha +35 Vida (350), Flor de ipê-amarelo +20 força (350), Cristal de ametista (400), Escama de pirarucu +50 Vida (700), Moldura de ouro (700), Brilho holográfico (1500).
- Itens de Vida/força/enfeite vão para a **faixa de 3 espaços** embaixo da carta. Moldura de ouro e brilho holográfico mudam a carta e não ocupam espaço.
- **Coroa do álbum**: não se compra, ganha 1 por mundo completo.
- **Destaque do dia** (sem desconto) e **"Meu desejo"** (a criança marca o item que quer juntar moedas).
- Itens antigos que saíram da vitrine mas continuam valendo: Medalha de prata, Escudo, Raio de força, Medalha de ouro, Duas estrelas de ouro.

### Contas, turma e família
- **Não existe jogar sem conta** (desde 04/11/2026). **Primeira tela** (Lucas, 05/11/2026): "Oi! Quem está aí?" com duas figurinhas grandes, **Sou criança** e **Sou adulto** (tocou, já segue). Se o aparelho já tem perfis da família, eles aparecem antes.
- **Entrada da criança** (Lucas, 05/11/2026): uma caixa só, "Qual é o seu código?", que aceita o código da **turma** ou o da **família**. Depois toca no nome e digita o PIN. Na turma, "Sou novo na turma" cria apelido, cor e PIN. "Ainda não tenho código" manda um recado pronto para um adulto (WhatsApp etc.), sem número de propaganda.
- **Código da família** (Lucas, 05/11/2026): cada família tem um código no mesmo formato da turma (ex.: TREM-7656), nunca igual ao de uma turma. Aparece na área dos adultos com "Enviar para meu filho" e "Trocar código". Quem tem o código vê só os apelidos e cores dos filhos; para entrar precisa do PIN.
- **Conta da família**: o adulto (e-mail + senha, ou Google, ligado em 05/11/2026; Apple quando ligado) cria os perfis dos filhos (apelido + cor + PIN de 4 números). Até 6 filhos.
- **Turma**: o professor cria e recebe um código fácil (ex.: ARARA-4821). Até 60 crianças por turma; até 20 turmas por adulto.
- **Aba "Turma"** (no menu de baixo; antes se chamava "Trocas", Lucas trocou em 05/11/2026): junta as trocas, o Duelo do Saber e a conversa da turma.
- **Trocas**: só propostas de carta por carta, com colegas da mesma turma. Até 5 propostas esperando.
- **Chat da turma supervisionado** (Lucas, 04/11/2026): um grupo único da turma da escola, sem mensagem privada nem gente de fora. Começa desligado: um administrador da turma liga e escolhe o horário (padrão 7h–21h) **e** o responsável autoriza cada filho (criança sem família não escreve). Pais e professor leem tudo, e a criança é avisada disso. Bloqueia palavrões, telefones, endereços, links, e-mails e redes sociais; sem foto nem áudio; até 200 letras e 5 mensagens a cada 30 segundos. Botão "Avisar um adulto"; administradores apagam mensagens e pausam um aluno. As mensagens somem em 60 dias. Também tem **"Estudando agora"** (só para a turma; adultos podem desligar). Arquivos: `src/shared/chat.ts`, `src/screens/Chat.tsx`.
- **Vários administradores na turma**: o dono convida outros adultos com um código `ADM-XXXX-XXXX` (vale 7 dias, uma vez só). Só o dono convida ou remove administradores. Se o dono apagar a conta, a turma passa para o administrador mais antigo.
- **Ranking da semana** (XP, cartas e vitórias nos duelos), zera toda segunda.
- **Duelo do Saber** (Lucas, 05/11/2026; `src/shared/duelo.ts`, `src/screens/Duelo.tsx`, tabela `duelos`): na aba Turma → "Duelo do Saber", a criança desafia um colega **da mesma turma**. Os dois respondem as **mesmas 10 perguntas** (6 de escolher da prova + 4 de verdadeiro ou falso do quiz), só dos mundos em que **os dois já ouviram os temas**, misturando os mundos. Cada um joga quando puder: quem desafia joga primeiro, e o colega só vê o placar depois de jogar. Uma chance por pergunta, com o certo e a explicação; termina com o placar de estrelas.
  - Cada um escolhe um **Sabimon parceiro**: cada acerto vira um golpe na batalha (aparece a força da carta). **Ninguém perde carta.** Quem **acerta mais vence**; a força da carta não muda o resultado (assim vence quem estudou). Empate é empate.
  - Prêmio: **4 XP e 4 Sabicoins por acerto** (máx. 40), só nos **3 primeiros duelos do dia**. Sem pacote (só o de nível novo, que vem pelo XP). Vitórias entram no ranking da semana (aba "Duelos"). Erros vão para a Revisão do Ará.
  - Limites: até 5 desafios esperando; 1 duelo por vez entre os mesmos dois; vence em 7 dias sem jogar. O colega pode dizer "Agora não". Sem mensagem nenhuma entre eles. O servidor corrige as respostas e decide quem venceu.
- Pergunta de conta (ex.: "Quanto é 6 × 15?") antes da área dos adultos.
- **Entrar na conta em outro aparelho**: código da turma (o aparelho lembra o último usado) → a criança toca no próprio nome na lista da turma → PIN. Não precisa decorar o apelido. A lista (apelido + cor) só aparece para quem tem o código, igual ao ranking.
- 5 PINs errados bloqueiam 15 minutos.
- Botão "Apagar minha conta"; política de privacidade em `#/privacidade`.
- **Da criança só guardamos**: apelido, cor, PIN embaralhado e o progresso do jogo.

## 4. Os 20 Sabimons

| Nº | Bicho real | Tipo | Raridade | Forma 1 → 2 → 3 |
|---|---|---|---|---|
| 1 | capivara | Fogo | comum | Brasinho → Brasão → Fornalhuda |
| 2 | boto-cor-de-rosa | Água | comum | Pingoró → Botorrão → Marabotão |
| 3 | tatu-bola | Planta | comum | Sementú → Tatuflora → Matatu |
| 4 | vaga-lume | Raio | comum | Zapinho → Faiscaluz → Trovalume |
| 5 | jabuti | Pedra | rara | Pedrolho → Cristabuti → Montabuti |
| 6 | beija-flor | Vento | rara | Ventilu → Rajadinho → Furacolibri |
| 7 | maria-farinha → guaiamum | Areia | rara | Arenito → Dunasiri → Tempestasiri |
| 8 | bicho-preguiça | Gelo | épica | Nevim → Friozão → Glaciaré |
| 9 | uirapuru | Som | épica | Cantaru → Melodiru → Sinfonuru |
| 10 | tamanduá-bandeira | Estrela | lendária | Estrelim → Constelão → Galaxiá |
| 11 | peixe-boi | Água | comum | Bolhudo → Bolhão → Maremanso |
| 12 | perereca | Planta | comum | Folhapé → Saltifolha → Pereflora |
| 13 | tucano | Vento | comum | Tucanuvem → Bicorrente → Tucaventania |
| 14 | tartaruga-marinha | Areia | comum | Areiruga → Conchaduna → Tartamaré |
| 15 | poraquê | Raio | rara | Faiscaraqué → Voltaraqué → Trovaraqué |
| 16 | lobo-guará | Fogo | rara | Guarabrasa → Juballama → Guaravulcão |
| 17 | anta | Pedra | rara | Antarocha → Pedranta → Montanta |
| 18 | pinguim-de-magalhães | Gelo | épica | Geladim → Pinguigelo → Glaciguim |
| 19 | bugio | Som | épica | Bugiurro → Ecobugio → Bugitroante |
| 20 | onça-pintada | Estrela | lendária | Oncelestre → Onçastral → Constelonça |

Total: 8 comuns, 6 raras, 4 épicas, 2 lendárias. Os 60 desenhos estão prontos (`public/sabimons/`). Os fatos de cada bicho foram conferidos na revisão de 04/11/2026 e estão corretos.
Guia de arte: `docs/ARTE-SABIMONS.md`.

## 5. Ideias que já foram testadas e trocadas (não repetir sem motivo)

| O que era | Virou | Quando |
|---|---|---|
| Cartas de cada capítulo (ids `h-...`) | Sabimons (quem tinha ganhou pacotes no lugar) | 04/11/2026 |
| Pacote com 3 cartas | Pacote com **1 Sabimon** | 04/11/2026 |
| Álbum contando 30 formas; evolução que mudava a mesma carta | **Álbum de 60**, cada forma é uma carta; 3→1 e 2→1 | 04/11/2026 |
| Medalhas, escudo e raio na lojinha | Itens do Brasil com fato real (frutas, folhas, cristais) | 04/11/2026 |
| Jogar sem conta / sem turma | Só entra com turma ou conta | 04/11/2026 |
| Tentar de novo no mesmo item até acertar | Uma chance por item, o certo aparece | 04/11/2026 |
| Pacote sem pedir nota | Pacote só com nota 7 ou mais | 04/11/2026 |
| Botão "Já li este tema" com áudio | Precisa ouvir o áudio | 04/11/2026 |
| Nenhum chat entre crianças (só propostas de troca) | Chat da turma supervisionado, desligado no começo | 04/11/2026 |
| Duelo valendo cartas (quem perde entrega carta) | **Duelo do Saber** sem aposta: ninguém perde carta, vence quem acerta mais. Motivos: pacote/carta só vem do estudo, briga e choro na turma, e as lojas e o ECA Digital olham aposta para criança como jogo de azar | 05/11/2026 |
| Voz única (Kokoro) | 3 vozes ElevenLabs: Nina, Otto, Graziella | 04/11/2026 |
| Logo de texto simples | Letras-figurinha coloridas | 04/11/2026 |
| Visual com roxo | Álbum de figurinhas (papel + contorno escuro) | 04/11/2026 |

## 6. Pontos em aberto e decisões da revisão

Decididos pelo Lucas em 04/11/2026, depois da revisão geral:

1. **Álbum difícil de completar: fica como está por enquanto.** Conta feita: uns 58 pacotes (~4 capítulos) para ter os 20 bichos e uns 440 pacotes (~30 capítulos, contando ~14 pacotes por capítulo) para as 60 figurinhas sem trocar. Se ficar difícil demais, as opções já simuladas são:
   - **"Garantia de progresso"** (quando já tem os 20, a garantia dá o bicho que mais falta): cai para ~280 pacotes. Não mexe na regra 3→1 e 2→1.
   - Épica e lendária com 2 cartas para a forma 2: ~390 pacotes. Juntando as duas ideias: ~255.
2. **Lendária é a mais forte em tudo** (força base 40, épica 30; mais Vida também) e tem **brilho**: estrela-figurinha amarela no canto e reflexo dourado parado em cima do desenho (o reflexo só passa uma vez no momento do prêmio).
3. Frase de 22 palavras no tema "Os griôs" (cap. 9): **fica como está** (o áudio já fala esse texto).
4. Segurança:
   - XP de dois aparelhos sem internet (fica o maior, não a soma): **fica como está**.
   - Cartas inventadas: **feita a proteção pequena** (o servidor só aceita 1 carta nova por pacote novo aberto). A proteção completa está na lista abaixo.

Ainda pendente: `sabidex.com` não está ligado na Cloudflare; Ciências e Geografia só "Em breve".

### Antes de publicar nas lojas (ou ter muitas escolas)
- [ ] **Abrir os pacotes no servidor** (não no aparelho). Assim ninguém consegue inventar cartas. Abrir pacote passa a precisar de internet.
- [ ] Ligar `sabidex.com` na Cloudflare.

## 7. Registro de mudanças

Escreva aqui cada mudança nova (data, o que mudou, quem decidiu).

- **05/11/2026** · **Pacote de boas-vindas** para toda conta nova de criança (carta na sorte), para ela entender o jogo logo de cara. Muda a regra "pacotes só vêm do estudo": essa é a única exceção. Quem não tem carta continua sem poder duelar (com uma lição já ganha pacote) (Lucas).
- **05/11/2026** · "Continuar com o Google" ligado para os pais: projeto Sabidex no Google Cloud, ID do cliente em `wrangler.jsonc` (só vale em sabidex.com.br e www) (Lucas).
- **05/11/2026** · A aba "Trocas" do menu virou **"Turma"** (ícone de duas pessoas; título "Minha turma"), porque ali ficam trocas, duelos e conversa (Lucas).
- **05/11/2026** · Estrelas no mapa do mundo (melhor nota de cada fase e jogo extra) e **Duelo do Saber** entre colegas da turma, sem apostar cartas; aba "Duelos" no ranking. A ideia de duelar valendo cartas foi trocada por essa (ver seção 5). Política de privacidade cita os duelos (versão `2026-11-duelo`: os adultos aceitam de novo ao entrar) (Lucas).
- **05/11/2026** · Nova entrada: primeira tela "Sou criança / Sou adulto", código da família para a criança entrar sozinha no aparelho dela, uma caixa só para o código (turma ou família) e "Ainda não tenho código" com recado para o adulto. Ideia vinda da análise da entrada do Baobab, sem copiar o visual nem o número de propaganda (Lucas).
- **05/11/2026** · Regra das cores corrigida: o roxo pode ser usado; a regra é só não ficar uma cópia do Baobab (Lucas).

- **05/11/2026** · Pingoró (boto, forma 1): o recorte tirou o clarão branco em volta da barriga e da bolha d'água (`TIRAR_BRILHO` em `scripts/recortar-sabimons.py`) e fechou a fresta entre a nadadeira de cima e as costas, que fazia a nadadeira parecer solta (Lucas).

- **04/11/2026** · "Entrar na minha conta" ficou mais fácil: o aparelho lembra o código da turma e a criança toca no nome dela numa lista, em vez de digitar o apelido; depois só o PIN (Lucas).

- **04/11/2026** · Chat da turma supervisionado, "Estudando agora" e vários administradores por turma (Lucas).

- **04/11/2026** · Lendárias mais fortes (força base 40) e com brilho (Lucas). Proteção contra cartas inventadas: o servidor só aceita 1 carta nova por pacote aberto; de quebra, cartas mandadas duas vezes (internet caiu no meio) não contam em dobro. Quem jogava sem conta e evoluiu no aparelho não perde mais a forma 2/3 ao entrar numa turma ou família.

- **04/11/2026** · Revisão geral: textos antigos da lojinha corrigidos ("Medalhas, escudos" → "Frutas, cristais e molduras"; "Cada Sabimon tem 3 espaços" → "Cada carta"); evolução no servidor agora acontece de uma vez só (nunca some carta sem evoluir); sincronizar ao mesmo tempo que evolui não "devolve" mais as Sabicoins da evolução; fotos de teste soltas na pasta principal foram apagadas; este caderno foi criado.
- **04/11/2026** · Álbum de 60 figurinhas, evolução 3→1 e 2→1, verso novo das cartas, logo novo e ícone novo (Lucas).
- **04/11/2026** · Jogos com uma chance por item, placar igual em todos, data da prova da escola.
- **04/11/2026** · Pacote 3D de rasgar com o dedo; erros tiram XP; pacote só com nota 7; entrada só com turma ou conta.
- **04/11/2026** · Conta da família, Google/Apple, esqueci a senha, política de privacidade; Sabimons 11 a 20; Ará 3D.
- **04/11/2026** · Sabimons no lugar das cartas antigas; Sabicoins, lojinha e evolução; cenários das cartas; Revisão do Ará; jogos extras; 3 vozes.
