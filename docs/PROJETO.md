# Caderno do projeto Sabidex

Este é o resumo de **tudo o que já existe e já foi decidido** no Sabidex.
O Claude lê este arquivo no começo de cada conversa (está pedido no `CLAUDE.md`).

**Para que serve:**
- Quando o Lucas der uma ideia nova, o Claude confere aqui antes e avisa: "isso já existe", "isso já foi testado e trocado por X" ou "isso vai contra a regra Y".
- Ao terminar qualquer mudança, o Claude atualiza este caderno (o que mudou, a data e quem decidiu).

Última revisão geral: **04/11/2026**. Última mudança: **06/11/2026** (duelo: escolher matéria, unidade e jogo; "Contra o relógio"; revanche).

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
| **Menu de baixo** | Cada aba com desenho colorido de contorno escuro; a aba aberta vira adesivo colado (torto, com sombra); nomes na Lilita One (Lucas, 05/11/2026) | `src/components/Nav.tsx` |
| **Animação** | Só em momento de prêmio. Respeita "reduzir movimento" do celular. Exceção (Lucas, 05/11/2026): **pulinho com anel amarelo** a cada ~2,4 s só no botãozinho amarelo do próximo passo de estudo (1 por tela, some quando faz, nunca dentro dos jogos) | `.chamar`, `.selo-agora` em `src/styles.css`; detalhes em `design-system/sabidex/MASTER.md` |

## 3. O que já existe (confira aqui antes de criar algo "novo")

### Estudo
- **Unidades** = capítulos do livro (Lucas, 06/11/2026: na tela é sempre **"Unidade"**, em todas as matérias, como no livro de Matemática; antes era "Mundo". No código e nos endereços continua `mundo`/`mundos`). Hoje: **História cap. 9** ("Um continente chamado África") e **cap. 10** ("Terra à vista!") e **Matemática unidades 8** ("Venda de produtos e números em representação decimal"), **9** ("O preparo de alimentos e o pensamento algébrico") **e 10** ("Os construtores e os números fracionários"). Ciências e Geografia aparecem como "Em breve".
- **Matérias por turma** (Lucas, 05/11/2026; `conteudos` em `src/data/index.ts`, coluna `turmas.conteudo`): cada turma estuda o livro dela. Hoje só existe o conteúdo **Educativa · 4º ano B** (os 5 mundos acima). Só o **dono do app** escolhe as matérias de cada turma, no Painel do dono → aba **Turmas**; turma nova nasce **sem matérias**. Na troca de versão, as turmas que já existiam com "Educativa" no nome ou na escola ficaram com o livro da Educativa; as outras ficaram sem matérias. A área dos adultos mostra "Matérias da turma" e as datas de prova só dos capítulos da turma.
- **Sem turma não tem jogo** (Lucas, 05/11/2026): criança só na família, quem jogava sem conta e quem está numa turma sem matérias não vê mundos, fases, missões, revisão nem "Jogar": aparece o aviso "Entre na sua turma da escola para jogar" (com "Entrar na minha turma") ou "As matérias da turma ainda estão chegando". Álbum, lojinha e pacotes continuam. O progresso antigo não some: se voltar para uma turma com o mesmo livro, está tudo lá.
- **Matérias no Início** (05/11/2026): um botão para cada matéria da turma; tocar abre só os mundos dela (`#/mundos/<matéria>`). Nas narrações, os sinais de conta (×, ÷, +, −, =) viram palavras (`scripts/vozes.ts`).
- **Matemática se estuda fazendo** (Lucas, 05/11/2026; `src/lib/contas.ts`, `src/screens/Contas.tsx`, regras em `docs/ESTUDOS.md`): o mapa tem as mesmas 5 fases (estrelas, nota 7, pacotes), mas por dentro são **Ver como se faz** (exemplo resolvido passo a passo + "Agora você"; o botão "Próximo passo" só libera depois de um tempo para ler, ~0,4 s por palavra, de 2 a 7 s, e mostra "Leia o passo…" enquanto espera: `tempoDeLeitura` em `src/lib/contas.ts`; cada passo também é narrado, **só com Nina e Otto** para gastar menos créditos do ElevenLabs, quem usa a Graziella ouve a Nina; a criança escolhe Nina ou Otto ali mesmo, e o botão só libera quando o áudio termina; se o áudio não carregar, vale só o tempo: `src/lib/falaMat.ts`), **Treino de contas** (10), **Balança e sequências** (balança desenhada, setas de ida e volta, múltiplos), **Quiz relâmpago** e **Prova da unidade** (10 contas, correção no fim). A criança **digita a resposta** num teclado de números, e **os números mudam a cada partida**. O livro é a base, mas pode ter outras contas e exemplos do mesmo nível e método. Contas erradas voltam na Revisão do Ará com números novos. O Duelo usa o quiz e a prova de múltipla escolha do capítulo.
  - **Papel e lápis** (Lucas, 05/11/2026): no começo de cada fase de Matemática o Ará pede papel e lápis ("Já peguei!"; no quiz, uma linha no balão). Nas contas mais difíceis aparece "Dica: faça a conta no papel". Sem rascunho na tela.
  - **Números com vírgula** (unidade 8): quando a resposta tem vírgula, o teclado ganha a tecla **","** e o OK vai para uma linha inteira. Vale 12,5 ou 12,50. Dinheiro aparece como "R$ 12,50". Desenhos novos: **moedas e cédulas** (desenho simples, não é foto) e **quadrado de 100 quadradinhos** (centésimos). Na 8 a fase 3 se chama "Retas e preços".
  - **Frações** (unidade 10): a criança digita a fração em **duas caixas** (numerador em cima, denominador embaixo). Vale outra escrita do mesmo valor (2/4 = 1/2), menos quando a pergunta é "escreva com números". Desenhos novos: **cano dividido** e **reta numérica do 0 ao 1**. Cada unidade pode dar outro nome à fase 3 (na 10: "Retas e partes").
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
- **Meu dia** (Lucas, 05/11/2026; `src/lib/missoes.ts`, `src/screens/MeuDia.tsx`): tocar nos dias seguidos do início (ou no cartão "Missões do dia") abre a tela.
  - **Sequência de dias**: pode faltar **1 dia por semana** sem perder (regra de `docs/ESTUDOS.md`; a folga não conta como dia estudado). Antes, faltar 1 dia zerava.
  - **Missões do dia**: 3 missões curtas de estudo, escolhidas pelo dia (iguais o dia todo, trocam no outro dia), só entre as que a criança já consegue fazer. A Revisão do Ará entra sempre que tiver. Cada jogo vale para **uma** missão e só conta com **nota 7 ou mais**. Fazer as 3 dá **1 pacote**. Depois, o Ará diz para descansar e voltar amanhã. Ficam só no aparelho.
  - **Marcos de sequência**: 3, 7, 14 e 30 dias seguidos dão **1 pacote** cada (uma vez por sequência), na primeira atividade do dia com nota 7. Duelos não contam para missões nem marcos.
