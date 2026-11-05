import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Ara } from '../components/Ara';
import { Icone } from '../components/Icone';
import { Moeda } from '../components/Loja';
import { capituloPorId } from '../data';
import type { Capitulo } from '../data/tipos';
import { FASE_INFO, NOTA_MINIMA, PERDA_POR_ERRO, XP_MINIMO, concluirFase, embaralhar, estrelasDaNota, hoje, liberada, nivel, notaDe, type Fase, type MotivoPacote, type Resultado } from '../lib/jogo';
import { idProva, idQuiz, registrarResposta } from '../lib/revisao';
import { aplicarMissoes } from '../lib/missoes';
import { ir } from '../lib/rota';
import { jogar, proximaFase } from './Inicio';
import { getEstado, setEstado, useEstado } from '../lib/store';
import { VOZES, audioDaVoz, setVoz, useVoz } from '../lib/voz';

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

export const MOTIVO: Record<MotivoPacote, string> = {
  fase: 'Pacote por terminar uma fase nova',
  prova: 'Pacote épico por passar na prova: vem um épico ou lendário',
  dia: 'Pacote do dia, por estudar hoje',
  nivel: 'Pacote de presente pelo nível novo',
  extras: 'Pacote por terminar todos os jogos extras do mundo',
  missoes: 'Pacote por fazer as missões do dia',
  marco: 'Pacote por estudar vários dias seguidos',
};

/** Aviso de missão do dia feita (aparece no fim dos jogos e da revisão). */
export function AvisoMissao({ m }: { m: NonNullable<Resultado['missao']> }) {
  return (
    <button className="painel linha sobe" onClick={() => ir('dia')} style={{ width: '100%', textAlign: 'left', color: 'inherit', gap: 10, animationDelay: '.2s' }}>
      <span style={{ width: 34, height: 34, flex: 'none', borderRadius: '50%', background: 'var(--green)', border: '3px solid var(--ink)', display: 'grid', placeItems: 'center' }}><Icone nome="check" tamanho={18} espessura={3.5} /></span>
      <span style={{ flex: 1 }}>
        <span className="display" style={{ fontSize: 18, display: 'block' }}>Missão do dia feita!</span>
        <span className="muted small">{m.texto} · {m.feitas} de {m.total}</span>
      </span>
    </button>
  );
}

/** Estrelas do resultado (3 = nota 10, 2 = nota 7 ou mais, 1 = abaixo de 7). */
export const Estrelas = ({ n }: { n: number }) => (
  <div className="display" style={{ fontSize: 40, color: 'var(--yellow)', letterSpacing: 4, WebkitTextStroke: '1.5px var(--ink)' }} aria-label={`${n} de 3 estrelas`}>
    {'★'.repeat(n)}<span style={{ color: 'var(--line)', WebkitTextStroke: '1.5px var(--line)' }}>{'★'.repeat(3 - n)}</span>
  </div>
);

/** Placar igual em todos os jogos: estrelas, quantas certas e a nota de 0 a 10. */
export function Placar({ acertos, total, nome = 'certas' }: { acertos: number; total: number; nome?: string }) {
  const nota = notaDe(acertos, total);
  const passou = nota >= NOTA_MINIMA;
  return (
    <div className="coluna" style={{ alignItems: 'center', gap: 2 }}>
      <Estrelas n={estrelasDaNota(nota)} />
      <div className="display" style={{ fontSize: 24 }}>{acertos} de {total} {nome}</div>
      <div className="display" style={{ fontSize: 20, color: passou ? 'var(--t-green)' : 'var(--t-pink)' }}>Nota {nota.toLocaleString('pt-BR')}</div>
    </div>
  );
}

