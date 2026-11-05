import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Ara } from '../components/Ara';
import { CartaView, ROTULO } from '../components/CartaView';
import { Icone } from '../components/Icone';
import { Pin } from '../components/Pin';
import { FIGURINHAS, figurinhaPorId, type Figurinha } from '../lib/figurinhas';
import { api, entrarNaConta, type SituacaoEstudo, entrarNoPerfil, ultimoCodigo, entrarNaTurma, entrarNaTurmaComConta, esquecerContaNova, sair, sincronizar, useConta, verPropostas } from '../lib/conta';
import { EscolherPerfil } from '../components/Perfis';
import { ir } from '../lib/rota';
import { paraTrocar, protegido, saldo } from '../lib/loja';
import { useEstado } from '../lib/store';
import { Chama, CORES } from './Inicio';
import { Medalha } from '../components/Medalha';
import { Moeda } from '../components/Loja';
import { conquistasDe, numerosDoPerfil } from '../lib/conquistas';
import { nivel, sequencia } from '../lib/jogo';

/** Para avisar quando a criança dá uma carta mais valiosa: a forma conta mais que a raridade. */
const valorCarta = (id: string) => { const f = figurinhaPorId.get(id); return f ? f.forma * 10 + NIVEL[f.s.raridade] : 0; };
const nomeDe = (id: string) => { const f = figurinhaPorId.get(id); return f?.s.formas[f.forma - 1].nome; };
const NIVEL = { comum: 1, rara: 2, epica: 3, lendaria: 4 } as const;
const campo: React.CSSProperties = { font: 'inherit', fontWeight: 800, fontSize: 18, padding: '14px 16px', borderRadius: 16, border: '3px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)', width: '100%' };

export function Avatar({ nome, cor, tamanho = 40 }: { nome: string; cor: string; tamanho?: number }) {
  return <span aria-hidden="true" style={{ width: tamanho, height: tamanho, flex: 'none', borderRadius: '50%', background: cor, display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontSize: tamanho * 0.45, color: 'var(--ink)', boxShadow: 'inset 0 -3px 0 #00000033, inset 0 2px 0 #FFFFFF88' }}>{nome[0]?.toUpperCase()}</span>;
}

