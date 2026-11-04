import { useState } from 'react';
import { Ara } from '../components/Ara';
import { Pacote } from '../components/Pacote';
import { Icone } from '../components/Icone';
import { capitulos } from '../data';
import { FASES, FASE_INFO, chave, hoje, nivel, sequencia } from '../lib/jogo';
import { quantasHoje, MAX_POR_REVISAO } from '../lib/revisao';
import { ir } from '../lib/rota';
import { getEstado, useEstado } from '../lib/store';
import { useConta } from '../lib/conta';
import { Moeda, Saldo } from '../components/Loja';
import { sabimons } from '../data';
import { formaDe, podeEvoluir, saldo } from '../lib/loja';
import { Desejo } from './Loja';
import { EscolherPerfil } from '../components/Perfis';
import { EntrarTurma } from './Turma';

export const CORES = ['#22D3EE', '#F472B6', '#FACC15', '#4ADE80', '#FB923C', '#A78BFA'];

/**
 * Primeira tela. Só entra quem tem turma (código do professor) ou conta da família
 * (o adulto abre o perfil). Não existe mais "jogar sem turma": cada turma estuda o livro dela.
 */
export function BoasVindas() {
  const { perfis } = useConta();
  const [outra, setOutra] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const escolherPerfil = perfis.length > 0 && !outra && !entrando;
  return (
    <main className="tela" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <div className="logo" style={{ fontSize: 44 }}>Sabidex</div>
      <Ara tamanho={130} />
      <div className="balao" style={{ maxWidth: 320 }}>
        {entrando
          ? <>Que bom! Vamos achar a sua turma.</>
          : <>Oi! Eu sou o <strong>Ará</strong>. Vamos estudar, ganhar Sabimons e completar o álbum?</>}
      </div>
      {escolherPerfil && (
        <div className="coluna" style={{ width: '100%', maxWidth: 340, marginTop: 8 }}>
          <EscolherPerfil perfis={perfis} titulo="Quem vai jogar?" />
          <button type="button" className="voltar" style={{ alignSelf: 'center' }} onClick={() => setOutra(true)}>Sou outra criança</button>
        </div>
      )}
      {!escolherPerfil && entrando && (
        <div className="coluna" style={{ width: '100%', maxWidth: 340, marginTop: 8 }}>
          <EntrarTurma />
          <button type="button" className="voltar" style={{ alignSelf: 'center' }} onClick={() => setEntrando(false)}>Voltar</button>
        </div>
      )}
      {!escolherPerfil && !entrando && (
        <div className="coluna" style={{ width: '100%', maxWidth: 340, marginTop: 8 }}>
          <button type="button" className="btn btn-amarelo btn-bloco" onClick={() => setEntrando(true)}>Entrar na minha turma</button>
          <button type="button" className="btn btn-escuro btn-bloco" onClick={() => ir('entrar')}>Já tenho conta</button>
          <p className="muted small" style={{ margin: 0 }}>Sem código da turma? Peça para o professor ou para um adulto da sua casa.</p>
        </div>
      )}
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
  const revisar = Math.min(quantasHoje(e.revisao, capitulos, hoje()), MAX_POR_REVISAO);
  const pacoteDaRevisao = e.pacoteDia !== hoje();

  const evolui = sabimons.find((s) => podeEvoluir(e, s).ok);
  const fala = propostasNovas > 0
    ? <>Você tem <strong>{propostasNovas} {propostasNovas > 1 ? 'propostas' : 'proposta'} de troca</strong>! Veja em Trocas.</>
    : e.pacotes.length > 0
    ? <>Você tem <strong>{e.pacotes.length} {e.pacotes.length > 1 ? 'pacotes' : 'pacote'}</strong> esperando. Vamos abrir?</>
    : evolui
    ? <>Seu <strong>{evolui.formas[formaDe(e, evolui.id) - 1].nome}</strong> pode evoluir! Veja no álbum.</>
    : revisar > 0
    ? <>Tenho <strong>{revisar} {revisar > 1 ? 'perguntas' : 'pergunta'}</strong> para você lembrar hoje. Bora revisar?</>
    : prox && fasesAte > 0
      ? <>Mais <strong>{fasesAte} {fasesAte > 1 ? 'fases' : 'fase'}</strong> e você ganha um pacote de Sabimons!</>
      : <>Você terminou tudo! Repita as fases para ganhar mais XP.</>;

  return (
    <main className="tela">
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <div className="logo">Sabidex</div>
        <span className="linha" style={{ gap: 8 }}>
        <button onClick={() => ir('loja')} style={{ border: 0, background: 'none', padding: 0, color: 'inherit', font: 'inherit' }} aria-label={`${saldo(e)} Sabicoins. Abrir a lojinha`}><Saldo valor={saldo(e)} /></button>
        <span className="pilula" title="Dias seguidos estudando">
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(180deg,#FDBA74,#F97316)', display: 'grid', placeItems: 'center' }}>
            <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true"><path d="M6 0c1 3 5 5 5 9a5 5 0 01-10 0c0-2 1-3 2-4 1 1 2 2 2 2s1-3 1-7z" fill="#FFF7ED" /></svg>
          </span>
          {dias} {dias === 1 ? 'dia' : 'dias'}
        </span>
        </span>
      </div>

      <button className="painel linha" aria-label="Minha conta e nível" onClick={() => ir('conta')} style={{ textAlign: 'left', color: 'inherit', width: '100%' }}>
        <div style={{ width: 60, height: 60, flex: 'none', borderRadius: '50%', background: e.perfil!.cor, display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontSize: 26, color: 'var(--ink)', boxShadow: 'inset 0 -3px 0 #00000033, inset 0 2px 0 #FFFFFF88' }}>
          {e.perfil!.nome[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }} className="coluna">
          <div className="linha" style={{ justifyContent: 'space-between', gap: 6 }}>
            <span className="display h3" style={{ fontSize: 22, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.perfil!.nome}</span>
            <span className="display" style={{ color: 'var(--t-cyan)', fontSize: 16 }}>Nível {nv.nivel}</span>
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
        <button className="aviso-pacote linha" onClick={() => ir('pacote')}>
          <Pacote tamanho="mini" epico={e.pacotes.some((p) => p.tipo === 'epico')} />
          <span style={{ flex: 1 }}><span className="display" style={{ fontSize: 19, display: 'block' }}>{e.pacotes.length} {e.pacotes.length > 1 ? 'pacotes' : 'pacote'} para abrir</span><span className="small" style={{ fontWeight: 800 }}>{e.pacotes.some((p) => p.tipo === 'epico') ? 'Tem pacote épico!' : 'Toque para abrir'}</span></span>
          <Icone nome="seguir" espessura={3} />
        </button>
      )}

      {revisar > 0 && (
        <button className="painel-destaque linha" onClick={() => ir('revisao')} style={{ textAlign: 'left', color: 'inherit', borderColor: 'var(--pink)' }}>
          <span style={{ flex: 1 }}>
            <span className="eyebrow" style={{ color: 'var(--t-pink)' }}>Revisão do Ará</span>
            <span className="display" style={{ fontSize: 22, display: 'block', marginTop: 4 }}>{revisar} {revisar > 1 ? 'perguntas' : 'pergunta'} para lembrar</span>
            <span className="muted small" style={{ display: 'block' }}>{pacoteDaRevisao ? 'Vale o pacote do dia!' : 'Lembrar de novo deixa a memória forte'}</span>
          </span>
          <span className="btn btn-rosa" style={{ minHeight: 44, padding: '8px 18px' }}>Revisar</span>
        </button>
      )}

      {evolui && (
        <button className="btn btn-verde btn-bloco" onClick={() => ir('album', evolui.id)}>Evoluir {evolui.formas[formaDe(e, evolui.id) - 1].nome}</button>
      )}

      {e.desejo ? <Desejo onClick={() => ir('loja')} /> : (
        <button className="painel linha" onClick={() => ir('loja')} style={{ textAlign: 'left', color: 'inherit', width: '100%' }}>
          <Moeda tamanho={40} />
          <span style={{ flex: 1 }}><span className="display" style={{ fontSize: 19, display: 'block' }}>Lojinha</span><span className="muted small">Medalhas, escudos e coroas para seus Sabimons</span></span>
          <Icone nome="seguir" espessura={3} />
        </button>
      )}

      {prox && (
        <button className="painel-destaque" onClick={() => ir('mundo', prox.cap.id)} style={{ textAlign: 'left', color: 'inherit' }}>
          <span className="eyebrow" style={{ color: 'var(--t-yellow)' }}>Continuar · {prox.cap.materia}</span>
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
            <div key={m} className="painel painel-breve" style={{ textAlign: 'center', padding: 12, color: 'var(--muted)' }}>
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
