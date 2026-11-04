# Arte do Sabidex

Os desenhos dos Sabimons são gerados pelo Higgsfield através do GitHub (arquivo `.github/workflows/arte.yml`).

- A chave fica em **Settings → Secrets and variables → Actions → `HIGGSFIELD_API_KEY`**, no formato `key_id:key_secret`. Nunca coloque a chave em arquivos do repositório.
- A lista dos Sabimons e das descrições está em `arte/sabimons/lista.json`. O estilo vem de `docs/ARTE-SABIMONS.md`.
- Para pedir imagens, edite `arte/pedido.json` (ex.: `{"acao": "gerar", "formas": [1]}`). O resultado aparece em `arte/resultado.json` e as imagens em `arte/sabimons/originais/`.
- A forma 1 é feita só com o texto. As formas 2 e 3 usam a forma 1 como imagem de referência.