export function Erro({ texto }: { texto: string | null }) {
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

/** `inicio`: a turma já foi achada (código digitado na tela anterior); começa no apelido. */
export function EntrarTurma({ inicio, aoEntrar }: { inicio?: { codigo: string; turma: string }; aoEntrar?: () => void } = {}) {
  const e = useEstado();
  const { conta } = useConta();
  const [passo, setPasso] = useState<'codigo' | 'apelido' | 'pin' | 'pin2'>(inicio ? 'apelido' : 'codigo');
  const [codigo, setCodigo] = useState(inicio?.codigo ?? '');
  const [turma, setTurma] = useState(inicio?.turma ?? '');
  const [apelido, setApelido] = useState(conta?.apelido ?? e.perfil?.nome ?? '');
  const [cor, setCor] = useState(e.perfil?.cor ?? CORES[0]);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  /** Criança nova neste aparelho: ainda escolhe a cor. */
  const novo = !e.perfil && !conta;

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
    if (msg) setErro(msg); else aoEntrar?.();
  };

  useEffect(() => {
    if (passo === 'pin' && pin.length === 4) setTimeout(() => setPasso('pin2'), 200);
  }, [pin, passo]);

  useEffect(() => {
    if (passo !== 'pin2' || pin2.length !== 4) return;
    if (pin2 !== pin) { setErro('Os PINs não são iguais. Vamos tentar de novo.'); setPin(''); setPin2(''); setPasso('pin'); return; }
    (async () => {
      setOcupado(true); setErro(null);
      const msg = await entrarNaTurma(codigo, apelido, cor, pin);
      setOcupado(false);
      if (msg) { setErro(msg); setPin(''); setPin2(''); setPasso(msg.includes('apelido') ? 'apelido' : 'pin'); }
      else aoEntrar?.();
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
          <p className="muted small" style={{ margin: 0 }}>Só o apelido, não o nome completo. Os colegas vão ver esse apelido no ranking e nas trocas.</p>
          {novo && <EscolherCor cor={cor} aoEscolher={setCor} />}
          <button className="btn btn-amarelo btn-bloco" disabled={apelido.trim().length < 2 || ocupado}>{conta ? (ocupado ? 'Entrando…' : 'Entrar na turma') : 'Continuar'}</button>
          {conta && <p className="muted small" style={{ margin: 0 }}>Você continua com a mesma conta, as mesmas cartas e o mesmo PIN.{conta.codigo && conta.codigo !== codigo ? ` Você sai da turma ${conta.turma}.` : ''}</p>}
          {!conta && (
            <div className="aviso small" style={{ fontWeight: 700 }}>
              Já joga em outra turma? Não crie outra conta: ela começa sem cartas. Volte, digite o código da turma antiga, entre com seu PIN
              e, em "Minha conta", toque em "Mudar de turma". Suas cartas vão junto.
            </div>
          )}
        </form>
      )}
      {passo === 'pin' && <Pin valor={pin} onChange={setPin} rotulo="Crie um PIN de 4 números" />}
      {passo === 'pin2' && <Pin valor={pin2} onChange={setPin2} rotulo={ocupado ? 'Entrando…' : 'Digite o PIN de novo'} />}
    </div>
  );
}

export function EscolherCor({ cor, aoEscolher }: { cor: string; aoEscolher: (c: string) => void }) {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="muted small" style={{ marginBottom: 8, marginInline: 'auto' }}>Escolha sua cor</legend>
      <div className="linha" style={{ justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
        {CORES.map((c) => (
          <button key={c} type="button" aria-label={`Cor ${c}`} aria-pressed={cor === c} onClick={() => aoEscolher(c)}
            style={{ width: 44, height: 44, borderRadius: '50%', border: 0, background: c, boxShadow: cor === c ? '0 0 0 3px var(--bg), 0 0 0 6px var(--ink)' : 'inset 0 -3px 0 #00000033' }} />
        ))}
      </div>
    </fieldset>
  );
}

/* ---------------- Entrar com um código (turma ou família) ---------------- */
interface Pessoa { id?: string; apelido: string; cor: string }

/**
 * A criança digita um código só: o da turma (o professor passa) ou o da família (um adulto da casa passa).
 * Depois toca no próprio nome e digita o PIN. Na turma, quem é novo cria apelido, cor e PIN.
 */
export function EntrarConta({ aoTerminar, aoVoltar }: { aoTerminar: () => void; aoVoltar: () => void }) {
  const [passo, setPasso] = useState<'codigo' | 'quem' | 'pin' | 'novo'>('codigo');
  const [codigo, setCodigo] = useState(ultimoCodigo);
  const [turma, setTurma] = useState('');
  const [familia, setFamilia] = useState(false);
  const [alunos, setAlunos] = useState<Pessoa[]>([]);
  const [eu, setEu] = useState<Pessoa | null>(null);
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [semCodigo, setSemCodigo] = useState(false);

  const buscar = async () => {
    setOcupado(true); setErro(null);
    const r = await api<{ nome: string; codigo: string; familia?: boolean; alunos: Pessoa[] }>('/turma/alunos', { corpo: { codigo }, tokenProprio: null });
    setOcupado(false);
    if (r.erro) return setErro(r.erro);
    setTurma(r.nome); setCodigo(r.codigo); setFamilia(!!r.familia); setAlunos(r.alunos);
    if (r.familia && !r.alunos.length) return setErro('Essa família ainda não tem nenhum perfil. Peça para o adulto criar o seu na área dos adultos.');
    // Turma sem ninguém ainda: a criança é a primeira, vai direto criar o apelido.
    setPasso(!r.familia && !r.alunos.length ? 'novo' : 'quem');
  };

  useEffect(() => {
    if (pin.length !== 4 || !eu) return;
    (async () => {
      setOcupado(true); setErro(null);
      const msg = familia && eu.id ? await entrarNoPerfil(eu.id, pin) : await entrarNaConta(codigo, eu.apelido, pin);
      setOcupado(false);
      if (msg) { setErro(msg); setPin(''); return; }
      aoTerminar();
    })();
  }, [pin]); // eslint-disable-line react-hooks/exhaustive-deps

  const voltar = () => {
    setErro(null); setPin('');
    if (passo === 'pin') setPasso('quem');
    else if (passo === 'novo' && alunos.length) setPasso('quem');
    else if (passo !== 'codigo') setPasso('codigo');
    else aoVoltar();
  };
  const titulo = passo === 'codigo' ? 'Qual é o seu código?' : passo === 'quem' ? 'Quem é você?' : passo === 'novo' ? 'Sou novo na turma' : '';

  return (
    <main className="tela">
      <button className="voltar" onClick={voltar}><Icone nome="voltar" tamanho={18} espessura={3} />Voltar</button>
      {titulo && <h1 className="display h1">{titulo}</h1>}
      {passo !== 'novo' && <Erro texto={erro} />}
      {passo === 'codigo' && (
        <>
          <form className="coluna" onSubmit={(ev) => { ev.preventDefault(); void buscar(); }}>
            <label htmlFor="c-codigo" className="muted" style={{ fontWeight: 700 }}>
              É o código da sua <strong>turma</strong> (o professor passa) ou da sua <strong>família</strong> (um adulto da sua casa passa).
            </label>
            <input id="c-codigo" value={codigo} onChange={(ev) => setCodigo(ev.target.value.toUpperCase())} placeholder="Ex.: ARARA-4821"
              autoComplete="off" autoCapitalize="characters" spellCheck={false}
              style={{ ...campo, fontSize: 24, padding: '16px', textAlign: 'center', letterSpacing: '.08em', fontFamily: 'var(--display)' }} />
            {ultimoCodigo() && codigo === ultimoCodigo() && <p className="muted small" style={{ margin: 0 }}>Este aparelho lembrou o seu último código.</p>}
            <button className="btn btn-amarelo btn-bloco" disabled={codigo.trim().length < 5 || ocupado}>{ocupado ? 'Procurando…' : 'Continuar'}</button>
          </form>
          {semCodigo ? <SemCodigo /> : (
            <button type="button" className="btn btn-escuro btn-bloco" onClick={() => setSemCodigo(true)}>Ainda não tenho código</button>
          )}
        </>
      )}
      {passo === 'quem' && (
        <div className="coluna">
          <div className="aviso aviso-ok">{familia ? 'Achei a sua família!' : <>Turma: <strong>{turma}</strong></>}</div>
          <h2 className="display h3" style={{ margin: 0 }}>Toque no seu nome.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {alunos.map((a) => (
              <button key={a.id ?? a.apelido} className="painel linha" onClick={() => { setEu(a); setPin(''); setErro(null); setPasso('pin'); }}
                style={{ gap: 10, padding: '10px 12px', font: 'inherit', fontWeight: 800, fontSize: 17, color: 'var(--ink)', textAlign: 'left', cursor: 'pointer', minHeight: 56 }}>
                <Avatar nome={a.apelido} cor={a.cor} tamanho={36} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.apelido}</span>
              </button>
            ))}
          </div>
          {!familia && <button className="btn btn-ciano btn-bloco" onClick={() => { setErro(null); setPasso('novo'); }}>Sou novo na turma</button>}
          {familia && <p className="muted small" style={{ margin: 0 }}>Seu nome não está aqui? Peça para o adulto criar o seu perfil.</p>}
          <p className="muted small" style={{ margin: 0 }}>Se este aparelho já tinha um jogo, ele vai ser trocado pelo da sua conta.</p>
        </div>
      )}
      {passo === 'pin' && eu && (
        <>
          <div className="linha" style={{ justifyContent: 'center', gap: 10 }}>
            <Avatar nome={eu.apelido} cor={eu.cor} tamanho={44} />
            <span className="display h3">Oi, {eu.apelido}!</span>
          </div>
          <Pin valor={pin} onChange={setPin} rotulo={ocupado ? 'Entrando…' : 'Digite seu PIN'} />
          <button className="voltar" style={{ alignSelf: 'center' }} onClick={voltar}>Não sou eu</button>
          <p className="muted small" style={{ textAlign: 'center' }}>Esqueceu o PIN? Peça para {familia ? 'o adulto da sua casa' : 'o adulto da turma'} criar um novo.</p>
        </>
      )}
      {passo === 'novo' && <EntrarTurma inicio={{ codigo, turma }} aoEntrar={aoTerminar} />}
    </main>
  );
}

/** "Ainda não tenho código": a criança manda um recado pronto para um adulto (pelo WhatsApp, por exemplo). */
function SemCodigo() {
  const [feito, setFeito] = useState<'enviado' | 'copiado' | null>(null);
  const link = `${location.origin}/#/adulto`;
  const recado = `Oi! Quero estudar no Sabidex. Você pode criar a conta da nossa família e me passar o código? É só abrir: ${link}`;
  const enviar = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: 'Sabidex', text: recado }); setFeito('enviado'); return; }
    } catch (e) { if ((e as Error).name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(recado); setFeito('copiado'); } catch { setFeito(null); }
  };
  return (
    <div className="painel coluna" style={{ gap: 10 }}>
      <div className="linha" style={{ alignItems: 'flex-end' }}>
        <Ara tamanho={70} humor="pensando" />
        <div className="balao" style={{ flex: 1, marginBottom: 10 }}>Sem problema! Um adulto da sua casa cria a <strong>conta da família</strong> e te passa o código.</div>
      </div>
      <button type="button" className="btn btn-amarelo btn-bloco" onClick={() => void enviar()}>Mandar recado para um adulto</button>
      {feito === 'copiado' && <div className="aviso aviso-ok" role="status">Recado copiado! Cole no WhatsApp do adulto.</div>}
      {feito === 'enviado' && <div className="aviso aviso-ok" role="status">Recado enviado! Quando o adulto te passar o código, digite aqui em cima.</div>}
      <p className="muted small" style={{ margin: 0 }}>Na escola, quem passa o código da turma é o professor.</p>
    </div>
  );
}

