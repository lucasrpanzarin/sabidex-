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

## Por que não parece o Baobab
Sem roxo/lilás, sem fundo pastel liso: o que marca o Sabidex é o contorno escuro + sombra de adesivo + papel.

## Lojinha
- Item = mini carta com moldura da raridade, desenho grande, selo do efeito e fato real.
- Destaque do dia sem desconto (a skill avisa: nada de truque de pressão com criança).
- Coroa = prêmio de estudo, não se compra.

## O que a skill sugeriu e NÃO seguimos
| Skill sugeriu | Sabidex usa | Por quê |
|---|---|---|
| Índigo/roxo como cor principal | Coral, amarelo, turquesa | Nada de roxo (parece o Baobab) |
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
