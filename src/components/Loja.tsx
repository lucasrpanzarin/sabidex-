// Peças visuais da lojinha: a moeda, os desenhos dos itens, o item como mini carta e a faixa embaixo da carta.

import { ESPACOS, itemPorId } from '../lib/loja';

export function Moeda({ tamanho = 18 }: { tamanho?: number }) {
  return <span className="moeda" aria-hidden="true" style={{ width: tamanho, height: tamanho }} />;
}

/** Saldo de Sabicoins, no formato da pílula do topo. */
export function Saldo({ valor }: { valor: number }) {
  return <span className="pilula" title="Sabicoins"><Moeda tamanho={22} />{valor.toLocaleString('pt-BR')}</span>;
}

const ESTRELA = 'M20 9.5l3.1 6.6 7.2.8-5.4 4.9 1.5 7.1L20 25.3l-6.4 3.6 1.5-7.1-5.4-4.9 7.2-.8z';

const K = '#10213F'; // contorno escuro (estilo figurinha)

export function ItemIcone({ id, tamanho = 40 }: { id: string; tamanho?: number }) {
  const p = { width: tamanho, height: tamanho, viewBox: '0 0 40 40', 'aria-hidden': true } as const;
  const t = { stroke: K, strokeWidth: 2.2, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'caju': return <svg {...p}><path {...t} fill="#F59E0B" d="M12 18c0-6 5-9 9-9s9 3 9 9c0 8-5 12-9 12s-9-4-9-12z" /><path fill="#FDE68A" opacity=".7" d="M15 15c1-3 3-4 5-4-2 2-3 4-3 6z" /><path {...t} fill="#A16207" d="M16 31c-2 3-1 6 3 6 3 0 4-2 3-5-2 0-4 0-6-1z" /><path {...t} fill="#22C55E" d="M21 9c0-3 2-5 5-5 0 3-2 5-5 5z" /></svg>;
    case 'vitoria': return <svg {...p}><ellipse {...t} cx="20" cy="23" rx="18" ry="11" fill="#16A34A" /><ellipse cx="20" cy="21" rx="15" ry="8.5" fill="#4ADE80" /><path stroke="#15803D" strokeWidth="1.4" d="M20 21L7 17M20 21l-10 6M20 21l5-8M20 21l13 1M20 21l7 6" /><circle cx="20" cy="21" r="2" fill="#F9A8D4" stroke={K} strokeWidth="1" /></svg>;
    case 'guarana': return <svg {...p}><circle {...t} cx="13" cy="24" r="8" fill="#B91C1C" /><circle {...t} cx="27" cy="23" r="8" fill="#DC2626" /><circle {...t} cx="20" cy="13" r="8" fill="#EF4444" /><circle cx="20" cy="13" r="3.6" fill="#fff" /><circle cx="20" cy="13" r="2.1" fill="#111" /><circle cx="27" cy="23" r="3.6" fill="#fff" /><circle cx="27" cy="23" r="2.1" fill="#111" /></svg>;
    case 'castanha': return <svg {...p}><circle {...t} cx="20" cy="21" r="16" fill="#78350F" /><circle cx="20" cy="21" r="12" fill="#92400E" /><path {...t} strokeWidth="1.6" fill="#FDE68A" d="M20 12l4 7-4 10-4-10z" /><path {...t} strokeWidth="1.6" fill="#FCD34D" d="M11 17l6 3-1 8-5-4zM29 17l-6 3 1 8 5-4z" /></svg>;
    case 'ipe': return <svg {...p}><g {...t} strokeWidth="1.8">{[0, 72, 144, 216, 288].map((r, i) => <ellipse key={r} cx="20" cy="10" rx="5.5" ry="8" fill={i % 2 ? '#FDE047' : '#FACC15'} transform={`rotate(${r} 20 20)`} />)}<circle cx="20" cy="20" r="4.5" fill="#CA8A04" /></g></svg>;
    case 'ametista': return <svg {...p}><defs><linearGradient id="it-am" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F5D0FE" /><stop offset=".5" stopColor="#C084FC" /><stop offset="1" stopColor="#7E22CE" /></linearGradient></defs><path {...t} fill="url(#it-am)" d="M20 3l9 8-2 18-7 8-7-8-2-18z" /><path stroke="#FFFFFF99" strokeWidth="1.4" fill="none" d="M20 3v34M11 11h18M13 29h14" /></svg>;
    case 'escama': return <svg {...p}><path {...t} fill="#DC2626" d="M20 4c9 4 14 11 14 19 0 8-6 13-14 13S6 31 6 23C6 15 11 8 20 4z" /><path fill="#F87171" d="M20 8c6 3 10 8 10 14-3-4-6-6-10-7z" /><path stroke="#7F1D1D" strokeWidth="1.5" fill="none" d="M10 25c3-3 7-4 10-4s7 1 10 4M12 31c2-2 5-3 8-3s6 1 8 3" /></svg>;
    case 'molduraouro': return <svg {...p}><defs><linearGradient id="it-ou" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FEF3C7" /><stop offset=".45" stopColor="#EAB308" /><stop offset=".6" stopColor="#FDE68A" /><stop offset="1" stopColor="#A16207" /></linearGradient></defs><rect {...t} x="7" y="3" width="24" height="33" rx="5" fill="url(#it-ou)" /><rect {...t} strokeWidth="1.5" x="11" y="7" width="16" height="25" rx="3" fill="#FB923C" /><path {...t} strokeWidth="1.5" fill="#FDE047" d="M33 4l1.8 4 4.2.5-3 3 .8 4.2-3.8-2-3.8 2 .8-4.2-3-3 4.2-.5z" /></svg>;
    case 'holo': return <svg {...p}><defs><linearGradient id="it-ho" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F472B6" /><stop offset=".35" stopColor="#22D3EE" /><stop offset=".7" stopColor="#FACC15" /><stop offset="1" stopColor="#4ADE80" /></linearGradient></defs><rect {...t} x="7" y="3" width="24" height="33" rx="5" fill="url(#it-ho)" /><rect {...t} strokeWidth="1.5" x="11" y="7" width="16" height="25" rx="3" fill="#FFFFFFAA" /><path stroke="#fff" strokeWidth="2" strokeLinecap="round" d="M14 26l10-14M17 29l8-11" /></svg>;
    case 'coroa': return <svg {...p}><path {...t} fill="#FACC15" d="M4 14l8 7 8-13 8 13 8-7-3 19H7z" /><circle {...t} strokeWidth="1.4" cx="20" cy="25" r="2.8" fill="#F472B6" /><circle {...t} strokeWidth="1.4" cx="12.5" cy="27" r="2" fill="#22D3EE" /><circle {...t} strokeWidth="1.4" cx="27.5" cy="27" r="2" fill="#4ADE80" /></svg>;
    // itens antigos
    case 'prata': return <svg {...p}><circle {...t} cx="20" cy="20" r="17" fill="#CBD5E1" /><circle cx="20" cy="20" r="13.5" fill="#94A3B8" /><path fill="#F8FAFC" d={ESTRELA} /></svg>;
    case 'ouro': return <svg {...p}><circle {...t} cx="20" cy="20" r="17" fill="#FDE68A" /><circle cx="20" cy="20" r="13.5" fill="#EAB308" /><path fill="#FFFBEB" d={ESTRELA} /></svg>;
    case 'ouro2': return <svg {...p}><path {...t} fill="#EAB308" d="M12 6l2.3 4.9 5.3.6-4 3.6 1.1 5.2L12 17.7l-4.7 2.6 1.1-5.2-4-3.6 5.3-.6z" /><path {...t} fill="#FACC15" d="M28 18l2.3 4.9 5.3.6-4 3.6 1.1 5.2-4.7-2.6-4.7 2.6 1.1-5.2-4-3.6 5.3-.6z" /></svg>;
    case 'escudo': return <svg {...p}><path {...t} fill="#4ADE80" d="M20 4l13 5v9c0 8.5-5.6 15-13 18C12.6 33 7 26.5 7 18V9z" /><path fill="#F87171" d="M20 27s-5.5-3.3-6.6-6.5c-.8-2.4.7-5 3.2-5 1.5 0 2.7.9 3.4 1.8.7-.9 1.9-1.8 3.4-1.8 2.5 0 4 2.6 3.2 5C25.5 23.7 20 27 20 27z" /></svg>;
    case 'raio': return <svg {...p}><circle {...t} cx="20" cy="20" r="17" fill="#22D3EE" /><path fill="#FACC15" stroke={K} strokeWidth="1.5" strokeLinejoin="round" d="M22.5 6L11 22h8l-2.5 12L29 17.5h-8z" /></svg>;
    default: return null;
  }
}

