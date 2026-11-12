// Área dos adultos: conta da família (perfis dos filhos), turmas e apagar a conta.
import type { Uso } from '../shared/uso';
import { useEffect, useRef, useState } from 'react';
import { Icone } from '../components/Icone';
import { Bolinha } from '../components/Perfis';
import { EscolhaPeriodo, legendaDoPlacar, numeroDoPlacar } from '../components/Placar';
import { api, esquecerContas, getConta, usarPerfilDoAdulto } from '../lib/conta';
import { ir } from '../lib/rota';
import { botaoGoogle, entrarApple, lerConfig, type ConfigServidor } from '../lib/social';
import { getEstado, progressoDe, temProgressoSolto } from '../lib/store';
import { CORES } from './Inicio';
import { capitulosDe, conteudoPorId } from '../data';
import type { Capitulo } from '../data/tipos';
import { hoje } from '../lib/jogo';
import { diaMes, situacao, textoProva, type DatasProva } from '../lib/provas';

const K = 'sabidex:adulto';
const lerToken = () => { try { return localStorage.getItem(K); } catch { return null; } };
const tirarToken = () => { try { localStorage.removeItem(K); } catch { /* */ } };
const campo: React.CSSProperties = { font: 'inherit', fontWeight: 700, fontSize: 17, padding: '13px 14px', borderRadius: 14, border: '3px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)', width: '100%' };
const rotulo: React.CSSProperties = { fontWeight: 800 };
const botaoPequeno: React.CSSProperties = { flex: 1, minHeight: 40, fontSize: 15 };

interface Turma { id: string; nome: string; escola?: string; codigo: string; criancas: number; dono: string; sou_dono?: number; pedidos?: number }
interface TurmaDetalhe { id: string; nome: string; escola: string; na_busca: number; codigo: string; dono: boolean; conteudo?: string }
interface Kid { id: string; apelido: string; cor: string; xp: number | null; xp_semana: number; cartas: number; visto: number; bloqueado_ate: number; familia: number; chat_ok: number; mudo_ate: number; online: number }
interface Filho { id: string; apelido: string; cor: string; xp: number | null; cartas: number; visto: number; bloqueado_ate: number; turma: string | null; codigo: string | null; chat_ok: number; mostrar_online: number; turma_chat: number | null; conteudo?: string }

