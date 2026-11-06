# Tarefa: gerar os desenhos dos 10 primeiros Sabimons (Higgsfield)

Este arquivo é para a conversa do Claude que vai gerar as imagens com o Higgsfield.
O resto do app já está pronto; aqui só entra a arte.

## Contexto

O **Sabidex** é um app de estudo para crianças de 9 a 11 anos (veja `CLAUDE.md`).
Os **Sabimons** são os bichos colecionáveis do app: vêm nos pacotes, têm 3 formas (evoluções)
e serão 99 no total. Todos são **inspirados em bichos brasileiros** e precisam ter design
**original** — nada que lembre Pokémon, Digimon ou outra marca.

Guia completo (regras, tipos, raridades): https://claude.ai/artifact/9tkM6RnY4cqX4djDaSxQG5

## Estilo (igual para todos os 99) — atualizado em 04/11/2026

O primeiro teste ("brinquedo de vinil fofo") ficou com cara de chaveiro. O Lucas escolheu o **estilo de batalha**:

- Personagem de **jogo de aventura de criaturas**, render 3D estilizado, **pose de ação**, olhar **valente e determinado**
  (empolgante, mas sem dar medo: nada de sangue nem cara de monstro).
- **Poder do tipo bem visível** (fogo saindo, água girando, raios estalando), silhueta forte e fácil de reconhecer pequena.
- Cores vivas. **Nada de roxo como cor principal** (use rosa e turquesa no lugar).
- Bichos escuros (azul-marinho, preto) ganham **contorno de luz** turquesa ou dourado, senão somem no fundo azul-noite do app.
- **Um bicho por imagem**, corpo inteiro, centralizado, quadrado 1:1 (saem com 1536 × 1536), **fundo branco liso**,
  sem texto, logo, moldura ou cenário.

### Regras de evolução

- **Muda de verdade:** a forma 2 fica 2× maior e atlética; a forma 3 é um gigante imponente. Pode mudar a **pose**
  (ficar em pé, voar, mergulhar), ganhar **partes novas** (armadura, coroa, asas extras, pinças enormes) e até **mudar de cor**,
  sempre dentro da cor do tipo (fogo continua quente, gelo continua frio).
- **Fica igual:** o rosto, os olhos e a **marca registrada** de cada um (ex.: focinho do tamanduá, nota musical do uirapuru).
- Escreva cada pedido em duas partes: `CHANGE: ...` (o que muda) e `KEEP: ...` (o que fica).
- **Em corrente:** a forma 2 usa a forma 1 como imagem de referência e a forma 3 usa a forma 2.
- Com imagem de referência, o Higgsfield tende a **copiar a pose**. Se a pose precisa mudar muito, peça uma pose
  totalmente diferente com todas as letras (ou gere sem referência, descrevendo rosto e cores em palavras).
- **Cuidado com semelhança:** tartaruga em pé lembra personagens famosos (Pokémon, Tartarugas Ninja); bicho laranja
  com cauda de fogo também. Sempre confira lado a lado antes de aprovar.

## Como gerar

- Modelo: **Qwen Image 3** no Higgsfield (`alibaba/qwen-image-3/text-to-image` para a forma 1 e
  `alibaba/qwen-image-3/edit` com imagem de referência para as formas 2 e 3), resolução `2k`, formato `1:1`.
- Pelo GitHub: as descrições ficam em `arte/sabimons/lista.json`, o pedido em `arte/pedido.json`
  e o gerador em `scripts/arte.ts` (veja `arte/LEIAME.md`). A chave fica no segredo `HIGGSFIELD_API_KEY`.

## Pedido-modelo

```
Original creature for a creature-collecting adventure game, stylized 3D game character render, dynamic action pose ready for battle, brave determined expression, big expressive eyes, strong readable silhouette, its elemental power clearly visible as glowing effects, vibrant saturated colors, dramatic rim lighting, full body, centered, plain pure white background, no text, no logo, no frame, no scenery. Exciting but friendly for kids aged 9 to 11, not scary, no blood. Original design, not based on any existing franchise or character. [DESCRIÇÃO]
```

Nas formas 2 e 3, depois da descrição (`CHANGE: ... KEEP: ...`), acrescente:

```
This is a big evolution of the creature in the reference image. Follow the CHANGE list: new pose, bigger body, new parts, and the new colors if any. Follow the KEEP list so it is clearly recognizable as the same creature line. Do not copy the reference pose. Isolated character on a plain pure white background: absolutely no environment, no scenery, no dark background.
```

## Os 10 primeiros (30 imagens) — prontos

A tabela abaixo é a ideia original. As descrições finais usadas (estilo de batalha) estão em `arte/sabimons/lista.json`.
Mudanças: o Arenito virou **maria-farinha → guaiamum**; o Ventilu termina com o corpo virando tornado; o Pedrolho termina como golem de cristal.

