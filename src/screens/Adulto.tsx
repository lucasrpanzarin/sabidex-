// Área dos adultos: conta da família (perfis dos filhos), turmas e apagar a conta.
import { useEffect, useRef, useState } from 'react';
import { Icone } from '../components/Icone';
import { Bolinha } from '../components/Perfis';
import { api, esquecerContas, getConta, usarPerfilDoAdulto } from '../lib/conta';
import { ir } from '../lib/rota';
import { botaoGoogle, entrarApple, lerConfig, type ConfigServidor } from '../lib/social';
import { getEstado, progressoDe, temProgressoSolto } from '../lib/store';
import { CORES } from './Inicio';
import { capitulos } from '../data';
import { hoje } from '../lib/jogo';
import { diaMes, situacao, textoProva, type DatasProva } from '../lib/provas';

const K = 'sabidex:adulto';
const lerToken = () => { try { return localStorage.getItem(K); } catch { return null; } };
const tirarToken = () => { try { localStorage.removeItem(K); } catch { /* */ } };
const campo: React.CSSProperties = { font: 'inherit', fontWeight: 700, fontSize: 17, padding: '13px 14px', borderRadius: 14, border: '3px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)', width: '100%' };
const rotulo: React.CSSProperties = { fontWeight: 800 };
const botaoPequeno: React.CSSProperties = { flex: 1, minHeight: 40, fontSize: 15 };

interface Turma { id: string; nome: string; codigo: string; criancas: number; dono: string }
interface Kid { id: string; apelido: string; cor: string; xp: number | null; xp_semana: number; cartas: number; visto: number; bloqueado_ate: number; familia: number; chat_ok: number; mudo_ate: number; online: number }
interface Filho { id: string; apelido: string; cor: string; xp: number | null; cartas: number; visto: number; bloqueado_ate: number; turma: string | null; codigo: string | null; chat_ok: number; mostrar_online: number; turma_chat: number | null }

