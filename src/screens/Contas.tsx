// Fases de Matemática: a criança vê como se faz e resolve contas digitando a resposta.
// Os números mudam a cada partida (src/lib/contas.ts). Uma chance por conta: errou, o app mostra o certo e segue.
import { useEffect, useMemo, useState } from 'react';
import { Ara } from '../components/Ara';
import type { Capitulo } from '../data/tipos';
import { TIPOS_PAPEL, confere, ehFracao, gerarConta, gerarContas, textoCerto, textoResposta, type Conta, type Resposta, type Visual } from '../lib/contas';
import { NOTA_MINIMA, notaDe, type Fase } from '../lib/jogo';
import { idConta } from '../lib/revisao';
import { AVISO_REVISAO, ContaErros, Fim, Topo, lembrar, useFinalizar } from './Fases';

/* ---------- Texto com frações ---------- */

/** Fração em pé (numerador em cima, denominador embaixo), como no livro. */
export function Fracao({ n, d }: { n: number | string; d: number | string }) {
  return (
    <span className="fracao" role="math" aria-label={`${n} sobre ${d}`}>
      <span className="fracao-n">{n}</span><span className="fracao-d">{d}</span>
    </span>
  );
}

/** Transforma **negrito** em <strong> e "3/4" em fração em pé. */
export function TextoMat({ t }: { t: string }) {
  // A pontuação logo depois da fração fica grudada nela (senão o ponto cai sozinho na linha de baixo).
  const comFracoes = (x: string, chave: string) => x.split(/(\d+\/\d+[.,;:!?)]*)/g).map((p, i) => {
    const m = p.match(/^(\d+)\/(\d+)([.,;:!?)]*)$/);
    return m ? <span key={`${chave}-${i}`} style={{ whiteSpace: 'nowrap' }}><Fracao n={m[1]} d={m[2]} />{m[3]}</span> : p;
  });
  return <>{t.split(/\*\*(.+?)\*\*/g).map((p, i) => (i % 2 ? <strong key={i}>{comFracoes(p, String(i))}</strong> : comFracoes(p, String(i))))}</>;
}

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

/** Cano dividido em partes iguais, com algumas pintadas (como os canos do Marcelo no livro). */
function Barra({ v }: { v: Extract<Visual, { tipo: 'barra' }> }) {
  return (
    <figure className="barra-fracao" role="img" aria-label={`Barra dividida em ${v.partes} partes iguais, com ${v.pintadas} pintada${v.pintadas === 1 ? '' : 's'}.`}>
      {Array.from({ length: v.partes }, (_, i) => <span key={i} className={i < v.pintadas ? 'pintada' : ''} />)}
    </figure>
  );
}

/** Reta numérica do 0 ao 1, dividida em partes iguais, com uma seta numa marcação. */
function Reta({ v }: { v: Extract<Visual, { tipo: 'reta' }> }) {
  const pos = (i: number) => `${(i / v.partes) * 100}%`;
  return (
    <figure className="reta-numerica" role="img" aria-label={`Reta do 0 ao 1 dividida em ${v.partes} partes iguais. A seta está na marcação ${v.marca} depois do zero.`}>
      <div className="reta-seta" style={{ left: pos(v.marca) }} aria-hidden="true" />
      <div className="reta-linha">
        {Array.from({ length: v.partes + 1 }, (_, i) => <span key={i} className={`reta-tick${i === 0 || i === v.partes ? ' ponta' : ''}`} style={{ left: pos(i) }} />)}
      </div>
      <div className="reta-rotulos" aria-hidden="true"><span style={{ left: 0 }}>0</span><span style={{ left: '100%' }}>1</span></div>
    </figure>
  );
}

/** Quadrado de 10 × 10 (a unidade): cada quadradinho é um centésimo, como na p. 63 do livro. */
function Quadriculado({ v }: { v: Extract<Visual, { tipo: 'quadriculado' }> }) {
  return (
    <figure className="quadriculado" role="img" aria-label={`Quadrado dividido em 100 quadradinhos, com ${v.pintadas} pintado${v.pintadas === 1 ? '' : 's'}.`}>
      {Array.from({ length: 100 }, (_, i) => <span key={i} className={i < v.pintadas ? 'pintada' : ''} />)}
    </figure>
  );
}

