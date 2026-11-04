# Sabidex

App de estudo para crianças: a matéria da escola vira fases de jogo, e cada fase vale XP e pacotes de cartas colecionáveis para completar o álbum.

## O que já tem

**Jogo (funciona até sem internet)**
- **Mundos** por capítulo (História · Cap. 9 e Cap. 10), cada um com 5 fases: ouvir os temas (áudio), jogo da memória, linha do tempo, quiz relâmpago e o chefão (prova de 10 questões com correção; nota 7 libera o pacote épico).
- **Revisão do Ará:** as perguntas erradas voltam no dia seguinte e as certas voltam em 3, 7, 21 e 60 dias (repetição espaçada). Um pacote por dia para quem revisa.
- XP, níveis, dias seguidos e o mascote Ará.
- Pacotes de 3 cartas (comum, rara, épica e lendária) e álbum com 12 cartas por capítulo.

**Turma (precisa de internet)**
- Adultos (pais e professores) criam conta em "Área dos pais e professores", criam turmas e recebem um código (ex.: ARARA-4821).
- A criança entra na turma com o código, um apelido e cria um PIN de 4 números. O progresso que ela já tinha vai junto.
- Em outro aparelho, ela entra com código + apelido + PIN e recupera tudo. 5 PINs errados bloqueiam por 15 minutos.
- **Trocas:** a criança propõe trocar qualquer carta com um colega da turma; o colega aceita ou recusa. O app avisa quando é a única cópia ou quando a troca é desigual. Não existe chat.
- **Ranking da semana** por XP e por cartas (zera toda segunda).
- O adulto vê as crianças da turma, gera PIN novo e remove crianças. O administrador geral (e-mails em `ADMIN_EMAILS` no `wrangler.jsonc`) vê todas as turmas.

**Privacidade:** das crianças o Sabidex guarda só apelido, cor e progresso no jogo. PINs e senhas ficam embaralhados (hash), nunca em texto.

## Como adicionar um capítulo

**Pela conversa com o Claude (recomendado):** mande as fotos das páginas na conversa e siga `livro/LEIAME.md`. Regras de perguntas, jogos e idade: `docs/ESTUDOS.md`.

**À mão:**

1. Crie `src/data/<materia><numero>.ts` no formato de `src/data/tipos.ts`.
2. Coloque os áudios em `public/audio/`.
3. Adicione o capítulo à lista em `src/data/index.ts`.
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
