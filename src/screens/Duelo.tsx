// Duelo do Saber (Lucas, 05/11/2026): desafiar um colega da turma.
// Os dois respondem as mesmas perguntas, cada um quando puder. Quem acerta mais vence.
// Cada um escolhe um Sabimon parceiro para a batalha, mas ninguém perde carta.
// 06/11/2026 (Lucas): quem desafia escolhe a matéria, a unidade e o jogo ("Perguntas" ou "Contra o relógio"),
// e no fim tem "Revanche!".

import { useEffect, useMemo, useState } from 'react';
import { Ara } from '../components/Ara';
import { CartaView } from '../components/CartaView';
import { Icone } from '../components/Icone';
import { Moeda } from '../components/Loja';
import { capituloPorId, capitulos, materiasDe } from '../data';
import { api, sincronizar, useConta, verPropostas } from '../lib/conta';
import { FIGURINHAS, figurinhaPorId, type Figurinha } from '../lib/figurinhas';
import { embaralhar, hoje, nivel, premiar } from '../lib/jogo';
import { registrarResposta } from '../lib/revisao';
import type { Resposta } from '../lib/contas';
import { ir } from '../lib/rota';
import { forca } from '../lib/sabimon';
import { getEstado, setEstado, useEstado } from '../lib/store';
import {
  ACERTOS_COM_XP, acertosPorPergunta, acertou, DUELOS_COM_XP_POR_DIA, idRevisaoDuelo, NOME_MODO, PERGUNTAS_DUELO, perguntaDuelo, rodadas,
  tempoRelogio, XP_POR_ACERTO_DUELO, xpDoDuelo, type ModoDuelo, type PerguntaDuelo,
} from '../shared/duelo';
import { textoCerto } from '../lib/contas';
import { Placar } from './Fases';
import { Pergunta, TextoMat } from './Contas';
import { Avatar, Erro } from './Turma';

interface DueloApi {
  id: string; status: string; vencedor: 'de' | 'para' | 'empate' | null; criado: number; resolvido: number | null;
  de_id: string; para_id: string; de_apelido: string; de_cor: string; para_apelido: string; para_cor: string;
  perguntas: string[]; carta_de: string; carta_para: string | null;
  /** materia/mundo '' = todas (duelos antigos misturavam tudo) */
  modo: ModoDuelo; materia: string; mundo: string;
  resp_de: unknown[] | null; resp_para: unknown[] | null; acertos_de: number | null; acertos_para: number | null;
}
interface Colega { id: string; apelido: string; cor: string; online?: number }
/** O que vai cair no duelo: matéria, unidade ('' = todas que os dois estudaram) e o jogo. */
interface Escolha { materia: string; mundo: string; modo: ModoDuelo }

const nomeUnidade = (id: string) => { const c = capituloPorId(id); return c ? `Unidade ${c.numero}` : 'Unidade'; };
/** "Matemática · Unidade 9 · Contra o relógio" (aparece no convite, na lista e no jogo). */
const rotuloDuelo = (d: Pick<DueloApi, 'materia' | 'mundo' | 'modo'>) =>
  (d.materia ? [d.materia, d.mundo ? nomeUnidade(d.mundo) : 'Todas as unidades', NOME_MODO[d.modo]] : ['Várias matérias', NOME_MODO[d.modo]]).join(' · ');

/** Cria o desafio no servidor (quem desafia joga primeiro). */
async function criarDuelo(para: string, carta: string, e: Escolha) {
  await sincronizar(); // o servidor precisa saber as unidades que a criança já estudou
  return api<{ duelo: DueloApi }>('/crianca/duelos', { corpo: { para, carta, ...e } });
}

const nomeCarta = (id: string | null) => { const f = id ? figurinhaPorId.get(id) : undefined; return f ? f.s.formas[f.forma - 1].nome : 'Sabimon'; };
const reduzir = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

