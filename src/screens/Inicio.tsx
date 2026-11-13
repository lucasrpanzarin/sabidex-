import { InstalarApp } from '../components/InstalarApp';
import { PACOTE_BOAS_VINDAS } from '../shared/sync';
import { useState } from 'react';
import { Ara } from '../components/Ara';
import { Pacote } from '../components/Pacote';
import { Icone } from '../components/Icone';

const COR_MATERIA = ['var(--pink)', 'var(--cyan)', 'var(--green)', 'var(--yellow)'];
import { FASES, chave, hoje, infoFase, nivel, sequencia } from '../lib/jogo';
import { quantasHoje, MAX_POR_REVISAO } from '../lib/revisao';
import { missoesDeHoje, quantasFeitas } from '../lib/missoes';
import { materiasDoDesafio, situacaoDesafio } from '../lib/desafio';
import { resumoMaterias, type ResumoMateria } from '../lib/materias';
import { ir } from '../lib/rota';
import { getEstado, useEstado } from '../lib/store';
import { estudoDa, getConta, useConta } from '../lib/conta';
import { PrecisaTurma } from './Turma';
import type { Capitulo } from '../data/tipos';
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

/** Unidade que a criança jogou por último: o "Continuar" termina ela antes de ir para outra. */
let unidadeAtual: string | null = null;
export const lembrarUnidade = (id: string) => { unidadeAtual = id; };

/**
 * Próxima fase a fazer: primeiro termina a unidade que a criança está jogando; depois, a primeira
 * não concluída na ordem do livro (as que já tiveram prova, por último).
 */
export function proximaFase(feitas: Record<string, true>, provas: DatasProva | undefined = getConta()?.provas, caps: Capitulo[] = estudoDa().caps, atual: string | null = unidadeAtual) {
  const ordem = ordenarCapitulos(caps, provas, hoje());
  const daAtual = ordem.find((c) => c.id === atual);
  for (const c of daAtual ? [daAtual, ...ordem] : ordem) for (const f of FASES) if (!feitas[chave(c.id, f)]) return { cap: c, fase: f };
  return null;
}

/** Leva para a próxima fase a fazer (ou para a lista de mundos, se tudo já foi feito; sem turma, o aviso para entrar nela). */
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

/** "Anthony", "Anthony e Bia", "Anthony, Bia e mais 2" (Lucas, 06/11/2026: o Ará diz quem chamou). */
function quemChamou(nomes: string[]) {
  if (!nomes.length) return <>Um colega</>;
  if (nomes.length === 1) return <strong>{nomes[0]}</strong>;
  if (nomes.length === 2) return <><strong>{nomes[0]}</strong> e <strong>{nomes[1]}</strong></>;
  return <><strong>{nomes[0]}</strong>, <strong>{nomes[1]}</strong> e mais {nomes.length - 2}</>;
}

