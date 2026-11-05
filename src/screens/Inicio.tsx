import { InstalarApp } from '../components/InstalarApp';
import { PACOTE_BOAS_VINDAS } from '../shared/sync';
import { useState } from 'react';
import { Ara } from '../components/Ara';
import { Pacote } from '../components/Pacote';
import { Icone } from '../components/Icone';
import { capitulos, materias } from '../data';

const COR_MATERIA = ['var(--pink)', 'var(--cyan)', 'var(--green)', 'var(--yellow)'];
import { FASES, chave, hoje, infoFase, nivel, sequencia } from '../lib/jogo';
import { quantasHoje, MAX_POR_REVISAO } from '../lib/revisao';
import { missoesDeHoje, quantasFeitas } from '../lib/missoes';
import { ir } from '../lib/rota';
import { getEstado, useEstado } from '../lib/store';
import { getConta, useConta } from '../lib/conta';
import { ordenarCapitulos, situacao, textoProva, type DatasProva } from '../lib/provas';
import { Moeda, Saldo } from '../components/Loja';
import { FIGURINHAS } from '../lib/figurinhas';
import { podeEvoluir, saldo } from '../lib/loja';
import { Desejo } from './Loja';
import { EscolherPerfil } from '../components/Perfis';
import { Logo } from '../components/Logo';

export const CORES = ['#22D3EE', '#F472B6', '#FACC15', '#4ADE80', '#FB923C', '#A78BFA'];

/**
 * Primeira tela: "Quem está aí?". A criança vai para o código (turma ou família) e o adulto vai para a área dos adultos.
 * Não existe "jogar sem conta": cada turma estuda o livro dela. Se o aparelho já tem perfis da família, eles aparecem primeiro.
 */
export function BoasVindas() {
  const { perfis } = useConta();
  const [outra, setOutra] = useState(false);
  if (perfis.length > 0 && !outra) {
    return (
      <main className="tela" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <Logo tamanho={48} />
        <Ara tamanho={110} />
        <div className="coluna" style={{ width: '100%', maxWidth: 340, marginTop: 8 }}>
          <EscolherPerfil perfis={perfis} titulo="Quem vai jogar?" />
          <button type="button" className="voltar" style={{ alignSelf: 'center' }} onClick={() => setOutra(true)}>Sou outra pessoa</button>
          <InstalarApp />
        </div>
      </main>
    );
  }
  return (
    <main className="tela" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <Logo tamanho={48} />
      <h1 className="display h2" style={{ margin: '8px 0 0' }}>Oi! Quem está aí?</h1>
      <div className="escolha-quem">
        <button type="button" className="cartao-quem cartao-quem-crianca" onClick={() => ir('entrar')}>
          <Ara tamanho={96} />
          <span className="display" style={{ fontSize: 22 }}>Sou criança</span>
          <span className="small" style={{ fontWeight: 800 }}>Vou estudar e ganhar Sabimons</span>
        </button>
        <button type="button" className="cartao-quem cartao-quem-adulto" onClick={() => ir('adulto')}>
          <span className="cartao-quem-icone"><Icone nome="familia" tamanho={56} espessura={2.5} /></span>
          <span className="display" style={{ fontSize: 22 }}>Sou adulto</span>
          <span className="small" style={{ fontWeight: 800 }}>Pai, mãe, responsável ou professor</span>
        </button>
      </div>
      {outra && <button type="button" className="voltar" style={{ alignSelf: 'center' }} onClick={() => setOutra(false)}>Voltar para os perfis</button>}
      <div style={{ width: '100%', maxWidth: 420, marginTop: 8 }}><InstalarApp /></div>
    </main>
  );
}

/** Próxima fase a fazer: a primeira não concluída. Capítulo com prova chegando vem antes; os que já tiveram prova, por último. */
export function proximaFase(feitas: Record<string, true>, provas: DatasProva | undefined = getConta()?.provas) {
  for (const c of ordenarCapitulos(capitulos, provas, hoje())) for (const f of FASES) if (!feitas[chave(c.id, f)]) return { cap: c, fase: f };
  return null;
}

/** Leva para a próxima fase a fazer (ou para a lista de mundos, se tudo já foi feito). */
export function jogar() {
  const p = proximaFase(getEstado().feitas);
  if (p) ir('fase', p.cap.id, p.fase); else ir('mundos');
}

/** Selo com a data da prova da escola ("Prova em 5 dias", "Já teve prova"). */
export function SeloProva({ s }: { s: ReturnType<typeof situacao> }) {
  const t = textoProva(s);
  if (!t) return null;
  const perto = s.tipo === 'chegando' && s.dias <= 2;
  return (
    <span className="pilula" style={{ flex: 'none', fontSize: 13, padding: '2px 10px', background: s.tipo === 'chegando' ? (perto ? 'var(--coral)' : 'var(--yellow)') : 'var(--surface)',
      color: 'var(--ink)', borderColor: 'var(--ink)' }}>
      <Icone nome={s.tipo === 'chegando' ? 'relogio' : 'check'} tamanho={14} espessura={3} />{t}
    </span>
  );
}