- **Data da prova da escola**: o professor (turma) ou o adulto (família) marca. Depois da data o capítulo vai para "Já teve prova na escola" (continua valendo tudo).
- **Ordem das unidades** (Lucas, 06/11/2026; `ordenarCapitulos` em `src/lib/provas.ts`): sempre a ordem do livro (8, 9, 10); a data da prova só aparece no selo. O "Próxima fase"/"Continuar" termina primeiro a unidade que a criança está jogando e só depois vai para a próxima (`proximaFase` em `src/screens/Inicio.tsx`).
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
| Pacotes (só do estudo) | memória e quiz (1ª vez com nota 7), prova aprovada (pacote **épico**), terminar os 4 extras com nota 7 em cada, 1ª atividade do dia com nota 7, as 3 missões do dia, marcos de 3/7/14/30 dias seguidos, cada nível novo | `src/lib/jogo.ts` |
| **Pacote de boas-vindas** (única exceção à regra acima; Lucas, 05/11/2026) | toda conta nova de criança (família ou turma) já nasce com 1 pacote normal; a carta sai na sorte. O Ará apresenta na tela inicial e, depois de abrir, explica que os próximos vêm do estudo. Quem já tinha conta não ganha | `src/shared/sync.ts` (`comBoasVindas`) |
| Pacote | **1 Sabimon** (sempre a forma 1). Chances: comum 62%, rara 26%, épica 9%, lendária 3%. Épico: 80% épica, 20% lendária | |
| Garantia | depois de 9 pacotes sem bicho novo, o 10º traz um que a criança não tem | |
| **Quem sorteia** (05/11/2026) | Criança com conta: **o servidor** sorteia a carta e guarda tudo de uma vez. Precisa de internet (sem internet o pacote volta inteiro, com aviso). Se a internet cair no meio, a criança recebe a mesma carta de novo. Limites: 60 pacotes por dia; pacote épico só com a prova do capítulo feita e no máximo 1 por capítulo (senão abre como normal). Quem joga sem conta (antigos) ainda abre no aparelho | `src/shared/pacotes.ts`, `/api/crianca/abrir-pacote` |
| **Nunca** | vender pacote (nem por moeda do jogo, nem por dinheiro), desconto ou pressão de tempo | |

### Cartas e álbum
- **Álbum de 60 figurinhas**: 20 Sabimons × 3 formas. Número no álbum = (nº do Sabimon − 1) × 3 + forma. Ids: `s001`, `s001-2`, `s001-3`.
- **Evolução** (Lucas, 04/11/2026): **3 cartas da forma 1 → 1 da forma 2** (+100 Sabicoins); **2 da forma 2 → 1 da forma 3** (+300 Sabicoins). As cartas usadas somem. Na turma, a evolução é feita pelo servidor.
- Vida e força da carta: calculadas em `src/lib/sabimon.ts` (pela raridade e pela forma). Forma 1: comum Vida 50, força 10/20 · rara 60, 20/30 · épica 70, 30/40 · **lendária 90, 40/50**. Forma 2: +30 Vida, força ×1,7. Forma 3: +70 Vida, força ×2,6.
- **Lendária tem brilho**: estrela-figurinha amarela no canto da moldura e reflexo dourado em cima do desenho.
- Carta com itens da lojinha não sai em troca nem na evolução (só as cópias repetidas).
- Ao sair de uma figurinha (botão "Álbum" ou voltar do celular), o álbum volta **na figurinha que a criança abriu**, não no topo (Lucas, 06/11/2026).

### Lojinha
- Itens com raridade e um **fato real do Brasil**. Vitrine atual: Caju (100), Folha de vitória-régia +20 Vida (150), Fruto de guaraná +10 força (150), Ouriço de castanha +35 Vida (350), Flor de ipê-amarelo +20 força (350), Cristal de ametista (400), Escama de pirarucu +50 Vida (700), Moldura de ouro (700), Brilho holográfico (1500).
- Itens de Vida/força/enfeite vão para a **faixa de 3 espaços** embaixo da carta. Moldura de ouro e brilho holográfico mudam a carta e não ocupam espaço.
- **Coroa do álbum**: não se compra, ganha 1 por mundo completo.
- **Destaque do dia** (sem desconto) e **"Meu desejo"** (a criança marca o item que quer juntar moedas).
- Itens antigos que saíram da vitrine mas continuam valendo: Medalha de prata, Escudo, Raio de força, Medalha de ouro, Duas estrelas de ouro.

