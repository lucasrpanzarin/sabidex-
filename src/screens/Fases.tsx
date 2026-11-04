import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Ara } from '../components/Ara';
import { Icone } from '../components/Icone';
import { capituloPorId } from '../data';
import type { Capitulo } from '../data/tipos';
import { FASE_INFO, NOTA_MINIMA, concluirFase, embaralhar, liberada, nivel, notaDe, type Fase, type Resultado } from '../lib/jogo';
import { ir } from '../lib/rota';
import { getEstado, setEstado } from '../lib/store';

/** Transforma **negrito** em <strong>. */
export function Texto({ t }: { t: string }) {
  const partes = t.split(/\*\*(.+?)\*\*/g);
  return <>{partes.map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : p))}</>;
}

function Topo({ cap, fase, extra }: { cap: Capitulo; fase: Fase; extra?: ReactNode }) {
  return (
    <div className="coluna" style={{ gap: 2 }}>
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <button className="voltar" onClick={() => ir('mundo', cap.id)}><Icone nome="voltar" tamanho={18} espessura={3} />Mundo {cap.numero}</button>
        {extra}
      </div>
      <h1 className="display h2">{FASE_INFO[fase].titulo}</h1>
      <div className="muted small">{FASE_INFO[fase].sub}</div>
    </div>
  );
}