/** Fundo do "palco" do item, pela cor do que ele é. */
const PALCO: Record<string, string> = {
  caju: 'linear-gradient(180deg,#FEF3C7,#FDBA74)', vitoria: 'linear-gradient(180deg,#A7F3D0,#34D399)', guarana: 'linear-gradient(180deg,#FED7AA,#FB923C)',
  castanha: 'linear-gradient(180deg,#D9F99D,#65A30D)', ipe: 'linear-gradient(180deg,#FEF3C7,#FBBF24)', ametista: 'linear-gradient(180deg,#E0F2FE,#7DD3FC)',
  escama: 'linear-gradient(180deg,#BAE6FD,#0284C7)', molduraouro: 'linear-gradient(180deg,#FDE68A,#D97706)', holo: 'linear-gradient(135deg,#F9A8D4,#67E8F9,#FDE68A)',
  coroa: 'linear-gradient(135deg,#F9A8D4,#67E8F9,#FDE68A)',
};

const ESTRELAS: Record<string, string> = { comum: '★', rara: '★★', epica: '★★★', lendaria: '★★★★' };

/** Item da lojinha desenhado como uma mini carta (mesma moldura de raridade das cartas). */
export function ItemCarta({ id, tem, desejo, selecionado, livre, onClick }: { id: string; tem: number; desejo?: boolean; selecionado?: boolean; livre?: number; onClick: () => void }) {
  const it = itemPorId.get(id);
  if (!it) return null;
  return (
    <button className={`item-carta ${it.raridade}`} aria-pressed={selecionado} onClick={onClick}
      aria-label={`${it.nome}, ${it.efeito}${it.premio ? '' : `, ${it.preco} Sabicoins`}`}>
      <span className="dentro">
        <span className="palco-item" style={{ background: PALCO[id] }}>
          <span className="estrelas">{ESTRELAS[it.raridade]}</span>
          {desejo && <span className="desejo-selo">DESEJO</span>}
          <ItemIcone id={id} tamanho={58} />
        </span>
        <b>{it.nome}</b>
        <span className={`efeito ${it.tipo}`}>{it.efeito}</span>
        {it.fato && <small>{it.fato}</small>}
        {it.premio
          ? <span className="preco premio">{livre ? `Você pode pegar ${livre}!` : 'Complete uma unidade'}</span>
          : <span className={`preco${tem >= it.preco ? '' : ' falta'}`}><Moeda />{it.preco.toLocaleString('pt-BR')}</span>}
      </span>
    </button>
  );
}

/** Os 3 espaços de itens embaixo da carta. */
export function Faixa({ itens, onLivre }: { itens: string[]; onLivre?: () => void }) {
  return (
    <div className="faixa" aria-label="Itens da carta">
      {Array.from({ length: ESPACOS }, (_, i) => {
        const it = itemPorId.get(itens[i] ?? '');
        if (it) return <div key={i} className="cheio" title={it.nome}><ItemIcone id={it.id} tamanho={30} /><span>{it.vida ? `+${it.vida} Vida` : it.forca ? `+${it.forca} força` : it.nome.split(' ')[0]}</span></div>;
        return onLivre
          ? <button key={i} className="livre" onClick={onLivre}>+ item</button>
          : <div key={i} className="livre">livre</div>;
      })}
    </div>
  );
}