/** Moedas (redondas) e cédulas (retângulos) do real, desenhadas de um jeito simples. */
function Moedas({ v }: { v: Extract<Visual, { tipo: 'moedas' }> }) {
  const nome = (c: number) => (c >= 200 ? `cédula de ${c / 100} reais` : c === 100 ? 'moeda de 1 real' : `moeda de ${c} ${c === 1 ? 'centavo' : 'centavos'}`);
  return (
    <figure className="moedas" role="img" aria-label={`${v.valores.map(nome).join(', ')}.`}>
      {v.valores.map((c, i) => c >= 200
        ? <span key={i} className={`cedula cedula-${c / 100}`}><b>{c / 100}</b><small>reais</small></span>
        : <span key={i} className={`moeda moeda-${c}`}><b>{c === 100 ? 1 : c}</b><small>{c === 100 ? 'real' : c === 1 ? 'centavo' : 'centavos'}</small></span>)}
    </figure>
  );
}

function Desenho({ v }: { v?: Visual }) {
  if (!v) return null;
  if (v.tipo === 'quadriculado') return <Quadriculado v={v} />;
  if (v.tipo === 'moedas') return <Moedas v={v} />;
  if (v.tipo === 'balanca') return <Balanca v={v} />;
  if (v.tipo === 'barra') return <Barra v={v} />;
  if (v.tipo === 'reta') return <Reta v={v} />;
  return <Setas v={v} />;
}

/* ---------- Teclado de números ---------- */

/** Põe uma tecla no número digitado. Com vírgula: no máximo uma vírgula e 2 algarismos depois dela. */
function digitar(valor: string, tecla: string, virgula: boolean): string {
  if (tecla === ',') {
    if (!virgula || valor.includes(',')) return valor;
    return (valor || '0') + ',';
  }
  if (valor.includes(',') && valor.split(',')[1].length >= 2) return valor;
  return valor.length < (virgula ? 7 : 5) ? valor + tecla : valor;
}

