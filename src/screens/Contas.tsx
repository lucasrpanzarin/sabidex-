// Fases de Matemática: a criança vê como se faz e resolve contas digitando a resposta.
// Os números mudam a cada partida (src/lib/contas.ts). Uma chance por conta: errou, o app mostra o certo e segue.
import { useEffect, useMemo, useState } from 'react';
import { Ara } from '../components/Ara';
import type { Capitulo } from '../data/tipos';
import { gerarConta, gerarContas, type Conta, type Visual } from '../lib/contas';
import { NOTA_MINIMA, notaDe, type Fase } from '../lib/jogo';
import { idConta } from '../lib/revisao';
import { AVISO_REVISAO, ContaErros, Fim, Texto, Topo, lembrar, useFinalizar } from './Fases';

/* ---------- Desenhos ---------- */

function Peso({ kg }: { kg: number | null }) {
  return <span className={`peso${kg === null ? ' peso-falta' : ''}`}>{kg === null ? '?' : <>{kg}<small>kg</small></>}</span>;
}

/** Balança de pratos parada (sem animação): equilibrada ou pendendo para o lado mais pesado. */
function Balanca({ v }: { v: Extract<Visual, { tipo: 'balanca' }> }) {
  const giro = v.pende === 'esquerda' ? -7 : v.pende === 'direita' ? 7 : 0;
  const desce = (lado: 'esquerda' | 'direita') => (v.pende === lado ? 14 : v.pende ? -14 : 0);
  const desc = `Balança ${v.pende ? 'desequilibrada' : 'equilibrada'}. Esquerda: ${v.esquerda.map((x) => (x === null ? 'pacote sem medida' : `${x} kg`)).join(', ')}. Direita: ${v.direita.map((x) => (x === null ? 'pacote sem medida' : `${x} kg`)).join(', ')}.`;
  return (
    <figure className="balanca" role="img" aria-label={desc}>
      <div className="balanca-pratos">
        {(['esquerda', 'direita'] as const).map((lado) => (
          <div key={lado} className="balanca-lado" style={{ transform: `translateY(${desce(lado)}px)` }}>
            <div className="balanca-pesos">{v[lado].map((kg, i) => <Peso key={i} kg={kg} />)}</div>
            <div className="balanca-prato" />
          </div>
        ))}
      </div>
      <div className="balanca-braco" style={{ transform: `rotate(${giro}deg)` }} />
      <div className="balanca-pe" />
      <div className="balanca-base" />
      {v.pende && <figcaption className="small" style={{ fontWeight: 800, color: 'var(--t-coral)' }}>Pende para a {v.pende}</figcaption>}
    </figure>
  );
}

/** Setas de ida e volta, como no livro: ida em cima, volta embaixo. */
function Setas({ v }: { v: Extract<Visual, { tipo: 'setas' }> }) {
  const caixa = (n: number | null) => <span className={`setas-caixa${n === null ? ' peso-falta' : ''}`}>{n ?? '?'}</span>;
  return (
    <figure className="setas" role="img" aria-label={`${v.de ?? 'quadrinho vazio'}, seta ${v.ida} para ${v.para ?? 'quadrinho vazio'}; volta ${v.volta}.`}>
      {caixa(v.de)}
      <span className="setas-meio">
        <span className="setas-ida">{v.ida} →</span>
        <span className="setas-volta">← {v.volta}</span>
      </span>
      {caixa(v.para)}
    </figure>
  );
}

function Desenho({ v }: { v?: Visual }) {
  if (!v) return null;
  return v.tipo === 'balanca' ? <Balanca v={v} /> : <Setas v={v} />;
}

/* ---------- Teclado de números ---------- */

