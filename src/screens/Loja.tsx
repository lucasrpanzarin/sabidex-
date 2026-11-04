// Lojinha de Sabicoins: a criança escolhe um item e em qual Sabimon colocar.

import { useState } from 'react';
import { Ara } from '../components/Ara';
import { CartaView } from '../components/CartaView';
import { Icone } from '../components/Icone';
import { Faixa, ItemIcone, Moeda, Saldo } from '../components/Loja';
import { sabimonPorId, sabimons } from '../data';
import { ESPACOS, ITENS, comprarItem, formaDe, itemPorId, itensDe, saldo, type Item } from '../lib/loja';
import { ir, voltar } from '../lib/rota';
import { getEstado, setEstado, useEstado } from '../lib/store';

const ERROS = {
  item: 'Esse item não existe mais.',
  sabimon: 'Você não tem esse Sabimon.',
  repetido: 'Esse Sabimon já tem esse item.',
  cheio: 'Os 3 espaços desse Sabimon já estão cheios.',
  moedas: 'Faltam Sabicoins para comprar.',
};

/** Barra do "meu desejo": quanto falta para o item que a criança escolheu. */
export function Desejo({ onClick }: { onClick?: () => void }) {
  const e = useEstado();
  const item = e.desejo ? itemPorId.get(e.desejo) : undefined;
  const tem = saldo(e);
  if (!item) return null;
  const falta = Math.max(0, item.preco - tem);
  return (
    <button className="painel linha" onClick={onClick} style={{ textAlign: 'left', color: 'inherit', width: '100%', borderColor: falta ? 'var(--line)' : 'var(--green)' }}>
      <ItemIcone id={item.id} tamanho={44} />
      <span className="coluna" style={{ flex: 1, gap: 4, minWidth: 0 }}>
        <span className="eyebrow" style={{ color: 'var(--yellow)' }}>Meu desejo</span>
        <span className="display" style={{ fontSize: 18 }}>{item.nome}</span>
        <span className="barra barra-ciano" aria-hidden="true" style={{ height: 10 }}><span style={{ display: 'block', height: '100%', borderRadius: 999, width: `${Math.min(1, tem / item.preco) * 100}%`, background: 'linear-gradient(180deg,#FDE68A,#EAB308)' }} /></span>
        <span className="muted small" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {falta ? `Faltam ${falta.toLocaleString('pt-BR')} Sabicoins. Jogue mais fases!` : 'Você já pode comprar! Toque para ir à lojinha.'}
        </span>
      </span>
    </button>
  );
}