function Teclado({ valor, setValor, onConferir, pronto, onTrocar, virgula = false }: {
  valor: string; setValor: (s: string) => void; onConferir: () => void; pronto: boolean; onTrocar?: () => void; virgula?: boolean;
}) {
  // Também dá para usar o teclado do computador ("/" troca de caixa na fração; "," ou "." põe a vírgula; Tab continua andando pela tela).
  useEffect(() => {
    const f = (ev: KeyboardEvent) => {
      if (/^\d$/.test(ev.key)) setValor(digitar(valor, ev.key, virgula));
      else if ((ev.key === ',' || ev.key === '.') && virgula) setValor(digitar(valor, ',', virgula));
      else if (ev.key === 'Backspace') setValor(valor.slice(0, -1));
      else if (ev.key === 'Enter' && pronto) onConferir();
      else if (ev.key === '/' && onTrocar) { ev.preventDefault(); onTrocar(); }
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [valor, setValor, onConferir, pronto, onTrocar, virgula]);
  const tecla = (d: string) => (
    <button key={d} className="btn btn-escuro tecla" onClick={() => setValor(digitar(valor, d, virgula))}>{d}</button>
  );
  const apagar = <button className="btn btn-escuro tecla tecla-texto" onClick={() => setValor(valor.slice(0, -1))} disabled={!valor}>Apagar</button>;
  const ok = <button className={`btn btn-verde tecla${virgula ? ' tecla-ok-larga' : ''}`} aria-label="OK, conferir" onClick={onConferir} disabled={!pronto}>OK</button>;
  return (
    <div className="coluna" style={{ gap: 10 }}>
      {virgula ? (
        // Com vírgula: a vírgula fica onde o Apagar ficava, e o OK ganha uma linha inteira.
        <div className="teclado teclado-virgula">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(tecla)}
          <button className="btn btn-escuro tecla tecla-virgula" aria-label="vírgula" onClick={() => setValor(digitar(valor, ',', true))} disabled={valor.includes(',')}>,</button>
          {tecla('0')}
          {apagar}
          {ok}
        </div>
      ) : (
        <div className="teclado">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(tecla)}
          {apagar}
          {tecla('0')}
          {ok}
        </div>
      )}
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
  onResposta: (ok: boolean, digitado: string) => void; onProxima: () => void;
}) {
  const fracao = ehFracao(conta.resposta);
  // Na fração, são duas caixas: numerador (0) em cima e denominador (1) embaixo.
  const [valores, setValores] = useState<[string, string]>(['', '']);
  const [ativa, setAtiva] = useState<0 | 1>(0);
  const [respondida, setRespondida] = useState<{ ok: boolean } | null>(null);
  // Com vírgula, "12," ainda não está pronto (falta o número depois da vírgula).
  const pronto = fracao ? !!valores[0] && !!valores[1] : !!valores[0] && !valores[0].endsWith(',');
  const setValor = (v: string) => setValores((x) => (ativa === 0 ? [v, x[1]] : [x[0], v]));
  const conferir = () => {
    if (!pronto || respondida) return;
    const digitado: Resposta = fracao ? [Number(valores[0]), Number(valores[1])] : Number(valores[0].replace(',', '.'));
    const ok = confere(conta, digitado);
    onResposta(ok, conta.decimal ? `${conta.reais ? 'R$ ' : ''}${valores[0]}` : textoResposta(digitado));
    if (corrigirNaHora) setRespondida({ ok });
    else onProxima();
  };
  const estado = respondida ? (respondida.ok ? ' certa' : ' errada') : '';
  const caixaFracao = (i: 0 | 1, nome: string) => (
    <button type="button" className={`resposta-caixa caixa-fracao${estado}${!respondida && ativa === i ? ' ativa' : ''}`} disabled={!!respondida}
      onClick={() => setAtiva(i)} aria-label={`${nome}: ${valores[i] || 'vazio'}`} aria-pressed={ativa === i}>
      <span className="display">{valores[i] || '?'}</span>
    </button>
  );
  const caixaNumero = (
    <div className={`resposta-caixa${estado}`} role="group" aria-labelledby="rotulo-resposta">
      {conta.reais && <span className="muted small">R$ </span>}<span className="display">{valores[0] || '?'}</span>{conta.unidade && <span className="muted small"> {conta.unidade}</span>}
    </div>
  );
  return (
    <>
      <div className="painel-destaque coluna" style={{ gap: 8, alignItems: 'center', textAlign: 'center', padding: 14 }}>
        <p className="display" style={{ fontSize: 19, margin: 0, textWrap: 'balance' }}><TextoMat t={conta.enunciado} /></p>
        {conta.sentenca && <p className="display conta-grande" style={{ margin: 0 }}><TextoMat t={conta.sentenca} /></p>}
        <Desenho v={conta.visual} />
        {TIPOS_PAPEL.has(conta.tipo) && !respondida && <span className="muted small" style={{ fontWeight: 700 }}>Dica: arme a conta no papel.</span>}
      </div>
      {/* Resposta e teclado ficam presos embaixo da tela (como numa calculadora): o OK e o número digitado sempre aparecem. */}
      <div className="area-resposta">
        <div className="linha resposta-linha">
          <span className="muted small" id="rotulo-resposta" style={{ fontWeight: 800 }}>Sua resposta</span>
          {fracao ? (
            <div className="resposta-fracao" role="group" aria-labelledby="rotulo-resposta">
              {caixaFracao(0, 'Numerador')}
              <span className="traco-fracao" aria-hidden="true" />
              {caixaFracao(1, 'Denominador')}
            </div>
          ) : caixaNumero}
          {fracao && !respondida && (
            <span className="muted small dica-fracao" style={{ fontWeight: 700 }}>
              {ativa === 0 ? 'Escreva o numerador (em cima). Depois toque na caixa de baixo.' : 'Agora o denominador (embaixo).'}
            </span>
          )}
        </div>
        {respondida ? (
          <div className="coluna sobe" style={{ gap: 10 }}>
            <div className={`aviso ${respondida.ok ? 'aviso-ok' : 'aviso-erro'}`} role="status">
              <span className="display" style={{ fontSize: 18 }}>{respondida.ok ? 'Acertou! ' : <>Era <TextoMat t={textoCerto(conta)} />. </>}</span>
              <TextoMat t={conta.explicacao} />
            </div>
            <button className="btn btn-amarelo btn-bloco" onClick={onProxima}>{rotuloProxima}</button>
          </div>
        ) : (
          <Teclado valor={valores[ativa]} setValor={setValor} onConferir={conferir} pronto={pronto}
            onTrocar={fracao ? () => setAtiva((x) => (x === 0 ? 1 : 0)) : undefined} virgula={!!conta.decimal} />
        )}
      </div>
    </>
  );
}

/* ---------- Aviso do papel e lápis ---------- */

