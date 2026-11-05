# Sabidex — sistema de design (MASTER)

Feito com a skill **ui-ux-pro-max** (`.claude/skills/ui-ux-pro-max/`) em 04/11/2026 e ajustado às regras do `CLAUDE.md`.
Comando usado: `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "kids educational game collectible cards" --design-system -p "Sabidex"`

## Ideia central
**O app inteiro tem o mesmo "jeito" das cartas dos Sabimons.** A carta é a peça mais bonita do jogo; painéis, botões e o pacote copiam a moldura dela.

## Visual escolhido: "Álbum de figurinhas" (Lucas, 04/11/2026)
Estilo "massinha" da skill (borda grossa 3px, cantos 16–24px, sombra dupla) no jeito de **figurinha colada no álbum**:
- Fundo de **papel claro** `--bg #FFF6E5` com bolinhas bem fracas.
- **Contorno escuro** `--ink #10213F` de 3px em painéis, botões, cartas e pílulas.
- **Sombra de adesivo**: `4px 4px 0 var(--ink)` (painéis, cartas) e `0 5px 0 var(--ink)` (botões).
- Cores de preencher: coral `#FF5A36`, amarelo `#FFC21A`, turquesa `#22C3D6`, rosa `#F472B6`, verde `#22B35E`.
- **Texto colorido** sempre nas versões escuras: `--t-coral #C2410C`, `--t-yellow #92400E`, `--t-cyan #0E7490`, `--t-pink #BE185D`, `--t-green #15803D` (contraste 4,5:1 no papel).
- Títulos de prêmio (`.titulo-premio`): amarelo com contorno escuro.
- Figurinhas pequenas do álbum ficam levemente tortas; vaga vazia é tracejada e diz "falta!".
- Pacote: moldura holográfica + verso azul-noite do Sabidex (o único lugar escuro, de propósito).

## Logo (Lucas, 04/11/2026)
"Letras-figurinha": cada letra do Sabidex é uma figurinha colorida (coral, amarelo, turquesa, rosa, verde, coral, amarelo), em Lilita One com contorno escuro e sombra de adesivo, cada uma levemente torta. Sempre usar o componente `src/components/Logo.tsx` (nunca escrever "Sabidex" com `className="logo"` à mão).

**Ícone do celular:** mini carta amarela com o "S" branco do logo, num fundo holográfico (a borda das lendárias). Fonte: `public/icons/icon.svg` (o "S" está desenhado em linhas, não depende da fonte). Os `icon-192.png` e `icon-512.png` saem dele; a carta cabe no círculo do Android.

## Por que não parece o Baobab
O Sabidex não pode ser uma cópia do Baobab. Roxo pode ser usado (Lucas, 05/11/2026), mas o que marca o Sabidex é o contorno escuro + sombra de adesivo + papel, e não o roxo/lilás em tudo com fundo pastel liso, que é o jeito do Baobab.

## Lojinha
- Item = mini carta com moldura da raridade, desenho grande, selo do efeito e fato real.
- Destaque do dia sem desconto (a skill avisa: nada de truque de pressão com criança).
- Coroa = prêmio de estudo, não se compra.

## O que a skill sugeriu e NÃO seguimos
| Skill sugeriu | Sabidex usa | Por quê |
|---|---|---|
| Índigo/roxo como cor principal | Coral, amarelo, turquesa | Na época, nada de roxo. Desde 05/11/2026 o roxo pode entrar, sem copiar o Baobab |
| Fontes Baloo 2 / Comic Neue | Lilita One / Nunito | Regra de visual do `CLAUDE.md` |
| Animação de "quique" | Só em momentos de prêmio | Telas paradas não tremem |

## Checklist antes de publicar (da skill)
- [ ] Texto com contraste de pelo menos 4,5:1 (texto colorido só com as cores `--t-*`).
- [ ] Botões e áreas de toque com pelo menos 44px de altura e 8px entre eles.
- [ ] Foco visível no teclado (`:focus-visible`).
- [ ] `prefers-reduced-motion` respeitado.
- [ ] Ícones em desenho (SVG), não emoji.
- [ ] Testar em 375px de largura.

## Raridades (iguais nas cartas, nos filtros e nos selos)
comum ★ cinza · rara ★★ turquesa · épica ★★★ rosa · lendária ★★★★ amarelo com borda holográfica.

