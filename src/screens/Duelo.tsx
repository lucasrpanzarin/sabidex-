// Duelo do Saber (Lucas, 05/11/2026): desafiar um colega da turma.
// Os dois respondem as mesmas 10 perguntas, cada um quando puder. Quem acerta mais vence.
// Cada um escolhe um Sabimon parceiro para a batalha, mas ninguém perde carta.

import { useEffect, useMemo, useState } from 'react';
import { Ara } from '../components/Ara';
import { CartaView } from '../components/CartaView';
import { Icone } from '../components/Icone';
import { Moeda } from '../components/Loja';
import { capitulos } from '../data';
import { api, sincronizar, useConta, verPropostas } from '../lib/conta';
import { FIGURINHAS, figurinhaPorId, type Figurinha } from '../lib/figurinhas';
import { embaralhar, hoje, nivel, premiar } from '../lib/jogo';
import { registrarResposta } from '../lib/revisao';
import { ir } from '../lib/rota';
import { forca } from '../lib/sabimon';
import { getEstado, setEstado, useEstado } from '../lib/store';
import {
  acertosPorPergunta, DUELOS_COM_XP_POR_DIA, PERGUNTAS_DUELO, perguntaDuelo, rodadas, XP_POR_ACERTO_DUELO, xpDoDuelo, type PerguntaDuelo,
} from '../shared/duelo';
import { Placar } from './Fases';
import { Avatar, Erro } from './Turma';

interface DueloApi {
  id: string; status: string; vencedor: 'de' | 'para' | 'empate' | null; criado: number; resolvido: number | null;
  de_id: string; para_id: string; de_apelido: string; de_cor: string; para_apelido: string; para_cor: string;
  perguntas: string[]; carta_de: string; carta_para: string | null;
  resp_de: number[] | null; resp_para: number[] | null; acertos_de: number | null; acertos_para: number | null;
}
interface Colega { id: string; apelido: string; cor: string; online?: number }

const nomeCarta = (id: string | null) => { const f = id ? figurinhaPorId.get(id) : undefined; return f ? f.s.formas[f.forma - 1].nome : 'Sabimon'; };
const reduzir = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

type Modo =
  | { tipo: 'lista' }
  | { tipo: 'novo' }
  | { tipo: 'aceitar'; d: DueloApi }
  | { tipo: 'jogar'; d: DueloApi; carta: string }
  | { tipo: 'ver'; d: DueloApi };