### Contas, turma e família
- **Não existe jogar sem conta** (desde 04/11/2026). **Primeira tela** (Lucas, 05/11/2026): "Oi! Quem está aí?" com duas figurinhas grandes, **Sou criança** e **Sou adulto** (tocou, já segue). Se o aparelho já tem perfis da família, eles aparecem antes.
- **Entrada da criança** (Lucas, 05/11/2026): uma caixa só, "Qual é o seu código?", que aceita o código da **turma** ou o da **família**. Depois toca no nome e digita o PIN. "Ainda não tenho código" (ou "Ainda não tenho perfil", depois do código da turma) manda um recado pronto para um adulto (WhatsApp etc.), sem número de propaganda.
- **Código da família** (Lucas, 05/11/2026): cada família tem um código no mesmo formato da turma (ex.: TREM-7656), nunca igual ao de uma turma. Aparece na área dos adultos com "Enviar para meu filho" e "Trocar código". Quem tem o código vê só os apelidos e cores dos filhos; para entrar precisa do PIN.
- **Só o responsável cria a conta da criança** (Lucas, 05/11/2026): a criança não cria mais conta sozinha com o código da turma (saiu o "Sou novo na turma"). Motivo: conta criada pela criança ficava sem responsável, então ninguém podia autorizar o chat, e quando o pai já tinha criado o perfil nascia uma **segunda conta** (aconteceu com o Tony). Em "Adicionar criança" o adulto pode pôr o **código da turma**, e o filho já nasce na turma; se o apelido já existe lá, o app manda usar "Já tem conta na turma". Quem chega só com o código da turma vê "Ainda não tenho perfil", que manda um recado pronto para o adulto com o código. **Apelido nunca se repete na mesma turma** (Lucas, 05/11/2026): ao criar o filho com o código, ao pedir a turma e quando o administrador (ou o dono do app) aceita, o app avisa "Já tem alguém chamado X nessa turma" e o responsável escolhe outro em **"Trocar apelido"** (novo botão no perfil do filho). Antes, o pedido aceito virava "Ana 2" sozinho; isso agora só acontece ao juntar duas turmas inteiras. Sobrenome não entra: a regra de segurança é nunca pedir sobrenome da criança. As crianças que já eram só da turma continuam entrando normalmente; para ter chat, o responsável liga a conta em "Já tem conta na turma". Arquivos: `src/screens/Turma.tsx` (`EntrarTurma`, `PecaParaAdulto`), `/adulto/familia` em `src/worker/index.ts`.
- **Conta da família**: o adulto (e-mail + senha, ou Google, ligado em 05/11/2026; Apple quando ligado) cria os perfis dos filhos (apelido + cor + PIN de 4 números). Até 6 filhos.
- **Turma**: o professor cria e recebe um código fácil (ex.: ARARA-4821). Até 60 crianças por turma; até 20 turmas por adulto.
- **Aba "Turma"** (no menu de baixo; antes se chamava "Trocas", Lucas trocou em 05/11/2026): junta as trocas, o Duelo do Saber e a conversa da turma.
- **Trocas**: só propostas de carta por carta, com colegas da mesma turma. Até 5 propostas esperando.
- **Chat da turma supervisionado** (Lucas, 04/11/2026): um grupo único da turma da escola, sem mensagem privada nem gente de fora. **Vem ligado** (Lucas, 05/11/2026): turma nova já nasce com o chat aberto (padrão 7h–21h) e filho novo já vem liberado (só se o e-mail do responsável já estiver confirmado; senão ele liga depois de confirmar). O responsável vê isso ao criar ou ligar o perfil do filho (caixinha marcada "Deixar usar o chat da turma") e pode desligar ali ou depois na área dos adultos; um administrador da turma pode desligar para a turma toda e mudar o horário. Criança sem conta da família não escreve. Turmas e filhos que já existiam também foram ligados, uma vez só (ajuste `chat-ligado-para-todos-2026-11-05` em `src/worker/esquema.ts`, que nunca roda de novo). Pais e professor leem tudo, e a criança é avisada disso. Bloqueia palavrões, telefones, endereços, links, e-mails e redes sociais; sem foto nem áudio; até 200 letras e 5 mensagens a cada 30 segundos. Botão "Avisar um adulto"; administradores apagam mensagens e pausam um aluno. As mensagens somem em 60 dias. Também tem **"Estudando agora"** (só para a turma; adultos podem desligar). Arquivos: `src/shared/chat.ts`, `src/screens/Chat.tsx`.
- **Pais veem a turma do filho** (Lucas, 05/11/2026; `GET /api/adulto/familia/:id/turma`, `PlacarDaTurma` em `src/screens/Adulto.tsx`): no cartão de cada filho que está numa turma, a parte "Turma ‹nome›" tem dois botões bem à vista: **"Ver a turma"** (o mesmo placar da semana que a criança vê: Mais XP, Mais cartas, Duelos, quem está estudando agora; o filho aparece em azul) e **"Ver o chat da turma"** (antes o botão do chat ficava escondido no fim do cartão). Só leitura. Notas por fase ainda não aparecem para os pais.
- **Procurar turma e pedir para entrar** (Lucas, 05/11/2026; `src/shared/pedidos.ts`, tabela `pedidos_turma`): para não nascerem turmas repetidas da mesma sala. **Só adultos buscam**, na área dos adultos, pelo nome da turma ou da escola (pelo menos 3 letras, até 10 resultados). A busca mostra só nome, escola, quantas crianças e o primeiro nome de quem criou, **nunca os apelidos**. Toda turma aparece, e o administrador pode tirar da busca. No perfil do filho, "Procurar a turma da escola" / "Trocar de turma" → pedir → **um administrador da turma aceita ou recusa** (vê o primeiro nome do responsável e o apelido, a cor e o XP da criança). Quem administra a turma coloca o filho na hora. A criança leva **tudo** (cartas, XP, Sabicoins); trocas e duelos esperando são cancelados; apelido repetido ganha um número ("Ana 2"). Até 5 pedidos esperando por adulto.
- **Meu perfil** (Lucas, 05/11/2026; antes "Minha conta"; `src/screens/Turma.tsx` `MinhaConta`, `src/lib/conquistas.ts`, `src/components/Medalha.tsx`): tocar no nome no Início abre o perfil da criança: nível e barra de XP, números (XP, Sabicoins, dias seguidos e recorde, figurinhas X/60, estrelas, mundos completos) e **16 conquistas** (primeira fase, 10 fases, mundo completo, 3 mundos, nota 10, 30 estrelas, 5 e 20 Sabimons, forma 2, forma 3, lendária, 7 e 30 dias seguidos, 20 dias estudados, nível 5 e 10). Tocar numa conquista mostra como ganhar e quanto falta. **Conquistas não dão pacote, XP nem Sabicoins** (pacotes só vêm do estudo); são calculadas com o que o jogo já guarda, então quem já jogava ganha na hora. Turma, "Mudar de turma", código para outro aparelho (fechado num "abrir e fechar") e "Sair" ficaram embaixo.
- **Mudar de turma pela criança** (Lucas, 05/11/2026): em "Minha conta", a criança que já está numa turma toca em "Mudar de turma" e digita o código novo; leva todas as cartas, o XP e as Sabicoins. Antes não existia esse botão: para usar outro código, a criança saía da conta e tocava em "Sou novo na turma", o que criava **outra conta vazia** (aconteceu com o Anthony; a conta antiga, com as cartas, continua na turma antiga). Agora "Sou novo na turma" avisa para não criar outra conta.
- **Campo "Escola" na turma** (Lucas, 05/11/2026): pedido ao criar; turmas antigas preenchem em "Escola e busca". Ao criar, o app mostra turmas parecidas que já existem.
- **Apagar turma** (Lucas, 05/11/2026; `POST /api/adulto/turmas/:id/apagar`): botão "Apagar esta turma" no fim da tela da turma, **só para o dono do app** (quem criou a turma não vê: não dá para desfazer e alguém podia apagar sem querer; Lucas). Para confirmar, escreve o nome da turma. As crianças com conta da família saem com tudo (cartas, XP, Sabicoins) e ficam sem jogo até entrar noutra turma. Se tiver criança **sem responsável**, não apaga: antes muda ela de turma (Painel do dono) ou "Remover". Somem o código, a conversa, as datas de prova, os administradores, os convites e as trocas, duelos e pedidos que esperavam. Não dá para desfazer.
- **Juntar turmas repetidas** (Lucas, 05/11/2026): quem **criou** a turma repetida pede para juntar com outra; um administrador de lá aprova. Todas as crianças passam com tudo (inclusive as sem conta da família); a turma repetida some (código, conversa, datas de prova e administradores dela). Quem administrava a repetida não vira administrador da outra.
- **Painel do dono do app** (Lucas, 05/11/2026; `GET /api/adulto/dono`, tela `#/adulto/dono` em `src/screens/Adulto.tsx`): só para os e-mails em `ADMIN_EMAILS` (`wrangler.jsonc`). Mostra quantas crianças usaram hoje e nos 7 dias, quantas estão só na família (sem turma), adultos e turmas; listas de crianças (quando usou, turma ou "sem turma", responsável) e de adultos (quando entrou, filhos, turmas), com filtro Hoje/Ontem/7/30 dias; e todos os pedidos para entrar em turma, com Aceitar/Recusar. **Colocar numa turma / Mudar de turma** (Lucas, 05/11/2026): o dono do app põe qualquer criança numa turma direto, **sem o pedido do responsável** (`POST /api/adulto/dono/criancas/:id/turma`); ela leva cartas, XP e Sabicoins, e trocas, duelos e pedidos que esperavam são cancelados. Respeita o limite de 60 por turma. Nunca mostra PIN nem senha. A "última entrada" do adulto fica em `adultos.visto` (vale a partir de hoje; antes disso, só para quem ainda não tinha saído da conta). Quem joga sem conta só no aparelho não aparece. O filtro de dias olha **todos os dias em que a pessoa usou** (tabela `uso_dias`), não só a última vez: quem usou ontem e hoje aparece em "Ontem" e em "Hoje". Para os dias antes dessa tabela, conta os dias de estudo da criança e o dia em que a conta foi criada. Aba **"Como usam"** (Lucas, 05/11/2026; `GET /api/adulto/dono/uso`, cálculo em `src/shared/uso.ts`): só números somados de todas as crianças com conta, sem dizer quem é quem e sem coletar nada novo. Mostra quantas estudaram e voltaram outro dia, quantas usaram cada parte do app (lojinha, evolução, troca, duelo, chat, pacote fechado esperando) e, por capítulo, quantas terminaram cada fase, a nota média (melhor vez) e quantas ficaram abaixo de 7, com vermelho onde menos da metade terminou ou a média está abaixo de 7.
- **Vários administradores na turma**: o dono convida outros adultos com um código `ADM-XXXX-XXXX` (vale 7 dias, uma vez só). Só o dono convida ou remove administradores. Se o dono apagar a conta, a turma passa para o administrador mais antigo.
- **Ranking da semana** (XP, cartas e vitórias nos duelos), zera toda segunda. Bolinha verde no avatar de quem está estudando agora. Abre na hora com o último placar guardado e atualiza sozinho.
- **"Estudando agora" na aba Turma** (Lucas, 05/11/2026): um quadro em "Minha turma" mostra os colegas com o app aberto nos últimos 2 minutos (bolinha verde), sem precisar do chat ligado. Também aparece no ranking e na escolha de colega para troca e duelo. Professor (turma) e responsável (filho) continuam podendo desligar.
- **Duelo do Saber** (Lucas, 05/11/2026; `src/shared/duelo.ts`, `src/screens/Duelo.tsx`, tabela `duelos`): na aba Turma → "Duelo do Saber", a criança desafia um colega **da mesma turma**. Os dois respondem as **mesmas perguntas**, só das unidades em que **os dois já fizeram a 1ª fase**. Cada um joga quando puder: quem desafia joga primeiro, e o colega só vê o placar depois de jogar. Uma chance por pergunta, com o certo e a explicação.
  - **Escolher o que vai cair** (Lucas, 06/11/2026): o desafio tem 3 passos: colega → **"O que vai cair?"** → Sabimon. No passo 2 a criança escolhe a **matéria** (só as que os dois estudaram; se só tem uma, já vem marcada), a **unidade** ("Todas que vocês estudaram" ou uma só) e o **jogo**. O convite, a lista e o jogo mostram tudo junto (ex.: "Matemática · Unidade 9 · Contra o relógio"). Não existe "misturar matérias" (duelos antigos, que misturavam, aparecem como "Várias matérias"). Colunas `modo`, `materia` e `mundo` na tabela `duelos`; o servidor manda as unidades em comum em `GET /api/crianca/duelos/opcoes`.
  - **Dois jogos** (Lucas, 06/11/2026; outros, como memória e linha do tempo, ficaram para depois): **Perguntas** (10 perguntas: 6 de escolher da prova + 4 de verdadeiro ou falso do quiz; termina com o placar de estrelas) e **Contra o relógio** (60 segundos em História, 90 em Matemática, para acertar o máximo; até 30 perguntas e, se acabarem, o jogo termina). O relógio só começa no "Começar!" e **para enquanto a criança lê a explicação**. Em História tocar na opção já responde; em **Matemática são contas digitadas** dos tipos do Treino da unidade, com **os mesmos números para os dois** (a conta é sorteada uma vez e guardada no duelo) e o aviso de papel e lápis. Vence quem acertar mais (empate é empate).
  - **Revanche!** (Lucas, 06/11/2026): no fim da batalha, o botão "Revanche!" cria um desafio novo com o mesmo colega, matéria, unidade e jogo; a criança só escolhe o Sabimon e joga primeiro.
  - Cada um escolhe um **Sabimon parceiro**: cada acerto vira um golpe na batalha (aparece a força da carta). **Ninguém perde carta.** Quem **acerta mais vence**; a força da carta não muda o resultado (assim vence quem estudou). Empate é empate.
  - Prêmio: **4 XP e 4 Sabicoins por acerto** (máx. 40, também no "Contra o relógio": o XP conta até 10 acertos, mas todos valem para vencer), só nos **3 primeiros duelos do dia**. Sem pacote (só o de nível novo, que vem pelo XP). Vitórias entram no ranking da semana (aba "Duelos"). Erros vão para a Revisão do Ará.
  - Limites: até 5 desafios esperando; 1 duelo por vez entre os mesmos dois; vence em 7 dias sem jogar. O colega pode dizer "Agora não". Sem mensagem nenhuma entre eles. O servidor corrige as respostas e decide quem venceu.