function quando(ms: number) {
  const d = Math.floor((Date.now() - ms) / 86_400_000);
  return d <= 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} dias`;
}

/**
 * Datas das provas da escola. Antes da data, o capítulo aparece em destaque para a criança;
 * depois, vai para "Já teve prova" e continua valendo XP e pacotes (para quem chegou depois ou quer revisar).
 */
function DatasDasProvas({ token, rota, provas, aoMudar, ajuda, capitulos }: { token: string; rota: string; provas: DatasProva; aoMudar: (p: DatasProva) => void; ajuda: string; capitulos: Capitulo[] }) {
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
      {!capitulos.length && <p className="muted small" style={{ margin: 0 }}>A turma ainda não tem matérias no Sabidex. Quando o livro dela entrar, as unidades aparecem aqui.</p>}
      {capitulos.map((c) => {
        const data = provas[c.id] ?? '';
        const t = textoProva(situacao(provas, c.id, dia));
        return (
          <label key={c.id} className="painel coluna" style={{ padding: 12, gap: 6 }}>
            <span style={rotulo}>{c.materia} · Unidade {c.numero}: {c.titulo}</span>
            <span className="linha" style={{ gap: 8 }}>
              <input type="date" value={data} onChange={(ev) => void salvar(c.id, ev.target.value)} style={{ ...campo, flex: 1, padding: '8px 10px' }} aria-label={`Data da prova da unidade ${c.numero}`} />
              {data && <button type="button" className="btn btn-escuro" style={{ minHeight: 40, fontSize: 15 }} onClick={() => void salvar(c.id, '')}>Tirar</button>}
            </span>
            <span className="muted small">{data ? `${t} (${diaMes(data)})` : 'Sem data'}</span>
          </label>
        );
      })}
    </section>
  );
}

/** Que livro a turma estuda (quem escolhe é o dono do app). Sem matérias, as crianças da turma não veem jogos. */
function MateriasDaTurma({ conteudo }: { conteudo?: string }) {
  const c = conteudoPorId(conteudo);
  return (
    <div className="painel coluna" style={{ gap: 4, borderColor: c ? undefined : 'var(--coral)' }}>
      <span style={rotulo}>Matérias da turma</span>
      {c
        ? <span className="small">{c.nome}: {[...new Set(c.capitulos.map((x) => x.materia))].join(', ')} ({c.capitulos.length} unidades).</span>
        : <span className="small">Ainda sem matérias. As crianças entram na turma, mas os jogos só aparecem quando o Sabidex colocar o livro desta turma. Fale com a gente.</span>}
    </div>
  );
}

/** Portão das lojas para apps infantis: uma conta rápida para adulto, antes da área dos adultos (mesmo com o adulto já logado no aparelho). */
let portaoAberto = false;
function Portao({ aoPassar }: { aoPassar: () => void }) {
  const [conta] = useState(() => { const a = 11 + Math.floor(Math.random() * 9), b = 3 + Math.floor(Math.random() * 3); return { a, b }; });
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

interface Eu { nome: string; email: string; admin: boolean; precisaAceite: boolean; temSenha: boolean; precisaConfirmar?: boolean }
const guardarToken = (t: string) => { try { localStorage.setItem(K, t); } catch { /* */ } };

export function Adulto({ turmaId }: { turmaId?: string }) {
  const [token, setToken] = useState(lerToken());
  const [eu, setEu] = useState<Eu | null>(null);
  const [passou, setPassou] = useState(portaoAberto);

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
        <button className="voltar voltar-topo" onClick={() => (turmaId ? ir('adulto') : ir())}><Icone nome="voltar" tamanho={18} espessura={3} />{turmaId ? 'Voltar' : 'Voltar ao app'}</button>
        {eu && <button className="voltar" onClick={() => void sair()}>Sair</button>}
      </div>
      {!passou ? <Portao aoPassar={() => setPassou(true)} />
        : !token ? <Acesso aoEntrar={entrou} /> : !eu ? <p className="muted">Carregando…</p>
        : eu.precisaAceite ? <AceitePendente token={token} aoAceitar={() => setEu({ ...eu, precisaAceite: false })} aoSair={sair} />
        : turmaId === 'dono' && eu.admin ? <PainelDono token={token} />
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

/** Aviso no painel enquanto o e-mail não foi confirmado (sem isso, não cria turma nem libera chat). */
function ConfirmeEmail({ token, email }: { token: string; email: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const reenviar = async () => {
    setOcupado(true);
    const r = await api<{ confirmado?: boolean }>('/adulto/confirmar-email/enviar', { corpo: {}, tokenProprio: token });
    setOcupado(false);
    if (r.erro) setMsg({ ok: false, texto: r.erro });
    else if (r.confirmado) location.reload();
    else setMsg({ ok: true, texto: 'Mandamos de novo. Olhe também a caixa de spam.' });
  };
  return (
    <div className="aviso aviso-atencao coluna" role="status" style={{ gap: 8 }}>
      <strong>Confirme seu e-mail</strong>
      <span className="small">Mandamos um link para <strong>{email}</strong>. Abra o link para poder criar turmas e liberar o chat da turma. É assim que sabemos que é um adulto.</span>
      {msg && <span className={`aviso ${msg.ok ? 'aviso-ok' : 'aviso-erro'}`} role="alert">{msg.texto}</span>}
      <button className="btn btn-escuro" style={{ alignSelf: 'flex-start', fontSize: 16, minHeight: 44 }} disabled={ocupado} onClick={() => void reenviar()}>{ocupado ? 'Mandando…' : 'Mandar o e-mail de novo'}</button>
    </div>
  );
}

/** Tela aberta pelo link do e-mail de confirmação. */
export function ConfirmarEmail({ token }: { token: string }) {
  const [estado, setEstado] = useState<'carregando' | 'ok' | string>('carregando');
  useEffect(() => {
    void api('/adulto/confirmar-email', { corpo: { token }, tokenProprio: null }).then((r) => setEstado(r.erro ?? 'ok'));
  }, [token]);
  return (
    <main className="tela" style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
      <div className="coluna">
        <div>
          <div className="eyebrow">Área dos adultos</div>
          <h1 className="display h1">{estado === 'ok' ? 'E-mail confirmado!' : 'Confirmar e-mail'}</h1>
        </div>
        {estado === 'carregando' ? <p className="muted">Confirmando…</p>
          : estado === 'ok' ? <p>Pronto. Agora você pode criar turmas e liberar o chat da turma para seus filhos.</p>
          : <div className="aviso aviso-erro" role="alert">{estado}</div>}
        <button className="btn btn-amarelo btn-bloco" onClick={() => ir('adulto')}>Ir para a área dos adultos</button>
      </div>
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
      {eu.admin && (
        <button className="painel-destaque linha" onClick={() => ir('adulto', 'dono')} style={{ textAlign: 'left', color: 'inherit' }}>
          <span style={{ flex: 1 }}>
            <span className="display" style={{ fontSize: 20, display: 'block' }}>Painel do dono do app</span>
            <span className="muted small">Quem usou o Sabidex, quem está sem turma e os pedidos esperando.</span>
          </span>
          <Icone nome="seguir" />
        </button>
      )}
      {eu.precisaConfirmar && <ConfirmeEmail token={token} email={eu.email} />}
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
  const [renomear, setRenomear] = useState<{ id: string; apelido: string } | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<PedidoFeito[]>([]);
  const carregar = () => {
    void api<{ pedidos: PedidoFeito[] }>('/adulto/pedidos', { tokenProprio: token }).then((r) => { if (!r.erro) setPedidos(r.pedidos); });
    return api<{ filhos: Filho[]; provas?: DatasProva; codigo?: string | null }>('/adulto/familia', { tokenProprio: token }).then((r) => {
      if (r.erro) setErro(r.erro); else { setFilhos(r.filhos); setProvas(r.provas ?? {}); setCodigo(r.codigo ?? null); if (r.filhos.length === 0) setForm((f) => (f === 'nenhum' ? 'novo' : f)); }
    });
  };
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
  const trocarApelido = async (f: Filho) => {
    if (!renomear) return;
    setErro(null);
    const r = await api<{ apelido: string }>(`/adulto/familia/${f.id}/apelido`, { corpo: { apelido: renomear.apelido }, tokenProprio: token });
    if (r.erro) return setErro(r.erro);
    setRenomear(null);
    setAviso(`Agora o apelido é ${r.apelido}.`);
    void carregar();
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
      {!!filhos?.length && codigo && <CodigoFamilia token={token} codigo={codigo} aoTrocar={setCodigo} />}
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
          ) : renomear?.id === f.id ? (
            <form className="aviso coluna" style={{ gap: 8 }} onSubmit={(ev) => { ev.preventDefault(); void trocarApelido(f); }}>
              <label htmlFor={`apelido-${f.id}`} className="small" style={{ fontWeight: 700 }}>Novo apelido <span className="muted">(não use o nome completo)</span></label>
              <input id={`apelido-${f.id}`} style={campo} value={renomear.apelido} maxLength={14} autoComplete="off" onChange={(ev) => setRenomear({ id: f.id, apelido: ev.target.value })} />
              <div className="linha" style={{ gap: 8 }}>
                <button type="button" className="btn btn-escuro" style={botaoPequeno} onClick={() => setRenomear(null)}>Cancelar</button>
                <button className="btn btn-amarelo" style={botaoPequeno} disabled={renomear.apelido.trim().length < 2}>Salvar</button>
              </div>
            </form>
          ) : (
            <div className="linha" style={{ gap: 8, flexWrap: 'wrap' }}>
              {contaAberta?.id !== f.id && <button className="btn btn-amarelo" style={botaoPequeno} onClick={() => setAbrir(f.id)}>Abrir neste aparelho</button>}
              <button className="btn btn-escuro" style={botaoPequeno} onClick={() => void novoPin(f)}>Novo PIN</button>
              <button className="btn btn-escuro" style={botaoPequeno} onClick={() => { setErro(null); setApagar(null); setAbrir(null); setRenomear({ id: f.id, apelido: f.apelido }); }}>Trocar apelido</button>
              {f.turma && <button className="btn btn-escuro" style={botaoPequeno} onClick={() => void sairTurma(f)}>Tirar da turma</button>}
              <button className="btn btn-escuro" style={botaoPequeno} onClick={() => setApagar(f.id)}>Apagar</button>
            </div>
          )}
          {abrir !== f.id && apagar !== f.id && <TurmaDoFilho token={token} f={f} pedidos={pedidos} aoMudar={(msg) => { setErro(null); if (msg) setAviso(msg); void carregar(); }} />}
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
        setAviso(`Perfil de ${apelido} criado! No aparelho da criança, toque em "Sou criança" e digite o código da família. Ou toque aqui em "Abrir neste aparelho".`);
        void carregar();
      }} />}
      {form === 'ligar' && <LigarConta token={token} aoFechar={() => setForm('nenhum')} aoLigar={() => { setForm('nenhum'); setAviso('Conta ligada à sua família.'); void carregar(); }} />}
      {!!filhos?.length && filhos.some((f) => f.codigo && capitulosDe(f.conteudo).length) && (
        <DatasDasProvas token={token} rota="/adulto/familia/provas" provas={provas} aoMudar={setProvas}
          capitulos={[...new Map(filhos.flatMap((f) => (f.codigo ? capitulosDe(f.conteudo) : [])).map((c) => [c.id, c])).values()]}
          ajuda="Marque o dia da prova na escola. Antes da data, a unidade aparece em destaque. Depois, continua valendo para revisar. Se a turma do professor marcar outra data, vale a da turma." />
      )}
    </section>
  );
}

/** Código da família: a criança digita no aparelho dela, toca no próprio nome e digita o PIN. */
function CodigoFamilia({ token, codigo, aoTrocar }: { token: string; codigo: string; aoTrocar: (c: string) => void }) {
  const [feito, setFeito] = useState<string | null>(null);
  const [trocar, setTrocar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const recado = `Código da nossa família no Sabidex: ${codigo}. Abra ${location.origin}, toque em "Sou criança" e digite o código. Depois é só tocar no seu nome e digitar o seu PIN.`;
  const enviar = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: 'Sabidex', text: recado }); return; }
    } catch (e) { if ((e as Error).name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(recado); setFeito('Copiado! Cole na conversa com a criança.'); } catch { setFeito(null); }
  };
  const novo = async () => {
    setErro(null);
    const r = await api<{ codigo: string }>('/adulto/familia/codigo', { corpo: {}, tokenProprio: token });
    setTrocar(false);
    if (r.erro) return setErro(r.erro);
    aoTrocar(r.codigo);
    setFeito('Código trocado. O antigo não funciona mais; quem já entrou continua entrando.');
  };
  return (
    <div className="painel coluna" style={{ gap: 8 }}>
      <span className="eyebrow">Código da família</span>
      <span className="display" style={{ fontSize: 30, letterSpacing: '.06em' }}>{codigo}</span>
      <span className="muted small">No aparelho da criança: "Sou criança" → este código → toca no nome → PIN. Com o código, dá para ver só os apelidos; para entrar, precisa do PIN de cada um.</span>
      {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
      {feito && <div className="aviso aviso-ok" role="status">{feito}</div>}
      {trocar ? (
        <div className="aviso coluna" style={{ gap: 8 }}>
          <span className="small" style={{ fontWeight: 700 }}>Trocar o código? Use se ele foi parar com quem não devia. O código antigo para de funcionar.</span>
          <div className="linha" style={{ gap: 8 }}>
            <button className="btn btn-escuro" style={botaoPequeno} onClick={() => setTrocar(false)}>Cancelar</button>
            <button className="btn btn-amarelo" style={botaoPequeno} onClick={() => void novo()}>Trocar</button>
          </div>
        </div>
      ) : (
        <div className="linha" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ciano" style={botaoPequeno} onClick={() => void enviar()}>Enviar para meu filho</button>
          <button className="btn btn-escuro" style={botaoPequeno} onClick={() => setTrocar(true)}>Trocar código</button>
        </div>
      )}
    </div>
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

interface NaTurma { id: string; apelido: string; cor: string; xp: number; cartas: number; vitorias: number; xp_total?: number; vitorias_total?: number; online: number }

/** Placar da turma do filho (da semana e desde o começo), igual ao que a criança vê (só leitura). */
function PlacarDaTurma({ lista, eu, apelido }: { lista: NaTurma[]; eu: string; apelido: string }) {
  const [aba, setAba] = useState<'xp' | 'cartas' | 'vitorias'>('xp');
  const [periodo, setPeriodo] = useState<'semana' | 'geral'>('semana');
  const num = (p: NaTurma) => numeroDoPlacar(p, aba, periodo);
  const unidade = (n: number) => (aba === 'xp' ? `${n} XP` : aba === 'cartas' ? `${n} ${n === 1 ? 'carta' : 'cartas'}` : `${n} ${n === 1 ? 'vitória' : 'vitórias'}`);
  const ordem = lista.slice().sort((a, b) => num(b) - num(a) || a.apelido.localeCompare(b.apelido));
  const agora = lista.filter((p) => p.online);
  return (
    <div className="coluna" style={{ gap: 8 }}>
      <span className="small" style={{ fontWeight: 700 }}>
        {agora.length ? `Estudando agora: ${agora.map((p) => p.apelido).join(', ')}.` : 'Ninguém da turma está estudando agora.'}
      </span>
      <EscolhaPeriodo periodo={periodo} mudar={setPeriodo} />
      <div className="linha" role="tablist" aria-label="O que contar" style={{ gap: 6 }}>
        {(['xp', 'cartas', 'vitorias'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={aba === k} onClick={() => setAba(k)} className={`btn ${aba === k ? 'btn-rosa' : 'btn-escuro'}`}
            style={{ flex: 1, minHeight: 40, fontSize: 14, padding: '4px 6px' }}>{{ xp: 'Mais XP', cartas: 'Mais cartas', vitorias: 'Duelos' }[k]}</button>
        ))}
      </div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
        {ordem.map((p, i) => {
          const meu = p.id === eu;
          return (
            <li key={p.id} className="linha" style={{ gap: 8, minHeight: 44, padding: '4px 10px', borderRadius: 12, background: meu ? '#CFFAFE' : 'var(--surface)', border: '2px solid var(--ink)' }}>
              <span className="display" style={{ width: 24, color: 'var(--muted)' }}>{i + 1}º</span>
              <Bolinha nome={p.apelido} cor={p.cor} tamanho={28} />
              <span style={{ flex: 1, minWidth: 0, fontWeight: 900, overflowWrap: 'anywhere' }}>
                {p.apelido}{meu ? ' (seu filho)' : ''}
                {!!p.online && <span className="small" style={{ display: 'block', fontWeight: 700, color: 'var(--t-green)' }}>Estudando agora</span>}
              </span>
              <span style={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{unidade(num(p))}</span>
            </li>
          );
        })}
      </ol>
      <span className="muted small">É o mesmo placar que {apelido} vê no app. {legendaDoPlacar(aba, periodo)}</span>
    </div>
  );
}

/** A turma do filho para o responsável: placar da semana, quem está estudando, a conversa e as permissões do chat. */
function ChatDoFilho({ token, f, aoMudar }: { token: string; f: Filho; aoMudar: () => void }) {
  const [aberto, setAberto] = useState<'turma' | 'chat' | null>(null);
  const [ler, setLer] = useState<MsgAdulto[] | null>(null);
  const [placar, setPlacar] = useState<{ eu: string; participantes: NaTurma[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const mudar = async (campo: 'chat' | 'online', valor: boolean) => {
    const r = await api(`/adulto/familia/${f.id}/chat`, { corpo: { [campo]: valor }, tokenProprio: token });
    if (r.erro) setErro(r.erro); else aoMudar();
  };
  const verChat = async () => {
    setErro(null);
    if (aberto === 'chat') return setAberto(null);
    const r = await api<{ mensagens: MsgAdulto[] }>(`/adulto/familia/${f.id}/chat`, { tokenProprio: token });
    if (r.erro) return setErro(r.erro);
    setLer(r.mensagens); setAberto('chat');
  };
  const verTurma = async () => {
    setErro(null);
    if (aberto === 'turma') return setAberto(null);
    const r = await api<{ eu: string; participantes: NaTurma[] }>(`/adulto/familia/${f.id}/turma`, { tokenProprio: token });
    if (r.erro) return setErro(r.erro);
    setPlacar(r); setAberto('turma');
  };
  const botao = { flex: 1, minHeight: 42, fontSize: 15, padding: '6px 10px' };
  return (
    <div className="coluna" style={{ gap: 8, borderTop: '2px dashed var(--line)', paddingTop: 8 }}>
      <span className="small" style={{ fontWeight: 900 }}>Turma {f.turma}</span>
      <div className="linha" style={{ gap: 8, flexWrap: 'wrap' }}>
        <button className={`btn ${aberto === 'turma' ? 'btn-escuro' : 'btn-ciano'}`} style={botao} onClick={() => void verTurma()}>{aberto === 'turma' ? 'Fechar a turma' : 'Ver a turma'}</button>
        <button className={`btn ${aberto === 'chat' ? 'btn-escuro' : 'btn-ciano'}`} style={botao} onClick={() => void verChat()}>{aberto === 'chat' ? 'Fechar o chat' : 'Ver o chat da turma'}</button>
      </div>
      {erro && <div className="aviso aviso-erro small" role="alert">{erro}</div>}
      {aberto === 'turma' && placar && <PlacarDaTurma lista={placar.participantes} eu={placar.eu} apelido={f.apelido} />}
      {aberto === 'chat' && ler && <><span className="muted small">As mensagens de {f.apelido} aparecem em azul. Mensagens com mais de 60 dias são apagadas sozinhas.</span><Conversa mensagens={ler} /></>}
      {!f.turma_chat && <span className="muted small">Os adultos da turma desligaram o chat desta turma. Se ligarem de novo, vale o que está marcado aqui.</span>}
      <label className="linha small" style={{ gap: 8, fontWeight: 700, alignItems: 'flex-start' }}>
        <input type="checkbox" checked={!!f.chat_ok} onChange={(ev) => void mudar('chat', ev.target.checked)} style={{ width: 22, height: 22, flex: 'none' }} />
        <span>Deixar {f.apelido} escrever no chat da turma (vem ligado; desmarque para desligar). Só os colegas da turma participam, num grupo único (sem mensagem privada). Você e o professor podem ler tudo, e {f.apelido} é avisado disso.</span>
      </label>
      <label className="linha small" style={{ gap: 8, fontWeight: 700, alignItems: 'flex-start' }}>
        <input type="checkbox" checked={!!f.mostrar_online} onChange={(ev) => void mudar('online', ev.target.checked)} style={{ width: 22, height: 22, flex: 'none' }} />
        <span>Mostrar para os colegas quando {f.apelido} está estudando agora.</span>
      </label>
    </div>
  );
}

function NovoFilho({ token, solto, aoFechar, aoCriar }: { token: string; solto: boolean; aoFechar: () => void; aoCriar: (id: string, apelido: string, levou: boolean) => void }) {
  const perfil = getEstado().perfil;
  const [apelido, setApelido] = useState(solto ? perfil?.nome ?? '' : '');
  const [cor, setCor] = useState(solto ? perfil?.cor ?? CORES[0] : CORES[0]);
  const [pin, setPin] = useState('');
  const [codigo, setCodigo] = useState('');
  const [levar, setLevar] = useState(solto);
  const [chat, setChat] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const e = getEstado();
  const criar = async () => {
    setOcupado(true); setErro(null);
    const r = await api<{ id: string }>('/adulto/familia', {
      corpo: { apelido, cor, pin, chat, ...(codigo.trim() ? { codigo } : {}), ...(levar ? { progresso: progressoDe(e), cartas: e.cartas } : {}) }, tokenProprio: token,
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
      <label htmlFor="f-codigo" className="small" style={rotulo}>Código da turma <span className="muted">(se o professor já passou; pode deixar vazio)</span></label>
      <input id="f-codigo" style={{ ...campo, letterSpacing: '.06em' }} placeholder="Ex.: ARARA-4821" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={codigo} onChange={(ev) => setCodigo(ev.target.value.toUpperCase())} />
      {solto && (
        <label className="linha small" style={{ gap: 10, alignItems: 'flex-start', fontWeight: 700 }}>
          <input type="checkbox" checked={levar} onChange={(ev) => setLevar(ev.target.checked)} style={{ width: 22, height: 22, flex: 'none', marginTop: 2 }} />
          <span>Levar o progresso que já está neste aparelho ({e.xp} XP, {Object.keys(e.cartas).length} Sabimons) e abrir o perfil aqui.</span>
        </label>
      )}
      <label className="linha small" style={{ gap: 10, alignItems: 'flex-start', fontWeight: 700 }}>
        <input type="checkbox" checked={chat} onChange={(ev) => setChat(ev.target.checked)} style={{ width: 22, height: 22, flex: 'none', marginTop: 2 }} />
        <span>Deixar usar o chat da turma <span className="muted">(vem ligado; desmarque para desligar)</span>. É um grupo só com os colegas da turma da escola, sem mensagem privada. Você e o professor leem tudo. Dá para mudar depois aqui na área dos adultos.</span>
      </label>
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
  const [chat, setChat] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const ligar = async () => {
    setErro(null);
    const r = await api('/adulto/familia/ligar', { corpo: { codigo, apelido, pin, chat }, tokenProprio: token });
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
      <label className="linha small" style={{ gap: 10, alignItems: 'flex-start', fontWeight: 700 }}>
        <input type="checkbox" checked={chat} onChange={(ev) => setChat(ev.target.checked)} style={{ width: 22, height: 22, flex: 'none', marginTop: 2 }} />
        <span>Deixar usar o chat da turma <span className="muted">(vem ligado; desmarque para desligar)</span>. É um grupo só com os colegas da turma da escola, sem mensagem privada. Você e o professor leem tudo. Dá para mudar depois aqui na área dos adultos.</span>
      </label>
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
  const [convite, setConvite] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [escola, setEscola] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const carregar = () => api<{ turmas: Turma[] }>('/adulto/turmas', { tokenProprio: token }).then((r) => (r.erro ? setErro(r.erro) : setTurmas(r.turmas)));
  useEffect(() => { void carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const criar = async () => {
    setErro(null);
    const r = await api<{ turma: Turma }>('/adulto/turmas', { corpo: { nome, escola }, tokenProprio: token });
    if (r.erro) return setErro(r.erro);
    setNome(''); setEscola('');
    ir('adulto', r.turma.id);
  };
  const usarConvite = async () => {
    setErro(null);
    const r = await api<{ turma: { id: string } }>('/adulto/convite', { corpo: { codigo: convite }, tokenProprio: token });
    if (r.erro) return setErro(r.erro);
    setConvite(null);
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
            <span className="muted small">{t.escola ? `${t.escola} · ` : ''}Código {t.codigo} · {t.criancas} {t.criancas === 1 ? 'criança' : 'crianças'}{admin || !t.sou_dono ? ` · criada por ${t.dono}` : ''}{!t.sou_dono && !admin ? ' · você é administrador' : ''}</span>
            {!!t.pedidos && <span className="small" style={{ display: 'block', fontWeight: 800, color: 'var(--t-coral)' }}>{t.pedidos === 1 ? '1 pedido para entrar' : `${t.pedidos} pedidos para entrar`}</span>}
          </span>
          <Icone nome="seguir" />
        </button>
      ))}
      {aberto ? (
        <form className="painel coluna" onSubmit={(ev) => { ev.preventDefault(); void criar(); }}>
          <h3 className="display h3" style={{ margin: 0 }}>Criar turma</h3>
          <label htmlFor="t-nome" style={rotulo}>Nome da turma</label>
          <input id="t-nome" style={campo} placeholder="Ex.: 4º ano B" value={nome} maxLength={50} onChange={(ev) => setNome(ev.target.value)} />
          <label htmlFor="t-escola-nova" style={rotulo}>Escola</label>
          <input id="t-escola-nova" style={campo} placeholder="Ex.: Colégio Educativa" value={escola} maxLength={60} onChange={(ev) => setEscola(ev.target.value)} />
          <span className="muted small">Com o nome da escola, os pais acham a turma na busca e pedem para o filho entrar. Você aprova cada pedido.</span>
          <TurmasParecidas token={token} busca={escola.trim() || nome.trim()} />
          <button className="btn btn-amarelo btn-bloco" disabled={nome.trim().length < 2}>Criar e gerar código</button>
        </form>
      ) : <button className="btn btn-escuro btn-bloco" onClick={() => setAberto(true)}>Criar turma</button>}
      {convite === null ? (
        <button className="btn btn-escuro btn-bloco" onClick={() => setConvite('')}>Tenho um convite para administrar uma turma</button>
      ) : (
        <form className="painel coluna" onSubmit={(ev) => { ev.preventDefault(); void usarConvite(); }}>
          <label htmlFor="t-convite" className="display h3">Convite de administrador</label>
          <span className="muted small">Quem criou a turma gera esse código e manda para você. Ele vale 7 dias e uma vez só.</span>
          <input id="t-convite" style={{ ...campo, textTransform: 'uppercase', letterSpacing: '.06em' }} placeholder="ADM-XXXX-XXXX" value={convite} maxLength={20} autoComplete="off" onChange={(ev) => setConvite(ev.target.value)} />
          <div className="linha" style={{ gap: 8 }}>
            <button type="button" className="btn btn-escuro" style={{ flex: 1 }} onClick={() => setConvite(null)}>Cancelar</button>
            <button className="btn btn-amarelo" style={{ flex: 1 }} disabled={convite.replace(/[^a-z0-9]/gi, '').length < 8}>Entrar</button>
          </div>
        </form>
      )}
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

/** Quem administra a turma. O dono convida (código) e remove; os outros podem sair. */
function Administradores({ token, id, nomeTurma }: { token: string; id: string; nomeTurma: string }) {
  const [dados, setDados] = useState<{ admins: { id: string; nome: string; dono: number }[]; eu: string; souDono: boolean } | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [tirar, setTirar] = useState<string | null>(null);
  const carregar = () => api<{ admins: { id: string; nome: string; dono: number }[]; eu: string; souDono: boolean }>(`/adulto/turmas/${id}/admins`, { tokenProprio: token })
    .then((r) => (r.erro ? setErro(r.erro) : setDados(r)));
  useEffect(() => { void carregar(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!dados) return null;
  const texto = codigo ? `Você foi convidado para ajudar a administrar a turma "${nomeTurma}" no Sabidex. Entre em ${location.origin}/, vá na área dos adultos, crie sua conta (se ainda não tiver) e, em Turmas, toque em "Tenho um convite" e digite o código ${codigo}. Vale 7 dias.` : '';
  const gerar = async () => {
    setErro(null);
    const r = await api<{ codigo: string }>(`/adulto/turmas/${id}/convite`, { corpo: {}, tokenProprio: token });
    if (r.erro) setErro(r.erro); else setCodigo(r.codigo);
  };
  const remover = async (aid: string) => {
    const r = await api(`/adulto/turmas/${id}/admins/${aid}`, { metodo: 'DELETE', tokenProprio: token });
    setTirar(null);
    if (r.erro) return setErro(r.erro);
    if (aid === dados.eu) ir('adulto'); else void carregar();
  };
  const copiar = async () => { try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2500); } catch { /* */ } };
  return (
    <section className="painel coluna" style={{ gap: 8 }} aria-label="Administradores">
      <h2 className="display h3" style={{ margin: 0 }}>Administradores</h2>
      <p className="muted small" style={{ margin: 0 }}>Podem ver as crianças, trocar PIN, marcar provas e cuidar do chat. Só quem criou a turma convida e remove administradores.</p>
      {dados.admins.map((x) => (
        <div key={x.id} className="linha" style={{ gap: 8 }}>
          <span style={{ flex: 1, fontWeight: 800 }}>{x.nome}{x.id === dados.eu ? ' (você)' : ''} <span className="muted small">· {x.dono ? 'criou a turma' : 'administrador'}</span></span>
          {!x.dono && (dados.souDono || x.id === dados.eu) && (tirar === x.id ? (
            <>
              <button className="btn btn-vermelho" style={{ minHeight: 34, fontSize: 13, padding: '0 10px' }} onClick={() => void remover(x.id)}>{x.id === dados.eu ? 'Sair' : 'Remover'}</button>
              <button className="btn btn-escuro" style={{ minHeight: 34, fontSize: 13, padding: '0 10px' }} onClick={() => setTirar(null)}>Não</button>
            </>
          ) : <button className="chat-avisar" onClick={() => setTirar(x.id)}>{x.id === dados.eu ? 'Sair da administração' : 'Remover'}</button>)}
        </div>
      ))}
      {dados.souDono && (codigo ? (
        <div className="aviso aviso-ok coluna" style={{ gap: 6 }}>
          <span className="small">Código de convite (vale 7 dias, uma vez só):</span>
          <span className="display" style={{ fontSize: 24, color: 'var(--t-yellow)', letterSpacing: '.04em', userSelect: 'all' }}>{codigo}</span>
          <span className="small" style={{ userSelect: 'all' }}>{texto}</span>
          <button className="btn btn-ciano" style={{ minHeight: 40, fontSize: 15 }} onClick={() => void copiar()}>{copiado ? 'Copiado!' : 'Copiar convite'}</button>
        </div>
      ) : <button className="btn btn-escuro" style={{ minHeight: 42, fontSize: 15 }} onClick={() => void gerar()}>Convidar administrador (professor ou outro responsável)</button>)}
      {erro && <div className="aviso aviso-erro small" role="alert">{erro}</div>}
    </section>
  );
}

interface ChatTurma { chat: number; chat_inicio: number; chat_fim: number; mostrar_online: number }
interface DadosTurma { turma: TurmaDetalhe; donoDoApp?: boolean; chat?: ChatTurma; avisos?: number; criancas: Kid[]; provas?: DatasProva; pedidos?: PedidoRecebido[] }

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
        Um grupo só com a turma (sem mensagem privada). O chat vem ligado. Só escreve quem tem conta da família, e cada responsável pode desligar para o filho.
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
      {!!chat.chat && <span className="small" style={{ fontWeight: 700 }}>{liberadas} de {criancas.length} {criancas.length === 1 ? 'criança pode' : 'crianças podem'} escrever (as outras foram desligadas pelo responsável ou não têm conta da família).</span>}
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
  const convite = `Entre no Sabidex pelo link ${link} e, em "Turma", toque em "Entrar na minha turma" e use o código ${turma.codigo}.`;

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
        {turma.escola && <div className="muted" style={{ fontWeight: 700 }}>{turma.escola}</div>}
      </div>
      <div className="painel-destaque coluna" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div className="muted small">Código da turma</div>
        <div className="display" style={{ fontSize: 40, color: 'var(--t-yellow)', letterSpacing: '.04em', userSelect: 'all' }}>{turma.codigo}</div>
        <p className="small" style={{ margin: 0, fontWeight: 700, userSelect: 'all' }}>{convite}</p>
        <button className="btn btn-ciano" onClick={() => void copiar()}>{copiado ? 'Copiado!' : 'Copiar convite'}</button>
      </div>
      {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
      <PedidosParaEntrar token={token} id={id} pedidos={dados.pedidos ?? []} aoMudar={() => void carregar()} />
      {pinNovo && (
        <div className="aviso aviso-ok" role="status">
          Novo PIN de <strong>{pinNovo.apelido}</strong>: <span className="display" style={{ fontSize: 24, color: 'var(--t-yellow)' }}>{pinNovo.pin}</span>
          <div className="small">Passe para a criança. Ele não aparece de novo.</div>
        </div>
      )}
      <MateriasDaTurma conteudo={turma.conteudo} />
      <DatasDasProvas token={token} rota={`/adulto/turmas/${id}/provas`} provas={dados.provas ?? {}} aoMudar={(p) => setDados({ ...dados, provas: p })} capitulos={capitulosDe(turma.conteudo)}
        ajuda="Marque o dia da prova na escola. Antes da data, a unidade aparece em destaque para as crianças. Depois, continua aberto e valendo para quem chegou depois ou quer revisar." />
      <Administradores token={token} id={id} nomeTurma={turma.nome} />
      <DadosDaTurma key={turma.id} token={token} turma={turma} criancas={criancas.length} aoMudar={(t) => setDados({ ...dados, turma: t })} />
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
                    Chat: {k.mudo_ate > Date.now() ? `pausado até ${dataHora(k.mudo_ate)}` : k.chat_ok ? 'ligado' : k.familia ? 'desligado pelo responsável' : 'sem conta da família (o responsável precisa criar para liberar)'}
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
      {dados.donoDoApp && <ApagarTurma token={token} turma={turma} criancas={criancas} />}
    </>
  );
}

/** Apagar a turma (Lucas, 05/11/2026): só o dono do app, porque não dá para desfazer. Escreve o nome para confirmar. */
function ApagarTurma({ token, turma, criancas }: { token: string; turma: TurmaDetalhe; criancas: Kid[] }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const soltas = criancas.filter((k) => !k.familia);
  const apagar = async () => {
    setOcupado(true); setErro(null);
    const r = await api(`/adulto/turmas/${turma.id}/apagar`, { corpo: { confirmar: nome }, tokenProprio: token });
    setOcupado(false);
    if (r.erro) return setErro(r.erro);
    ir('adulto');
  };
  if (!aberto) return <button className="btn btn-escuro btn-bloco" style={{ marginTop: 8 }} onClick={() => setAberto(true)}>Apagar esta turma</button>;
  return (
    <section className="aviso aviso-erro coluna" style={{ gap: 8, marginTop: 8 }} aria-label="Apagar a turma">
      <h2 className="display h3" style={{ margin: 0 }}>Apagar a turma {turma.nome}?</h2>
      <span className="small" style={{ fontWeight: 700 }}>
        {criancas.length
          ? <>{criancas.length === 1 ? 'A criança sai' : `As ${criancas.length} crianças saem`} da turma e {criancas.length === 1 ? 'continua' : 'continuam'} com as cartas, o XP e as Sabicoins na conta da família. Sem turma, não aparecem jogos até entrar em outra. </>
          : null}
        O código {turma.codigo} para de funcionar, e a conversa, as datas de prova e os administradores desta turma são apagados. Não dá para desfazer.
      </span>
      {soltas.length > 0 && (
        <span className="small" style={{ fontWeight: 800 }}>
          Antes, cuide de {soltas.map((k) => k.apelido).join(', ')}: {soltas.length === 1 ? 'não tem' : 'não têm'} conta da família. Mude de turma (Painel do dono) ou toque em "Remover" na lista acima.
        </span>
      )}
      <label htmlFor="apagar-nome" style={rotulo}>Para confirmar, escreva o nome da turma: {turma.nome}</label>
      <input id="apagar-nome" style={campo} value={nome} onChange={(ev) => setNome(ev.target.value)} autoComplete="off" />
      {erro && <div className="small" role="alert" style={{ fontWeight: 800 }}>{erro}</div>}
      <div className="linha" style={{ gap: 8 }}>
        <button className="btn btn-escuro" style={botaoPequeno} onClick={() => { setAberto(false); setNome(''); setErro(null); }}>Cancelar</button>
        <button className="btn btn-vermelho" style={botaoPequeno} disabled={ocupado || !nome.trim() || soltas.length > 0} onClick={() => void apagar()}>{ocupado ? 'Apagando…' : 'Apagar turma'}</button>
      </div>
    </section>
  );
}

/* ---------------- Procurar turma e pedir para entrar (Lucas, 05/11/2026) ---------------- */
// Só na área dos adultos. A busca mostra nome, escola e quantas crianças, nunca os apelidos.
// Um administrador da turma aprova. A criança leva junto as cartas, o XP e as Sabicoins.

interface TurmaAchada { id: string; nome: string; escola: string; dono: string; criancas: number; minha: number }
interface PedidoFeito {
  id: string; tipo: 'crianca' | 'juntar'; status: 'pendente' | 'aceito' | 'recusado'; criado: number; resolvido: number | null;
  crianca_id: string | null; origem_id: string | null; turma: string | null; escola: string | null; apelido: string | null; origem: string | null;
}
interface PedidoRecebido {
  id: string; tipo: 'crianca' | 'juntar'; criado: number; quem: string; apelido: string | null; cor: string | null; xp: number | null;
  origem: string | null; origem_escola: string | null; origem_criancas: number | null;
}

const comEscola = (nome: string | null, escola: string | null) => (escola ? `${nome ?? ''} · ${escola}` : nome ?? '');
const letras = (s: string) => s.replace(/[^a-z0-9]/gi, '').length;
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function useBuscaTurmas(token: string, q: string, excluir?: string) {
  const [achadas, setAchadas] = useState<TurmaAchada[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const vez = useRef(0);
  useEffect(() => {
    const minha = ++vez.current;
    if (letras(q) < 3) { setAchadas(null); return; }
    const espera = setTimeout(() => {
      void api<{ turmas: TurmaAchada[] }>(`/adulto/buscar-turmas?q=${encodeURIComponent(q)}`, { tokenProprio: token }).then((r) => {
        if (minha !== vez.current) return; // chegou uma busca mais nova
        if (r.erro) setErro(r.erro); else { setErro(null); setAchadas(r.turmas.filter((t) => t.id !== excluir)); }
      });
    }, 350);
    return () => clearTimeout(espera);
  }, [q, token, excluir]);
  return { achadas, erro };
}

function BuscarTurma({ token, titulo, ajuda, excluir, textoBotao, aoEscolher, aoFechar }: {
  token: string; titulo: string; ajuda: string; excluir?: string; textoBotao: string; aoEscolher: (t: TurmaAchada) => void; aoFechar: () => void;
}) {
  const [q, setQ] = useState('');
  const { achadas, erro } = useBuscaTurmas(token, q, excluir);
  return (
    <div className="painel coluna" style={{ gap: 8 }}>
      <label htmlFor="buscar-turma" className="display h3" style={{ margin: 0 }}>{titulo}</label>
      <span className="muted small">{ajuda}</span>
      <input id="buscar-turma" type="search" style={campo} placeholder="Ex.: Educativa 4º ano B" value={q} maxLength={60} autoComplete="off" onChange={(ev) => setQ(ev.target.value)} />
      {letras(q) > 0 && letras(q) < 3 && <span className="muted small">Digite pelo menos 3 letras.</span>}
      {erro && <div className="aviso aviso-erro small" role="alert">{erro}</div>}
      {achadas?.length === 0 && <div className="aviso small">Não achei nenhuma turma com esse nome. Confira o nome da escola, ou peça o código da turma para o professor.</div>}
      {achadas?.map((t) => (
        <div key={t.id} className="painel-destaque linha" style={{ gap: 10 }}>
          <span style={{ flex: 1 }}>
            <span className="display" style={{ fontSize: 18, display: 'block' }}>{t.nome}</span>
            <span className="muted small">{t.escola ? `${t.escola} · ` : ''}{plural(t.criancas, 'criança', 'crianças')}{t.dono ? ` · criada por ${t.dono}` : ''}{t.minha ? ' · você administra' : ''}</span>
          </span>
          <button className="btn btn-amarelo" style={{ minHeight: 40, fontSize: 15, padding: '0 12px' }} onClick={() => aoEscolher(t)}>{textoBotao}</button>
        </div>
      ))}
      <button type="button" className="btn btn-escuro" style={botaoPequeno} onClick={aoFechar}>Fechar</button>
    </div>
  );
}

/** Responsável: procura a turma e pede para o filho entrar. Mostra o pedido esperando resposta. */
function TurmaDoFilho({ token, f, pedidos, aoMudar }: { token: string; f: Filho; pedidos: PedidoFeito[]; aoMudar: (aviso?: string) => void }) {
  const [buscando, setBuscando] = useState(false);
  const [escolhida, setEscolhida] = useState<TurmaAchada | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const meus = pedidos.filter((p) => p.crianca_id === f.id);
  const esperando = meus.find((p) => p.status === 'pendente');
  const recusado = !esperando ? meus.find((p) => p.status === 'recusado') : undefined;

  const pedir = async () => {
    if (!escolhida) return;
    setOcupado(true); setErro(null);
    const r = await api<{ entrou: boolean; turma: string }>('/adulto/pedidos', { corpo: { turma: escolhida.id, crianca: f.id }, tokenProprio: token });
    setOcupado(false);
    if (r.erro) return setErro(r.erro);
    setEscolhida(null); setBuscando(false);
    aoMudar(r.entrou
      ? `${f.apelido} entrou na turma ${r.turma}. As cartas e o XP continuam.`
      : `Pedido enviado! Quando um administrador da turma ${r.turma} aprovar, ${f.apelido} entra com todas as cartas e o XP.`);
  };
  const cancelar = async (p: PedidoFeito) => {
    const r = await api(`/adulto/pedidos/${p.id}/cancelar`, { corpo: {}, tokenProprio: token });
    if (r.erro) setErro(r.erro); else aoMudar('Pedido cancelado.');
  };

  return (
    <>
      {esperando && (
        <div className="aviso linha" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span className="small" style={{ flex: 1, fontWeight: 700 }}>Pedido para entrar em <strong>{comEscola(esperando.turma, esperando.escola)}</strong> esperando um administrador da turma aprovar.</span>
          <button className="chat-avisar" onClick={() => void cancelar(esperando)}>Cancelar pedido</button>
        </div>
      )}
      {recusado && <div className="aviso small">A turma {comEscola(recusado.turma, recusado.escola)} não aceitou o pedido. Confira com o professor se é a turma certa.</div>}
      {erro && <div className="aviso aviso-erro small" role="alert">{erro}</div>}
      {escolhida ? (
        <div className="aviso coluna" style={{ gap: 8 }}>
          <span className="small" style={{ fontWeight: 700 }}>
            {escolhida.minha ? `Colocar ${f.apelido} na turma ${comEscola(escolhida.nome, escolhida.escola)}? Você administra essa turma, então ${f.apelido} entra na hora.`
              : `Pedir para ${f.apelido} entrar em ${comEscola(escolhida.nome, escolhida.escola)}? Um administrador da turma precisa aprovar. Ele vai ver seu primeiro nome e o apelido de ${f.apelido}.`}
            {' '}{f.apelido} leva junto todas as cartas, o XP e as Sabicoins.
            {f.turma ? ` Ao entrar, sai da turma ${f.turma} (trocas e duelos que estavam esperando são cancelados).` : ''}
          </span>
          <div className="linha" style={{ gap: 8 }}>
            <button className="btn btn-escuro" style={botaoPequeno} onClick={() => setEscolhida(null)}>Voltar</button>
            <button className="btn btn-amarelo" style={botaoPequeno} disabled={ocupado} onClick={() => void pedir()}>{ocupado ? 'Enviando…' : escolhida.minha ? 'Colocar na turma' : 'Pedir para entrar'}</button>
          </div>
        </div>
      ) : buscando ? (
        <BuscarTurma token={token} titulo={`Procurar a turma de ${f.apelido}`} textoBotao="Escolher" aoEscolher={setEscolhida} aoFechar={() => setBuscando(false)}
          ajuda="Digite o nome da escola ou da turma. Se a turma já existe, peça para entrar em vez de criar outra: assim os colegas ficam juntos." />
      ) : !esperando && (
        <button className="btn btn-ciano" style={{ minHeight: 40, fontSize: 15 }} onClick={() => setBuscando(true)}>{f.turma ? 'Trocar de turma' : 'Procurar a turma da escola'}</button>
      )}
    </>
  );
}

/** Mostra as turmas que já existem com nome parecido, para não criar uma repetida. */
function TurmasParecidas({ token, busca }: { token: string; busca: string }) {
  const { achadas } = useBuscaTurmas(token, busca);
  const outras = achadas?.filter((t) => !t.minha) ?? [];
  if (!outras.length) return null;
  return (
    <div className="aviso coluna" style={{ gap: 6 }}>
      <span className="small" style={{ fontWeight: 800 }}>Essa turma já existe? Encontrei {plural(outras.length, 'turma parecida', 'turmas parecidas')}:</span>
      {outras.slice(0, 5).map((t) => <span key={t.id} className="small">• {comEscola(t.nome, t.escola)} ({plural(t.criancas, 'criança', 'crianças')}{t.dono ? `, criada por ${t.dono}` : ''})</span>)}
      <span className="small">Se for a sua, não crie outra: os colegas ficariam separados. Responsável: use "Procurar a turma da escola" no perfil do seu filho. Professor: peça um convite de administrador para quem criou.</span>
    </div>
  );
}

/** Administradores aceitam ou recusam quem pediu para entrar. */
function PedidosParaEntrar({ token, id, pedidos, aoMudar }: { token: string; id: string; pedidos: PedidoRecebido[]; aoMudar: () => void }) {
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  if (!pedidos.length) return null;
  const responder = async (p: PedidoRecebido, acao: 'aceitar' | 'recusar') => {
    setOcupado(p.id); setErro(null);
    const r = await api(`/adulto/turmas/${id}/pedidos/${p.id}/${acao}`, { corpo: {}, tokenProprio: token });
    setOcupado(null);
    if (r.erro) setErro(r.erro);
    aoMudar();
  };
  return (
    <section className="painel coluna" style={{ gap: 8, borderColor: 'var(--coral)' }} aria-label="Pedidos para entrar">
      <h2 className="display h3" style={{ margin: 0 }}>{plural(pedidos.length, 'pedido', 'pedidos')} para entrar</h2>
      <p className="muted small" style={{ margin: 0 }}>Aceite só quem você sabe que é da turma. Quem entra traz as cartas e o XP que já tinha.</p>
      {erro && <div className="aviso aviso-erro small" role="alert">{erro}</div>}
      {pedidos.map((p) => (
        <div key={p.id} className="painel-destaque coluna" style={{ gap: 8 }}>
          {p.tipo === 'crianca' ? (
            <div className="linha" style={{ gap: 10 }}>
              <Bolinha nome={p.apelido ?? '?'} cor={p.cor ?? '#ccc'} tamanho={36} />
              <span style={{ flex: 1 }}>
                <span className="display" style={{ fontSize: 18, display: 'block' }}>{p.apelido}</span>
                <span className="muted small">Pedido de {p.quem || 'um responsável'} · {p.xp ?? 0} XP · {quando(p.criado)}</span>
              </span>
            </div>
          ) : (
            <span className="small" style={{ fontWeight: 700 }}>
              {p.quem || 'Um adulto'} quer juntar a turma <strong>{comEscola(p.origem, p.origem_escola)}</strong> com esta. As {plural(p.origem_criancas ?? 0, 'criança', 'crianças')} de lá entram aqui com as cartas e o XP, e aquela turma deixa de existir. Quem administra aquela turma não vira administrador desta.
            </span>
          )}
          <div className="linha" style={{ gap: 8 }}>
            <button className="btn btn-escuro" style={botaoPequeno} disabled={ocupado === p.id} onClick={() => void responder(p, 'recusar')}>Recusar</button>
            <button className="btn btn-verde" style={botaoPequeno} disabled={ocupado === p.id} onClick={() => void responder(p, 'aceitar')}>{p.tipo === 'crianca' ? 'Aceitar' : 'Juntar turmas'}</button>
          </div>
        </div>
      ))}
    </section>
  );
}

/** Escola, aparecer na busca e (para quem criou) juntar com outra turma repetida. */
function DadosDaTurma({ token, turma, criancas, aoMudar }: { token: string; turma: TurmaDetalhe; criancas: number; aoMudar: (t: TurmaDetalhe) => void }) {
  const [escola, setEscola] = useState(turma.escola);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [juntar, setJuntar] = useState<'nao' | 'buscar'>('nao');
  const [destino, setDestino] = useState<TurmaAchada | null>(null);
  const [pedido, setPedido] = useState<PedidoFeito | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const carregarPedido = () => api<{ pedidos: PedidoFeito[] }>('/adulto/pedidos', { tokenProprio: token })
    .then((r) => setPedido(r.pedidos?.find((p) => p.origem_id === turma.id && p.status === 'pendente') ?? null));
  useEffect(() => { if (turma.dono) void carregarPedido(); }, [turma.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const salvar = async (mudar: { escola?: string; na_busca?: boolean }) => {
    setErro(null); setSalvo(false);
    const r = await api<{ turma: TurmaDetalhe }>(`/adulto/turmas/${turma.id}/dados`, { corpo: mudar, tokenProprio: token });
    if (r.erro) return setErro(r.erro);
    aoMudar({ ...turma, ...r.turma, dono: turma.dono });
    if (mudar.escola !== undefined) { setSalvo(true); setTimeout(() => setSalvo(false), 2500); }
  };
  const pedirJuntar = async () => {
    if (!destino) return;
    setOcupado(true); setErro(null);
    const r = await api<{ entrou: boolean; turma: string }>('/adulto/pedidos', { corpo: { turma: destino.id, origem: turma.id }, tokenProprio: token });
    setOcupado(false);
    if (r.erro) return setErro(r.erro);
    setDestino(null); setJuntar('nao');
    if (r.entrou) ir('adulto', destino.id); else void carregarPedido();
  };
  const cancelar = async () => {
    if (!pedido) return;
    const r = await api(`/adulto/pedidos/${pedido.id}/cancelar`, { corpo: {}, tokenProprio: token });
    if (r.erro) setErro(r.erro); else setPedido(null);
  };

  return (
    <section className="painel coluna" style={{ gap: 8 }} aria-label="Escola e busca">
      <h2 className="display h3" style={{ margin: 0 }}>Escola e busca</h2>
      <form className="coluna" style={{ gap: 8 }} onSubmit={(ev) => { ev.preventDefault(); void salvar({ escola }); }}>
        <label htmlFor="t-escola" style={rotulo}>Nome da escola</label>
        <div className="linha" style={{ gap: 8 }}>
          <input id="t-escola" style={{ ...campo, flex: 1 }} placeholder="Ex.: Colégio Educativa" value={escola} maxLength={60} onChange={(ev) => setEscola(ev.target.value)} />
          <button className="btn btn-escuro" style={{ minHeight: 48, fontSize: 15, padding: '0 14px' }} disabled={escola.trim() === turma.escola}>{salvo ? 'Salvo!' : 'Salvar'}</button>
        </div>
      </form>
      <label className="linha small" style={{ gap: 8, fontWeight: 700 }}>
        <input type="checkbox" checked={!!turma.na_busca} onChange={(ev) => void salvar({ na_busca: ev.target.checked })} style={{ width: 22, height: 22, flex: 'none' }} />
        Os pais podem achar esta turma na busca e pedir para o filho entrar (você aprova cada pedido)
      </label>
      <span className="muted small">A busca mostra só o nome da turma, a escola e quantas crianças tem. Nunca os apelidos.</span>
      {turma.dono && (pedido ? (
        <div className="aviso linha" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span className="small" style={{ flex: 1, fontWeight: 700 }}>Pedido para juntar com <strong>{comEscola(pedido.turma, pedido.escola)}</strong> esperando um administrador de lá aprovar.</span>
          <button className="chat-avisar" onClick={() => void cancelar()}>Cancelar pedido</button>
        </div>
      ) : destino ? (
        <div className="aviso aviso-erro coluna" style={{ gap: 8 }}>
          <span className="small" style={{ fontWeight: 700 }}>
            Levar {criancas === 1 ? 'a criança' : `as ${criancas} crianças`} desta turma para <strong>{comEscola(destino.nome, destino.escola)}</strong>?
            {destino.minha ? ' Você administra as duas, então acontece na hora.' : ' Um administrador de lá precisa aprovar.'}
            {' '}Cada criança leva as cartas, o XP e as Sabicoins. Depois, esta turma ({turma.nome}) deixa de existir: o código {turma.codigo} para de funcionar e a conversa e as datas de prova dela são apagadas.
            {destino.minha ? '' : ' Você não vira administrador da outra turma (peça um convite para quem criou, se precisar).'}
          </span>
          <div className="linha" style={{ gap: 8 }}>
            <button className="btn btn-escuro" style={botaoPequeno} onClick={() => setDestino(null)}>Voltar</button>
            <button className="btn btn-vermelho" style={botaoPequeno} disabled={ocupado} onClick={() => void pedirJuntar()}>{ocupado ? 'Enviando…' : destino.minha ? 'Juntar agora' : 'Pedir para juntar'}</button>
          </div>
        </div>
      ) : juntar === 'buscar' ? (
        <BuscarTurma token={token} titulo="Com qual turma juntar?" excluir={turma.id} textoBotao="Juntar com esta" aoEscolher={setDestino} aoFechar={() => setJuntar('nao')}
          ajuda="Use quando criaram duas turmas para a mesma sala. As crianças desta turma vão para a outra, sem perder nada." />
      ) : (
        <button className="btn btn-escuro" style={{ minHeight: 42, fontSize: 15 }} onClick={() => setJuntar('buscar')}>Esta turma é repetida? Juntar com outra</button>
      ))}
      {erro && <div className="aviso aviso-erro small" role="alert">{erro}</div>}
    </section>
  );
}

/* ---------------- Painel do dono do app (Lucas, 05/11/2026) ---------------- */
// Só aparece para os e-mails em ADMIN_EMAILS (wrangler.jsonc). O servidor confere de novo.

interface DonoCrianca { id: string; apelido: string; cor: string; criado: number; visto: number; xp: number | null; turma_id: string | null; turma: string | null; escola: string | null; responsavel: string | null; responsavel_email: string | null; dias?: string[] }
interface DonoAdulto { id: string; nome: string; email: string; criado: number; visto: number; filhos: number; filhos_sem_turma: number; turmas: number; dias?: string[] }
interface DonoPedido { id: string; tipo: 'crianca' | 'juntar'; criado: number; turma_id: string; turma: string; escola: string; quem: string; apelido: string | null; cor: string | null; origem: string | null }
interface DonoResumo { adultos: number; adultos_novos: number; criancas: number; criancas_novas: number; sem_turma: number; ativas_hoje: number; ativas_semana: number; turmas: number; pedidos: number }
interface DonoTurma { id: string; nome: string; escola: string; codigo: string; conteudo: string; criancas: number }
interface DonoConteudo { id: string; nome: string; capitulos: number }
interface DonoDados { hoje: number; ontem: number; resumo: DonoResumo; criancas: DonoCrianca[]; adultos: DonoAdulto[]; pedidos: DonoPedido[]; turmas: DonoTurma[]; conteudos: DonoConteudo[] }

const FUSO = 'America/Sao_Paulo';
const diaDe = (ms: number) => new Date(ms).toLocaleDateString('pt-BR', { timeZone: FUSO });
/** "2026-11-04" no horário de Brasília (o mesmo formato dos dias que o servidor manda). */
const diaIso = (ms: number) => new Date(ms).toLocaleDateString('en-CA', { timeZone: FUSO });
/** Usou o app em algum dia de [de, ate]? Olha todos os dias em que usou, não só o último. */
const usouEntre = (x: { dias?: string[]; visto: number; criado: number }, de: string, ate: string) =>
  [...(x.dias ?? []), ...[x.visto, x.criado].filter((m) => m > 0).map(diaIso)].some((d) => d >= de && d <= ate);
/** "hoje, 14:32", "ontem, 09:10" ou "03/11, 18:00". */
function quandoFoi(ms: number) {
  if (!ms) return 'nunca';
  const hora = new Date(ms).toLocaleTimeString('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' });
  const d = diaDe(ms);
  if (d === diaDe(Date.now())) return `hoje, ${hora}`;
  if (d === diaDe(Date.now() - 86_400_000)) return `ontem, ${hora}`;
  return `${d.slice(0, 5)}, ${hora}`;
}

type Periodo = 'hoje' | 'ontem' | '7' | '30';
const PERIODOS: { id: Periodo; nome: string }[] = [{ id: 'hoje', nome: 'Hoje' }, { id: 'ontem', nome: 'Ontem' }, { id: '7', nome: '7 dias' }, { id: '30', nome: '30 dias' }];

function PainelDono({ token }: { token: string }) {
  const [dados, setDados] = useState<DonoDados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<'criancas' | 'adultos' | 'turmas' | 'pedidos' | 'uso'>('criancas');
  const [periodo, setPeriodo] = useState<Periodo>('7');
  const [semTurma, setSemTurma] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [colocando, setColocando] = useState<string | null>(null);
  const [destino, setDestino] = useState('');
  const [feito, setFeito] = useState<string | null>(null);
  const carregar = () => api<DonoDados>('/adulto/dono', { tokenProprio: token }).then((r) => (r.erro ? setErro(r.erro) : (setErro(null), setDados(r))));
  useEffect(() => { void carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!dados) return erro ? <div className="aviso aviso-erro" role="alert">{erro}</div> : <p className="muted">Carregando…</p>;
  const { resumo } = dados;
  const dia = (antes: number) => diaIso(dados.hoje + 12 * 3_600_000 - antes * 86_400_000);
  const [de, ate] = periodo === 'hoje' ? [dia(0), dia(0)] : periodo === 'ontem' ? [dia(1), dia(1)] : [dia(Number(periodo) - 1), dia(0)];
  const criancas = dados.criancas.filter((k) => usouEntre(k, de, ate) && (!semTurma || !k.turma_id));
  const adultos = dados.adultos.filter((x) => usouEntre(x, de, ate));

  const responder = async (p: DonoPedido, acao: 'aceitar' | 'recusar') => {
    setOcupado(p.id); setErro(null);
    const r = await api(`/adulto/turmas/${p.turma_id}/pedidos/${p.id}/${acao}`, { corpo: {}, tokenProprio: token });
    setOcupado(null);
    if (r.erro) setErro(r.erro);
    void carregar();
  };

  const colocar = async (k: DonoCrianca) => {
    setOcupado(k.id); setErro(null); setFeito(null);
    const r = await api<{ turma: string }>(`/adulto/dono/criancas/${k.id}/turma`, { corpo: { turma: destino }, tokenProprio: token });
    setOcupado(null);
    if (r.erro) return setErro(r.erro);
    setColocando(null); setDestino('');
    setFeito(`${k.apelido} agora está na turma ${r.turma}, com todas as cartas e o XP.`);
    void carregar();
  };

  const mudarMaterias = async (t: DonoTurma, conteudo: string) => {
    setOcupado(t.id); setErro(null); setFeito(null);
    const r = await api(`/adulto/dono/turmas/${t.id}/conteudo`, { corpo: { conteudo }, tokenProprio: token });
    setOcupado(null);
    if (r.erro) return setErro(r.erro);
    setFeito(conteudo ? `A turma ${t.nome} agora estuda: ${dados.conteudos.find((x) => x.id === conteudo)?.nome}.` : `A turma ${t.nome} ficou sem matérias: as crianças dela não veem jogos.`);
    void carregar();
  };

  const numero = (n: number, texto: string, alerta = false) => (
    <div className="painel coluna" style={{ gap: 2, padding: 12, flex: '1 1 140px' }}>
      <span className="display" style={{ fontSize: 28, color: alerta && n ? 'var(--t-coral)' : undefined }}>{n}</span>
      <span className="small" style={{ fontWeight: 700 }}>{texto}</span>
    </div>
  );

  return (
    <>
      <div>
        <div className="eyebrow">Só você vê isto</div>
        <h1 className="display h1">Painel do dono</h1>
      </div>
      <div className="linha" style={{ flexWrap: 'wrap', gap: 8 }}>
        {numero(resumo.ativas_hoje, 'crianças usaram hoje')}
        {numero(resumo.ativas_semana, 'crianças nos últimos 7 dias')}
        {numero(resumo.sem_turma, 'crianças só na família, sem turma', true)}
        {numero(resumo.pedidos, 'pedidos esperando aprovação', true)}
        {numero(resumo.adultos, `adultos (${resumo.adultos_novos} novos em 7 dias)`)}
        {numero(resumo.turmas, 'turmas')}
      </div>
      {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
      {feito && <div className="aviso" role="status">{feito}</div>}

      <div className="abas" role="tablist" aria-label="O que ver" style={{ flexWrap: 'wrap' }}>
        <button role="tab" aria-selected={aba === 'criancas'} onClick={() => setAba('criancas')}>Crianças</button>
        <button role="tab" aria-selected={aba === 'adultos'} onClick={() => setAba('adultos')}>Adultos</button>
        <button role="tab" aria-selected={aba === 'turmas'} onClick={() => setAba('turmas')}>Turmas</button>
        <button role="tab" aria-selected={aba === 'pedidos'} onClick={() => setAba('pedidos')}>Pedidos{dados.pedidos.length ? ` (${dados.pedidos.length})` : ''}</button>
        <button role="tab" aria-selected={aba === 'uso'} onClick={() => setAba('uso')}>Como usam</button>
      </div>

      {(aba === 'criancas' || aba === 'adultos') && (
        <div className="linha" style={{ flexWrap: 'wrap', gap: 8 }}>
          {PERIODOS.map((p) => <button key={p.id} className="filtro" aria-pressed={periodo === p.id} onClick={() => setPeriodo(p.id)}>{p.nome}</button>)}
          {aba === 'criancas' && <button className="filtro" aria-pressed={semTurma} onClick={() => setSemTurma(!semTurma)}>Só sem turma</button>}
        </div>
      )}

      {aba === 'criancas' && (
        <section className="coluna" style={{ gap: 8 }} aria-label="Crianças que usaram o app">
          <p className="muted small" style={{ margin: 0 }}>{plural(criancas.length, 'criança usou', 'crianças usaram')} o app nesse período. "Sem turma" quer dizer que a criança está só na conta da família: ela não vê jogos até entrar numa turma.</p>
          {criancas.map((k) => (
            <div key={k.id} className="painel-destaque coluna" style={{ gap: 8 }}>
              <div className="linha" style={{ gap: 10, cursor: k.turma_id ? 'pointer' : undefined }} onClick={() => k.turma_id && ir('adulto', k.turma_id)}>
                <Bolinha nome={k.apelido} cor={k.cor} tamanho={36} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="display" style={{ fontSize: 18, display: 'block' }}>{k.apelido}</span>
                  <span className="small" style={{ display: 'block', fontWeight: 800, color: k.turma_id ? undefined : 'var(--t-coral)' }}>{k.turma_id ? `Turma ${comEscola(k.turma, k.escola)}` : 'Sem turma (só na família)'}</span>
                  <span className="muted small" style={{ display: 'block', overflowWrap: 'anywhere' }}>
                    Última vez {quandoFoi(k.visto)}{k.dias && k.dias.length > 1 ? ` · usou em ${k.dias.length} dias` : ''} · {k.xp ?? 0} XP · conta criada {quandoFoi(k.criado)}
                    {k.responsavel ? ` · responsável ${k.responsavel} (${k.responsavel_email})` : ' · sem responsável (entrou só pela turma)'}
                  </span>
                </span>
                {k.turma_id && <Icone nome="seguir" />}
              </div>
              {colocando === k.id ? (
                <div className="coluna" style={{ gap: 8 }}>
                  <label htmlFor={`destino-${k.id}`} style={rotulo}>{k.turma_id ? 'Mudar para a turma' : 'Colocar na turma'}</label>
                  <select id={`destino-${k.id}`} style={campo} value={destino} onChange={(ev) => setDestino(ev.target.value)}>
                    <option value="">Escolha a turma…</option>
                    {dados.turmas.filter((t) => t.id !== k.turma_id).map((t) => <option key={t.id} value={t.id}>{comEscola(t.nome, t.escola)} ({plural(t.criancas, 'criança', 'crianças')})</option>)}
                  </select>
                  <span className="muted small">{k.apelido} leva junto as cartas, o XP e as Sabicoins.{k.responsavel ? ' O responsável não precisa aprovar.' : ''}</span>
                  <div className="linha" style={{ gap: 8 }}>
                    <button className="btn btn-escuro" style={botaoPequeno} onClick={() => { setColocando(null); setDestino(''); }}>Cancelar</button>
                    <button className="btn btn-verde" style={botaoPequeno} disabled={!destino || ocupado === k.id} onClick={() => void colocar(k)}>Confirmar</button>
                  </div>
                </div>
              ) : (
                <button className={`btn ${k.turma_id ? 'btn-escuro' : 'btn-amarelo'}`} style={{ minHeight: 40, fontSize: 15 }} onClick={() => { setColocando(k.id); setDestino(''); setFeito(null); }}>
                  {k.turma_id ? 'Mudar de turma' : 'Colocar numa turma'}
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      {aba === 'adultos' && (
        <section className="coluna" style={{ gap: 8 }} aria-label="Adultos">
          <p className="muted small" style={{ margin: 0 }}>{plural(adultos.length, 'adulto entrou ou criou conta', 'adultos entraram ou criaram conta')} nesse período.</p>
          {adultos.map((x) => (
            <div key={x.id} className="painel-destaque coluna" style={{ gap: 2 }}>
              <span className="display" style={{ fontSize: 18 }}>{x.nome}</span>
              <span className="muted small" style={{ overflowWrap: 'anywhere' }}>{x.email}</span>
              <span className="small" style={{ fontWeight: 700 }}>
                Última vez {quandoFoi(x.visto)} · conta criada {quandoFoi(x.criado)}
              </span>
              <span className="small" style={{ fontWeight: 700 }}>
                {plural(x.filhos, 'filho', 'filhos')}
                {x.filhos_sem_turma ? <span style={{ color: 'var(--t-coral)' }}> ({x.filhos_sem_turma} sem turma)</span> : null}
                {` · ${plural(x.turmas, 'turma', 'turmas')} que administra`}
              </span>
            </div>
          ))}
        </section>
      )}

      {aba === 'turmas' && (
        <section className="coluna" style={{ gap: 8 }} aria-label="Matérias de cada turma">
          <p className="muted small" style={{ margin: 0 }}>Cada turma estuda o livro dela. Escolha as matérias de cada turma. Turma "sem matérias" não mostra jogos para as crianças (elas só veem o álbum). Turma nova começa sem matérias.</p>
          {dados.turmas.map((t) => (
            <div key={t.id} className="painel-destaque coluna" style={{ gap: 8 }}>
              <div className="linha" style={{ gap: 10, cursor: 'pointer' }} onClick={() => ir('adulto', t.id)}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="display" style={{ fontSize: 18, display: 'block' }}>{comEscola(t.nome, t.escola)}</span>
                  <span className="muted small">Código {t.codigo} · {plural(t.criancas, 'criança', 'crianças')}</span>
                </span>
                <Icone nome="seguir" />
              </div>
              <label htmlFor={`materias-${t.id}`} style={rotulo}>Matérias</label>
              <select id={`materias-${t.id}`} style={{ ...campo, borderColor: t.conteudo ? undefined : 'var(--coral)' }} value={t.conteudo} disabled={ocupado === t.id}
                onChange={(ev) => void mudarMaterias(t, ev.target.value)}>
                <option value="">Sem matérias (não mostra jogos)</option>
                {dados.conteudos.map((x) => <option key={x.id} value={x.id}>{x.nome} ({plural(x.capitulos, 'unidade', 'unidades')})</option>)}
              </select>
            </div>
          ))}
        </section>
      )}

      {aba === 'pedidos' && (
        <section className="coluna" style={{ gap: 8 }} aria-label="Pedidos para entrar">
          {!dados.pedidos.length && <p className="muted" style={{ margin: 0 }}>Nenhum pedido esperando.</p>}
          {dados.pedidos.map((p) => (
            <div key={p.id} className="painel-destaque coluna" style={{ gap: 8 }}>
              <span className="small" style={{ fontWeight: 700 }}>
                {p.tipo === 'crianca'
                  ? <>{p.quem} pediu para <strong>{p.apelido}</strong> entrar na turma <strong>{comEscola(p.turma, p.escola)}</strong></>
                  : <>{p.quem} pediu para juntar a turma <strong>{p.origem}</strong> com <strong>{comEscola(p.turma, p.escola)}</strong></>}
                <span className="muted"> · {quandoFoi(p.criado)}</span>
              </span>
              <div className="linha" style={{ gap: 8 }}>
                <button className="btn btn-escuro" style={botaoPequeno} disabled={ocupado === p.id} onClick={() => void responder(p, 'recusar')}>Recusar</button>
                <button className="btn btn-verde" style={botaoPequeno} disabled={ocupado === p.id} onClick={() => void responder(p, 'aceitar')}>{p.tipo === 'crianca' ? 'Aceitar' : 'Juntar turmas'}</button>
              </div>
            </div>
          ))}
        </section>
      )}
      {aba === 'uso' && <PainelUso token={token} />}
      {aba !== 'uso' && <button className="btn btn-escuro btn-bloco" onClick={() => void carregar()}>Atualizar</button>}
    </>
  );
}

/** "Como usam" (Lucas, 05/11/2026): números somados de todas as crianças, sem dizer quem é quem. */
function PainelUso({ token }: { token: string }) {
  const [uso, setUso] = useState<Uso | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const carregar = () => api<Uso>('/adulto/dono/uso', { tokenProprio: token }).then((r) => (r.erro ? setErro(r.erro) : (setErro(null), setUso(r))));
  useEffect(() => { void carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!uso) return erro ? <div className="aviso aviso-erro" role="alert">{erro}</div> : <p className="muted">Carregando…</p>;
  const pct = (n: number, de: number) => (de ? `${Math.round((n / de) * 100)}%` : '0%');
  const celula = { padding: '6px 4px', borderBottom: '1px solid var(--line)', textAlign: 'right' as const };
  return (
    <section className="coluna" style={{ gap: 12 }} aria-label="Como as crianças usam o app">
      <p className="muted small" style={{ margin: 0 }}>
        Números de todas as {uso.criancas} crianças com conta, somados. Não mostra quem é quem. Quem joga só no aparelho, sem conta, não entra aqui.
      </p>

      <div className="painel coluna" style={{ gap: 6, padding: 12 }}>
        <h2 className="display" style={{ fontSize: 20, margin: 0 }}>Estudo</h2>
        <span className="small" style={{ fontWeight: 700 }}>{uso.estudaram} de {uso.criancas} fizeram pelo menos uma fase ({pct(uso.estudaram, uso.criancas)})</span>
        <span className="small" style={{ fontWeight: 700 }}>{uso.voltaram} estudaram em 2 dias ou mais ({pct(uso.voltaram, uso.criancas)})</span>
        <span className="small" style={{ fontWeight: 700 }}>Quem estuda, estuda em média {String(uso.mediaDias).replace('.', ',')} dias</span>
      </div>

      <div className="painel coluna" style={{ gap: 6, padding: 12 }}>
        <h2 className="display" style={{ fontSize: 20, margin: 0 }}>Partes do app que usam</h2>
        <p className="muted small" style={{ margin: 0 }}>Quantas crianças já usaram cada parte pelo menos uma vez. Número baixo pode querer dizer que a criança não achou o botão ou não entendeu para que serve.</p>
        {[...uso.recursos].sort((x, y) => y.criancas - x.criancas).map((r) => (
          <div key={r.nome} className="linha" style={{ gap: 8 }}>
            <span className="small" style={{ flex: 1, fontWeight: 700 }}>{r.nome}</span>
            <span className="small" style={{ fontWeight: 800 }}>{r.criancas} ({pct(r.criancas, uso.criancas)})</span>
          </div>
        ))}
      </div>

      {uso.capitulos.map((c) => (
        <div key={c.id} className="painel coluna" style={{ gap: 6, padding: 12 }}>
          <h2 className="display" style={{ fontSize: 18, margin: 0 }}>{c.nome}</h2>
          <span className="muted small">{plural(c.comecaram, 'criança começou', 'crianças começaram')} esta unidade.</span>
          {c.comecaram > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="small" style={{ width: '100%', borderCollapse: 'collapse', fontWeight: 700 }}>
                <thead>
                  <tr>
                    <th style={{ ...celula, textAlign: 'left' }}>Fase</th>
                    <th style={celula}>Terminaram</th>
                    <th style={celula}>Nota média</th>
                    <th style={celula}>Abaixo de 7</th>
                  </tr>
                </thead>
                <tbody>
                  {c.itens.map((i) => {
                    const pouco = i.fizeram < c.comecaram / 2;
                    const dificil = i.media !== null && i.media < 7;
                    return (
                      <tr key={i.nome}>
                        <td style={{ ...celula, textAlign: 'left' }}>{i.nome}</td>
                        <td style={{ ...celula, color: pouco ? 'var(--t-coral)' : undefined }}>{i.fizeram} ({pct(i.fizeram, c.comecaram)})</td>
                        <td style={{ ...celula, color: dificil ? 'var(--t-coral)' : undefined }}>{i.media === null ? '–' : String(i.media).replace('.', ',')}</td>
                        <td style={celula}>{i.media === null ? '–' : i.abaixo7}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      <p className="muted small" style={{ margin: 0 }}>
        Em vermelho: fase que menos da metade de quem começou terminou (pode estar difícil ou escondida) ou com nota média abaixo de 7. A nota é a melhor vez de cada criança.
      </p>
      {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
      <button className="btn btn-escuro btn-bloco" onClick={() => void carregar()}>Atualizar</button>
    </section>
  );
}
