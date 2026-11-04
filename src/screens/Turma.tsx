import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Ara } from '../components/Ara';
import { CartaView, ROTULO } from '../components/CartaView';
import { Icone } from '../components/Icone';
import { Pin } from '../components/Pin';
import { sabimonPorId, sabimons } from '../data';
import type { Sabimon } from '../data/tipos';
import { api, entrarNaConta, entrarNaTurma, entrarNaTurmaComConta, esquecerContaNova, sair, sincronizar, useConta, verPropostas } from '../lib/conta';
import { EscolherPerfil } from '../components/Perfis';
import { ir } from '../lib/rota';
import { paraTrocar, protegido } from '../lib/loja';
import { useEstado } from '../lib/store';
import { CORES } from './Inicio';

const cartaPorId = sabimonPorId;
const nomeDe = (id: string) => cartaPorId.get(id)?.formas[0].nome;
const NIVEL = { comum: 1, rara: 2, epica: 3, lendaria: 4 } as const;
const campo: React.CSSProperties = { font: 'inherit', fontWeight: 800, fontSize: 18, padding: '14px 16px', borderRadius: 16, border: '3px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)', width: '100%' };

function Avatar({ nome, cor, tamanho = 40 }: { nome: string; cor: string; tamanho?: number }) {
  return <span aria-hidden="true" style={{ width: tamanho, height: tamanho, flex: 'none', borderRadius: '50%', background: cor, display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontSize: tamanho * 0.45, color: 'var(--ink)', boxShadow: 'inset 0 -3px 0 #00000033, inset 0 2px 0 #FFFFFF88' }}>{nome[0]?.toUpperCase()}</span>;
}

function Erro({ texto }: { texto: string | null }) {
  return texto ? <div className="aviso aviso-erro" role="alert">{texto}</div> : null;
}

/* ---------------- Entrar numa turma pela primeira vez ---------------- */
export function ContaCriada() {
  const { contaNova } = useConta();
  if (!contaNova) return null;
  return (
    <main className="tela" style={{ alignItems: 'center', textAlign: 'center' }}>
      <div className="pop"><Ara tamanho={110} /></div>
      <h1 className="display h2" style={{ color: 'var(--t-yellow)' }}>Você entrou na turma!</h1>
      <div className="painel" style={{ width: '100%' }}>
        <div className="muted small">Para entrar em outro celular você vai precisar de:</div>
        <div className="display" style={{ fontSize: 20, marginTop: 6 }}>Código: {contaNova.codigo}</div>
        <div className="display" style={{ fontSize: 20 }}>Apelido: {contaNova.apelido}</div>
        <div className="display" style={{ fontSize: 20 }}>PIN: {contaNova.pin}</div>
        <div className="muted small" style={{ marginTop: 6 }}>Mostre para um adulto anotar. Não conte seu PIN para os colegas!</div>
      </div>
      <button className="btn btn-amarelo btn-bloco" onClick={esquecerContaNova}>Continuar</button>
    </main>
  );
}

