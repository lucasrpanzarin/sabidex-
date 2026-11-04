# Tarefa: gerar os desenhos dos 10 primeiros Sabimons (Higgsfield)

Este arquivo é para a conversa do Claude que vai gerar as imagens com o Higgsfield.
O resto do app já está pronto; aqui só entra a arte.

## Contexto

O **Sabidex** é um app de estudo para crianças de 9 a 11 anos (veja `CLAUDE.md`).
Os **Sabimons** são os bichos colecionáveis do app: vêm nos pacotes, têm 3 formas (evoluções)
e serão 99 no total. Todos são **inspirados em bichos brasileiros** e precisam ter design
**original** — nada que lembre Pokémon, Digimon ou outra marca.

Guia completo (regras, tipos, raridades): https://claude.ai/artifact/9tkM6RnY4cqX4djDaSxQG5

## Estilo (igual para todos os 99)

- Personagem **3D fofo estilo brinquedo de vinil**, formas arredondadas, olhos grandes e brilhantes, rosto simpático.
- Cores vivas e saturadas (o app tem fundo azul-noite com neon turquesa, rosa e amarelo).
- **Um bicho por imagem**, corpo inteiro, de frente/três-quartos, centralizado.
- Forma 1 = pequena e fofa · Forma 2 = jovem e confiante · Forma 3 = grande e poderosa.
  **Mesmo rosto, mesmas cores e mesmos traços nas 3 formas**, para dar para reconhecer a evolução.
  Gere a forma 1 primeiro e use-a como imagem de referência para as formas 2 e 3.
- Formato **quadrado 1:1**, mínimo **1024 × 1024**, **fundo branco liso** (o recorte do fundo é feito depois).
- **Sem texto, sem logo, sem moldura, sem cenário.**

## Pedido-modelo

Troque `[DESCRIÇÃO]` pela descrição da tabela:

```
Cute collectible creature character, 3D vinyl toy style, soft rounded shapes, big shiny expressive eyes, friendly face, vibrant saturated colors, smooth soft studio lighting, full body, front three-quarter view, centered, plain white background, no text, no logo, no frame. Original design, not based on any existing franchise. [DESCRIÇÃO]
```

## Os 10 primeiros (30 imagens)

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