## Telas de Matemática (05/11/2026, revisadas com a skill)
Arquivos: `src/screens/Contas.tsx` e o fim de `src/styles.css`.
- **Teclado de números** próprio (3 × 4), em vez do teclado do celular, que cobriria a conta. Teclas com 48px ou mais (46px só em celular bem baixo), 8–10px entre elas. "Apagar" e "OK" escritos por extenso (seta sozinha parece "voltar").
- **"Sua resposta"** é o rótulo visível da caixa (em tela muito baixa, fica só para o leitor de tela).
- Certo/errado **nunca só pela cor**: a caixa fica verde/rosa **e** aparece "Acertou!" ou "Era X." com a explicação, logo abaixo da conta (`role="status"`).
- **Balança e setas** desenhadas com as mesmas bordas e cores do app, paradas (sem animação). Balança desequilibrada diz em texto para que lado pende; os desenhos têm descrição para o leitor de tela.
- Passos do "Ver como se faz" aparecem um de cada vez, sem animação (animação só em prêmio).
- Conta e teclado cabem sem rolar em 360 × 740 e 375 × 667.
- **Frações** (unidade 10): fração sempre "em pé" (numerador em cima, traço, denominador embaixo), como no livro. Resposta de fração em **duas caixas empilhadas**; a caixa ativa tem contorno turquesa e a dica diz qual escrever (em tela baixa, a dica some e fica só o destaque). Cano dividido = barra com contorno escuro e partes pintadas de coral; reta numérica com marcações e seta coral desenhada em CSS (não é letra nem emoji).
- **Aviso do papel e lápis**: tela de entrada das fases de Matemática igual à do quiz (Ará + balão + botão amarelo "Já peguei!"). A dica nas contas difíceis é uma linha cinza pequena dentro do painel da conta, sem ícone nem cor (não pode competir com a pergunta).

## Menu de baixo (Lucas, 05/11/2026)
Arquivo: `src/components/Nav.tsx` e `.nav*` em `src/styles.css`.
- Cada aba tem um **desenho de duas cores** (cor da aba + contorno escuro), como figurinha: Início coral (casinha), Álbum turquesa (álbum aberto com figurinha), Turma rosa (duas crianças), Ranking amarelo (troféu com estrela).
- A **aba aberta vira adesivo colado**: fundo clarinho da cor da aba, contorno escuro, sombra de adesivo e levemente torta (-4°). O nome fica escuro; nas outras, cinza. Assim a aba aberta não depende só da cor.
- Nomes na **Lilita One**. "Jogar" continua a bola amarela grande, também torta como adesivo.
- Sem animação (só aperta ao tocar). Foco do teclado com contorno turquesa.

## Chamar a atenção para o estudo (Lucas, 05/11/2026)
Lucas pediu algo que chame a criança para o que ela precisa fazer. A skill desaconselha animação sem fim (distrai; no máximo 1–2 coisas animadas por tela), então ficou assim:
- **Pulinho** (`.chamar`, Lucas trocou no mesmo dia): só no **botãozinho amarelo** (selo "Faça agora"/"Continue aqui", botão "Fazer agora", "Jogar", a fase "Agora" do mapa, "Entrar na minha turma"). Ele cresce 8% e volta, e solta um anel amarelo que se espalha e some; repete a cada ~2,4 s. Não acende e apaga (piscar cansa). 1 por tela, some quando ela faz, nunca dentro dos jogos; com "reduzir movimento" fica só um anel parado. A versão antiga (luz dourada passando pelo cartão inteiro) não ficou boa.
- **Selo parado** `.selo-agora` (amarelo torto, texto escuro): "Faça agora", "Comece aqui", "Continue aqui".
- Onde: Início = selo "Faça agora" do cartão das Missões do dia (bolinhas que enchem → pacote) enquanto falta missão; sem missões, o botão "Jogar" do "Continuar". Meu dia = a primeira missão que falta ("Fazer agora"; as outras ficam "Ir" escuro). Lista de mundos = primeiro mundo não terminado. Mapa do mundo = a fase "Agora". Sem turma = botão "Entrar na minha turma". O "Abrir pacotes" do álbum (rosa) não pula: só o amarelo.
- **Dias seguidos**: se ainda não estudou hoje, a pílula fica coral clarinha com um "!" (parado).
- No Início, a Lojinha foi para depois do "Continuar" (estudo primeiro).
