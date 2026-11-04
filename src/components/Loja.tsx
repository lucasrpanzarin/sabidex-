// Peças visuais da lojinha: a moeda, os ícones dos itens e a faixa de itens embaixo da carta.

import { ESPACOS, itemPorId } from '../lib/loja';

export function Moeda({ tamanho = 18 }: { tamanho?: number }) {
  return <span className="moeda" aria-hidden="true" style={{ width: tamanho, height: tamanho }} />;
}

/** Saldo de Sabicoins, no formato da pílula do topo. */
export function Saldo({ valor }: { valor: number }) {
  return <span className="pilula" title="Sabicoins"><Moeda tamanho={22} />{valor.toLocaleString('pt-BR')}</span>;
}

const ESTRELA = 'M20 9.5l3.1 6.6 7.2.8-5.4 4.9 1.5 7.1L20 25.3l-6.4 3.6 1.5-7.1-5.4-4.9 7.2-.8z';

export function ItemIcone({ id, tamanho = 40 }: { id: string; tamanho?: number }) {
  const p = { width: tamanho, height: tamanho, viewBox: '0 0 40 40', 'aria-hidden': true } as const;
  switch (id) {
    case 'prata': return <svg {...p}><circle cx="20" cy="20" r="17" fill="#CBD5E1" /><circle cx="20" cy="20" r="13.5" fill="#94A3B8" /><path fill="#F8FAFC" d={ESTRELA} /></svg>;
    case 'ouro': return <svg {...p}><circle cx="20" cy="20" r="17" fill="#FDE68A" /><circle cx="20" cy="20" r="13.5" fill="#EAB308" /><path fill="#FFFBEB" d={ESTRELA} /></svg>;
    case 'ouro2': return <svg {...p}><path fill="#EAB308" d="M12 6l2.3 4.9 5.3.6-4 3.6 1.1 5.2L12 17.7l-4.7 2.6 1.1-5.2-4-3.6 5.3-.6z" /><path fill="#FACC15" d="M28 18l2.3 4.9 5.3.6-4 3.6 1.1 5.2-4.7-2.6-4.7 2.6 1.1-5.2-4-3.6 5.3-.6z" /></svg>;
    case 'escudo': return <svg {...p}><path fill="#4ADE80" d="M20 4l13 5v9c0 8.5-5.6 15-13 18C12.6 33 7 26.5 7 18V9z" /><path fill="#0B1026" opacity=".25" d="M20 4l13 5v9c0 8.5-5.6 15-13 18z" /><path fill="#F87171" d="M20 27s-5.5-3.3-6.6-6.5c-.8-2.4.7-5 3.2-5 1.5 0 2.7.9 3.4 1.8.7-.9 1.9-1.8 3.4-1.8 2.5 0 4 2.6 3.2 5C25.5 23.7 20 27 20 27z" /></svg>;
    case 'raio': return <svg {...p}><circle cx="20" cy="20" r="17" fill="#22D3EE" /><path fill="#FACC15" stroke="#0B1026" strokeWidth="1.5" strokeLinejoin="round" d="M22.5 6L11 22h8l-2.5 12L29 17.5h-8z" /></svg>;
    case 'coroa': return <svg {...p}><path fill="#FACC15" d="M6 14l7 6 7-11 7 11 7-6-3 17H9z" /><rect x="9" y="29" width="22" height="4" rx="1.5" fill="#EAB308" /><circle cx="20" cy="22" r="2.6" fill="#F472B6" /><circle cx="13.5" cy="24.5" r="1.8" fill="#22D3EE" /><circle cx="26.5" cy="24.5" r="1.8" fill="#22D3EE" /></svg>;
    default: return null;
  }
}

/** Os 3 espaços de itens embaixo da carta. */
export function Faixa({ itens, onLivre }: { itens: string[]; onLivre?: () => void }) {
  return (
    <div className="faixa" aria-label="Itens da carta">
      {Array.from({ length: ESPACOS }, (_, i) => {
        const it = itemPorId.get(itens[i] ?? '');
        if (it) return <div key={i} className="cheio" title={it.nome}><ItemIcone id={it.id} tamanho={28} /><span>{it.vida || it.forca ? it.efeito.replace(' nos 2 poderes', ' força') : it.nome.split(' ')[0]}</span></div>;
        return onLivre
          ? <button key={i} className="livre" onClick={onLivre}>+ item</button>
          : <div key={i} className="livre">livre</div>;
      })}
    </div>
  );
}
