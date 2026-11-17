// Pronúncia em inglês (Lucas, 17/11/2026): a criança toca numa palavra em inglês e ouve como se fala.
// Primeiro tenta o áudio gravado (Nina ou Otto, em public/audio/<voz>/en/, veja src/lib/falaIngles.ts),
// que toca em qualquer celular. Se o arquivo ainda não existir, usa a voz em inglês do próprio celular.
import { arquivoIngles } from './falaIngles';

export type Genero = 'mulher' | 'homem';

const temVozDoCelular = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
/** Os botões aparecem sempre: com o áudio gravado, todo celular toca. */
export const podeFalar = () => typeof window !== 'undefined';

// Nomes das vozes em inglês mais comuns no iPhone, Android, Windows e Mac (o navegador não diz se é homem ou mulher).
const HOMENS = /\b(aaron|fred|alex|daniel|arthur|tom|ralph|rishi|oliver|evan|gordon|reed|rocko|grandpa|eddy|guy|david|mark|ryan|christopher|eric|roger|steffan|andrew|brian|male|-iom-|-tpd-|-tpc-|-iol-)/i;
const MULHERES = /\b(samantha|ava|allison|susan|victoria|karen|moira|tessa|fiona|serena|kathy|nicky|zoe|shelley|sandy|flo|grandma|zira|aria|jenny|michelle|emma|ana|libby|sonia|natasha|female|google us english|-sfg-|-tpf-)/i;

const ehIngles = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().startsWith('en');
const ehAmericana = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase() === 'en-us';

function vozIngles(g: Genero): { voz?: SpeechSynthesisVoice; achouGenero: boolean } {
  const vozes = window.speechSynthesis.getVoices().filter(ehIngles);
  const doGenero = vozes.filter((v) => (g === 'homem' ? HOMENS : MULHERES).test(v.name) && !(g === 'homem' ? MULHERES : HOMENS).test(v.name));
  const melhor = (l: SpeechSynthesisVoice[]) => l.find((v) => ehAmericana(v) && v.localService) ?? l.find(ehAmericana) ?? l[0];
  const voz = melhor(doGenero);
  return voz ? { voz, achouGenero: true } : { voz: melhor(vozes), achouGenero: false };
}

function vozDoCelular(texto: string, g: Genero) {
  if (!temVozDoCelular()) return;
  const s = window.speechSynthesis;
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = 'en-US';
  u.rate = 0.8;
  const { voz, achouGenero } = vozIngles(g);
  if (voz) u.voice = voz;
  if (!achouGenero) u.pitch = g === 'homem' ? 0.6 : 1.3;
  // No iPhone, cancelar e falar no mesmo instante faz a fala sumir: só cancela se algo estiver falando.
  if (s.speaking || s.pending) { s.cancel(); setTimeout(() => { s.resume(); s.speak(u); }, 120); }
  else { s.resume(); s.speak(u); }
}

let tocando: HTMLAudioElement | null = null;

/** Fala o texto em inglês: áudio gravado da Nina (mulher) ou do Otto (homem); sem áudio, a voz do celular. */
export function falarIngles(texto: string, g: Genero = 'mulher') {
  if (typeof window === 'undefined') return;
  const limpo = texto.replace(/\*\*/g, '');
  tocando?.pause();
  if (temVozDoCelular()) window.speechSynthesis.cancel();
  const arquivo = arquivoIngles(limpo).replace(/^audio\//, `audio/${g === 'homem' ? 'otto' : 'nina'}/`);
  const a = new Audio(import.meta.env.BASE_URL + arquivo);
  tocando = a;
  let reserva = false;
  const usarReserva = () => { if (reserva || tocando !== a) return; reserva = true; vozDoCelular(limpo, g); };
  a.onerror = usarReserva;
  a.play().catch((e: unknown) => { if (!(e instanceof DOMException && e.name === 'AbortError')) usarReserva(); });
}

// Em alguns celulares a lista de vozes só chega depois: pede logo.
if (temVozDoCelular()) { try { window.speechSynthesis.getVoices(); } catch { /* */ } }
