// Pronúncia em inglês (Lucas, 17/11/2026): a criança toca numa palavra em inglês e ouve como se fala.
// Usa a voz em inglês que já vem no celular (speechSynthesis): sem custo e sem arquivo de áudio.
// A escolha "Nina" ou "Otto" da fase 1 vale aqui também: Nina = voz de mulher, Otto = voz de homem.

export type Genero = 'mulher' | 'homem';

/** O aparelho sabe falar? (alguns navegadores antigos não sabem; aí o botão nem aparece) */
export const podeFalar = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

// Nomes das vozes em inglês mais comuns no iPhone, Android, Windows e Mac (o navegador não diz se é homem ou mulher).
const HOMENS = /\b(aaron|fred|alex|daniel|arthur|tom|ralph|rishi|oliver|evan|gordon|reed|rocko|grandpa|eddy|guy|david|mark|ryan|christopher|eric|roger|steffan|andrew|brian|male|-iom-|-tpd-|-tpc-|-iol-)/i;
const MULHERES = /\b(samantha|ava|allison|susan|victoria|karen|moira|tessa|fiona|serena|kathy|nicky|zoe|shelley|sandy|flo|grandma|zira|aria|jenny|michelle|emma|ana|libby|sonia|natasha|female|google us english|-sfg-|-tpf-)/i;

const ehIngles = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().startsWith('en');
const ehAmericana = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase() === 'en-us';

/** Melhor voz em inglês do aparelho para o gênero pedido: americana primeiro (o livro usa "movie theater"). */
function vozIngles(g: Genero): { voz?: SpeechSynthesisVoice; achouGenero: boolean } {
  const vozes = window.speechSynthesis.getVoices().filter(ehIngles);
  const doGenero = vozes.filter((v) => (g === 'homem' ? HOMENS : MULHERES).test(v.name) && !(g === 'homem' ? MULHERES : HOMENS).test(v.name));
  const melhor = (l: SpeechSynthesisVoice[]) => l.find((v) => ehAmericana(v) && v.localService) ?? l.find(ehAmericana) ?? l[0];
  const voz = melhor(doGenero);
  return voz ? { voz, achouGenero: true } : { voz: melhor(vozes), achouGenero: false };
}

/** Fala o texto em inglês, devagar. Tira os ** de negrito. */
export function falarIngles(texto: string, g: Genero = 'mulher') {
  if (!podeFalar()) return;
  const s = window.speechSynthesis;
  s.cancel();
  const u = new SpeechSynthesisUtterance(texto.replace(/\*\*/g, ''));
  u.lang = 'en-US';
  u.rate = 0.8;
  const { voz, achouGenero } = vozIngles(g);
  if (voz) u.voice = voz;
  // Sem voz do gênero certo no aparelho: muda o tom, para Nina e Otto não soarem iguais.
  if (!achouGenero) u.pitch = g === 'homem' ? 0.6 : 1.3;
  s.speak(u);
}

// Em alguns celulares a lista de vozes só chega depois: pede logo, para a primeira fala já sair em inglês.
if (podeFalar()) { try { window.speechSynthesis.getVoices(); } catch { /* */ } }
