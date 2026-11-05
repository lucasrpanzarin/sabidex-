# Sabidex

App de estudo gamificado para crianças de 9 a 11 anos (4º ano). A criança estuda a matéria da escola em fases curtas, ganha XP e pacotes de **Sabimons** (bichos colecionáveis inspirados na fauna brasileira, com 3 formas) e completa o álbum.

O dono do projeto é o Lucas, que não é programador. Explique mudanças em português simples, sem jargão.

## Caderno do projeto (leia primeiro)

- No começo de cada conversa, leia **`docs/PROJETO.md`**: tudo o que já existe, as decisões do Lucas, as ideias já trocadas e os pontos em aberto.
- Quando o Lucas trouxer uma ideia, confira o caderno antes de fazer. Se já existe, se já foi testada e trocada, ou se vai contra uma regra daqui, **diga isso a ele primeiro** (com o que existe hoje) e pergunte se quer mudar mesmo.
- Ao terminar uma mudança, atualize o caderno: a lista do que existe e uma linha no "Registro de mudanças" (data, o que mudou, quem decidiu).

## Regras do produto

- Todo texto do app é em **português do Brasil**, frases curtas, para uma criança de 10 anos ler sozinha.
- **Segurança das crianças:** nunca coletar sobrenome, e-mail, foto, telefone ou localização da criança. Só apelido e uma cor de avatar.
- **Chat da turma** (decidido pelo Lucas em 04/11/2026; `src/shared/chat.ts`, `src/screens/Chat.tsx`): escrito, mas só num grupo único da turma da escola (nada de mensagem privada nem chat com quem é de fora). Começa desligado: um administrador da turma liga e escolhe o horário (padrão 7h–21h de Brasília) **e** o responsável autoriza cada filho na conta da família (criança sem família não escreve). Pais e professor leem tudo, e a tela avisa a criança. O app bloqueia palavrões, telefones, endereços, links, e-mails e redes sociais; sem fotos nem áudio; máx. 200 letras e 5 mensagens a cada 30 s. A criança pode "Avisar um adulto"; os administradores apagam mensagens e pausam um aluno. Mensagens somem em 60 dias. "Estudando agora" só para a turma, e professor/responsável podem desligar.
- Conteúdo vem do livro da escola. Cada capítulo novo é um arquivo em `src/data/` seguindo o formato de `src/data/tipos.ts`. Não invente fatos históricos: confira com o livro.
- Capítulo novo a partir de fotos do livro: siga a skill **capitulo-do-livro** (`.claude/skills/capitulo-do-livro/SKILL.md`), na conversa, sem API paga. Regras de perguntas, jogos e idade: `docs/ESTUDOS.md`.
- Cartas colecionáveis têm desenhos originais. Nunca usar personagens, nomes ou marcas de outros jogos (Pokémon etc.).
- **Álbum de 60 figurinhas** (`src/lib/figurinhas.ts`): cada forma de cada Sabimon é uma carta, com número de 1 a 60 e nome (ids `s001`, `s001-2`, `s001-3`). Pacotes só dão a forma 1. **Evolução** (decidida pelo Lucas em 04/11/2026): 3 cartas da forma 1 viram 1 da forma 2; 2 da forma 2 viram 1 da forma 3; as trocadas somem (se acabarem, o espaço fica vazio no álbum) e custa também Sabicoins. Qualquer carta pode ir para troca. Itens da lojinha ficam numa carta (forma) específica.
- Sabimons ficam em `src/data/sabimons.ts` (fatos sobre os bichos precisam ser verdadeiros). Os números da carta (Vida, força, cópias para evoluir) ficam em `src/lib/sabimon.ts`. Desenhos: `arte/sabimons/originais/` → `python3 scripts/recortar-sabimons.py` → `public/sabimons/`.
- Sabicoins: cada fase dá o mesmo número de XP e de Sabicoins. O saldo é XP total − soma das compras (`src/lib/loja.ts`, onde ficam os preços). A loja vende itens com raridade (mesma moldura das cartas) e um fato real sobre o Brasil: itens de Vida/força/enfeite vão para a faixa de 3 espaços embaixo da carta; itens visuais (moldura de ouro, brilho holográfico) mudam a carta e não ocupam espaço. A Coroa não se vende: ganha 1 por mundo completo. Itens antigos (`antigo: true`) saem da vitrine mas continuam valendo para quem comprou. Nada de desconto ou pressão de tempo. Na turma, a evolução passa pelo servidor (`/api/crianca/evoluir`). Carta com itens não sai em troca (só as cópias repetidas).
- Jogos: cada item tem uma chance só (errou, o app mostra o certo e segue). Todo jogo termina com estrelas, "X de Y certas" e nota (`Placar` em `src/screens/Fases.tsx`).
- Data da prova da escola: o professor (turma) ou o adulto (família) marca na área dos adultos (`src/lib/provas.ts`, tabela `datas_prova`). Depois da data, o capítulo vai para "Já teve prova na escola" e continua valendo XP e pacotes; sem bônus por fazer antes.
- Pacotes só vêm do estudo (fase nova, prova, 1ª fase do dia, nível novo) e só com nota 7 ou mais (menos o de nível novo). Cada erro tira 10% do XP da fase (mínimo 20%), em `src/lib/jogo.ts`. Nunca vender pacote, nem por moeda do jogo nem por dinheiro.

