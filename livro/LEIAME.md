# Capítulos a partir do livro

Os capítulos são criados **aqui na conversa com o Claude**, sem custo extra de API.

## Passo a passo

1. Abra uma conversa com o Claude neste projeto e diga, por exemplo:
   "Capítulo 11 de História, 4º ano. Vou mandar as fotos."
2. Mande as fotos das páginas (de 4 a 6 por vez). Dicas: página inteira, de cima, com luz boa, sem tremer.
3. O Claude:
   - copia o texto de cada página em `livro/<capitulo>/paginas.md` (o que não der para ler fica marcado `[ILEGÍVEL]`, e ele pede outra foto);
   - cria o capítulo em `src/data/` usando só o que está no livro;
   - confere tudo (`npm run conferir`), coloca no app e salva no GitHub.
4. Você confere as datas e os nomes principais com o livro (`livro/<capitulo>/fontes.md` diz a página de cada item).
5. Peça as narrações em `vozes/pedido.json`.

As fotos não ficam guardadas no repositório, só o texto copiado.
As regras que o Claude segue estão em `.claude/skills/capitulo-do-livro/SKILL.md` e `docs/ESTUDOS.md`.
