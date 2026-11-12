// Ranking da turma: escolher entre o placar da semana (zera na segunda) e o geral (desde o começo).
// Usado pela criança (aba Turma) e pelo responsável (área dos adultos).

export interface NumerosDoPlacar { xp: number; cartas: number; vitorias?: number; xp_total?: number; vitorias_total?: number }

export type Aba = 'xp' | 'cartas' | 'vitorias';
export type Periodo = 'semana' | 'geral';

/** O número de cada aba: XP e duelos da semana (zera na segunda) ou desde o começo; cartas é sempre o álbum todo. */
export function numeroDoPlacar(p: NumerosDoPlacar, aba: Aba, periodo: Periodo) {
  if (aba === 'cartas') return p.cartas; // "Mais cartas" é sempre o álbum inteiro (Lucas, 12/11/2026)
  if (periodo === 'geral') return (aba === 'xp' ? p.xp_total : p.vitorias_total) ?? 0;
  return (aba === 'xp' ? p.xp : p.vitorias) ?? 0;
}

export function legendaDoPlacar(aba: Aba, periodo: Periodo) {
  if (aba === 'cartas') return 'Cartas diferentes no álbum. Este placar não zera.';
  if (periodo === 'geral') return { xp: 'Todo o XP desde o começo.', vitorias: 'Vitórias no Duelo do Saber desde o começo.' }[aba] + ' Este placar não zera.';
  return { xp: 'XP ganho nesta semana.', vitorias: 'Vitórias no Duelo do Saber nesta semana.' }[aba] + ' Zera toda segunda-feira.';
}

/** "Ranking semanal" ou "Ranking geral". */
export function EscolhaPeriodo({ periodo, mudar }: { periodo: Periodo; mudar: (p: Periodo) => void }) {
  return (
    <div className="linha" role="tablist" aria-label="Qual placar" style={{ gap: 6, padding: 4, borderRadius: 999, border: '2px solid var(--ink)', background: 'var(--surface)' }}>
      {(['semana', 'geral'] as const).map((k) => (
        <button key={k} role="tab" aria-selected={periodo === k} onClick={() => mudar(k)}
          style={{ flex: 1, minHeight: 40, borderRadius: 999, border: 0, cursor: 'pointer', fontFamily: 'Lilita One, sans-serif', fontSize: 'clamp(13px, 4.2vw, 16px)', padding: '0 6px', minWidth: 0, whiteSpace: 'nowrap',
            background: periodo === k ? 'var(--yellow)' : 'transparent', color: 'var(--ink)', boxShadow: periodo === k ? 'inset 0 0 0 2px var(--ink)' : 'none' }}>
          {k === 'semana' ? 'Ranking semanal' : 'Ranking geral'}
        </button>
      ))}
    </div>
  );
}

