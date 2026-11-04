// O pacote de Sabimons, como um pacote de figurinha de verdade: a embalagem metálica é um desenho
// em 3D (public/pacote/normal.webp e epico.webp, gerados sem letras), e o app coloca por cima
// o logo na faixa de cima, a Ará dentro da explosão, o texto e o selo "1 Sabimon".
// "grande" na tela de abrir; "mini" nos avisos (início, prêmios do mundo).

import type { CSSProperties } from 'react';
import { Ara } from './Ara';

interface Props {
  tamanho?: 'grande' | 'mini';
  epico?: boolean;
  texto?: string;
}

/** Proporção (largura ÷ altura) de cada desenho, para o pacote não ficar esticado. */
export const PROPORCAO = { normal: 413 / 700, epico: 366 / 700 };
export const ALTURA_PACOTE = 340;
export const larguraPacote = (epico: boolean) => Math.round(ALTURA_PACOTE * (epico ? PROPORCAO.epico : PROPORCAO.normal));

export function Pacote({ tamanho = 'grande', epico = false, texto }: Props) {
  const img = `/pacote/${epico ? 'epico' : 'normal'}.webp`;
  if (tamanho === 'mini') {
    return (
      <span className={`pacote mini${epico ? ' epico' : ''}`} aria-hidden="true">
        <img src={img} alt="" draggable={false} />
      </span>
    );
  }
  const estilo = { width: larguraPacote(epico), height: ALTURA_PACOTE, '--mascara': `url(${img})` } as CSSProperties;
  return (
    <span className={`pacote${epico ? ' epico' : ''}`} style={estilo}>
      <img className="pacote-foto" src={img} alt="" draggable={false} />
      <span className="pacote-brilho" aria-hidden="true" />
      <span className="pacote-logo">Sabidex</span>
      <span className="pacote-arte"><Ara tamanho={epico ? 92 : 100} /></span>
      <span className="pacote-sub">{epico ? 'Pacote épico' : 'Pacote de Sabimons'}</span>
      {texto && <span className="pacote-chip">{texto}</span>}
      <span className="pacote-qtd" aria-hidden="true">1<small>Sabimon</small></span>
    </span>
  );
}
