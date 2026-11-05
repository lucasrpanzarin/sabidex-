// Figurinha de conquista (Meu perfil). Desenhos em SVG, sem emoji (design-system/sabidex/MASTER.md).
import type { CorConquista, Desenho } from '../lib/conquistas';

const TRACOS: Record<Desenho, React.ReactNode> = {
  passo: <><path d="M7 21V4" /><path d="M7 5h10l-2.5 4L17 13H7" /></>,
  livro: <><path d="M3 6h6a3 3 0 013 3v10a2 2 0 00-2-2H3z" /><path d="M21 6h-6a3 3 0 00-3 3v10a2 2 0 012-2h7z" /></>,
  mundo: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17" /><path d="M12 3.5c2.6 2.4 2.6 14.6 0 17M12 3.5c-2.6 2.4-2.6 14.6 0 17" /></>,
  nota: <><path d="M6 8l2-1.5V17" /><ellipse cx="14.5" cy="12" rx="3" ry="5" /></>,
  estrela: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" />,
  carta: <><rect x="5.5" y="3" width="13" height="18" rx="2.5" /><path d="M12 8.5l1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 14.5l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" /></>,
  evoluir: <><path d="M6 13l6-6 6 6" /><path d="M6 19l6-6 6 6" /></>,
  lendaria: <><path d="M4 9l3.5 3L12 5l4.5 7L20 9l-2 10H6z" /><path d="M6 19h12" /></>,
  chama: <path d="M12 3c1 3.5 5.5 5.5 5.5 10a5.5 5.5 0 01-11 0c0-2.2 1.2-3.6 2.4-4.6.6 1.4 1.6 2.4 1.6 2.4S12.5 8 12 3z" />,
  nivel: <><path d="M12 20V6" /><path d="M6.5 11.5L12 6l5.5 5.5" /><path d="M5 20h14" /></>,
  calendario: <><rect x="4" y="5.5" width="16" height="14.5" rx="2.5" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /><path d="M9 14.5l2 2 4-4" /></>,
};

export function Medalha({ desenho, cor, ganhou, tamanho = 64 }: { desenho: Desenho; cor: CorConquista; ganhou: boolean; tamanho?: number }) {
  return (
    <span aria-hidden="true" style={{
      width: tamanho, height: tamanho, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center',
      background: ganhou ? `var(--${cor})` : '#E9E2D2', border: `3px solid ${ganhou ? 'var(--ink)' : '#B9B09C'}`,
      boxShadow: ganhou ? '3px 3px 0 var(--ink), inset 0 -4px 0 #00000022, inset 0 3px 0 #FFFFFF77' : 'none',
    }}>
      <span style={{ width: tamanho * 0.66, height: tamanho * 0.66, borderRadius: '50%', display: 'grid', placeItems: 'center', background: ganhou ? '#FFFFFFE6' : '#F4EFE4' }}>
        <svg width={tamanho * 0.44} height={tamanho * 0.44} viewBox="0 0 24 24" fill="none" stroke={ganhou ? 'var(--ink)' : '#A39A86'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          {TRACOS[desenho]}
        </svg>
      </span>
    </span>
  );
}