/* ---------------- Sem turma, sem jogo (Lucas, 05/11/2026) ---------------- */
/**
 * Cada turma estuda o livro dela. Sem turma (ou com uma turma que ainda não tem matérias)
 * a criança não vê jogos: aparece este aviso. `tela` = ocupa a tela toda (quando abriu um mundo ou uma fase).
 */
export function PrecisaTurma({ situacao, tela = false }: { situacao: SituacaoEstudo; tela?: boolean }) {
  const { conta } = useConta();
  const [entrando, setEntrando] = useState(false);
  if (situacao === 'ok') return null;
  const conteudo = situacao === 'sem-materias' ? (
    <div className="painel-destaque coluna" style={{ gap: 10, borderColor: 'var(--cyan)' }}>
      {tela ? (
        <div className="linha" style={{ alignItems: 'flex-end' }}>
          <div style={{ flex: 'none' }}><Ara tamanho={76} humor="pensando" /></div>
          <div className="balao" style={{ flex: 1, marginBottom: 12 }}>As matérias da turma <strong>{conta?.turma}</strong> ainda estão chegando. Quando ficarem prontas, os jogos aparecem aqui!</div>
        </div>
      ) : <span className="display" style={{ fontSize: 20 }}>As matérias da turma {conta?.turma} ainda estão chegando</span>}
      <p className="muted small" style={{ margin: 0 }}>Enquanto isso, você pode ver seu álbum. Entrou na turma errada? Toque em "Mudar de turma" no seu perfil.</p>
      <button className="btn btn-escuro btn-bloco" onClick={() => ir('conta')}>Meu perfil</button>
    </div>
  ) : (
    <div className="painel-destaque coluna chamar" style={{ gap: 10, borderColor: 'var(--yellow)' }}>
      {tela ? (
        <div className="linha" style={{ alignItems: 'flex-end' }}>
          <div style={{ flex: 'none' }}><Ara tamanho={76} /></div>
          <div className="balao" style={{ flex: 1, marginBottom: 12 }}>Para jogar, entre na sua <strong>turma da escola</strong>. Assim você estuda as matérias do <strong>seu</strong> livro!</div>
        </div>
      ) : <span className="display" style={{ fontSize: 20 }}>Entre na sua turma da escola para jogar</span>}
      {entrando ? <EntrarTurma aoEntrar={() => setEntrando(false)} /> : (
        <>
          <button className="btn btn-amarelo btn-bloco" onClick={() => setEntrando(true)}>Entrar na minha turma</button>
          {!conta && <button className="btn btn-escuro btn-bloco" onClick={() => ir('entrar')}>Já tenho conta em outro aparelho</button>}
        </>
      )}
      <p className="muted small" style={{ margin: 0 }}>O código da turma, o professor passa. {conta?.familia ? 'Um adulto da sua casa também pode pedir a turma na área dos adultos.' : 'Peça para um adulto.'}</p>
    </div>
  );
  if (!tela) return conteudo;
  return (
    <main className="tela">
      <div>
        <div className="eyebrow">Jogos</div>
        <h1 className="display h1">{situacao === 'sem-turma' ? 'Falta entrar na turma' : 'Já, já tem jogo!'}</h1>
      </div>
      {conteudo}
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
            {['Você precisa do código da turma, que o professor ou um adulto passa.', 'Só aparece seu apelido, nunca o nome completo.', 'A conversa da turma só funciona se um adulto deixar.'].map((t) => (
              <div key={t} className="linha" style={{ gap: 10, fontWeight: 700 }}><span style={{ color: 'var(--t-cyan)' }}><Icone nome="escudo" tamanho={20} /></span>{t}</div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

/* ---------------- Ranking ---------------- */
interface Participante { id: string; apelido: string; cor: string; xp: number; cartas: number; vitorias?: number; online?: number }

/** Guarda o último placar e a lista de colegas: ao voltar para a tela, aparecem na hora e atualizam sozinhos. */
let rankingGuardado: { codigo: string; dados: { eu: string; participantes: Participante[] } } | null = null;
let colegasGuardados: { codigo: string; colegas: Colega[] } | null = null;

/** Bolinha verde no avatar de quem está estudando agora. */
function AvatarOnline({ nome, cor, tamanho, online }: { nome: string; cor: string; tamanho?: number; online?: number | boolean }) {
  return <span style={{ position: 'relative', display: 'inline-flex' }}><Avatar nome={nome} cor={cor} tamanho={tamanho} />{!!online && <span className="colega-online" aria-hidden="true" />}</span>;
}

export function Ranking() {
  const { conta, contaNova: contaNovaR } = useConta();
  const e = useEstado();
  const [aba, setAba] = useState<'xp' | 'cartas' | 'vitorias'>('xp');
  const codigo = conta?.codigo ?? '';
  const [dados, setDados] = useState<{ eu: string; participantes: Participante[] } | null>(rankingGuardado?.codigo === codigo ? rankingGuardado.dados : null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!codigo) return;
    let vivo = true;
    const buscar = async () => {
      const r = await api<{ eu: string; participantes: Participante[] }>('/crianca/ranking');
      if (!vivo) return;
      if (r.erro) { if (!rankingGuardado) setErro(r.erro); } else { rankingGuardado = { codigo, dados: r }; setDados(r); setErro(null); }
    };
    // Mostra o placar logo; depois de mandar o progresso novo para o servidor, atualiza de novo.
    void buscar();
    void sincronizar().then(() => buscar());
    return () => { vivo = false; };
  }, [codigo, e.xp]); // eslint-disable-line react-hooks/exhaustive-deps

  if (contaNovaR) return <ContaCriada />;
  if (!conta?.codigo) return <SemTurma titulo="Quem estudou mais?" texto={<>Entre na sua <strong>turma</strong> para ver o placar da semana com os colegas!</>} />;

  const num = (p: Participante) => (aba === 'xp' ? p.xp : aba === 'cartas' ? p.cartas : p.vitorias ?? 0);
  const lista = (dados?.participantes ?? []).slice().sort((a, b) => num(b) - num(a) || a.apelido.localeCompare(b.apelido));
  const unidade = (n: number) => (aba === 'xp' ? `${n} XP` : aba === 'cartas' ? `${n} ${n === 1 ? 'carta' : 'cartas'}` : `${n} ${n === 1 ? 'vitória' : 'vitórias'}`);
  const valor = (p: Participante) => unidade(num(p));
  const meuIdx = lista.findIndex((p) => p.id === dados?.eu);
  const frente = meuIdx > 0 ? lista[meuIdx - 1] : null;
  const falta = frente && meuIdx >= 0 ? num(frente) - num(lista[meuIdx]) + 1 : 0;
  const ouro = [['linear-gradient(180deg,#FDE68A 0%,#FACC15 45%,#EAB308 100%)', '#CA8A04', '#FACC15'], ['linear-gradient(180deg,#F1F5F9,#94A3B8)', '#64748B', '#CBD5E1'], ['linear-gradient(180deg,#FDBA74,#EA580C)', '#C2410C', '#FB923C']];

  return (
    <main className="tela">
      <div>
        <div className="eyebrow">{conta.turma}</div>
        <h1 className="display h1">Ranking da semana</h1>
      </div>
      <div className="linha" role="tablist" style={{ gap: 8 }}>
        {(['xp', 'cartas', 'vitorias'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={aba === k} onClick={() => setAba(k)} className={`btn ${aba === k ? 'btn-rosa' : 'btn-escuro'}`} style={{ flex: 1, fontSize: 16, minHeight: 46, padding: '6px 8px' }}>{{ xp: 'Mais XP', cartas: 'Mais cartas', vitorias: 'Duelos' }[k]}</button>
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
                <AvatarOnline nome={p.apelido} cor={p.cor} tamanho={i === 0 ? 58 : 48} online={p.online} />
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
              <AvatarOnline nome={p.apelido} cor={p.cor} tamanho={34} online={p.online} />
              <span style={{ flex: 1, fontWeight: 900 }}>{eu ? 'Você' : p.apelido}{!!p.online && <span className="muted small" style={{ display: 'block', fontWeight: 700 }}>Estudando agora</span>}</span>
              <span style={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{valor(p)}</span>
            </li>
          );
        })}
      </ol>
      {frente && falta > 1 && <div className="painel" style={{ borderColor: 'var(--pink)', padding: 12, fontWeight: 700 }}>Faltam <strong>{unidade(falta)}</strong> para você passar {frente.apelido}!</div>}
      {frente && falta === 1 && <div className="painel" style={{ borderColor: 'var(--pink)', padding: 12, fontWeight: 700 }}>Você está <strong>empatado</strong> com {frente.apelido}. {aba === 'xp' ? 'Jogue uma fase' : aba === 'cartas' ? 'Ganhe mais uma carta' : 'Vença mais um duelo'} e passe na frente!</div>}
      {meuIdx === 0 && lista.length > 1 && <div className="painel" style={{ borderColor: 'var(--yellow)', padding: 12, fontWeight: 700 }}>Você está em <strong>1º lugar</strong>! Continue estudando para não perder.</div>}
      <p className="muted small" style={{ textAlign: 'center', margin: 0 }}>{aba === 'vitorias' ? 'Vitórias no Duelo do Saber nesta semana. ' : ''}O placar da semana zera toda segunda-feira.{lista.some((p) => p.online) ? ' A bolinha verde mostra quem está estudando agora.' : ''}</p>
    </main>
  );
}

/* ---------------- Trocas ---------------- */
interface TrocaApi { id: string; de_id: string; para_id: string; carta_dar: string; carta_receber: string; status: string; de_apelido: string; de_cor: string; para_apelido: string; para_cor: string; resolvido: number | null }
interface Colega { id: string; apelido: string; cor: string; cartas: number; online?: number }

function Mini({ id }: { id: string }) {
  const f = figurinhaPorId.get(id);
  return f ? <div style={{ width: 88 }}><CartaView carta={f.s} forma={f.forma} /></div> : null;
}

export function Trocas() {
  const { conta, contaNova: contaNovaT, desafiosNovos } = useConta();
  const e = useEstado();
  const [modo, setModo] = useState<'lista' | 'nova'>('lista');
  const [dados, setDados] = useState<{ eu: string; trocas: TrocaApi[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const codigo = conta?.codigo ?? '';
  const [colegas, setColegas] = useState<Colega[] | null>(colegasGuardados?.codigo === codigo ? colegasGuardados.colegas : null);

  const carregar = async () => {
    // Trocas e colegas ao mesmo tempo (um não espera o outro).
    void api<{ colegas: Colega[] }>('/crianca/turma').then((r) => { if (!r.erro) { colegasGuardados = { codigo, colegas: r.colegas }; setColegas(r.colegas); } });
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
        <h1 className="display h1">Minha turma</h1>
      </div>
      <button className="btn btn-amarelo btn-bloco" onClick={() => { setAviso(null); setModo('nova'); }}>Propor uma troca</button>
      <button className="btn btn-rosa btn-bloco" onClick={() => ir('duelos')} style={{ position: 'relative' }}>
        Duelo do Saber
        {desafiosNovos > 0 && <span className="badge" aria-label={`${desafiosNovos} ${desafiosNovos > 1 ? 'desafios' : 'desafio'} para você`}>{desafiosNovos}</span>}
      </button>
      <button className="btn btn-escuro btn-bloco" onClick={() => ir('chat')}>Conversa da turma</button>
      {aviso && <div className="aviso aviso-ok pop" role="status">{aviso}</div>}
      <Erro texto={erro} />
      {colegas && <EstudandoAgora colegas={colegas} />}

      <section className="coluna" aria-label="Propostas para você">
        <h2 className="display h3">Propostas de troca {recebidas.length > 0 && <span className="pilula" style={{ marginLeft: 6, borderColor: 'var(--pink)' }}>{recebidas.length}</span>}</h2>
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
              {paraTrocar(e, t.carta_receber) < 1 && <div className="aviso aviso-erro">Seu {nomeDe(t.carta_receber)} tem itens da lojinha e fica com você. Só dá para trocar uma cópia repetida.</div>}
              {valorCarta(t.carta_receber) > valorCarta(t.carta_dar) && <div className="aviso" style={{ background: '#FEF3C7', border: '1.5px solid var(--yellow)' }}>Pense bem: você dá uma carta <strong>mais valiosa</strong> do que recebe.</div>}
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

/** Quem da turma está com o app aberto agora (some quando o professor ou o responsável desligam). */
function EstudandoAgora({ colegas }: { colegas: Colega[] }) {
  const online = colegas.filter((c) => c.online);
  if (colegas.length === 0) return null;
  return (
    <section className="painel coluna" aria-label="Estudando agora" style={{ padding: 12, gap: 8 }}>
      <h2 className="display h3" style={{ margin: 0 }}>Estudando agora {online.length > 0 && <span className="pilula" style={{ marginLeft: 6, borderColor: 'var(--green)' }}>{online.length}</span>}</h2>
      {online.length === 0
        ? <p className="muted small" style={{ margin: 0 }}>Nenhum colega agora. Que tal chamar alguém para um duelo?</p>
        : <div className="linha" style={{ flexWrap: 'wrap', gap: 10 }}>
            {online.map((c) => <span key={c.id} className="linha" style={{ gap: 6 }}><AvatarOnline nome={c.apelido} cor={c.cor} tamanho={30} online /><span className="small" style={{ fontWeight: 800 }}>{c.apelido}</span></span>)}
          </div>}
    </section>
  );
}

function NovaTroca({ aoTerminar }: { aoTerminar: (msg: string | null) => void }) {
  const e = useEstado();
  const [colegas, setColegas] = useState<Colega[] | null>(null);
  const [colega, setColega] = useState<Colega | null>(null);
  const [cartasDele, setCartasDele] = useState<Record<string, number> | null>(null);
  const [quero, setQuero] = useState<Figurinha | null>(null);
  const [dou, setDou] = useState<Figurinha | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => { void api<{ colegas: Colega[] }>('/crianca/turma').then((r) => r.erro ? setErro(r.erro) : setColegas(r.colegas)); }, []);
  useEffect(() => {
    if (!colega) return;
    setCartasDele(null);
    void api<{ cartas: Record<string, number> }>(`/crianca/colega/${colega.id}`).then((r) => r.erro ? setErro(r.erro) : setCartasDele(r.cartas));
  }, [colega]);

  const minhas = useMemo(() => FIGURINHAS.filter((c) => paraTrocar(e, c.id) > 0).sort((a, b) => (paraTrocar(e, b.id) - paraTrocar(e, a.id))), [e]);
  const dele = useMemo(() => FIGURINHAS.filter((c) => (cartasDele?.[c.id] ?? 0) > 0).sort((a, b) => Number(e.cartas[a.id] > 0) - Number(e.cartas[b.id] > 0)), [cartasDele, e.cartas]);

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
              <AvatarOnline nome={c.apelido} cor={c.cor} online={c.online} />
              <span style={{ flex: 1 }}><span className="display" style={{ fontSize: 18, display: 'block' }}>{c.apelido}</span><span className="muted small">{c.online ? 'Estudando agora · ' : ''}{c.cartas} {c.cartas === 1 ? 'carta diferente' : 'cartas diferentes'}</span></span>
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
                <CartaView carta={c.s} forma={c.forma} quantidade={cartasDele?.[c.id]} onClick={() => setQuero(c)} />
                {!(e.cartas[c.id] > 0) && <span style={{ position: 'absolute', top: -6, right: -4, background: 'var(--yellow)', color: 'var(--ink)', fontSize: 10, fontWeight: 900, borderRadius: 999, padding: '2px 6px' }}>NOVA</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {passo === 3 && (
        <>
          {minhas.length === 0 && <div className="balao">Você ainda não tem cartas para dar. Jogue as fases para ganhar pacotes!</div>}
          <p className="muted small" style={{ margin: 0 }}>Cartas com itens da lojinha ficam com você. Só as cópias repetidas delas aparecem aqui.</p>
          <p className="muted small" style={{ margin: 0 }}>As repetidas aparecem primeiro.</p>
          <div className="grade-3">
            {minhas.map((c) => <CartaView key={c.id} carta={c.s} forma={c.forma} quantidade={paraTrocar(e, c.id)} onClick={() => setDou(c)} />)}
          </div>
        </>
      )}

      {passo === 4 && quero && dou && (
        <div className="coluna" style={{ alignItems: 'center' }}>
          <div className="linha" style={{ justifyContent: 'center', gap: 10 }}>
            <div className="coluna" style={{ alignItems: 'center', gap: 4 }}><span className="muted small">Você dá</span><div style={{ width: 120 }}><CartaView carta={dou.s} forma={dou.forma} /></div></div>
            <span style={{ color: 'var(--t-pink)' }}><Icone nome="trocas" /></span>
            <div className="coluna" style={{ alignItems: 'center', gap: 4 }}><span className="muted small">Você ganha</span><div style={{ width: 120 }}><CartaView carta={quero.s} forma={quero.forma} /></div></div>
          </div>
          {e.cartas[dou.id] === 1 && !protegido(e, dou.id) && <div className="aviso" style={{ background: '#FEF3C7', border: '1.5px solid var(--yellow)', width: '100%' }}>Atenção: é a sua <strong>única</strong> {dou.s.formas[dou.forma - 1].nome}. Se {colega?.apelido} aceitar, ela sai do seu álbum.</div>}
          {(e.cartas[dou.id] > 1 || protegido(e, dou.id)) && <div className="aviso aviso-ok" style={{ width: '100%' }}>Boa! Você vai dar uma carta <strong>repetida</strong>.</div>}
          <p className="muted small" style={{ margin: 0, textAlign: 'center' }}>{ROTULO[dou.s.raridade]} por {ROTULO[quero.s.raridade]}. {colega?.apelido} pode aceitar ou recusar.</p>
          <button className="btn btn-amarelo btn-bloco" disabled={ocupado} onClick={() => void enviar()}>{ocupado ? 'Enviando…' : 'Enviar proposta'}</button>
        </div>
      )}
    </main>
  );
}

/* ---------------- Meu perfil (antes "Minha conta") ---------------- */
// Lucas (05/11/2026): a criança quer ver ela mesma (nível, números, conquistas), não o código da turma.
// O código e o apelido para entrar em outro aparelho ficam guardados lá embaixo, num "abrir e fechar".

function Numero({ valor, rotulo, icone }: { valor: ReactNode; rotulo: string; icone?: ReactNode }) {
  return (
    <div className="painel coluna" style={{ padding: '12px 14px', gap: 2 }}>
      <span className="linha" style={{ gap: 6 }}>{icone}<span className="display" style={{ fontSize: 24, fontVariantNumeric: 'tabular-nums' }}>{valor}</span></span>
      <span className="muted small" style={{ fontWeight: 700 }}>{rotulo}</span>
    </div>
  );
}

export function MinhaConta() {
  const { conta, perfis } = useConta();
  const e = useEstado();
  const [confirmar, setConfirmar] = useState(false);
  const [mudar, setMudar] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [vendo, setVendo] = useState<string | null>(null);
  const outros = perfis.filter((p) => p.id !== conta?.id);
  const nv = nivel(e.xp);
  const n = useMemo(() => numerosDoPerfil(e), [e]);
  const conquistas = useMemo(() => conquistasDe(e), [e]);
  const ganhas = conquistas.filter((c) => c.ganhou).length;
  const aberta = conquistas.find((c) => c.id === vendo);
  const dias = sequencia(e.dias);
  const sairAgora = async () => {
    setErro(null);
    const msg = await sair();
    if (msg) setErro(msg); else ir();
  };
  return (
    <main className="tela">
      <button className="voltar" onClick={() => ir()}><Icone nome="voltar" tamanho={18} espessura={3} />Início</button>

      <div className="painel-destaque coluna" style={{ alignItems: 'center', textAlign: 'center', gap: 8 }}>
        <Avatar nome={e.perfil?.nome ?? '?'} cor={e.perfil?.cor ?? CORES[0]} tamanho={84} />
        <h1 className="display h1" style={{ margin: 0 }}>{e.perfil?.nome}</h1>
        <span className="pilula" style={{ fontSize: 17 }}>Nível {nv.nivel}</span>
        <div className="barra barra-ciano" style={{ width: '100%' }} role="progressbar" aria-valuenow={nv.noNivel} aria-valuemax={nv.total} aria-label="XP do nível"><div style={{ width: `${(nv.noNivel / nv.total) * 100}%` }} /></div>
        <span className="muted small" style={{ fontWeight: 700 }}>Faltam {nv.total - nv.noNivel} XP para o nível {nv.nivel + 1}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Numero valor={e.xp} rotulo="XP no total" />
        <Numero valor={saldo(e)} rotulo="Sabicoins" icone={<Moeda tamanho={22} />} />
        <Numero valor={dias} rotulo={n.maiorSequencia > dias ? `dias seguidos · recorde ${n.maiorSequencia}` : 'dias seguidos'} icone={<Chama tamanho={22} />} />
        <Numero valor={`${n.figurinhas}/${FIGURINHAS.length}`} rotulo="figurinhas no álbum" />
        <Numero valor={n.estrelas} rotulo="estrelas nos mundos" />
        <Numero valor={n.mundos} rotulo={n.mundos === 1 ? 'mundo completo' : 'mundos completos'} />
      </div>

      <section className="coluna" aria-label="Minhas conquistas">
        <div className="linha" style={{ justifyContent: 'space-between' }}>
          <h2 className="display h2" style={{ margin: 0 }}>Minhas conquistas</h2>
          <span className="pilula">{ganhas} de {conquistas.length}</span>
        </div>
        {aberta && (
          <div className="painel linha" style={{ gap: 12 }} role="status">
            <Medalha desenho={aberta.desenho} cor={aberta.cor} ganhou={aberta.ganhou} tamanho={56} />
            <span className="coluna" style={{ flex: 1, gap: 4 }}>
              <span className="display" style={{ fontSize: 19 }}>{aberta.titulo}</span>
              <span className="small" style={{ fontWeight: 700 }}>{aberta.ganhou ? 'Você conseguiu! ' : ''}{aberta.como}</span>
              {!aberta.ganhou && aberta.alvo > 1 && (
                <>
                  <div className="barra barra-amarela"><div style={{ width: `${(aberta.tem / aberta.alvo) * 100}%` }} /></div>
                  <span className="muted small">{aberta.tem} de {aberta.alvo}</span>
                </>
              )}
            </span>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: 12 }}>
          {conquistas.map((c) => (
            <button key={c.id} type="button" onClick={() => setVendo(vendo === c.id ? null : c.id)} aria-pressed={vendo === c.id}
              aria-label={`${c.titulo}: ${c.ganhou ? 'conseguiu' : `${c.tem} de ${c.alvo}`}`}
              className="coluna" style={{ alignItems: 'center', gap: 6, border: 0, background: 'none', padding: 4, font: 'inherit', color: 'inherit', cursor: 'pointer', minHeight: 44 }}>
              <Medalha desenho={c.desenho} cor={c.cor} ganhou={c.ganhou} />
              <span className="small" style={{ fontWeight: 800, textAlign: 'center', lineHeight: 1.15, color: c.ganhou ? 'var(--ink)' : 'var(--muted)' }}>{c.titulo}</span>
              {!c.ganhou && c.alvo > 1 && <span className="muted small" style={{ fontSize: 12 }}>{c.tem}/{c.alvo}</span>}
            </button>
          ))}
        </div>
        <p className="muted small" style={{ margin: 0 }}>Toque numa conquista para ver como ganhar.</p>
      </section>

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
        <section className="coluna" aria-label="Minha turma">
          <h2 className="display h3" style={{ margin: '8px 0 0' }}>Minha turma</h2>
          {aviso && <div className="aviso aviso-ok" role="status">{aviso}</div>}
          {conta.codigo ? (mudar ? (
            <div className="painel coluna" style={{ gap: 10 }}>
              <div className="linha" style={{ alignItems: 'flex-end' }}>
                <Ara tamanho={60} />
                <div className="balao" style={{ flex: 1, marginBottom: 8 }}>Digite o código da turma nova. Você leva <strong>todas as suas cartas</strong>, o XP e as Sabicoins.</div>
              </div>
              <EntrarTurma aoEntrar={() => { setMudar(false); setAviso('Pronto! Você mudou de turma com todas as suas cartas.'); }} />
              <button className="btn btn-escuro btn-bloco" onClick={() => setMudar(false)}>Cancelar</button>
            </div>
          ) : (
            <div className="painel linha" style={{ gap: 10 }}>
              <span style={{ flex: 1, fontWeight: 800 }}>{conta.turma}</span>
              <button className="btn btn-escuro" style={{ minHeight: 40, fontSize: 15, padding: '0 12px' }} onClick={() => { setAviso(null); setMudar(true); }}>Mudar de turma</button>
            </div>
          )) : (
            <>
              <div className="painel coluna" style={{ gap: 4 }}>
                <div style={{ fontWeight: 800 }}>Você ainda não está numa turma.</div>
                <div className="muted small">Suas cartas estão guardadas na conta da família.</div>
              </div>
              <button className="btn btn-amarelo btn-bloco" onClick={() => ir('trocas')}>Entrar na minha turma</button>
            </>
          )}
          <details className="painel">
            <summary style={{ fontWeight: 800, cursor: 'pointer', minHeight: 28 }}>Como entrar em outro aparelho</summary>
            <div className="coluna" style={{ gap: 4, marginTop: 8 }}>
              {conta.codigo ? (
                <>
                  <div className="display" style={{ fontSize: 19 }}>Código: {conta.codigo}</div>
                  <div className="display" style={{ fontSize: 19 }}>Apelido: {conta.apelido}</div>
                  <div className="muted small">e o seu PIN secreto.{conta.familia ? ' Ou use o código da família, que o adulto da sua casa tem.' : ''} Não conte seu PIN para os colegas!</div>
                </>
              ) : <div className="muted small">Toque em "Sou criança" e digite o código da família. O adulto da sua casa tem esse código.</div>}
            </div>
          </details>
          {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
          {!confirmar
            ? <button className="btn btn-escuro btn-bloco" onClick={() => setConfirmar(true)}>Sair da conta neste aparelho</button>
            : (
              <div className="aviso aviso-erro coluna">
                <div>Seu progresso continua salvo na conta. Este aparelho fica limpo até alguém entrar de novo. Quer mesmo sair?</div>
                <div className="linha"><button className="btn btn-escuro" style={{ flex: 1 }} onClick={() => setConfirmar(false)}>Não</button><button className="btn btn-vermelho" style={{ flex: 1 }} onClick={() => void sairAgora()}>Sair</button></div>
              </div>
            )}
        </section>
      )}
      {outros.length > 0 && <div className="painel"><EscolherPerfil perfis={outros} titulo="Trocar de perfil" aoEntrar={() => ir()} /></div>}
    </main>
  );
}
