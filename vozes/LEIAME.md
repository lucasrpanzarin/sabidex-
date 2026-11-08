# Vozes do Sabidex

As narrações são geradas pelo ElevenLabs através do GitHub (arquivo `.github/workflows/vozes.yml`).

- A chave fica em **Settings → Secrets and variables → Actions → `ELEVENLABS_API_KEY`**. Nunca coloque a chave em arquivos do repositório.
- Para pedir algo, edite `vozes/pedido.json` (ações: `listar`, `amostra`, `gerar`). O resultado aparece em `vozes/resultado.json`.
- Nas ações `gerar` e `matematica`, áudios que já existem não são gravados de novo (não gastam créditos). Para regravar, ponha `"refazer": true` no pedido.
