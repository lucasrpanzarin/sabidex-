// Arquivos de áudio das palavras em inglês (Lucas, 17/11/2026), gravados com a Nina e o Otto pelo ElevenLabs
// (pedido {"acao": "ingles"} em vozes/pedido.json). Ficam em public/audio/<voz>/en/<nome>.mp3.
// Este arquivo não usa nada do navegador: o script de vozes também usa.
import type { Capitulo } from '../data/tipos';

/** "She's at the hospital." → "audio/en/shes-at-the-hospital.mp3" (mesmo texto, mesmo arquivo). */
export function arquivoIngles(texto: string) {
  const base = texto.replace(/\*\*/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  // nome curto: frases compridas ganham um número para não colidir
  if (base.length <= 50) return `audio/en/${base}.mp3`;
  let h = 0;
  for (const c of base) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `audio/en/${base.slice(0, 40)}-${h.toString(36)}.mp3`;
}

/** Tudo o que tem botão de ouvir em inglês: os `falar` dos temas e as palavras do jogo da memória. */
export function falasDoCapitulo(cap: Capitulo): string[] {
  if (cap.materia !== 'Inglês') return [];
  return [...new Set([...cap.temas.flatMap((t) => t.falar ?? []), ...cap.pares.map((p) => p.palavra)])];
}
