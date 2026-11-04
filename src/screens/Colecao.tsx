import { useState } from 'react';
import { Ara } from '../components/Ara';
import { CartaView, ROTULO } from '../components/CartaView';
import { Icone } from '../components/Icone';
import { capitulos, capituloPorId } from '../data';
import type { Carta, Raridade } from '../data/tipos';
import { abrirPacote, guardarCartas } from '../lib/jogo';
import { ir } from '../lib/rota';
import { jogar } from './Inicio';
import { setEstado, useEstado } from '../lib/store';

export function AbrirPacote() {
  const e = useEstado();
  const [aberto, setAberto] = useState<{ pacoteId: string; cartas: Carta[] } | null>(null);
  const pacote = e.pacotes[0];

  if (aberto) {
    const melhor = aberto.cartas[aberto.cartas.length - 1];
    const lendaria = melhor.raridade === 'lendaria';
    const novas = aberto.cartas.filter((c) => !(e.cartas[c.id] > 0));
    return (
      <main className="tela" style={{ alignItems: 'center', textAlign: 'center', background: 'radial-gradient(circle at 50% 40%, #2B2470 0%, transparent 65%)' }}>
        <div className="display pop" style={{ fontSize: 30, color: 'var(--yellow)', textShadow: '0 3px 0 #B45309' }}>
          {lendaria ? 'Lendária!' : melhor.raridade === 'epica' ? 'Épica!' : 'Cartas novas!'}
        </div>
        <div style={{ position: 'relative', display: 'grid', placeItems: 'center', padding: '20px 0' }}>
          {(lendaria || melhor.raridade === 'epica') && <div className="raios" aria-hidden="true" />}
          <div className="pop" style={{ position: 'relative', boxShadow: lendaria ? '0 0 50px #FACC1555' : undefined, borderRadius: 18 }}>
            <CartaView carta={melhor} grande animar />
          </div>
        </div>
        <div className="grade-3" style={{ width: '100%' }}>
          {aberto.cartas.map((c, i) => (
            <div key={c.id} className="sobe" style={{ animationDelay: `${0.4 + i * 0.15}s` }}><CartaView carta={c} /></div>
          ))}
        </div>
        <p className="muted small" style={{ margin: 0 }}>{novas.length ? `${novas.length} ${novas.length > 1 ? 'cartas novas' : 'carta nova'} no álbum` : 'Todas repetidas: guarde para trocar com os amigos'}</p>
        {e.pacotes.length > 1 ? (
          <button className="btn btn-amarelo btn-bloco" style={{ marginTop: 'auto' }}
            onClick={() => { setEstado((s) => guardarCartas(s, aberto.pacoteId, aberto.cartas)); setAberto(null); }}>
            Guardar e abrir o próximo
          </button>
        ) : (
          <div className="coluna" style={{ width: '100%', marginTop: 'auto' }}>
            <button className="btn btn-amarelo btn-bloco"
              onClick={() => { setEstado((s) => guardarCartas(s, aberto.pacoteId, aberto.cartas)); setAberto(null); jogar(); }}>
              Guardar e continuar jogando
            </button>
            <button className="btn btn-escuro btn-bloco"
              onClick={() => { setEstado((s) => guardarCartas(s, aberto.pacoteId, aberto.cartas)); setAberto(null); ir('album'); }}>
              Guardar e ver o álbum
            </button>
          </div>
        )}
      </main>
    );
  }

  if (!pacote) {
    return (
      <main className="tela" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Ara tamanho={110} />
        <div className="balao">Nenhum pacote agora. Jogue as fases para ganhar mais!</div>
        <button className="btn btn-amarelo" onClick={() => ir('mundos')}>Ir para as fases</button>
      </main>
    );
  }

  const cap = capituloPorId(pacote.capitulo) ?? capitulos[0];
  return (
    <main className="tela" style={{ alignItems: 'center', textAlign: 'center' }}>
      <div className="linha" style={{ alignSelf: 'stretch', justifyContent: 'space-between' }}>
        <button className="voltar" onClick={() => ir()}><Icone nome="voltar" tamanho={18} espessura={3} />Voltar</button>
        <span className="eyebrow">Pacote · Mundo {cap.numero}</span>
      </div>
      <h1 className="display h1" style={{ color: 'var(--yellow)', textShadow: '0 4px 0 #B45309', marginTop: 12 }}>{pacote.tipo === 'epico' ? 'Pacote épico!' : 'Novo pacote!'}</h1>
      <button onClick={() => setAberto({ pacoteId: pacote.id, cartas: abrirPacote(cap.cartas, pacote.tipo) })} aria-label="Abrir o pacote"
        style={{ border: 0, borderRadius: 28, padding: 4, background: pacote.tipo === 'epico' ? 'linear-gradient(135deg,#FACC15,#F472B6)' : 'linear-gradient(135deg,#F472B6,#A78BFA 40%,#22D3EE 75%,#FACC15)', boxShadow: '0 20px 50px #A78BFA55' }}>
        <span style={{ width: 210, height: 280, borderRadius: 24, background: 'linear-gradient(170deg,#26357A,#141B3D)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span className="logo" style={{ fontSize: 24 }}>Sabidex</span>
          <Ara tamanho={96} />
          <span className="small" style={{ fontWeight: 800, color: '#C7D0F5' }}>{pacote.tipo === 'epico' ? '3 cartas · 1 épica ou melhor' : '3 cartas do Mundo ' + cap.numero}</span>
        </span>
      </button>
      <span className="btn btn-amarelo" aria-hidden="true">Toque para abrir</span>
      {e.pacotes.length > 1 && <p className="muted small">Mais {e.pacotes.length - 1} {e.pacotes.length > 2 ? 'pacotes' : 'pacote'} depois desse</p>}
    </main>
  );
}

const FILTROS: [Raridade | 'todas', string][] = [['todas', 'Todas'], ['comum', '★'], ['rara', '★★'], ['epica', '★★★'], ['lendaria', '★★★★']];

export function Album() {
  const e = useEstado();
  const [capId, setCapId] = useState(capitulos[0].id);
  const [filtro, setFiltro] = useState<Raridade | 'todas'>('todas');
  const [detalhe, setDetalhe] = useState<Carta | null>(null);
  const cap = capituloPorId(capId)!;
  const tem = cap.cartas.filter((c) => e.cartas[c.id] > 0).length;
  const lista = cap.cartas.filter((c) => filtro === 'todas' || c.raridade === filtro);

  if (detalhe) {
    const n = e.cartas[detalhe.id] ?? 0;
    return (
      <main className="tela" style={{ alignItems: 'center', textAlign: 'center' }}>
        <button className="voltar" onClick={() => setDetalhe(null)}><Icone nome="voltar" tamanho={18} espessura={3} />Álbum</button>
        <div className="pop"><CartaView carta={detalhe} tem={n > 0} grande animar /></div>
        <div className="muted">{n > 0 ? `Você tem ${n} ${n > 1 ? 'cópias' : 'cópia'}${n > 1 ? ' · as repetidas poderão ser trocadas' : ''}` : 'Você ainda não tem essa carta. Continue jogando!'}</div>
      </main>
    );
  }

  return (
    <main className="tela">
      <div className="linha" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">Álbum · {cap.materia}</div>
          <h1 className="display h2" style={{ fontSize: 27 }}>{cap.titulo}</h1>
        </div>
        <div className="display" style={{ fontSize: 28, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>{tem}<span style={{ fontSize: 16, color: 'var(--muted)' }}>/{cap.cartas.length}</span></div>
      </div>
      <div className="barra barra-verde"><div style={{ width: `${(tem / cap.cartas.length) * 100}%` }} /></div>

      {e.pacotes.length > 0 && <button className="btn btn-rosa btn-bloco" onClick={() => ir('pacote')}>Abrir {e.pacotes.length} {e.pacotes.length > 1 ? 'pacotes' : 'pacote'}</button>}

      <div className="linha" role="tablist" aria-label="Capítulos" style={{ gap: 8 }}>
        {capitulos.map((c) => (
          <button key={c.id} role="tab" aria-selected={c.id === capId} onClick={() => setCapId(c.id)} className={`btn ${c.id === capId ? 'btn-ciano' : 'btn-escuro'}`} style={{ flex: 1, fontSize: 16, minHeight: 44 }}>Cap. {c.numero}</button>
        ))}
      </div>
      <div className="linha" style={{ gap: 8, flexWrap: 'wrap' }}>
        {FILTROS.map(([k, r]) => (
          <button key={k} onClick={() => setFiltro(k)} aria-pressed={filtro === k} aria-label={k === 'todas' ? 'Todas' : ROTULO[k as Raridade]}
            style={{ border: 0, borderRadius: 999, padding: '8px 14px', minHeight: 40, fontWeight: 900, fontSize: 14,
              background: filtro === k ? 'var(--ink)' : 'var(--surface)', color: filtro === k ? 'var(--bg)' : 'var(--ink)', boxShadow: filtro === k ? undefined : 'inset 0 0 0 1.5px var(--line)' }}>{r}</button>
        ))}
      </div>
      <div className="grade-3">
        {lista.map((c) => <CartaView key={c.id} carta={c} tem={e.cartas[c.id] > 0} quantidade={e.cartas[c.id]} onClick={() => setDetalhe(c)} />)}
      </div>
    </main>
  );
}