/** Tela de resultado com XP, nível e pacote ganhos. */
function Fim({ cap, r, titulo, detalhe, aprovado = true, onDeNovo }: { cap: Capitulo; r: Resultado; titulo: string; detalhe?: ReactNode; aprovado?: boolean; onDeNovo: () => void }) {
  const nv = nivel(r.estado.xp);
  return (
    <main className="tela" style={{ alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
      <div className="pop"><Ara tamanho={120} humor={aprovado ? 'feliz' : 'triste'} /></div>
      <h1 className="display h1" style={{ color: aprovado ? 'var(--yellow)' : 'var(--ink)', textShadow: aprovado ? '0 3px 0 #B45309' : undefined }}>{titulo}</h1>
      {detalhe}
      <div className="painel coluna sobe" style={{ width: '100%', gap: 8, animationDelay: '.15s' }}>
        <div className="display" style={{ fontSize: 30, color: 'var(--cyan-2)' }}>+{r.xpGanho} XP</div>
        {r.subiuNivel && <div className="display pop" style={{ fontSize: 22, color: 'var(--green)' }}>Subiu para o nível {nv.nivel}!</div>}
        {!r.primeiraVez && aprovado && <div className="muted small">Fase repetida: metade do XP.</div>}
      </div>
      {r.pacoteGanho && (
        <div className="painel-destaque sobe" style={{ width: '100%', animationDelay: '.3s', borderColor: 'var(--pink)' }}>
          <div className="display" style={{ fontSize: 22 }}>Você ganhou um pacote{r.pacoteGanho === 'epico' ? ' épico' : ''}!</div>
          <div className="muted small">{r.pacoteGanho === 'epico' ? '3 cartas, uma delas épica ou lendária' : '3 cartas para o seu álbum'}</div>
        </div>
      )}
      <div className="coluna" style={{ width: '100%', marginTop: 8 }}>
        {r.pacoteGanho
          ? <button className="btn btn-amarelo btn-bloco" onClick={() => ir('pacote')}>Abrir pacote</button>
          : <button className="btn btn-amarelo btn-bloco" onClick={() => ir('mundo', cap.id)}>Continuar</button>}
        <button className="btn btn-escuro btn-bloco" onClick={onDeNovo}>Jogar de novo</button>
      </div>
    </main>
  );
}

function useFinalizar(cap: Capitulo, fase: Fase) {
  const [res, setRes] = useState<Resultado | null>(null);
  const finalizar = (nota?: number) => {
    const r = concluirFase(getEstado(), cap.id, fase, nota);
    setEstado(r.estado);
    setRes(r);
  };
  return { res, finalizar, limpar: () => setRes(null) };
}

/* ---------- Fase 1: ouvir ---------- */
function Ouvir({ cap }: { cap: Capitulo }) {
  const { res, finalizar, limpar } = useFinalizar(cap, 'ouvir');
  const [ouvidos, setOuvidos] = useState<Set<number>>(new Set());
  const [tocando, setTocando] = useState<number | null>(null);
  const [aberto, setAberto] = useState<number | null>(0);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => audio.current?.pause(), []);

  const tocar = (i: number) => {
    const t = cap.temas[i];
    if (!t.audio) return;
    if (tocando === i) { audio.current?.pause(); setTocando(null); return; }
    audio.current?.pause();
    const a = new Audio(import.meta.env.BASE_URL + t.audio);
    audio.current = a;
    a.ontimeupdate = () => { if (a.duration && a.currentTime / a.duration > 0.8) setOuvidos((s) => new Set(s).add(i)); };
    a.onended = () => { setTocando(null); setOuvidos((s) => new Set(s).add(i)); };
    a.onerror = () => setTocando(null);
    a.play().then(() => { setTocando(i); setAberto(i); }).catch(() => setTocando(null));
  };

  if (res) return <Fim cap={cap} r={res} titulo="Você ouviu tudo!" onDeNovo={() => { setOuvidos(new Set()); limpar(); }} />;
  const total = cap.temas.length;
  return (
    <main className="tela">
      <Topo cap={cap} fase="ouvir" extra={<span className="pilula">{ouvidos.size}/{total}</span>} />
      <div className="barra barra-verde"><div style={{ width: `${(ouvidos.size / total) * 100}%` }} /></div>
      <div className="coluna">
        {cap.temas.map((t, i) => (
          <article key={i} className="painel" style={{ padding: 14, borderColor: tocando === i ? 'var(--yellow)' : ouvidos.has(i) ? '#22C55E' : undefined }}>
            <div className="linha">
              <button onClick={() => tocar(i)} aria-label={tocando === i ? `Pausar ${t.titulo}` : `Ouvir ${t.titulo}`}
                className={`btn ${tocando === i ? 'btn-amarelo' : ouvidos.has(i) ? 'btn-verde' : 'btn-ciano'}`} style={{ width: 52, height: 52, padding: 0, borderRadius: '50%', flex: 'none' }}>
                <Icone nome={tocando === i ? 'pause' : ouvidos.has(i) ? 'check' : 'play'} cheio={!ouvidos.has(i) || tocando === i} espessura={3} />
              </button>
              <button onClick={() => setAberto(aberto === i ? null : i)} style={{ flex: 1, background: 'none', border: 0, textAlign: 'left', padding: 0 }} aria-expanded={aberto === i}>
                <span className="eyebrow" style={{ color: 'var(--muted)' }}>Tema {i + 1}</span>
                <span className="display" style={{ display: 'block', fontSize: 19 }}>{t.titulo}</span>
              </button>
            </div>
            {aberto === i && (
              <ul style={{ margin: '10px 0 0', paddingLeft: 20, display: 'grid', gap: 6, fontWeight: 600 }}>
                {t.pontos.map((p, j) => <li key={j}><Texto t={p} /></li>)}
              </ul>
            )}
          </article>
        ))}
      </div>
      <button className="btn btn-amarelo btn-bloco" disabled={ouvidos.size < total} onClick={() => { audio.current?.pause(); finalizar(); }}>
        {ouvidos.size < total ? `Ouça todos os temas (${total - ouvidos.size} faltando)` : 'Terminar fase'}
      </button>
    </main>
  );
}

/* ---------- Fase 2: jogo da memória (ligar pares) ---------- */
function Memoria({ cap }: { cap: Capitulo }) {
  const { res, finalizar, limpar } = useFinalizar(cap, 'memoria');
  const [rodada, setRodada] = useState(0);
  const pares = useMemo(() => embaralhar(cap.pares).slice(0, 6), [cap, rodada]);
  const palavras = useMemo(() => embaralhar(pares), [pares]);
  const sigs = useMemo(() => embaralhar(pares), [pares]);
  const [sel, setSel] = useState<string | null>(null);
  const [certos, setCertos] = useState<Set<string>>(new Set());
  const [erros, setErros] = useState(0);
  const [errado, setErrado] = useState<string | null>(null);

  const escolherSig = (palavraDoSig: string) => {
    if (!sel || certos.has(palavraDoSig)) return;
    if (sel === palavraDoSig) {
      const n = new Set(certos).add(sel);
      setCertos(n); setSel(null);
      if (n.size === pares.length) setTimeout(() => finalizar(), 500);
    } else {
      setErros((x) => x + 1); setErrado(palavraDoSig);
      setTimeout(() => setErrado(null), 350);
    }
  };

  if (res) {
    const estrelas = erros === 0 ? 3 : erros <= 3 ? 2 : 1;
    return <Fim cap={cap} r={res} titulo={estrelas === 3 ? 'Perfeito!' : 'Muito bem!'}
      detalhe={<div className="display" style={{ fontSize: 36, color: 'var(--yellow)', letterSpacing: 4 }} aria-label={`${estrelas} estrelas`}>{'★'.repeat(estrelas)}<span style={{ color: 'var(--line-2)' }}>{'★'.repeat(3 - estrelas)}</span></div>}
      onDeNovo={() => { setRodada((r) => r + 1); setCertos(new Set()); setErros(0); setSel(null); limpar(); }} />;
  }
  return (
    <main className="tela">
      <Topo cap={cap} fase="memoria" extra={<span className="pilula">{certos.size}/{pares.length}</span>} />
      <p className="muted small" style={{ margin: 0 }}>Toque numa palavra e depois no significado dela.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,0.8fr) minmax(0,1.2fr)', gap: 10 }}>
        <div className="coluna" style={{ gap: 8 }}>
          {palavras.map((p) => {
            const ok = certos.has(p.palavra);
            return (
              <button key={p.palavra} disabled={ok} onClick={() => setSel(p.palavra)} aria-pressed={sel === p.palavra}
                className={`btn ${ok ? 'btn-verde' : sel === p.palavra ? 'btn-amarelo' : 'btn-escuro'}`}
                style={{ fontSize: 16, minHeight: 64, padding: '8px 10px', opacity: ok ? 0.55 : 1 }}>{p.palavra}</button>
            );
          })}
        </div>
        <div className="coluna" style={{ gap: 8 }}>
          {sigs.map((p) => {
            const ok = certos.has(p.palavra);
            return (
              <button key={p.palavra} disabled={ok} onClick={() => escolherSig(p.palavra)}
                className={errado === p.palavra ? 'treme' : ''}
                style={{ minHeight: 64, borderRadius: 16, padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 14, lineHeight: 1.3,
                  background: ok ? '#0F2A22' : errado === p.palavra ? '#2A1020' : 'var(--surface)',
                  border: `1.5px solid ${ok ? '#22C55E' : errado === p.palavra ? 'var(--red)' : sel ? 'var(--line-2)' : 'var(--line)'}`,
                  opacity: ok ? 0.55 : 1 }}>{p.significado}</button>
            );
          })}
        </div>
      </div>
      <div className="muted small" style={{ textAlign: 'center' }}>Erros: {erros}</div>
    </main>
  );
}

