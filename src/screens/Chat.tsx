// Chat da turma (decisão do Lucas em 04/11/2026): um grupo só, com os colegas da mesma turma da escola.
// O professor liga e escolhe o horário; o responsável autoriza. Pais e professor leem tudo (a criança é avisada).
// O servidor confere tudo de novo; aqui o app só avisa antes, para a criança não perder o que escreveu.

import { useEffect, useRef, useState } from 'react';
import { Ara } from '../components/Ara';
import { Icone } from '../components/Icone';
import { api, marcarChatVisto, useConta } from '../lib/conta';
import { ir } from '../lib/rota';
import { conferirMensagem, MAX_TEXTO, MOTIVO } from '../shared/chat';

interface Msg { id: string; de: string; apelido: string; cor: string; texto: string; criado: number; minha: boolean }
interface Estado {
  liberado: boolean; motivo: string | null; aviso: string | null;
  horario?: { inicio: number; fim: number } | null;
  mensagens: Msg[]; online: { apelido: string; cor: string }[];
}

const hora = (ms: number) => new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const dia = (ms: number) => new Date(ms).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

export function Avatar({ nome, cor, tamanho = 32 }: { nome: string; cor: string; tamanho?: number }) {
  return <span aria-hidden="true" style={{ width: tamanho, height: tamanho, flex: 'none', borderRadius: '50%', background: cor, display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontSize: tamanho * 0.45, color: 'var(--ink)', border: '2px solid var(--ink)' }}>{nome[0]?.toUpperCase()}</span>;
}

