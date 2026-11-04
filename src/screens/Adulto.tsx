// Área dos adultos: conta da família (perfis dos filhos), turmas e apagar a conta.
import { useEffect, useState } from 'react';
import { Icone } from '../components/Icone';
import { Bolinha } from '../components/Perfis';
import { api, esquecerContas, getConta, usarPerfilDoAdulto } from '../lib/conta';
import { ir } from '../lib/rota';
import { getEstado, progressoDe, temProgressoSolto } from '../lib/store';
import { CORES } from './Inicio';

const K = 'sabidex:adulto';
const lerToken = () => { try { return localStorage.getItem(K); } catch { return null; } };
const tirarToken = () => { try { localStorage.removeItem(K); } catch { /* */ } };
const campo: React.CSSProperties = { font: 'inherit', fontWeight: 700, fontSize: 17, padding: '13px 14px', borderRadius: 14, border: '1.5px solid var(--line-2)', background: 'var(--surface)', color: 'var(--ink)', width: '100%' };
const rotulo: React.CSSProperties = { fontWeight: 800 };
const botaoPequeno: React.CSSProperties = { flex: 1, minHeight: 40, fontSize: 15 };

interface Turma { id: string; nome: string; codigo: string; criancas: number; dono: string }
interface Kid { id: string; apelido: string; cor: string; xp: number | null; xp_semana: number; cartas: number; visto: number; bloqueado_ate: number; familia: number }
interface Filho { id: string; apelido: string; cor: string; xp: number | null; cartas: number; visto: number; bloqueado_ate: number; turma: string | null; codigo: string | null }

