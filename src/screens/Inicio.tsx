import { useState } from 'react';
import { Ara } from '../components/Ara';
import { Icone } from '../components/Icone';
import { capitulos } from '../data';
import { FASES, FASE_INFO, chave, nivel, sequencia } from '../lib/jogo';
import { ir } from '../lib/rota';
import { getEstado, setEstado, useEstado } from '../lib/store';
import { useConta } from '../lib/conta';

export const CORES = ['#22D3EE', '#F472B6', '#FACC15', '#4ADE80', '#FB923C', '#A78BFA'];

export function BoasVindas() {
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState(CORES[0]);
  const ok = nome.trim().length >= 2;
  return (
    <main className="tela" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <div className="logo" style={{ fontSize: 44 }}>Sabidex</div>
      <Ara tamanho={130} />
      <div className="balao" style={{ maxWidth: 320 }}>Oi! Eu sou o <strong>Ará</strong>. Vamos estudar, ganhar cartas e completar o álbum?</div>
      <form className="coluna" style={{ width: '100%', maxWidth: 340, marginTop: 8 }}
        onSubmit={(ev) => { ev.preventDefault(); if (ok) setEstado((e) => ({ ...e, perfil: { nome: nome.trim(), cor } })); }}>
        <label htmlFor="apelido" className="display h3">Como você quer ser chamado?</label>
        <input id="apelido" value={nome} maxLength={14} autoComplete="off" placeholder="Seu apelido"
          onChange={(ev) => setNome(ev.target.value)}
          style={{ font: 'inherit', fontWeight: 800, fontSize: 18, padding: '14px 16px', borderRadius: 16, border: '1.5px solid var(--line-2)', background: 'var(--surface)', color: 'var(--ink)', textAlign: 'center' }} />
        <p className="muted small" style={{ margin: 0 }}>Só o apelido. Não precisa do nome completo.</p>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="muted small" style={{ marginBottom: 8 }}>Escolha sua cor</legend>
          <div className="linha" style={{ justifyContent: 'center', gap: 10 }}>
            {CORES.map((c) => (
              <button key={c} type="button" aria-label={`Cor ${c}`} aria-pressed={cor === c} onClick={() => setCor(c)}
                style={{ width: 44, height: 44, borderRadius: '50%', border: 0, background: c, boxShadow: cor === c ? '0 0 0 3px var(--bg), 0 0 0 6px var(--ink)' : 'inset 0 -3px 0 #00000033' }} />
            ))}
          </div>
        </fieldset>
        <button className="btn btn-amarelo btn-bloco" disabled={!ok} style={{ marginTop: 8 }}>Começar</button>
      </form>
      <button type="button" className="btn btn-escuro btn-bloco" style={{ maxWidth: 340 }} onClick={() => ir('entrar')}>Já tenho conta na turma</button>
      <button type="button" className="voltar" style={{ alignSelf: 'center' }} onClick={() => ir('adulto')}>Sou pai, mãe ou professor</button>
    </main>
  );
}

/** Próxima fase a fazer: a primeira não concluída, em ordem de capítulo. */
export function proximaFase(feitas: Record<string, true>) {
  for (const c of capitulos) for (const f of FASES) if (!feitas[chave(c.id, f)]) return { cap: c, fase: f };
  return null;
}

/** Leva para a próxima fase a fazer (ou para a lista de mundos, se tudo já foi feito). */
export function jogar() {
  const p = proximaFase(getEstado().feitas);
  if (p) ir('fase', p.cap.id, p.fase); else ir('mundos');
}