export function Chat() {
  const { conta } = useConta();
  const [dados, setDados] = useState<Estado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [avisar, setAvisar] = useState<string | null>(null);
  const [avisados, setAvisados] = useState<Set<string>>(new Set());
  const fim = useRef<HTMLDivElement>(null);
  const ultimo = useRef('');

  const carregar = async () => {
    const r = await api<Estado>('/crianca/chat');
    if (r.erro) { if (r.status !== 0) setErro(r.erro); return; }
    setDados(r);
  };
  // Busca as mensagens a cada 5 segundos enquanto a tela está aberta e visível.
  useEffect(() => {
    if (!conta?.codigo) return;
    void carregar();
    const t = setInterval(() => { if (document.visibilityState === 'visible') void carregar(); }, 5000);
    return () => clearInterval(t);
  }, [conta?.codigo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Desce para a última mensagem quando chega uma nova.
  const idUltima = dados?.mensagens.at(-1)?.id ?? '';
  // Com a tela aberta, tudo o que aparece já conta como visto (o número do botão volta a zero).
  const criadoUltima = dados?.mensagens.at(-1)?.criado ?? 0;
  useEffect(() => { if (criadoUltima) marcarChatVisto(criadoUltima); }, [criadoUltima]);
  useEffect(() => {
    if (idUltima && idUltima !== ultimo.current) { ultimo.current = idUltima; fim.current?.scrollIntoView({ block: 'end' }); }
  }, [idUltima]);

  const conf = texto.trim() ? conferirMensagem(texto) : null;
  const problema = conf && !conf.ok && conf.motivo !== 'vazio' ? MOTIVO[conf.motivo] : null;

  const enviar = async () => {
    if (!conf?.ok || enviando) return;
    setEnviando(true); setErro(null);
    const r = await api<Msg>('/crianca/chat', { corpo: { texto: conf.texto } });
    setEnviando(false);
    if (r.erro) { setErro(r.erro); return; }
    setTexto('');
    const el = document.getElementById('chat-texto'); if (el) el.style.height = '';
    setDados((d) => (d ? { ...d, mensagens: [...d.mensagens, r] } : d));
  };

  const confirmarAviso = async (id: string) => {
    const r = await api(`/crianca/chat/${id}/avisar`, { corpo: {} });
    setAvisar(null);
    if (r.erro) setErro(r.erro); else setAvisados((s) => new Set(s).add(id));
  };

  const voltar = <button className="voltar" onClick={() => ir('trocas')}><Icone nome="voltar" tamanho={18} espessura={3} />Turma</button>;

  if (!conta?.codigo) {
    return (
      <main className="tela" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div style={{ alignSelf: 'flex-start' }}>{voltar}</div>
        <Ara humor="pensando" tamanho={110} />
        <div className="balao">Entre na sua turma para conversar com os colegas.</div>
      </main>
    );
  }

  const fechado = dados && !dados.liberado && ['desligado', 'sem-familia', 'sem-autorizacao', 'sem-turma'].includes(dados.motivo ?? '');
  let diaAnterior = '';

  return (
    <main className="tela chat-tela">
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        {voltar}
        <span className="eyebrow">{conta.turma}</span>
      </div>
      <h1 className="display h2" style={{ margin: 0 }}>Conversa da turma</h1>

      <div className="chat-vigia" role="note">
        <span aria-hidden="true">👀</span>
        <span>Seu <strong>responsável</strong> e os <strong>adultos da turma</strong> (como o professor) podem ler tudo o que você escreve aqui. Seja gentil!</span>
      </div>

      {dados && dados.online.length > 0 && (
        <div className="chat-online" aria-label="Estudando agora">
          <span className="chat-bolinha" aria-hidden="true" />
          <span className="small" style={{ fontWeight: 800 }}>Estudando agora:</span>
          {dados.online.slice(0, 6).map((o) => <span key={o.apelido} className="linha" style={{ gap: 4 }}><Avatar nome={o.apelido} cor={o.cor} tamanho={22} /><span className="small" style={{ fontWeight: 700 }}>{o.apelido}</span></span>)}
          {dados.online.length > 6 && <span className="small muted">+{dados.online.length - 6}</span>}
        </div>
      )}

      {!dados && !erro && <p className="muted">Carregando…</p>}
      {fechado && (
        <div className="coluna" style={{ alignItems: 'center', textAlign: 'center', marginTop: 20 }}>
          <Ara humor="pensando" tamanho={100} />
          <div className="balao">{dados!.aviso}</div>
        </div>
      )}

      {dados && !fechado && (
        <div className="chat-lista" aria-live="polite">
          {dados.mensagens.length === 0 && <p className="muted small" style={{ textAlign: 'center' }}>Ninguém escreveu ainda. Diga oi para a turma!</p>}
          {dados.mensagens.map((m) => {
            const d = dia(m.criado);
            const novoDia = d !== diaAnterior; diaAnterior = d;
            return (
              <div key={m.id}>
                {novoDia && <div className="chat-dia">{d}</div>}
                <div className={`chat-msg${m.minha ? ' minha' : ''}`}>
                  {!m.minha && <Avatar nome={m.apelido} cor={m.cor} />}
                  <div className="chat-balao">
                    {!m.minha && <div className="chat-nome">{m.apelido}</div>}
                    <div className="chat-texto">{m.texto}</div>
                    <div className="chat-rodape">
                      <span>{hora(m.criado)}</span>
                      {!m.minha && (avisados.has(m.id)
                        ? <span>Adulto avisado</span>
                        : <button className="chat-avisar" onClick={() => setAvisar(m.id)}>Avisar um adulto</button>)}
                    </div>
                    {avisar === m.id && (
                      <div className="chat-confirma">
                        <span>Essa mensagem foi chata ou ruim? Os adultos da turma vão ver.</span>
                        <div className="linha" style={{ gap: 6 }}>
                          <button className="btn btn-coral" style={{ minHeight: 38, fontSize: 14, flex: 1 }} onClick={() => void confirmarAviso(m.id)}>Avisar</button>
                          <button className="btn btn-escuro" style={{ minHeight: 38, fontSize: 14, flex: 1 }} onClick={() => setAvisar(null)}>Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={fim} />
        </div>
      )}

      {erro && <div className="aviso aviso-erro" role="alert">{erro}</div>}

      {dados && !fechado && (dados.liberado ? (
        <form className="chat-escrever" onSubmit={(ev) => { ev.preventDefault(); void enviar(); }}>
          {problema && <div className="aviso aviso-erro small" role="alert">{problema}</div>}
          <div className="linha" style={{ gap: 8, alignItems: 'flex-end' }}>
            <label htmlFor="chat-texto" className="sr-only">Mensagem</label>
            <textarea id="chat-texto" value={texto} maxLength={MAX_TEXTO} rows={1} placeholder="Escreva para a turma…" autoComplete="off"
              onChange={(ev) => { setTexto(ev.target.value); const el = ev.target; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight + 6, 120)}px`; }}
              onKeyDown={(ev) => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); void enviar(); } }} />
            <button className="btn btn-amarelo" type="submit" disabled={!conf?.ok || enviando} style={{ minHeight: 50, padding: '0 16px' }}>
              {enviando ? '…' : 'Enviar'}
            </button>
          </div>
          <div className="small muted" style={{ textAlign: 'right' }}>{texto.length}/{MAX_TEXTO}</div>
        </form>
      ) : (
        <div className="balao small">{dados.aviso}</div>
      ))}
    </main>
  );
}