- Pergunta de conta rápida para adulto (ex.: "Quanto é 14 × 4?") antes da área dos adultos (exigência das lojas). Aparece **também quando o adulto já está logado** no aparelho (antes, nesse caso, a criança entrava direto). Vale até fechar o app.
- **Entrar na conta em outro aparelho**: código da turma (o aparelho lembra o último usado) → a criança toca no próprio nome na lista da turma → PIN. Não precisa decorar o apelido. A lista (apelido + cor) só aparece para quem tem o código, igual ao ranking.
- **E-mail do adulto confirmado** (Lucas, 05/11/2026): para uma criança não criar conta de adulto com e-mail inventado. Quem cria a conta com senha recebe um link por e-mail (vale 24 horas). Até abrir o link, pode cuidar dos filhos normalmente, mas **não cria turma, não liga o chat da turma e não libera o chat do filho** (desligar sempre pode). A área dos adultos mostra o aviso "Confirme seu e-mail" com "Mandar o e-mail de novo" (até 3 por hora). Google/Apple já vêm confirmados, e o link de "Esqueci minha senha" também confirma. Só funciona com o envio de e-mail ligado no servidor; sem ele, nada fica travado. Contas antigas com senha também precisam confirmar para essas 3 coisas (o que já está ligado continua ligado).
- 5 PINs errados bloqueiam 15 minutos.
- **30 códigos errados** (turma ou família) seguidos pela mesma internet bloqueiam 15 minutos (05/11/2026). Numa escola a turma toda divide a internet, por isso o número é alto.
- Botão "Apagar minha conta"; política de privacidade em `#/privacidade`. O adulto só aceita a política de novo quando a mudança é **importante** (dado novo guardado, alguém novo que pode ver, uso novo dos dados); mudança pequena no texto só troca a data "Atualizada em" (Lucas, 05/11/2026).
- **Da criança só guardamos**: apelido, cor, PIN embaralhado e o progresso do jogo.
- **Aviso "Coloque o Sabidex na tela do celular"** (Lucas, 05/11/2026; `src/components/InstalarApp.tsx`): aparece na primeira tela e no Início quando o site está aberto no navegador do celular. "Como fazer?" mostra o passo a passo do **iPhone/iPad** (Safari → Compartilhar → Adicionar à Tela de Início) ou do **Android** (Chrome → ⋮ → Adicionar à tela inicial). No Android, quando o Chrome deixa, aparece o botão **Instalar agora**. Some quando o app já foi aberto pelo ícone e no computador; "Agora não" esconde por 7 dias.

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
| Criança só da família jogava todas as matérias | **Só joga dentro de uma turma**, e só as matérias da turma | 05/11/2026 |
| Tentar de novo no mesmo item até acertar | Uma chance por item, o certo aparece | 04/11/2026 |
| Pacote sem pedir nota | Pacote só com nota 7 ou mais | 04/11/2026 |
| Botão "Já li este tema" com áudio | Precisa ouvir o áudio | 04/11/2026 |
| Nenhum chat entre crianças (só propostas de troca) | Chat da turma supervisionado, desligado no começo | 04/11/2026 |
| Brilho dourado passando pelo cartão inteiro | Pulinho com anel amarelo só no botãozinho amarelo | 05/11/2026 |
| Chat desligado no começo (professor liga e responsável autoriza) | Chat vem ligado; o responsável vê o aviso ao criar o perfil e pode desligar; o professor pode desligar a turma | 05/11/2026 |
| Matemática do jeito de História (ouvir temas, ligar palavras, escolher opções) | Ver como se faz + contas digitadas com números que mudam | 05/11/2026 |
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
   - Cartas inventadas: **resolvido** (05/11/2026): o servidor sorteia a carta do pacote. Versões antigas do app que ainda abrem no aparelho: o servidor ignora a carta que o aparelho escolheu e sorteia ele mesmo (só para pacote que ele já conhecia).
   - Ainda depende do aparelho: **ganhar** o pacote (o app diz que terminou a fase). Os limites acima seguram o abuso; corrigir as fases no servidor seria o próximo passo, se precisar.