/** Tela de resultado com placar, XP, nível e pacote ganhos. */
export function Fim({ cap, r, titulo, placar, detalhe, aprovado = true, onDeNovo }: { cap: Capitulo; r: Resultado; titulo: string; placar?: { acertos: number; total: number; nome?: string }; detalhe?: ReactNode; aprovado?: boolean; onDeNovo: () => void }) {
  const nv = nivel(r.estado.xp);
  return (
    <main className="tela" style={{ alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
      <div className="pop"><Ara tamanho={120} humor={aprovado ? 'comemorando' : 'triste'} /></div>
      <h1 className={`display h1${aprovado ? ' titulo-premio' : ''}`}>{titulo}</h1>
      {placar && <Placar {...placar} />}
      {detalhe}
      <div className="painel coluna sobe" style={{ width: '100%', gap: 8, animationDelay: '.15s' }}>
        <div className="linha" style={{ justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span className="display" style={{ fontSize: 30, color: 'var(--t-cyan)' }}>+{r.xpGanho} XP</span>
          <span className="display linha" style={{ fontSize: 30, color: 'var(--t-yellow)', gap: 6 }}><Moeda tamanho={26} />+{r.xpGanho}</span>
        </div>
        <div className="muted small">XP sobe seu nível. Sabicoins você gasta na lojinha.</div>
        {!!r.erros && r.xpSemErros !== undefined && r.xpSemErros > r.xpGanho && (
          <div className="small" style={{ fontWeight: 800, color: 'var(--t-coral)' }}>
            Valia +{r.xpSemErros}. {r.erros === 1 ? '1 erro' : `${r.erros} erros`}: −{r.xpSemErros - r.xpGanho} XP.
          </div>
        )}
        {r.subiuNivel && <div className="display pop" style={{ fontSize: 22, color: 'var(--t-green)' }}>Subiu para o nível {nv.nivel}!</div>}
        {!r.primeiraVez && aprovado && <div className="muted small">Fase repetida: metade do XP e das Sabicoins.</div>}
      </div>
      {r.missao && <AvisoMissao m={r.missao} />}
      {r.faltouPacote && (
        <div className="balao small">O pacote desta fase ainda está esperando! Acerte <strong>7 de cada 10</strong> para ganhar. Jogue de novo!</div>
      )}
      {r.pacotesGanhos.length > 0 && (
        <div className="painel-destaque sobe coluna" style={{ width: '100%', animationDelay: '.3s', borderColor: 'var(--pink)', gap: 4 }}>
          <div className="display" style={{ fontSize: 22 }}>
            {r.pacotesGanhos.length > 1 ? `Você ganhou ${r.pacotesGanhos.length} pacotes!` : `Você ganhou um pacote${r.pacotesGanhos[0].tipo === 'epico' ? ' épico' : ''}!`}
          </div>
          {r.pacotesGanhos.map((p, i) => <div key={i} className="muted small">{MOTIVO[p.motivo]}</div>)}
        </div>
      )}
      <div className="coluna" style={{ width: '100%', marginTop: 8 }}>
        {r.pacotesGanhos.length > 0
          ? <button className="btn btn-amarelo btn-bloco" onClick={() => ir('pacote')}>{r.pacotesGanhos.length > 1 ? 'Abrir pacotes' : 'Abrir pacote'}</button>
          : aprovado
            ? <button className="btn btn-amarelo btn-bloco" onClick={jogar}>{proximaFase(r.estado.feitas) ? 'Próxima fase' : 'Continuar'}</button>
            : <button className="btn btn-amarelo btn-bloco" onClick={onDeNovo}>Tentar de novo</button>}
        <button className="btn btn-escuro btn-bloco" onClick={() => ir('mundo', cap.id)}>Ver o mundo {cap.numero}</button>
        {aprovado && <button className="btn btn-escuro btn-bloco" onClick={onDeNovo}>Jogar de novo</button>}
      </div>
    </main>
  );
}

/** Guarda a resposta na Revisão do Ará (erros voltam amanhã; acertos em alguns dias). */
function lembrar(ids: [string, boolean][]) {
  const dia = hoje();
  setEstado((e) => ({ ...e, revisao: ids.reduce((rev, [id, ok]) => registrarResposta(rev, id, ok, dia), e.revisao) }));
}

/** Mostra os erros e quanto de XP já foi perdido (cada erro tira 10%). */
export function ContaErros({ erros }: { erros: number }) {
  const perda = Math.round(Math.min(1 - XP_MINIMO, PERDA_POR_ERRO * erros) * 100);
  return (
    <div className="muted small" style={{ textAlign: 'center' }}>
      Erros: {erros}{erros > 0 ? ` · −${perda}% de XP` : ' · cada erro tira 10% do XP'}
    </div>
  );
}

const AVISO_REVISAO = <div className="balao small" style={{ marginTop: 4 }}>As perguntas que você errou voltam na <strong>Revisão do Ará</strong> amanhã.</div>;

function useFinalizar(cap: Capitulo, fase: Fase) {
  const [res, setRes] = useState<Resultado | null>(null);
  const finalizar = (nota?: number, erros = 0) => {
    const antes = getEstado();
    const r = aplicarMissoes(antes, concluirFase(antes, cap.id, fase, nota, new Date(), erros), { tipo: 'fase', fase, nota });
    setEstado(r.estado);
    setRes(r);
  };
  return { res, finalizar, limpar: () => setRes(null) };
}

/* ---------- Fase 1: ouvir ---------- */
function Ouvir({ cap }: { cap: Capitulo }) {
  const { res, finalizar, limpar } = useFinalizar(cap, 'ouvir');
  // Temas já ouvidos ficam salvos: se a criança sair e voltar, não precisa ouvir de novo.
  const salvos = useEstado().ouvidos?.[cap.id];
  const ouvidos = useMemo(() => new Set(salvos ?? []), [salvos]);
  const setOuvidos = (f: (s: Set<number>) => Set<number>) => setEstado((e) => {
    const atual = new Set(e.ouvidos?.[cap.id] ?? []);
    const novo = [...f(atual)].sort((a, b) => a - b);
    if (novo.length === atual.size) return e;
    return { ...e, ouvidos: { ...e.ouvidos, [cap.id]: novo } };
  });
  const esquecerOuvidos = () => setEstado((e) => { const { [cap.id]: _, ...resto } = e.ouvidos ?? {}; return { ...e, ouvidos: resto }; });
  const [tocando, setTocando] = useState<number | null>(null);
  const [carregando, setCarregando] = useState<number | null>(null);
  // Abre o primeiro tema que ainda falta ouvir.
  const [aberto, setAberto] = useState<number | null>(() => { const i = cap.temas.findIndex((_, j) => !ouvidos.has(j)); return i < 0 ? null : i; });
  const audio = useRef<HTMLAudioElement | null>(null);
  const voz = useVoz();

  useEffect(() => () => audio.current?.pause(), []);
  useEffect(() => { audio.current?.pause(); audio.current = null; setTocando(null); setCarregando(null); }, [voz]);

  const tocar = (i: number) => {
    const t = cap.temas[i];
    if (!t.audio) return;
    if (tocando === i) { audio.current?.pause(); setTocando(null); return; }
    // Ainda carregando este tema: espera, em vez de começar tudo de novo a cada toque.
    if (carregando === i) return;
    audio.current?.pause();
    const a = new Audio(import.meta.env.BASE_URL + audioDaVoz(t.audio, voz));
    audio.current = a;
    const minha = () => audio.current === a; // ignora avisos de um áudio que já foi trocado
    setCarregando(i);
    const comecou = () => { if (minha()) { setCarregando(null); setTocando(i); setAberto(i); } };
    const parou = () => { if (minha()) { setCarregando(null); setTocando(null); } };
    let tentouReserva = false;
    a.ontimeupdate = () => { if (minha() && a.duration && a.currentTime / a.duration > 0.8) setOuvidos((s) => new Set(s).add(i)); };
    a.onended = () => { if (!minha()) return; setTocando(null); setOuvidos((s) => new Set(s).add(i)); };
    a.onerror = () => {
      if (!minha()) return;
      // Se o áudio dessa voz ainda não existir, toca a narração antiga.
      if (!tentouReserva && t.audio) { tentouReserva = true; a.src = import.meta.env.BASE_URL + t.audio; a.play().then(comecou).catch(() => { /* o onerror avisa */ }); }
      else parou();
    };
    // Se der erro de arquivo, quem cuida é o onerror (que tenta a reserva).
    a.play().then(comecou).catch((e: unknown) => { if (!(e instanceof DOMException && e.name === 'NotSupportedError')) parou(); });
  };

  if (res) return <Fim cap={cap} r={res} titulo="Você ouviu tudo!" onDeNovo={limpar} />;
  const total = cap.temas.length;
  return (
    <main className="tela">
      <Topo cap={cap} fase="ouvir" extra={<span className="pilula">{ouvidos.size}/{total}</span>} />
      <div className="barra barra-verde"><div style={{ width: `${(ouvidos.size / total) * 100}%` }} /></div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="muted small" style={{ marginBottom: 6 }}>Quem vai ler para você?</legend>
        <div className="grade-3">
          {VOZES.map((v) => (
            <button key={v.id} onClick={() => setVoz(v.id)} aria-pressed={voz === v.id}
              style={{ borderRadius: 16, padding: '8px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                background: voz === v.id ? 'var(--surface-2)' : 'var(--surface)', border: `3px solid ${voz === v.id ? v.cor : 'var(--line)'}` }}>
              <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: '50%', background: v.cor, color: 'var(--ink)', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontSize: 18 }}>{v.nome[0]}</span>
              <span className="display" style={{ fontSize: 15 }}>{v.nome}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)' }}>{v.descricao}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <div className="coluna">
        {cap.temas.map((t, i) => (
          <article key={i} className="painel" style={{ padding: 14, borderColor: tocando === i ? 'var(--yellow)' : ouvidos.has(i) ? '#22C55E' : undefined }}>
            <div className="linha">
              <button onClick={() => tocar(i)} aria-label={tocando === i ? `Pausar ${t.titulo}` : carregando === i ? `Carregando ${t.titulo}` : `Ouvir ${t.titulo}`} aria-busy={carregando === i}
                className={`btn ${tocando === i ? 'btn-amarelo' : ouvidos.has(i) ? 'btn-verde' : 'btn-ciano'}`} style={{ width: 52, height: 52, padding: 0, borderRadius: '50%', flex: 'none' }}>
                <Icone nome={tocando === i ? 'pause' : carregando === i ? 'relogio' : ouvidos.has(i) ? 'check' : 'play'} cheio={!ouvidos.has(i) || tocando === i} espessura={3} />
              </button>
              <button onClick={() => setAberto(aberto === i ? null : i)} style={{ flex: 1, background: 'none', border: 0, textAlign: 'left', padding: 0 }} aria-expanded={aberto === i}>
                <span className="eyebrow" style={{ color: 'var(--muted)' }}>Tema {i + 1}</span>
                <span className="display" style={{ display: 'block', fontSize: 19 }}>{t.titulo}</span>
              </button>
            </div>
            {aberto === i && (
              <>
                <ul style={{ margin: '10px 0 0', paddingLeft: 20, display: 'grid', gap: 6, fontWeight: 600 }}>
                  {t.pontos.map((p, j) => <li key={j}><Texto t={p} /></li>)}
                </ul>
                {/* Só aparece se o tema ainda não tem áudio: com narração, a criança precisa ouvir. */}
                {!t.audio && !ouvidos.has(i) && (
                  <button className="btn btn-escuro" style={{ minHeight: 44, padding: '6px 16px', fontSize: 15, marginTop: 10 }}
                    onClick={() => { setOuvidos((s) => new Set(s).add(i)); setAberto(i + 1 < total ? i + 1 : null); }}>
                    Já li este tema
                  </button>
                )}
              </>
            )}
          </article>
        ))}
      </div>
      <button className="btn btn-amarelo btn-bloco" disabled={ouvidos.size < total} onClick={() => { audio.current?.pause(); finalizar(); esquecerOuvidos(); }}>
        {ouvidos.size < total ? (total - ouvidos.size === 1 ? "Falta 1 tema" : `Faltam ${total - ouvidos.size} temas`) : 'Terminar fase'}
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
  // Cada palavra tem uma chance só: errou, o par certo aparece e a palavra fica marcada como erro.
  const [certos, setCertos] = useState<Set<string>>(new Set());
  const [perdidos, setPerdidos] = useState<Set<string>>(new Set());
  const [errado, setErrado] = useState<string | null>(null);
  const erros = perdidos.size;

  const escolherSig = (palavraDoSig: string) => {
    if (!sel || certos.has(palavraDoSig) || perdidos.has(palavraDoSig)) return;
    const c = new Set(certos), p = new Set(perdidos);
    if (sel === palavraDoSig) c.add(sel);
    else { p.add(sel); setErrado(palavraDoSig); setTimeout(() => setErrado(null), 600); }
    setCertos(c); setPerdidos(p); setSel(null);
    if (c.size + p.size === pares.length) setTimeout(() => finalizar(notaDe(c.size, pares.length), p.size), 900);
  };

  if (res) {
    return <Fim cap={cap} r={res} titulo={erros === 0 ? 'Perfeito!' : 'Muito bem!'} placar={{ acertos: certos.size, total: pares.length }}
      onDeNovo={() => { setRodada((r) => r + 1); setCertos(new Set()); setPerdidos(new Set()); setSel(null); limpar(); }} />;
  }
  return (
    <main className="tela">
      <Topo cap={cap} fase="memoria" extra={<span className="pilula">{certos.size}/{pares.length}</span>} />
      <p className="muted small" style={{ margin: 0 }}>Toque numa palavra e depois no significado dela. <strong>Cada palavra tem uma chance só!</strong></p>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,0.8fr) minmax(0,1.2fr)', gap: 10 }}>
        <div className="coluna" style={{ gap: 8 }}>
          {palavras.map((p) => {
            const ok = certos.has(p.palavra), perdeu = perdidos.has(p.palavra);
            return (
              <button key={p.palavra} disabled={ok || perdeu} onClick={() => setSel(p.palavra)} aria-pressed={sel === p.palavra}
                className={`btn ${ok ? 'btn-verde' : perdeu ? 'btn-vermelho' : sel === p.palavra ? 'btn-amarelo' : 'btn-escuro'}`}
                style={{ fontSize: 16, minHeight: 64, padding: '8px 10px', opacity: ok || perdeu ? 0.55 : 1 }}>{p.palavra}</button>
            );
          })}
        </div>
        <div className="coluna" style={{ gap: 8 }}>
          {sigs.map((p) => {
            const ok = certos.has(p.palavra), perdeu = perdidos.has(p.palavra);
            return (
              <button key={p.palavra} disabled={ok || perdeu} onClick={() => escolherSig(p.palavra)}
                className={errado === p.palavra ? 'treme' : ''}
                style={{ minHeight: 64, borderRadius: 16, padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 14, lineHeight: 1.3,
                  background: ok ? '#DCFCE7' : perdeu || errado === p.palavra ? '#FFE4E6' : 'var(--surface)',
                  border: `3px solid ${ok ? '#22C55E' : perdeu || errado === p.palavra ? 'var(--red)' : sel ? 'var(--line-2)' : 'var(--line)'}`,
                  opacity: ok ? 0.55 : 1 }}>
                {(ok || perdeu) && <span className="small" style={{ display: 'block', color: ok ? 'var(--t-green)' : 'var(--t-red)' }}>{perdeu ? `Errou. Era: ${p.palavra}` : p.palavra}</span>}
                {p.significado}
              </button>
            );
          })}
        </div>
      </div>
      <ContaErros erros={erros} />
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
  // Cada lugar da linha tem uma chance só: errou, o fato certo entra sozinho, marcado como erro.
  const [perdidos, setPerdidos] = useState<Set<number>>(new Set());
  const [errado, setErrado] = useState<string | null>(null);
  const erros = perdidos.size;

  const tocar = (ev: (typeof eventos)[number]) => {
    if (postos.includes(ev) || errado) return;
    const lugar = postos.length;
    const n = [...postos, certa[lugar]];
    const p = new Set(perdidos);
    if (certa[lugar] !== ev) { p.add(lugar); setPerdidos(p); setErrado(ev.fato); setTimeout(() => setErrado(null), 900); }
    setPostos(n);
    if (n.length === certa.length) setTimeout(() => finalizar(notaDe(n.length - p.size, n.length), p.size), 900);
  };

  if (res) return <Fim cap={cap} r={res} titulo={erros === 0 ? 'Sem errar nenhuma!' : 'Linha completa!'} placar={{ acertos: certa.length - erros, total: certa.length }}
    detalhe={<ol className="coluna" style={{ width: '100%', gap: 6, padding: 0, listStyle: 'none', textAlign: 'left' }}>{certa.map((ev) => <li key={ev.fato} className="small"><span className="display" style={{ color: 'var(--t-yellow)' }}>{ev.ano}</span> · {ev.fato}</li>)}</ol>}
    onDeNovo={() => { setRodada((r) => r + 1); setPostos([]); setPerdidos(new Set()); limpar(); }} />;

  const restantes = eventos.filter((ev) => !postos.includes(ev));
  return (
    <main className="tela">
      <Topo cap={cap} fase="linha" />
      <div className="aviso" style={{ background: 'var(--surface)', border: '3px solid var(--ink)' }}>
        Toque nos fatos do <strong>mais antigo</strong> para o <strong>mais novo</strong>. Cada lugar tem uma chance só!
      </div>
      <ol style={{ listStyle: 'none', margin: 0, padding: '0 0 0 22px', borderLeft: '4px solid var(--line)', display: 'grid', gap: 8 }}>
        {certa.map((_, i) => {
          const ev = postos[i];
          const perdeu = perdidos.has(i);
          return (
            <li key={i} className={ev ? 'pop' : ''} style={{ position: 'relative', minHeight: 48, borderRadius: 14, padding: '8px 12px', background: ev ? (perdeu ? '#FFE4E6' : '#DCFCE7') : 'transparent', border: `1.5px ${ev ? `solid ${perdeu ? 'var(--red)' : '#22C55E'}` : 'dashed var(--line)'}` }}>
              <span aria-hidden="true" style={{ position: 'absolute', left: -35, top: 14, width: 18, height: 18, borderRadius: '50%', background: ev ? (perdeu ? 'var(--red)' : 'var(--green)') : 'var(--line)', border: '3px solid var(--bg)' }} />
              {ev ? <>{perdeu && <span className="small" style={{ display: 'block', fontWeight: 800, color: 'var(--t-red)' }}>Errou. O certo era este:</span>}<span className="display" style={{ color: 'var(--t-yellow)', marginRight: 8 }}>{ev.ano}</span><span style={{ fontWeight: 700 }}>{ev.fato}</span></> : <span className="muted small">{i + 1}º lugar</span>}
            </li>
          );
        })}
      </ol>
      <div className="coluna" style={{ gap: 8 }}>
        {restantes.map((ev) => (
          <button key={ev.fato} onClick={() => tocar(ev)} className={errado === ev.fato ? 'treme' : ''}
            style={{ minHeight: 56, borderRadius: 16, padding: '10px 14px', textAlign: 'left', fontWeight: 800, background: errado === ev.fato ? '#FFE4E6' : 'var(--surface)', border: `3px solid ${errado === ev.fato ? 'var(--red)' : 'var(--line-2)'}` }}>
            {ev.fato}
            {errado === ev.fato && <span style={{ display: 'block', fontSize: 13, color: 'var(--t-red)' }}>Não! Tinha um fato mais antigo.</span>}
          </button>
        ))}
      </div>
      <p className="muted small" style={{ margin: 0 }}>Dica: os anos aparecem quando você acerta.</p>
      <ContaErros erros={erros} />
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
  const [errou, setErrou] = useState(false);
  const [respondidas, setRespondidas] = useState(0);
  const fim = useRef(false);

  useEffect(() => {
    if (!comecou || res || retorno) return; // o relógio para enquanto a criança lê a explicação
    const t = setInterval(() => setResto((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [comecou, res, retorno]);

  useEffect(() => {
    if (comecou && resto <= 0 && !fim.current) { fim.current = true; finalizar(notaDe(acertos, lista.length), respondidas - acertos); }
  }, [resto, comecou]); // eslint-disable-line react-hooks/exhaustive-deps

  const responder = (v: boolean) => {
    if (retorno) return;
    const q = lista[i];
    const ok = q.verdadeira === v;
    if (ok) setAcertos((a) => a + 1); else setErrou(true);
    setRespondidas((n) => n + 1);
    lembrar([[idQuiz(cap.id, cap.quiz.indexOf(q)), ok]]);
    setRetorno({ ok, texto: q.explicacao });
  };
  const proxima = () => {
    setRetorno(null);
    if (i + 1 >= lista.length) { fim.current = true; finalizar(notaDe(acertos, lista.length), respondidas - acertos); } else setI(i + 1);
  };

  if (res) return <Fim cap={cap} r={res} titulo={acertos >= lista.length * 0.8 ? 'Relâmpago!' : 'Bom jogo!'} placar={{ acertos, total: lista.length }}
    detalhe={<>{respondidas < lista.length && <div className="muted small">O tempo acabou: deu para responder {respondidas} de {lista.length}.</div>}{errou && AVISO_REVISAO}</>}
    onDeNovo={() => { setRodada((r) => r + 1); setI(0); setAcertos(0); setErrou(false); setRespondidas(0); setResto(TEMPO); setComecou(false); setRetorno(null); fim.current = false; limpar(); }} />;

  if (!comecou) return (
    <main className="tela">
      <Topo cap={cap} fase="quiz" />
      <div className="coluna" style={{ alignItems: 'center', textAlign: 'center', flex: 1, justifyContent: 'center' }}>
        <Ara tamanho={110} />
        <div className="balao">Você tem <strong>{TEMPO} segundos</strong>. Diga se cada frase é verdadeira ou falsa! O relógio para enquanto você lê a explicação.</div>
        <button className="btn btn-amarelo btn-bloco" onClick={() => setComecou(true)}>Valendo!</button>
      </div>
    </main>
  );

  const q = lista[i];
  return (
    <main className="tela">
      <Topo cap={cap} fase="quiz" extra={<span className="pilula" style={{ borderColor: resto <= 10 ? 'var(--red)' : undefined, color: resto <= 10 ? 'var(--t-red)' : undefined }}><Icone nome="relogio" tamanho={16} />{Math.max(0, resto)}s</span>} />
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
  const [tentativa, setTentativa] = useState(0);
  const qs = cap.prova;
  // A ordem das opções muda a cada tentativa, para ninguém decorar "a certa é a B".
  const ordens = useMemo(() => qs.map(() => embaralhar([0, 1, 2, 3])), [qs, tentativa]);

  const confirmar = () => {
    if (escolha === null) return;
    const r = [...respostas, escolha];
    setRespostas(r); setEscolha(null);
    if (r.length === qs.length) {
      lembrar(qs.map((q, k) => [idProva(cap.id, k), r[k] === q.certa]));
      const acertos = r.filter((x, k) => x === qs[k].certa).length;
      finalizar(notaDe(acertos, qs.length), qs.length - acertos);
    }
    else setI(i + 1);
  };

  if (res) {
    const acertos = respostas.filter((x, k) => x === qs[k].certa).length;
    const nota = notaDe(acertos, qs.length);
    const passou = nota >= NOTA_MINIMA;
    return (
      <>
        <Fim cap={cap} r={res} aprovado={passou} titulo={passou ? 'Chefão vencido!' : 'Quase lá!'} placar={{ acertos, total: qs.length }}
          detalhe={<div className="coluna" style={{ alignItems: 'center', gap: 0 }}>
            {!passou && <div className="muted">Precisa de nota {NOTA_MINIMA} para passar e ganhar o pacote épico.</div>}
            {acertos < qs.length && AVISO_REVISAO}
          </div>}
          onDeNovo={() => { setI(0); setRespostas([]); setTentativa((t) => t + 1); limpar(); }} />
        <section className="tela" style={{ paddingTop: 0 }} aria-label="Correção">
          <h2 className="display h2">Correção</h2>
          {qs.map((q, k) => {
            const ok = respostas[k] === q.certa;
            return (
              <div key={k} className={`aviso ${ok ? 'aviso-ok' : 'aviso-erro'}`}>
                <div className="display" style={{ fontSize: 16 }}>{k + 1}. {q.pergunta}</div>
                {!ok && <div className="small" style={{ color: 'var(--t-red)' }}>Você marcou: {q.opcoes[respostas[k]]}</div>}
                <div className="small">Certa: <strong>{q.opcoes[q.certa]}</strong></div>
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
        {ordens[i].map((orig, k) => ({ o: q.opcoes[orig], orig, k })).map(({ o, orig, k }) => (
          <label key={k} className="linha" style={{ minHeight: 60, borderRadius: 16, padding: '10px 12px', cursor: 'pointer', fontWeight: 700,
            background: escolha === orig ? '#CFFAFE' : 'var(--surface)', border: `3px solid ${escolha === orig ? 'var(--cyan)' : 'var(--line)'}` }}>
            <input type="radio" name={`q${i}`} checked={escolha === orig} onChange={() => setEscolha(orig)} style={{ position: 'absolute', opacity: 0 }} />
            <span style={{ width: 32, height: 32, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)',
              background: escolha === orig ? 'var(--cyan)' : 'var(--bg)', color: 'var(--ink)' }}>{LETRAS[k]}</span>
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
        <Ara tamanho={110} humor="pensando" />
        <div className="balao">Essa fase ainda está trancada. Termine a anterior primeiro!</div>
        <button className="btn btn-amarelo" onClick={() => ir('mundo', cap.id)}>Voltar ao mundo</button>
      </main>
    );
  }
  const Comp = { ouvir: Ouvir, memoria: Memoria, linha: Linha, quiz: Quiz, prova: Prova }[fase];
  return <Comp key={`${capId}-${fase}`} cap={cap} />;
}
