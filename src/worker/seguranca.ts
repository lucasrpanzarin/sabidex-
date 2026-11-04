// Senhas, PINs e sessões. Nada é guardado em texto puro.

const enc = new TextEncoder();
const hex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

export function aleatorio(bytes = 16) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return hex(a);
}

/** PBKDF2-SHA256 com sal. */
export async function hashSegredo(segredo: string, sal: string, iteracoes = 100_000) {
  const chave = await crypto.subtle.importKey('raw', enc.encode(segredo), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(sal), iterations: iteracoes }, chave, 256);
  return hex(bits);
}

export async function sha256(s: string) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
}

/** Compara sem vazar tempo. */
export function iguais(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export function pinAleatorio() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(a[0] % 10000).padStart(4, '0');
}