export function Duelos() {
  const { conta } = useConta();
  const [modo, setModo] = useState<Modo>({ tipo: 'lista' });
  const [dados, setDados] = useState<{ eu: string; duelos: DueloApi[]; comXpHoje: number } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const carregar = async () => {
    const r = await api<{ eu: string; duelos: DueloApi[]; comXpHoje: number }>('/crianca/duelos');
    if (r.erro) setErro(r.erro); else { setDados(r); setErro(null); }
    void verPropostas();
  };
  useEffect(() => {
    if (!conta?.codigo || modo.tipo !== 'lista') return;
    void carregar();
    const t = setInterval(() => void carregar(), 30_000);
    return () => clearInterval(t);
  }, [conta?.codigo, modo.tipo]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!conta?.codigo) {
    return (
      <main className="tela">
        <button className="voltar" onClick={() => ir('trocas')}><Icone nome="voltar" tamanho={18} espessura={3} />Turma</button>
        <h1 className="display h1">Duelo do Saber</h1>
        <div className="linha" style={{ alignItems: 'flex-end' }}>
          <Ara tamanho={90} />
          <div className="balao" style={{ flex: 1, marginBottom: 14 }}>Entre na sua <strong>turma</strong> para desafiar os colegas!</div>
        </div>
      </main>
    );
  }

  const voltarLista = () => setModo({ tipo: 'lista' });
  if (modo.tipo === 'novo') return <NovoDuelo aoVoltar={voltarLista} aoCriar={(d, carta) => setModo({ tipo: 'jogar', d, carta })} />;
  if (modo.tipo === 'aceitar') return <EscolherCarta titulo={`Desafio de ${modo.d.de_apelido}`} aoVoltar={voltarLista} aoEscolher={(carta) => setModo({ tipo: 'jogar', d: modo.d, carta })} />;
  if (modo.tipo === 'jogar') return <JogarDuelo d={modo.d} eu={dados?.eu ?? conta.id} carta={modo.carta} aoSair={voltarLista} />;
  if (modo.tipo === 'ver') return <ResultadoDuelo d={modo.d} eu={dados?.eu ?? conta.id} aoSair={voltarLista} />;

  const eu = dados?.eu;
  const lista = dados?.duelos ?? [];
  const paraMim = lista.filter((d) => d.para_id === eu && d.status === 'esperando');
  // Desafio que a criança criou mas fechou antes de jogar: ainda dá para jogar (o colega só vê depois).
  const naoJoguei = lista.filter((d) => d.de_id === eu && d.status === 'novo');
  const esperando = lista.filter((d) => d.de_id === eu && d.status === 'esperando');
  const feitos = lista.filter((d) => d.status === 'feito');
  const outros = lista.filter((d) => ['recusado', 'cancelado', 'expirado'].includes(d.status)).slice(0, 5);

  const agir = async (d: DueloApi, acao: 'recusar' | 'cancelar') => {
    setOcupado(d.id);
    const r = await api(`/crianca/duelos/${d.id}/${acao}`, { corpo: {} });
    setOcupado(null);
    if (r.erro) setErro(r.erro);
    await carregar();
  };

  return (
    <main className="tela">
      <button className="voltar" onClick={() => ir('trocas')}><Icone nome="voltar" tamanho={18} espessura={3} />Turma</button>
      <div>
        <div className="eyebrow">{conta.turma}</div>
        <h1 className="display h1">Duelo do Saber</h1>
      </div>
      <div className="linha" style={{ alignItems: 'flex-end' }}>
        <Ara tamanho={80} />
        <div className="balao small" style={{ flex: 1, marginBottom: 12 }}>
          Vocês respondem as <strong>mesmas {PERGUNTAS_DUELO} perguntas</strong>, cada um quando puder. Quem acertar mais vence. <strong>Ninguém perde carta!</strong>
        </div>
      </div>
      <button className="btn btn-amarelo btn-bloco" onClick={() => setModo({ tipo: 'novo' })}>Desafiar um colega</button>
      {dados && (
        <p className="muted small" style={{ margin: 0, textAlign: 'center' }}>
          {dados.comXpHoje > 0
            ? `Hoje ainda ${dados.comXpHoje === 1 ? 'vale 1 duelo' : `valem ${dados.comXpHoje} duelos`} com XP: +${XP_POR_ACERTO_DUELO} por acerto.`
            : `Você já fez os ${DUELOS_COM_XP_POR_DIA} duelos com XP de hoje. Pode duelar por diversão!`}
        </p>
      )}
      <Erro texto={erro} />
      {!dados && !erro && <p className="muted">Carregando…</p>}

      {paraMim.length > 0 && (
        <section className="coluna" aria-label="Desafios para você">
          <h2 className="display h3">Desafios para você <span className="pilula" style={{ marginLeft: 6, borderColor: 'var(--pink)' }}>{paraMim.length}</span></h2>
          {paraMim.map((d) => (
            <article key={d.id} className="painel-destaque coluna" style={{ gap: 10 }}>
              <div className="linha" style={{ gap: 8 }}>
                <Avatar nome={d.de_apelido} cor={d.de_cor} tamanho={36} />
                <span style={{ flex: 1, fontWeight: 800 }}><span className="display">{d.de_apelido}</span> te desafiou com {nomeCarta(d.carta_de)}</span>
              </div>
              <div className="muted small">{d.de_apelido} já jogou. Você descobre o placar quando terminar!</div>
              <div className="linha" style={{ gap: 10 }}>
                <button className="btn btn-escuro" style={{ flex: 1 }} disabled={ocupado === d.id} onClick={() => void agir(d, 'recusar')}>Agora não</button>
                <button className="btn btn-amarelo" style={{ flex: 1.4 }} onClick={() => setModo({ tipo: 'aceitar', d })}>Aceitar</button>
              </div>
            </article>
          ))}
        </section>
      )}

      {naoJoguei.length > 0 && (
        <section className="coluna" aria-label="Falta você jogar">
          <h2 className="display h3">Falta você jogar</h2>
          {naoJoguei.map((d) => (
            <div key={d.id} className="painel linha" style={{ padding: 12 }}>
              <Avatar nome={d.para_apelido} cor={d.para_cor} tamanho={32} />
              <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>Desafio para <strong>{d.para_apelido}</strong>. Jogue para enviar!</span>
              <button className="btn btn-amarelo" style={{ minHeight: 40, fontSize: 15, padding: '6px 12px' }} onClick={() => setModo({ tipo: 'jogar', d, carta: d.carta_de })}>Jogar</button>
            </div>
          ))}
        </section>
      )}

      {esperando.length > 0 && (
        <section className="coluna" aria-label="Esperando o colega">
          <h2 className="display h3">Esperando o colega</h2>
          {esperando.map((d) => (
            <div key={d.id} className="painel linha" style={{ padding: 12 }}>
              <Avatar nome={d.para_apelido} cor={d.para_cor} tamanho={32} />
              <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>Você acertou <strong>{d.acertos_de} de {d.perguntas.length}</strong>. Agora é a vez de {d.para_apelido}.</span>
              <button className="btn btn-escuro" style={{ minHeight: 40, fontSize: 15, padding: '6px 12px' }} disabled={ocupado === d.id} onClick={() => void agir(d, 'cancelar')}>Cancelar</button>
            </div>
          ))}
        </section>
      )}

      {feitos.length > 0 && (
        <section className="coluna" aria-label="Resultados" style={{ gap: 8 }}>
          <h2 className="display h3">Resultados</h2>
          {feitos.map((d) => {
            const souDe = d.de_id === eu;
            const outro = souDe ? d.para_apelido : d.de_apelido;
            const meu = souDe ? d.acertos_de : d.acertos_para;
            const dele = souDe ? d.acertos_para : d.acertos_de;
            const ganhei = d.vencedor === (souDe ? 'de' : 'para');
            const txt = d.vencedor === 'empate' ? 'Empate' : ganhei ? 'Você venceu' : `${outro} venceu`;
            return (
              <button key={d.id} className="painel linha" style={{ padding: 12, textAlign: 'left', color: 'inherit' }} onClick={() => setModo({ tipo: 'ver', d })}>
                <Avatar nome={outro} cor={souDe ? d.para_cor : d.de_cor} tamanho={32} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="display" style={{ display: 'block', fontSize: 17, color: ganhei ? 'var(--t-green)' : 'var(--ink)' }}>{txt}</span>
                  <span className="muted small">Você {meu} × {dele} {outro}</span>
                </span>
                <span className="small" style={{ fontWeight: 800, color: 'var(--t-cyan)' }}>Ver batalha</span>
              </button>
            );
          })}
        </section>
      )}

      {outros.length > 0 && (
        <section className="coluna" aria-label="Outros desafios" style={{ gap: 4 }}>
          {outros.map((d) => {
            const souDe = d.de_id === eu;
            const outro = souDe ? d.para_apelido : d.de_apelido;
            const txt = { recusado: souDe ? `${outro} não quis duelar agora` : `Você recusou o desafio de ${outro}`,
              cancelado: souDe ? `Você cancelou o desafio para ${outro}` : `${outro} cancelou o desafio`,
              expirado: `O desafio com ${outro} venceu (7 dias sem jogar)` }[d.status as 'recusado'];
            return <div key={d.id} className="small muted" style={{ fontWeight: 700 }}>{txt}</div>;
          })}
        </section>
      )}
    </main>
  );
}