function Teclado({ valor, setValor, onConferir }: { valor: string; setValor: (s: string) => void; onConferir: () => void }) {
  // Também dá para usar o teclado do computador.
  useEffect(() => {
    const f = (ev: KeyboardEvent) => {
      if (/^\d$/.test(ev.key)) setValor(valor.length < 5 ? valor + ev.key : valor);
      else if (ev.key === 'Backspace') setValor(valor.slice(0, -1));
      else if (ev.key === 'Enter' && valor) onConferir();
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [valor, setValor, onConferir]);
  const tecla = (d: string) => (
    <button key={d} className="btn btn-escuro tecla" onClick={() => setValor(valor.length < 5 ? valor + d : valor)}>{d}</button>
  );
  return (
    <div className="coluna" style={{ gap: 10 }}>
      <div className="teclado">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(tecla)}
        <button className="btn btn-escuro tecla tecla-texto" onClick={() => setValor(valor.slice(0, -1))} disabled={!valor}>Apagar</button>
        {tecla('0')}
        <button className="btn btn-verde tecla" aria-label="OK, conferir" onClick={onConferir} disabled={!valor}>OK</button>
      </div>
    </div>
  );
}

/* ---------- Uma conta ---------- */

/**
 * Mostra a conta, recebe a resposta digitada e (se `corrigirNaHora`) mostra o certo e a explicação.
 * Na prova, a correção fica para o fim, como nas provas de História.
 */
export function Pergunta({ conta, corrigirNaHora = true, rotuloProxima, onResposta, onProxima }: {
  conta: Conta; corrigirNaHora?: boolean; rotuloProxima: string;
  onResposta: (ok: boolean, valor: number) => void; onProxima: () => void;
}) {
  const [valor, setValor] = useState('');
  const [respondida, setRespondida] = useState<{ ok: boolean } | null>(null);
  const conferir = () => {
    if (!valor || respondida) return;
    const n = Number(valor);
    const ok = n === conta.resposta;
    onResposta(ok, n);
    if (corrigirNaHora) setRespondida({ ok });
    else onProxima();
  };
  return (
    <>
      <div className="painel-destaque coluna" style={{ gap: 8, alignItems: 'center', textAlign: 'center', padding: 14 }}>
        <p className="display" style={{ fontSize: 19, margin: 0, textWrap: 'balance' }}>{conta.enunciado}</p>
        {conta.sentenca && <p className="display conta-grande" style={{ margin: 0 }}>{conta.sentenca}</p>}
        <Desenho v={conta.visual} />
        <div className="coluna" style={{ gap: 4, alignItems: 'center' }}>
          <span className="muted small rotulo-resposta" id="rotulo-resposta" style={{ fontWeight: 800 }}>Sua resposta</span>
          <div className={`resposta-caixa${respondida ? (respondida.ok ? ' certa' : ' errada') : ''}`} role="group" aria-labelledby="rotulo-resposta">
            <span className="display">{valor || '?'}</span>{conta.unidade && <span className="muted small"> {conta.unidade}</span>}
          </div>
        </div>
      </div>
      {respondida ? (
        <div className="coluna sobe">
          <div className={`aviso ${respondida.ok ? 'aviso-ok' : 'aviso-erro'}`} role="status">
            <span className="display" style={{ fontSize: 18 }}>{respondida.ok ? 'Acertou! ' : `Era ${conta.resposta}${conta.unidade ? ' ' + conta.unidade : ''}. `}</span>
            {conta.explicacao}
          </div>
          <button className="btn btn-amarelo btn-bloco" onClick={onProxima}>{rotuloProxima}</button>
        </div>
      ) : (
        <Teclado valor={valor} setValor={setValor} onConferir={conferir} />
      )}
    </>
  );
}

/* ---------- Fase 1: ver como se faz ---------- */

export function VerComoSeFaz({ cap }: { cap: Capitulo }) {
  const exemplos = cap.matematica!.exemplos;
  const { res, finalizar, limpar } = useFinalizar(cap, 'ouvir');
  const [ex, setEx] = useState(0);
  const [vistos, setVistos] = useState(1);
  const [tentando, setTentando] = useState(false);
  const [rodada, setRodada] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const conta = useMemo(() => gerarConta(exemplos[ex].treino), [exemplos, ex, rodada]);

  if (res) return <Fim cap={cap} r={res} titulo="Você viu como se faz!" placar={{ acertos, total: exemplos.length, nome: 'contas certas' }}
    onDeNovo={() => { setEx(0); setVistos(1); setTentando(false); setAcertos(0); setRodada((r) => r + 1); limpar(); }} />;

  const e = exemplos[ex];
  const ultimo = ex + 1 === exemplos.length;
  const proximo = () => {
    if (ultimo) { finalizar(); return; }
    setEx(ex + 1); setVistos(1); setTentando(false);
  };
  return (
    <main className="tela">
      <Topo cap={cap} fase="ouvir" extra={<span className="pilula">{ex + 1}/{exemplos.length}</span>} />
      <div className="barra barra-verde"><div style={{ width: `${((ex + (tentando ? 0.5 : 0)) / exemplos.length) * 100}%` }} /></div>
      {!tentando ? (
        <>
          <div className="linha" style={{ alignItems: 'flex-end', gap: 8 }}>
            <Ara tamanho={70} humor="pensando" />
            <div className="balao" style={{ flex: 1 }}>
              <span className="eyebrow" style={{ display: 'block', color: 'var(--t-cyan)' }}>{e.titulo}</span>
              <Texto t={e.ideia} />
            </div>
          </div>
          <div className="painel-destaque">
            <span className="eyebrow" style={{ color: 'var(--t-yellow)' }}>Exemplo</span>
            <p className="display" style={{ fontSize: 20, margin: '4px 0 0' }}><Texto t={e.situacao} /></p>
          </div>
          <ol className="coluna passos" style={{ gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
            {e.passos.slice(0, vistos).map((p, i) => (
              <li key={i} className="painel linha" style={{ padding: '10px 12px', gap: 10, fontWeight: 700 }}>
                <span className="passo-num" aria-hidden="true">{i + 1}</span><span><Texto t={p} /></span>
              </li>
            ))}
          </ol>
          <div style={{ marginTop: 'auto' }}>
            {vistos < e.passos.length
              ? <button className="btn btn-ciano btn-bloco" onClick={() => setVistos(vistos + 1)}>Próximo passo</button>
              : <button className="btn btn-amarelo btn-bloco" onClick={() => setTentando(true)}>Agora você!</button>}
          </div>
        </>
      ) : conta && (
        <>
          <div className="balao">Agora você! Uma conta do mesmo jeito, com outros números.</div>
          <Pergunta key={`${ex}-${rodada}`} conta={conta} rotuloProxima={ultimo ? 'Terminar' : 'Próximo exemplo'}
            onResposta={(ok) => { if (ok) setAcertos((a) => a + 1); lembrar([[idConta(cap.id, conta.tipo), ok]]); }}
            onProxima={proximo} />
        </>
      )}
    </main>
  );
}

/* ---------- Fases 2, 3 e chefão: lista de contas ---------- */

const TITULOS: Partial<Record<Fase, [string, string]>> = {
  memoria: ['Treino feito!', 'Bom treino!'],
  linha: ['Desafio vencido!', 'Bom desafio!'],
};

export function FaseContas({ cap, fase }: { cap: Capitulo; fase: 'memoria' | 'linha' | 'prova' }) {
  const m = cap.matematica!;
  const tipos = fase === 'memoria' ? m.treino : fase === 'linha' ? m.desafio : m.prova;
  const prova = fase === 'prova';
  const { res, finalizar, limpar } = useFinalizar(cap, fase);
  const [rodada, setRodada] = useState(0);
  const contas = useMemo(() => gerarContas(tipos), [tipos, rodada]);
  const [i, setI] = useState(0);
  const [respostas, setRespostas] = useState<number[]>([]);
  const acertos = respostas.filter((r, k) => r === contas[k].resposta).length;
  const erros = respostas.length - acertos;

  const deNovo = () => { setRodada((r) => r + 1); setI(0); setRespostas([]); limpar(); };

  if (res) {
    const nota = notaDe(acertos, contas.length);
    const passou = nota >= NOTA_MINIMA;
    const [bom, ok] = TITULOS[fase] ?? ['', ''];
    return (
      <>
        <Fim cap={cap} r={res} aprovado={!prova || passou}
          titulo={prova ? (passou ? 'Chefão vencido!' : 'Quase lá!') : acertos >= contas.length * 0.8 ? bom : ok}
          placar={{ acertos, total: contas.length }}
          detalhe={<div className="coluna" style={{ alignItems: 'center', gap: 0 }}>
            {prova && !passou && <div className="muted">Precisa de nota {NOTA_MINIMA} para passar e ganhar o pacote épico.</div>}
            {erros > 0 && AVISO_REVISAO}
          </div>}
          onDeNovo={deNovo} />
        {prova && (
          <section className="tela" style={{ paddingTop: 0 }} aria-label="Correção">
            <h2 className="display h2">Correção</h2>
            {contas.map((c, k) => {
              const certo = respostas[k] === c.resposta;
              return (
                <div key={k} className={`aviso ${certo ? 'aviso-ok' : 'aviso-erro'}`}>
                  <div className="display" style={{ fontSize: 16 }}>{k + 1}. {c.enunciado}{c.sentenca ? ` ${c.sentenca}` : ''}</div>
                  {!certo && <div className="small" style={{ color: 'var(--t-red)' }}>Você digitou: {respostas[k]}</div>}
                  <div className="small">Certa: <strong>{c.resposta}{c.unidade ? ` ${c.unidade}` : ''}</strong></div>
                  <div className="small muted">{c.explicacao}</div>
                </div>
              );
            })}
          </section>
        )}
      </>
    );
  }

  const conta = contas[i];
  const ultima = i + 1 === contas.length;
  const proxima = (lista: number[]) => {
    if (lista.length < contas.length) { setI(lista.length); return; }
    const certas = lista.filter((r, k) => r === contas[k].resposta).length;
    lembrar(contas.map((c, k) => [idConta(cap.id, c.tipo), lista[k] === c.resposta]));
    finalizar(notaDe(certas, contas.length), contas.length - certas);
  };
  return (
    <main className="tela tela-contas">
      <Topo cap={cap} fase={fase} extra={<span className="pilula">{i + 1}/{contas.length}</span>} />
      <div className={`barra ${prova ? 'barra-ciano' : 'barra-verde'}`}><div style={{ width: `${(i / contas.length) * 100}%` }} /></div>
      {!prova && <div className="erros-contas"><ContaErros erros={erros} /></div>}
      {/* Na prova, cada resposta vai direto para a próxima conta; a correção aparece no fim. */}
      <Pergunta key={`${rodada}-${i}`} conta={conta} corrigirNaHora={!prova} rotuloProxima={ultima ? 'Terminar' : 'Próxima'}
        onResposta={(_, n) => { const novo = [...respostas, n]; setRespostas(novo); if (prova) proxima(novo); }}
        onProxima={() => { if (!prova) proxima(respostas); }} />
    </main>
  );
}
