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

export interface Parte { texto: string; ingles: boolean }

/**
 * Separa o texto de um tema em pedaços em português e em inglês (para a narração pronunciar o inglês com sotaque de inglês).
 * É inglês: o que está em **negrito** ou "entre aspas" e aparece nas falas do capítulo (`falasDoCapitulo`).
 */
export function partesIngles(texto: string, falas: string[]): Parte[] {
  const conhecidas = falas.map((f) => f.toLowerCase());
  const limpa = (s: string) => s.toLowerCase().replace(/\.{3}$/, '').replace(/[?!.,:]+$/, '').trim();
  const ehIngles = (s: string) => { const l = limpa(s); return l.length > 0 && /^[a-z0-9' ,.?!-]+$/i.test(s.normalize('NFD').replace(/[̀-ͯ]/g, '')) && conhecidas.some((f) => f.includes(l)); };
  const partes: Parte[] = [];
  const junta = (t: string, ingles: boolean) => {
    if (!t) return;
    const ult = partes[partes.length - 1];
    if (ult && ult.ingles === ingles) ult.texto += t; else partes.push({ texto: t, ingles });
  };
  // pedaços marcados: **...** ou "..."
  const re = /\*\*(.+?)\*\*|"([^"]+)"/g;
  let i = 0;
  for (const m of texto.matchAll(re)) {
    junta(texto.slice(i, m.index), false);
    const dentro = m[1] ?? m[2];
    if (m[2] !== undefined && dentro.startsWith('**') && dentro.endsWith('**')) { const d = dentro.slice(2, -2); junta(d, ehIngles(d)); }
    else if (m[2] !== undefined && !ehIngles(dentro)) { junta(dentro, false); }
    else if (m[1] !== undefined && dentro.includes('"')) { for (const p of partesIngles(dentro, falas)) junta(p.texto, p.ingles); }
    else junta(dentro, ehIngles(dentro));
    i = m.index! + m[0].length;
  }
  junta(texto.slice(i), false);
  // Palavras em inglês soltas no texto (sem negrito nem aspas), como "library" em "library não é livraria".
  // Ficam de fora as que também são palavras em português (hospital, café...).
  const PORTUGUES = new Set(['hospital', 'café', 'cafe']);
  const soltas = [...new Set(falas.flatMap((f) => [f, ...f.split(/[\s,.?!]+/)]).map(limpa))]
    .filter((f) => f.length >= 4 && !PORTUGUES.has(f)).sort((a, b) => b.length - a.length);
  const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const reSoltas = soltas.length ? new RegExp(`(?<![\\p{L}'])(${soltas.map(esc).join('|')})(?![\\p{L}'])(\\.\\.\\.)?`, 'giu') : null;
  const final: Parte[] = [];
  const poe = (t: string, ingles: boolean) => { if (!t) return; const u = final[final.length - 1]; if (u && u.ingles === ingles) u.texto += t; else final.push({ texto: t, ingles }); };
  for (const p of partes) {
    if (p.ingles || !reSoltas) { poe(p.texto, p.ingles); continue; }
    let k = 0;
    for (const m of p.texto.matchAll(reSoltas)) { poe(p.texto.slice(k, m.index), false); poe(m[0], true); k = m.index! + m[0].length; }
    poe(p.texto.slice(k), false);
  }
  // "your" + " " + "neighborhood" viram um pedaço só em inglês.
  for (let j = final.length - 2; j > 0; j--) {
    if (!final[j].ingles && !final[j].texto.trim() && final[j - 1].ingles && final[j + 1].ingles) {
      final.splice(j - 1, 3, { texto: final[j - 1].texto + final[j].texto + final[j + 1].texto, ingles: true });
    }
  }
  partes.splice(0, partes.length, ...final);
  return partes.map((p) => ({ ...p, texto: p.texto.replace(/\*\*/g, '') })).filter((p) => p.texto.trim());
}
