import type { Carta, Raridade } from '../data/tipos';

export const ROTULO: Record<Raridade, string> = {
  comum: '★ Comum', rara: '★★ Rara', epica: '★★★ Épica', lendaria: '★★★★ Lendária',
};

interface Props {
  carta: Carta;
  tem?: boolean;
  quantidade?: number;
  grande?: boolean;
  animar?: boolean;
  onClick?: () => void;
}

export function CartaView({ carta, tem = true, quantidade = 1, grande = false, animar = false, onClick }: Props) {
  const r = tem ? carta.raridade : 'vazia';
  const classe = `carta ${tem ? carta.raridade : 'vazia'}${animar && carta.raridade === 'lendaria' ? ' holo' : ''}`;
  const conteudo = (
    <div className="dentro" style={grande ? { padding: 14 } : undefined}>
      <div className="num">
        <span>Nº {String(carta.numero).padStart(3, '0')}</span>
        {tem && quantidade > 1 && <span style={{ color: '#0B1026', background: 'var(--green)', borderRadius: 999, padding: '0 6px' }}>x{quantidade}</span>}
      </div>
      <div className={`orbe ${r}`} style={{ width: grande ? 96 : 46, height: grande ? 96 : 46, fontSize: grande ? 48 : 24 }}>{tem ? carta.simbolo : '?'}</div>
      <div className="nome" style={{ fontSize: grande ? 24 : 13 }}>{tem ? carta.nome : '???'}</div>
      {grande && tem && <p style={{ margin: '6px 0', fontSize: 14, fontWeight: 700, color: '#C7D0F5', lineHeight: 1.35 }}>{carta.fato}</p>}
      <div className={`rar ${r}`} style={{ marginTop: 2, fontSize: grande ? 13 : 10, color: tem ? undefined : '#5B678F' }}>{ROTULO[carta.raridade]}</div>
    </div>
  );
  if (onClick) {
    return (
      <button className={classe} onClick={onClick} style={{ border: 0, textAlign: 'left', width: '100%' }} aria-label={tem ? `${carta.nome}, ${ROTULO[carta.raridade]}` : `Carta ${carta.numero} que você ainda não tem`}>
        {conteudo}
      </button>
    );
  }
  return <div className={classe} style={grande ? { width: 250 } : undefined}>{conteudo}</div>;
}
