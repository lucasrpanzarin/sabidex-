// Jogos extras de cada mundo: complete a frase, quem sou eu, separe nos grupos e por que aconteceu.
import { useMemo, useState, type ReactNode } from 'react';
import { Ara } from '../components/Ara';
import { Icone } from '../components/Icone';
import { capituloPorId } from '../data';
import type { Capitulo } from '../data/tipos';
import { EXTRA_INFO, concluirExtra, embaralhar, extrasDo, extrasLiberados, type Extra, type Resultado } from '../lib/jogo';
import { ir } from '../lib/rota';
import { getEstado, setEstado } from '../lib/store';
import { Fim } from './Fases';

const LETRAS = ['A', 'B', 'C', 'D'];

function Topo({ cap, x, extra }: { cap: Capitulo; x: Extra; extra?: ReactNode }) {
  return (
    <div className="coluna" style={{ gap: 2 }}>
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <button className="voltar" onClick={() => ir('mundo', cap.id)}><Icone nome="voltar" tamanho={18} espessura={3} />Mundo {cap.numero}</button>
        {extra}
      </div>
      <h1 className="display h2">{EXTRA_INFO[x].titulo}</h1>
      <div className="muted small">{EXTRA_INFO[x].sub}</div>
    </div>
  );
}

function useFim(cap: Capitulo, x: Extra) {
  const [res, setRes] = useState<Resultado | null>(null);
  return {
    res,
    finalizar: () => { const r = concluirExtra(getEstado(), cap, x); setEstado(r.estado); setRes(r); },
    limpar: () => setRes(null),
  };
}