/** No começo de cada fase de Matemática: o Ará lembra de pegar papel e lápis para armar as contas. */
function AvisoPapel({ cap, fase, onComecar }: { cap: Capitulo; fase: Fase; onComecar: () => void }) {
  return (
    <main className="tela">
      <Topo cap={cap} fase={fase} />
      <div className="coluna" style={{ alignItems: 'center', textAlign: 'center', flex: 1, justifyContent: 'center' }}>
        <Ara tamanho={110} />
        <div className="balao">Pegue <strong>um papel e um lápis</strong>! Você pode armar as contas no caderno, como na escola. Depois é só digitar a resposta aqui.</div>
        <button className="btn btn-amarelo btn-bloco" onClick={onComecar} autoFocus>Já peguei!</button>
      </div>
    </main>
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
  const [comecou, setComecou] = useState(false);
  if (!comecou) return <AvisoPapel cap={cap} fase="ouvir" onComecar={() => setComecou(true)} />;

  if (res) return <Fim cap={cap} r={res} titulo="Você viu como se faz!" placar={{ acertos, total: exemplos.length, nome: 'contas certas' }}
    onDeNovo={() => { setEx(0); setVistos(1); setTentando(false); setAcertos(0); setRodada((r) => r + 1); limpar(); }} />;

  const e = exemplos[ex];
  const ultimo = ex + 1 === exemplos.length;
  const proximo = () => {
    // As contas do "Agora você" contam: cada erro tira 10% do XP, e o pacote do dia pede nota 7.
    if (ultimo) { finalizar(notaDe(acertos, exemplos.length), exemplos.length - acertos); return; }
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
              <TextoMat t={e.ideia} />
            </div>
          </div>
          <div className="painel-destaque">
            <span className="eyebrow" style={{ color: 'var(--t-yellow)' }}>Exemplo</span>
            <p className="display" style={{ fontSize: 20, margin: '4px 0 0' }}><TextoMat t={e.situacao} /></p>
          </div>
          <ol className="coluna passos" style={{ gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
            {e.passos.slice(0, vistos).map((p, i) => (
              <li key={i} className="painel linha" style={{ padding: '10px 12px', gap: 10, fontWeight: 700 }}>
                <span className="passo-num" aria-hidden="true">{i + 1}</span><span><TextoMat t={p} /></span>
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
  // Cada resposta: se acertou e o que a criança digitou.
  const [respostas, setRespostas] = useState<{ ok: boolean; texto: string }[]>([]);
  const acertos = respostas.filter((r) => r.ok).length;
  const erros = respostas.length - acertos;
  const [comecou, setComecou] = useState(false);
  if (!comecou) return <AvisoPapel cap={cap} fase={fase} onComecar={() => setComecou(true)} />;

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
              const certo = respostas[k]?.ok;
              return (
                <div key={k} className={`aviso ${certo ? 'aviso-ok' : 'aviso-erro'}`}>
                  <div className="display" style={{ fontSize: 16 }}>{k + 1}. <TextoMat t={c.enunciado + (c.sentenca ? ` ${c.sentenca}` : '')} /></div>
                  {!certo && <div className="small" style={{ color: 'var(--t-red)' }}>Você digitou: <TextoMat t={respostas[k]?.texto ?? ''} /></div>}
                  <div className="small">Certa: <strong><TextoMat t={textoCerto(c)} /></strong></div>
                  <div className="small muted"><TextoMat t={c.explicacao} /></div>
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
  const proxima = (lista: { ok: boolean; texto: string }[]) => {
    if (lista.length < contas.length) { setI(lista.length); return; }
    const certas = lista.filter((r) => r.ok).length;
    lembrar(contas.map((c, k) => [idConta(cap.id, c.tipo), !!lista[k]?.ok]));
    finalizar(notaDe(certas, contas.length), contas.length - certas);
  };
  return (
    <main className="tela tela-contas">
      <Topo cap={cap} fase={fase} extra={<span className="pilula">{i + 1}/{contas.length}</span>} />
      <div className={`barra ${prova ? 'barra-ciano' : 'barra-verde'}`}><div style={{ width: `${(i / contas.length) * 100}%` }} /></div>
      {!prova && <div className="erros-contas"><ContaErros erros={erros} /></div>}
      {/* Na prova, cada resposta vai direto para a próxima conta; a correção aparece no fim. */}
      <Pergunta key={`${rodada}-${i}`} conta={conta} corrigirNaHora={!prova} rotuloProxima={ultima ? 'Terminar' : 'Próxima'}
        onResposta={(ok, texto) => { const novo = [...respostas, { ok, texto }]; setRespostas(novo); if (prova) proxima(novo); }}
        onProxima={() => { if (!prova) proxima(respostas); }} />
    </main>
  );
}