export function Inicio() {
  const e = useEstado();
  const { conta, propostasNovas } = useConta();
  const nv = nivel(e.xp);
  const dias = sequencia(e.dias);
  const prox = proximaFase(e.feitas);
  const feitasCap = prox ? FASES.filter((f) => e.feitas[chave(prox.cap.id, f)]).length : 5;
  const faltamPacote = prox ? (['memoria', 'quiz', 'prova'] as const).find((f) => !e.feitas[chave(prox.cap.id, f)]) : undefined;
  const fasesAte = faltamPacote && prox ? FASES.indexOf(faltamPacote) - FASES.indexOf(prox.fase) + 1 : 0;

  const fala = propostasNovas > 0
    ? <>Você tem <strong>{propostasNovas} {propostasNovas > 1 ? 'propostas' : 'proposta'} de troca</strong>! Veja em Trocas.</>
    : e.pacotes.length > 0
    ? <>Você tem <strong>{e.pacotes.length} {e.pacotes.length > 1 ? 'pacotes' : 'pacote'}</strong> esperando. Vamos abrir?</>
    : prox && fasesAte > 0
      ? <>Mais <strong>{fasesAte} {fasesAte > 1 ? 'fases' : 'fase'}</strong> e você ganha um pacote de cartas!</>
      : <>Você terminou tudo! Repita as fases para ganhar mais XP.</>;

  return (
    <main className="tela">
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <div className="logo">Sabidex</div>
        <span className="pilula" title="Dias seguidos estudando">
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(180deg,#FDBA74,#F97316)', display: 'grid', placeItems: 'center' }}>
            <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true"><path d="M6 0c1 3 5 5 5 9a5 5 0 01-10 0c0-2 1-3 2-4 1 1 2 2 2 2s1-3 1-7z" fill="#FFF7ED" /></svg>
          </span>
          {dias} {dias === 1 ? 'dia' : 'dias'}
        </span>
      </div>

      <button className="painel linha" aria-label="Minha conta e nível" onClick={() => ir('conta')} style={{ textAlign: 'left', color: 'inherit', width: '100%' }}>
        <div style={{ width: 60, height: 60, flex: 'none', borderRadius: '50%', background: e.perfil!.cor, display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontSize: 26, color: 'var(--bg)', boxShadow: 'inset 0 -3px 0 #00000033, inset 0 2px 0 #FFFFFF88' }}>
          {e.perfil!.nome[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }} className="coluna">
          <div className="linha" style={{ justifyContent: 'space-between', gap: 6 }}>
            <span className="display h3" style={{ fontSize: 22, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.perfil!.nome}</span>
            <span className="display" style={{ color: 'var(--cyan-2)', fontSize: 16 }}>Nível {nv.nivel}</span>
          </div>
          <div className="barra barra-ciano" role="progressbar" aria-valuenow={nv.noNivel} aria-valuemax={nv.total} aria-label="XP do nível"><div style={{ width: `${(nv.noNivel / nv.total) * 100}%` }} /></div>
          <span className="muted small" style={{ fontVariantNumeric: 'tabular-nums' }}>{nv.noNivel} / {nv.total} XP para o nível {nv.nivel + 1}{conta ? ` · ${conta.turma}` : ''}</span>
        </div>
      </button>

      <div className="linha" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 'none' }}><Ara tamanho={76} /></div>
        <div className="balao" style={{ flex: 1, marginBottom: 14 }}>{fala}</div>
      </div>

      {e.pacotes.length > 0 && (
        <button className="linha" onClick={() => ir('pacote')}
          style={{ border: 0, textAlign: 'left', borderRadius: 22, padding: '12px 14px', background: 'linear-gradient(110deg,#F472B6,#A78BFA 40%,#22D3EE 75%)', color: 'var(--bg)', boxShadow: 'inset 0 2px 0 #FFFFFF66' }}>
          <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><rect x="6" y="10" width="32" height="28" rx="8" fill="#0B1026" /><rect x="9" y="13" width="26" height="22" rx="6" fill="#FACC15" /><rect x="19" y="10" width="6" height="28" fill="#F472B6" /><circle cx="22" cy="10" r="5" fill="#F472B6" /></svg>
          <span style={{ flex: 1 }}><span className="display" style={{ fontSize: 19, display: 'block' }}>{e.pacotes.length} {e.pacotes.length > 1 ? 'pacotes' : 'pacote'} para abrir</span><span className="small" style={{ fontWeight: 800 }}>{e.pacotes.some((p) => p.tipo === 'epico') ? 'Tem pacote épico!' : 'Toque para abrir'}</span></span>
          <Icone nome="seguir" espessura={3} />
        </button>
      )}

      {prox && (
        <button className="painel-destaque" onClick={() => ir('mundo', prox.cap.id)} style={{ textAlign: 'left', color: 'inherit' }}>
          <span className="eyebrow" style={{ color: 'var(--yellow)' }}>Continuar · {prox.cap.materia}</span>
          <span className="display" style={{ fontSize: 26, display: 'block', marginTop: 4 }}>Cap. {prox.cap.numero} · {prox.cap.titulo}</span>
          <span className="muted small" style={{ display: 'block' }}>Próxima: {FASE_INFO[prox.fase].titulo}</span>
          <span className="linha" style={{ marginTop: 12 }}>
            <span style={{ flex: 1, display: 'flex', gap: 6 }} aria-label={`${feitasCap} de 5 fases`}>
              {FASES.map((f) => <span key={f} style={{ flex: 1, height: 10, borderRadius: 999, background: e.feitas[chave(prox.cap.id, f)] ? 'var(--green)' : 'var(--line)' }} />)}
            </span>
            <span className="btn btn-amarelo" style={{ minHeight: 44, padding: '8px 20px' }}>Jogar</span>
          </span>
        </button>
      )}

      <section aria-label="Matérias">
        <h2 className="display h3" style={{ marginBottom: 8 }}>Matérias</h2>
        <div className="grade-3">
          <button className="painel" onClick={() => ir('mundos')} style={{ textAlign: 'center', borderColor: 'var(--pink)', padding: 12, color: 'inherit' }}>
            <span className="display" style={{ fontSize: 17, display: 'block' }}>História</span>
            <span className="muted small">{capitulos.length} capítulos</span>
          </button>
          {['Ciências', 'Geografia'].map((m) => (
            <div key={m} className="painel" style={{ textAlign: 'center', borderStyle: 'dashed', background: '#10163A', padding: 12, color: 'var(--muted)' }}>
              <span className="display" style={{ fontSize: 17, display: 'block' }}>{m}</span>
              <span className="small" style={{ fontWeight: 700 }}>Em breve</span>
            </div>
          ))}
        </div>
      </section>
      <button className="voltar" style={{ alignSelf: 'center', marginTop: 8 }} onClick={() => ir('adulto')}>Área dos pais e professores</button>
    </main>
  );
}