type Modo =
  | { tipo: 'lista' }
  | { tipo: 'novo' }
  | { tipo: 'aceitar'; d: DueloApi }
  | { tipo: 'jogar'; d: DueloApi; carta: string }
  | { tipo: 'ver'; d: DueloApi }
  | { tipo: 'revanche'; d: DueloApi };

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
        <button className="voltar voltar-topo" onClick={() => ir('trocas')}><Icone nome="voltar" tamanho={18} espessura={3} />Turma</button>
        <h1 className="display h1">Duelo do Saber</h1>
        <div className="linha" style={{ alignItems: 'flex-end' }}>
          <Ara tamanho={90} />
          <div className="balao" style={{ flex: 1, marginBottom: 14 }}>Entre na sua <strong>turma</strong> para desafiar os colegas!</div>
        </div>
      </main>
    );
  }

  const voltarLista = () => setModo({ tipo: 'lista' });
  const revanche = (d: DueloApi) => setModo({ tipo: 'revanche', d });
  const meuId = dados?.eu ?? conta.id;
  if (modo.tipo === 'novo') return <NovoDuelo aoVoltar={voltarLista} aoCriar={(d, carta) => setModo({ tipo: 'jogar', d, carta })} />;
  if (modo.tipo === 'aceitar') return <EscolherCarta titulo={`Desafio de ${modo.d.de_apelido} · ${rotuloDuelo(modo.d)}`} aoVoltar={voltarLista} aoEscolher={(carta) => setModo({ tipo: 'jogar', d: modo.d, carta })} />;
  if (modo.tipo === 'jogar') return <JogarDuelo key={modo.d.id} d={modo.d} eu={meuId} carta={modo.carta} aoSair={voltarLista} aoRevanche={revanche} />;
  if (modo.tipo === 'ver') return <ResultadoDuelo d={modo.d} eu={meuId} aoSair={voltarLista} aoRevanche={revanche} />;
  if (modo.tipo === 'revanche') return <Revanche d={modo.d} eu={meuId} aoVoltar={voltarLista} aoCriar={(d, carta) => setModo({ tipo: 'jogar', d, carta })} />;

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
      <button className="voltar voltar-topo" onClick={() => ir('trocas')}><Icone nome="voltar" tamanho={18} espessura={3} />Turma</button>
      <div>
        <div className="eyebrow">{conta.turma}</div>
        <h1 className="display h1">Duelo do Saber</h1>
      </div>
      <div className="linha" style={{ alignItems: 'flex-end' }}>
        <Ara tamanho={80} />
        <div className="balao small" style={{ flex: 1, marginBottom: 12 }}>
          Escolha a <strong>matéria</strong> e o jogo: <strong>Perguntas</strong> ou <strong>Contra o relógio</strong>. Cada um joga quando puder e quem acertar mais vence. <strong>Ninguém perde carta!</strong>
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
              <div className="pilula" style={{ alignSelf: 'flex-start', fontSize: 13 }}>{rotuloDuelo(d)}</div>
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
              <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>Desafio para <strong>{d.para_apelido}</strong>. Jogue para enviar!<span className="muted small" style={{ display: 'block' }}>{rotuloDuelo(d)}</span></span>
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
              <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>
                Você acertou <strong>{d.modo === 'relogio' ? d.acertos_de : `${d.acertos_de} de ${d.perguntas.length}`}</strong>. Agora é a vez de {d.para_apelido}.
                <span className="muted small" style={{ display: 'block' }}>{rotuloDuelo(d)}</span>
              </span>
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
                  <span className="muted small">Você {meu} × {dele} {outro} · {NOME_MODO[d.modo]}</span>
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
  const [escolha, setEscolha] = useState<Escolha | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => { void api<{ colegas: Colega[] }>('/crianca/turma').then((r) => (r.erro ? setErro(r.erro) : setColegas(r.colegas))); }, []);

  const criar = async (carta: string) => {
    if (!colega || !escolha) return;
    setOcupado(true); setErro(null);
    const r = await criarDuelo(colega.id, carta, escolha);
    setOcupado(false);
    if (r.erro) { setErro(r.erro); return; }
    aoCriar(r.duelo, carta);
  };

  if (colega && escolha) {
    return <EscolherCarta titulo={`Desafiar ${colega.apelido} · passo 3 de 3`} aoVoltar={() => { setErro(null); setEscolha(null); }} aoEscolher={(c) => void criar(c)} ocupado={ocupado} erro={erro} />;
  }
  if (colega) return <EscolherJogo colega={colega} aoVoltar={() => setColega(null)} aoEscolher={setEscolha} />;

  return (
    <main className="tela">
      <button className="voltar voltar-topo" onClick={aoVoltar}><Icone nome="voltar" tamanho={18} espessura={3} />Voltar</button>
      <div>
        <div className="eyebrow">Novo duelo · passo 1 de 3</div>
        <h1 className="display h2">Quem você quer desafiar?</h1>
      </div>
      <p className="muted small" style={{ margin: 0 }}>Depois você escolhe a matéria e o jogo.</p>
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

/** Botão de escolher uma opção (matéria, unidade ou jogo). A escolhida fica turquesa. */
function Opcao({ marcada, aoTocar, titulo, texto }: { marcada: boolean; aoTocar: () => void; titulo: string; texto?: string }) {
  return (
    <button type="button" aria-pressed={marcada} onClick={aoTocar} className="coluna"
      style={{ minHeight: 52, gap: 2, borderRadius: 16, padding: '8px 12px', textAlign: 'left', color: 'var(--ink)',
        background: marcada ? 'var(--cyan)' : 'var(--surface)', border: '3px solid var(--ink)', boxShadow: marcada ? '0 3px 0 var(--ink)' : 'none' }}>
      <span className="display" style={{ fontSize: 17 }}>{marcada ? '✓ ' : ''}{titulo}</span>
      {texto && <span className="small" style={{ fontWeight: 700 }}>{texto}</span>}
    </button>
  );
}

/** Passo 2: o que vai cair. Só aparecem as matérias e unidades que os dois já estudaram (fizeram a 1ª fase). */
function EscolherJogo({ colega, aoVoltar, aoEscolher }: { colega: Colega; aoVoltar: () => void; aoEscolher: (e: Escolha) => void }) {
  const [ids, setIds] = useState<string[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [materia, setMateria] = useState('');
  const [mundo, setMundo] = useState('');
  const [modo, setModo] = useState<ModoDuelo>('perguntas');

  useEffect(() => {
    let vivo = true;
    void (async () => {
      await sincronizar(); // o servidor precisa saber as unidades que a criança já estudou
      const r = await api<{ unidades: string[] }>(`/crianca/duelos/opcoes?para=${encodeURIComponent(colega.id)}`);
      if (!vivo) return;
      if (r.erro) setErro(r.erro); else setIds(r.unidades);
    })();
    return () => { vivo = false; };
  }, [colega.id]);

  const unidades = useMemo(() => capitulos.filter((c) => ids?.includes(c.id)).sort((a, b) => a.numero - b.numero), [ids]);
  const materias = useMemo(() => materiasDe(unidades), [unidades]);
  // Só uma matéria em comum: já vem escolhida.
  useEffect(() => { if (materias.length === 1) setMateria(materias[0]); }, [materias]);
  const daMateria = unidades.filter((u) => u.materia === materia);
  const ehMat = daMateria.some((u) => u.matematica);

  return (
    <main className="tela">
      <button className="voltar voltar-topo" onClick={aoVoltar}><Icone nome="voltar" tamanho={18} espessura={3} />Voltar</button>
      <div>
        <div className="eyebrow">Desafiar {colega.apelido} · passo 2 de 3</div>
        <h1 className="display h2">O que vai cair?</h1>
      </div>
      <Erro texto={erro} />
      {!ids && !erro && <p className="muted">Carregando…</p>}
      {ids?.length === 0 && (
        <div className="linha" style={{ alignItems: 'flex-end' }}>
          <Ara tamanho={80} humor="pensando" />
          <div className="balao small" style={{ flex: 1, marginBottom: 12 }}>
            Vocês ainda não estudaram uma mesma unidade. Para duelar, <strong>os dois</strong> precisam fazer a 1ª fase da mesma unidade.
          </div>
        </div>
      )}
      {materias.length > 0 && (
        <section className="coluna" style={{ gap: 8 }} aria-label="Matéria">
          <h2 className="display h3">Matéria</h2>
          {materias.map((m) => <Opcao key={m} marcada={materia === m} aoTocar={() => { setMateria(m); setMundo(''); }} titulo={m} />)}
        </section>
      )}
      {materia && (
        <section className="coluna" style={{ gap: 8 }} aria-label="Unidade">
          <h2 className="display h3">Unidade</h2>
          {daMateria.length > 1 && <Opcao marcada={mundo === ''} aoTocar={() => setMundo('')} titulo="Todas que vocês estudaram" />}
          {daMateria.map((u) => <Opcao key={u.id} marcada={mundo === u.id || daMateria.length === 1} aoTocar={() => setMundo(u.id)} titulo={`Unidade ${u.numero}`} texto={u.titulo} />)}
        </section>
      )}
      {materia && (
        <section className="coluna" style={{ gap: 8 }} aria-label="Jogo">
          <h2 className="display h3">Jogo</h2>
          <Opcao marcada={modo === 'perguntas'} aoTocar={() => setModo('perguntas')} titulo={NOME_MODO.perguntas} texto={`${PERGUNTAS_DUELO} perguntas. Vence quem acertar mais.`} />
          <Opcao marcada={modo === 'relogio'} aoTocar={() => setModo('relogio')} titulo={NOME_MODO.relogio}
            texto={`${tempoRelogio(daMateria)} segundos para acertar o máximo que conseguir.${ehMat ? ' Contas digitadas, com os mesmos números para os dois.' : ''}`} />
        </section>
      )}
      <div style={{ marginTop: 'auto' }}>
        {ids && ids.length === 0
          ? <button className="btn btn-escuro btn-bloco" onClick={aoVoltar}>Escolher outro colega</button>
          : <button className="btn btn-amarelo btn-bloco" disabled={!materia} onClick={() => aoEscolher({ materia, mundo, modo })}>Escolher meu Sabimon</button>}
      </div>
    </main>
  );
}

/** Revanche: o mesmo colega, a mesma matéria, unidade e jogo. A criança só escolhe o Sabimon e joga primeiro. */
function Revanche({ d, eu, aoVoltar, aoCriar }: { d: DueloApi; eu: string; aoVoltar: () => void; aoCriar: (d: DueloApi, carta: string) => void }) {
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const souDe = d.de_id === eu;
  const outro = souDe ? d.para_apelido : d.de_apelido;
  const criar = async (carta: string) => {
    setOcupado(true); setErro(null);
    const r = await criarDuelo(souDe ? d.para_id : d.de_id, carta, { materia: d.materia, mundo: d.mundo, modo: d.modo });
    setOcupado(false);
    if (r.erro) { setErro(r.erro); return; }
    aoCriar(r.duelo, carta);
  };
  return <EscolherCarta titulo={`Revanche com ${outro} · ${rotuloDuelo(d)}`} aoVoltar={aoVoltar} aoEscolher={(c) => void criar(c)} ocupado={ocupado} erro={erro} />;
}

/** Escolher o Sabimon parceiro da batalha (a carta não sai do álbum). */
function EscolherCarta({ titulo, aoVoltar, aoEscolher, ocupado = false, erro = null }: { titulo: string; aoVoltar: () => void; aoEscolher: (carta: string) => void; ocupado?: boolean; erro?: string | null }) {
  const e = useEstado();
  // As mais fortes primeiro (forma mais alta, depois a força).
  const minhas = useMemo(() => FIGURINHAS.filter((f) => e.cartas[f.id] > 0)
    .sort((a, b) => forca(b.s, b.forma, 0) - forca(a.s, a.forma, 0) || b.numero - a.numero), [e.cartas]);
  return (
    <main className="tela">
      <button className="voltar voltar-topo" onClick={aoVoltar}><Icone nome="voltar" tamanho={18} espessura={3} />Voltar</button>
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

/* ---------------- Jogar ---------------- */

function JogarDuelo({ d, eu, carta, aoSair, aoRevanche }: { d: DueloApi; eu: string; carta: string; aoSair: () => void; aoRevanche: (d: DueloApi) => void }) {
  const perguntas = useMemo(() => d.perguntas.map((id) => perguntaDuelo(id, capitulos)).filter((p): p is PerguntaDuelo => !!p), [d.perguntas]);
  const [feitas, setFeitas] = useState<unknown[] | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fim, setFim] = useState<{ d: DueloApi; acertos: number; xp: number; subiu: boolean; pacotes: number } | null>(null);
  const contra = d.de_id === eu ? d.para_apelido : d.de_apelido;

  if (perguntas.length !== d.perguntas.length) {
    return <main className="tela"><Erro texto="Esse duelo tem perguntas que não existem mais. Cancele e faça outro." /><button className="btn btn-escuro btn-bloco" onClick={aoSair}>Voltar</button></main>;
  }

  const enviar = async (rs: unknown[]) => {
    setFeitas(rs); setEnviando(true); setErro(null);
    const r = await api<{ duelo: DueloApi; acertos: number; valeXp: boolean }>(`/crianca/duelos/${d.id}/responder`, { corpo: { respostas: rs, carta } });
    setEnviando(false);
    if (r.erro) return setErro(r.erro);
    // Erros voltam na Revisão do Ará, como nas fases (contas voltam com números novos).
    const dia = hoje();
    setEstado((e) => ({ ...e, revisao: rs.reduce<typeof e.revisao>((rev, resp, k) => registrarResposta(rev, idRevisaoDuelo(perguntas[k].id), acertou(perguntas[k], resp), dia), e.revisao) }));
    let xp = 0, subiu = false, pacotes = 0;
    if (r.valeXp) {
      // XP e Sabicoins pelo que acertou. Sem pacote do dia: pacote só vem das fases (só o de nível novo, que é pelo XP).
      const res = premiar(getEstado(), perguntas[0].cap.id, xpDoDuelo(r.acertos), [], false, getEstado().feitas, new Date(), false);
      setEstado(res.estado);
      xp = res.xpGanho; subiu = res.subiuNivel; pacotes = res.pacotesGanhos.length;
    }
    setFim({ d: r.duelo, acertos: r.acertos, xp, subiu, pacotes });
  };

  if (fim) {
    const souDe = fim.d.de_id === eu;
    const respondidas = feitas?.length ?? 0;
    return (
      <main className="tela" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div className="pop"><Ara tamanho={110} humor="comemorando" /></div>
        <h1 className="display h1 titulo-premio">Você terminou!</h1>
        {d.modo === 'relogio'
          ? <div className="coluna" style={{ alignItems: 'center', gap: 2 }}>
              <div className="display" style={{ fontSize: 34 }}>{fim.acertos} {fim.acertos === 1 ? 'acerto' : 'acertos'}</div>
              <div className="muted small" style={{ fontWeight: 700 }}>{respondidas === 0 ? 'Não deu tempo de responder.' : `em ${respondidas} ${respondidas === 1 ? 'resposta' : 'respostas'}`}</div>
            </div>
          : <Placar acertos={fim.acertos} total={perguntas.length} />}
        <div className="painel coluna sobe" style={{ width: '100%', gap: 6 }}>
          {fim.xp > 0 ? (
            <div className="linha" style={{ justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span className="display" style={{ fontSize: 28, color: 'var(--t-cyan)' }}>+{fim.xp} XP</span>
              <span className="display linha" style={{ fontSize: 28, color: 'var(--t-yellow)', gap: 6 }}><Moeda tamanho={24} />+{fim.xp}</span>
            </div>
          ) : <div className="muted small">{fim.acertos === 0 ? 'Desta vez não deu XP.' : `Hoje você já ganhou o XP de ${DUELOS_COM_XP_POR_DIA} duelos. Este foi por diversão!`}</div>}
          {d.modo === 'relogio' && fim.acertos > ACERTOS_COM_XP && fim.xp > 0 && <div className="muted small">O XP conta até {ACERTOS_COM_XP} acertos. Mas todos valem para vencer!</div>}
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
            <ResultadoDuelo d={fim.d} eu={eu} aoSair={aoSair} aoRevanche={aoRevanche} embutido />
          </>
        )}
        {fim.pacotes > 0 && <button className="btn btn-escuro btn-bloco" onClick={() => ir('pacote')}>Abrir pacote</button>}
      </main>
    );
  }

  // Terminou de jogar: mandando para o servidor (ou deu erro e dá para tentar de novo).
  if (feitas) {
    return (
      <main className="tela" style={{ alignItems: 'center', textAlign: 'center' }}>
        <Ara tamanho={100} humor="pensando" />
        {enviando && <p className="display h3">Enviando suas respostas…</p>}
        <Erro texto={erro} />
        {!enviando && erro && <button className="btn btn-amarelo btn-bloco" onClick={() => void enviar(feitas)}>Tentar enviar de novo</button>}
        {!enviando && erro && <button className="btn btn-escuro btn-bloco" onClick={aoSair}>Sair</button>}
      </main>
    );
  }

  const topo = `Duelo contra ${contra} · ${rotuloDuelo(d)}`;
  return d.modo === 'relogio'
    ? <JogoRelogio perguntas={perguntas} topo={topo} aoSair={aoSair} aoTerminar={(rs) => void enviar(rs)} />
    : <JogoPerguntas perguntas={perguntas} topo={topo} aoSair={aoSair} aoTerminar={(rs) => void enviar(rs)} />;
}

/** Pergunta de escolher (ou verdadeiro ou falso). Com `naHora`, tocar na opção já responde (no relógio, para ser rápido). */
function Escolher({ p, naHora = false, rotuloProxima, aoResponder, aoProxima }: {
  p: PerguntaDuelo; naHora?: boolean; rotuloProxima: string; aoResponder: (r: number) => void; aoProxima: () => void;
}) {
  // A ordem das opções muda para cada um (a resposta vai para o servidor na ordem original).
  const ordem = useMemo(() => (p.vf ? p.opcoes.map((_, i) => i) : embaralhar(p.opcoes.map((_, i) => i))), [p]);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [resposta, setResposta] = useState<number | null>(null);
  const respondida = resposta !== null;
  const ok = resposta === p.certa;
  const responder = (r: number) => { if (respondida) return; setResposta(r); aoResponder(r); };
  return (
    <>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="coluna" disabled={respondida}>
        <legend className="sr-only">Escolha uma resposta</legend>
        {ordem.map((orig) => {
          const marcada = respondida ? resposta === orig : escolha === orig;
          const certa = respondida && orig === p.certa;
          const fundo = certa ? '#DCFCE7' : respondida && marcada ? '#FFE4E6' : marcada ? '#CFFAFE' : 'var(--surface)';
          const borda = certa ? 'var(--green)' : respondida && marcada ? 'var(--t-red)' : marcada ? 'var(--cyan)' : 'var(--line)';
          return (
            <label key={orig} className="linha" style={{ minHeight: 56, borderRadius: 16, padding: '10px 12px', cursor: respondida ? 'default' : 'pointer', fontWeight: 700, background: fundo, border: `3px solid ${borda}` }}>
              <input type="radio" name={`d-${p.id}`} checked={marcada} onChange={() => (naHora ? responder(orig) : setEscolha(orig))} style={{ position: 'absolute', opacity: 0 }} />
              <TextoMat t={p.opcoes[orig]} />
            </label>
          );
        })}
      </fieldset>
      {respondida && (
        <div className={`aviso sobe ${ok ? 'aviso-ok' : 'aviso-erro'}`} role="status"><span className="display" style={{ fontSize: 18 }}>{ok ? 'Acertou! ' : 'Ops! '}</span><TextoMat t={p.explicacao} /></div>
      )}
      <div style={{ marginTop: 'auto' }}>
        {!respondida
          ? !naHora && <button className="btn btn-amarelo btn-bloco" disabled={escolha === null} onClick={() => escolha !== null && responder(escolha)}>Confirmar</button>
          : <button className="btn btn-amarelo btn-bloco" onClick={aoProxima}>{rotuloProxima}</button>}
      </div>
    </>
  );
}

/** Jogo "Perguntas": as 10 perguntas, uma por vez, sem relógio. */
function JogoPerguntas({ perguntas, topo, aoSair, aoTerminar }: { perguntas: PerguntaDuelo[]; topo: string; aoSair: () => void; aoTerminar: (rs: unknown[]) => void }) {
  const [i, setI] = useState(0);
  const [respostas, setRespostas] = useState<unknown[]>([]);
  const p = perguntas[i];
  const ultima = i + 1 === perguntas.length;
  return (
    <main className="tela">
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <button className="voltar voltar-topo" onClick={aoSair}><Icone nome="voltar" tamanho={18} espessura={3} />Sair</button>
        <span className="pilula">{i + 1}/{perguntas.length}</span>
      </div>
      <div>
        <div className="eyebrow">{topo}</div>
        <h1 className="display h2" style={{ marginTop: 4 }}><TextoMat t={p.pergunta} /></h1>
      </div>
      <div className="barra barra-ciano" aria-hidden="true"><div style={{ width: `${(i / perguntas.length) * 100}%` }} /></div>
      <Escolher key={p.id} p={p} rotuloProxima={ultima ? 'Terminar' : 'Próxima'}
        aoResponder={(r) => setRespostas((rs) => [...rs, r])}
        aoProxima={() => (ultima ? aoTerminar(respostas) : setI(i + 1))} />
    </main>
  );
}

/**
 * Jogo "Contra o relógio" (Lucas, 06/11/2026): acertar o máximo no tempo.
 * O relógio só começa quando a criança toca em "Começar!" e para enquanto ela lê a explicação.
 * Em Matemática a resposta é digitada; nas outras matérias, tocar na opção já responde.
 */
function JogoRelogio({ perguntas, topo, aoSair, aoTerminar }: { perguntas: PerguntaDuelo[]; topo: string; aoSair: () => void; aoTerminar: (rs: unknown[]) => void }) {
  const total = tempoRelogio(perguntas.map((p) => p.cap));
  const ehMat = perguntas.some((p) => p.conta);
  const [comecou, setComecou] = useState(false);
  const [resta, setResta] = useState(total);
  const [i, setI] = useState(0);
  const [respostas, setRespostas] = useState<unknown[]>([]);
  const [lendo, setLendo] = useState(false);
  const [acabou, setAcabou] = useState<'tempo' | 'todas' | null>(null);

  useEffect(() => {
    if (!comecou || lendo || acabou) return;
    if (resta <= 0) { setAcabou('tempo'); return; }
    const t = setTimeout(() => setResta((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [comecou, lendo, acabou, resta]);

  const responder = (r: unknown) => { setRespostas((rs) => [...rs, r]); setLendo(true); };
  const proxima = () => {
    setLendo(false);
    if (resta <= 0) setAcabou('tempo');
    else if (i + 1 >= perguntas.length) setAcabou('todas');
    else setI(i + 1);
  };

  if (!comecou) {
    return (
      <main className="tela">
        <button className="voltar voltar-topo" onClick={aoSair}><Icone nome="voltar" tamanho={18} espessura={3} />Sair</button>
        <div>
          <div className="eyebrow">{topo}</div>
          <h1 className="display h1">Contra o relógio</h1>
        </div>
        <div className="linha" style={{ alignItems: 'flex-end' }}>
          <Ara tamanho={90} />
          <div className="balao" style={{ flex: 1, marginBottom: 14 }}>
            Você tem <strong>{total} segundos</strong>. Acerte o máximo que conseguir! O relógio <strong>para</strong> enquanto você lê a explicação.
            {ehMat && <> Pegue <strong>papel e lápis</strong>.</>}
          </div>
        </div>
        <div style={{ marginTop: 'auto' }}>
          <button className="btn btn-amarelo btn-bloco" onClick={() => setComecou(true)}>Começar!</button>
        </div>
      </main>
    );
  }

  if (acabou) {
    const certas = respostas.filter((r, k) => acertou(perguntas[k], r)).length;
    return (
      <main className="tela" style={{ alignItems: 'center', textAlign: 'center' }}>
        <Ara tamanho={100} humor="feliz" />
        <h1 className="display h1">{acabou === 'tempo' ? 'Acabou o tempo!' : 'Você respondeu todas!'}</h1>
        <div className="display" style={{ fontSize: 30 }}>{certas} {certas === 1 ? 'acerto' : 'acertos'}</div>
        <div style={{ marginTop: 'auto', width: '100%' }}>
          <button className="btn btn-amarelo btn-bloco" onClick={() => aoTerminar(respostas)}>Enviar e ver o resultado</button>
        </div>
      </main>
    );
  }

  const p = perguntas[i];
  const pouco = resta <= 10;
  return (
    <main className="tela">
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <button className="voltar voltar-topo" onClick={aoSair}><Icone nome="voltar" tamanho={18} espessura={3} />Sair</button>
        <span className="pilula" style={{ fontWeight: 800, color: pouco ? 'var(--t-coral)' : 'var(--ink)', borderColor: pouco ? 'var(--coral)' : undefined }}
          aria-label={`Faltam ${resta} segundos${lendo ? ', relógio parado' : ''}`}>
          ⏱ {resta} s{lendo ? ' · parado' : ''}
        </span>
      </div>
      <div className="barra barra-ciano" aria-hidden="true"><div style={{ width: `${(resta / total) * 100}%` }} /></div>
      <div className="eyebrow">{topo} · {respostas.filter((r, k) => acertou(perguntas[k], r)).length} acertos</div>
      {p.conta ? (
        <Pergunta key={p.id} conta={p.conta} rotuloProxima={resta <= 0 ? 'Ver o resultado' : 'Próxima'}
          onResposta={(_ok, _txt, valor: Resposta) => responder(valor)} onProxima={proxima} />
      ) : (
        <>
          <h1 className="display h2" style={{ marginTop: 4 }}><TextoMat t={p.pergunta} /></h1>
          <Escolher key={p.id} p={p} naHora rotuloProxima={resta <= 0 ? 'Ver o resultado' : 'Próxima'} aoResponder={responder} aoProxima={proxima} />
        </>
      )}
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

function ResultadoDuelo({ d, eu, aoSair, aoRevanche, embutido = false }: { d: DueloApi; eu: string; aoSair: () => void; aoRevanche: (d: DueloApi) => void; embutido?: boolean }) {
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
          {!terminou && passo > 0 && <>{d.modo === 'relogio' ? 'Resposta' : 'Pergunta'} {passo}: {acerteiAgora ? `${nomeCarta(eu1.carta)} deu um golpe de ${forcaDe(eu1.carta)}!` : 'Você errou.'} {eleAcertou ? `${nomeCarta(ele.carta)} também atacou!` : `${ele.nome} errou.`}</>}
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
            {d.perguntas.slice(0, r.length).map((id, k) => {
              const p = perguntaDuelo(id, caps);
              if (!p) return null;
              const meusResp = (souDe ? d.resp_de : d.resp_para) ?? [];
              const delesResp = (souDe ? d.resp_para : d.resp_de) ?? [];
              const meuOk = souDe ? certasDe[k] : certasPara[k];
              const deleOk = souDe ? certasPara[k] : certasDe[k];
              const comoFoi = (respondeu: boolean, ok: boolean) => (!respondeu ? 'não chegou' : ok ? 'acertou' : 'errou');
              return (
                <div key={id} className={`aviso ${meuOk ? 'aviso-ok' : 'aviso-erro'}`}>
                  <div className="display" style={{ fontSize: 15 }}>{k + 1}. <TextoMat t={p.pergunta} />{p.conta?.sentenca && <> <TextoMat t={p.conta.sentenca} /></>}</div>
                  <div className="small">Certa: <strong><TextoMat t={p.conta ? textoCerto(p.conta) : p.opcoes[p.certa]} /></strong></div>
                  <div className="small muted">Você {comoFoi(k < meusResp.length, !!meuOk)} · {ele.nome} {comoFoi(k < delesResp.length, !!deleOk)}</div>
                </div>
              );
            })}
          </section>
          <button className="btn btn-amarelo btn-bloco" onClick={() => aoRevanche(d)}>Revanche!</button>
          <button className="btn btn-escuro btn-bloco" onClick={aoSair}>Voltar aos duelos</button>
        </>
      )}
    </>
  );
  if (embutido) return conteudo;
  return (
    <main className="tela" style={{ alignItems: 'center', textAlign: 'center' }}>
      <div style={{ alignSelf: 'flex-start' }}><button className="voltar voltar-topo" onClick={aoSair}><Icone nome="voltar" tamanho={18} espessura={3} />Duelos</button></div>
      <h1 className="display h1">Batalha</h1>
      {conteudo}
    </main>
  );
}
