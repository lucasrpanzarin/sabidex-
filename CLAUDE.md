# Sabidex

App de estudo gamificado para crianças de 9 a 11 anos (4º ano). A criança estuda a matéria da escola em fases curtas, ganha XP e pacotes de **Sabimons** (bichos colecionáveis inspirados na fauna brasileira, com 3 formas) e completa o álbum.

O dono do projeto é o Lucas, que não é programador. Explique mudanças em português simples, sem jargão.

## Regras do produto

- Todo texto do app é em **português do Brasil**, frases curtas, para uma criança de 10 anos ler sozinha.
- **Segurança das crianças:** nunca coletar sobrenome, e-mail, foto, telefone ou localização da criança. Só apelido e uma cor de avatar. Nada de chat livre entre crianças: trocas são só propostas de cartas.
- Conteúdo vem do livro da escola. Cada capítulo novo é um arquivo em `src/data/` seguindo o formato de `src/data/tipos.ts`. Não invente fatos históricos: confira com o livro.
- Cartas colecionáveis têm desenhos originais. Nunca usar personagens, nomes ou marcas de outros jogos (Pokémon etc.).
- Sabimons ficam em `src/data/sabimons.ts` (fatos sobre os bichos precisam ser verdadeiros). Os números da carta (Vida, força, cópias para evoluir) ficam em `src/lib/sabimon.ts`. Desenhos: `arte/sabimons/originais/` → `python3 scripts/recortar-sabimons.py` → `public/sabimons/`.
- Sabicoins: cada fase dá o mesmo número de XP e de Sabicoins. O saldo é XP total − soma das compras (`src/lib/loja.ts`, onde ficam os preços). A loja vende itens para a faixa de 3 espaços embaixo da carta; evoluir gasta cópias + Sabicoins. Na turma, a evolução passa pelo servidor (`/api/crianca/evoluir`). Sabimon evoluído ou com itens não sai em troca (só as cópias repetidas).
- Pacotes só vêm do estudo (fase nova, prova, 1ª fase do dia, nível novo). Nunca vender pacote, nem por moeda do jogo nem por dinheiro.

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
- Progresso salvo no aparelho (`src/lib/store.ts`) e sincronizado com o servidor quando a criança está numa turma (`src/lib/conta.ts`).
- Servidor: `src/worker/index.ts` (Hono) + banco D1 `sabidex` (tabelas em `src/worker/esquema.ts`, criadas sozinhas). Regras de mesclagem em `src/shared/sync.ts`.
- Cartas ficam numa tabela à parte no servidor; trocas são uma transação única (nunca duplica nem some carta).
- O service worker (`public/sw.js`) nunca guarda respostas de `/api/`.
- Login da criança: código da turma + apelido + PIN de 4 números. Adultos: e-mail + senha.
- Áudios de narração em `public/audio/<capitulo>-<tema>.mp3` (voz Kokoro pm_alex).
- Antes de publicar: `npm test` e `npm run build` precisam passar.
