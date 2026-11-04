// Pacote que a criança rasga arrastando o dedo pela linha tracejada do topo.
// A aba de cima acompanha o dedo; soltando antes do fim, ela volta. No fim, a aba voa longe.
// Teclado: Enter ou espaço rasgam sozinhos. Tocar sem arrastar mostra a dica; no 3º toque, rasga sozinho.
// Com movimento reduzido no aparelho, um toque abre.

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Pacote } from './Pacote';

/** Altura do corte, em % da altura do pacote. */
const CORTE = 10;
const DENTES = 14;

// Serrilhado do rasgo: o mesmo desenho na aba e no resto do pacote, para encaixarem.
const pontos = Array.from({ length: DENTES + 1 }, (_, i) => `${(i / DENTES) * 100}% ${CORTE + (i % 2 ? 1.6 : -1.2)}%`);
const CLIP_ABA = `polygon(0 0, 100% 0, ${[...pontos].reverse().join(', ')})`;
const CLIP_CORPO = `polygon(${pontos.join(', ')}, 100% 100%, 0 100%)`;

interface Props {
  epico: boolean;
  texto: string;
  /** a aba já voou: o pacote cai e some */
  abrindo: boolean;
  /** chamado quando o rasgo chega ao fim */
  aoRasgar: () => void;
}

export function RasgarPacote({ epico, texto, abrindo, aoRasgar }: Props) {
  const [p, setP] = useState(0); // quanto já rasgou (0 a 1)
  const [lado, setLado] = useState<1 | -1>(1); // 1 = da esquerda para a direita
  const [arrastando, setArrastando] = useState(false);
  const [dica, setDica] = useState(0);
  const caixa = useRef<HTMLDivElement>(null);
  const inicio = useRef<{ x: number; y: number; moveu: boolean } | null>(null);
  const feito = useRef(false);

  const terminar = () => {
    if (feito.current) return;
    feito.current = true;
    setP(1);
    try { navigator.vibrate?.(30); } catch { /* sem vibração */ }
    aoRasgar();
  };

  /** Rasga sozinho (teclado). */
  const rasgarSozinho = () => {
    if (feito.current) return;
    const t0 = performance.now();
    const passo = (t: number) => {
      const q = Math.min(1, (t - t0) / 450);
      setP(q);
      if (q < 1) requestAnimationFrame(passo); else terminar();
    };
    requestAnimationFrame(passo);
  };

  const largura = () => (caixa.current?.getBoundingClientRect().width ?? 214) * 0.78;

  const baixar = (ev: PointerEvent<HTMLDivElement>) => {
    if (feito.current) return;
    inicio.current = { x: ev.clientX, y: ev.clientY, moveu: false };
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
  };
  const mover = (ev: PointerEvent<HTMLDivElement>) => {
    const i = inicio.current;
    if (!i || feito.current) return;
    const dx = ev.clientX - i.x;
    if (!i.moveu && Math.abs(dx) < 6) return;
    if (!i.moveu) { i.moveu = true; setLado(dx >= 0 ? 1 : -1); setArrastando(true); }
    const q = Math.max(0, Math.min(1, (dx * (dx >= 0 ? 1 : -1)) / largura()));
    setP(q);
    if (q >= 1) { inicio.current = null; setArrastando(false); terminar(); }
  };
  const soltar = () => {
    const i = inicio.current;
    inicio.current = null;
    setArrastando(false);
    if (feito.current) return;
    if (i && !i.moveu) {
      // Movimento reduzido: um toque abre. Quem tocou 3 vezes sem conseguir arrastar também ganha ajuda.
      let reduzido = false;
      try { reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* sem matchMedia */ }
      if (reduzido) { terminar(); return; }
      if (dica >= 2) { rasgarSozinho(); return; }
      setDica((n) => n + 1);
      return;
    }
    if (p > 0.85) terminar(); else setP(0);
  };
  const tecla = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); rasgarSozinho(); }
  };

  // A dica balança o pacote por um instante.
  const [balanca, setBalanca] = useState(false);
  useEffect(() => {
    if (!dica) return;
    setBalanca(true);
    const t = setTimeout(() => setBalanca(false), 450);
    return () => clearTimeout(t);
  }, [dica]);

  const giro = lado * p * 13;
  const aba = {
    clipPath: CLIP_ABA,
    transformOrigin: lado === 1 ? `100% ${CORTE}%` : `0% ${CORTE}%`,
    transform: `translateY(${-p * 10}px) rotate(${giro}deg)`,
    transition: arrastando || abrindo ? 'none' : 'transform .25s ease-out',
  };

  return (
    <div className="rasgar-area">
      <div
        ref={caixa}
        className={`rasgar${abrindo ? ' abrindo' : ''}${balanca ? ' dica' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Pacote fechado. Arraste o dedo na linha do topo para rasgar, ou aperte Enter."
        onPointerDown={baixar}
        onPointerMove={mover}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        onKeyDown={tecla}
      >
        <div className="rasgar-corpo" style={{ clipPath: CLIP_CORPO }}><Pacote epico={epico} texto={texto} /></div>
        <div className="rasgar-aba" style={aba}><Pacote epico={epico} texto={texto} /></div>
        {!abrindo && (
          <>
            <span className="rasgar-linha" style={{ top: `${CORTE}%` }} aria-hidden="true" />
            <span className="rasgar-feito" aria-hidden="true"
              style={{ top: `${CORTE}%`, width: `${p * 100}%`, [lado === 1 ? 'left' : 'right']: 0 }} />
            {p === 0 && <span className="rasgar-etiqueta" style={{ top: `calc(${CORTE}% - 30px)` }} aria-hidden="true">✂ Rasgue aqui</span>}
          </>
        )}
      </div>
      <p className="rasgar-ajuda" aria-live="polite">
        {abrindo ? '' : dica ? 'Arraste o dedo pela linha, de um lado até o outro!' : 'Arraste o dedo na linha para rasgar o pacote'}
      </p>
    </div>
  );
}