function quando(ms: number) {
  const d = Math.floor((Date.now() - ms) / 86_400_000);
  return d <= 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} dias`;
}

/**
 * Datas das provas da escola. Antes da data, o capítulo aparece em destaque para a criança;
 * depois, vai para "Já teve prova" e continua valendo XP e pacotes (para quem chegou depois ou quer revisar).
 */
function DatasDasProvas({ token, rota, provas, aoMudar, ajuda }: { token: string; rota: string; provas: DatasProva; aoMudar: (p: DatasProva) => void; ajuda: string }) {
  const [erro, setErro] = useState<string | null>(null);
  const salvar = async (capitulo: string, data: string) => {
    setErro(null);
    const r = await api<{ provas: DatasProva }>(rota, { corpo: { capitulo, data }, tokenProprio: token });
    if (r.erro) setErro(r.erro); else aoMudar(r.provas);
  };
  const dia = hoje();
  return (
    <section className="coluna" aria-label="Datas das provas" style={{ gap: 8 }}>
      <h2 className="display h3" style={{ margin: 0 }}>Datas das provas</h2>
      <p className="muted small" style={{ margin: 0 }}>{ajuda}</p>
      {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
      {capitulos.map((c) => {
        const data = provas[c.id] ?? '';
        const t = textoProva(situacao(provas, c.id, dia));
        return (
          <label key={c.id} className="painel coluna" style={{ padding: 12, gap: 6 }}>
            <span style={rotulo}>{c.materia} · Cap. {c.numero}: {c.titulo}</span>
            <span className="linha" style={{ gap: 8 }}>
              <input type="date" value={data} onChange={(ev) => void salvar(c.id, ev.target.value)} style={{ ...campo, flex: 1, padding: '8px 10px' }} aria-label={`Data da prova do capítulo ${c.numero}`} />
              {data && <button type="button" className="btn btn-escuro" style={{ minHeight: 40, fontSize: 15 }} onClick={() => void salvar(c.id, '')}>Tirar</button>}
            </span>
            <span className="muted small">{data ? `${t} (${diaMes(data)})` : 'Sem data'}</span>
          </label>
        );
      })}
    </section>
  );
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

interface Eu { nome: string; email: string; admin: boolean; precisaAceite: boolean; temSenha: boolean }
const guardarToken = (t: string) => { try { localStorage.setItem(K, t); } catch { /* */ } };

export function Adulto({ turmaId }: { turmaId?: string }) {
  const [token, setToken] = useState(lerToken());
  const [eu, setEu] = useState<Eu | null>(null);
  const [passou, setPassou] = useState(portaoAberto || !!token);

  useEffect(() => {
    if (!token) return;
    void api<{ adulto: Eu }>('/adulto/eu', { tokenProprio: token }).then((r) => {
      if (r.erro) { if (r.status === 401) { tirarToken(); setToken(null); } }
      else setEu(r.adulto);
    });
  }, [token]);

  const entrou = (t: string) => { guardarToken(t); setEu(null); setToken(t); };
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
        : eu.precisaAceite ? <AceitePendente token={token} aoAceitar={() => setEu({ ...eu, precisaAceite: false })} aoSair={sair} />
        : turmaId ? <DetalheTurma token={token} id={turmaId} />
        : <Painel token={token} eu={eu} aoSair={sair} aoApagar={saiu} />}
    </main>
  );
}

function CaixaAceite({ marcado, aoMudar }: { marcado: boolean; aoMudar: (v: boolean) => void }) {
  return (
    <label className="linha small" style={{ gap: 10, alignItems: 'flex-start', fontWeight: 700 }}>
      <input type="checkbox" checked={marcado} onChange={(ev) => aoMudar(ev.target.checked)} style={{ width: 22, height: 22, flex: 'none', marginTop: 2 }} />
      <span>Sou maior de idade, sou o responsável pelas crianças que vou cadastrar (ou o professor delas) e li e aceito a <a href="#/privacidade" style={{ color: 'var(--t-cyan)' }}>política de privacidade</a>.</span>
    </label>
  );
}

/** Quem já tinha conta antes da política de privacidade aceita uma vez. */
function AceitePendente({ token, aoAceitar, aoSair }: { token: string; aoAceitar: () => void; aoSair: () => Promise<void> }) {
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const enviar = async () => {
    const r = await api('/adulto/aceite', { corpo: { aceite }, tokenProprio: token });
    if (r.erro) setErro(r.erro); else aoAceitar();
  };
  return (
    <form className="coluna" onSubmit={(ev) => { ev.preventDefault(); void enviar(); }}>
      <div>
        <div className="eyebrow">Área dos adultos</div>
        <h1 className="display h1">Política de privacidade</h1>
        <p className="muted" style={{ margin: '6px 0 0' }}>Agora o Sabidex tem uma política de privacidade. Para continuar usando a área dos adultos, leia e confirme.</p>
      </div>
      <CaixaAceite marcado={aceite} aoMudar={setAceite} />
      {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
      <button className="btn btn-amarelo btn-bloco" disabled={!aceite}>Continuar</button>
      <button type="button" className="voltar" style={{ alignSelf: 'center' }} onClick={() => void aoSair()}>Sair</button>
    </form>
  );
}

/** Botões "Continuar com Google" e "Continuar com Apple" (só aparecem se o servidor estiver configurado). */
function EntrarSocial({ aoEntrar, aoPendente }: { aoEntrar: (t: string) => void; aoPendente: (v: boolean) => void }) {
  const [cfg, setCfg] = useState<ConfigServidor | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState<{ provedor: 'google' | 'apple'; token: string; nome: string; email: string } | null>(null);
  const [aceite, setAceite] = useState(false);
  const caixaGoogle = useRef<HTMLDivElement>(null);

  useEffect(() => { void lerConfig().then(setCfg); }, []);
  useEffect(() => { aoPendente(!!pendente); }, [pendente]); // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = async (provedor: 'google' | 'apple', token: string, extra: { nome?: string; aceite?: boolean } = {}) => {
    setErro(null);
    const r = await api<{ token?: string; precisaAceite?: boolean; nome?: string; email?: string }>('/adulto/social', { corpo: { provedor, token, ...extra }, tokenProprio: null });
    if (r.erro) return setErro(r.erro);
    if (r.precisaAceite) return setPendente({ provedor, token, nome: r.nome ?? '', email: r.email ?? '' });
    if (r.token) aoEntrar(r.token);
  };

  useEffect(() => {
    if (!cfg?.google || !caixaGoogle.current) return;
    botaoGoogle(caixaGoogle.current, cfg.google, (t) => void enviar('google', t)).catch(() => setErro('Não consegui carregar o botão do Google.'));
  }, [cfg?.google]); // eslint-disable-line react-hooks/exhaustive-deps

  const apple = async () => {
    if (!cfg?.apple) return;
    try { const r = await entrarApple(cfg.apple); await enviar('apple', r.token, { nome: r.nome }); }
    catch { /* janela fechada */ }
  };

  if (!cfg || (!cfg.google && !cfg.apple)) return null;
  if (pendente) {
    return (
      <form className="painel coluna" onSubmit={(ev) => { ev.preventDefault(); void enviar(pendente.provedor, pendente.token, { nome: pendente.nome, aceite }); }}>
        <div className="display h3">Criar conta com {pendente.email}</div>
        <label htmlFor="s-nome" className="small" style={rotulo}>Seu nome</label>
        <input id="s-nome" style={campo} value={pendente.nome} maxLength={60} onChange={(ev) => setPendente({ ...pendente, nome: ev.target.value })} autoComplete="name" />
        <CaixaAceite marcado={aceite} aoMudar={setAceite} />
        {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
        <div className="linha" style={{ gap: 8 }}>
          <button type="button" className="btn btn-escuro" style={{ flex: 1 }} onClick={() => setPendente(null)}>Cancelar</button>
          <button className="btn btn-amarelo" style={{ flex: 1 }} disabled={!aceite || pendente.nome.trim().length < 2}>Criar conta</button>
        </div>
      </form>
    );
  }
  return (
    <div className="coluna" style={{ gap: 10, alignItems: 'stretch' }}>
      {cfg.google && <div ref={caixaGoogle} style={{ minHeight: 44, display: 'flex', justifyContent: 'center' }} />}
      {cfg.apple && (
        <button type="button" onClick={() => void apple()} style={{ minHeight: 44, borderRadius: 999, border: '1px solid #fff4', background: '#000', color: '#fff', font: '600 16px -apple-system, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="16" height="19" viewBox="0 0 16 19" aria-hidden="true"><path fill="#fff" d="M13.2 10.1c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.9-.9-3.1-.8C3.6 4.9 2.1 5.8 1.3 7.3c-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.1.8c1.3 0 2.1-1.2 2.9-2.4.9-1.3 1.3-2.6 1.3-2.7 0 0-2.6-1-2.7-4.1zM10.9 3.2c.7-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3z"/></svg>
          Continuar com Apple
        </button>
      )}
      {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
      <div className="linha muted small" style={{ gap: 10 }}><span style={{ flex: 1, height: 1, background: 'var(--line-2)' }} />ou com e-mail<span style={{ flex: 1, height: 1, background: 'var(--line-2)' }} /></div>
    </div>
  );
}

function Esqueci({ emailInicial, aoVoltar }: { emailInicial: string; aoVoltar: () => void }) {
  const [email, setEmail] = useState(emailInicial);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const enviar = async () => {
    setOcupado(true); setErro(null);
    const r = await api('/adulto/esqueci', { corpo: { email }, tokenProprio: null });
    setOcupado(false);
    if (r.erro) setErro(r.erro); else setEnviado(true);
  };
  return (
    <form className="coluna" onSubmit={(ev) => { ev.preventDefault(); void enviar(); }}>
      <div>
        <div className="eyebrow">Área dos adultos</div>
        <h1 className="display h1">Esqueci minha senha</h1>
      </div>
      {enviado ? (
        <div className="aviso aviso-ok" role="status">Se esse e-mail tiver conta no Sabidex, mandamos um link para criar uma senha nova. Ele vale por 1 hora. Olhe também a caixa de spam.</div>
      ) : (
        <>
          <label htmlFor="e-email" className="small" style={rotulo}>Seu e-mail</label>
          <input id="e-email" style={campo} type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} autoComplete="email" />
          {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
          <button className="btn btn-amarelo btn-bloco" disabled={ocupado || !email.includes('@')}>{ocupado ? 'Enviando…' : 'Mandar link'}</button>
        </>
      )}
      <button type="button" className="voltar" style={{ alignSelf: 'center' }} onClick={aoVoltar}>Voltar para entrar</button>
    </form>
  );
}

/** Tela aberta pelo link do e-mail: cria a senha nova e já entra. */
export function NovaSenha({ token }: { token: string }) {
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const enviar = async () => {
    if (senha !== senha2) return setErro('As duas senhas não são iguais.');
    setOcupado(true); setErro(null);
    const r = await api<{ token: string }>('/adulto/nova-senha', { corpo: { token, senha }, tokenProprio: null });
    setOcupado(false);
    if (r.erro) return setErro(r.erro);
    guardarToken(r.token);
    portaoAberto = true;
    ir('adulto');
  };
  return (
    <main className="tela" style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
      <form className="coluna" onSubmit={(ev) => { ev.preventDefault(); void enviar(); }}>
        <div>
          <div className="eyebrow">Área dos adultos</div>
          <h1 className="display h1">Senha nova</h1>
        </div>
        <label htmlFor="n-senha" className="small" style={rotulo}>Senha nova <span className="muted">(pelo menos 8 caracteres)</span></label>
        <input id="n-senha" style={campo} type="password" value={senha} onChange={(ev) => setSenha(ev.target.value)} autoComplete="new-password" />
        <label htmlFor="n-senha2" className="small" style={rotulo}>Digite de novo</label>
        <input id="n-senha2" style={campo} type="password" value={senha2} onChange={(ev) => setSenha2(ev.target.value)} autoComplete="new-password" />
        {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
        <button className="btn btn-amarelo btn-bloco" disabled={ocupado || senha.length < 8 || !senha2}>{ocupado ? 'Salvando…' : 'Salvar e entrar'}</button>
      </form>
    </main>
  );
}

function Acesso({ aoEntrar }: { aoEntrar: (t: string) => void }) {
  const [modo, setModo] = useState<'entrar' | 'cadastro' | 'esqueci'>('cadastro');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [recuperar, setRecuperar] = useState(false);
  const [socialPendente, setSocialPendente] = useState(false);
  useEffect(() => { void lerConfig().then((c) => setRecuperar(c.recuperarSenha)); }, []);
  const enviar = async () => {
    setOcupado(true); setErro(null);
    const r = await api<{ token: string }>(`/adulto/${modo}`, { corpo: { nome, email, senha, aceite }, tokenProprio: null });
    setOcupado(false);
    if (r.erro) setErro(r.erro); else aoEntrar(r.token);
  };
  if (modo === 'esqueci') return <Esqueci emailInicial={email} aoVoltar={() => setModo('entrar')} />;
  return (
    <>
      <div>
        <div className="eyebrow">Área dos adultos</div>
        <h1 className="display h1">Pais e professores</h1>
        <p className="muted" style={{ margin: '6px 0 0' }}>Crie a conta da família para guardar o progresso dos seus filhos em qualquer aparelho. Professores também criam turmas aqui.</p>
      </div>
      <EntrarSocial aoEntrar={aoEntrar} aoPendente={setSocialPendente} />
      {!socialPendente && <>
      <div className="linha" role="tablist" style={{ gap: 8 }}>
        {(['cadastro', 'entrar'] as const).map((m) => <button key={m} role="tab" aria-selected={modo === m} className={`btn ${modo === m ? 'btn-ciano' : 'btn-escuro'}`} style={{ flex: 1, fontSize: 17, minHeight: 46 }} onClick={() => { setModo(m); setErro(null); }}>{m === 'entrar' ? 'Entrar' : 'Criar conta'}</button>)}
      </div>
      <form className="coluna" onSubmit={(ev) => { ev.preventDefault(); void enviar(); }}>
        {modo === 'cadastro' && <><label htmlFor="a-nome" className="small" style={rotulo}>Seu nome</label><input id="a-nome" style={campo} value={nome} onChange={(ev) => setNome(ev.target.value)} autoComplete="name" /></>}
        <label htmlFor="a-email" className="small" style={rotulo}>E-mail</label>
        <input id="a-email" style={campo} type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} autoComplete="email" />
        <label htmlFor="a-senha" className="small" style={rotulo}>Senha {modo === 'cadastro' && <span className="muted">(pelo menos 8 caracteres)</span>}</label>
        <input id="a-senha" style={campo} type="password" value={senha} onChange={(ev) => setSenha(ev.target.value)} autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} />
        {modo === 'cadastro' && <CaixaAceite marcado={aceite} aoMudar={setAceite} />}
        {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
        <button className="btn btn-amarelo btn-bloco" disabled={ocupado || (modo === 'cadastro' && !aceite)}>{ocupado ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}</button>
        {modo === 'entrar' && recuperar && <button type="button" className="voltar" style={{ alignSelf: 'center' }} onClick={() => { setModo('esqueci'); setErro(null); }}>Esqueci minha senha</button>}
        <p className="muted small" style={{ margin: 0 }}>Seu e-mail serve só para entrar na conta. Das crianças, o Sabidex guarda apenas apelido, cor e progresso no jogo.</p>
      </form>
      </>}
    </>
  );
}

function Painel({ token, eu, aoSair, aoApagar }: { token: string; eu: Eu; aoSair: () => Promise<void>; aoApagar: () => void }) {
  return (
    <>
      <div>
        <div className="eyebrow">Olá, {eu.nome}{eu.admin ? ' · administrador' : ''}</div>
        <h1 className="display h1">Minha família</h1>
      </div>
      <Familia token={token} aoSair={aoSair} />
      <Turmas token={token} admin={eu.admin} />
      <ApagarConta token={token} temSenha={eu.temSenha} aoApagar={aoApagar} />
    </>
  );
}

/* ---------------- Família ---------------- */

function Familia({ token, aoSair }: { token: string; aoSair: () => Promise<void> }) {
  const [filhos, setFilhos] = useState<Filho[] | null>(null);
  const [provas, setProvas] = useState<DatasProva>({});
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [form, setForm] = useState<'nenhum' | 'novo' | 'ligar'>('nenhum');
  const [abrir, setAbrir] = useState<string | null>(null);
  const [apagar, setApagar] = useState<string | null>(null);
  const carregar = () => api<{ filhos: Filho[]; provas?: DatasProva }>('/adulto/familia', { tokenProprio: token }).then((r) => {
    if (r.erro) setErro(r.erro); else { setFilhos(r.filhos); setProvas(r.provas ?? {}); if (r.filhos.length === 0) setForm((f) => (f === 'nenhum' ? 'novo' : f)); }
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
          {f.turma && <ChatDoFilho token={token} f={f} aoMudar={() => void carregar()} />}
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
      {!!filhos?.length && (
        <DatasDasProvas token={token} rota="/adulto/familia/provas" provas={provas} aoMudar={setProvas}
          ajuda="Marque o dia da prova na escola. Antes da data, o capítulo aparece em destaque. Depois, continua valendo para revisar. Se a turma do professor marcar outra data, vale a da turma." />
      )}
    </section>
  );
}

/* ---------------- Chat da turma (área dos adultos) ---------------- */

interface MsgAdulto { id: string; crianca_id: string; apelido: string | null; cor: string | null; texto: string; criado: number; apagada: number; doFilho?: boolean }
const dataHora = (ms: number) => new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Lista de mensagens para pais e professor. Mostra também as apagadas (riscadas). */
function Conversa({ mensagens, avisadas, acoes }: { mensagens: MsgAdulto[]; avisadas?: Set<string>; acoes?: (m: MsgAdulto) => React.ReactNode }) {
  if (!mensagens.length) return <p className="muted small" style={{ margin: 0 }}>Nenhuma mensagem nos últimos 60 dias.</p>;
  return (
    <div className="coluna" style={{ gap: 6, maxHeight: 420, overflowY: 'auto', padding: 2 }}>
      {mensagens.map((m) => (
        <div key={m.id} className="linha" style={{ gap: 8, alignItems: 'flex-start', padding: '6px 8px', borderRadius: 12,
          background: avisadas?.has(m.id) ? '#FEE2E2' : m.doFilho ? '#CFFAFE' : 'var(--surface)', border: '2px solid var(--ink)' }}>
          <Bolinha nome={m.apelido ?? '?'} cor={m.cor ?? '#94A3B8'} tamanho={26} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="small" style={{ fontWeight: 900 }}>{m.apelido ?? 'Conta apagada'}</span>
            <span className="muted small"> · {dataHora(m.criado)}{m.apagada ? ' · apagada' : ''}{avisadas?.has(m.id) ? ' · aluno avisou' : ''}</span>
            <span style={{ display: 'block', fontWeight: 700, overflowWrap: 'anywhere', textDecoration: m.apagada ? 'line-through' : undefined, opacity: m.apagada ? 0.6 : 1 }}>{m.texto}</span>
            {acoes?.(m)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** O responsável autoriza o chat e o "estudando agora" do filho, e lê a conversa da turma. */
function ChatDoFilho({ token, f, aoMudar }: { token: string; f: Filho; aoMudar: () => void }) {
  const [ler, setLer] = useState<MsgAdulto[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const mudar = async (campo: 'chat' | 'online', valor: boolean) => {
    const r = await api(`/adulto/familia/${f.id}/chat`, { corpo: { [campo]: valor }, tokenProprio: token });
    if (r.erro) setErro(r.erro); else aoMudar();
  };
  const abrir = async () => {
    if (ler) return setLer(null);
    const r = await api<{ mensagens: MsgAdulto[] }>(`/adulto/familia/${f.id}/chat`, { tokenProprio: token });
    if (r.erro) setErro(r.erro); else setLer(r.mensagens);
  };
  return (
    <div className="coluna" style={{ gap: 6, borderTop: '2px dashed var(--line)', paddingTop: 8 }}>
      <span className="small" style={{ fontWeight: 900 }}>Chat da turma {f.turma}</span>
      {!f.turma_chat && <span className="muted small">O professor ainda não ligou o chat desta turma. Quando ligar, só funciona se você autorizar aqui.</span>}
      <label className="linha small" style={{ gap: 8, fontWeight: 700, alignItems: 'flex-start' }}>
        <input type="checkbox" checked={!!f.chat_ok} onChange={(ev) => void mudar('chat', ev.target.checked)} style={{ width: 22, height: 22, flex: 'none' }} />
        <span>Deixar {f.apelido} escrever no chat da turma. Só os colegas da turma participam, num grupo único (sem mensagem privada). Você e o professor podem ler tudo, e {f.apelido} é avisado disso.</span>
      </label>
      <label className="linha small" style={{ gap: 8, fontWeight: 700, alignItems: 'flex-start' }}>
        <input type="checkbox" checked={!!f.mostrar_online} onChange={(ev) => void mudar('online', ev.target.checked)} style={{ width: 22, height: 22, flex: 'none' }} />
        <span>Mostrar para os colegas quando {f.apelido} está estudando agora.</span>
      </label>
      <button className="btn btn-escuro" style={{ minHeight: 40, fontSize: 15 }} onClick={() => void abrir()}>{ler ? 'Fechar a conversa' : 'Ler a conversa da turma'}</button>
      {erro && <div className="aviso aviso-erro small" role="alert">{erro}</div>}
      {ler && <><span className="muted small">As mensagens de {f.apelido} aparecem em azul. Mensagens com mais de 60 dias são apagadas sozinhas.</span><Conversa mensagens={ler} /></>}
    </div>
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

function ApagarConta({ token, temSenha, aoApagar }: { token: string; temSenha: boolean; aoApagar: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const apagar = async () => {
    setOcupado(true); setErro(null);
    const filhos = await api<{ filhos: Filho[] }>('/adulto/familia', { tokenProprio: token });
    const r = await api('/adulto/apagar-conta', { corpo: temSenha ? { senha } : { confirmar: senha }, tokenProprio: token });
    setOcupado(false);
    if (r.erro) return setErro(r.erro);
    esquecerContas((filhos.filhos ?? []).map((f) => f.id));
    aoApagar();
    ir();
  };
  return (
    <section className="coluna" aria-label="Minha conta" style={{ marginTop: 24 }}>
      <h2 className="display h3">Minha conta</h2>
      <a href="#/privacidade" className="small" style={{ color: 'var(--t-cyan)', fontWeight: 700 }}>Política de privacidade</a>
      {!aberto ? <button className="btn btn-escuro btn-bloco" onClick={() => setAberto(true)}>Apagar minha conta</button> : (
        <form className="aviso aviso-erro coluna" onSubmit={(ev) => { ev.preventDefault(); void apagar(); }}>
          <div style={{ fontWeight: 800 }}>Isto apaga para sempre:</div>
          <ul className="small" style={{ margin: 0, paddingLeft: 20, fontWeight: 700 }}>
            <li>sua conta e seu e-mail;</li>
            <li>os perfis das crianças da sua família, com cartas e progresso;</li>
            <li>as turmas que você criou. Crianças de outras famílias só saem da turma; as que não têm conta da família são apagadas.</li>
          </ul>
          <label htmlFor="ap-senha" className="small" style={rotulo}>{temSenha ? 'Digite sua senha para confirmar' : 'Escreva APAGAR para confirmar'}</label>
          <input id="ap-senha" style={campo} type={temSenha ? 'password' : 'text'} value={senha} onChange={(ev) => setSenha(ev.target.value)} autoComplete={temSenha ? 'current-password' : 'off'} />
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

interface ChatTurma { chat: number; chat_inicio: number; chat_fim: number; mostrar_online: number }
interface DadosTurma { turma: Turma; chat?: ChatTurma; avisos?: number; criancas: Kid[]; provas?: DatasProva }

const HORAS = Array.from({ length: 25 }, (_, h) => h);

/** O professor liga o chat, escolhe o horário, lê tudo, vê os avisos dos alunos e apaga mensagens. */
function ChatDaTurma({ token, id, chat, avisos, criancas, aoMudar }: { token: string; id: string; chat: ChatTurma; avisos: number; criancas: Kid[]; aoMudar: () => void }) {
  const [ler, setLer] = useState<{ mensagens: MsgAdulto[]; avisos: { mensagem_id: string; por: string | null }[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [apagar, setApagar] = useState<string | null>(null);
  const salvar = async (mud: Record<string, unknown>) => {
    const r = await api(`/adulto/turmas/${id}/chat`, { corpo: mud, tokenProprio: token });
    if (r.erro) setErro(r.erro); else { setErro(null); aoMudar(); }
  };
  const carregarConversa = async () => {
    const r = await api<{ mensagens: MsgAdulto[]; avisos: { mensagem_id: string; por: string | null }[] }>(`/adulto/turmas/${id}/chat`, { tokenProprio: token });
    if (r.erro) setErro(r.erro); else setLer(r);
  };
  const acao = async (m: MsgAdulto, qual: 'apagar' | 'ok') => {
    const r = await api(`/adulto/turmas/${id}/chat/${m.id}/${qual}`, { corpo: {}, tokenProprio: token });
    setApagar(null);
    if (r.erro) setErro(r.erro); else { await carregarConversa(); aoMudar(); }
  };
  const avisadas = new Set(ler?.avisos.map((v) => v.mensagem_id));
  const liberadas = criancas.filter((k) => k.chat_ok).length;
  const selectHora = (valor: number, campo: 'inicio' | 'fim') => (
    <select value={valor} onChange={(ev) => void salvar({ [campo]: Number(ev.target.value) })} style={{ font: 'inherit', fontWeight: 800, padding: '6px 8px', borderRadius: 10, border: '2px solid var(--ink)', background: 'var(--surface)' }}>
      {HORAS.map((h) => <option key={h} value={h}>{h}h</option>)}
    </select>
  );
  return (
    <section className="painel coluna" style={{ gap: 10 }} aria-label="Chat da turma">
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <h2 className="display h3" style={{ margin: 0 }}>Chat da turma</h2>
        {avisos > 0 && <span className="pilula" style={{ borderColor: 'var(--coral)', color: 'var(--t-coral)' }}>{avisos} {avisos > 1 ? 'avisos' : 'aviso'}</span>}
      </div>
      <p className="muted small" style={{ margin: 0 }}>
        Um grupo só com a turma (sem mensagem privada). Cada criança só escreve se o responsável autorizar na conta da família.
        O app bloqueia palavrões, telefones, endereços, links e redes sociais. Mensagens somem depois de 60 dias.
      </p>
      <label className="linha" style={{ gap: 8, fontWeight: 800 }}>
        <input type="checkbox" checked={!!chat.chat} onChange={(ev) => void salvar({ chat: ev.target.checked })} style={{ width: 24, height: 24 }} />
        Chat ligado para a turma
      </label>
      <div className="linha small" style={{ gap: 8, fontWeight: 700, flexWrap: 'wrap' }}>
        Aberto das {selectHora(chat.chat_inicio, 'inicio')} às {selectHora(chat.chat_fim, 'fim')} (horário de Brasília)
      </div>
      <label className="linha small" style={{ gap: 8, fontWeight: 700 }}>
        <input type="checkbox" checked={!!chat.mostrar_online} onChange={(ev) => void salvar({ online: ev.target.checked })} style={{ width: 22, height: 22 }} />
        Mostrar aos alunos quem está estudando agora
      </label>
      {!!chat.chat && <span className="small" style={{ fontWeight: 700 }}>{liberadas} de {criancas.length} {criancas.length === 1 ? 'criança liberada' : 'crianças liberadas'} pelos responsáveis.</span>}
      <button className="btn btn-escuro" style={{ minHeight: 42, fontSize: 15 }} onClick={() => (ler ? setLer(null) : void carregarConversa())}>{ler ? 'Fechar a conversa' : 'Ler a conversa'}</button>
      {erro && <div className="aviso aviso-erro small" role="alert">{erro}</div>}
      {ler && (
        <>
          <span className="muted small">Em vermelho: mensagens que algum aluno avisou. Mensagens apagadas continuam aqui (riscadas) só para os adultos.</span>
          <Conversa mensagens={ler.mensagens} avisadas={avisadas} acoes={(m) => m.apagada ? null : (
            apagar === m.id ? (
              <span className="linha" style={{ gap: 6, marginTop: 4 }}>
                <span className="small" style={{ fontWeight: 700 }}>Apagar para os alunos?</span>
                <button className="btn btn-vermelho" style={{ minHeight: 32, fontSize: 13, padding: '0 10px' }} onClick={() => void acao(m, 'apagar')}>Apagar</button>
                <button className="btn btn-escuro" style={{ minHeight: 32, fontSize: 13, padding: '0 10px' }} onClick={() => setApagar(null)}>Não</button>
              </span>
            ) : (
              <span className="linha" style={{ gap: 10, marginTop: 2 }}>
                <button className="chat-avisar" onClick={() => setApagar(m.id)}>Apagar</button>
                {avisadas.has(m.id) && <button className="chat-avisar" style={{ color: 'var(--t-green)' }} onClick={() => void acao(m, 'ok')}>Está tudo bem</button>}
              </span>
            ))} />
        </>
      )}
    </section>
  );
}

function DetalheTurma({ token, id }: { token: string; id: string }) {
  const [dados, setDados] = useState<DadosTurma | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pinNovo, setPinNovo] = useState<{ apelido: string; pin: string } | null>(null);
  const [remover, setRemover] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const carregar = () => api<DadosTurma>(`/adulto/turmas/${id}`, { tokenProprio: token }).then((r) => (r.erro ? setErro(r.erro) : setDados(r)));
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
  const silenciar = async (k: Kid, horas: number) => {
    const r = await api(`/adulto/turmas/${id}/criancas/${k.id}/silenciar`, { corpo: { horas }, tokenProprio: token });
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
        <div className="display" style={{ fontSize: 40, color: 'var(--t-yellow)', letterSpacing: '.04em', userSelect: 'all' }}>{turma.codigo}</div>
        <p className="small" style={{ margin: 0, fontWeight: 700, userSelect: 'all' }}>{convite}</p>
        <button className="btn btn-ciano" onClick={() => void copiar()}>{copiado ? 'Copiado!' : 'Copiar convite'}</button>
      </div>
      {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
      {pinNovo && (
        <div className="aviso aviso-ok" role="status">
          Novo PIN de <strong>{pinNovo.apelido}</strong>: <span className="display" style={{ fontSize: 24, color: 'var(--t-yellow)' }}>{pinNovo.pin}</span>
          <div className="small">Passe para a criança. Ele não aparece de novo.</div>
        </div>
      )}
      <DatasDasProvas token={token} rota={`/adulto/turmas/${id}/provas`} provas={dados.provas ?? {}} aoMudar={(p) => setDados({ ...dados, provas: p })}
        ajuda="Marque o dia da prova na escola. Antes da data, o capítulo aparece em destaque para as crianças. Depois, continua aberto e valendo para quem chegou depois ou quer revisar." />
      {dados.chat && <ChatDaTurma token={token} id={id} chat={dados.chat} avisos={dados.avisos ?? 0} criancas={criancas} aoMudar={() => void carregar()} />}
      <h2 className="display h3">{criancas.length} {criancas.length === 1 ? 'criança' : 'crianças'}</h2>
      {criancas.length === 0 && <p className="muted">Ninguém entrou ainda. Mande o convite acima.</p>}
      <div style={{ overflowX: 'auto' }}>
        <div className="coluna" style={{ gap: 8 }}>
          {criancas.map((k) => (
            <div key={k.id} className="painel coluna" style={{ padding: 12, gap: 8 }}>
              <div className="linha">
                <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: '50%', background: k.cor, display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', color: 'var(--ink)' }}>{k.apelido[0]?.toUpperCase()}</span>
                <span style={{ flex: 1 }}>
                  <span className="display" style={{ fontSize: 18, display: 'block' }}>{k.apelido}</span>
                  <span className="muted small">{k.online ? 'estudando agora · ' : ''}{k.xp_semana} XP na semana · {k.xp ?? 0} XP no total · {k.cartas} cartas · visto {quando(k.visto)}{k.bloqueado_ate > Date.now() ? ' · bloqueado por PIN errado' : ''}</span>
                  {dados.chat?.chat ? <span className="small" style={{ display: 'block', fontWeight: 700, color: k.mudo_ate > Date.now() ? 'var(--t-coral)' : k.chat_ok ? 'var(--t-green)' : 'var(--muted)' }}>
                    Chat: {k.mudo_ate > Date.now() ? `pausado até ${dataHora(k.mudo_ate)}` : k.chat_ok ? 'liberado pelo responsável' : k.familia ? 'responsável ainda não liberou' : 'sem conta da família (o responsável precisa criar para liberar)'}
                  </span> : null}
                </span>
              </div>
              {remover === k.id ? (
                <div className="linha" style={{ gap: 8 }}>
                  <span className="small" style={{ flex: 1, fontWeight: 700 }}>Remover {k.apelido}? {k.familia ? 'A criança tem conta da família: ela só sai da turma e continua com as cartas.' : 'As cartas e o progresso da conta serão apagados.'}</span>
                  <button className="btn btn-escuro" style={{ minHeight: 40, fontSize: 15 }} onClick={() => setRemover(null)}>Não</button>
                  <button className="btn btn-vermelho" style={{ minHeight: 40, fontSize: 15 }} onClick={() => void tirar(k)}>Remover</button>
                </div>
              ) : (
                <div className="linha" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-escuro" style={{ flex: 1, minHeight: 40, fontSize: 15 }} onClick={() => void novoPin(k)}>Novo PIN</button>
                  {!!dados.chat?.chat && !!k.chat_ok && (k.mudo_ate > Date.now()
                    ? <button className="btn btn-escuro" style={{ flex: 1, minHeight: 40, fontSize: 15 }} onClick={() => void silenciar(k, 0)}>Tirar a pausa</button>
                    : <button className="btn btn-escuro" style={{ flex: 1, minHeight: 40, fontSize: 15 }} onClick={() => void silenciar(k, 24)}>Pausar chat 1 dia</button>)}
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
