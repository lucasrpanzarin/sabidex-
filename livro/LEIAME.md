# Robô do livro

O robô transforma fotos das páginas do livro da escola num capítulo do Sabidex.
Ele roda no GitHub (arquivo `.github/workflows/livro.yml`) usando o Claude.

- A chave fica em **Settings → Secrets and variables → Actions → `ANTHROPIC_API_KEY`**. Nunca coloque a chave em arquivos do repositório.
- Como ele pensa (perguntas, jogos, idade): veja `docs/ESTUDOS.md`.

## Passo a passo

1. **Fotos.** Crie a pasta `livro/<capitulo>/fotos/` (ex.: `livro/historia-11/fotos/`) e coloque uma foto por página,
   com nomes em ordem: `pagina-01.jpg`, `pagina-02.jpg`... Em JPG ou PNG (no iPhone: Ajustes → Câmera → Formatos → "Mais compatível").
   Dicas: página inteira na foto, de cima, com luz boa, sem sombra da mão e sem tremer.
2. **Pedido.** Crie ou edite `livro/pedido.json`:
   ```json
   { "acao": "tudo", "capitulo": "historia-11", "materia": "História", "numero": 11, "ano": 4 }
   ```
   - `acao`: `ler` (só transcreve as fotos), `gerar` (só cria o capítulo), `conferir` (só a revisão) ou `tudo`.
   - `ano`: ano escolar da criança. Muda o tamanho das frases e o tipo de pergunta.
3. **Esperar.** Em alguns minutos o GitHub salva o resultado em `livro/resultado.json`.

## O que o robô entrega

| Arquivo | O que é |
|---|---|
| `livro/<capitulo>/paginas.md` | O texto de cada página, copiado do livro. Trechos que ele não conseguiu ler aparecem como `[ILEGÍVEL]`. |
| `src/data/<capitulo>.ts` | O **rascunho** do capítulo, no formato do app (temas, memória, linha do tempo, quiz, prova e 12 cartas). |
| `livro/<capitulo>/capitulo.json` | O mesmo conteúdo com a **página do livro** de onde saiu cada item, mais material extra para jogos futuros. |
| `livro/<capitulo>/conferencia.md` | A revisão feita por um segundo robô: erros, pontos de atenção e o que ficou de fora. |

## Antes de publicar

O rascunho **não entra no app sozinho**. Para publicar:

1. Leia `conferencia.md` e corrija os erros no arquivo do capítulo (dá para pedir ao Claude).
2. Confira datas e nomes com o livro (`capitulo.json` diz a página de cada item).
3. Coloque o capítulo na lista em `src/data/index.ts`.
4. Peça as narrações em `vozes/pedido.json`.
5. `npm test` e `npm run build` precisam passar.