Ainda pendente: `sabidex.com` não está ligado na Cloudflare; Ciências e Geografia só "Em breve"; Matemática só tem narração no "Ver como se faz", com Nina e Otto (06/11/2026).

### Antes de publicar nas lojas (ou ter muitas escolas)
- [x] **Abrir os pacotes no servidor** (feito em 05/11/2026).
- [x] **Limite de códigos errados** (feito em 05/11/2026).
- [ ] Ligar `sabidex.com` na Cloudflare.
- [ ] **App nas lojas** (sugestão do Claude, o Lucas ainda não respondeu): fazer uma "casca" de app (Capacitor) em volta do site, 2 a 4 semanas. Passos: testar no celular do Lucas antes de pagar loja → Google Play primeiro (US$ 25) → Apple depois (US$ 99 por ano, precisa de Mac ou serviço na internet). Na Apple, "Entrar com a Apple" passa a ser obrigatório (porque tem Google); dentro do app o Google precisa de um plugin próprio; o chat da turma é o que as lojas mais olham.
- [ ] Conferir se o envio de e-mail está ligado no servidor (`RESEND_API_KEY` + `EMAIL_REMETENTE` na Cloudflare e domínio verificado no resend.com). Sem isso, a trava do e-mail confirmado não vale. Jeito fácil de ver: se "Esqueci minha senha" aparece na tela do adulto, está ligado.