/* ---------------- Criar um desafio ---------------- */

function NovoDuelo({ aoVoltar, aoCriar }: { aoVoltar: () => void; aoCriar: (d: DueloApi, carta: string) => void }) {
  const [colegas, setColegas] = useState<Colega[] | null>(null);
  const [colega, setColega] = useState<Colega | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => { void api<{ colegas: Colega[] }>('/crianca/turma').then((r) => (r.erro ? setErro(r.erro) : setColegas(r.colegas))); }, []);

  const criar = async (carta: string) => {
    if (!colega) return;
    setOcupado(true); setErro(null);
    await sincronizar(); // o servidor precisa saber os mundos que a criança já estudou
    const r = await api<{ duelo: DueloApi }>('/crianca/duelos', { corpo: { para: colega.id, carta } });
    setOcupado(false);
    if (r.erro) { setErro(r.erro); setColega(null); return; }
    aoCriar(r.duelo, carta);
  };

  if (colega) return <EscolherCarta titulo={`Desafiar ${colega.apelido}`} aoVoltar={() => setColega(null)} aoEscolher={(c) => void criar(c)} ocupado={ocupado} erro={erro} />;

  return (
    <main className="tela">
      <button className="voltar" onClick={aoVoltar}><Icone nome="voltar" tamanho={18} espessura={3} />Voltar</button>
      <div>
        <div className="eyebrow">Novo duelo · passo 1 de 2</div>
        <h1 className="display h2">Quem você quer desafiar?</h1>
      </div>
      <p className="muted small" style={{ margin: 0 }}>As perguntas são dos mundos que vocês dois já estudaram.</p>
      <Erro texto={erro} />
      {!colegas && !erro && <p className="muted">Carregando…</p>}
      {colegas?.length === 0 && <div className="balao">Ainda não tem colegas na turma. Chame seus amigos!</div>}
      <div className="coluna" style={{ gap: 8 }}>
        {colegas?.map((c) => (
          <button key={c.id} className="linha" onClick={() => { setErro(null); setColega(c); }} style={{ minHeight: 60, borderRadius: 16, padding: '8px 12px', background: 'var(--surface)', border: '3px solid var(--ink)', textAlign: 'left' }}>
            <span style={{ position: 'relative' }}><Avatar nome={c.apelido} cor={c.cor} />{!!c.online && <span className="colega-online" aria-hidden="true" />}</span>
            <span style={{ flex: 1 }}><span className="display" style={{ fontSize: 18, display: 'block' }}>{c.apelido}</span>{!!c.online && <span className="muted small">Estudando agora</span>}</span>
            <Icone nome="seguir" />
          </button>
        ))}
      </div>
    </main>
  );
}

