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
  /** moldura especial comprada na lojinha */
  visual?: 'ouro' | 'holo';
  tem?: boolean;
  quantidade?: number;
  grande?: boolean;
  animar?: boolean;
  onClick?: () => void;
}

// Número da figurinha no álbum (1 a 60): cada forma tem o seu.
const num = (carta: Sabimon, forma: Forma) => String((carta.numero - 1) * 3 + forma).padStart(2, '0');

function Desenho({ carta, forma, tem }: { carta: Sabimon; forma: Forma; tem: boolean }) {
  const f = carta.formas[forma - 1];
  // Ainda não tem: mostra só a sombra do desenho, como num álbum de figurinhas.
  if (!tem) return f.imagem ? <img className="silhueta" src={'/' + f.imagem} alt="" loading="lazy" decoding="async" draggable={false} /> : <span className="palco-vazio" aria-hidden="true">falta!</span>;
  if (!f.imagem) return <span className="palco-vazio" style={{ fontSize: 14 }}>Desenho<br />em breve</span>;
  return <img src={'/' + f.imagem} alt="" loading="lazy" decoding="async" draggable={false} />;
}

export function CartaView({ carta, forma = 1, itens = [], visual, tem = true, quantidade = 1, grande = false, animar = false, onClick }: Props) {
  const f = carta.formas[forma - 1];
  const extra = bonus(itens);
  const nome = f.nome; // o álbum mostra o nome mesmo antes de a criança ter a carta
  const tema = TEMA_TIPO[carta.tipo];
  const estilo = { '--tipo': COR_TIPO[carta.tipo], '--tipo-claro': tema.claro, '--tipo-escuro': tema.escuro,
    ...(CENARIOS.has(tema.classe) ? { '--cenario': `url(/cenarios/${tema.classe}.webp)` } : {}) } as CSSProperties;
  const comCenario = tem && CENARIOS.has(tema.classe);
  const classe = `carta ${tem ? `${carta.raridade} t-${tema.classe}` : 'vazia'}${grande ? ' grande' : ''}${animar && tem && carta.raridade === 'lendaria' ? ' holo' : ''}${comCenario ? ' com-cenario' : ''}${tem && visual ? ` v-${visual}` : ''}`;

  if (grande) {
    return (
      <article className={classe} style={estilo} aria-label={tem ? `${nome}, ${ROTULO[carta.raridade]}` : `Figurinha ${num(carta, forma)}, ${nome}, que você ainda não tem`}>
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
          <div className="rodape-carta"><span>Nº {num(carta, forma)}</span><span className={`rar ${carta.raridade}`}>{ROTULO[carta.raridade]}</span></div>
        </div>
      </article>
    );
  }

  const conteudo = (
    <div className="dentro">
      <div className="num">
        <span>Nº {num(carta, forma)}</span>
        {tem && quantidade > 1 && <span className="qtd">x{quantidade}</span>}
      </div>
      <div className="palco"><Desenho carta={carta} forma={forma} tem={tem} /></div>
      <div className="nome">{nome}</div>
      <div className={`rar ${tem ? carta.raridade : ''}`}>{ROTULO[carta.raridade].split(' ')[0]}</div>
    </div>
  );
  if (onClick) {
    return (
      <button className={classe} style={estilo} onClick={onClick} aria-label={tem ? `${nome}, ${ROTULO[carta.raridade]}` : `Figurinha ${num(carta, forma)}, ${nome}, que você ainda não tem`}>
        {conteudo}
      </button>
    );
  }
  return <div className={classe} style={estilo}>{conteudo}</div>;
}

/**
 * Verso das cartas (antes de virar no pacote): azul-noite do Sabidex, medalha com raios
 * e a Ará no meio, faixa "Sabimons do Brasil" e as 4 estrelas das raridades.
 */
export function VersoCarta() {
  return (
    <span className="verso">
      <span className="verso-moldura">
        {['c1', 'c2', 'c3', 'c4'].map((c) => <span key={c} className={`verso-canto ${c}`}>✦</span>)}
        <span className="verso-logo">Sabidex</span>
        <span className="verso-medalha"><img src="/mascote/ara-feliz.webp" alt="" draggable={false} /></span>
        <span className="verso-faixa">Sabimons do Brasil</span>
        <span className="verso-estrelas">
          <i className="comum">★</i><i className="rara">★</i><i className="epica">★</i><i className="lendaria">★</i>
        </span>
      </span>
    </span>
  );
}

function Coracao() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#F87171" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" /></svg>;
}
