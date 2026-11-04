# Sabidex

App de estudo gamificado para crianças de 9 a 11 anos (4º ano). A criança estuda a matéria da escola em fases curtas, ganha XP e pacotes de cartas colecionáveis e completa o álbum de cada capítulo.

O dono do projeto é o Lucas, que não é programador. Explique mudanças em português simples, sem jargão.

## Regras do produto

- Todo texto do app é em **português do Brasil**, frases curtas, para uma criança de 10 anos ler sozinha.
- **Segurança das crianças:** nunca coletar sobrenome, e-mail, foto, telefone ou localização da criança. Só apelido e uma cor de avatar. Nada de chat livre entre crianças: trocas são só propostas de cartas.
- Conteúdo vem do livro da escola. Cada capítulo novo é um arquivo em `src/data/` seguindo o formato de `src/data/tipos.ts`. Não invente fatos históricos: confira com o livro.
- Cartas colecionáveis têm desenhos originais. Nunca usar personagens, nomes ou marcas de outros jogos (Pokémon etc.).

## Visual (não mudar sem o Lucas pedir)

- Fundo azul-noite (`--bg`), cores neon: turquesa `--cyan`, rosa `--pink`, amarelo `--yellow`, verde `--green`. Nada de roxo como cor principal (fica parecido com o app Baobab).
- Títulos e botões na fonte **Lilita One**; textos em **Nunito**.
- Botões "de jogo": degradê, brilho em cima, sombra embaixo (`.btn` em `src/styles.css`).
- Animação só em momentos de prêmio (abrir pacote, subir de nível, acertar). Telas paradas não tremem nem piscam. Sempre respeitar `prefers-reduced-motion`.
- Raridades: comum ★ (cinza), rara ★★ (turquesa), épica ★★★ (rosa), lendária ★★★★ (amarelo, borda holográfica).
- Mascote: Ará, a arara (`src/components/Ara.tsx`).
- Para decisões de design, use a skill **ui-ux-pro-max**.

## Técnica

- Vite + React + TypeScript. Hospedagem na Cloudflare (`wrangler.jsonc`, conta do Lucas, projeto separado dos painéis dele).
- Etapa 1 (atual): progresso salvo no aparelho (`src/lib/store.ts`, localStorage).
- Etapa 2 (próxima): Worker + D1 para turmas com código, trocas e ranking.
- Áudios de narração em `public/audio/<capitulo>-<tema>.mp3` (voz Kokoro pm_alex).
- Antes de publicar: `npm test` e `npm run build` precisam passar.