/* ---------- Fase 3: linha do tempo ---------- */
function Linha({ cap }: { cap: Capitulo }) {
  const { res, finalizar, limpar } = useFinalizar(cap, 'linha');
  const [rodada, setRodada] = useState(0);
  const eventos = useMemo(() => embaralhar(cap.linha).slice(0, 5), [cap, rodada]);
  const certa = useMemo(() => [...eventos].sort((a, b) => a.ordem - b.ordem), [eventos]);
  const [postos, setPostos] = useState<typeof eventos>([]);
  const [errado, setErrado] = useState<string | null>(null);
  const [erros, setErros] = useState(0);

  const tocar = (ev: (typeof eventos)[number]) => {
    if (postos.includes(ev)) return;
    if (certa[postos.length] === ev) {
      const n = [...postos, ev];
      setPostos(n);
      if (n.length === certa.length) setTimeout(() => finalizar(), 600);
    } else {
      setErros((x) => x + 1); setErrado(ev.fato);
      setTimeout(() => setErrado(null), 900);
    }
  };

  if (res) return <Fim cap={cap} r={res} titulo={erros === 0 ? 'Sem errar nenhuma!' : 'Linha completa!'}
    detalhe={<ol className="coluna" style={{ width: '100%', gap: 6, padding: 0, listStyle: 'none', textAlign: 'left' }}>{certa.map((ev) => <li key={ev.fato} className="small"><span className="display" style={{ color: 'var(--yellow)' }}>{ev.ano}</span> · {ev.fato}</li>)}</ol>}
    onDeNovo={() => { setRodada((r) => r + 1); setPostos([]); setErros(0); limpar(); }} />;

  const restantes = eventos.filter((ev) => !postos.includes(ev));
  return (
    <main className="tela">
      <Topo cap={cap} fase="linha" />
      <div className="aviso" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
        Toque nos fatos do <strong>mais antigo</strong> para o <strong>mais novo</strong>.
      </div>
      <ol style={{ listStyle: 'none', margin: 0, padding: '0 0 0 22px', borderLeft: '4px solid var(--line)', display: 'grid', gap: 8 }}>
        {certa.map((_, i) => {
          const ev = postos[i];
          return (
            <li key={i} className={ev ? 'pop' : ''} style={{ position: 'relative', minHeight: 48, borderRadius: 14, padding: '8px 12px', background: ev ? '#0F2A22' : 'transparent', border: `1.5px ${ev ? 'solid #22C55E' : 'dashed var(--line)'}` }}>
              <span aria-hidden="true" style={{ position: 'absolute', left: -35, top: 14, width: 18, height: 18, borderRadius: '50%', background: ev ? 'var(--green)' : 'var(--line)', border: '3px solid var(--bg)' }} />
              {ev ? <><span className="display" style={{ color: 'var(--yellow)', marginRight: 8 }}>{ev.ano}</span><span style={{ fontWeight: 700 }}>{ev.fato}</span></> : <span className="muted small">{i + 1}º lugar</span>}
            </li>
          );
        })}
      </ol>
      <div className="coluna" style={{ gap: 8 }}>
        {restantes.map((ev) => (
          <button key={ev.fato} onClick={() => tocar(ev)} className={errado === ev.fato ? 'treme' : ''}
            style={{ minHeight: 56, borderRadius: 16, padding: '10px 14px', textAlign: 'left', fontWeight: 800, background: errado === ev.fato ? '#2A1020' : 'var(--surface)', border: `1.5px solid ${errado === ev.fato ? 'var(--red)' : 'var(--line-2)'}` }}>
            {ev.fato}
            {errado === ev.fato && <span style={{ display: 'block', fontSize: 13, color: 'var(--red)' }}>Ainda não! Tem um fato mais antigo.</span>}
          </button>
        ))}
      </div>
      <p className="muted small" style={{ margin: 0 }}>Dica: os anos aparecem quando você acerta.</p>
    </main>
  );
}

