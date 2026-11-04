import { describe, expect, it } from 'vitest';
import { conferirCracha, GOOGLE } from './jwt';

const b64url = (b: Uint8Array | string) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function montar(dados: Record<string, unknown>, kid = 'k1') {
  const par = (await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const pub = { ...((await crypto.subtle.exportKey('jwk', par.publicKey)) as JsonWebKey), kid };
  const corpo = `${b64url(JSON.stringify({ alg: 'RS256', kid }))}.${b64url(JSON.stringify(dados))}`;
  const ass = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', par.privateKey, new TextEncoder().encode(corpo)));
  return { token: `${corpo}.${b64url(ass)}`, buscar: async () => [pub] };
}

const base = () => ({ iss: 'https://accounts.google.com', aud: 'cliente', sub: '123', email: 'Pai@Exemplo.com', email_verified: true, name: 'Pai', exp: Math.floor(Date.now() / 1000) + 600 });

describe('crachá do Google/Apple', () => {
  it('aceita um crachá válido', async () => {
    const { token, buscar } = await montar(base());
    expect(await conferirCracha(token, GOOGLE, 'cliente', buscar)).toEqual({ sub: '123', email: 'pai@exemplo.com', emailVerificado: true, nome: 'Pai' });
  });
  it('recusa crachá de outro app, vencido ou de outro emissor', async () => {
    for (const mudar of [{ aud: 'outro' }, { exp: Math.floor(Date.now() / 1000) - 3600 }, { iss: 'https://falso.com' }]) {
      const { token, buscar } = await montar({ ...base(), ...mudar });
      expect(await conferirCracha(token, GOOGLE, 'cliente', buscar)).toBeNull();
    }
  });
  it('recusa crachá alterado', async () => {
    const { token, buscar } = await montar(base());
    const [c, , a] = token.split('.');
    const falso = `${c}.${b64url(JSON.stringify({ ...base(), email: 'outro@x.com' }))}.${a}`;
    expect(await conferirCracha(falso, GOOGLE, 'cliente', buscar)).toBeNull();
    expect(await conferirCracha('lixo', GOOGLE, 'cliente', buscar)).toBeNull();
  });
});
