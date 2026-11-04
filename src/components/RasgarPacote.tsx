// Pacote que a criança rasga arrastando o dedo pela linha tracejada do topo.
// A aba de cima acompanha o dedo; soltando antes do fim, ela volta. No fim, a aba voa longe.
// Teclado: Enter ou espaço rasgam sozinhos. Tocar sem arrastar mostra a dica; no 2º toque, rasga sozinho.
// Basta arrastar metade da largura (de qualquer ponto do pacote); soltando depois de 60%, termina sozinho.
// Com movimento reduzido no aparelho, um toque abre.

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ALTURA_PACOTE, Pacote, larguraPacote } from './Pacote';

/** Altura do corte, em % da altura do pacote. */
const CORTE = 6;
const DENTES = 14;

// Serrilhado do rasgo: o mesmo desenho na aba e no resto do pacote, para encaixarem.
// Vai um pouco além das bordas (-12% a 112%) para não cortar o selo "1 Sabimon" nem a sombra.
const pontos = Array.from({ length: DENTES + 1 }, (_, i) => `${-12 + (i / DENTES) * 124}% ${CORTE + (i % 2 ? 1.4 : -1)}%`);
const CLIP_ABA = `polygon(-12% -12%, 112% -12%, ${[...pontos].reverse().join(', ')})`;
const CLIP_CORPO = `polygon(${pontos.join(', ')}, 112% 112%, -12% 112%)`;

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
  const [inclina, setInclina] = useState<{ rx: number; ry: number } | null>(null);
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
    const de = p; // continua de onde o dedo parou
    const passo = (t: number) => {
      const q = Math.min(1, de + (t - t0) / 450);
      setP(q);
      if (q < 1) requestAnimationFrame(passo); else terminar();
    };
    requestAnimationFrame(passo);
  };

  // Distância para rasgar: metade da largura (antes era quase toda, difícil para dedo pequeno).
  const largura = () => (caixa.current?.getBoundingClientRect().width ?? 214) * 0.5;

  const baixar = (ev: PointerEvent<HTMLDivElement>) => {
    if (feito.current) return;
    inicio.current = { x: ev.clientX, y: ev.clientY, moveu: false };
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
  };
  const mover = (ev: PointerEvent<HTMLDivElement>) => {
    const i = inicio.current;
    // Mouse passando por cima (sem apertar): o pacote inclina para o lado do mouse.
    if (!i && ev.pointerType === 'mouse' && !feito.current) {
      const r = ev.currentTarget.getBoundingClientRect();
      setInclina({ rx: ((ev.clientY - r.top) / r.height - 0.5) * -16, ry: ((ev.clientX - r.left) / r.width - 0.5) * 22 });
      return;
    }
    if (!i || feito.current) return;
    const dx = ev.clientX - i.x;
    if (!i.moveu && Math.abs(dx) < 6) return;
    // Arrastou pro outro lado depois de começar: conta a partir dali, sem precisar soltar.
    if (i.moveu && dx * lado < 0) { i.x = ev.clientX; setLado(dx >= 0 ? 1 : -1); setP(0); return; }
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
      if (dica >= 1) { rasgarSozinho(); return; }
      setDica((n) => n + 1);
      return;
    }
    if (p > 0.6) rasgarSozinho(); else setP(0);
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

  const parado = p > 0 || arrastando || abrindo || !!inclina;
  const giro3d = inclina ? { '--rx': `${inclina.rx}deg`, '--ry': `${inclina.ry}deg` } : p > 0 || abrindo ? { '--rx': '0deg', '--ry': '0deg' } : undefined;

  return (
    <div className="rasgar-area">
      <div className={`pacote-3d${parado ? '' : ' balanca'}`}>
      <div className="pacote-3d-gira" style={giro3d as React.CSSProperties}>
      <div
        ref={caixa}
        style={{ width: larguraPacote(epico), height: ALTURA_PACOTE }}
        onPointerLeave={() => setInclina(null)}
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
      </div>
      </div>
      <p className="rasgar-ajuda" aria-live="polite">
        {abrindo ? '' : dica ? 'Arraste o dedo pela linha, de um lado até o outro!' : 'Arraste o dedo na linha para rasgar o pacote'}
      </p>
    </div>
  );
}
