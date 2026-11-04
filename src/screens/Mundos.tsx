import { Icone } from '../components/Icone';
import { Pacote } from '../components/Pacote';
import { capitulos, capituloPorId } from '../data';
import { EXTRA_INFO, FASES, FASE_INFO, chave, chaveExtra, extrasDo, extrasLiberados, hoje, liberada } from '../lib/jogo';
import { useConta } from '../lib/conta';
import { diaMes, ordenarCapitulos, situacao } from '../lib/provas';
import { ir } from '../lib/rota';
import { useEstado } from '../lib/store';
import type { Capitulo } from '../data/tipos';
import { SeloProva } from './Inicio';

export function Mundos() {
  const e = useEstado();
  const { conta } = useConta();
  const dia = hoje();
  const lista = ordenarCapitulos(capitulos, conta?.provas, dia);
  // Capítulos que já tiveram prova na escola continuam abertos e valendo tudo: ficam numa parte separada, no fim.
  const atuais = lista.filter((c) => situacao(conta?.provas, c.id, dia).tipo !== 'passou');
  const passadas = lista.filter((c) => situacao(conta?.provas, c.id, dia).tipo === 'passou');
  const cartao = (c: Capitulo) => {
    const n = FASES.filter((f) => e.feitas[chave(c.id, f)]).length;
    const s = situacao(conta?.provas, c.id, dia);
    return (
      <button key={c.id} className="painel-destaque" onClick={() => ir('mundo', c.id)} style={{ textAlign: 'left', color: 'inherit' }}>
        <span className="linha" style={{ justifyContent: 'space-between', gap: 8 }}>
          <span className="eyebrow" style={{ color: n === 5 ? 'var(--t-green)' : 'var(--t-yellow)' }}>Mundo {c.numero}{n === 5 ? ' · completo' : ''}</span>
          <SeloProva s={s} />
        </span>
        <span className="display" style={{ fontSize: 24, display: 'block', marginTop: 2 }}>{c.titulo}</span>
        <span className="muted small" style={{ display: 'block' }}>{c.subtitulo}{s.tipo === 'chegando' ? ` · prova no dia ${diaMes(conta!.provas![c.id])}` : ''}</span>
        <span className="barra barra-verde" style={{ display: 'block', marginTop: 12 }} aria-label={`${n} de 5 fases`}><div style={{ width: `${(n / 5) * 100}%` }} /></span>
      </button>
    );
  };
  return (
    <main className="tela">
      <div>
        <div className="eyebrow">História</div>
        <h1 className="display h1">Escolha o mundo</h1>
      </div>
      {atuais.map(cartao)}
      {passadas.length > 0 && (
        <section aria-label="Já teve prova" className="coluna" style={{ marginTop: 8 }}>
          <div>
            <h2 className="display h3" style={{ margin: 0 }}>Já teve prova na escola</h2>
            <div className="muted small">Continuam valendo XP e pacotes. Bons para revisar!</div>
          </div>
          {passadas.map(cartao)}
        </section>
      )}
    </main>
  );
}

const NO_FEITA = 'linear-gradient(180deg, #86EFAC, #22C55E)';

