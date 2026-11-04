import { useState } from 'react';
import { Ara } from '../components/Ara';
import { CartaView, ROTULO } from '../components/CartaView';
import { Icone } from '../components/Icone';
import { sabimonPorId, sabimons, TOTAL_PLANEJADO } from '../data';
import type { Raridade, Sabimon } from '../data/tipos';
import { abrirPacote, garantiaAtiva, guardarCartas, GARANTIA } from '../lib/jogo';
import { Faixa, Moeda, Saldo } from '../components/Loja';
import { ESPACOS, PRECO_EVOLUCAO, copiasGastas, evoluir, formaDe, itensDe, podeEvoluir, saldo } from '../lib/loja';
import { useConta, evoluirNaConta } from '../lib/conta';
import { ir } from '../lib/rota';
import { jogar } from './Inicio';
import { getEstado, setEstado, useEstado } from '../lib/store';

export function AbrirPacote() {
  const e = useEstado();
  const [aberto, setAberto] = useState<{ pacoteId: string; cartas: Sabimon[]; novos: Set<string> } | null>(null);
  const pacote = e.pacotes[0];

  if (aberto) {
    const melhor = aberto.cartas[aberto.cartas.length - 1];
    const lendaria = melhor.raridade === 'lendaria';
    const nNovos = aberto.novos.size;
    const guardar = () => { setEstado((s) => guardarCartas(s, aberto.pacoteId, aberto.cartas)); setAberto(null); };
    return (
      <main className="tela" style={{ alignItems: 'center', textAlign: 'center', background: 'radial-gradient(circle at 50% 40%, #1E2A63 0%, transparent 65%)' }}>
        <div className="display pop" style={{ fontSize: 30, color: 'var(--yellow)', textShadow: '0 3px 0 #B45309' }}>
          {lendaria ? 'Lendário!' : melhor.raridade === 'epica' ? 'Épico!' : nNovos ? 'Sabimon novo!' : 'Pacote aberto!'}
        </div>
        <div style={{ position: 'relative', display: 'grid', placeItems: 'center', padding: '8px 0', width: '100%', overflow: 'hidden', borderRadius: 24 }}>
          {(lendaria || melhor.raridade === 'epica') && <div className="raios" aria-hidden="true" />}
          <div className="pop" style={{ position: 'relative', boxShadow: lendaria ? '0 0 50px #FACC1555' : undefined, borderRadius: 20, width: 'min(290px, 100%)' }}>
            <CartaView carta={melhor} grande animar />
            {aberto.cartas.length === 1 && aberto.novos.has(melhor.id) && <span className="selo-novo" style={{ fontSize: 14, padding: '4px 10px', top: -10, right: -8 }}>NOVO</span>}
          </div>
        </div>
        {aberto.cartas.length > 1 && <div className="grade-3" style={{ width: '100%' }}>
          {aberto.cartas.map((c, i) => (
            <div key={c.id} className="sobe" style={{ animationDelay: `${0.4 + i * 0.15}s`, position: 'relative' }}>
              <CartaView carta={c} />
              {aberto.novos.has(c.id) && <span className="selo-novo">NOVO</span>}
            </div>
          ))}
        </div>}
        <p className="muted small" style={{ margin: 0 }}>
          {nNovos ? (aberto.cartas.length > 1 ? `${nNovos} Sabimons novos no álbum!` : 'Novo no seu álbum!') : `Repetido! Você tem ${(e.cartas[melhor.id] ?? 0) + 1} cópias. Elas ajudam a evoluir e servem para trocar.`}
        </p>
        {e.pacotes.length > 1 ? (
          <button className="btn btn-amarelo btn-bloco" style={{ marginTop: 'auto' }} onClick={guardar}>Guardar e abrir o próximo</button>
        ) : (
          <div className="coluna" style={{ width: '100%', marginTop: 'auto' }}>
            <button className="btn btn-amarelo btn-bloco" onClick={() => { guardar(); jogar(); }}>Guardar e continuar jogando</button>
            <button className="btn btn-escuro btn-bloco" onClick={() => { guardar(); ir('album'); }}>Guardar e ver o álbum</button>
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

  const epico = pacote.tipo === 'epico';
  const abrir = () => {
    const cartas = abrirPacote(sabimons, pacote.tipo, Math.random, { tem: e.cartas, garantia: garantiaAtiva(e) });
    setAberto({ pacoteId: pacote.id, cartas, novos: new Set(cartas.filter((c) => !(e.cartas[c.id] > 0)).map((c) => c.id)) });
  };
  return (
    <main className="tela" style={{ alignItems: 'center', textAlign: 'center' }}>
      <div className="linha" style={{ alignSelf: 'stretch', justifyContent: 'space-between' }}>
        <button className="voltar" onClick={() => ir()}><Icone nome="voltar" tamanho={18} espessura={3} />Voltar</button>
        <span className="eyebrow">{e.pacotes.length > 1 ? `${e.pacotes.length} pacotes` : 'Pacote'}</span>
      </div>
      <h1 className="display h1" style={{ color: 'var(--yellow)', textShadow: '0 4px 0 #B45309', marginTop: 12 }}>{epico ? 'Pacote épico!' : 'Novo pacote!'}</h1>
      <button onClick={abrir} aria-label="Abrir o pacote"
        style={{ border: 0, borderRadius: 28, padding: 4, background: epico ? 'linear-gradient(135deg,#FACC15,#F472B6)' : 'linear-gradient(135deg,#F472B6,#22D3EE 60%,#FACC15)', boxShadow: '0 20px 50px #22D3EE33' }}>
        <span style={{ width: 210, height: 280, borderRadius: 24, background: 'linear-gradient(170deg,#26357A,#141B3D)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span className="logo" style={{ fontSize: 24 }}>Sabidex</span>
          <Ara tamanho={96} />
          <span className="small" style={{ fontWeight: 800, color: '#C7D0F5' }}>{epico ? '1 Sabimon épico ou lendário' : '1 Sabimon surpresa'}</span>
        </span>
      </button>
      <span className="btn btn-amarelo" aria-hidden="true">Toque para abrir</span>
      {garantiaAtiva(e) && <p className="small" style={{ color: 'var(--green)', fontWeight: 800, margin: 0 }}>Este pacote garante um Sabimon novo!</p>}
      {e.pacotes.length > 1 && <p className="muted small">Mais {e.pacotes.length - 1} {e.pacotes.length > 2 ? 'pacotes' : 'pacote'} depois desse</p>}
    </main>
  );
}

const FILTROS: [Raridade | 'todas', string][] = [['todas', 'Todos'], ['comum', '★'], ['rara', '★★'], ['epica', '★★★'], ['lendaria', '★★★★']];

/** Detalhe de um Sabimon: carta grande, itens, cópias e evolução. */
function Detalhe({ s }: { s: Sabimon }) {
  const e = useEstado();
  const { conta } = useConta();
  const [evoluiu, setEvoluiu] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const n = e.cartas[s.id] ?? 0;
  const forma = formaDe(e, s.id);
  const itens = itensDe(e, s.id);
  const p = podeEvoluir(e, s);
  const prox = p.forma ? s.formas[p.forma - 1].nome : '';
  const precisa = p.forma ? 1 + copiasGastas(p.forma) : 0;

  const evoluirAgora = async () => {
    setErro('');
    if (conta) {
      setOcupado(true);
      const msg = await evoluirNaConta(s.id);
      setOcupado(false);
      if (msg) { setErro(msg); return; }
    } else {
      const novo = evoluir(getEstado(), s);
      if (!novo) return;
      setEstado(novo);
    }
    setEvoluiu(true);
  };

  if (n === 0) {
    return (
      <main className="tela" style={{ alignItems: 'center', textAlign: 'center' }}>
        <button className="voltar" style={{ alignSelf: 'flex-start' }} onClick={() => ir('album')}><Icone nome="voltar" tamanho={18} espessura={3} />Álbum</button>
        <CartaView carta={s} tem={false} grande />
        <div className="muted">Você ainda não tem esse Sabimon. Continue jogando para ganhar pacotes!</div>
      </main>
    );
  }

  return (
    <main className="tela" style={{ alignItems: 'center', textAlign: 'center' }}>
      <div className="linha" style={{ alignSelf: 'stretch', justifyContent: 'space-between' }}>
        <button className="voltar" onClick={() => ir('album')}><Icone nome="voltar" tamanho={18} espessura={3} />Álbum</button>
        <Saldo valor={saldo(e)} />
      </div>
      {evoluiu && <div className="display pop" style={{ fontSize: 30, color: 'var(--yellow)', textShadow: '0 3px 0 #B45309' }}>Evoluiu!</div>}
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center', width: '100%', overflow: 'hidden', borderRadius: 24 }}>
        {evoluiu && <div className="raios" aria-hidden="true" />}
        <div key={forma} className={evoluiu ? 'pop' : undefined} style={{ position: 'relative', width: 'min(290px, 100%)' }}>
          <CartaView carta={s} forma={forma} itens={itens} grande animar />
        </div>
      </div>
      <Faixa itens={itens} onLivre={() => ir('loja', s.id)} />

      <div className="painel coluna" style={{ width: '100%', gap: 8 }}>
        <div className="display" style={{ fontSize: 18 }}>
          {n > 1 ? `Você tem ${n} cópias` : 'Você tem 1 cópia'}
        </div>
        {p.ok ? (
          <>
            <div className="muted small">Você pode evoluir para <strong style={{ color: 'var(--ink)' }}>{prox}</strong>! Gasta {copiasGastas(p.forma)} cópias e {PRECO_EVOLUCAO[p.forma]} Sabicoins.</div>
            <button className="btn btn-amarelo btn-bloco" disabled={ocupado} onClick={() => void evoluirAgora()}>
              {ocupado ? 'Evoluindo…' : <>Evoluir por <Moeda /> {PRECO_EVOLUCAO[p.forma]}</>}
            </button>
          </>
        ) : p.motivo === 'final' ? (
          <div className="muted small">Forma final! As cópias repetidas servem para trocar com os amigos.</div>
        ) : p.motivo === 'desenho' ? (
          <div className="muted small">A evolução para <strong style={{ color: 'var(--ink)' }}>{prox}</strong> ainda está sendo desenhada. Junte {precisa} cópias enquanto isso!</div>
        ) : p.motivo === 'copias' ? (
          <>
            <div className="barra barra-verde" aria-hidden="true"><div style={{ width: `${Math.min(1, n / precisa) * 100}%` }} /></div>
            <div className="muted small">Junte mais {p.faltam} {p.faltam! > 1 ? 'cópias' : 'cópia'} para evoluir para <strong style={{ color: 'var(--ink)' }}>{prox}</strong>.</div>
          </>
        ) : (
          <div className="muted small">Você já tem as cópias! Faltam {p.faltam} Sabicoins para evoluir para <strong style={{ color: 'var(--ink)' }}>{prox}</strong>.</div>
        )}
        {erro && <div className="aviso aviso-erro">{erro}</div>}
      </div>
      {itens.length < ESPACOS && <button className="btn btn-escuro btn-bloco" onClick={() => ir('loja', s.id)}>Colocar item da lojinha</button>}
    </main>
  );
}

export function Album({ id }: { id?: string }) {
  const e = useEstado();
  const [filtro, setFiltro] = useState<Raridade | 'todas'>('todas');
  const detalhe = id ? sabimonPorId.get(id) : undefined;
  if (detalhe) return <Detalhe s={detalhe} />;

  const tem = sabimons.filter((c) => e.cartas[c.id] > 0).length;
  // O objetivo do álbum são as 3 formas de cada Sabimon.
  const formas = sabimons.reduce((s, c) => s + (e.cartas[c.id] > 0 ? formaDe(e, c.id) : 0), 0);
  const totalFormas = sabimons.length * 3;
  const lista = sabimons.filter((c) => filtro === 'todas' || c.raridade === filtro);
  return (
    <main className="tela">
      <div className="linha" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">Álbum</div>
          <h1 className="display h2" style={{ fontSize: 27 }}>Sabimons</h1>
        </div>
        <div className="display" style={{ fontSize: 28, color: 'var(--green)', fontVariantNumeric: 'tabular-nums', textAlign: 'right', lineHeight: 1 }}>
          {formas}<span style={{ fontSize: 16, color: 'var(--muted)' }}>/{totalFormas}</span>
          <div className="small" style={{ fontFamily: 'var(--body)', fontWeight: 800, color: 'var(--muted)' }}>formas</div>
        </div>
      </div>
      <div className="barra barra-verde" role="progressbar" aria-valuenow={formas} aria-valuemax={totalFormas} aria-label="Formas no álbum"><div style={{ width: `${(formas / totalFormas) * 100}%` }} /></div>
      <p className="muted small" style={{ margin: 0 }}>Complete as 3 formas de cada Sabimon. Você tem {tem} de {sabimons.length} Sabimons. Ao todo serão {TOTAL_PLANEJADO}!</p>

      {e.pacotes.length > 0 && <button className="btn btn-rosa btn-bloco" onClick={() => ir('pacote')}>Abrir {e.pacotes.length} {e.pacotes.length > 1 ? 'pacotes' : 'pacote'}</button>}
      <button className="btn btn-escuro btn-bloco" onClick={() => ir('loja')}><Moeda /> Lojinha · {saldo(e).toLocaleString('pt-BR')} Sabicoins</button>

      <div className="linha" style={{ gap: 8, flexWrap: 'wrap' }}>
        {FILTROS.map(([k, r]) => (
          <button key={k} onClick={() => setFiltro(k)} aria-pressed={filtro === k} aria-label={k === 'todas' ? 'Todos' : ROTULO[k as Raridade]}
            style={{ border: 0, borderRadius: 999, padding: '8px 14px', minHeight: 40, fontWeight: 900, fontSize: 14,
              background: filtro === k ? 'var(--ink)' : 'var(--surface)', color: filtro === k ? 'var(--bg)' : 'var(--ink)', boxShadow: filtro === k ? undefined : 'inset 0 0 0 1.5px var(--line)' }}>{r}</button>
        ))}
      </div>
      <div className="grade-3">
        {lista.map((c) => (
          <div key={c.id} style={{ position: 'relative' }}>
            <CartaView carta={c} forma={formaDe(e, c.id)} tem={e.cartas[c.id] > 0} quantidade={e.cartas[c.id]} onClick={() => ir('album', c.id)} />
            {podeEvoluir(e, c).ok && <span className="selo-novo" style={{ background: 'var(--green)' }}>EVOLUIR!</span>}
          </div>
        ))}
      </div>
      {(e.semNovo ?? 0) > 0 && tem < sabimons.length && (
        <p className="muted small" style={{ margin: 0, textAlign: 'center' }}>
          Garantia: no máximo mais {GARANTIA - e.semNovo} {GARANTIA - e.semNovo > 1 ? 'pacotes' : 'pacote'} até um Sabimon novo.
        </p>
      )}
    </main>
  );
}