export function Inicio() {
  const e = useEstado();
  const { conta, propostasNovas, desafiosNovos, desafiantes } = useConta();
  const nv = nivel(e.xp);
  const dias = sequencia(e.dias);
  // Só os capítulos da turma. Sem turma (ou turma sem matérias), o Início mostra o aviso no lugar dos jogos.
  const { caps: capitulos, materias, situacao: estudo } = estudoDa(conta);
  const semJogo = estudo !== 'ok';
  const prox = proximaFase(e.feitas, conta?.provas, capitulos);
  const provaProx = prox ? situacao(conta?.provas, prox.cap.id, hoje()) : null;
  const feitasCap = prox ? FASES.filter((f) => e.feitas[chave(prox.cap.id, f)]).length : 5;
  const faltamPacote = prox ? (['memoria', 'quiz', 'prova'] as const).find((f) => !e.feitas[chave(prox.cap.id, f)]) : undefined;
  const fasesAte = faltamPacote && prox ? FASES.indexOf(faltamPacote) - FASES.indexOf(prox.fase) + 1 : 0;
  const revisar = Math.min(quantasHoje(e.revisao, capitulos, hoje()), MAX_POR_REVISAO);
  const pacoteDaRevisao = e.pacoteDia !== hoje();
  const mis = semJogo ? { dia: hoje(), lista: [], progresso: {} } : missoesDeHoje(e);
  const misFeitas = quantasFeitas(mis);
  const misFaltam = mis.lista.length - misFeitas;
  const estudouHoje = e.dias.includes(hoje());
  // O próximo passo de estudo ganha o brilho (só um por tela): as missões do dia; se não há missão, continuar o mundo.
  const brilhoMissoes = misFaltam > 0;
  // Desafio do dia: um por matéria (Lucas, 12/11/2026). Só as matérias com unidade começada dá para jogar.
  const desafios = semJogo ? [] : materiasDoDesafio(e, capitulos).map((d) => ({ ...d, ...situacaoDesafio(e, d.materia) }));
  const desafiosFaltam = desafios.filter((d) => d.pode && !d.feito).length;
  const brilhoDesafio = !brilhoMissoes && desafiosFaltam > 0;
  const brilhoContinuar = !brilhoMissoes && !brilhoDesafio && mis.lista.length === 0;

  const evolui = FIGURINHAS.find((f) => podeEvoluir(e, f.id).ok);
  // O Ará fala do duelo (e mostra o botão) quando não tem um aviso mais importante antes.
  const temDesafio = !(semJogo && !e.pacotes.length) && desafiosNovos > 0;
  const fala = semJogo && !e.pacotes.length
    ? (estudo === 'sem-turma'
      ? <>Oi! Para jogar, falta só entrar na sua <strong>turma da escola</strong>. Assim você estuda as matérias do <strong>seu</strong> livro!</>
      : <>As matérias da sua turma ainda estão chegando. Quando ficarem prontas, os jogos aparecem aqui!</>)
    : desafiosNovos > 0
    ? <>{quemChamou(desafiantes)} {desafiantes.length > 1 ? 'chamaram' : 'chamou'} você para um <strong>Duelo do Saber</strong>!</>
    // Estudo primeiro (Lucas, 13/11/2026, feedback de uma mãe): o Ará só fala das trocas depois das missões do dia.
    : propostasNovas > 0 && misFaltam === 0
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
          <span className="muted small" style={{ fontVariantNumeric: 'tabular-nums' }}>{nv.noNivel} / {nv.total} XP para o nível {nv.nivel + 1}{conta?.turma ? ` · ${conta.turma}` : ''}</span>
        </div>
      </button>

      <div className="linha" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 'none' }}><Ara tamanho={76} /></div>
        <div className="balao" style={{ flex: 1, marginBottom: 14 }}>
          {fala}
          {/* Desafio de duelo: botão direto para a página de duelos (Lucas, 06/11/2026). */}
          {temDesafio && (
            <button className="btn btn-rosa btn-bloco" style={{ marginTop: 10, minHeight: 44, fontSize: 17 }} onClick={() => ir('duelos')}>
              {desafiosNovos > 1 ? 'Ver os desafios' : 'Ver o desafio'}
            </button>
          )}
        </div>
      </div>

      <InstalarApp />

      {e.pacotes.length > 0 && (
        <button className="aviso-pacote linha" onClick={() => ir('pacote')}>
          <Pacote tamanho="mini" epico={e.pacotes.some((p) => p.tipo === 'epico')} />
          <span style={{ flex: 1 }}><span className="display" style={{ fontSize: 19, display: 'block' }}>{e.pacotes.length} {e.pacotes.length > 1 ? 'pacotes' : 'pacote'} para abrir</span><span className="small" style={{ fontWeight: 800 }}>{e.pacotes.some((p) => p.tipo === 'epico') ? 'Tem pacote épico!' : 'Toque para abrir'}</span></span>
          <Icone nome="seguir" espessura={3} />
        </button>
      )}

      {semJogo && <PrecisaTurma situacao={estudo} />}

      {!semJogo && <Materias resumo={resumoMaterias(e, capitulos, materias, desafios)} cores={materias} brilhoDesafio={brilhoDesafio} />}

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
        <button className="painel coluna" onClick={() => ir('dia')}
          style={{ textAlign: 'left', color: 'inherit', width: '100%', gap: 10, borderColor: misFaltam ? 'var(--coral)' : 'var(--green)' }}>
          <span className="linha" style={{ gap: 10 }}>
            <Chama tamanho={40} />
            <span style={{ flex: 1 }}>
              <span className="display" style={{ fontSize: 20, display: 'block' }}>Missões do dia</span>
              <span className="small" style={{ fontWeight: 800, color: misFaltam ? 'var(--t-coral)' : 'var(--t-green)' }}>
                {misFaltam === 0 ? 'Pacote ganho! Volte amanhã.' : misFaltam === mis.lista.length ? `${misFaltam} missões te esperando!` : `Falta${misFaltam > 1 ? 'm' : ''} ${misFaltam} para o pacote!`}
              </span>
            </span>
            {misFaltam > 0 ? <span className="selo-agora chamar">Faça agora</span> : <Icone nome="seguir" espessura={3} />}
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
        <button className="painel-destaque" onClick={() => ir('mundo', prox.cap.id)} style={{ textAlign: 'left', color: 'inherit' }}>
          <span className="linha" style={{ justifyContent: 'space-between', gap: 8 }}>
            <span className="eyebrow" style={{ color: 'var(--t-yellow)' }}>Continuar · {prox.cap.materia}</span>
            {provaProx && <SeloProva s={provaProx} />}
          </span>
          <span className="display" style={{ fontSize: 26, display: 'block', marginTop: 4 }}>Unidade {prox.cap.numero} · {prox.cap.titulo}</span>
          <span className="muted small" style={{ display: 'block' }}>Próxima: {infoFase(prox.fase, prox.cap).titulo}</span>
          <span className="linha" style={{ marginTop: 12 }}>
            <span style={{ flex: 1, display: 'flex', gap: 6 }} aria-label={`${feitasCap} de 5 fases`}>
              {FASES.map((f) => <span key={f} style={{ flex: 1, height: 10, borderRadius: 999, background: e.feitas[chave(prox.cap.id, f)] ? 'var(--green)' : 'var(--line)' }} />)}
            </span>
            <span className={`btn btn-amarelo${brilhoContinuar ? ' chamar' : ''}`} style={{ minHeight: 44, padding: '8px 20px' }}>Jogar</span>
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

      <button className="voltar" style={{ alignSelf: 'center', marginTop: 8 }} onClick={() => ir('adulto')}>Área dos pais e professores</button>
    </main>
  );
}

