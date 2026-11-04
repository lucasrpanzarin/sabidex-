// Carta de um Sabimon. "mini" é a carta pequena do álbum e das trocas; "grande" mostra tudo.

import type { CSSProperties } from 'react';
import type { Sabimon } from '../data/tipos';
import { CENARIOS, COR_TIPO, ROTULO, TEMA_TIPO, forca, vida, type Forma } from '../lib/sabimon';
import { bonus } from '../lib/loja';

export { ROTULO };

interface Props {
  carta: Sabimon;
  forma?: Forma;
  /** itens da loja colocados no Sabimon (somam Vida e força) */
  itens?: string[];
  tem?: boolean;
  quantidade?: number;
  grande?: boolean;
  animar?: boolean;
  onClick?: () => void;
}

const num = (n: number) => String(n).padStart(3, '0');

function Desenho({ carta, forma, tem }: { carta: Sabimon; forma: Forma; tem: boolean }) {
  const f = carta.formas[forma - 1];
  if (!tem) return <span className="palco-vazio" aria-hidden="true">?</span>;
  if (!f.imagem) return <span className="palco-vazio" style={{ fontSize: 14 }}>Desenho<br />em breve</span>;
  return <img src={'/' + f.imagem} alt="" loading="lazy" decoding="async" draggable={false} />;
}

export function CartaView({ carta, forma = 1, itens = [], tem = true, quantidade = 1, grande = false, animar = false, onClick }: Props) {
  const f = carta.formas[forma - 1];
  const extra = bonus(itens);
  const nome = tem ? f.nome : '???';
  const tema = TEMA_TIPO[carta.tipo];
  const estilo = { '--tipo': COR_TIPO[carta.tipo], '--tipo-claro': tema.claro, '--tipo-escuro': tema.escuro,
    ...(CENARIOS.has(tema.classe) ? { '--cenario': `url(/cenarios/${tema.classe}.webp)` } : {}) } as CSSProperties;
  const comCenario = tem && CENARIOS.has(tema.classe);
  const classe = `carta ${tem ? `${carta.raridade} t-${tema.classe}` : 'vazia'}${grande ? ' grande' : ''}${animar && tem && carta.raridade === 'lendaria' ? ' holo' : ''}${comCenario ? ' com-cenario' : ''}`;

  if (grande) {
    return (
      <article className={classe} style={estilo} aria-label={tem ? `${nome}, ${ROTULO[carta.raridade]}` : `Sabimon ${carta.numero} que você ainda não tem`}>
        <div className="dentro">
          <div className="topo-carta">
            <span className="nome">{nome}</span>
            {tem && <span className="vida"><small>VIDA</small>{vida(carta, forma) + extra.vida}<Coracao /></span>}
          </div>
          <div className="formas-carta">
            Forma {[1, 2, 3].map((i) => <i key={i} className={tem && i <= forma ? 'on' : ''} />)}
            {tem && <span className="chip-tipo">{carta.tipo}</span>}
          </div>
          <div className="palco"><Desenho carta={carta} forma={forma} tem={tem} /></div>
          {tem && f.poderes.map((p, i) => (
            <div key={p} className="poder"><span className="ic" aria-hidden="true">✦</span><b>{p}</b><span>{forca(carta, forma, i as 0 | 1) + extra.forca}</span></div>
          ))}
          {tem && <p className="fato"><strong>Fato real:</strong> {carta.fato}</p>}
          <div className="rodape-carta"><span>Nº {num(carta.numero)}</span><span className={`rar ${carta.raridade}`}>{ROTULO[carta.raridade]}</span></div>
        </div>
      </article>
    );
  }

  const conteudo = (
    <div className="dentro">
      <div className="num">
        <span>Nº {num(carta.numero)}</span>
        {tem && quantidade > 1 && <span className="qtd">x{quantidade}</span>}
      </div>
      <div className="palco"><Desenho carta={carta} forma={forma} tem={tem} /></div>
      <div className="nome">{nome}</div>
      <div className={`rar ${tem ? carta.raridade : ''}`}>{ROTULO[carta.raridade].split(' ')[0]}</div>
    </div>
  );
  if (onClick) {
    return (
      <button className={classe} style={estilo} onClick={onClick} aria-label={tem ? `${nome}, ${ROTULO[carta.raridade]}` : `Sabimon ${carta.numero} que você ainda não tem`}>
        {conteudo}
      </button>
    );
  }
  return <div className={classe} style={estilo}>{conteudo}</div>;
}

function Coracao() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#F87171" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" /></svg>;
}