/** Botão de opção (A, B, C, D) com estado de certo/errado depois de responder. */
function Opcao({ letra, texto, estado, onClick }: { letra: string; texto: string; estado: 'livre' | 'certa' | 'errada' | 'apagada'; onClick: () => void }) {
  const cores = { livre: 'var(--line)', certa: '#22C55E', errada: 'var(--red)', apagada: 'var(--line)' };
  return (
    <button onClick={onClick} disabled={estado !== 'livre'} className={`linha ${estado === 'errada' ? 'treme' : ''}`}
      style={{ minHeight: 56, borderRadius: 16, padding: '8px 12px', textAlign: 'left', fontWeight: 700,
        background: estado === 'certa' ? '#DCFCE7' : estado === 'errada' ? '#FFE4E6' : 'var(--surface)',
        border: `3px solid ${cores[estado]}`, opacity: estado === 'apagada' ? 0.45 : 1 }}>
      <span style={{ width: 30, height: 30, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', background: 'var(--bg)' }}>{letra}</span>
      {texto}
    </button>
  );
}

const Estrelas = ({ n, de = 3 }: { n: number; de?: number }) => (
  <div className="display" style={{ fontSize: 36, color: 'var(--t-yellow)', letterSpacing: 4 }} aria-label={`${n} de ${de} estrelas`}>
    {'★'.repeat(n)}<span style={{ color: 'var(--line-2)' }}>{'★'.repeat(de - n)}</span>
  </div>
);
const estrelasDe = (acertos: number, total: number) => (acertos === total ? 3 : acertos >= total * 0.6 ? 2 : 1);

/* ---------- Complete a frase ---------- */
function Lacunas({ cap }: { cap: Capitulo }) {
  const { res, finalizar, limpar } = useFim(cap, 'lacunas');
  const [rodada, setRodada] = useState(0);
  const itens = useMemo(() => embaralhar(cap.lacunas ?? []).slice(0, 6).map((l) => ({ ...l, opcoes: embaralhar([l.resposta, ...l.distratores]) })), [cap, rodada]);
  const [i, setI] = useState(0);
  const [escolha, setEscolha] = useState<string | null>(null);
  const [acertos, setAcertos] = useState(0);

  if (res) return <Fim cap={cap} r={res} titulo={acertos === itens.length ? 'Perfeito!' : 'Muito bem!'}
    detalhe={<><Estrelas n={estrelasDe(acertos, itens.length)} /><div className="display" style={{ fontSize: 22 }}>{acertos} de {itens.length} certas</div></>}
    onDeNovo={() => { setRodada((r) => r + 1); setI(0); setEscolha(null); setAcertos(0); limpar(); }} />;

  const l = itens[i];
  const [antes, depois] = l.frase.split('___');
  const acertou = escolha === l.resposta;
  const responder = (o: string) => { if (escolha) return; setEscolha(o); if (o === l.resposta) setAcertos((a) => a + 1); };
  return (
    <main className="tela">
      <Topo cap={cap} x="lacunas" extra={<span className="pilula">{i + 1}/{itens.length}</span>} />
      <div className="barra barra-ciano"><div style={{ width: `${(i / itens.length) * 100}%` }} /></div>
      <div className="painel-destaque" style={{ minHeight: 130, display: 'grid', placeItems: 'center' }}>
        <p className="display" style={{ fontSize: 22, margin: 0, textAlign: 'center', lineHeight: 1.45 }}>
          {antes}
          <span style={{ display: 'inline-block', minWidth: 90, padding: '0 8px', borderRadius: 10, borderBottom: `3px solid ${escolha ? (acertou ? 'var(--green)' : 'var(--red)') : 'var(--yellow)'}`,
            color: escolha ? 'var(--t-green)' : 'transparent', background: escolha ? '#DCFCE7' : 'var(--surface)' }}>
            {escolha ? l.resposta : '?'}
          </span>
          {depois}
        </p>
      </div>
      <div className="coluna" style={{ gap: 8 }}>
        {l.opcoes.map((o, k) => (
          <Opcao key={o} letra={LETRAS[k]} texto={o} onClick={() => responder(o)}
            estado={!escolha ? 'livre' : o === l.resposta ? 'certa' : o === escolha ? 'errada' : 'apagada'} />
        ))}
      </div>
      {escolha && (
        <div className="coluna sobe" style={{ marginTop: 'auto' }}>
          <div className={`aviso ${acertou ? 'aviso-ok' : 'aviso-erro'}`}><span className="display" style={{ fontSize: 18 }}>{acertou ? 'Acertou!' : `A palavra era "${l.resposta}".`}</span></div>
          <button className="btn btn-amarelo btn-bloco" onClick={() => { if (i + 1 < itens.length) { setI(i + 1); setEscolha(null); } else finalizar(); }}>
            {i + 1 < itens.length ? 'Próxima' : 'Terminar'}
          </button>
        </div>
      )}
    </main>
  );
}

/* ---------- Quem sou eu? ---------- */
function QuemSou({ cap }: { cap: Capitulo }) {
  const { res, finalizar, limpar } = useFim(cap, 'quemsou');
  const [rodada, setRodada] = useState(0);
  const itens = useMemo(() => embaralhar(cap.quemSou ?? []).slice(0, 4).map((q) => ({ ...q, opcoes: embaralhar([q.resposta, ...q.distratores]) })), [cap, rodada]);
  const [i, setI] = useState(0);
  const [pistas, setPistas] = useState(1);
  const [erradas, setErradas] = useState<string[]>([]);
  const [acabou, setAcabou] = useState<'acertou' | 'errou' | null>(null);
  const [pontos, setPontos] = useState(0);

  const total = itens.length * 3;
  if (res) {
    const n = pontos >= total * 0.85 ? 3 : pontos >= total * 0.5 ? 2 : 1;
    return <Fim cap={cap} r={res} titulo={n === 3 ? 'Detetive!' : 'Muito bem!'}
      detalhe={<><Estrelas n={n} /><div className="display" style={{ fontSize: 22 }}>{pontos} de {total} pontos</div></>}
      onDeNovo={() => { setRodada((r) => r + 1); setI(0); setPistas(1); setErradas([]); setAcabou(null); setPontos(0); limpar(); }} />;
  }

  const q = itens[i];
  const responder = (o: string) => {
    if (acabou) return;
    if (o === q.resposta) { setAcabou('acertou'); setPontos((p) => p + (4 - pistas)); return; }
    setErradas((e) => [...e, o]);
    if (pistas < 3) setPistas(pistas + 1); else setAcabou('errou');
  };
  const valendo = 4 - pistas;
  return (
    <main className="tela">
      <Topo cap={cap} x="quemsou" extra={<span className="pilula">{i + 1}/{itens.length}</span>} />
      <div className="barra barra-rosa"><div style={{ width: `${(i / itens.length) * 100}%` }} /></div>
      <div className="linha" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 'none' }}><Ara tamanho={64} /></div>
        <div className="balao" style={{ flex: 1, marginBottom: 12 }}>
          {acabou ? <>Era <strong>{q.resposta}</strong>!</> : <>Quem sou eu? Acertando agora vale <strong>{valendo} {valendo > 1 ? 'pontos' : 'ponto'}</strong>.</>}
        </div>
      </div>
      <ol className="coluna" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 8 }}>
        {q.pistas.slice(0, acabou ? 3 : pistas).map((p, k) => (
          <li key={k} className={k === pistas - 1 && !acabou ? 'sobe' : ''} style={{ borderRadius: 16, padding: '10px 14px', background: 'var(--surface)', border: '3px solid var(--ink)', fontWeight: 800 }}>
            <span className="eyebrow" style={{ color: 'var(--t-pink)', display: 'block' }}>Pista {k + 1}</span>{p}
          </li>
        ))}
      </ol>
      <div className="grade-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {q.opcoes.map((o, k) => (
          <Opcao key={o} letra={LETRAS[k]} texto={o} onClick={() => responder(o)}
            estado={acabou ? (o === q.resposta ? 'certa' : 'apagada') : erradas.includes(o) ? 'errada' : 'livre'} />
        ))}
      </div>
      {!acabou && pistas < 3 && (
        <button className="btn btn-escuro btn-bloco" onClick={() => setPistas(pistas + 1)}>Quero mais uma pista</button>
      )}
      {acabou && (
        <div className="coluna sobe" style={{ marginTop: 'auto' }}>
          <div className={`aviso ${acabou === 'acertou' ? 'aviso-ok' : 'aviso-erro'}`}>
            <span className="display" style={{ fontSize: 18 }}>{acabou === 'acertou' ? `+${4 - pistas} ${4 - pistas > 1 ? 'pontos' : 'ponto'}!` : 'Dessa vez não deu.'}</span>
          </div>
          <button className="btn btn-amarelo btn-bloco" onClick={() => {
            if (i + 1 < itens.length) { setI(i + 1); setPistas(1); setErradas([]); setAcabou(null); } else finalizar();
          }}>{i + 1 < itens.length ? 'Próximo' : 'Terminar'}</button>
        </div>
      )}
    </main>
  );
}

