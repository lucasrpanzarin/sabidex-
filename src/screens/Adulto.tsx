// Área dos pais e professores: criar turmas, ver as crianças, trocar PIN e remover.
import { useEffect, useState } from 'react';
import { Icone } from '../components/Icone';
import { api } from '../lib/conta';
import { ir } from '../lib/rota';

const K = 'sabidex:adulto';
const lerToken = () => { try { return localStorage.getItem(K); } catch { return null; } };
const campo: React.CSSProperties = { font: 'inherit', fontWeight: 700, fontSize: 17, padding: '13px 14px', borderRadius: 14, border: '1.5px solid var(--line-2)', background: 'var(--surface)', color: 'var(--ink)', width: '100%' };

interface Turma { id: string; nome: string; codigo: string; criancas: number; dono: string }
interface Kid { id: string; apelido: string; cor: string; xp: number | null; xp_semana: number; cartas: number; visto: number; bloqueado_ate: number }

function quando(ms: number) {
  const d = Math.floor((Date.now() - ms) / 86_400_000);
  return d <= 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} dias`;
}

export function Adulto({ turmaId }: { turmaId?: string }) {
  const [token, setToken] = useState(lerToken());
  const [eu, setEu] = useState<{ nome: string; email: string; admin: boolean } | null>(null);

  useEffect(() => {
    if (!token) return;
    void api<{ adulto: { nome: string; email: string; admin: boolean } }>('/adulto/eu', { tokenProprio: token }).then((r) => {
      if (r.erro) { if (r.status === 401) { try { localStorage.removeItem(K); } catch { /* */ } setToken(null); } }
      else setEu(r.adulto);
    });
  }, [token]);

  const entrou = (t: string) => { try { localStorage.setItem(K, t); } catch { /* */ } setToken(t); };
  const sair = async () => { await api('/adulto/sair', { corpo: {}, tokenProprio: token }); try { localStorage.removeItem(K); } catch { /* */ } setToken(null); setEu(null); };

  return (
    <main className="tela" style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <button className="voltar" onClick={() => (turmaId ? ir('adulto') : ir())}><Icone nome="voltar" tamanho={18} espessura={3} />{turmaId ? 'Minhas turmas' : 'Voltar ao app'}</button>
        {eu && <button className="voltar" onClick={() => void sair()}>Sair</button>}
      </div>
      {!token ? <Acesso aoEntrar={entrou} /> : !eu ? <p className="muted">Carregando…</p>
        : turmaId ? <DetalheTurma token={token} id={turmaId} /> : <Painel token={token} eu={eu} />}
    </main>
  );
}

function Acesso({ aoEntrar }: { aoEntrar: (t: string) => void }) {
  const [modo, setModo] = useState<'entrar' | 'cadastro'>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const enviar = async () => {
    setOcupado(true); setErro(null);
    const r = await api<{ token: string }>(`/adulto/${modo}`, { corpo: { nome, email, senha }, tokenProprio: null });
    setOcupado(false);
    if (r.erro) setErro(r.erro); else aoEntrar(r.token);
  };
  return (
    <>
      <div>
        <div className="eyebrow">Área dos adultos</div>
        <h1 className="display h1">Pais e professores</h1>
        <p className="muted" style={{ margin: '6px 0 0' }}>Crie uma turma, mande o código para as crianças e acompanhe quem está estudando.</p>
      </div>
      <div className="linha" role="tablist" style={{ gap: 8 }}>
        {(['entrar', 'cadastro'] as const).map((m) => <button key={m} role="tab" aria-selected={modo === m} className={`btn ${modo === m ? 'btn-ciano' : 'btn-escuro'}`} style={{ flex: 1, fontSize: 17, minHeight: 46 }} onClick={() => { setModo(m); setErro(null); }}>{m === 'entrar' ? 'Entrar' : 'Criar conta'}</button>)}
      </div>
      <form className="coluna" onSubmit={(ev) => { ev.preventDefault(); void enviar(); }}>
        {modo === 'cadastro' && <><label htmlFor="a-nome" className="small" style={{ fontWeight: 800 }}>Seu nome</label><input id="a-nome" style={campo} value={nome} onChange={(ev) => setNome(ev.target.value)} autoComplete="name" /></>}
        <label htmlFor="a-email" className="small" style={{ fontWeight: 800 }}>E-mail</label>
        <input id="a-email" style={campo} type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} autoComplete="email" />
        <label htmlFor="a-senha" className="small" style={{ fontWeight: 800 }}>Senha {modo === 'cadastro' && <span className="muted">(pelo menos 8 caracteres)</span>}</label>
        <input id="a-senha" style={campo} type="password" value={senha} onChange={(ev) => setSenha(ev.target.value)} autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} />
        {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
        <button className="btn btn-amarelo btn-bloco" disabled={ocupado}>{ocupado ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}</button>
        <p className="muted small" style={{ margin: 0 }}>Seu e-mail serve só para entrar na conta. Das crianças, o Sabidex guarda apenas apelido, cor e progresso no jogo.</p>
      </form>
    </>
  );
}

function Painel({ token, eu }: { token: string; eu: { nome: string; admin: boolean } }) {
  const [turmas, setTurmas] = useState<Turma[] | null>(null);
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
    <>
      <div>
        <div className="eyebrow">Olá, {eu.nome}{eu.admin ? ' · administrador' : ''}</div>
        <h1 className="display h1">Minhas turmas</h1>
      </div>
      <form className="painel coluna" onSubmit={(ev) => { ev.preventDefault(); void criar(); }}>
        <label htmlFor="t-nome" className="display h3">Criar turma</label>
        <input id="t-nome" style={campo} placeholder='Ex.: 4º ano B · Colégio X' value={nome} maxLength={50} onChange={(ev) => setNome(ev.target.value)} />
        <button className="btn btn-amarelo btn-bloco" disabled={nome.trim().length < 2}>Criar e gerar código</button>
      </form>
      {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}
      {turmas?.length === 0 && <p className="muted">Você ainda não tem turmas.</p>}
      {turmas?.map((t) => (
        <button key={t.id} className="painel-destaque linha" onClick={() => ir('adulto', t.id)} style={{ textAlign: 'left', color: 'inherit' }}>
          <span style={{ flex: 1 }}>
            <span className="display" style={{ fontSize: 20, display: 'block' }}>{t.nome}</span>
            <span className="muted small">Código {t.codigo} · {t.criancas} {t.criancas === 1 ? 'criança' : 'crianças'}{eu.admin ? ` · de ${t.dono}` : ''}</span>
          </span>
          <Icone nome="seguir" />
        </button>
      ))}
    </>
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
                  <span className="small" style={{ flex: 1, fontWeight: 700 }}>Remover {k.apelido}? As cartas e o progresso da conta serão apagados.</span>
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