/* ---------- Fase 4: quiz relâmpago ---------- */
const TEMPO = 60;
function Quiz({ cap }: { cap: Capitulo }) {
  const { res, finalizar, limpar } = useFinalizar(cap, 'quiz');
  const [rodada, setRodada] = useState(0);
  const lista = useMemo(() => embaralhar(cap.quiz), [cap, rodada]);
  const [comecou, setComecou] = useState(false);
  const [i, setI] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [resto, setResto] = useState(TEMPO);
  const [retorno, setRetorno] = useState<{ ok: boolean; texto: string } | null>(null);
  const fim = useRef(false);

  useEffect(() => {
    if (!comecou || res) return;
    const t = setInterval(() => setResto((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [comecou, res]);

  useEffect(() => {
    if (comecou && resto <= 0 && !fim.current) { fim.current = true; finalizar(); }
  }, [resto, comecou]); // eslint-disable-line react-hooks/exhaustive-deps

  const responder = (v: boolean) => {
    if (retorno) return;
    const q = lista[i];
    const ok = q.verdadeira === v;
    if (ok) setAcertos((a) => a + 1);
    setRetorno({ ok, texto: q.explicacao });
  };
  const proxima = () => {
    setRetorno(null);
    if (i + 1 >= lista.length) { fim.current = true; finalizar(); } else setI(i + 1);
  };

  if (res) return <Fim cap={cap} r={res} titulo={acertos >= lista.length * 0.8 ? 'Relâmpago!' : 'Bom jogo!'}
    detalhe={<div className="display" style={{ fontSize: 26 }}>{acertos} de {lista.length} certas</div>}
    onDeNovo={() => { setRodada((r) => r + 1); setI(0); setAcertos(0); setResto(TEMPO); setComecou(false); setRetorno(null); fim.current = false; limpar(); }} />;

  if (!comecou) return (
    <main className="tela">
      <Topo cap={cap} fase="quiz" />
      <div className="coluna" style={{ alignItems: 'center', textAlign: 'center', flex: 1, justifyContent: 'center' }}>
        <Ara tamanho={110} />
        <div className="balao">Você tem <strong>{TEMPO} segundos</strong>. Diga se cada frase é verdadeira ou falsa!</div>
        <button className="btn btn-amarelo btn-bloco" onClick={() => setComecou(true)}>Valendo!</button>
      </div>
    </main>
  );

  const q = lista[i];
  return (
    <main className="tela">
      <Topo cap={cap} fase="quiz" extra={<span className="pilula" style={{ borderColor: resto <= 10 ? 'var(--red)' : undefined, color: resto <= 10 ? 'var(--red)' : undefined }}><Icone nome="relogio" tamanho={16} />{Math.max(0, resto)}s</span>} />
      <div className="barra barra-amarela" aria-hidden="true"><div style={{ width: `${(Math.max(0, resto) / TEMPO) * 100}%`, transition: 'width 1s linear' }} /></div>
      <div className="muted small">Pergunta {i + 1} de {lista.length} · {acertos} certas</div>
      <div className="painel-destaque" style={{ minHeight: 150, display: 'grid', placeItems: 'center' }}>
        <p className="display" style={{ fontSize: 23, margin: 0, textAlign: 'center' }}>{q.frase}</p>
      </div>
      {retorno ? (
        <div className="coluna sobe">
          <div className={`aviso ${retorno.ok ? 'aviso-ok' : 'aviso-erro'}`}><span className="display" style={{ fontSize: 18 }}>{retorno.ok ? 'Acertou! ' : 'Ops! '}</span>{retorno.texto}</div>
          <button className="btn btn-amarelo btn-bloco" onClick={proxima}>Próxima</button>
        </div>
      ) : (
        <div className="linha" style={{ gap: 10 }}>
          <button className="btn btn-verde" style={{ flex: 1, minHeight: 72, fontSize: 22 }} onClick={() => responder(true)}>Verdadeiro</button>
          <button className="btn btn-vermelho" style={{ flex: 1, minHeight: 72, fontSize: 22 }} onClick={() => responder(false)}>Falso</button>
        </div>
      )}
    </main>
  );
}

/* ---------- Chefão: prova ---------- */
const LETRAS = ['A', 'B', 'C', 'D'];
function Prova({ cap }: { cap: Capitulo }) {
  const { res, finalizar, limpar } = useFinalizar(cap, 'prova');
  const [i, setI] = useState(0);
  const [respostas, setRespostas] = useState<number[]>([]);
  const [escolha, setEscolha] = useState<number | null>(null);
  const qs = cap.prova;

  const confirmar = () => {
    if (escolha === null) return;
    const r = [...respostas, escolha];
    setRespostas(r); setEscolha(null);
    if (r.length === qs.length) finalizar(notaDe(r.filter((x, k) => x === qs[k].certa).length, qs.length));
    else setI(i + 1);
  };

  if (res) {
    const acertos = respostas.filter((x, k) => x === qs[k].certa).length;
    const nota = notaDe(acertos, qs.length);
    const passou = nota >= NOTA_MINIMA;
    return (
      <>
        <Fim cap={cap} r={res} aprovado={passou} titulo={passou ? 'Chefão vencido!' : 'Quase lá!'}
          detalhe={<div className="coluna" style={{ alignItems: 'center', gap: 0 }}>
            <div className="display" style={{ fontSize: 64, lineHeight: 1, color: passou ? 'var(--green)' : 'var(--pink)' }}>{nota.toLocaleString('pt-BR')}</div>
            <div className="muted">{acertos} de {qs.length} certas{passou ? '' : ` · precisa de nota ${NOTA_MINIMA} para o pacote`}</div>
          </div>}
          onDeNovo={() => { setI(0); setRespostas([]); limpar(); }} />
        <section className="tela" style={{ paddingTop: 0 }} aria-label="Correção">
          <h2 className="display h2">Correção</h2>
          {qs.map((q, k) => {
            const ok = respostas[k] === q.certa;
            return (
              <div key={k} className={`aviso ${ok ? 'aviso-ok' : 'aviso-erro'}`}>
                <div className="display" style={{ fontSize: 16 }}>{k + 1}. {q.pergunta}</div>
                {!ok && <div className="small" style={{ color: 'var(--red)' }}>Você marcou: {LETRAS[respostas[k]]}) {q.opcoes[respostas[k]]}</div>}
                <div className="small">Certa: <strong>{LETRAS[q.certa]}) {q.opcoes[q.certa]}</strong></div>
                <div className="small muted">{q.explicacao}</div>
              </div>
            );
          })}
        </section>
      </>
    );
  }

  const q = qs[i];
  return (
    <main className="tela">
      <Topo cap={cap} fase="prova" extra={<span className="pilula">{i + 1}/{qs.length}</span>} />
      <div className="barra barra-ciano"><div style={{ width: `${(i / qs.length) * 100}%` }} /></div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="coluna">
        <legend className="display" style={{ fontSize: 22, marginBottom: 12 }}>{q.pergunta}</legend>
        {q.opcoes.map((o, k) => (
          <label key={k} className="linha" style={{ minHeight: 60, borderRadius: 16, padding: '10px 12px', cursor: 'pointer', fontWeight: 700,
            background: escolha === k ? '#12324A' : 'var(--surface)', border: `1.5px solid ${escolha === k ? 'var(--cyan)' : 'var(--line)'}` }}>
            <input type="radio" name={`q${i}`} checked={escolha === k} onChange={() => setEscolha(k)} style={{ position: 'absolute', opacity: 0 }} />
            <span style={{ width: 32, height: 32, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)',
              background: escolha === k ? 'var(--cyan)' : 'var(--bg)', color: escolha === k ? 'var(--bg)' : 'var(--ink)' }}>{LETRAS[k]}</span>
            {o}
          </label>
        ))}
      </fieldset>
      <button className="btn btn-amarelo btn-bloco" disabled={escolha === null} onClick={confirmar} style={{ marginTop: 'auto' }}>
        {i + 1 === qs.length ? 'Entregar prova' : 'Confirmar'}
      </button>
    </main>
  );
}

export function TelaFase({ capId, fase }: { capId: string; fase: Fase }) {
  const cap = capituloPorId(capId);
  if (!cap) return <main className="tela"><p>Fase não encontrada.</p></main>;
  if (!liberada(getEstado(), cap.id, fase)) {
    return (
      <main className="tela" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Ara tamanho={110} humor="triste" />
        <div className="balao">Essa fase ainda está trancada. Termine a anterior primeiro!</div>
        <button className="btn btn-amarelo" onClick={() => ir('mundo', cap.id)}>Voltar ao mundo</button>
      </main>
    );
  }
  const Comp = { ouvir: Ouvir, memoria: Memoria, linha: Linha, quiz: Quiz, prova: Prova }[fase];
  return <Comp key={`${capId}-${fase}`} cap={cap} />;
}
