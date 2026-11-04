#!/usr/bin/env bash
# Início de sessão: entrega ao Claude a skill "using-superpowers",
# que ensina a usar as outras skills do Superpowers (brainstorming, planos,
# depuração, verificação antes de concluir...).
# Substitui o gancho do plugin original, que não roda nas sessões na nuvem.

arquivo="${CLAUDE_PROJECT_DIR:-.}/.claude/skills/using-superpowers/SKILL.md"

if [ -r "$arquivo" ]; then
  printf '<EXTREMELY_IMPORTANT>\nVocê tem superpowers. As skills ficam em .claude/skills/.\n'
  printf 'Quando um texto citar "superpowers:NOME", use a skill NOME (sem o prefixo).\n\n'
  printf 'Conteúdo da skill using-superpowers:\n\n'
  cat "$arquivo"
  printf '\n</EXTREMELY_IMPORTANT>\n'
fi
exit 0
