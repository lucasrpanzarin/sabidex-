# Sabidex — sistema de design (MASTER)

Feito com a skill **ui-ux-pro-max** (`.claude/skills/ui-ux-pro-max/`) em 04/11/2026 e ajustado às regras do `CLAUDE.md`.
Comando usado: `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "kids educational game collectible cards" --design-system -p "Sabidex"`

## Ideia central
**O app inteiro tem o mesmo "jeito" das cartas dos Sabimons.** A carta é a peça mais bonita do jogo; painéis, botões e o pacote copiam a moldura dela.

## Estilo: Claymorphism ("massinha"), recomendado pela skill para apps infantis e jogos
- Borda grossa **3–4px** (`--moldura`, ou `--moldura-ciano` nos painéis em destaque).
- Cantos redondos **16–24px**.
- **Sombra dupla**: dentro (`--sombra-dentro`) + fora (`--sombra-fora`), mais o "chão" duro embaixo (`--chao`), igual aos botões de jogo.
- Filete claro por dentro da borda (como o filete branco da carta).
- Aperto suave de **200ms** em tudo que é tocável.
- Verso do Sabidex (`--verso`): losangos sobre azul-noite. Usado nas cartas que a criança não tem, no pacote e nos espaços de item.

## O que a skill sugeriu e NÃO seguimos (regras do Lucas valem mais)
| Skill sugeriu | Sabidex usa | Por quê |
|---|---|---|
| Fundo claro, evitar tema escuro | Azul-noite `--bg` + neon | Regra de visual do `CLAUDE.md` |
| Índigo/roxo `#4F46E5` como cor principal | Turquesa, rosa, amarelo, verde | Nada de roxo (parece o Baobab) |
| Fontes Baloo 2 / Comic Neue | Lilita One / Nunito | Regra de visual do `CLAUDE.md` |
| Animação de "quique" | Só em momentos de prêmio | Telas paradas não tremem |

## Checklist antes de publicar (da skill)
- [ ] Texto com contraste de pelo menos 4,5:1 (no verso use `#AEB8E8`, não `#7F8CC4`).
- [ ] Botões e áreas de toque com pelo menos 44px de altura e 8px entre eles.
- [ ] Foco visível no teclado (`:focus-visible`).
- [ ] `prefers-reduced-motion` respeitado.
- [ ] Ícones em desenho (SVG), não emoji.
- [ ] Testar em 375px de largura.

## Raridades (iguais nas cartas, nos filtros e nos selos)
comum ★ cinza · rara ★★ turquesa · épica ★★★ rosa · lendária ★★★★ amarelo com borda holográfica.