/** Escolher o Sabimon parceiro da batalha (a carta não sai do álbum). */
function EscolherCarta({ titulo, aoVoltar, aoEscolher, ocupado = false, erro = null }: { titulo: string; aoVoltar: () => void; aoEscolher: (carta: string) => void; ocupado?: boolean; erro?: string | null }) {
  const e = useEstado();
  // As mais fortes primeiro (forma mais alta, depois a força).
  const minhas = useMemo(() => FIGURINHAS.filter((f) => e.cartas[f.id] > 0)
    .sort((a, b) => forca(b.s, b.forma, 0) - forca(a.s, a.forma, 0) || b.numero - a.numero), [e.cartas]);
  return (
    <main className="tela">
      <button className="voltar" onClick={aoVoltar}><Icone nome="voltar" tamanho={18} espessura={3} />Voltar</button>
      <div>
        <div className="eyebrow">{titulo}</div>
        <h1 className="display h2">Escolha seu Sabimon parceiro</h1>
      </div>
      <p className="muted small" style={{ margin: 0 }}>Ele luta do seu lado: cada acerto vira um golpe. A carta <strong>continua no seu álbum</strong>, ganhando ou perdendo.</p>
      <Erro texto={erro} />
      {ocupado && <p className="muted">Preparando as perguntas…</p>}
      {minhas.length === 0 && <div className="balao">Você ainda não tem Sabimons. Jogue as fases para ganhar pacotes!</div>}
      <div className="grade-3">
        {minhas.map((f: Figurinha) => (
          <div key={f.id}><CartaView carta={f.s} forma={f.forma} onClick={ocupado ? undefined : () => aoEscolher(f.id)} /></div>
        ))}
      </div>
    </main>
  );
}

/* ---------------- Jogar as 10 perguntas ---------------- */