function quando(ms: number) {
  const d = Math.floor((Date.now() - ms) / 86_400_000);
  return d <= 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} dias`;
}

/** Pergunta que uma criança de 9 anos não responde de cabeça, antes da área dos adultos (pedido das lojas para apps infantis). */
let portaoAberto = false;
function Portao({ aoPassar }: { aoPassar: () => void }) {
  const [conta] = useState(() => { const a = 6 + Math.floor(Math.random() * 4), b = 13 + Math.floor(Math.random() * 7); return { a, b }; });
  const [resp, setResp] = useState('');
  const [erro, setErro] = useState(false);
  return (
    <form className="coluna" onSubmit={(ev) => { ev.preventDefault(); if (Number(resp) === conta.a * conta.b) { portaoAberto = true; aoPassar(); } else { setErro(true); setResp(''); } }}>
      <div>
        <div className="eyebrow">Área dos adultos</div>
        <h1 className="display h1">Só para adultos</h1>
      </div>
      <label htmlFor="portao" className="display h3">Quanto é {conta.a} × {conta.b}?</label>
      <input id="portao" style={{ ...campo, textAlign: 'center', fontSize: 22 }} inputMode="numeric" autoComplete="off" value={resp} onChange={(ev) => setResp(ev.target.value.replace(/\D/g, ''))} />
      {erro && <div className="aviso aviso-erro" role="alert">Resposta errada. Esta parte é para pais e professores.</div>}
      <button className="btn btn-amarelo btn-bloco" disabled={!resp}>Continuar</button>
    </form>
  );
}

export function Adulto({ turmaId }: { turmaId?: string }) {
  const [token, setToken] = useState(lerToken());
  const [eu, setEu] = useState<{ nome: string; email: string; admin: boolean } | null>(null);
  const [passou, setPassou] = useState(portaoAberto || !!token);

  useEffect(() => {
    if (!token) return;
    void api<{ adulto: { nome: string; email: string; admin: boolean } }>('/adulto/eu', { tokenProprio: token }).then((r) => {
      if (r.erro) { if (r.status === 401) { tirarToken(); setToken(null); } }
      else setEu(r.adulto);
    });
  }, [token]);

  const entrou = (t: string) => { try { localStorage.setItem(K, t); } catch { /* */ } setToken(t); };
  const saiu = () => { tirarToken(); setToken(null); setEu(null); };
  const sair = async () => { await api('/adulto/sair', { corpo: {}, tokenProprio: token }); saiu(); };

  return (
    <main className="tela" style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <button className="voltar" onClick={() => (turmaId ? ir('adulto') : ir())}><Icone nome="voltar" tamanho={18} espessura={3} />{turmaId ? 'Voltar' : 'Voltar ao app'}</button>
        {eu && <button className="voltar" onClick={() => void sair()}>Sair</button>}
      </div>
      {!passou ? <Portao aoPassar={() => setPassou(true)} />
        : !token ? <Acesso aoEntrar={entrou} /> : !eu ? <p className="muted">Carregando…</p>
        : turmaId ? <DetalheTurma token={token} id={turmaId} />
        : <Painel token={token} eu={eu} aoSair={sair} aoApagar={saiu} />}
    </main>
  );
}

function Acesso({ aoEntrar }: { aoEntrar: (t: string) => void }) {
  const [modo, setModo] = useState<'entrar' | 'cadastro'>('cadastro');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const enviar = async () => {
    setOcupado(true); setErro(null);
    const r = await api<{ token: string }>(`/adulto/${modo}`, { corpo: { nome, email, senha, aceite }, tokenProprio: null });
    setOcupado(false);
    if (r.erro) setErro(r.erro); else aoEntrar(r.token);
  };
  return (
    <>
      <div>
        <div className="eyebrow">Área dos adultos</div>
        <h1 className="display h1">Pais e professores</h1>
        <p className="muted" style={{ margin: '6px 0 0' }}>Crie a conta da família para guardar o progresso dos seus filhos em qualquer aparelho. Professores também criam turmas aqui.</p>
      </div>
      <div className="linha" role="tablist" style={{ gap: 8 }}>
        {(['cadastro', 'entrar'] as const).map((m) => <button key={m} role="tab" aria-selected={modo === m} className={`btn ${modo === m ? 'btn-ciano' : 'btn-escuro'}`} style={{ flex: 1, fontSize: 17, minHeight: 46 }} onClick={() => { setModo(m); setErro(null); }}>{m === 'entrar' ? 'Entrar' : 'Criar conta'}</button>)}
      </div>
      <form className="coluna" onSubmit={(ev) => { ev.preventDefault(); void enviar(); }}>
        {modo === 'cadastro' && <><label htmlFor="a-nome" className="small" style={rotulo}>Seu nome</label><input id="a-nome" style={campo} value={nome} onChange={(ev) => setNome(ev.target.value)} autoComplete="name" /></>}
        <label htmlFor="a-email" className="small" style={rotulo}>E-mail</label>
        <input id="a-email" style={campo} type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} autoComplete="email" />
        <label htmlFor="a-senha" className="small" style={rotulo}>Senha {modo === 'cadastro' && <span className="muted">(pelo menos 8 caracteres)</span>}</label>
        <input id="a-senha" style={campo} type="password" value={senha} onChange={(ev) => setSenha(ev.target.value)} autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} />
        {modo === 'cadastro' && (
          <label className="linha small" style={{ gap: 10, alignItems: 'flex-start', fontWeight: 700 }}>
            <input type="checkbox" checked={aceite} onChange={(ev) => setAceite(ev.target.checked)} style={{ width: 22, height: 22, flex: 'none', marginTop: 2 }} />
            <span>Sou maior de idade, sou o responsável pelas crianças que vou cadastrar (ou o professor delas) e li e aceito a <a href="#/privacidade" style={{ color: 'var(--cyan-2)' }}>política de privacidade</a>.</span>
          </label>
        )}
        {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
        <button className="btn btn-amarelo btn-bloco" disabled={ocupado || (modo === 'cadastro' && !aceite)}>{ocupado ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}</button>
        <p className="muted small" style={{ margin: 0 }}>Seu e-mail serve só para entrar na conta. Das crianças, o Sabidex guarda apenas apelido, cor e progresso no jogo.</p>
      </form>
    </>
  );
}

function Painel({ token, eu, aoSair, aoApagar }: { token: string; eu: { nome: string; admin: boolean }; aoSair: () => Promise<void>; aoApagar: () => void }) {
  return (
    <>
      <div>
        <div className="eyebrow">Olá, {eu.nome}{eu.admin ? ' · administrador' : ''}</div>
        <h1 className="display h1">Minha família</h1>
      </div>
      <Familia token={token} aoSair={aoSair} />
      <Turmas token={token} admin={eu.admin} />
      <ApagarConta token={token} aoApagar={aoApagar} />
    </>
  );
}

/* ---------------- Família ---------------- */

function Familia({ token, aoSair }: { token: string; aoSair: () => Promise<void> }) {
  const [filhos, setFilhos] = useState<Filho[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [form, setForm] = useState<'nenhum' | 'novo' | 'ligar'>('nenhum');
  const [abrir, setAbrir] = useState<string | null>(null);
  const [apagar, setApagar] = useState<string | null>(null);
  const carregar = () => api<{ filhos: Filho[] }>('/adulto/familia', { tokenProprio: token }).then((r) => {
    if (r.erro) setErro(r.erro); else { setFilhos(r.filhos); if (r.filhos.length === 0) setForm((f) => (f === 'nenhum' ? 'novo' : f)); }
  });
  useEffect(() => { void carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const contaAberta = getConta();
  // Uma criança já joga neste aparelho sem conta? (escolheu apelido, talvez já tenha cartas)
  const semConta = !contaAberta && !!getEstado().perfil;
  const solto = semConta && temProgressoSolto(getEstado());

  const abrirAqui = async (f: { id: string; apelido: string }) => {
    setErro(null);
    const msg = await usarPerfilDoAdulto(token, f.id);
    if (msg) return setErro(msg);
    // Por segurança, o adulto sai deste aparelho: a criança não fica com acesso à área dos adultos.
    await aoSair();
    ir();
  };
  const novoPin = async (f: Filho) => {
    setErro(null);
    const r = await api<{ pin: string }>(`/adulto/familia/${f.id}/pin`, { corpo: {}, tokenProprio: token });
    if (r.erro) setErro(r.erro); else { setAviso(`Novo PIN de ${f.apelido}: ${r.pin}. Anote e passe para a criança.`); void carregar(); }
  };
  const sairTurma = async (f: Filho) => {
    const r = await api(`/adulto/familia/${f.id}/sair-turma`, { corpo: {}, tokenProprio: token });
    if (r.erro) setErro(r.erro); else { setAviso(`${f.apelido} saiu da turma. A conta e as cartas continuam.`); void carregar(); }
  };
  const tirar = async (f: Filho) => {
    const r = await api(`/adulto/familia/${f.id}`, { metodo: 'DELETE', tokenProprio: token });
    setApagar(null);
    if (r.erro) return setErro(r.erro);
    esquecerContas([f.id]);
    setAviso(`O perfil de ${f.apelido} foi apagado.`);
    void carregar();
  };

  return (
    <section className="coluna" aria-label="Perfis das crianças">
      {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
      {aviso && <div className="aviso aviso-ok" role="status">{aviso}</div>}
      {filhos?.map((f) => (
        <div key={f.id} className="painel coluna" style={{ padding: 12, gap: 8 }}>
          <div className="linha">
            <Bolinha nome={f.apelido} cor={f.cor} tamanho={40} />
            <span style={{ flex: 1 }}>
              <span className="display" style={{ fontSize: 19, display: 'block' }}>{f.apelido}{contaAberta?.id === f.id ? ' · neste aparelho' : ''}</span>
              <span className="muted small">{f.xp ?? 0} XP · {f.cartas} cartas · {f.turma ? `turma ${f.turma}` : 'sem turma'} · visto {quando(f.visto)}{f.bloqueado_ate > Date.now() ? ' · bloqueado por PIN errado' : ''}</span>
            </span>
          </div>
          {abrir === f.id ? (
            <div className="aviso coluna" style={{ gap: 8 }}>
              <span className="small" style={{ fontWeight: 700 }}>
                {solto ? 'O progresso que está neste aparelho, sem conta, vai ser trocado pelo da conta. ' : contaAberta ? `${contaAberta.apelido} sai deste aparelho (as cartas continuam na conta). ` : ''}
                Depois você sai da área dos adultos, para a criança não entrar aqui.
              </span>
              <div className="linha" style={{ gap: 8 }}>
                <button className="btn btn-escuro" style={botaoPequeno} onClick={() => setAbrir(null)}>Cancelar</button>
                <button className="btn btn-amarelo" style={botaoPequeno} onClick={() => void abrirAqui(f)}>Abrir</button>
              </div>
            </div>
          ) : apagar === f.id ? (
            <div className="aviso aviso-erro coluna" style={{ gap: 8 }}>
              <span className="small" style={{ fontWeight: 700 }}>Apagar {f.apelido} para sempre? Cartas, XP e progresso somem e não dá para recuperar.</span>
              <div className="linha" style={{ gap: 8 }}>
                <button className="btn btn-escuro" style={botaoPequeno} onClick={() => setApagar(null)}>Não</button>
                <button className="btn btn-vermelho" style={botaoPequeno} onClick={() => void tirar(f)}>Apagar</button>
              </div>
            </div>
          ) : (
            <div className="linha" style={{ gap: 8, flexWrap: 'wrap' }}>
              {contaAberta?.id !== f.id && <button className="btn btn-amarelo" style={botaoPequeno} onClick={() => setAbrir(f.id)}>Abrir neste aparelho</button>}
              <button className="btn btn-escuro" style={botaoPequeno} onClick={() => void novoPin(f)}>Novo PIN</button>
              {f.turma && <button className="btn btn-escuro" style={botaoPequeno} onClick={() => void sairTurma(f)}>Tirar da turma</button>}
              <button className="btn btn-escuro" style={botaoPequeno} onClick={() => setApagar(f.id)}>Apagar</button>
            </div>
          )}
        </div>
      ))}
      {form === 'nenhum' && (
        <div className="linha" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ciano" style={{ flex: 1 }} onClick={() => setForm('novo')}>Adicionar criança</button>
          <button className="btn btn-escuro" style={{ flex: 1 }} onClick={() => setForm('ligar')}>Já tem conta na turma</button>
        </div>
      )}
      {form === 'novo' && <NovoFilho token={token} solto={semConta} aoFechar={() => setForm('nenhum')} aoCriar={async (id, apelido, levou) => {
        setForm('nenhum');
        if (levou) return abrirAqui({ id, apelido });
        setAviso(`Perfil de ${apelido} criado! Toque em "Abrir neste aparelho" no celular ou tablet da criança.`);
        void carregar();
      }} />}
      {form === 'ligar' && <LigarConta token={token} aoFechar={() => setForm('nenhum')} aoLigar={() => { setForm('nenhum'); setAviso('Conta ligada à sua família.'); void carregar(); }} />}
    </section>
  );
}

function NovoFilho({ token, solto, aoFechar, aoCriar }: { token: string; solto: boolean; aoFechar: () => void; aoCriar: (id: string, apelido: string, levou: boolean) => void }) {
  const perfil = getEstado().perfil;
  const [apelido, setApelido] = useState(solto ? perfil?.nome ?? '' : '');
  const [cor, setCor] = useState(solto ? perfil?.cor ?? CORES[0] : CORES[0]);
  const [pin, setPin] = useState('');
  const [levar, setLevar] = useState(solto);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const e = getEstado();
  const criar = async () => {
    setOcupado(true); setErro(null);
    const r = await api<{ id: string }>('/adulto/familia', {
      corpo: { apelido, cor, pin, ...(levar ? { progresso: progressoDe(e), cartas: e.cartas } : {}) }, tokenProprio: token,
    });
    setOcupado(false);
    if (r.erro) setErro(r.erro); else aoCriar(r.id, apelido.trim(), levar);
  };
  return (
    <form className="painel coluna" onSubmit={(ev) => { ev.preventDefault(); void criar(); }}>
      <div className="display h3">Adicionar criança</div>
      <label htmlFor="f-apelido" className="small" style={rotulo}>Apelido <span className="muted">(não use o nome completo)</span></label>
      <input id="f-apelido" style={campo} value={apelido} maxLength={14} onChange={(ev) => setApelido(ev.target.value)} autoComplete="off" />
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="small" style={{ ...rotulo, marginBottom: 8 }}>Cor</legend>
        <div className="linha" style={{ gap: 10 }}>
          {CORES.map((c) => <button key={c} type="button" aria-label={`Cor ${c}`} aria-pressed={cor === c} onClick={() => setCor(c)} style={{ width: 38, height: 38, borderRadius: '50%', border: 0, background: c, boxShadow: cor === c ? '0 0 0 3px var(--bg), 0 0 0 6px var(--ink)' : 'inset 0 -3px 0 #00000033' }} />)}
        </div>
      </fieldset>
      <label htmlFor="f-pin" className="small" style={rotulo}>PIN de 4 números <span className="muted">(a criança usa para trocar de perfil)</span></label>
      <input id="f-pin" style={{ ...campo, letterSpacing: '.3em' }} inputMode="numeric" autoComplete="off" maxLength={4} value={pin} onChange={(ev) => setPin(ev.target.value.replace(/\D/g, '').slice(0, 4))} />
      {solto && (
        <label className="linha small" style={{ gap: 10, alignItems: 'flex-start', fontWeight: 700 }}>
          <input type="checkbox" checked={levar} onChange={(ev) => setLevar(ev.target.checked)} style={{ width: 22, height: 22, flex: 'none', marginTop: 2 }} />
          <span>Levar o progresso que já está neste aparelho ({e.xp} XP, {Object.keys(e.cartas).length} Sabimons) e abrir o perfil aqui.</span>
        </label>
      )}
      {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
      <div className="linha" style={{ gap: 8 }}>
        <button type="button" className="btn btn-escuro" style={{ flex: 1 }} onClick={aoFechar}>Cancelar</button>
        <button className="btn btn-amarelo" style={{ flex: 1 }} disabled={ocupado || apelido.trim().length < 2 || pin.length !== 4}>{ocupado ? 'Criando…' : 'Criar perfil'}</button>
      </div>
    </form>
  );
}

function LigarConta({ token, aoFechar, aoLigar }: { token: string; aoFechar: () => void; aoLigar: () => void }) {
  const [codigo, setCodigo] = useState('');
  const [apelido, setApelido] = useState('');
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const ligar = async () => {
    setErro(null);
    const r = await api('/adulto/familia/ligar', { corpo: { codigo, apelido, pin }, tokenProprio: token });
    if (r.erro) setErro(r.erro); else aoLigar();
  };
  return (
    <form className="painel coluna" onSubmit={(ev) => { ev.preventDefault(); void ligar(); }}>
      <div className="display h3">Ligar conta da turma</div>
      <p className="muted small" style={{ margin: 0 }}>Se a criança já entrou numa turma, use os dados dela para trazer a conta para a família.</p>
      <label htmlFor="l-codigo" className="small" style={rotulo}>Código da turma</label>
      <input id="l-codigo" style={campo} value={codigo} onChange={(ev) => setCodigo(ev.target.value.toUpperCase())} placeholder="Ex.: ARARA-4821" autoComplete="off" />
      <label htmlFor="l-apelido" className="small" style={rotulo}>Apelido na turma</label>
      <input id="l-apelido" style={campo} value={apelido} maxLength={14} onChange={(ev) => setApelido(ev.target.value)} autoComplete="off" />
      <label htmlFor="l-pin" className="small" style={rotulo}>PIN da criança</label>
      <input id="l-pin" style={{ ...campo, letterSpacing: '.3em' }} inputMode="numeric" autoComplete="off" maxLength={4} value={pin} onChange={(ev) => setPin(ev.target.value.replace(/\D/g, '').slice(0, 4))} />
      {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
      <div className="linha" style={{ gap: 8 }}>
        <button type="button" className="btn btn-escuro" style={{ flex: 1 }} onClick={aoFechar}>Cancelar</button>
        <button className="btn btn-amarelo" style={{ flex: 1 }} disabled={codigo.length < 5 || apelido.trim().length < 2 || pin.length !== 4}>Ligar</button>
      </div>
    </form>
  );
}

/* ---------------- Turmas (professores) ---------------- */

function Turmas({ token, admin }: { token: string; admin: boolean }) {
  const [turmas, setTurmas] = useState<Turma[] | null>(null);
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const carregar = () => api<{ turmas: Turma[] }>('/adulto/turmas', { tokenProprio: token }).then((r) => (r.erro ? setErro(r.erro) : setTurmas(r.turmas)));
  useEffect(() => { void carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const criar = async () => {
    setErro(null);
    const r = await api<{ turma: Turma }>('/adulto/turmas', { corpo: { nome }, tokenProprio: token });
    if (r.erro) return setErro(r.erro);
    setNome('');
    ir('adulto', r.turma.id);
  };
  return (
    <section className="coluna" aria-label="Turmas">
      <h2 className="display h2" style={{ marginTop: 12 }}>Turmas</h2>
      {turmas?.length === 0 && !aberto && <p className="muted" style={{ margin: 0 }}>É professor? Crie uma turma e mande o código para os alunos. Pais também podem criar uma turma para os amigos dos filhos.</p>}
      {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
      {turmas?.map((t) => (
        <button key={t.id} className="painel-destaque linha" onClick={() => ir('adulto', t.id)} style={{ textAlign: 'left', color: 'inherit' }}>
          <span style={{ flex: 1 }}>
            <span className="display" style={{ fontSize: 20, display: 'block' }}>{t.nome}</span>
            <span className="muted small">Código {t.codigo} · {t.criancas} {t.criancas === 1 ? 'criança' : 'crianças'}{admin ? ` · de ${t.dono}` : ''}</span>
          </span>
          <Icone nome="seguir" />
        </button>
      ))}
      {aberto ? (
        <form className="painel coluna" onSubmit={(ev) => { ev.preventDefault(); void criar(); }}>
          <label htmlFor="t-nome" className="display h3">Criar turma</label>
          <input id="t-nome" style={campo} placeholder='Ex.: 4º ano B · Colégio X' value={nome} maxLength={50} onChange={(ev) => setNome(ev.target.value)} />
          <button className="btn btn-amarelo btn-bloco" disabled={nome.trim().length < 2}>Criar e gerar código</button>
        </form>
      ) : <button className="btn btn-escuro btn-bloco" onClick={() => setAberto(true)}>Criar turma</button>}
    </section>
  );
}

/* ---------------- Apagar a conta ---------------- */

function ApagarConta({ token, aoApagar }: { token: string; aoApagar: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const apagar = async () => {
    setOcupado(true); setErro(null);
    const filhos = await api<{ filhos: Filho[] }>('/adulto/familia', { tokenProprio: token });
    const r = await api('/adulto/apagar-conta', { corpo: { senha }, tokenProprio: token });
    setOcupado(false);
    if (r.erro) return setErro(r.erro);
    esquecerContas((filhos.filhos ?? []).map((f) => f.id));
    aoApagar();
    ir();
  };
  return (
    <section className="coluna" aria-label="Minha conta" style={{ marginTop: 24 }}>
      <h2 className="display h3">Minha conta</h2>
      <a href="#/privacidade" className="small" style={{ color: 'var(--cyan-2)', fontWeight: 700 }}>Política de privacidade</a>
      {!aberto ? <button className="btn btn-escuro btn-bloco" onClick={() => setAberto(true)}>Apagar minha conta</button> : (
        <form className="aviso aviso-erro coluna" onSubmit={(ev) => { ev.preventDefault(); void apagar(); }}>
          <div style={{ fontWeight: 800 }}>Isto apaga para sempre:</div>
          <ul className="small" style={{ margin: 0, paddingLeft: 20, fontWeight: 700 }}>
            <li>sua conta e seu e-mail;</li>
            <li>os perfis das crianças da sua família, com cartas e progresso;</li>
            <li>as turmas que você criou. Crianças de outras famílias só saem da turma; as que não têm conta da família são apagadas.</li>
          </ul>
          <label htmlFor="ap-senha" className="small" style={rotulo}>Digite sua senha para confirmar</label>
          <input id="ap-senha" style={campo} type="password" value={senha} onChange={(ev) => setSenha(ev.target.value)} autoComplete="current-password" />
          {erro && <div role="alert" style={{ fontWeight: 800 }}>{erro}</div>}
          <div className="linha" style={{ gap: 8 }}>
            <button type="button" className="btn btn-escuro" style={{ flex: 1 }} onClick={() => { setAberto(false); setSenha(''); setErro(null); }}>Cancelar</button>
            <button className="btn btn-vermelho" style={{ flex: 1 }} disabled={!senha || ocupado}>{ocupado ? 'Apagando…' : 'Apagar tudo'}</button>
          </div>
        </form>
      )}
    </section>
  );
}

function DetalheTurma({ token, id }: { token: string; id: string }) {
  const [dados, setDados] = useState<{ turma: Turma; criancas: Kid[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pinNovo, setPinNovo] = useState<{ apelido: string; pin: string } | null>(null);
  const [remover, setRemover] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const carregar = () => api<{ turma: Turma; criancas: Kid[] }>(`/adulto/turmas/${id}`, { tokenProprio: token }).then((r) => (r.erro ? setErro(r.erro) : setDados(r)));
  useEffect(() => { void carregar(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (erro && !dados) return <div className="aviso aviso-erro">{erro}</div>;
  if (!dados) return <p className="muted">Carregando…</p>;
  const { turma, criancas } = dados;
  const link = `${location.origin}/`;
  const convite = `Entre no Sabidex pelo link ${link} e, em "Trocas", toque em "Entrar na minha turma" e use o código ${turma.codigo}.`;

  const novoPin = async (k: Kid) => {
    const r = await api<{ pin: string }>(`/adulto/turmas/${id}/criancas/${k.id}/pin`, { corpo: {}, tokenProprio: token });
    if (r.erro) setErro(r.erro); else { setPinNovo({ apelido: k.apelido, pin: r.pin }); void carregar(); }
  };
  const tirar = async (k: Kid) => {
    const r = await api(`/adulto/turmas/${id}/criancas/${k.id}`, { metodo: 'DELETE', tokenProprio: token });
    setRemover(null);
    if (r.erro) setErro(r.erro); else void carregar();
  };
  const copiar = async () => {
    try { await navigator.clipboard.writeText(convite); setCopiado(true); setTimeout(() => setCopiado(false), 2500); } catch { setCopiado(false); }
  };

  return (
    <>
      <div>
        <div className="eyebrow">Turma</div>
        <h1 className="display h1">{turma.nome}</h1>
      </div>
      <div className="painel-destaque coluna" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div className="muted small">Código da turma</div>
        <div className="display" style={{ fontSize: 40, color: 'var(--yellow)', letterSpacing: '.04em', userSelect: 'all' }}>{turma.codigo}</div>
        <p className="small" style={{ margin: 0, fontWeight: 700, userSelect: 'all' }}>{convite}</p>
        <button className="btn btn-ciano" onClick={() => void copiar()}>{copiado ? 'Copiado!' : 'Copiar convite'}</button>
      </div>
      {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
      {pinNovo && (
        <div className="aviso aviso-ok" role="status">
          Novo PIN de <strong>{pinNovo.apelido}</strong>: <span className="display" style={{ fontSize: 24, color: 'var(--yellow)' }}>{pinNovo.pin}</span>
          <div className="small">Passe para a criança. Ele não aparece de novo.</div>
        </div>
      )}
      <h2 className="display h3">{criancas.length} {criancas.length === 1 ? 'criança' : 'crianças'}</h2>
      {criancas.length === 0 && <p className="muted">Ninguém entrou ainda. Mande o convite acima.</p>}
      <div style={{ overflowX: 'auto' }}>
        <div className="coluna" style={{ gap: 8 }}>
          {criancas.map((k) => (
            <div key={k.id} className="painel coluna" style={{ padding: 12, gap: 8 }}>
              <div className="linha">
                <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: '50%', background: k.cor, display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', color: 'var(--bg)' }}>{k.apelido[0]?.toUpperCase()}</span>
                <span style={{ flex: 1 }}>
                  <span className="display" style={{ fontSize: 18, display: 'block' }}>{k.apelido}</span>
                  <span className="muted small">{k.xp_semana} XP na semana · {k.xp ?? 0} XP no total · {k.cartas} cartas · visto {quando(k.visto)}{k.bloqueado_ate > Date.now() ? ' · bloqueado por PIN errado' : ''}</span>
                </span>
              </div>
              {remover === k.id ? (
                <div className="linha" style={{ gap: 8 }}>
                  <span className="small" style={{ flex: 1, fontWeight: 700 }}>Remover {k.apelido}? {k.familia ? 'A criança tem conta da família: ela só sai da turma e continua com as cartas.' : 'As cartas e o progresso da conta serão apagados.'}</span>
                  <button className="btn btn-escuro" style={{ minHeight: 40, fontSize: 15 }} onClick={() => setRemover(null)}>Não</button>
                  <button className="btn btn-vermelho" style={{ minHeight: 40, fontSize: 15 }} onClick={() => void tirar(k)}>Remover</button>
                </div>
              ) : (
                <div className="linha" style={{ gap: 8 }}>
                  <button className="btn btn-escuro" style={{ flex: 1, minHeight: 40, fontSize: 15 }} onClick={() => void novoPin(k)}>Novo PIN</button>
                  <button className="btn btn-escuro" style={{ flex: 1, minHeight: 40, fontSize: 15 }} onClick={() => setRemover(k.id)}>Remover</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
