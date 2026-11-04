import { Icone } from '../components/Icone';
import { Pacote } from '../components/Pacote';
import { capitulos, capituloPorId } from '../data';
import { FASES, FASE_INFO, chave, liberada } from '../lib/jogo';
import { ir } from '../lib/rota';
import { useEstado } from '../lib/store';

export function Mundos() {
  const e = useEstado();
  return (
    <main className="tela">
      <div>
        <div className="eyebrow">História</div>
        <h1 className="display h1">Escolha o mundo</h1>
      </div>
      {capitulos.map((c) => {
        const n = FASES.filter((f) => e.feitas[chave(c.id, f)]).length;
        return (
          <button key={c.id} className="painel-destaque" onClick={() => ir('mundo', c.id)} style={{ textAlign: 'left', color: 'inherit' }}>
            <span className="eyebrow" style={{ color: n === 5 ? 'var(--green)' : 'var(--yellow)' }}>Mundo {c.numero}{n === 5 ? ' · completo' : ''}</span>
            <span className="display" style={{ fontSize: 24, display: 'block', marginTop: 2 }}>{c.titulo}</span>
            <span className="muted small" style={{ display: 'block' }}>{c.subtitulo}</span>
            <span className="barra barra-verde" style={{ display: 'block', marginTop: 12 }} aria-label={`${n} de 5 fases`}><div style={{ width: `${(n / 5) * 100}%` }} /></span>
          </button>
        );
      })}
    </main>
  );
}

const NO_FEITA = 'linear-gradient(180deg, #86EFAC, #22C55E)';

export function Mundo({ id }: { id: string }) {
  const e = useEstado();
  const cap = capituloPorId(id);
  if (!cap) return <main className="tela"><p>Mundo não encontrado.</p></main>;
  const feitas = FASES.filter((f) => e.feitas[chave(cap.id, f)]).length;
  const agora = FASES.find((f) => !e.feitas[chave(cap.id, f)]);
  const recuo = [0, 56, 112, 56, 0];

  return (
    <main className="tela">
      <div className="coluna" style={{ gap: 2 }}>
        <button className="voltar" onClick={() => ir('mundos')}><Icone nome="voltar" tamanho={18} espessura={3} />{cap.materia}</button>
        <div className="eyebrow">Mundo {cap.numero}</div>
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
            ? { background: NO_FEITA, boxShadow: 'inset 0 -4px 0 #15803D, inset 0 2px 0 #DCFCE7' }
            : eAgora
              ? { background: 'linear-gradient(180deg, #FDE68A 0%, #FACC15 45%, #EAB308 100%)', boxShadow: 'inset 0 -5px 0 #CA8A04, inset 0 2px 0 #FEF9C3, 0 0 0 6px #FACC1533, 0 8px 24px #FACC1555' }
              : { background: 'var(--surface)', border: '1.5px dashed var(--line-2)' };
          return (
            <li key={f} style={{ paddingLeft: recuo[i] }}>
              <button disabled={!livre} onClick={() => ir('fase', cap.id, f)} className="linha"
                style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', gap: 14, cursor: livre ? 'pointer' : 'not-allowed' }}
                aria-label={`${f === 'prova' ? 'Chefão' : `Fase ${i + 1}`}: ${FASE_INFO[f].titulo}${feita ? ', completa' : livre ? '' : ', bloqueada'}`}>
                <span style={{ width: tam, height: tam, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', color: feita ? '#052E16' : eAgora ? 'var(--bg)' : 'var(--muted)', ...estilo }}>
                  <Icone nome={feita ? 'check' : livre ? 'play' : 'cadeado'} tamanho={feita ? 30 : 28} cheio={!feita && livre} espessura={feita ? 3.5 : 2.5} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 11, fontWeight: 900, letterSpacing: '.06em', textTransform: 'uppercase', color: eAgora ? 'var(--yellow)' : feita ? 'var(--green)' : 'var(--muted)' }}>{f === 'prova' ? 'Chefão' : eAgora ? 'Agora' : `Fase ${i + 1}`}</span>
                  <span className="display" style={{ display: 'block', fontSize: 19, color: livre ? 'var(--ink)' : 'var(--muted)' }}>{FASE_INFO[f].titulo}</span>
                  <span className="muted small">{FASE_INFO[f].sub} · +{FASE_INFO[f].xp} XP</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="painel-destaque linha" style={{ marginTop: 'auto' }}>
        <Pacote tamanho="mini" />
        <div><div className="display" style={{ fontSize: 18 }}>Prêmios do mundo</div><div className="muted small">Pacote no jogo da memória, no quiz e um épico na prova</div></div>
      </div>
    </main>
  );
}