export function EntrarTurma() {
  const e = useEstado();
  const { conta } = useConta();
  const [passo, setPasso] = useState<'codigo' | 'apelido' | 'pin' | 'pin2'>('codigo');
  const [codigo, setCodigo] = useState('');
  const [turma, setTurma] = useState('');
  const [apelido, setApelido] = useState(conta?.apelido ?? e.perfil?.nome ?? '');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const conferirCodigo = async () => {
    setOcupado(true); setErro(null);
    const r = await api<{ nome: string; codigo: string }>('/turma/info', { corpo: { codigo }, tokenProprio: null });
    setOcupado(false);
    if (r.erro) return setErro(r.erro);
    setTurma(r.nome); setCodigo(r.codigo); setPasso('apelido');
  };

  const entrarComConta = async () => {
    setOcupado(true); setErro(null);
    const msg = await entrarNaTurmaComConta(codigo, apelido);
    setOcupado(false);
    if (msg) setErro(msg);
  };

  useEffect(() => {
    if (passo === 'pin' && pin.length === 4) setTimeout(() => setPasso('pin2'), 200);
  }, [pin, passo]);

  useEffect(() => {
    if (passo !== 'pin2' || pin2.length !== 4) return;
    if (pin2 !== pin) { setErro('Os PINs não são iguais. Vamos tentar de novo.'); setPin(''); setPin2(''); setPasso('pin'); return; }
    (async () => {
      setOcupado(true); setErro(null);
      const msg = await entrarNaTurma(codigo, apelido, e.perfil?.cor ?? CORES[0], pin);
      setOcupado(false);
      if (msg) { setErro(msg); setPin(''); setPin2(''); setPasso(msg.includes('apelido') ? 'apelido' : 'pin'); }
    })();
  }, [pin2]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="coluna">
      <Erro texto={erro} />
      {passo === 'codigo' && (
        <form className="coluna" onSubmit={(ev) => { ev.preventDefault(); void conferirCodigo(); }}>
          <label htmlFor="codigo-turma" className="display h3">Qual é o código da sua turma?</label>
          <input id="codigo-turma" value={codigo} onChange={(ev) => setCodigo(ev.target.value.toUpperCase())} placeholder="Ex.: ARARA-4821" autoComplete="off" autoCapitalize="characters" style={{ ...campo, textAlign: 'center', letterSpacing: '.06em' }} />
          <p className="muted small" style={{ margin: 0 }}>Quem passa o código é o professor ou um adulto da sua casa.</p>
          <button className="btn btn-amarelo btn-bloco" disabled={codigo.trim().length < 5 || ocupado}>{ocupado ? 'Procurando…' : 'Continuar'}</button>
        </form>
      )}
      {passo === 'apelido' && (
        <form className="coluna" onSubmit={(ev) => { ev.preventDefault(); if (apelido.trim().length >= 2) { setErro(null); if (conta) void entrarComConta(); else setPasso('pin'); } }}>
          <div className="aviso aviso-ok">Turma encontrada: <strong>{turma}</strong></div>
          <label htmlFor="apelido-turma" className="display h3">Seu apelido na turma</label>
          <input id="apelido-turma" value={apelido} maxLength={14} onChange={(ev) => setApelido(ev.target.value)} autoComplete="off" style={{ ...campo, textAlign: 'center' }} />
          <p className="muted small" style={{ margin: 0 }}>Os colegas vão ver esse apelido no ranking e nas trocas.</p>
          <button className="btn btn-amarelo btn-bloco" disabled={apelido.trim().length < 2 || ocupado}>{conta ? (ocupado ? 'Entrando…' : 'Entrar na turma') : 'Continuar'}</button>
          {conta && <p className="muted small" style={{ margin: 0 }}>Você continua com a mesma conta, as mesmas cartas e o mesmo PIN.</p>}
        </form>
      )}
      {passo === 'pin' && <Pin valor={pin} onChange={setPin} rotulo="Crie um PIN de 4 números" />}
      {passo === 'pin2' && <Pin valor={pin2} onChange={setPin2} rotulo={ocupado ? 'Entrando…' : 'Digite o PIN de novo'} />}
    </div>
  );
}

/* ---------------- Entrar na conta (outro aparelho) ---------------- */
export function EntrarConta({ aoTerminar, aoVoltar }: { aoTerminar: () => void; aoVoltar: () => void }) {
  const [codigo, setCodigo] = useState('');
  const [apelido, setApelido] = useState('');
  const [pin, setPin] = useState('');
  const [verPin, setVerPin] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (pin.length !== 4) return;
    (async () => {
      setOcupado(true); setErro(null);
      const msg = await entrarNaConta(codigo, apelido, pin);
      setOcupado(false);
      if (msg) { setErro(msg); setPin(''); return; }
      aoTerminar();
    })();
  }, [pin]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="tela">
      <button className="voltar" onClick={aoVoltar}><Icone nome="voltar" tamanho={18} espessura={3} />Voltar</button>
      <h1 className="display h1">Entrar na minha conta</h1>
      <Erro texto={erro} />
      {!verPin ? (
        <form className="coluna" onSubmit={(ev) => { ev.preventDefault(); setVerPin(true); }}>
          <label htmlFor="c-codigo" className="display h3">Código da turma</label>
          <input id="c-codigo" value={codigo} onChange={(ev) => setCodigo(ev.target.value.toUpperCase())} placeholder="Ex.: ARARA-4821" autoComplete="off" style={{ ...campo, textAlign: 'center' }} />
          <label htmlFor="c-apelido" className="display h3">Seu apelido</label>
          <input id="c-apelido" value={apelido} maxLength={14} onChange={(ev) => setApelido(ev.target.value)} autoComplete="off" style={{ ...campo, textAlign: 'center' }} />
          <p className="muted small" style={{ margin: 0 }}>O progresso deste aparelho vai ser trocado pelo da sua conta.</p>
          <button className="btn btn-amarelo btn-bloco" disabled={codigo.length < 5 || apelido.trim().length < 2}>Continuar</button>
        </form>
      ) : (
        <>
          <Pin valor={pin} onChange={setPin} rotulo={ocupado ? 'Entrando…' : 'Digite seu PIN'} />
          <button className="voltar" style={{ alignSelf: 'center' }} onClick={() => { setVerPin(false); setPin(''); }}>Mudar código ou apelido</button>
          <p className="muted small" style={{ textAlign: 'center' }}>Esqueceu o PIN? Peça para o adulto da turma criar um novo.</p>
        </>
      )}
    </main>
  );
}