/* ---------- Separe nos grupos ---------- */
function Grupos({ cap }: { cap: Capitulo }) {
  const { res, finalizar, limpar } = useFim(cap, 'grupos');
  const [rodada, setRodada] = useState(0);
  const telas = useMemo(() => embaralhar(cap.classificar ?? []).slice(0, 2).map((c) => ({
    ...c, fila: embaralhar(c.grupos.flatMap((g, gi) => g.itens.map((t) => ({ t, gi })))),
  })), [cap, rodada]);
  const [ti, setTi] = useState(0);
  const [k, setK] = useState(0);
  const [errado, setErrado] = useState<number | null>(null);
  const [erros, setErros] = useState(0);
  const [pronto, setPronto] = useState(false);

  if (res) return <Fim cap={cap} r={res} titulo={erros === 0 ? 'Sem errar nenhuma!' : 'Tudo no lugar!'}
    detalhe={<><Estrelas n={erros === 0 ? 3 : erros <= 2 ? 2 : 1} /><div className="muted">Erros: {erros}</div></>}
    onDeNovo={() => { setRodada((r) => r + 1); setTi(0); setK(0); setErros(0); setPronto(false); limpar(); }} />;

  const tela = telas[ti];
  const atual = tela.fila[k];
  const colocar = (gi: number) => {
    if (pronto) return;
    if (gi !== atual.gi) { setErros((e) => e + 1); setErrado(gi); setTimeout(() => setErrado(null), 500); return; }
    if (k + 1 < tela.fila.length) setK(k + 1);
    else if (ti + 1 < telas.length) { setTi(ti + 1); setK(0); }
    else { setPronto(true); setTimeout(finalizar, 400); }
  };
  const feitos = tela.fila.slice(0, pronto ? k + 1 : k);
  const cores = ['var(--cyan)', 'var(--pink)', 'var(--yellow)'];
  return (
    <main className="tela">
      <Topo cap={cap} x="grupos" extra={<span className="pilula">{ti + 1}/{telas.length}</span>} />
      <h2 className="display h3" style={{ margin: 0 }}>{tela.pergunta}</h2>
      <div className="painel-destaque sobe" key={`${ti}-${k}`} style={{ minHeight: 90, display: 'grid', placeItems: 'center' }}>
        <p className="display" style={{ fontSize: 22, margin: 0, textAlign: 'center' }}>{atual.t}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tela.grupos.length}, minmax(0,1fr))`, gap: 10 }}>
        {tela.grupos.map((g, gi) => (
          <div key={g.nome} className="coluna" style={{ gap: 8 }}>
            <button onClick={() => colocar(gi)} className={`btn ${errado === gi ? 'btn-vermelho treme' : 'btn-escuro'}`}
              style={{ minHeight: 64, fontSize: 18, boxShadow: `inset 0 0 0 2px ${cores[gi]}, inset 0 -4px 0 var(--bg)` }}>
              {g.nome}
            </button>
            <ul className="coluna" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 6 }} aria-label={`Itens em ${g.nome}`}>
              {feitos.filter((f) => f.gi === gi).map((f) => (
                <li key={f.t} className="pop small" style={{ borderRadius: 12, padding: '6px 10px', background: '#DCFCE7', border: '1.5px solid #22C55E', fontWeight: 700 }}>{f.t}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="muted small" style={{ margin: 0, textAlign: 'center' }}>Toque no grupo certo para essa frase.</p>
    </main>
  );
}

/* ---------- Por que aconteceu? (causa e consequência) ---------- */
function Causas({ cap }: { cap: Capitulo }) {
  const { res, finalizar, limpar } = useFim(cap, 'causas');
  const [rodada, setRodada] = useState(0);
  const pares = useMemo(() => embaralhar(cap.causas ?? []).slice(0, 5), [cap, rodada]);
  const efeitos = useMemo(() => embaralhar(pares), [pares]);
  const [sel, setSel] = useState<string | null>(null);
  const [certos, setCertos] = useState<Set<string>>(new Set());
  const [errado, setErrado] = useState<string | null>(null);
  const [erros, setErros] = useState(0);

  if (res) return <Fim cap={cap} r={res} titulo={erros === 0 ? 'Perfeito!' : 'Muito bem!'}
    detalhe={<><Estrelas n={erros === 0 ? 3 : erros <= 3 ? 2 : 1} />
      <ul className="coluna" style={{ width: '100%', gap: 6, padding: 0, listStyle: 'none', textAlign: 'left' }}>
        {pares.map((p) => <li key={p.causa} className="small"><strong>{p.causa}</strong> → {p.consequencia}</li>)}
      </ul></>}
    onDeNovo={() => { setRodada((r) => r + 1); setCertos(new Set()); setErros(0); setSel(null); limpar(); }} />;

  const ligar = (causaDoEfeito: string) => {
    if (!sel || certos.has(causaDoEfeito)) return;
    if (sel === causaDoEfeito) {
      const n = new Set(certos).add(sel);
      setCertos(n); setSel(null);
      if (n.size === pares.length) setTimeout(finalizar, 500);
    } else { setErros((x) => x + 1); setErrado(causaDoEfeito); setTimeout(() => setErrado(null), 400); }
  };
  return (
    <main className="tela">
      <Topo cap={cap} x="causas" extra={<span className="pilula">{certos.size}/{pares.length}</span>} />
      <p className="muted small" style={{ margin: 0 }}>Toque numa <strong style={{ color: 'var(--t-yellow)' }}>causa</strong> e depois no que aconteceu por causa dela.</p>
      <div className="eyebrow" style={{ color: 'var(--t-yellow)' }}>Causa</div>
      <div className="coluna" style={{ gap: 8 }}>
        {pares.map((p) => {
          const ok = certos.has(p.causa);
          if (ok) return null;
          return (
            <button key={p.causa} onClick={() => setSel(p.causa)} aria-pressed={sel === p.causa}
              className={`btn ${sel === p.causa ? 'btn-amarelo' : 'btn-escuro'}`} style={{ fontSize: 16, minHeight: 56, padding: '8px 12px', justifyContent: 'flex-start', textAlign: 'left' }}>
              {p.causa}
            </button>
          );
        })}
      </div>
      <div className="eyebrow" style={{ color: 'var(--t-cyan)', marginTop: 4 }}>O que aconteceu</div>
      <div className="coluna" style={{ gap: 8 }}>
        {efeitos.map((p) => {
          const ok = certos.has(p.causa);
          return (
            <button key={p.consequencia} disabled={ok} onClick={() => ligar(p.causa)} className={errado === p.causa ? 'treme' : ''}
              style={{ minHeight: 52, borderRadius: 16, padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 15,
                background: ok ? '#DCFCE7' : errado === p.causa ? '#FFE4E6' : 'var(--surface)',
                border: `3px solid ${ok ? '#22C55E' : errado === p.causa ? 'var(--red)' : sel ? 'var(--line-2)' : 'var(--line)'}` }}>
              {ok && <span className="small" style={{ display: 'block', color: 'var(--t-yellow)' }}>{p.causa} →</span>}
              {p.consequencia}
            </button>
          );
        })}
      </div>
      <div className="muted small" style={{ textAlign: 'center' }}>Erros: {erros}</div>
    </main>
  );
}

export function TelaExtra({ capId, x }: { capId: string; x: Extra }) {
  const cap = capituloPorId(capId);
  if (!cap || !extrasDo(cap).includes(x)) return <main className="tela"><p>Jogo não encontrado.</p></main>;
  if (!extrasLiberados(getEstado(), cap.id)) {
    return (
      <main className="tela" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Ara tamanho={110} humor="triste" />
        <div className="balao">Os jogos extras abrem depois que você ouvir os temas do mundo!</div>
        <button className="btn btn-amarelo" onClick={() => ir('fase', cap.id, 'ouvir')}>Ouvir os temas</button>
      </main>
    );
  }
  const Comp = { lacunas: Lacunas, quemsou: QuemSou, grupos: Grupos, causas: Causas }[x];
  return <Comp key={`${capId}-${x}`} cap={cap} />;
}