export function Loja({ sabimonId }: { sabimonId?: string }) {
  const e = useEstado();
  const [item, setItem] = useState<Item | null>(null);
  const [escolhido, setEscolhido] = useState<string | null>(sabimonId && e.cartas[sabimonId] > 0 ? sabimonId : null);
  const [passo, setPasso] = useState<'itens' | 'sabimon' | 'feito'>('itens');
  const [erro, setErro] = useState('');
  const tem = saldo(e);
  const meus = sabimons.filter((s) => e.cartas[s.id] > 0);
  const alvo = sabimonPorId.get(sabimonId ?? '');

  const comprar = (sId: string) => {
    if (!item) return;
    const r = comprarItem(getEstado(), item.id, sId);
    if (typeof r === 'string') { setErro(ERROS[r]); return; }
    setEstado(r);
    setEscolhido(sId);
    setPasso('feito');
  };

  if (passo === 'feito' && item && escolhido) {
    const s = sabimonPorId.get(escolhido)!;
    return (
      <main className="tela" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div className="display pop" style={{ fontSize: 30, color: 'var(--yellow)', textShadow: '0 3px 0 #B45309' }}>Comprado!</div>
        <div style={{ width: 'min(290px, 100%)' }}><CartaView carta={s} forma={formaDe(e, s.id)} itens={itensDe(e, s.id)} grande /></div>
        <div className="pop"><Faixa itens={itensDe(e, s.id)} /></div>
        <p className="muted small" style={{ margin: 0 }}>{item.nome} agora está no {s.formas[formaDe(e, s.id) - 1].nome}.</p>
        <div className="coluna" style={{ width: '100%', marginTop: 'auto' }}>
          <button className="btn btn-amarelo btn-bloco" onClick={() => { setItem(null); setPasso('itens'); }}>Voltar para a lojinha</button>
          <button className="btn btn-escuro btn-bloco" onClick={() => ir('album', s.id)}>Ver no álbum</button>
        </div>
      </main>
    );
  }

  if (passo === 'sabimon' && item) {
    return (
      <main className="tela">
        <div className="linha" style={{ justifyContent: 'space-between' }}>
          <button className="voltar" onClick={() => { setPasso('itens'); setErro(''); }}><Icone nome="voltar" tamanho={18} espessura={3} />Lojinha</button>
          <Saldo valor={tem} />
        </div>
        <h1 className="display h2">Em qual Sabimon?</h1>
        <p className="muted small" style={{ margin: 0 }}>O {item.nome} vai para a faixa embaixo da carta e fica com ele quando evoluir.</p>
        {erro && <div className="aviso aviso-erro">{erro}</div>}
        <div className="escolha-sabimon">
          {meus.map((s) => {
            const its = itensDe(e, s.id);
            const bloqueado = its.includes(item.id) || its.length >= ESPACOS;
            return (
              <div key={s.id} className="coluna" style={{ gap: 4 }}>
                <CartaView carta={s} forma={formaDe(e, s.id)} onClick={bloqueado ? undefined : () => setEscolhido(s.id)} />
                <span className="small" style={{ fontWeight: 800, textAlign: 'center', color: bloqueado ? 'var(--muted)' : escolhido === s.id ? 'var(--green)' : 'var(--ink)' }}>
                  {its.includes(item.id) ? 'Já tem' : its.length >= ESPACOS ? 'Cheio' : escolhido === s.id ? 'Escolhido' : `${ESPACOS - its.length} ${ESPACOS - its.length > 1 ? 'espaços' : 'espaço'}`}
                </span>
              </div>
            );
          })}
        </div>
        <button className="btn btn-amarelo btn-bloco" style={{ marginTop: 'auto', position: 'sticky', bottom: 16 }} disabled={!escolhido} onClick={() => escolhido && comprar(escolhido)}>
          {escolhido ? <>Comprar por <Moeda /> {item.preco}</> : 'Escolha um Sabimon'}
        </button>
      </main>
    );
  }

  return (
    <main className="tela">
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <button className="voltar" onClick={() => voltar()}><Icone nome="voltar" tamanho={18} espessura={3} />Voltar</button>
        <Saldo valor={tem} />
      </div>
      <div>
        <div className="eyebrow">Gaste suas Sabicoins</div>
        <h1 className="display h2" style={{ fontSize: 27 }}>Lojinha</h1>
      </div>
      {alvo && escolhido ? (
        <p className="muted small" style={{ margin: 0 }}>Escolha um item para o <strong style={{ color: 'var(--ink)' }}>{alvo.formas[formaDe(e, alvo.id) - 1].nome}</strong>.</p>
      ) : (
        <p className="muted small" style={{ margin: 0 }}>Cada Sabimon tem 3 espaços para itens. Toque num item para ver mais.</p>
      )}
      <Desejo />
      {meus.length === 0 && (
        <div className="linha" style={{ alignItems: 'flex-end' }}>
          <Ara tamanho={70} />
          <div className="balao" style={{ flex: 1 }}>Primeiro ganhe um Sabimon nos pacotes. Depois volte aqui para enfeitar a carta dele!</div>
        </div>
      )}
      <div className="loja-grade">
        {ITENS.map((it) => (
          <button key={it.id} className="item-loja" aria-pressed={item?.id === it.id} onClick={() => { setItem(it); setErro(''); }}
            style={item?.id === it.id ? { boxShadow: 'inset 0 0 0 2.5px var(--cyan)' } : undefined}>
            {e.desejo === it.id && <span className="desejo-selo">DESEJO</span>}
            <ItemIcone id={it.id} tamanho={44} />
            <b>{it.nome}</b>
            <small>{it.efeito}</small>
            <span className="preco" style={{ color: tem >= it.preco ? 'var(--yellow)' : 'var(--muted)' }}><Moeda />{it.preco.toLocaleString('pt-BR')}</span>
          </button>
        ))}
      </div>
      {item && (
        <div className="painel-destaque coluna" style={{ gap: 10, position: 'sticky', bottom: 96 }}>
          <div className="linha"><ItemIcone id={item.id} tamanho={36} /><span className="display" style={{ fontSize: 20, flex: 1 }}>{item.nome}</span><span className="preco"><Moeda />{item.preco.toLocaleString('pt-BR')}</span>
            <button className="voltar" aria-label="Fechar" onClick={() => setItem(null)} style={{ padding: 6 }}>✕</button></div>
          {erro && <div className="aviso aviso-erro">{erro}</div>}
          {tem >= item.preco ? (
            <button className="btn btn-amarelo btn-bloco" disabled={meus.length === 0}
              onClick={() => (alvo && escolhido ? comprar(escolhido) : setPasso('sabimon'))}>
              {alvo && escolhido ? <>Comprar por <Moeda /> {item.preco}</> : 'Escolher o Sabimon'}
            </button>
          ) : (
            <div className="muted small" style={{ textAlign: 'center' }}>Faltam {(item.preco - tem).toLocaleString('pt-BR')} Sabicoins. Cada fase dá Sabicoins!</div>
          )}
          <button className="btn btn-escuro btn-bloco" onClick={() => setEstado((s) => ({ ...s, desejo: s.desejo === item.id ? null : item.id }))}>
            {e.desejo === item.id ? 'Tirar do meu desejo' : 'Marcar como meu desejo'}
          </button>
        </div>
      )}
    </main>
  );
}