## Visual (não mudar sem o Lucas pedir)

- Visual **"álbum de figurinhas"** (escolhido pelo Lucas em 04/11/2026): fundo de papel claro (`--bg`), contorno escuro grosso (`--ink`) e sombra "de adesivo" em painéis, botões e cartas. Cores de preencher: coral `--coral`, amarelo `--yellow`, turquesa `--cyan`, rosa `--pink`, verde `--green`. Para **texto colorido** use as versões escuras (`--t-coral`, `--t-yellow` etc.), senão não dá para ler no papel. Pode usar roxo; o que não pode é ficar uma cópia do Baobab (o mesmo jeito de telas, cores e desenhos dele). Decidido pelo Lucas em 05/11/2026.
- Logo: letras-figurinha coloridas e tortas (`src/components/Logo.tsx`), escolhido pelo Lucas em 04/11/2026. Ícone do celular: mini carta lendária com o "S" (`public/icons/icon.svg`; os PNG 192/512 são fotos dele).
- Títulos e botões na fonte **Lilita One**; textos em **Nunito**.
- Botões "de jogo": cor viva, contorno escuro e "chão" embaixo (`.btn` em `src/styles.css`).
- Animação só em momentos de prêmio (abrir pacote, subir de nível, acertar). Telas paradas não tremem nem piscam. Sempre respeitar `prefers-reduced-motion`.
- Raridades: comum ★ (cinza), rara ★★ (turquesa), épica ★★★ (rosa), lendária ★★★★ (amarelo, borda holográfica).
- Mascote: Ará, a arara (`src/components/Ara.tsx`): guia da turma, com mochila e lápis (não é um Sabimon). Desenhos 3D em `public/mascote/ara-<humor>.webp` (feliz, pensando, comemorando, triste), feitos pelo pedido `{"acao": "mascote"}` em `arte/pedido.json`.
- Para decisões de design, use a skill **ui-ux-pro-max** (fica em `.claude/skills/ui-ux-pro-max/`; busca: `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<busca>" --domain <área>`). As decisões já tomadas estão em `design-system/sabidex/MASTER.md`: leia antes de mudar o visual.

## Técnica

- Vite + React + TypeScript. Hospedagem na Cloudflare (`wrangler.jsonc`, conta do Lucas, projeto separado dos painéis dele).
- Progresso salvo no aparelho (`src/lib/store.ts`) e sincronizado com o servidor quando a criança está numa turma (`src/lib/conta.ts`).
- Servidor: `src/worker/index.ts` (Hono) + banco D1 `sabidex` (tabelas em `src/worker/esquema.ts`, criadas sozinhas). Regras de mesclagem em `src/shared/sync.ts`.
- Cartas ficam numa tabela à parte no servidor; trocas são uma transação única (nunca duplica nem some carta).
- O service worker (`public/sw.js`) nunca guarda respostas de `/api/`.
- Contas: o adulto (e-mail + senha, aceita a política de privacidade no cadastro) cria a **conta da família** e os perfis dos filhos (apelido + cor + PIN). O adulto abre o perfil no aparelho da criança; irmãos no mesmo aparelho trocam de perfil com o PIN. Turma é opcional: a criança entra com o código e continua com a mesma conta. Criança só da turma (sem família) entra com código + apelido + PIN. Não existe "jogar sem conta": a primeira tela pergunta "Sou criança / Sou adulto"; a criança digita um código só, o da turma ou o **código da família** (`adultos.codigo_familia`, mesmo formato e nunca igual ao de uma turma; a família vê e troca na área dos adultos), toca no nome e digita o PIN (cada turma estuda o livro dela). Quem já jogava sem conta antes continua jogando no aparelho.
- **Administradores da turma**: quem cria a turma é o dono e convida outros adultos (professor ou outro responsável) com um código `ADM-XXXX-XXXX` (7 dias, uma vez só; tabelas `turma_admins` e `convites_admin`). Administradores podem tudo na turma, menos convidar/remover administradores (só o dono). Se o dono apagar a conta, a turma passa para o administrador mais antigo.
- Criança da família sem turma tem `turma_id = 'familia:<id do adulto>'` no banco (`src/worker/esquema.ts`).
- Entrar com Google/Apple e "Esqueci minha senha" só aparecem quando o servidor está configurado (`GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID`, `RESEND_API_KEY` + `EMAIL_REMETENTE`; veja o README). O app pergunta em `/api/config`.
- Adulto que entrou com Google/Apple pode não ter senha (`tem_senha = 0`): para apagar a conta, escreve APAGAR.
- Exigências das lojas já atendidas: pergunta "só para adultos" antes da área dos adultos, botão "Apagar minha conta", política de privacidade em `#/privacidade` (`src/screens/Privacidade.tsx`; ao mudar o texto, mudar `VERSAO_PRIVACIDADE` no servidor).
- Áudios de narração em `public/audio/<voz>/c<capitulo>-<tema>.mp3`, com 3 vozes do ElevenLabs: `nina`, `otto`, `graziella` (`src/lib/voz.ts`, pedido em `vozes/`). Os mp3 soltos em `public/audio/` são da voz antiga.
- Antes de publicar: `npm test` e `npm run build` precisam passar.