| Nº | Nomes (forma 1 → 2 → 3) | Tipo | Forma 1 | Forma 2 | Forma 3 |
| --- | --- | --- | --- | --- | --- |
| 001 | Brasinho → Brasão → Fornalhuda | Fogo | tiny baby capybara, warm brown fur, small glowing orange embers on top of its head, sleepy happy smile | young capybara standing on hind legs, flame mane on its head and shoulders, confident grin | big strong capybara with a crown of fire, glowing lava-orange belly, heroic pose |
| 002 | Pingoró → Botorrão → Marabotão | Água | tiny pink river dolphin baby blowing a water bubble, playful | young pink river dolphin with water swirl fins, jumping pose | large majestic pink river dolphin surrounded by a ring of flowing water, wise eyes |
| 003 | Sementú → Tatuflora → Matatu | Planta | tiny armadillo curled half into a ball, a small green sprout on its back | armadillo with leafy shell and flowers, standing proudly | big armadillo whose shell is a small forest with trees and vines, calm guardian |
| 004 | Zapinho → Faiscaluz → Trovalume | Raio | tiny round firefly with a glowing yellow electric tail, sparkles | firefly with lightning-shaped wings and bright electric aura | large firefly knight with crackling lightning armor and a brilliant tail lantern |
| 005 | Pedrolho → Cristabuti → Montabuti | Pedra | tiny tortoise with a shell of pastel crystals, shy smile | tortoise with big shiny amethyst crystal shell, sturdy stance | huge tortoise whose shell is a crystal mountain with glowing gems |
| 006 | Ventilu → Rajadinho → Furacolibri | Vento | tiny hummingbird with turquoise feathers and a little wind swirl | hummingbird with long flowing wind-trail tail feathers, fast pose | large hummingbird with a tornado swirling around its wings, fierce eyes |
| 007 | Arenito → Dunasiri → Tempestasiri | Areia | tiny beach crab with sandy beige shell, peeking from sand | crab with sandstone armor and small sand whirlwinds at its claws | big crab warrior with dune-shaped shell and a sandstorm swirl behind it |
| 008 | Nevim → Friozão → Glaciaré | Gelo | tiny baby sloth made of soft snow, little knitted snow hat, sleepy | sloth with icy blue fur and frost crystals on its arms, hanging from an icicle | large majestic ice sloth with a glacier crown and snowflakes floating around |
| 009 | Cantaru → Melodiru → Sinfonuru | Som | tiny brown songbird (uirapuru) with musical note shaped crest | songbird with glowing musical notes floating around it, singing | large elegant songbird with rainbow sound waves coming from its beak, conductor pose |
| 010 | Estrelim → Constelão → Galaxiá | Estrela | tiny baby anteater with dark blue fur covered in tiny constellations | anteater with glowing star patterns and a moon on its forehead | large cosmic anteater whose fur looks like a galaxy, surrounded by shooting stars |

## 011 a 020 (30 imagens) — pedidas em 04/11/2026

As descrições completas estão em `arte/sabimons/lista.json`.

| Nº | Nomes (forma 1 → 2 → 3) | Bicho | Tipo | Raridade |
| --- | --- | --- | --- | --- |
| 011 | Bolhudo → Bolhão → Maremanso | peixe-boi | Água | ★ |
| 012 | Folhapé → Saltifolha → Pereflora | perereca | Planta | ★ |
| 013 | Tucanuvem → Bicorrente → Tucaventania | tucano | Vento | ★ |
| 014 | Areiruga → Conchaduna → Tartamaré | tartaruga-marinha (sempre de quatro) | Areia | ★ |
| 015 | Faiscaraqué → Voltaraqué → Trovaraqué | poraquê | Raio | ★★ |
| 016 | Guarabrasa → Juballama → Guaravulcão | lobo-guará (sem cauda de fogo) | Fogo | ★★ |
| 017 | Antarocha → Pedranta → Montanta | anta | Pedra | ★★ |
| 018 | Geladim → Pinguigelo → Glaciguim | pinguim-de-magalhães (preto e branco) | Gelo | ★★★ |
| 019 | Bugiurro → Ecobugio → Bugitroante | bugio | Som | ★★★ |
| 020 | Oncelestre → Onçastral → Constelonça | onça-pintada | Estrela | ★★★★ |
| 021 | Ondorca → Marorca → Tsunorca | orca (contorno turquesa) | Água | ★★★ |
| 022 | Sacizinho → Redemoinhaci → Saciclone | Saci (lenda; respeitoso, sem caricatura) | Vento | ★★★★ |
| 023 | Curupirinha → Pegadapira → Curupirão | Curupira (lenda; pés virados para trás) | Planta | ★★★ |
| 024 | Faiscamula → Mulabrasa → Mulavulcão | Mula sem cabeça (lenda; fogo com olhinhos, sem medo) | Fogo | ★★★ |
| 025 | Caiporita → Caipotrilha → Caiporainha | Caipora (lenda; montada num queixada) | Pedra | ★★★ |
| 026 | Faiscatá → Chamatá → Boitatão | Boitatá (lenda; cobra de fogo) | Fogo | ★★★★ |
| 027 | Iarinha → Cantaiara → Rainhiara | Iara (lenda; sereia dos rios) | Água | ★★★★ |
| 028 | Uivinho → Uivolua → Lobisolar | Lobisomem (lenda; sem dar medo) | Estrela | ★★★ |
| 029 | Bumbinho → Bumbazão → Bumbaréu | Boi-bumbá (festa) | Som | ★★★ |

## Onde salvar

- Salve cada imagem em **`arte/sabimons/originais/`** com o nome **`<número>-<forma>.png`**:
  `001-1.png`, `001-2.png`, `001-3.png`, `002-1.png` … `010-3.png` (30 arquivos).
- Se gerar várias versões e escolher uma, salve só a escolhida com esse nome
  (as outras podem ir em `arte/sabimons/rascunhos/` se quiser guardar).
- Faça commit e push na branch `main` do repositório `lucasrpanzarin/sabidex-`
  com a mensagem "Arte: Sabimons 001 a 010".
- **Não mexa em `src/` nem em `public/`**: recortar o fundo, otimizar e colocar as imagens
  no app é feito na outra conversa.

## Checklist antes de terminar

- [ ] 30 imagens, nomes certos, 1:1, fundo branco liso, sem texto
- [ ] As 3 formas de cada Sabimon claramente do mesmo bicho
- [ ] Nenhum desenho parecido com personagem de outro jogo