/** Chama laranja dos dias seguidos. */
export function Chama({ tamanho = 22 }: { tamanho?: number }) {
  return (
    <span style={{ width: tamanho, height: tamanho, flex: 'none', borderRadius: '50%', background: 'linear-gradient(180deg,#FDBA74,#F97316)', display: 'grid', placeItems: 'center' }}>
      <svg width={tamanho * 0.55} height={tamanho * 0.64} viewBox="0 0 12 14" aria-hidden="true"><path d="M6 0c1 3 5 5 5 9a5 5 0 01-10 0c0-2 1-3 2-4 1 1 2 2 2 2s1-3 1-7z" fill="#FFF7ED" /></svg>
    </span>
  );
}

export function Inicio() {
  const e = useEstado();
  const { conta, propostasNovas, desafiosNovos } = useConta();
  const nv = nivel(e.xp);
  const dias = sequencia(e.dias);
  const prox = proximaFase(e.feitas, conta?.provas);
  const provaProx = prox ? situacao(conta?.provas, prox.cap.id, hoje()) : null;
  const feitasCap = prox ? FASES.filter((f) => e.feitas[chave(prox.cap.id, f)]).length : 5;
  const faltamPacote = prox ? (['memoria', 'quiz', 'prova'] as const).find((f) => !e.feitas[chave(prox.cap.id, f)]) : undefined;
  const fasesAte = faltamPacote && prox ? FASES.indexOf(faltamPacote) - FASES.indexOf(prox.fase) + 1 : 0;
  const revisar = Math.min(quantasHoje(e.revisao, capitulos, hoje()), MAX_POR_REVISAO);
  const pacoteDaRevisao = e.pacoteDia !== hoje();
  const mis = missoesDeHoje(e);
  const misFeitas = quantasFeitas(mis);
  const misFaltam = mis.lista.length - misFeitas;
  const estudouHoje = e.dias.includes(hoje());
  // O próximo passo de estudo ganha o brilho (só um por tela): as missões do dia; se não há missão, continuar o mundo.
  const brilhoMissoes = misFaltam > 0;
  const brilhoContinuar = !brilhoMissoes && mis.lista.length === 0;

  const evolui = FIGURINHAS.find((f) => podeEvoluir(e, f.id).ok);
  const fala = desafiosNovos > 0
    ? <>Um colega te chamou para um <strong>Duelo do Saber</strong>! Veja em Turma.</>
    : propostasNovas > 0
    ? <>Você tem <strong>{propostasNovas} {propostasNovas > 1 ? 'propostas' : 'proposta'} de troca</strong>! Veja em Turma.</>
    : e.pacotes.some((p) => p.id === PACOTE_BOAS_VINDAS)
    ? <>Oi! Eu sou o Ará. Tenho um <strong>presente de boas-vindas</strong> para você: um pacote com seu primeiro Sabimon. Vamos abrir?</>
    : e.pacotes.length > 0
    ? <>Você tem <strong>{e.pacotes.length} {e.pacotes.length > 1 ? 'pacotes' : 'pacote'}</strong> esperando. Vamos abrir?</>
    : evolui
    ? <>Seu <strong>{evolui.s.formas[evolui.forma - 1].nome}</strong> pode evoluir! Veja no álbum.</>
    : revisar > 0
    ? <>Tenho <strong>{revisar} {revisar > 1 ? 'perguntas' : 'pergunta'}</strong> para você lembrar hoje. Bora revisar?</>
    : prox && provaProx?.tipo === 'chegando' && provaProx.dias <= 7
    ? <>{provaProx.dias === 0 ? 'Hoje tem' : provaProx.dias === 1 ? 'Amanhã tem' : `Em ${provaProx.dias} dias tem`} prova de <strong>{prox.cap.titulo}</strong> na escola. Vamos treinar?</>
    : prox && fasesAte > 0
      ? <>Mais <strong>{fasesAte} {fasesAte > 1 ? 'fases' : 'fase'}</strong> e você ganha um pacote de Sabimons!</>
      : <>Você terminou tudo! Repita as fases para ganhar mais XP.</>;

  return (
    <main className="tela">
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <Logo />
        <span className="linha" style={{ gap: 8 }}>
        <button className="area-toque" onClick={() => ir('loja')} style={{ position: 'relative', border: 0, background: 'none', padding: 0, color: 'inherit', font: 'inherit' }} aria-label={`${saldo(e)} Sabicoins. Abrir a lojinha`}><Saldo valor={saldo(e)} /></button>
        <button className={`pilula${!estudouHoje && dias > 0 ? ' pilula-hoje' : ''}`} onClick={() => ir('dia')} style={{ cursor: 'pointer', position: 'relative' }}
          aria-label={`${dias} ${dias === 1 ? 'dia' : 'dias'} seguidos estudando.${!estudouHoje && dias > 0 ? ' Estude hoje para não perder.' : ''} Ver missões do dia`}>
          <Chama />
          {dias} {dias === 1 ? 'dia' : 'dias'}
          {!estudouHoje && dias > 0 && <span className="badge-alerta" aria-hidden="true">!</span>}
        </button>
        </span>
      </div>

      <button className="painel linha" aria-label="Meu perfil, nível e conquistas" onClick={() => ir('conta')} style={{ textAlign: 'left', color: 'inherit', width: '100%' }}>
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

      <InstalarApp />

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

      {mis.lista.length > 0 && (
        <button className={`painel coluna${brilhoMissoes ? ' chamar' : ''}`} onClick={() => ir('dia')}
          style={{ textAlign: 'left', color: 'inherit', width: '100%', gap: 10, borderColor: misFaltam ? 'var(--coral)' : 'var(--green)' }}>
          <span className="linha" style={{ gap: 10 }}>
            <Chama tamanho={40} />
            <span style={{ flex: 1 }}>
              <span className="display" style={{ fontSize: 20, display: 'block' }}>Missões do dia</span>
              <span className="small" style={{ fontWeight: 800, color: misFaltam ? 'var(--t-coral)' : 'var(--t-green)' }}>
                {misFaltam === 0 ? 'Pacote ganho! Volte amanhã.' : misFaltam === mis.lista.length ? `${misFaltam} missões te esperando!` : `Falta${misFaltam > 1 ? 'm' : ''} ${misFaltam} para o pacote!`}
              </span>
            </span>
            {misFaltam > 0 ? <span className="selo-agora">Faça agora</span> : <Icone nome="seguir" espessura={3} />}
          </span>
          <span className="linha" style={{ gap: 10 }}>
            <span className="bolinhas-missao" aria-label={`${misFeitas} de ${mis.lista.length} missões feitas`}>
              {mis.lista.map((id, i) => <span key={id} className={i < misFeitas ? 'feita' : ''}>{i < misFeitas && <Icone nome="check" tamanho={14} espessura={4} />}</span>)}
            </span>
            <Icone nome="seguir" tamanho={18} espessura={3} />
            <Pacote tamanho="mini" />
            <span className="small" style={{ fontWeight: 800 }}>1 pacote</span>
          </span>
        </button>
      )}

      {evolui && (
        <button className="btn btn-verde btn-bloco" onClick={() => ir('album', evolui.id)}>Evoluir {evolui.s.formas[evolui.forma - 1].nome}</button>
      )}

      {prox && (
        <button className={`painel-destaque${brilhoContinuar ? ' chamar' : ''}`} onClick={() => ir('mundo', prox.cap.id)} style={{ textAlign: 'left', color: 'inherit' }}>
          <span className="linha" style={{ justifyContent: 'space-between', gap: 8 }}>
            <span className="eyebrow" style={{ color: 'var(--t-yellow)' }}>Continuar · {prox.cap.materia}</span>
            {provaProx && <SeloProva s={provaProx} />}
          </span>
          <span className="display" style={{ fontSize: 26, display: 'block', marginTop: 4 }}>Cap. {prox.cap.numero} · {prox.cap.titulo}</span>
          <span className="muted small" style={{ display: 'block' }}>Próxima: {infoFase(prox.fase, prox.cap).titulo}</span>
          <span className="linha" style={{ marginTop: 12 }}>
            <span style={{ flex: 1, display: 'flex', gap: 6 }} aria-label={`${feitasCap} de 5 fases`}>
              {FASES.map((f) => <span key={f} style={{ flex: 1, height: 10, borderRadius: 999, background: e.feitas[chave(prox.cap.id, f)] ? 'var(--green)' : 'var(--line)' }} />)}
            </span>
            <span className="btn btn-amarelo" style={{ minHeight: 44, padding: '8px 20px' }}>Jogar</span>
          </span>
        </button>
      )}

      {e.desejo ? <Desejo onClick={() => ir('loja')} /> : (
        <button className="painel linha" onClick={() => ir('loja')} style={{ textAlign: 'left', color: 'inherit', width: '100%' }}>
          <Moeda tamanho={40} />
          <span style={{ flex: 1 }}><span className="display" style={{ fontSize: 19, display: 'block' }}>Lojinha</span><span className="muted small">Frutas, cristais e molduras para suas cartas</span></span>
          <Icone nome="seguir" espessura={3} />
        </button>
      )}

      <section aria-label="Matérias">
        <h2 className="display h3" style={{ marginBottom: 8 }}>Matérias</h2>
        <div className="grade-2">
          {materias.map((m, i) => {
            const n = capitulos.filter((c) => c.materia === m).length;
            return (
              <button key={m} className="painel" onClick={() => ir('mundos', m)} style={{ textAlign: 'center', borderColor: COR_MATERIA[i % COR_MATERIA.length], padding: 12, color: 'inherit' }}>
                <span className="display" style={{ fontSize: 17, display: 'block' }}>{m}</span>
                <span className="muted small">{n} {n === 1 ? 'capítulo' : 'capítulos'}</span>
              </button>
            );
          })}
          {['Ciências', 'Geografia'].filter((m) => !materias.includes(m)).map((m) => (
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
