// "Entrar com Google" e "Entrar com Apple" (só na área dos adultos).
// Os scripts das empresas só carregam quando o adulto abre a tela de entrar,
// e só se o servidor estiver configurado (veja /api/config).

export interface ConfigServidor { google: string | null; apple: string | null; recuperarSenha: boolean }

let config: Promise<ConfigServidor> | null = null;
export function lerConfig(): Promise<ConfigServidor> {
  config ??= fetch('/api/config').then((r) => r.json() as Promise<ConfigServidor>).catch(() => ({ google: null, apple: null, recuperarSenha: false }));
  return config;
}

const carregados = new Map<string, Promise<void>>();
function carregar(src: string) {
  let p = carregados.get(src);
  if (!p) {
    p = new Promise<void>((ok, falha) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => ok(); s.onerror = () => { carregados.delete(src); falha(new Error('script')); };
      document.head.appendChild(s);
    });
    carregados.set(src, p);
  }
  return p;
}

interface GoogleId {
  initialize(o: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string }): void;
  renderButton(el: HTMLElement, o: Record<string, unknown>): void;
}
interface AppleAuth {
  init(o: Record<string, unknown>): void;
  signIn(): Promise<{ authorization: { id_token: string }; user?: { name?: { firstName?: string; lastName?: string } } }>;
}
declare global { interface Window { google?: { accounts: { id: GoogleId } }; AppleID?: { auth: AppleAuth } } }

/** Desenha o botão oficial do Google dentro de `el`. `aoEntrar` recebe o crachá (ID token). */
export async function botaoGoogle(el: HTMLElement, clienteId: string, aoEntrar: (token: string) => void) {
  await carregar('https://accounts.google.com/gsi/client');
  const g = window.google?.accounts.id;
  if (!g) throw new Error('google');
  g.initialize({ client_id: clienteId, callback: (r) => aoEntrar(r.credential) });
  g.renderButton(el, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', locale: 'pt-BR', width: Math.min(el.clientWidth || 320, 400) });
}

/** Abre a janela da Apple. Devolve o crachá e o nome (a Apple só manda o nome na primeira vez). */
export async function entrarApple(clienteId: string) {
  await carregar('https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/pt_BR/appleid.auth.js');
  const a = window.AppleID?.auth;
  if (!a) throw new Error('apple');
  a.init({ clientId: clienteId, scope: 'name email', redirectURI: location.origin + '/', usePopup: true });
  const r = await a.signIn();
  const n = r.user?.name;
  return { token: r.authorization.id_token, nome: n ? [n.firstName, n.lastName].filter(Boolean).join(' ') : undefined };
}
