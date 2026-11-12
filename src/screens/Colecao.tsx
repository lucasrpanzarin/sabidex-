import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Ara } from '../components/Ara';
import { RasgarPacote } from '../components/RasgarPacote';
import { CartaView, ROTULO, VersoCarta } from '../components/CartaView';
import { Icone } from '../components/Icone';
import { sabimons, sabimonPorId } from '../data';
import type { Raridade, Sabimon } from '../data/tipos';
import { abrirPacote, garantiaAtiva, guardarCartas, GARANTIA } from '../lib/jogo';
import { Faixa, Moeda, Saldo } from '../components/Loja';
import { ESPACOS, PRECO_EVOLUCAO, evoluir, itensDe, podeEvoluir, saldo, visualDe } from '../lib/loja';
import { FIGURINHAS, figurinhaPorId, idCarta, proxima, type Figurinha } from '../lib/figurinhas';
import { CARTAS_PARA_EVOLUIR, type Forma } from '../lib/sabimon';
import { useConta, evoluirNaConta, abrirPacoteNaConta } from '../lib/conta';
import { ir } from '../lib/rota';
import { jogar } from './Inicio';
import { getEstado, setEstado, useEstado } from '../lib/store';
import { PACOTE_BOAS_VINDAS } from '../shared/sync';

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
  const [erro, setErro] = useState<string | null>(null);
  /** Muda quando a abertura falha, para o pacote voltar inteiro. */
  const [tentativa, setTentativa] = useState(0);
  const { conta } = useConta();
  const inicio = useRef(0);
  const pacote = e.pacotes[0];

  // Linha do tempo da abertura: a aba voa, a carta pula de costas; depois a criança vira.
  // Com conta, a carta vem do servidor: espera ela chegar antes de mostrar o verso.
  useEffect(() => {
    if (fase === 'abrindo' && aberto) {
      const t = setTimeout(() => setFase('verso'), Math.max(0, 1150 - (Date.now() - inicio.current)));
      return () => clearTimeout(t);
    }
  }, [fase, aberto]);

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
  const sortear = async () => {
    setErro(null);
    const antes = e.cartas;
    const p = pacote;
    if (conta) {
      // Com conta, quem sorteia é o servidor (ninguém consegue escolher a carta mexendo no aparelho).
      inicio.current = Date.now();
      if (!semMovimento()) setFase('abrindo');
      const r = await abrirPacoteNaConta(p.id);
      const cartas = 'erro' in r ? [] : r.cartas.map((id) => sabimonPorId.get(id)).filter((s): s is Sabimon => !!s);
      if ('erro' in r || !cartas.length) { setFase('fechado'); setTentativa((n) => n + 1); setErro('erro' in r ? r.erro : 'Não consegui abrir o pacote. Tente de novo.'); return; }
      setAberto({ pacoteId: p.id, epico: p.tipo === 'epico', cartas, novos: new Set(cartas.filter((c) => !(antes[c.id] > 0)).map((c) => c.id)) });
      if (semMovimento()) setFase('revelado');
      return;
    }
    const cartas = abrirPacote(sabimons, p.tipo, Math.random, { tem: antes, garantia: garantiaAtiva(e) });
    setAberto({ pacoteId: p.id, epico: p.tipo === 'epico', cartas, novos: new Set(cartas.filter((c) => !(antes[c.id] > 0)).map((c) => c.id)) });
    // Guarda na hora: fechar o app no meio não devolve o pacote para sortear de novo.
    setEstado((s) => guardarCartas(s, p.id, cartas));
    inicio.current = Date.now();
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
  const boasVindas = (aberto ? aberto.pacoteId : pacote?.id) === PACOTE_BOAS_VINDAS;

  return (
    <main className="tela tela-pacote" style={{ alignItems: 'center', textAlign: 'center', ['--luz' as string]: luz }}>
      <div className="linha" style={{ alignSelf: 'stretch', justifyContent: 'space-between', visibility: fase === 'fechado' ? 'visible' : 'hidden' }}>
        <button className="voltar" onClick={() => ir()}><Icone nome="voltar" tamanho={18} espessura={3} />Voltar</button>
        <span className="eyebrow">{e.pacotes.length > 1 ? `${e.pacotes.length} pacotes` : 'Pacote'}</span>
      </div>

      <h1 className={`display h1 titulo-premio${fase === 'revelado' ? ' pop' : ''}`} style={{ marginTop: 4, minHeight: '1.2em', visibility: fase === 'abrindo' ? 'hidden' : 'visible' }}>
        {fase === 'fechado' && (boasVindas ? 'Boas-vindas!' : epico ? 'Pacote épico!' : 'Novo pacote!')}
        {fase === 'verso' && 'O que será?'}
        {fase === 'revelado' && melhor && (melhor.raridade === 'lendaria' ? 'Lendário!' : melhor.raridade === 'epica' ? 'Épico!' : novo ? 'Sabimon novo!' : 'Repetido!')}
      </h1>

      <div className="palco-abrir">
        {(fase === 'fechado' || fase === 'abrindo') && (
          <RasgarPacote key={`${pacote?.id ?? 'x'}-${tentativa}`} epico={epico} texto={epico ? 'Vem épico ou lendário!' : boasVindas ? 'Seu primeiro Sabimon!' : '1 Sabimon surpresa'}
            abrindo={fase === 'abrindo'} aoRasgar={() => void sortear()} />
        )}
        {fase === 'abrindo' && <span className="luz-pacote" aria-hidden="true" />}
        {fase === 'revelado' && raro && <div className="raios" aria-hidden="true" />}
        {fase === 'revelado' && (novo || raro) && <Confete />}
        {aberto && melhor && fase !== 'fechado' && (
          <button className={`carta-flip fase-${fase}`} onClick={fase === 'verso' ? virar : undefined} disabled={fase !== 'verso'}
            aria-label={fase === 'verso' ? 'Toque na carta para virar' : `${melhor.formas[0].nome}, ${ROTULO[melhor.raridade]}`}>
            <span className="carta-flip-dentro">
              <span className="carta-flip-verso" aria-hidden="true"><VersoCarta /></span>
              <span className="carta-flip-frente">
                <CartaView carta={melhor} grande animar={fase === 'revelado'} />
                {novo && fase === 'revelado' && <span className="selo-novo" style={{ fontSize: 14, padding: '4px 10px', top: -10, right: -8 }}>NOVO</span>}
              </span>
            </span>
          </button>
        )}
      </div>

      {fase === 'fechado' && erro && <div className="aviso aviso-erro" role="alert" style={{ width: '100%' }}>{erro}</div>}
      {fase === 'fechado' && boasVindas && (
        <div className="linha" style={{ alignItems: 'flex-end', alignSelf: 'stretch' }}>
          <Ara tamanho={70} />
          <div className="balao small" style={{ flex: 1, marginBottom: 10, textAlign: 'left' }}>Um presente para começar! Passe o dedo para rasgar e conheça seu primeiro <strong>Sabimon</strong>.</div>
        </div>
      )}
      {fase === 'fechado' && !conta && garantiaAtiva(e) && <p className="small" style={{ color: 'var(--t-green)', fontWeight: 800, margin: 0 }}>Este pacote garante um Sabimon novo!</p>}
      {fase === 'fechado' && e.pacotes.length > 1 && <p className="muted small" style={{ margin: 0 }}>Mais {e.pacotes.length - 1} {e.pacotes.length > 2 ? 'pacotes' : 'pacote'} depois desse</p>}
      {fase === 'verso' && <p className="rasgar-ajuda pisca-suave">Toque na carta para virar!</p>}

      {fase === 'revelado' && aberto && melhor && (
        <div className="coluna sobe" style={{ width: '100%', marginTop: 'auto', animationDelay: '.5s' }}>
          {boasVindas && (
            <div className="balao small" style={{ textAlign: 'left' }}>
              Este é o seu primeiro! Agora os pacotes vêm do <strong>estudo</strong>: termine as fases com nota 7 ou mais para ganhar mais, completar o álbum, evoluir e duelar com a turma.
            </div>
          )}
          <p className="muted small" style={{ margin: 0 }}>
            {nNovos ? (aberto.cartas.length > 1 ? `${nNovos} Sabimons novos no álbum!` : 'Novo no seu álbum!') : `Você tem ${e.cartas[melhor.id] ?? 1} cartas de ${melhor.formas[0].nome}. Junte 3 para evoluir, ou troque com os amigos.`}
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

/** Carta que acabou de nascer de uma evolução (para a tela dela comemorar). */
let acabouDeEvoluir = '';

/** Última figurinha aberta: ao voltar para o álbum, a tela desce até ela (e não volta para o topo). */
let ultimaVista = '';

/** Aba do álbum que estava aberta: Sabimons (bichos) ou Lendas do Brasil. */
let abaLendas = false;

/** Detalhe de uma figurinha: carta grande, itens, quantas tem e evolução. */
function Detalhe({ f }: { f: Figurinha }) {
  const e = useEstado();
  ultimaVista = f.id;
  const { conta } = useConta();
  const [evoluiu] = useState(() => { const v = acabouDeEvoluir === f.id; acabouDeEvoluir = ''; return v; });
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const s = f.s;
  const n = e.cartas[f.id] ?? 0;
  const itens = itensDe(e, f.id);
  const p = podeEvoluir(e, f.id);
  const alvo = proxima(f);
  const anterior = f.forma > 1 ? figurinhaPorId.get(idCarta(s.id, (f.forma - 1) as Forma)) : undefined;
  const voltar = <button className="voltar" onClick={() => ir('album')}><Icone nome="voltar" tamanho={18} espessura={3} />Álbum</button>;

  const evoluirAgora = async () => {
    if (!alvo) return;
    setErro('');
    if (conta) {
      setOcupado(true);
      const msg = await evoluirNaConta(f.id);
      setOcupado(false);
      if (msg) { setErro(msg); return; }
    } else {
      const novo = evoluir(getEstado(), f.id);
      if (!novo) return;
      setEstado(novo);
    }
    acabouDeEvoluir = alvo.id;
    ir('album', alvo.id);
  };

  if (n === 0) {
    return (
      <main className="tela" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div style={{ alignSelf: 'flex-start' }}>{voltar}</div>
        <div style={{ width: 'min(290px, 100%)' }}><CartaView carta={s} forma={f.forma} tem={false} grande /></div>
        <div className="painel" style={{ width: '100%' }}>
          {f.forma === 1
            ? <div className="muted">Você ainda não tem <strong style={{ color: 'var(--ink)' }}>{s.formas[0].nome}</strong>. Ele vem nos pacotes: continue jogando!</div>
            : <div className="muted">Para ganhar <strong style={{ color: 'var(--ink)' }}>{s.formas[f.forma - 1].nome}</strong>, junte {CARTAS_PARA_EVOLUIR[f.forma as 2 | 3]} cartas de <strong style={{ color: 'var(--ink)' }}>{anterior?.s.formas[anterior.forma - 1].nome}</strong> e evolua.</div>}
        </div>
        {anterior && (e.cartas[anterior.id] ?? 0) > 0 && <button className="btn btn-escuro btn-bloco" onClick={() => ir('album', anterior.id)}>Ver {s.formas[anterior.forma - 1].nome}</button>}
      </main>
    );
  }

  const precisa = p.gasta ?? 0;
  return (
    <main className="tela" style={{ alignItems: 'center', textAlign: 'center' }}>
      <div className="linha" style={{ alignSelf: 'stretch', justifyContent: 'space-between' }}>
        {voltar}
        <Saldo valor={saldo(e)} />
      </div>
      {evoluiu && <div className="display titulo-premio pop" style={{ fontSize: 30 }}>Evoluiu!</div>}
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center', width: '100%', overflow: 'hidden', borderRadius: 24 }}>
        {evoluiu && <div className="raios" aria-hidden="true" />}
        <div className={evoluiu ? 'pop' : undefined} style={{ position: 'relative', width: 'min(290px, 100%)' }}>
          <CartaView carta={s} forma={f.forma} itens={itens} visual={visualDe(e, f.id)} grande animar />
        </div>
      </div>
      <Faixa itens={itens} onLivre={() => ir('loja', f.id)} />

      <div className="painel coluna" style={{ width: '100%', gap: 8 }}>
        <div className="display" style={{ fontSize: 18 }}>
          {n > 1 ? `Você tem ${n} cartas` : 'Você tem 1 carta'}
        </div>
        {p.ok ? (
          <>
            <div className="muted small">Troque <strong style={{ color: 'var(--ink)' }}>{p.gasta} cartas</strong> de {s.formas[f.forma - 1].nome} por 1 <strong style={{ color: 'var(--ink)' }}>{s.formas[p.forma - 1].nome}</strong>. As {p.gasta} cartas saem do seu álbum. Custa também {PRECO_EVOLUCAO[p.forma]} Sabicoins.</div>
            <button className="btn btn-amarelo btn-bloco" disabled={ocupado} onClick={() => void evoluirAgora()}>
              {ocupado ? 'Evoluindo…' : <>Evoluir por <Moeda /> {PRECO_EVOLUCAO[p.forma]}</>}
            </button>
          </>
        ) : p.motivo === 'final' ? (
          <div className="muted small">Forma final! As cartas repetidas servem para trocar com os amigos.</div>
        ) : p.motivo === 'desenho' ? (
          <div className="muted small">A evolução para <strong style={{ color: 'var(--ink)' }}>{alvo?.s.formas[alvo.forma - 1].nome}</strong> ainda está sendo desenhada. Junte {precisa} cartas enquanto isso!</div>
        ) : p.motivo === 'copias' ? (
          <>
            <div className="barra barra-verde" aria-hidden="true"><div style={{ width: `${Math.min(1, n / (n + p.faltam!)) * 100}%` }} /></div>
            <div className="muted small">Junte {precisa} cartas de {s.formas[f.forma - 1].nome} para trocar por 1 <strong style={{ color: 'var(--ink)' }}>{alvo?.s.formas[alvo.forma - 1].nome}</strong>. Falta{p.faltam! > 1 ? 'm' : ''} {p.faltam}.{itens.length > 0 ? ' (A carta com itens fica com você.)' : ''}</div>
          </>
        ) : (
          <div className="muted small">Você já tem as cartas! Faltam {p.faltam} Sabicoins para evoluir para <strong style={{ color: 'var(--ink)' }}>{alvo?.s.formas[alvo.forma - 1].nome}</strong>.</div>
        )}
        {erro && <div className="aviso aviso-erro">{erro}</div>}
      </div>
      {alvo && (e.cartas[alvo.id] ?? 0) > 0 && <button className="btn btn-escuro btn-bloco" onClick={() => ir('album', alvo.id)}>Ver {alvo.s.formas[alvo.forma - 1].nome}</button>}
      {itens.length < ESPACOS && <button className="btn btn-escuro btn-bloco" onClick={() => ir('loja', f.id)}>Colocar item da lojinha</button>}
    </main>
  );
}

export function Album({ id }: { id?: string }) {
  const e = useEstado();
  const [filtro, setFiltro] = useState<Raridade | 'todas'>('todas');
  // Volta na aba da última figurinha vista (se era uma lenda, abre "Lendas do Brasil").
  const [lendas, setLendas] = useState(() => (ultimaVista ? !!figurinhaPorId.get(ultimaVista)?.s.lenda : abaLendas));
  const trocarAba = (l: boolean) => { abaLendas = l; setLendas(l); };
  const detalhe = id ? figurinhaPorId.get(id) : undefined;
  // Voltando de uma figurinha: põe essa figurinha no meio da tela, onde a criança estava.
  useLayoutEffect(() => {
    if (detalhe || !ultimaVista) return;
    const alvo = ultimaVista;
    ultimaVista = '';
    const descer = () => document.querySelector(`[data-figurinha="${alvo}"]`)?.scrollIntoView({ block: 'center' });
    descer();
    const r = requestAnimationFrame(descer); // o navegador às vezes rola sozinho depois do "voltar"
    return () => cancelAnimationFrame(r);
  }, [detalhe]);
  if (detalhe) return <Detalhe key={detalhe.id} f={detalhe} />;

  // O álbum tem as 3 formas de cada Sabimon, cada uma com seu número.
  // Duas abas separadas: os bichos de verdade e as Lendas do Brasil, cada uma com a sua contagem.
  const daAba = FIGURINHAS.filter((f) => !!f.s.lenda === lendas);
  const tem = daAba.filter((f) => e.cartas[f.id] > 0).length;
  const total = daAba.length;
  const lista = daAba.filter((f) => filtro === 'todas' || f.s.raridade === filtro);
  return (
    <main className="tela">
      <div className="linha" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">Álbum</div>
          <h1 className="display h2" style={{ fontSize: 27 }}>{lendas ? 'Lendas do Brasil' : 'Sabimons'}</h1>
        </div>
        <div className="display" style={{ fontSize: 28, color: 'var(--t-green)', fontVariantNumeric: 'tabular-nums', textAlign: 'right', lineHeight: 1 }}>
          {tem}<span style={{ fontSize: 16, color: 'var(--muted)' }}>/{total}</span>
          <div className="small" style={{ fontFamily: 'var(--body)', fontWeight: 800, color: 'var(--muted)' }}>figurinhas</div>
        </div>
      </div>
      <div className="abas" role="tablist" aria-label="Página do álbum">
        <button role="tab" aria-selected={!lendas} onClick={() => trocarAba(false)}>Sabimons</button>
        <button role="tab" aria-selected={lendas} onClick={() => trocarAba(true)}>Lendas do Brasil</button>
      </div>
      {lendas && <p className="muted small" style={{ margin: 0 }}>Personagens das histórias do nosso folclore. Vêm nos mesmos pacotes.</p>}
      <div className="barra barra-verde" role="progressbar" aria-valuenow={tem} aria-valuemax={total} aria-label={lendas ? "Figurinhas de lendas" : "Figurinhas de Sabimons"}><div style={{ width: `${(tem / total) * 100}%` }} /></div>
      <p className="muted small" style={{ margin: 0 }}>3 cartas iguais viram a forma 2. 2 cartas da forma 2 viram a forma 3.</p>

      {e.pacotes.length > 0 && <button className="btn btn-rosa btn-bloco" onClick={() => ir('pacote')}>Abrir {e.pacotes.length} {e.pacotes.length > 1 ? 'pacotes' : 'pacote'}</button>}
      <button className="btn btn-escuro btn-bloco" onClick={() => ir('loja')}><Moeda /> Lojinha · {saldo(e).toLocaleString('pt-BR')} Sabicoins</button>

      <div className="linha" style={{ gap: 8, flexWrap: 'wrap' }}>
        {FILTROS.map(([k, r]) => (
          <button key={k} onClick={() => setFiltro(k)} aria-pressed={filtro === k} aria-label={k === 'todas' ? 'Todos' : ROTULO[k as Raridade]}
            className={`filtro ${k}`}>{r}</button>
        ))}
      </div>
      <div className="grade-3">
        {lista.map((f) => (
          <div key={f.id} data-figurinha={f.id} style={{ position: 'relative' }}>
            <CartaView carta={f.s} forma={f.forma} visual={visualDe(e, f.id)} tem={e.cartas[f.id] > 0} quantidade={e.cartas[f.id]} onClick={() => ir('album', f.id)} />
            {podeEvoluir(e, f.id).ok && <span className="selo-novo" style={{ background: 'var(--green)' }}>EVOLUIR!</span>}
          </div>
        ))}
      </div>
      {(e.semNovo ?? 0) > 0 && sabimons.some((s) => !(e.cartas[s.id] > 0)) && (
        <p className="muted small" style={{ margin: 0, textAlign: 'center' }}>
          Garantia: no máximo mais {GARANTIA - e.semNovo} {GARANTIA - e.semNovo > 1 ? 'pacotes' : 'pacote'} até um Sabimon novo.
        </p>
      )}
    </main>
  );
}
