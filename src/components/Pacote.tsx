// O pacote de Sabimons: tem a mesma moldura e o mesmo verso das cartas,
// para a criança reconhecer que de dentro dele saem cartas.

import { Ara } from './Ara';

interface Props {
  /** "grande" na tela de abrir; "mini" nos avisos (início, prêmios do mundo) */
  tamanho?: 'grande' | 'mini';
  epico?: boolean;
  texto?: string;
}

export function Pacote({ tamanho = 'grande', epico = false, texto }: Props) {
  if (tamanho === 'mini') {
    return (
      <span className={`pacote mini${epico ? ' epico' : ''}`} aria-hidden="true">
        <span className="pacote-dentro"><span className="pacote-selo">S</span></span>
      </span>
    );
  }
  return (
    <span className={`pacote${epico ? ' epico' : ''}`}>
      <span className="pacote-dentro">
        <span className="logo" style={{ fontSize: 26 }}>Sabidex</span>
        <span className="pacote-palco"><Ara tamanho={92} /></span>
        {texto && <span className="pacote-chip">{texto}</span>}
      </span>
    </span>
  );
}
