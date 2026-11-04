// O pacote de Sabimons, no jeito de um pacote de figurinhas: embalagem metálica que brilha,
// bordas serrilhadas e amassadas em cima e embaixo, e a Ará na frente.
// "grande" na tela de abrir; "mini" nos avisos (início, prêmios do mundo).

import type { CSSProperties } from 'react';
import { Ara } from './Ara';

interface Props {
  tamanho?: 'grande' | 'mini';
  epico?: boolean;
  texto?: string;
}

/** Contorno da embalagem: serrilhado em cima e embaixo, como pacote selado. */
function serrilhado(dentes: number, fundo: number) {
  const topo = Array.from({ length: dentes * 2 + 1 }, (_, i) => `${(i / (dentes * 2)) * 100}% ${i % 2 ? fundo : 0}px`);
  const base = Array.from({ length: dentes * 2 + 1 }, (_, i) => `${100 - (i / (dentes * 2)) * 100}% calc(100% - ${i % 2 ? fundo : 0}px)`);
  return `polygon(${[...topo, ...base].join(', ')})`;
}
const FORMA_GRANDE = serrilhado(16, 7);
const FORMA_MINI = serrilhado(6, 3);

export function Pacote({ tamanho = 'grande', epico = false, texto }: Props) {
  const classe = `pacote${tamanho === 'mini' ? ' mini' : ''}${epico ? ' epico' : ''}`;
  if (tamanho === 'mini') {
    return (
      <span className={classe} aria-hidden="true">
        <span className="pacote-foil" style={{ clipPath: FORMA_MINI } as CSSProperties}>
          <span className="pacote-selo">S</span>
        </span>
      </span>
    );
  }
  return (
    <span className={classe}>
      <span className="pacote-foil" style={{ clipPath: FORMA_GRANDE } as CSSProperties}>
        <span className="pacote-solda topo" aria-hidden="true" />
        <span className="pacote-solda base" aria-hidden="true" />
        <span className="pacote-amassado" aria-hidden="true" />
        <span className="pacote-logo">Sabidex</span>
        <span className="pacote-sub">{epico ? 'Pacote épico' : 'Pacote de Sabimons'}</span>
        <span className="pacote-arte">
          <span className="pacote-explosao" aria-hidden="true" />
          <Ara tamanho={96} />
        </span>
        {texto && <span className="pacote-chip">{texto}</span>}
        <span className="pacote-brilho" aria-hidden="true" />
      </span>
      <span className="pacote-qtd" aria-hidden="true">1<small>Sabimon</small></span>
    </span>
  );
}