export function Mundo({ id }: { id: string }) {
  const e = useEstado();
  const { conta } = useConta();
  const cap = capituloPorId(id);
  if (!cap) return <main className="tela"><p>Mundo não encontrado.</p></main>;
  const feitas = FASES.filter((f) => e.feitas[chave(cap.id, f)]).length;
  const agora = FASES.find((f) => !e.feitas[chave(cap.id, f)]);
  const recuo = [0, 56, 112, 56, 0];

  return (
    <main className="tela">
      <div className="coluna" style={{ gap: 2 }}>
        <button className="voltar" onClick={() => ir('mundos')}><Icone nome="voltar" tamanho={18} espessura={3} />{cap.materia}</button>
        <div className="linha" style={{ justifyContent: 'space-between', gap: 8 }}>
          <div className="eyebrow">Mundo {cap.numero}</div>
          <SeloProva s={situacao(conta?.provas, cap.id, hoje())} />
        </div>
        <h1 className="display h1">{cap.titulo}</h1>
        <div className="muted small">{feitas} de 5 fases completas{e.notas[cap.id] !== undefined ? ` · melhor nota na prova: ${e.notas[cap.id].toLocaleString('pt-BR')}` : ''}</div>
      </div>

      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {FASES.map((f, i) => {
          const feita = !!e.feitas[chave(cap.id, f)];
          const livre = liberada(e, cap.id, f);
          const eAgora = f === agora;
          const tam = eAgora ? 78 : 64;
          const estilo: React.CSSProperties = feita
            ? { background: NO_FEITA, border: '3px solid var(--ink)', boxShadow: '3px 3px 0 var(--ink)' }
            : eAgora
              ? { background: 'linear-gradient(180deg, #FDE68A 0%, #FACC15 45%, #EAB308 100%)', border: '3px solid var(--ink)', boxShadow: '4px 4px 0 var(--ink), 0 0 0 8px #FFC21A55, 0 8px 24px #FACC1555' }
              : { background: 'var(--surface)', border: '3px dashed #10213F66' };
          return (
            <li key={f} style={{ paddingLeft: recuo[i] }}>
              <button disabled={!livre} onClick={() => ir('fase', cap.id, f)} className="linha"
                style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', gap: 14, cursor: livre ? 'pointer' : 'not-allowed' }}
                aria-label={`${f === 'prova' ? 'Chefão' : `Fase ${i + 1}`}: ${FASE_INFO[f].titulo}${feita ? ', completa' : livre ? '' : ', bloqueada'}`}>
                <span style={{ width: tam, height: tam, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', color: feita ? '#052E16' : eAgora ? 'var(--ink)' : 'var(--muted)', ...estilo }}>
                  <Icone nome={feita ? 'check' : livre ? 'play' : 'cadeado'} tamanho={feita ? 30 : 28} cheio={!feita && livre} espessura={feita ? 3.5 : 2.5} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 11, fontWeight: 900, letterSpacing: '.06em', textTransform: 'uppercase', color: eAgora ? 'var(--t-yellow)' : feita ? 'var(--t-green)' : 'var(--muted)' }}>{f === 'prova' ? 'Chefão' : eAgora ? 'Agora' : `Fase ${i + 1}`}</span>
                  <span className="display" style={{ display: 'block', fontSize: 19, color: livre ? 'var(--ink)' : 'var(--muted)' }}>{FASE_INFO[f].titulo}</span>
                  <span className="muted small">{FASE_INFO[f].sub} · +{FASE_INFO[f].xp} XP</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {extrasDo(cap).length > 0 && (
        <section aria-label="Jogos extras" className="coluna" style={{ gap: 8 }}>
          <div>
            <h2 className="display h3" style={{ margin: 0 }}>Jogos extras</h2>
            <div className="muted small">
              {extrasLiberados(e, cap.id) ? 'Termine todos para ganhar um pacote' : 'Abrem depois de ouvir os temas'}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {extrasDo(cap).map((x) => {
              const livre = extrasLiberados(e, cap.id);
              const feito = !!e.feitas[chaveExtra(cap.id, x)];
              return (
                <button key={x} disabled={!livre} onClick={() => ir('extra', cap.id, x)} className="painel"
                  style={{ textAlign: 'left', color: 'inherit', padding: 12, display: 'flex', flexDirection: 'column', gap: 4,
                    borderColor: feito ? '#22C55E' : livre ? 'var(--line-2)' : 'var(--line)', borderStyle: livre ? 'solid' : 'dashed', opacity: livre ? 1 : 0.6 }}
                  aria-label={`${EXTRA_INFO[x].titulo}${feito ? ', completo' : livre ? '' : ', bloqueado'}`}>
                  <span style={{ color: feito ? 'var(--t-green)' : livre ? 'var(--cyan-2)' : 'var(--muted)' }}>
                    <Icone nome={feito ? 'check' : livre ? 'play' : 'cadeado'} tamanho={20} cheio={!feito && livre} espessura={3} />
                  </span>
                  <span className="display" style={{ fontSize: 17 }}>{EXTRA_INFO[x].titulo}</span>
                  <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>+{EXTRA_INFO[x].xp} XP</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="painel-destaque linha" style={{ marginTop: 'auto' }}>
        <Pacote tamanho="mini" />
        <div><div className="display" style={{ fontSize: 18 }}>Prêmios do mundo</div><div className="muted small">Pacote no jogo da memória, no quiz, nos jogos extras e um épico na prova</div></div>
      </div>
    </main>
  );
}
