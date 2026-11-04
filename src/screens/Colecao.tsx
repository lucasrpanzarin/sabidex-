import { useEffect, useState } from 'react';
import { Ara } from '../components/Ara';
import { RasgarPacote } from '../components/RasgarPacote';
import { CartaView, ROTULO } from '../components/CartaView';
import { Icone } from '../components/Icone';
import { sabimonPorId, sabimons, TOTAL_PLANEJADO } from '../data';
import type { Raridade, Sabimon } from '../data/tipos';
import { abrirPacote, garantiaAtiva, guardarCartas, GARANTIA } from '../lib/jogo';
import { Faixa, Moeda, Saldo } from '../components/Loja';
import { ESPACOS, PRECO_EVOLUCAO, copiasGastas, evoluir, formaDe, itensDe, podeEvoluir, saldo, visualDe } from '../lib/loja';
import { useConta, evoluirNaConta } from '../lib/conta';
import { ir } from '../lib/rota';
import { jogar } from './Inicio';
import { getEstado, setEstado, useEstado } from '../lib/store';

type FaseAbrir = 'fechado' | 'abrindo' | 'verso' | 'revelado';

const semMovimento = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

/** Cor da luz que sai do pacote: dá uma dica da raridade antes de virar a carta. */
const LUZ: Record<Raridade, string> = { comum: '#FFFFFF', rara: '#22D3EE', epica: '#F472B6', lendaria: '#FFC21A' };

export function AbrirPacote() {
  const e = useEstado();
  const [aberto, setAberto] = useState<{ pacoteId: string; epico: boolean; cartas: Sabimon[]; novos: Set<string> } | null>(null);
  const [fase, setFase] = useState<FaseAbrir>('fechado');
  const pacote = e.pacotes[0];

  // Linha do tempo da abertura: a aba voa, a carta pula de costas; depois a criança vira.
  useEffect(() => {
    if (fase === 'abrindo') { const t = setTimeout(() => setFase('verso'), 1150); return () => clearTimeout(t); }
  }, [fase]);

  if (!pacote && !aberto) {
    return (
      <main className="tela" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Ara tamanho={110} />
        <div className="balao">Nenhum pacote agora. Jogue as fases para ganhar mais!</div>
        <button className="btn btn-amarelo" onClick={() => ir('mundos')}>Ir para as fases</button>
      </main>
    );
  }

  const epico = aberto ? aberto.epico : pacote.tipo === 'epico';
  const sortear = () => {
    const cartas = abrirPacote(sabimons, pacote.tipo, Math.random, { tem: e.cartas, garantia: garantiaAtiva(e) });
    setAberto({ pacoteId: pacote.id, epico: pacote.tipo === 'epico', cartas, novos: new Set(cartas.filter((c) => !(e.cartas[c.id] > 0)).map((c) => c.id)) });
    // Guarda na hora: fechar o app no meio não devolve o pacote para sortear de novo.
    setEstado((s) => guardarCartas(s, pacote.id, cartas));
    setFase(semMovimento() ? 'revelado' : 'abrindo');
  };
  const virar = () => {
    setFase('revelado');
    if (aberto && aberto.cartas[aberto.cartas.length - 1].raridade === 'lendaria') { try { navigator.vibrate?.([40, 60, 40]); } catch { /* sem vibração */ } }
  };
  /** O Sabimon já foi guardado ao rasgar; aqui só volta para o próximo pacote. */
  const guardar = () => { setAberto(null); setFase('fechado'); };

  const melhor = aberto?.cartas[aberto.cartas.length - 1];
  const raro = melhor && (melhor.raridade === 'lendaria' || melhor.raridade === 'epica');
  const novo = !!melhor && !!aberto?.novos.has(melhor.id);
  const nNovos = aberto?.novos.size ?? 0;
  const luz = melhor ? LUZ[melhor.raridade] : '#FFFFFF';
  const sobra = e.pacotes.length;

  return (
    <main className="tela tela-pacote" style={{ alignItems: 'center', textAlign: 'center', ['--luz' as string]: luz }}>
      <div className="linha" style={{ alignSelf: 'stretch', justifyContent: 'space-between', visibility: fase === 'fechado' ? 'visible' : 'hidden' }}>
        <button className="voltar" onClick={() => ir()}><Icone nome="voltar" tamanho={18} espessura={3} />Voltar</button>
        <span className="eyebrow">{e.pacotes.length > 1 ? `${e.pacotes.length} pacotes` : 'Pacote'}</span>
      </div>

      <h1 className={`display h1 titulo-premio${fase === 'revelado' ? ' pop' : ''}`} style={{ marginTop: 4, minHeight: '1.2em', visibility: fase === 'abrindo' ? 'hidden' : 'visible' }}>
        {fase === 'fechado' && (epico ? 'Pacote épico!' : 'Novo pacote!')}
        {fase === 'verso' && 'O que será?'}
        {fase === 'revelado' && melhor && (melhor.raridade === 'lendaria' ? 'Lendário!' : melhor.raridade === 'epica' ? 'Épico!' : novo ? 'Sabimon novo!' : 'Repetido!')}
      </h1>

      <div className="palco-abrir">
        {(fase === 'fechado' || fase === 'abrindo') && (
          <RasgarPacote key={pacote?.id ?? 'x'} epico={epico} texto={epico ? '1 Sabimon épico ou lendário' : '1 Sabimon surpresa'}
            abrindo={fase === 'abrindo'} aoRasgar={sortear} />
        )}
        {fase === 'abrindo' && <span className="luz-pacote" aria-hidden="true" />}
        {fase === 'revelado' && raro && <div className="raios" aria-hidden="true" />}
        {fase === 'revelado' && (novo || raro) && <Confete />}
        {aberto && melhor && fase !== 'fechado' && (
          <button className={`carta-flip fase-${fase}`} onClick={fase === 'verso' ? virar : undefined} disabled={fase !== 'verso'}
            aria-label={fase === 'verso' ? 'Toque na carta para virar' : `${melhor.formas[0].nome}, ${ROTULO[melhor.raridade]}`}>
            <span className="carta-flip-dentro">
              <span className="carta-flip-verso" aria-hidden="true">
                <span className="logo" style={{ fontSize: 30 }}>Sabidex</span>
                <span className="pacote-palco"><Ara tamanho={86} /></span>
              </span>
              <span className="carta-flip-frente">
                <CartaView carta={melhor} grande animar={fase === 'revelado'} />
                {novo && fase === 'revelado' && <span className="selo-novo" style={{ fontSize: 14, padding: '4px 10px', top: -10, right: -8 }}>NOVO</span>}
              </span>
            </span>
          </button>
        )}
      </div>

      {fase === 'fechado' && garantiaAtiva(e) && <p className="small" style={{ color: 'var(--t-green)', fontWeight: 800, margin: 0 }}>Este pacote garante um Sabimon novo!</p>}
      {fase === 'fechado' && e.pacotes.length > 1 && <p className="muted small" style={{ margin: 0 }}>Mais {e.pacotes.length - 1} {e.pacotes.length > 2 ? 'pacotes' : 'pacote'} depois desse</p>}
      {fase === 'verso' && <p className="rasgar-ajuda pisca-suave">Toque na carta para virar!</p>}

      {fase === 'revelado' && aberto && melhor && (
        <div className="coluna sobe" style={{ width: '100%', marginTop: 'auto', animationDelay: '.5s' }}>
          <p className="muted small" style={{ margin: 0 }}>
            {nNovos ? (aberto.cartas.length > 1 ? `${nNovos} Sabimons novos no álbum!` : 'Novo no seu álbum!') : `Você tem ${e.cartas[melhor.id] ?? 1} cópias. Elas ajudam a evoluir e servem para trocar.`}
          </p>
          {sobra > 0 ? (
            <button className="btn btn-amarelo btn-bloco" onClick={guardar}>Abrir o próximo</button>
          ) : (
            <>
              <button className="btn btn-amarelo btn-bloco" onClick={() => { guardar(); jogar(); }}>Continuar jogando</button>
              <button className="btn btn-escuro btn-bloco" onClick={() => { guardar(); ir('album'); }}>Ver no álbum</button>
            </>
          )}
        </div>
      )}
    </main>
  );
}