### Ideias e pendências das conversas (anotadas em 05/11/2026)
- **Botão "Apagar criança" no Painel do dono**: o Claude ofereceu (para casos como o "Tony 2", conta repetida com 0 XP); o Lucas não respondeu. Hoje só o responsável apaga uma criança da família.
- **Crianças para ajeitar** (não é regra, é tarefa): Gabriela (só da turma, sem responsável: não escreve no chat até o responsável ligar o perfil em "Já tem conta na turma"); GAH (do Gabriel, tem família mas está sem turma); Anthony (recuperar as cartas entrando na conta antiga e usando "Mudar de turma"); Tony 2 (apagar ou trocar o apelido; pela regra, conta antiga não ganha o pacote de boas-vindas).
- **Mensagem para o grupo de pais do 4º B**: o texto feito antes dizia que "a conversa da turma começa desligada". Isso mudou (o chat vem ligado); corrigir antes de mandar e trocar o [CÓDIGO DA TURMA] pelo código de verdade.
- **Parceria com o Poliedro** (ideia, sem decisão): o conteúdo do livro tem direito autoral, então para várias escolas a parceria seria obrigatória. Sugestão do Claude: provar primeiro numa escola e depois levar a proposta.
- **Logo na tela de Branding do Google** (ideia, para depois): o Google leva dias para conferir.
- **Ideias de segurança não escolhidas**: data de nascimento no cadastro do adulto (barrar menores de 18) e "PIN do adulto" no lugar da conta de multiplicar. O Lucas escolheu só o e-mail confirmado e a conta mais fácil.

## 7. Registro de mudanças

Escreva aqui cada mudança nova (data, o que mudou, quem decidiu).

- **06/11/2026** · **Duelo do Saber mais legal**: o Lucas não sabia o que caía no duelo (o app misturava todas as unidades dos dois, de todas as matérias). Agora quem desafia escolhe a **matéria**, a **unidade** e o **jogo**: "Perguntas" (o de antes) ou **"Contra o relógio"** (60 s em História, 90 s em Matemática com contas digitadas e os mesmos números para os dois). Botão **"Revanche!"** no fim da batalha. O botão "Misturado" (várias matérias no mesmo duelo), que o Claude sugeriu, ficou de fora por enquanto: o Lucas não entendeu para que servia e dá para pôr depois; memória e linha do tempo no duelo ficam para depois. Sem dado novo guardado (política de privacidade igual) (Lucas).

- **06/11/2026** · Álbum: ao abrir uma figurinha lá embaixo (ex.: bugio) e voltar, a tela voltava para o topo. Agora volta na figurinha que a criança abriu, pelo botão "Álbum" ou pelo voltar do celular (Lucas).
- **06/11/2026** · Unidades na ordem do livro: antes, unidade com prova marcada subia para o começo (aparecia 9, 8, 10) e o "Continuar" no fim de uma fase da unidade 8 pulava para a 9. Agora a lista segue 8, 9, 10 (as que já tiveram prova continuam no fim) e o "Continuar" termina a unidade que a criança está fazendo antes de ir para outra (Lucas).

- **05/11/2026** · Pais veem a turma do filho: botões "Ver a turma" (placar da semana e quem está estudando agora) e "Ver o chat da turma" no cartão do filho. O Lucas não achava o chat nem o ranking na área dos pais. Política de privacidade ganhou uma frase (sem pedir aceite de novo: os pais já liam o chat com os apelidos) (Lucas).

- **05/11/2026** · Caderno conferido com as conversas da nuvem: anotadas as ideias e pendências que não estavam aqui (app nas lojas, envio de e-mail, crianças para ajeitar, mensagem aos pais, Poliedro) na seção 6. Nada do app mudou (Lucas pediu a conferência).

