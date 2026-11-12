// Regra do botão "Voltar" do topo (Lucas, 12/11/2026): volta para a tela anterior do caminho da criança.
// Função pura, para poder testar (quem guarda o caminho é `src/lib/rota.ts`).

/** Telas de jogo ou de prêmio: o "Voltar" pula essas (não recomeça um jogo nem reabre pacote). */
export const telaDeJogo = (hash: string) => /^#\/(fase|extra|pacote|desafio|revisao)(\/|$)/.test(hash);

/** Para onde o "Voltar" leva: a última tela do caminho que não é jogo nem a própria tela. */
export function destinoVoltar(caminho: string[], aqui: string): { destino: string | null; resto: string[] } {
  const resto = [...caminho];
  while (resto.length) {
    const h = resto.pop()!;
    if (h !== aqui && !telaDeJogo(h)) return { destino: h, resto };
  }
  return { destino: null, resto };
}