const CORES_CONFETE = ['#FF5A36', '#FFC21A', '#22C3D6', '#F472B6', '#22B35E'];

/** Confete que cai uma vez quando a carta vira (só em momento de prêmio). */
function Confete() {
  const pedacos = Array.from({ length: 26 }, (_, i) => ({
    x: (i * 37) % 100, atraso: (i % 7) * 0.06, dur: 1.1 + ((i * 13) % 9) / 10, giro: (i * 47) % 360, cor: CORES_CONFETE[i % CORES_CONFETE.length],
  }));
  return (
    <div className="confete" aria-hidden="true">
      {pedacos.map((c, i) => (
        <span key={i} style={{ left: `${c.x}%`, background: c.cor, animationDelay: `${c.atraso}s`, animationDuration: `${c.dur}s`, ['--giro' as string]: `${c.giro}deg` }} />
      ))}
    </div>
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
      {evoluiu && <div className="display titulo-premio pop" style={{ fontSize: 30 }}>Evoluiu!</div>}
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center', width: '100%', overflow: 'hidden', borderRadius: 24 }}>
        {evoluiu && <div className="raios" aria-hidden="true" />}
        <div key={forma} className={evoluiu ? 'pop' : undefined} style={{ position: 'relative', width: 'min(290px, 100%)' }}>
          <CartaView carta={s} forma={forma} itens={itens} visual={visualDe(e, s.id)} grande animar />
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
        <div className="display" style={{ fontSize: 28, color: 'var(--t-green)', fontVariantNumeric: 'tabular-nums', textAlign: 'right', lineHeight: 1 }}>
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
            className={`filtro ${k}`}>{r}</button>
        ))}
      </div>
      <div className="grade-3">
        {lista.map((c) => (
          <div key={c.id} style={{ position: 'relative' }}>
            <CartaView carta={c} forma={formaDe(e, c.id)} visual={visualDe(e, c.id)} tem={e.cartas[c.id] > 0} quantidade={e.cartas[c.id]} onClick={() => ir('album', c.id)} />
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