- **05/11/2026** · Publicadas 3 mudanças que tinham ficado paradas (painel do dono com dias de uso e "Como usam", aceite da política só em mudança importante, chat vem ligado). O chat só vem ligado para o filho de um adulto com **e-mail já confirmado**, para manter a trava do e-mail; quem não confirmou liga depois de confirmar. A política pede aceite de novo por causa do chat ligado. O painel do dono ganhou espaço para as 5 abas no celular (Lucas).
- **05/11/2026** · Política de privacidade: o adulto só precisa aceitar de novo quando a mudança for importante, não a cada novidade do app (antes pediu 3 vezes em 2 dias) (Lucas).
- **05/11/2026** · **Painel do dono do app** na área dos adultos (pedido do Lucas, para ver quem jogou e não apareceu na turma): crianças e adultos que usaram o app, quem está sem turma e os pedidos esperando aprovação, com Aceitar/Recusar.
- **05/11/2026** · Painel do dono: botão **"Colocar numa turma"** / "Mudar de turma" em cada criança, sem precisar do pedido do responsável (decidido pelo Lucas, que sabe que isso pula a autorização do responsável; vale só para o dono do app, não para professores).
- **05/11/2026** · Painel do dono: "Ontem" mostrava ninguém, porque só guardava a última vez que cada um usou (quem voltou hoje sumia de ontem). Agora guarda cada dia de uso e mostra todos que usaram no dia (Lucas avisou).
- **05/11/2026** · Painel do dono: aba **"Como usam"**, com o que o servidor já guarda (fases terminadas, notas, partes do app usadas). Contador anônimo de cliques e desistências ficou para depois: precisa mudar a política de privacidade (Lucas escolheu fazer só esta parte por enquanto).
- **05/11/2026** · **Confirmar o e-mail do adulto** antes de criar turma, ligar o chat da turma ou liberar o chat do filho. Antes qualquer um (até uma criança) criava conta de adulto com um e-mail inventado e podia montar uma turma com chat sem adulto de verdade (Lucas).
- **05/11/2026** · Conta do portão dos adultos mais fácil (de 6–9 × 13–19 para 11–19 × 3–5) e agora pedida também com o adulto já logado no aparelho. Fica por causa das lojas; a tranca de verdade é a senha (Lucas).
- **05/11/2026** · **Chamar a atenção para o estudo**: brilho dourado passando a cada ~2 s no próximo passo (missões do dia no Início, primeira missão em Meu dia, mundo e fase "Agora", abrir pacotes no álbum), selos "Faça agora"/"Continue aqui", missões com bolinhas que enchem até o pacote, "!" nos dias seguidos quando ainda não estudou hoje e Lojinha depois do "Continuar". O Lucas pediu "piscando"; ficou o brilho (piscar distrai e é ruim para quem é sensível a luz). Muda a regra "telas paradas não se mexem" só para esse brilho (Lucas).
- **05/11/2026** · **Menu de baixo** com a cara do app: desenhos coloridos de contorno escuro em cada aba e a aba aberta como adesivo colado (Lucas).
- **05/11/2026** · "Minha conta" virou **Meu perfil**: nível, números e 16 conquistas (só figurinhas de honra, sem prêmio). O código da turma foi para baixo, porque a criança quer ver ela mesma (Lucas).
- **05/11/2026** · Botão **"Mudar de turma"** em Minha conta (a criança leva tudo) e aviso em "Sou novo na turma" para não criar uma conta vazia. O Lucas perdeu as cartas do Anthony assim: ele saiu da conta e criou outra na turma nova (Lucas).
- **05/11/2026** · **Busca de turmas e pedidos para entrar**: o adulto procura a turma pela escola e pede para o filho entrar; um administrador aprova. Campo "Escola" na turma, "aparecer na busca" (ligado, pode desligar) e **juntar turmas repetidas**. Trocar de turma nunca perdeu progresso (a conta é a mesma); o problema era não achar a turma certa. Política de privacidade ganhou a parte "Busca de turmas" (versão `2026-11-busca-turmas`: os adultos aceitam de novo) (Lucas).
- **05/11/2026** · Matemática: aviso de **papel e lápis** no começo de cada fase e dica "arme a conta no papel" nas contas mais difíceis. O Claude sugeriu não ter rascunho na tela (Lucas).

- **05/11/2026** · **Revisão geral de Matemática** (pedida pelo Lucas): conferidas as contas de todos os tipos (português e tamanho dos números), o código (skill de revisão) e as telas em celulares pequenos (skill de UX). Corrigido: concordância ("quantas tortas", "1 quebraram"), prédios com até 30 andares; resposta e teclado presos embaixo da tela (o OK aparecia fora da tela em celulares pequenos); "Ver como se faz" passou a descontar XP pelos erros e o pacote do dia pede nota 7; no quiz, quando o tempo acaba, as perguntas sem resposta contam como erro (antes, esperar o relógio dava XP cheio, em todas as matérias); Revisão do Ará só dá o pacote do dia com nota 7; frações "em pé" também no quiz, na revisão e no duelo; a tecla Tab não fica mais presa na fração. O Lucas deixou o Claude decidir o resto: o pacote dos 4 jogos extras agora pede nota 7 em cada um (se não, espera até a criança jogar de novo e passar), e as pílulas de moedas e dias seguidos do Início ganharam área de toque de 44px sem mudar o desenho (Claude).