/**
 * Matérias no alto do Início (Lucas, 12/11/2026): o que a criança ainda não fez e tem prêmio vem primeiro
 * (matéria nova, unidade nova, fases que faltam, Desafio do dia); o que já terminou vai para o fim.
 * Juntou a grade "Desafios do dia", que repetia as mesmas matérias.
 */
function Materias({ resumo, cores, brilhoDesafio }: { resumo: ResumoMateria[]; cores: string[]; brilhoDesafio: boolean }) {
  const primeiroDesafio = resumo.findIndex((r) => r.desafioPendente);
  return (
    <section aria-label="Matérias" className="coluna" style={{ gap: 10 }}>
      <h2 className="display h3" style={{ margin: 0 }}>Matérias</h2>
      {resumo.map((r, i) => {
        const cor = COR_MATERIA[cores.indexOf(r.materia) % COR_MATERIA.length];
        const novo = r.situacao === 'nova' || r.situacao === 'unidade-nova';
        const terminou = r.faltam === 0;
        const texto = r.situacao === 'nova'
          ? `${r.unidades} ${r.unidades === 1 ? 'unidade' : 'unidades'} para começar`
          : r.situacao === 'unidade-nova' && r.unidadeNova
            ? `Chegou a Unidade ${r.unidadeNova.numero}!`
            : !terminou ? `Falta${r.faltam > 1 ? 'm' : ''} ${r.faltam} ${r.faltam > 1 ? 'fases' : 'fase'}` : 'Todas as fases feitas';
        return (
          <div key={r.materia} className="painel coluna" style={{ gap: 8, padding: 12, borderColor: cor, ...(r.situacao === 'feito' ? { boxShadow: 'none' } : {}) }}>
            <button className="linha" onClick={() => ir('mundos', r.materia)}
              style={{ textAlign: 'left', color: 'inherit', background: 'none', border: 0, padding: 0, font: 'inherit', width: '100%', minHeight: 44, gap: 10, cursor: 'pointer' }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="display" style={{ fontSize: 20, display: 'block' }}>{r.materia}</span>
                <span className="small linha" style={{ fontWeight: 800, gap: 4, color: novo ? 'var(--t-coral)' : terminou ? 'var(--t-green)' : 'var(--muted)' }}>
                  {terminou && <Icone nome="check" tamanho={14} espessura={3.5} />}{texto}
                </span>
              </span>
              {novo && <span className="pilula" style={{ flex: 'none', background: 'var(--yellow)', color: 'var(--ink)', borderColor: 'var(--ink)', fontSize: 14, padding: '2px 10px' }}>Novo!</span>}
              <Icone nome="seguir" espessura={3} />
            </button>
            {(r.desafioPendente || r.desafioFeito) && (
              r.desafioPendente ? (
                <button className="linha" onClick={() => ir('desafio', r.materia)}
                  style={{ textAlign: 'left', color: 'inherit', background: 'var(--bg)', border: '2px dashed var(--line)', borderRadius: 12, padding: '6px 8px', font: 'inherit', width: '100%', gap: 8, cursor: 'pointer' }}>
                  <Pacote tamanho="mini" />
                  <span style={{ flex: 1 }}>
                    <span style={{ fontWeight: 800, display: 'block' }}>Desafio do dia</span>
                    <span className="small" style={{ fontWeight: 800, color: 'var(--t-cyan)' }}>Vale 1 pacote hoje</span>
                  </span>
                  <span className={`btn btn-amarelo${brilhoDesafio && i === primeiroDesafio ? ' chamar' : ''}`} style={{ minHeight: 36, padding: '4px 14px', fontSize: 15 }}>Jogar</span>
                </button>
              ) : (
                <span className="small linha" style={{ fontWeight: 800, color: 'var(--t-green)', gap: 4 }}><Icone nome="check" tamanho={14} espessura={3.5} />Desafio de hoje feito. Amanhã tem outro!</span>
              )
            )}
          </div>
        );
      })}
    </section>
  );
}
