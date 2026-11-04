// Confere o "crachá" (ID token) que o Google ou a Apple entregam quando o adulto entra com a conta deles.
// O crachá é assinado pela empresa; aqui conferimos a assinatura com as chaves públicas dela,
// para quem é (aud), quem emitiu (iss) e se ainda vale (exp).

export interface Provedor {
  nome: 'google' | 'apple';
  chaves: string;
  emissores: string[];
}

export const GOOGLE: Provedor = { nome: 'google', chaves: 'https://www.googleapis.com/oauth2/v3/certs', emissores: ['https://accounts.google.com', 'accounts.google.com'] };
export const APPLE: Provedor = { nome: 'apple', chaves: 'https://appleid.apple.com/auth/keys', emissores: ['https://appleid.apple.com'] };

export interface Cracha { sub: string; email: string; emailVerificado: boolean; nome?: string }

type Jwk = JsonWebKey & { kid?: string };
type BuscarChaves = (url: string) => Promise<Jwk[]>;

const cache = new Map<string, { chaves: Jwk[]; ate: number }>();
const buscarPadrao: BuscarChaves = async (url) => {
  const c = cache.get(url);
  if (c && c.ate > Date.now()) return c.chaves;
  const r = await fetch(url);
  if (!r.ok) throw new Error('chaves indisponíveis');
  const { keys } = (await r.json()) as { keys: Jwk[] };
  cache.set(url, { chaves: keys, ate: Date.now() + 3_600_000 });
  return keys;
};

const b64url = (s: string) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '='));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};
const json = (s: string) => JSON.parse(new TextDecoder().decode(b64url(s)));

/** Devolve os dados do crachá, ou null se ele não for válido. */
export async function conferirCracha(token: string, p: Provedor, clienteId: string, buscar: BuscarChaves = buscarPadrao, agora = Date.now()): Promise<Cracha | null> {
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  let cab, dados;
  try { cab = json(partes[0]); dados = json(partes[1]); } catch { return null; }
  if (cab.alg !== 'RS256' || typeof cab.kid !== 'string') return null;
  const jwk = (await buscar(p.chaves)).find((k) => k.kid === cab.kid);
  if (!jwk) return null;
  const chave = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', chave, b64url(partes[2]), new TextEncoder().encode(`${partes[0]}.${partes[1]}`));
  if (!ok) return null;
  const aud = Array.isArray(dados.aud) ? dados.aud : [dados.aud];
  if (!aud.includes(clienteId)) return null;
  if (!p.emissores.includes(dados.iss)) return null;
  if (typeof dados.exp !== 'number' || dados.exp * 1000 < agora - 60_000) return null;
  if (typeof dados.sub !== 'string' || typeof dados.email !== 'string') return null;
  const verificado = dados.email_verified === true || dados.email_verified === 'true';
  return { sub: dados.sub, email: dados.email.toLowerCase(), emailVerificado: verificado, nome: typeof dados.name === 'string' ? dados.name : undefined };
}
