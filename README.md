# Sabidex

App de estudo para crianças: a matéria da escola vira fases de jogo, e cada fase vale XP e pacotes de cartas colecionáveis para completar o álbum.

## O que já tem

**Jogo (funciona até sem internet)**
- **Mundos** por capítulo (História · Cap. 9 e Cap. 10), cada um com 5 fases: ouvir os temas (áudio), jogo da memória, linha do tempo, quiz relâmpago e o chefão (prova de 10 questões com correção; nota 7 libera o pacote épico).
- **Jogos extras** em cada mundo: complete a frase, quem sou eu?, separe nos grupos e por que aconteceu? Terminar os quatro dá um pacote.
- **Revisão do Ará:** as perguntas erradas voltam no dia seguinte e as certas voltam em 3, 7, 21 e 60 dias (repetição espaçada). Revisar também vale o pacote do dia.
- XP, níveis, dias seguidos e o mascote Ará.
- Pacotes com 1 Sabimon (comum, rara, épica ou lendária) e álbum de 60 figurinhas (20 Sabimons × 3 formas). 3 cartas iguais viram a forma 2; 2 da forma 2 viram a forma 3.

**Conta da família (precisa de internet)**
- Para jogar é preciso entrar numa turma ou numa conta. Um adulto cria a **conta da família** em "Sou pai, mãe ou professor" (tem uma conta de multiplicar antes, para a criança não entrar sozinha).
- O adulto cria o perfil de cada filho (apelido, cor e PIN) e toca em "Abrir neste aparelho" no celular da criança. O progresso que já estava no aparelho pode ir junto.
- Irmãos no mesmo aparelho escolhem o próprio perfil e digitam o PIN.
- O adulto vê o progresso, troca o PIN, tira da turma, apaga um perfil ou apaga a conta inteira.
- Política de privacidade em `#/privacidade`.

**Turma (precisa de internet)**
- Adultos (pais e professores) criam conta em "Área dos pais e professores", criam turmas e recebem um código (ex.: ARARA-4821).
- Criança com conta da família entra na turma só com o código e continua com a mesma conta.
- A criança entra na turma com o código, um apelido e cria um PIN de 4 números. O progresso que ela já tinha vai junto.
- Em outro aparelho, ela entra com código + apelido + PIN e recupera tudo. 5 PINs errados bloqueiam por 15 minutos.
- **Turma (aba do menu):** trocas, Duelo do Saber e conversa da turma. **Trocas:** a criança propõe trocar qualquer carta com um colega da turma; o colega aceita ou recusa. O app avisa quando é a única cópia ou quando a troca é desigual. Não existe chat.
- **Ranking da semana** por XP e por cartas (zera toda segunda).
- O adulto vê as crianças da turma, gera PIN novo e remove crianças. O administrador geral (e-mails em `ADMIN_EMAILS` no `wrangler.jsonc`) vê todas as turmas e o **Painel do dono** (`#/adulto/dono`): quem usou o app, quem está sem turma e os pedidos esperando.

**Privacidade:** das crianças o Sabidex guarda só apelido, cor e progresso no jogo. PINs e senhas ficam embaralhados (hash), nunca em texto.

## Ligar "Entrar com Google", "Entrar com Apple" e "Esqueci minha senha"

O código já está pronto. Cada opção só aparece no app depois de configurada no painel da Cloudflare
(**Workers & Pages → sabidex → Settings → Variables and Secrets**):

| Opção | O que criar | Nome no painel |
|---|---|---|
| Google | Em console.cloud.google.com: "Credenciais" → "ID do cliente OAuth" do tipo **Aplicativo da Web**, com `https://sabidex.com.br` em "Origens JavaScript autorizadas" | `GOOGLE_CLIENT_ID` (texto) |
| Apple | Em developer.apple.com (conta paga): um **Services ID** com "Sign in with Apple", domínio `sabidex.com.br` e retorno `https://sabidex.com.br/` | `APPLE_CLIENT_ID` (texto, o Services ID) |
| Esqueci minha senha e confirmar o e-mail do adulto | Conta no resend.com, com o domínio `sabidex.com.br` verificado, e uma chave de API | `RESEND_API_KEY` (**segredo**) e `EMAIL_REMETENTE` (texto, ex.: `Sabidex <nao-responda@sabidex.com.br>`) |

## Como adicionar um capítulo

**Pela conversa com o Claude (recomendado):** mande as fotos das páginas na conversa e siga `livro/LEIAME.md`. Regras de perguntas, jogos e idade: `docs/ESTUDOS.md`.

**À mão:**

1. Crie `src/data/<materia><numero>.ts` no formato de `src/data/tipos.ts`.
2. Coloque os áudios em `public/audio/`.
3. Adicione o capítulo ao conteúdo da turma certa em `src/data/index.ts` (`conteudos`). Cada turma só vê o conteúdo dela; quem liga o conteúdo na turma é o dono do app (Painel do dono → Turmas).
4. Rode `npm test` para conferir se nada ficou faltando.

## Comandos

```bash
npm install      # instala tudo
npm run dev      # abre o app no computador (sem servidor)
npm run build && npm run dev:api   # app + servidor + banco local
npm test         # testes das regras do jogo e do conteúdo
npm run conferir -- historia-11   # confere as perguntas de um capítulo
npm run build    # gera a versão para publicar (pasta dist/)
```

## Publicar na Cloudflare

No painel da Cloudflare: **Workers & Pages → Criar → Importar repositório** e escolha este repositório.

- Comando de build: `npm run build`
- Comando de deploy: `npx wrangler deploy`

A cada push na branch `main`, a Cloudflare publica a versão nova sozinha.