function JogarDuelo({ d, eu, carta, aoSair }: { d: DueloApi; eu: string; carta: string; aoSair: () => void }) {
  const perguntas = useMemo(() => d.perguntas.map((id) => perguntaDuelo(id, capitulos)).filter((p): p is PerguntaDuelo => !!p), [d.perguntas]);
  // A ordem das opções muda para cada um (a resposta vai para o servidor na ordem original).
  const ordens = useMemo(() => perguntas.map((p) => (p.vf ? p.opcoes.map((_, i) => i) : embaralhar(p.opcoes.map((_, i) => i)))), [perguntas]);
  const [i, setI] = useState(0);
  const [respostas, setRespostas] = useState<number[]>([]);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fim, setFim] = useState<{ d: DueloApi; acertos: number; xp: number; subiu: boolean; pacotes: number } | null>(null);

  if (perguntas.length !== d.perguntas.length) {
    return <main className="tela"><Erro texto="Esse duelo tem perguntas que não existem mais. Cancele e faça outro." /><button className="btn btn-escuro btn-bloco" onClick={aoSair}>Voltar</button></main>;
  }

  const enviar = async (rs: number[]) => {
    setEnviando(true); setErro(null);
    const r = await api<{ duelo: DueloApi; acertos: number; valeXp: boolean }>(`/crianca/duelos/${d.id}/responder`, { corpo: { respostas: rs, carta } });
    setEnviando(false);
    if (r.erro) return setErro(r.erro);
    // Erros voltam na Revisão do Ará, como nas fases.
    const dia = hoje();
    setEstado((e) => ({ ...e, revisao: perguntas.reduce((rev, p, k) => registrarResposta(rev, p.id, rs[k] === p.certa, dia), e.revisao) }));
    let xp = 0, subiu = false, pacotes = 0;
    if (r.valeXp) {
      // XP e Sabicoins pelo que acertou. Sem pacote do dia: pacote só vem das fases (só o de nível novo, que é pelo XP).
      const res = premiar(getEstado(), perguntas[0].cap.id, xpDoDuelo(r.acertos), [], false, getEstado().feitas, new Date(), false);
      setEstado(res.estado);
      xp = res.xpGanho; subiu = res.subiuNivel; pacotes = res.pacotesGanhos.length;
    }
    setFim({ d: r.duelo, acertos: r.acertos, xp, subiu, pacotes });
  };

  const confirmar = () => {
    if (escolha === null) return;
    setRespostas([...respostas, escolha]);
  };
  const proxima = () => {
    setEscolha(null);
    if (respostas.length === perguntas.length) void enviar(respostas);
    else setI(i + 1);
  };

  if (fim) {
    const souDe = fim.d.de_id === eu;
    return (
      <main className="tela" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div className="pop"><Ara tamanho={110} humor="comemorando" /></div>
        <h1 className="display h1 titulo-premio">Você terminou!</h1>
        <Placar acertos={fim.acertos} total={perguntas.length} />
        <div className="painel coluna sobe" style={{ width: '100%', gap: 6 }}>
          {fim.xp > 0 ? (
            <div className="linha" style={{ justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span className="display" style={{ fontSize: 28, color: 'var(--t-cyan)' }}>+{fim.xp} XP</span>
              <span className="display linha" style={{ fontSize: 28, color: 'var(--t-yellow)', gap: 6 }}><Moeda tamanho={24} />+{fim.xp}</span>
            </div>
          ) : <div className="muted small">{fim.acertos === 0 ? 'Desta vez não deu XP.' : `Hoje você já ganhou o XP de ${DUELOS_COM_XP_POR_DIA} duelos. Este foi por diversão!`}</div>}
          {fim.subiu && <div className="display pop" style={{ fontSize: 20, color: 'var(--t-green)' }}>Subiu para o nível {nivel(getEstado().xp).nivel}!</div>}
          {fim.pacotes > 0 && <div className="small" style={{ fontWeight: 800 }}>Você ganhou um pacote pelo nível novo!</div>}
        </div>
        {souDe ? (
          <>
            <div className="balao">Desafio enviado para <strong>{d.para_apelido}</strong>! Quando {d.para_apelido} jogar, o resultado aparece aqui.</div>
            <button className="btn btn-amarelo btn-bloco" onClick={aoSair}>Ver meus duelos</button>
          </>
        ) : (
          <>
            <div className="balao">Agora vamos ver a batalha contra <strong>{d.de_apelido}</strong>!</div>
            <ResultadoDuelo d={fim.d} eu={eu} aoSair={aoSair} embutido />
          </>
        )}
        {fim.pacotes > 0 && <button className="btn btn-escuro btn-bloco" onClick={() => ir('pacote')}>Abrir pacote</button>}
      </main>
    );
  }

  const p = perguntas[i];
  const respondida = respostas.length > i;
  const ok = respondida && respostas[i] === p.certa;
  return (
    <main className="tela">
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <button className="voltar" onClick={aoSair}><Icone nome="voltar" tamanho={18} espessura={3} />Sair</button>
        <span className="pilula">{i + 1}/{perguntas.length}</span>
      </div>
      <div>
        <div className="eyebrow">Duelo contra {d.de_id === eu ? d.para_apelido : d.de_apelido} · {p.cap.titulo}</div>
        <h1 className="display h2" style={{ marginTop: 4 }}>{p.pergunta}</h1>
      </div>
      <div className="barra barra-ciano" aria-hidden="true"><div style={{ width: `${(i / perguntas.length) * 100}%` }} /></div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="coluna" disabled={respondida}>
        <legend className="sr-only">Escolha uma resposta</legend>
        {ordens[i].map((orig) => {
          const marcada = respondida ? respostas[i] === orig : escolha === orig;
          const certa = respondida && orig === p.certa;
          const fundo = certa ? '#DCFCE7' : respondida && marcada ? '#FFE4E6' : marcada ? '#CFFAFE' : 'var(--surface)';
          const borda = certa ? 'var(--green)' : respondida && marcada ? 'var(--t-red)' : marcada ? 'var(--cyan)' : 'var(--line)';
          return (
            <label key={orig} className="linha" style={{ minHeight: 56, borderRadius: 16, padding: '10px 12px', cursor: respondida ? 'default' : 'pointer', fontWeight: 700, background: fundo, border: `3px solid ${borda}` }}>
              <input type="radio" name={`d${i}`} checked={marcada} onChange={() => setEscolha(orig)} style={{ position: 'absolute', opacity: 0 }} />
              {p.opcoes[orig]}
            </label>
          );
        })}
      </fieldset>
      {respondida && (
        <div className={`aviso sobe ${ok ? 'aviso-ok' : 'aviso-erro'}`}><span className="display" style={{ fontSize: 18 }}>{ok ? 'Acertou! ' : 'Ops! '}</span>{p.explicacao}</div>
      )}
      <Erro texto={erro} />
      <div style={{ marginTop: 'auto' }}>
        {!respondida
          ? <button className="btn btn-amarelo btn-bloco" disabled={escolha === null} onClick={confirmar}>Confirmar</button>
          : <button className="btn btn-amarelo btn-bloco" disabled={enviando} onClick={proxima}>
              {enviando ? 'Enviando…' : erro ? 'Tentar enviar de novo' : i + 1 === perguntas.length ? 'Terminar' : 'Próxima'}
            </button>}
      </div>
    </main>
  );
}

/* ---------------- A batalha (depois que os dois jogaram) ---------------- */

function LadoBatalha({ carta, nome, apelido, cor, vida, golpe }: { carta: string | null; nome: string; apelido: string; cor: string; vida: number; golpe: boolean }) {
  const f = carta ? figurinhaPorId.get(carta) : undefined;
  return (
    <div className="coluna" style={{ alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
      <div className="linha" style={{ gap: 6 }}><Avatar nome={apelido} cor={cor} tamanho={26} /><span className="display" style={{ fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</span></div>
      <div className={golpe ? 'pop' : undefined} style={{ width: '100%', maxWidth: 130 }}>{f && <CartaView carta={f.s} forma={f.forma} />}</div>
      <div className="barra barra-verde" style={{ width: '100%' }} aria-label={`Vida ${Math.round(vida * 100)}%`}><div style={{ width: `${vida * 100}%`, transition: 'width .4s ease' }} /></div>
    </div>
  );
}

function ResultadoDuelo({ d, eu, aoSair, embutido = false }: { d: DueloApi; eu: string; aoSair: () => void; embutido?: boolean }) {
  const souDe = d.de_id === eu;
  const caps = capitulos;
  const certasDe = useMemo(() => acertosPorPergunta(d.perguntas, d.resp_de ?? [], caps), [d, caps]);
  const certasPara = useMemo(() => acertosPorPergunta(d.perguntas, d.resp_para ?? [], caps), [d, caps]);
  const r = useMemo(() => rodadas(certasDe, certasPara), [certasDe, certasPara]);
  const [passo, setPasso] = useState(() => (reduzir() ? r.length : 0));

  useEffect(() => {
    if (passo >= r.length) return;
    const t = setTimeout(() => setPasso((p) => p + 1), 750);
    return () => clearTimeout(t);
  }, [passo, r.length]);

  const atual = passo > 0 ? r[passo - 1] : { de: false, para: false, vidaDe: 1, vidaPara: 1 };
  const eu1 = souDe ? { carta: d.carta_de, nome: 'Você', apelido: d.de_apelido, cor: d.de_cor } : { carta: d.carta_para, nome: 'Você', apelido: d.para_apelido, cor: d.para_cor };
  const ele = souDe ? { carta: d.carta_para, nome: d.para_apelido, apelido: d.para_apelido, cor: d.para_cor } : { carta: d.carta_de, nome: d.de_apelido, apelido: d.de_apelido, cor: d.de_cor };
  const vidaEu = souDe ? atual.vidaDe : atual.vidaPara;
  const vidaEle = souDe ? atual.vidaPara : atual.vidaDe;
  const acerteiAgora = passo > 0 && (souDe ? atual.de : atual.para);
  const eleAcertou = passo > 0 && (souDe ? atual.para : atual.de);
  const terminou = passo >= r.length;
  const ganhei = d.vencedor === (souDe ? 'de' : 'para');
  const meus = souDe ? d.acertos_de : d.acertos_para;
  const dele = souDe ? d.acertos_para : d.acertos_de;
  const forcaDe = (c: string | null) => { const f = c ? figurinhaPorId.get(c) : undefined; return f ? forca(f.s, f.forma, 0) : 0; };

  const conteudo = (
    <>
      <div className="painel coluna" style={{ width: '100%', gap: 10 }}>
        <div className="linha" style={{ gap: 8, alignItems: 'flex-start' }}>
          <LadoBatalha {...eu1} vida={vidaEu} golpe={eleAcertou && !terminou} />
          <span className="display" style={{ fontSize: 22, alignSelf: 'center', color: 'var(--t-coral)' }}>×</span>
          <LadoBatalha {...ele} vida={vidaEle} golpe={acerteiAgora && !terminou} />
        </div>
        <div className="small" style={{ fontWeight: 800, minHeight: 40, textAlign: 'center' }} aria-live="polite">
          {!terminou && passo === 0 && 'Começando…'}
          {!terminou && passo > 0 && <>Pergunta {passo}: {acerteiAgora ? `${nomeCarta(eu1.carta)} deu um golpe de ${forcaDe(eu1.carta)}!` : 'Você errou.'} {eleAcertou ? `${nomeCarta(ele.carta)} também atacou!` : `${ele.nome} errou.`}</>}
          {terminou && <span className="display" style={{ fontSize: 24, color: d.vencedor === 'empate' ? 'var(--ink)' : ganhei ? 'var(--t-green)' : 'var(--t-coral)' }}>
            {d.vencedor === 'empate' ? 'Empate!' : ganhei ? 'Você venceu!' : `${ele.nome} venceu!`} {meus} × {dele}
          </span>}
        </div>
        {!terminou && <button className="btn btn-escuro" style={{ minHeight: 40, fontSize: 15 }} onClick={() => setPasso(r.length)}>Pular para o fim</button>}
      </div>
      {terminou && (
        <>
          {!ganhei && d.vencedor !== 'empate' && <div className="balao small">Faz parte! As perguntas que você errou voltam na <strong>Revisão do Ará</strong>. Estude e desafie de novo!</div>}
          <section className="coluna" style={{ width: '100%', textAlign: 'left', gap: 6 }} aria-label="Correção">
            <h2 className="display h3">Correção</h2>
            {d.perguntas.map((id, k) => {
              const p = perguntaDuelo(id, caps);
              if (!p) return null;
              const meuOk = souDe ? certasDe[k] : certasPara[k];
              const deleOk = souDe ? certasPara[k] : certasDe[k];
              return (
                <div key={id} className={`aviso ${meuOk ? 'aviso-ok' : 'aviso-erro'}`}>
                  <div className="display" style={{ fontSize: 15 }}>{k + 1}. {p.pergunta}</div>
                  <div className="small">Certa: <strong>{p.opcoes[p.certa]}</strong></div>
                  <div className="small muted">Você {meuOk ? 'acertou' : 'errou'} · {ele.nome} {deleOk ? 'acertou' : 'errou'}</div>
                </div>
              );
            })}
          </section>
          <button className="btn btn-amarelo btn-bloco" onClick={aoSair}>Voltar aos duelos</button>
        </>
      )}
    </>
  );
  if (embutido) return conteudo;
  return (
    <main className="tela" style={{ alignItems: 'center', textAlign: 'center' }}>
      <div style={{ alignSelf: 'flex-start' }}><button className="voltar" onClick={aoSair}><Icone nome="voltar" tamanho={18} espessura={3} />Duelos</button></div>
      <h1 className="display h1">Batalha</h1>
      {conteudo}
    </main>
  );
}
