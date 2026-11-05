// Aviso "Coloque o Sabidex na tela do celular": ensina a adicionar o site à tela de início (iPhone e Android).
// Some quando o app já está aberto pelo ícone, no computador, ou por 7 dias depois de "Agora não".
import { useEffect, useState, type ReactNode } from 'react';

type Sistema = 'iphone' | 'android' | 'outro';
type PedidoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const K = 'sabidex:instalar-depois';
const SETE_DIAS = 7 * 24 * 60 * 60 * 1000;

// O Android avisa uma vez só, logo no começo, que dá para instalar: guardamos o aviso para o botão "Instalar".
let pedido: PedidoInstalar | null = null;
const ouvintes = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (ev) => { ev.preventDefault(); pedido = ev as PedidoInstalar; ouvintes.forEach((f) => f()); });
  window.addEventListener('appinstalled', () => { pedido = null; ouvintes.forEach((f) => f()); });
}

export function sistema(ua = navigator.userAgent, toques = navigator.maxTouchPoints ?? 0): Sistema {
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && toques > 1)) return 'iphone';
  if (/Android/i.test(ua)) return 'android';
  return 'outro';
}

function jaInstalado() {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

function adiado() {
  try { return Date.now() - Number(localStorage.getItem(K) ?? 0) < SETE_DIAS; } catch { return false; }
}

export function InstalarApp() {
  const [so] = useState(sistema);
  const [escondido, setEscondido] = useState(() => so === 'outro' || jaInstalado() || adiado());
  const [aberto, setAberto] = useState(false);
  const [, atualizar] = useState(0);

  useEffect(() => {
    const f = () => atualizar((n) => n + 1);
    ouvintes.add(f);
    return () => { ouvintes.delete(f); };
  }, []);

  if (escondido || jaInstalado()) return null;

  const depois = () => {
    try { localStorage.setItem(K, String(Date.now())); } catch { /* sem armazenamento */ }
    setEscondido(true);
  };
  const instalar = async () => {
    if (!pedido) return;
    await pedido.prompt();
    pedido = null;
    setEscondido(true);
  };

  return (
    <section className="painel coluna instalar" aria-label="Colocar o Sabidex na tela do celular" style={{ textAlign: 'left', width: '100%' }}>
      <div className="linha" style={{ alignItems: 'flex-start' }}>
        <img src="icons/icon-192.png" alt="" width={48} height={48} style={{ borderRadius: 12, border: '2px solid var(--ink)', flex: 'none' }} />
        <div style={{ flex: 1 }}>
          <span className="display" style={{ fontSize: 19, display: 'block' }}>Coloque o Sabidex na tela do celular</span>
          <span className="small" style={{ fontWeight: 700, display: 'block', marginTop: 2 }}>Ele vira um app: é só tocar no ícone para estudar.</span>
        </div>
      </div>

      {!aberto && (
        <div className="linha" style={{ flexWrap: 'wrap', gap: 8 }}>
          {pedido
            ? <button type="button" className="btn btn-verde" onClick={instalar}>Instalar agora</button>
            : <button type="button" className="btn btn-ciano" onClick={() => setAberto(true)}>Como fazer?</button>}
          <button type="button" className="voltar" style={{ alignSelf: 'center' }} onClick={depois}>Agora não</button>
        </div>
      )}

      {aberto && (
        <>
          {so === 'iphone' ? <PassosIphone /> : <PassosAndroid />}
          <div className="linha" style={{ flexWrap: 'wrap', gap: 8 }}>
            <button type="button" className="btn btn-verde" onClick={() => setEscondido(true)}>Pronto!</button>
            <button type="button" className="voltar" style={{ alignSelf: 'center' }} onClick={() => setAberto(false)}>Fechar</button>
          </div>
        </>
      )}
    </section>
  );
}

function Passo({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="linha" style={{ alignItems: 'flex-start', gap: 10 }}>
      <span className="instalar-num" aria-hidden="true">{n}</span>
      <span style={{ flex: 1, fontWeight: 700, lineHeight: 1.35 }}>{children}</span>
    </li>
  );
}

function PassosIphone() {
  return (
    <>
      <span className="eyebrow" style={{ color: 'var(--t-cyan)' }}>No iPhone ou iPad</span>
      <ol className="coluna" style={{ listStyle: 'none', padding: 0, margin: 0, gap: 10 }}>
        <Passo n={1}>Abra este site no <strong>Safari</strong>.</Passo>
        <Passo n={2}>Toque em <strong>Compartilhar</strong>: o quadrado com uma setinha para cima <Compartilhar />. Se não achar, toque antes nos <strong>três pontinhos •••</strong>.</Passo>
        <Passo n={3}>Desça a lista e toque em <strong>Adicionar à Tela de Início</strong> <Mais />.</Passo>
        <Passo n={4}>Toque em <strong>Adicionar</strong>. Pronto! O Sabidex aparece junto com os seus apps.</Passo>
      </ol>
    </>
  );
}

function PassosAndroid() {
  return (
    <>
      <span className="eyebrow" style={{ color: 'var(--t-green)' }}>No Android</span>
      <ol className="coluna" style={{ listStyle: 'none', padding: 0, margin: 0, gap: 10 }}>
        <Passo n={1}>Abra este site no <strong>Chrome</strong>.</Passo>
        <Passo n={2}>Toque nos <strong>três pontinhos ⋮</strong> lá em cima, no canto direito.</Passo>
        <Passo n={3}>Toque em <strong>Adicionar à tela inicial</strong> (ou <strong>Instalar app</strong>).</Passo>
        <Passo n={4}>Toque em <strong>Instalar</strong> ou <strong>Adicionar</strong>. Pronto! O Sabidex aparece junto com os seus apps.</Passo>
      </ol>
    </>
  );
}

// Desenhos pequenos dos botões do iPhone, para a criança reconhecer.
function Compartilhar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: '-3px', color: 'var(--t-cyan)' }}>
      <path d="M12 3v12M8 7l4-4 4 4M7 11H5v10h14V11h-2" />
    </svg>
  );
}
function Mais() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" style={{ verticalAlign: '-3px', color: 'var(--t-cyan)' }}>
      <rect x="4" y="4" width="16" height="16" rx="4" /><path d="M12 8v8M8 12h8" />
    </svg>
  );
}
