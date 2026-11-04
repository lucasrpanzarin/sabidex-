# Sabidex

App de estudo para crianças: a matéria da escola vira fases de jogo, e cada fase vale XP e pacotes de cartas colecionáveis para completar o álbum.

## O que já tem (etapa 1)

- **Mundos** por capítulo (História · Cap. 9 e Cap. 10), cada um com 5 fases:
  1. Ouvir os temas (narração em áudio)
  2. Jogo da memória (ligar palavra e significado)
  3. Linha do tempo (pôr os fatos em ordem)
  4. Quiz relâmpago (verdadeiro ou falso em 60 segundos)
  5. Chefão: prova de 10 questões, com correção. Nota 7 libera o pacote épico.
- XP, níveis, dias seguidos estudando e o mascote Ará.
- Pacotes de 3 cartas (comum, rara, épica e lendária) e álbum com 12 cartas por capítulo.
- Funciona como app no celular (dá para instalar na tela inicial) e sem internet depois de aberto uma vez.
- O progresso fica salvo no próprio aparelho.

## Próxima etapa

Turmas com código de convite, trocas de cartas repetidas entre amigos e ranking da semana. Para isso entra um servidor na Cloudflare (Worker + banco D1).

## Como adicionar um capítulo

1. Crie `src/data/<materia><numero>.ts` no formato de `src/data/tipos.ts`.
2. Coloque os áudios em `public/audio/`.
3. Adicione o capítulo à lista em `src/data/index.ts`.
4. Rode `npm test` para conferir se nada ficou faltando.

## Comandos

```bash
npm install      # instala tudo
npm run dev      # abre o app no computador para testar
npm test         # testes das regras do jogo e do conteúdo
npm run build    # gera a versão para publicar (pasta dist/)
```

## Publicar na Cloudflare

No painel da Cloudflare: **Workers & Pages → Criar → Importar repositório** e escolha este repositório.

- Comando de build: `npm run build`
- Comando de deploy: `npx wrangler deploy`

A cada push na branch `main`, a Cloudflare publica a versão nova sozinha.