- **06/11/2026** · Matemática, **Ver como se faz**: botões **Nina** e **Otto** no alto ("Quem lê:"), a escolha vale também para História; os botões de ouvir e de seguir ficam presos no pé da tela e a tela rola sozinha até o passo novo (Lucas).
- **06/11/2026** · Matemática, **Ver como se faz**: o botão "Próximo passo" (e o "Agora você!") só libera depois de um tempo mínimo para ler o passo (2 a 7 s, conforme o tamanho do texto; no 1º passo conta também a ideia e o exemplo), porque dava para ir tocando sem ler até a conta. Junto, **narração de cada passo só com Nina e Otto** (13.950 letras para as unidades 8, 9 e 10, mas o saldo do ElevenLabs só caiu uns 5,7 mil créditos: de 32.739 para ~27 mil); o botão só libera quando o áudio do passo termina (Lucas).
- **06/11/2026** · Na tela, **"Mundo" virou "Unidade"** em todas as matérias ("Unidade 8", "Escolha a unidade", "Complete uma unidade para ganhar uma coroa", conquistas "Unidade completa", datas de prova e painel do dono), porque é o nome que as crianças conhecem do livro. Os jogos extras e o duelo agora dizem "depois de fazer a 1ª fase" em vez de "ouvir os temas" (em Matemática a 1ª fase é "Ver como se faz") (Lucas).
- **05/11/2026** · Matemática: tirado o "armar a conta" dos textos (o Lucas achou que ninguém fala assim). Agora é "Dica: faça a conta no papel" e, nas explicações, "escrevemos um número embaixo do outro, vírgula embaixo de vírgula" (Lucas).
- **05/11/2026** · **Matemática, unidade 8** ("Venda de produtos e números em representação decimal", p. 52–99), feita a partir das fotos do livro: real e centavos, décimos, centésimos, parte inteira e decimal (quadro de ordens), medidas com vírgula, comparar preços, adição e subtração com vírgula, troco e desconto. Teclado com vírgula, moedas e quadrado de 100 desenhados. As páginas 88 e 89 não vieram nas fotos. Nas respostas a lápis do livro, as contas com "empresta um" saíram erradas (ex.: 100 − 88,88), por isso o treino tem bastante subtração com troca (Lucas pediu a unidade; detalhes do Claude). Revisada a pedido do Lucas: troco sempre combina com o dinheiro usado (nada de iogurte pago com duas notas de 100), concordância ("1 centavo", "um décimo de real é"), um grupo e uma pergunta da prova que estavam fáceis demais.
- **05/11/2026** · **Matemática, unidade 10** ("Os construtores e os números fracionários", p. 144–177), já no jeito novo: frações unitárias, numerador e denominador, leitura de frações, reta numérica, fração de quantidade (em duas etapas), décimos, centésimos e porcentagem. Resposta de fração em duas caixas; cano e reta desenhados. O desafio da musse (p. 175, kg → g e litro → ml) ficou de fora porque mistura medidas que a unidade não ensina (Lucas pediu a unidade; detalhes do Claude).
- **05/11/2026** · O Lucas não achava onde ver os amigos online e o ranking demorava. Agora "Estudando agora" aparece na aba Turma e no ranking (antes só dentro da conversa, que começa desligada). Servidor mais rápido: não confere todas as tabelas toda vez que acorda (eram ~40 consultas seguidas), e cada pedido da criança faz menos idas ao banco. O ranking aparece antes de terminar de mandar o progresso (Lucas).
- **05/11/2026** · **Matemática, unidade 9** ("O preparo de alimentos e o pensamento algébrico", p. 100–143), feita a partir das fotos do livro: valor desconhecido, operações inversas, os 7 passos e a prova real, igualdade e balança, sequências e múltiplos. Primeira matéria fora de História: o Início ganhou um botão por matéria. O problema dos bolinhos de chuva (p. 122) ficou de fora porque o livro não traz a resposta (Lucas).
- **05/11/2026** · **Matemática se estuda fazendo**: em vez de ouvir e escolher opções (jeito de História), exemplo resolvido + contas digitadas com números novos a cada vez, balança e setas desenhadas, prova de contas e revisão por tipo de conta. Regra nova: o livro é a base, mas pode ter outras contas e exemplos do mesmo nível e método (Lucas).
- **05/11/2026** · Aviso **"Coloque o Sabidex na tela do celular"** com passo a passo para iPhone e Android (e botão "Instalar agora" no Android), na primeira tela e no Início (Lucas).
- **05/11/2026** · Segurança antes das lojas: **o servidor sorteia a carta do pacote** (criança com conta precisa de internet para abrir), 60 pacotes por dia, épico só com a prova feita; **30 códigos errados** pela mesma internet bloqueiam 15 minutos (Lucas).
- **05/11/2026** · Os "dias seguidos" do início viraram botão para a tela **Meu dia**: 3 missões do dia (as 3 dão 1 pacote) e marcos de 3, 7, 14 e 30 dias (1 pacote cada). A sequência agora aceita 1 dia de folga por semana, como já pedia `docs/ESTUDOS.md`. O Claude sugeriu Sabicoins/enfeites como prêmio para não facilitar demais o álbum; o Lucas escolheu pacotes (Lucas).
- **05/11/2026** · **Pacote de boas-vindas** para toda conta nova de criança (carta na sorte), para ela entender o jogo logo de cara. Muda a regra "pacotes só vêm do estudo": essa é a única exceção. Quem não tem carta continua sem poder duelar (com uma lição já ganha pacote) (Lucas).
- **05/11/2026** · "Continuar com o Google" ligado para os pais: projeto Sabidex no Google Cloud, ID do cliente em `wrangler.jsonc` (só vale em sabidex.com.br e www) (Lucas).
- **05/11/2026** · A aba "Trocas" do menu virou **"Turma"** (ícone de duas pessoas; título "Minha turma"), porque ali ficam trocas, duelos e conversa (Lucas).
- **05/11/2026** · Estrelas no mapa do mundo (melhor nota de cada fase e jogo extra) e **Duelo do Saber** entre colegas da turma, sem apostar cartas; aba "Duelos" no ranking. A ideia de duelar valendo cartas foi trocada por essa (ver seção 5). Política de privacidade cita os duelos (versão `2026-11-duelo`: os adultos aceitam de novo ao entrar) (Lucas).
- **05/11/2026** · Nova entrada: primeira tela "Sou criança / Sou adulto", código da família para a criança entrar sozinha no aparelho dela, uma caixa só para o código (turma ou família) e "Ainda não tenho código" com recado para o adulto. Ideia vinda da análise da entrada do Baobab, sem copiar o visual nem o número de propaganda (Lucas).
- **05/11/2026** · Chat da turma vem ligado: turma nova já abre o chat e filho novo já vem liberado; o responsável vê a caixinha marcada ao criar ou ligar o perfil e pode desligar ali ou depois; o professor pode desligar a turma. Política de privacidade atualizada (os adultos aceitam de novo). Depois, a pedido do Lucas, o chat foi ligado também para todas as turmas e filhos (com conta da família) que já existiam, uma vez só (Lucas).
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