/* ---------------- Quando ainda não tem turma ---------------- */
function SemTurma({ titulo, texto }: { titulo: string; texto: ReactNode }) {
  const [entrando, setEntrando] = useState(false);
  const { conta } = useConta();
  return (
    <main className="tela">
      <div>
        <div className="eyebrow">Turma</div>
        <h1 className="display h1">{titulo}</h1>
      </div>
      {entrando ? <EntrarTurma /> : (
        <>
          <div className="linha" style={{ alignItems: 'flex-end' }}>
            <Ara tamanho={90} />
            <div className="balao" style={{ flex: 1, marginBottom: 14 }}>{texto}</div>
          </div>
          <button className="btn btn-amarelo btn-bloco" onClick={() => setEntrando(true)}>Entrar na minha turma</button>
          {!conta && <button className="btn btn-escuro btn-bloco" onClick={() => ir('entrar')}>Já tenho conta em outro aparelho</button>}
          <div className="painel coluna" style={{ gap: 10 }}>
            {['Você precisa do código da turma, que o professor ou um adulto passa.', 'Só aparece seu apelido, nunca o nome completo.', 'Não tem chat: só propostas de troca de cartas.'].map((t) => (
              <div key={t} className="linha" style={{ gap: 10, fontWeight: 700 }}><span style={{ color: 'var(--t-cyan)' }}><Icone nome="escudo" tamanho={20} /></span>{t}</div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

/* ---------------- Ranking ---------------- */
interface Participante { id: string; apelido: string; cor: string; xp: number; cartas: number }

export function Ranking() {
  const { conta, contaNova: contaNovaR } = useConta();
  const e = useEstado();
  const [aba, setAba] = useState<'xp' | 'cartas'>('xp');
  const [dados, setDados] = useState<{ eu: string; participantes: Participante[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!conta?.codigo) return;
    (async () => {
      await sincronizar();
      const r = await api<{ eu: string; participantes: Participante[] }>('/crianca/ranking');
      if (r.erro) setErro(r.erro); else { setDados(r); setErro(null); }
    })();
  }, [conta?.codigo, e.xp]); // eslint-disable-line react-hooks/exhaustive-deps

  if (contaNovaR) return <ContaCriada />;
  if (!conta?.codigo) return <SemTurma titulo="Quem estudou mais?" texto={<>Entre na sua <strong>turma</strong> para ver o placar da semana com os colegas!</>} />;

  const lista = (dados?.participantes ?? []).slice().sort((a, b) => (aba === 'xp' ? b.xp - a.xp : b.cartas - a.cartas) || a.apelido.localeCompare(b.apelido));
  const valor = (p: Participante) => aba === 'xp' ? `${p.xp} XP` : `${p.cartas} ${p.cartas === 1 ? 'carta' : 'cartas'}`;
  const meuIdx = lista.findIndex((p) => p.id === dados?.eu);
  const frente = meuIdx > 0 ? lista[meuIdx - 1] : null;
  const falta = frente && meuIdx >= 0 ? (aba === 'xp' ? frente.xp - lista[meuIdx].xp + 1 : frente.cartas - lista[meuIdx].cartas + 1) : 0;
  const ouro = [['linear-gradient(180deg,#FDE68A 0%,#FACC15 45%,#EAB308 100%)', '#CA8A04', '#FACC15'], ['linear-gradient(180deg,#F1F5F9,#94A3B8)', '#64748B', '#CBD5E1'], ['linear-gradient(180deg,#FDBA74,#EA580C)', '#C2410C', '#FB923C']];

  return (
    <main className="tela">
      <div>
        <div className="eyebrow">{conta.turma}</div>
        <h1 className="display h1">Ranking da semana</h1>
      </div>
      <div className="linha" role="tablist" style={{ gap: 8 }}>
        {(['xp', 'cartas'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={aba === k} onClick={() => setAba(k)} className={`btn ${aba === k ? 'btn-rosa' : 'btn-escuro'}`} style={{ flex: 1, fontSize: 17, minHeight: 46 }}>{k === 'xp' ? 'Mais XP' : 'Mais cartas'}</button>
        ))}
      </div>
      <Erro texto={erro} />
      {!dados && !erro && <p className="muted">Carregando…</p>}
      {dados && lista.length < 2 && <div className="balao">Por enquanto só você está na turma. Chame os colegas!</div>}
      {lista.length >= 2 && (
        <div className="grade-3" style={{ alignItems: 'end' }}>
          {[1, 0, 2].filter((i) => lista[i]).map((i) => {
            const p = lista[i];
            return (
              <div key={p.id} className="coluna" style={{ alignItems: 'center', gap: 6 }}>
                <Avatar nome={p.apelido} cor={p.cor} tamanho={i === 0 ? 58 : 48} />
                <div className="display" style={{ fontSize: 15, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.id === dados?.eu ? 'Você' : p.apelido}</div>
                <div style={{ alignSelf: 'stretch', height: [120, 92, 76][i], borderRadius: '18px 18px 8px 8px', background: ouro[i][0], boxShadow: `inset 0 -5px 0 ${ouro[i][1]}, inset 0 2px 0 #FFFFFF99`, color: 'var(--ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="display" style={{ fontSize: 30, lineHeight: 1 }}>{i + 1}º</div>
                  <div style={{ fontSize: 12, fontWeight: 900 }}>{valor(p)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ol start={4} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        {lista.slice(lista.length >= 2 ? 3 : 0).map((p, j) => {
          const eu = p.id === dados?.eu;
          return (
            <li key={p.id} className="linha" style={{ minHeight: 52, padding: '6px 12px', borderRadius: 16, background: eu ? '#CFFAFE' : 'var(--surface)', boxShadow: `inset 0 0 0 1.5px ${eu ? 'var(--cyan)' : 'var(--line)'}` }}>
              <span className="display" style={{ width: 26, color: 'var(--muted)' }}>{j + (lista.length >= 2 ? 4 : 1)}</span>
              <Avatar nome={p.apelido} cor={p.cor} tamanho={34} />
              <span style={{ flex: 1, fontWeight: 900 }}>{eu ? 'Você' : p.apelido}</span>
              <span style={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{valor(p)}</span>
            </li>
          );
        })}
      </ol>
      {frente && falta > 1 && <div className="painel" style={{ borderColor: 'var(--pink)', padding: 12, fontWeight: 700 }}>Faltam <strong>{aba === 'xp' ? `${falta} XP` : `${falta} ${falta === 1 ? 'carta' : 'cartas'}`}</strong> para você passar {frente.apelido}!</div>}
      {frente && falta === 1 && <div className="painel" style={{ borderColor: 'var(--pink)', padding: 12, fontWeight: 700 }}>Você está <strong>empatado</strong> com {frente.apelido}. {aba === 'xp' ? 'Jogue uma fase' : 'Ganhe mais uma carta'} e passe na frente!</div>}
      {meuIdx === 0 && lista.length > 1 && <div className="painel" style={{ borderColor: 'var(--yellow)', padding: 12, fontWeight: 700 }}>Você está em <strong>1º lugar</strong>! Continue estudando para não perder.</div>}
      <p className="muted small" style={{ textAlign: 'center', margin: 0 }}>O XP da semana zera toda segunda-feira.</p>
    </main>
  );
}

/* ---------------- Trocas ---------------- */
interface TrocaApi { id: string; de_id: string; para_id: string; carta_dar: string; carta_receber: string; status: string; de_apelido: string; de_cor: string; para_apelido: string; para_cor: string; resolvido: number | null }
interface Colega { id: string; apelido: string; cor: string; cartas: number }

function Mini({ id }: { id: string }) {
  const c = cartaPorId.get(id);
  return c ? <div style={{ width: 88 }}><CartaView carta={c} /></div> : null;
}

export function Trocas() {
  const { conta, contaNova: contaNovaT } = useConta();
  const e = useEstado();
  const [modo, setModo] = useState<'lista' | 'nova'>('lista');
  const [dados, setDados] = useState<{ eu: string; trocas: TrocaApi[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const carregar = async () => {
    const r = await api<{ eu: string; trocas: TrocaApi[] }>('/crianca/trocas');
    if (r.erro) setErro(r.erro); else { setDados(r); setErro(null); }
    void verPropostas();
  };
  useEffect(() => {
    if (!conta?.codigo || modo !== 'lista') return;
    void carregar();
    const t = setInterval(() => void carregar(), 20_000);
    return () => clearInterval(t);
  }, [conta?.codigo, modo]); // eslint-disable-line react-hooks/exhaustive-deps

  if (contaNovaT) return <ContaCriada />;
  if (!conta?.codigo) {
    const repetidas = Object.values(e.cartas).reduce((s, n) => s + Math.max(0, n - 1), 0);
    return <SemTurma titulo="Troque com os amigos" texto={<>Entre na sua <strong>turma</strong> para trocar cartas. Você já tem <strong>{repetidas}</strong> {repetidas === 1 ? 'carta repetida' : 'cartas repetidas'}!</>} />;
  }
  if (modo === 'nova') return <NovaTroca aoTerminar={(msg) => { setModo('lista'); setAviso(msg); }} />;

  const agir = async (t: TrocaApi, acao: 'aceitar' | 'recusar' | 'cancelar') => {
    setOcupado(t.id + acao); setAviso(null);
    const r = await api(`/crianca/trocas/${t.id}/${acao}`, { corpo: {} });
    setOcupado(null);
    if (r.erro) setErro(r.erro);
    else {
      setErro(null);
      if (acao === 'aceitar') setAviso(`Troca feita! A carta ${nomeDe(t.carta_dar)} já está no seu álbum.`);
      await sincronizar();
    }
    await carregar();
  };

  const eu = dados?.eu;
  const recebidas = (dados?.trocas ?? []).filter((t) => t.para_id === eu && t.status === 'pendente');
  const enviadas = (dados?.trocas ?? []).filter((t) => t.de_id === eu && t.status === 'pendente');
  const historico = (dados?.trocas ?? []).filter((t) => t.status !== 'pendente').slice(0, 8);
  const STATUS: Record<string, string> = { aceita: 'Troca feita', recusada: 'Recusada', cancelada: 'Cancelada', invalida: 'Não deu mais' };

  return (
    <main className="tela">
      <div>
        <div className="eyebrow">{conta.turma}</div>
        <h1 className="display h1">Trocas</h1>
      </div>
      <button className="btn btn-amarelo btn-bloco" onClick={() => { setAviso(null); setModo('nova'); }}>Propor uma troca</button>
      {aviso && <div className="aviso aviso-ok pop" role="status">{aviso}</div>}
      <Erro texto={erro} />

      <section className="coluna" aria-label="Propostas para você">
        <h2 className="display h3">Propostas para você {recebidas.length > 0 && <span className="pilula" style={{ marginLeft: 6, borderColor: 'var(--pink)' }}>{recebidas.length}</span>}</h2>
        {dados && recebidas.length === 0 && <p className="muted small" style={{ margin: 0 }}>Nenhuma agora.</p>}
        {recebidas.map((t) => {
          const minhas = e.cartas[t.carta_receber] ?? 0;
          return (
            <article key={t.id} className="painel-destaque coluna" style={{ gap: 10 }}>
              <div className="linha" style={{ gap: 8 }}><Avatar nome={t.de_apelido} cor={t.de_cor} tamanho={32} /><span style={{ fontWeight: 800 }}><span className="display">{t.de_apelido}</span> quer trocar</span></div>
              <div className="linha" style={{ justifyContent: 'center', gap: 10 }}>
                <div className="coluna" style={{ alignItems: 'center', gap: 4 }}><span className="muted small">Você ganha</span><Mini id={t.carta_dar} /></div>
                <span style={{ color: 'var(--t-pink)' }}><Icone nome="trocas" /></span>
                <div className="coluna" style={{ alignItems: 'center', gap: 4 }}><span className="muted small">Você dá</span><Mini id={t.carta_receber} /></div>
              </div>
              {minhas === 1 && !protegido(e, t.carta_receber) && <div className="aviso" style={{ background: '#FEF3C7', border: '1.5px solid var(--yellow)' }}>Atenção: é a sua <strong>única</strong> {nomeDe(t.carta_receber)}. Ela vai sair do seu álbum.</div>}
              {paraTrocar(e, t.carta_receber) < 1 && <div className="aviso aviso-erro">Seu {nomeDe(t.carta_receber)} tem evolução ou itens e fica com você. Só dá para trocar uma cópia repetida.</div>}
              {NIVEL[cartaPorId.get(t.carta_receber)?.raridade ?? 'comum'] > NIVEL[cartaPorId.get(t.carta_dar)?.raridade ?? 'comum'] && <div className="aviso" style={{ background: '#FEF3C7', border: '1.5px solid var(--yellow)' }}>Pense bem: você dá uma carta <strong>mais rara</strong> do que recebe.</div>}
              {!(e.cartas[t.carta_dar] > 0) && <div className="aviso aviso-ok">Essa carta é <strong>nova</strong> para você!</div>}
              <div className="linha" style={{ gap: 10 }}>
                <button className="btn btn-escuro" style={{ flex: 1 }} disabled={!!ocupado} onClick={() => void agir(t, 'recusar')}>Recusar</button>
                <button className="btn btn-amarelo" style={{ flex: 1.4 }} disabled={!!ocupado} onClick={() => void agir(t, 'aceitar')}>{ocupado === t.id + 'aceitar' ? 'Trocando…' : 'Aceitar'}</button>
              </div>
            </article>
          );
        })}
      </section>

      {enviadas.length > 0 && (
        <section className="coluna" aria-label="Suas propostas">
          <h2 className="display h3">Esperando resposta</h2>
          {enviadas.map((t) => (
            <div key={t.id} className="painel linha" style={{ padding: 12 }}>
              <Avatar nome={t.para_apelido} cor={t.para_cor} tamanho={32} />
              <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>Você ofereceu <strong>{nomeDe(t.carta_dar)}</strong> para {t.para_apelido} por <strong>{nomeDe(t.carta_receber)}</strong></span>
              <button className="btn btn-escuro" style={{ minHeight: 40, fontSize: 15, padding: '6px 12px' }} disabled={!!ocupado} onClick={() => void agir(t, 'cancelar')}>Cancelar</button>
            </div>
          ))}
        </section>
      )}

      {historico.length > 0 && (
        <section className="coluna" aria-label="Últimas trocas" style={{ gap: 6 }}>
          <h2 className="display h3">Últimos dias</h2>
          {historico.map((t) => {
            const fui = t.de_id === eu;
            return (
              <div key={t.id} className="small" style={{ fontWeight: 700, color: 'var(--muted)' }}>
                <span style={{ color: t.status === 'aceita' ? 'var(--t-green)' : 'var(--muted)' }}>{STATUS[t.status] ?? t.status}</span> · {fui ? `com ${t.para_apelido}` : `com ${t.de_apelido}`}: {nomeDe(fui ? t.carta_dar : t.carta_receber)} por {nomeDe(fui ? t.carta_receber : t.carta_dar)}
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}

function NovaTroca({ aoTerminar }: { aoTerminar: (msg: string | null) => void }) {
  const e = useEstado();
  const [colegas, setColegas] = useState<Colega[] | null>(null);
  const [colega, setColega] = useState<Colega | null>(null);
  const [cartasDele, setCartasDele] = useState<Record<string, number> | null>(null);
  const [quero, setQuero] = useState<Sabimon | null>(null);
  const [dou, setDou] = useState<Sabimon | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => { void api<{ colegas: Colega[] }>('/crianca/turma').then((r) => r.erro ? setErro(r.erro) : setColegas(r.colegas)); }, []);
  useEffect(() => {
    if (!colega) return;
    setCartasDele(null);
    void api<{ cartas: Record<string, number> }>(`/crianca/colega/${colega.id}`).then((r) => r.erro ? setErro(r.erro) : setCartasDele(r.cartas));
  }, [colega]);

  const minhas = useMemo(() => sabimons.filter((c) => paraTrocar(e, c.id) > 0).sort((a, b) => (paraTrocar(e, b.id) - paraTrocar(e, a.id))), [e]);
  const dele = useMemo(() => sabimons.filter((c) => (cartasDele?.[c.id] ?? 0) > 0).sort((a, b) => Number(e.cartas[a.id] > 0) - Number(e.cartas[b.id] > 0)), [cartasDele, e.cartas]);

  const enviar = async () => {
    if (!colega || !quero || !dou) return;
    setOcupado(true); setErro(null);
    await sincronizar();
    const r = await api('/crianca/trocas', { corpo: { para: colega.id, dar: dou.id, receber: quero.id } });
    setOcupado(false);
    if (r.erro) return setErro(r.erro);
    aoTerminar(`Proposta enviada para ${colega.apelido}! Quando aceitar, a carta aparece no seu álbum.`);
  };

  const voltar = () => { setErro(null); if (dou) setDou(null); else if (quero) setQuero(null); else if (colega) setColega(null); else aoTerminar(null); };
  const passo = !colega ? 1 : !quero ? 2 : !dou ? 3 : 4;

  return (
    <main className="tela">
      <button className="voltar" onClick={voltar}><Icone nome="voltar" tamanho={18} espessura={3} />Voltar</button>
      <div>
        <div className="eyebrow">Nova troca · passo {passo} de 4</div>
        <h1 className="display h2">{['Com quem você quer trocar?', `O que você quer de ${colega?.apelido}?`, 'O que você vai dar?', 'Confira a troca'][passo - 1]}</h1>
      </div>
      <Erro texto={erro} />

      {passo === 1 && (
        <div className="coluna" style={{ gap: 8 }}>
          {!colegas && !erro && <p className="muted">Carregando…</p>}
          {colegas?.length === 0 && <div className="balao">Ainda não tem colegas na turma. Chame seus amigos!</div>}
          {colegas?.map((c) => (
            <button key={c.id} className="linha" onClick={() => setColega(c)} style={{ minHeight: 60, borderRadius: 16, padding: '8px 12px', background: 'var(--surface)', border: '3px solid var(--ink)', textAlign: 'left' }}>
              <Avatar nome={c.apelido} cor={c.cor} />
              <span style={{ flex: 1 }}><span className="display" style={{ fontSize: 18, display: 'block' }}>{c.apelido}</span><span className="muted small">{c.cartas} {c.cartas === 1 ? 'carta diferente' : 'cartas diferentes'}</span></span>
              <Icone nome="seguir" />
            </button>
          ))}
        </div>
      )}

      {passo === 2 && (
        <>
          {!cartasDele && !erro && <p className="muted">Abrindo o álbum de {colega?.apelido}…</p>}
          {cartasDele && dele.length === 0 && <div className="balao">{colega?.apelido} ainda não tem cartas.</div>}
          <div className="grade-3">
            {dele.map((c) => (
              <div key={c.id} style={{ position: 'relative' }}>
                <CartaView carta={c} quantidade={cartasDele?.[c.id]} onClick={() => setQuero(c)} />
                {!(e.cartas[c.id] > 0) && <span style={{ position: 'absolute', top: -6, right: -4, background: 'var(--yellow)', color: 'var(--ink)', fontSize: 10, fontWeight: 900, borderRadius: 999, padding: '2px 6px' }}>NOVA</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {passo === 3 && (
        <>
          {minhas.length === 0 && <div className="balao">Você ainda não tem cartas para dar. Jogue as fases para ganhar pacotes!</div>}
          <p className="muted small" style={{ margin: 0 }}>Sabimons evoluídos ou com itens ficam com você. Só as cópias repetidas deles aparecem aqui.</p>
          <p className="muted small" style={{ margin: 0 }}>As repetidas aparecem primeiro.</p>
          <div className="grade-3">
            {minhas.map((c) => <CartaView key={c.id} carta={c} quantidade={paraTrocar(e, c.id)} onClick={() => setDou(c)} />)}
          </div>
        </>
      )}

      {passo === 4 && quero && dou && (
        <div className="coluna" style={{ alignItems: 'center' }}>
          <div className="linha" style={{ justifyContent: 'center', gap: 10 }}>
            <div className="coluna" style={{ alignItems: 'center', gap: 4 }}><span className="muted small">Você dá</span><div style={{ width: 120 }}><CartaView carta={dou} /></div></div>
            <span style={{ color: 'var(--t-pink)' }}><Icone nome="trocas" /></span>
            <div className="coluna" style={{ alignItems: 'center', gap: 4 }}><span className="muted small">Você ganha</span><div style={{ width: 120 }}><CartaView carta={quero} /></div></div>
          </div>
          {e.cartas[dou.id] === 1 && !protegido(e, dou.id) && <div className="aviso" style={{ background: '#FEF3C7', border: '1.5px solid var(--yellow)', width: '100%' }}>Atenção: é a sua <strong>única</strong> {dou.formas[0].nome}. Se {colega?.apelido} aceitar, ela sai do seu álbum.</div>}
          {(e.cartas[dou.id] > 1 || protegido(e, dou.id)) && <div className="aviso aviso-ok" style={{ width: '100%' }}>Boa! Você vai dar uma carta <strong>repetida</strong>.</div>}
          <p className="muted small" style={{ margin: 0, textAlign: 'center' }}>{ROTULO[dou.raridade]} por {ROTULO[quero.raridade]}. {colega?.apelido} pode aceitar ou recusar.</p>
          <button className="btn btn-amarelo btn-bloco" disabled={ocupado} onClick={() => void enviar()}>{ocupado ? 'Enviando…' : 'Enviar proposta'}</button>
        </div>
      )}
    </main>
  );
}

/* ---------------- Minha conta ---------------- */
export function MinhaConta() {
  const { conta, perfis } = useConta();
  const e = useEstado();
  const [confirmar, setConfirmar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const outros = perfis.filter((p) => p.id !== conta?.id);
  const sub = conta ? (conta.codigo ? `Turma ${conta.turma}` : 'Conta da família') : 'Salvo só neste aparelho';
  const sairAgora = async () => {
    setErro(null);
    const msg = await sair();
    if (msg) setErro(msg); else ir();
  };
  return (
    <main className="tela">
      <button className="voltar" onClick={() => ir()}><Icone nome="voltar" tamanho={18} espessura={3} />Início</button>
      <h1 className="display h1">Minha conta</h1>
      <div className="painel linha">
        <Avatar nome={e.perfil?.nome ?? '?'} cor={e.perfil?.cor ?? CORES[0]} tamanho={56} />
        <div><div className="display" style={{ fontSize: 22 }}>{e.perfil?.nome}</div><div className="muted small">{sub}</div></div>
      </div>
      {!conta && (
        <>
          <div className="linha" style={{ alignItems: 'flex-end' }}>
            <Ara tamanho={80} />
            <div className="balao" style={{ flex: 1, marginBottom: 14 }}>Suas cartas estão guardadas <strong>só neste aparelho</strong>. Se ele quebrar, elas somem! Peça para um adulto da sua casa criar a <strong>conta da família</strong>.</div>
          </div>
          <button className="btn btn-amarelo btn-bloco" onClick={() => ir('adulto')}>Chamar um adulto</button>
          <button className="btn btn-escuro btn-bloco" onClick={() => ir('trocas')}>Entrar na minha turma</button>
          <button className="btn btn-escuro btn-bloco" onClick={() => ir('entrar')}>Já tenho conta na turma</button>
        </>
      )}
      {conta && (
        <>
          {conta.codigo ? (
            <div className="painel coluna" style={{ gap: 4 }}>
              <div className="muted small">Para entrar em outro aparelho:</div>
              <div className="display" style={{ fontSize: 19 }}>Código: {conta.codigo}</div>
              <div className="display" style={{ fontSize: 19 }}>Apelido: {conta.apelido}</div>
              <div className="muted small">e o seu PIN secreto.{conta.familia ? ' Ou peça para o adulto da sua família abrir seu perfil.' : ''}</div>
            </div>
          ) : (
            <>
              <div className="painel coluna" style={{ gap: 4 }}>
                <div style={{ fontWeight: 800 }}>Suas cartas estão guardadas na conta da família.</div>
                <div className="muted small">Em outro aparelho, peça para o adulto entrar na conta da família e abrir seu perfil.</div>
              </div>
              <button className="btn btn-amarelo btn-bloco" onClick={() => ir('trocas')}>Entrar na minha turma</button>
            </>
          )}
          {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
          {!confirmar
            ? <button className="btn btn-escuro btn-bloco" onClick={() => setConfirmar(true)}>Sair da conta neste aparelho</button>
            : (
              <div className="aviso aviso-erro coluna">
                <div>Seu progresso continua salvo na conta. Este aparelho fica limpo até alguém entrar de novo. Quer mesmo sair?</div>
                <div className="linha"><button className="btn btn-escuro" style={{ flex: 1 }} onClick={() => setConfirmar(false)}>Não</button><button className="btn btn-vermelho" style={{ flex: 1 }} onClick={() => void sairAgora()}>Sair</button></div>
              </div>
            )}
        </>
      )}
      {outros.length > 0 && <div className="painel"><EscolherPerfil perfis={outros} titulo="Trocar de perfil" aoEntrar={() => ir()} /></div>}
    </main>
  );
}
