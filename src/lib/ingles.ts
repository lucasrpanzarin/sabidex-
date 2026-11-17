// Pronúncia em inglês (Lucas, 17/11/2026): a criança toca numa palavra em inglês e ouve como se fala.
// Usa a voz em inglês que já vem no celular (speechSynthesis): sem custo e sem arquivo de áudio.

/** O aparelho sabe falar? (alguns navegadores antigos não sabem; aí o botão nem aparece) */
export const podeFalar = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

/** Melhor voz em inglês do aparelho: americana primeiro (o livro usa "movie theater"), depois qualquer inglês. */
function vozIngles(): SpeechSynthesisVoice | undefined {
  const vozes = window.speechSynthesis.getVoices();
  return vozes.find((v) => v.lang.replace('_', '-').toLowerCase() === 'en-us' && v.localService)
    ?? vozes.find((v) => v.lang.replace('_', '-').toLowerCase() === 'en-us')
    ?? vozes.find((v) => v.lang.toLowerCase().startsWith('en'));
}

/** Fala o texto em inglês, devagar. Tira os ** de negrito. */
export function falarIngles(texto: string) {
  if (!podeFalar()) return;
  const s = window.speechSynthesis;
  s.cancel();
  const u = new SpeechSynthesisUtterance(texto.replace(/\*\*/g, ''));
  u.lang = 'en-US';
  u.rate = 0.8;
  const v = vozIngles();
  if (v) u.voice = v;
  s.speak(u);
}

// Em alguns celulares a lista de vozes só chega depois: pede logo, para a primeira fala já sair em inglês.
if (podeFalar()) { try { window.speechSynthesis.getVoices(); } catch { /* */ } }
