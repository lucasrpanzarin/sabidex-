import { Icone } from './Icone';
import { ir } from '../lib/rota';
import { useEstado } from '../lib/store';
import { useConta } from '../lib/conta';
import { jogar } from '../screens/Inicio';

// Menu de baixo no jeito "álbum de figurinhas" (Lucas, 05/11/2026): cada aba tem um desenho colorido
// com contorno escuro, e a aba aberta vira um adesivo colado (torto, com sombra). Sem animação.

type Aba = 'inicio' | 'album' | 'turma' | 'ranking';
const COR: Record<Aba, string> = { inicio: 'var(--coral)', album: 'var(--cyan)', turma: 'var(--pink)', ranking: 'var(--yellow)' };

/** Desenhos de duas cores: preenchimento colorido + contorno escuro. */
function Desenho({ aba }: { aba: Aba }) {
  const cor = COR[aba];
  const t = { stroke: 'var(--ink)', strokeWidth: 2.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  return (
    <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
      {aba === 'inicio' && <>
        <path d="M4.5 15.5L16 6l11.5 9.5" fill="none" {...t} />
        <path d="M7.5 13.5V26a1.5 1.5 0 001.5 1.5h14a1.5 1.5 0 001.5-1.5V13.5L16 6.5z" fill={cor} {...t} />
        <path d="M13 27.5v-6.5a3 3 0 016 0v6.5" fill="#FFF" {...t} />
      </>}
      {aba === 'album' && <>
        <path d="M16 8.5c-3.5-2.5-8-2.5-11.5-1v18c3.5-1.5 8-1.5 11.5 1z" fill={cor} {...t} />
        <path d="M16 8.5c3.5-2.5 8-2.5 11.5-1v18c-3.5-1.5-8-1.5-11.5 1z" fill={cor} {...t} />
        <rect x="18.5" y="10" width="6.5" height="8.5" rx="1.5" fill="#FFF" transform="rotate(6 21.7 14.2)" {...t} strokeWidth={2} />
        <path d="M7.5 12h5M7.5 16h5" fill="none" {...t} strokeWidth={2} />
      </>}
      {aba === 'turma' && <>
        <circle cx="21.5" cy="11.5" r="4" fill="#FFF" {...t} />
        <path d="M14.5 27.5a7 7 0 0114 0z" fill="#FFF" {...t} />
        <circle cx="11.5" cy="12.5" r="4.5" fill={cor} {...t} />
        <path d="M3.5 28a8 8 0 0116 0z" fill={cor} {...t} />
      </>}
      {aba === 'ranking' && <>
        <path d="M9.5 7.5H5.5a4 4 0 004.5 5M22.5 7.5h4a4 4 0 01-4.5 5" fill="none" {...t} />
        <path d="M9 5h14v7.5a7 7 0 01-14 0z" fill={cor} {...t} />
        <path d="M16 19.5v4" fill="none" {...t} />
        <rect x="10" y="23.5" width="12" height="4.5" rx="1.5" fill={cor} {...t} />
        <path d="M16 8.3l1.1 2.2 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3z" fill="#FFF" stroke="var(--ink)" strokeWidth={1.3} strokeLinejoin="round" />
      </>}
    </svg>
  );
}

const itens: { id: string; rotulo: string; aba: Aba | 'jogar' }[] = [
  { id: '', rotulo: 'Início', aba: 'inicio' },
  { id: 'album', rotulo: 'Álbum', aba: 'album' },
  { id: 'jogar', rotulo: 'Jogar', aba: 'jogar' },
  { id: 'trocas', rotulo: 'Turma', aba: 'turma' },
  { id: 'ranking', rotulo: 'Ranking', aba: 'ranking' },
];

export function Nav({ ativo }: { ativo: string }) {
  const e = useEstado();
  const { propostasNovas, desafiosNovos, chat } = useConta();
  const avisosTurma = propostasNovas + desafiosNovos;
  return (
    <nav className="nav" aria-label="Menu principal">
      {itens.map((i) => i.aba === 'jogar' ? (
        <button key="jogar" className="nav-jogar" onClick={jogar} aria-label="Jogar a próxima fase" aria-current={ativo === 'mundos' ? 'page' : undefined}>
          <span className="nav-jogar-bola"><Icone nome="play" cheio tamanho={30} /></span>
          <span className="nav-rotulo">Jogar</span>
        </button>
      ) : (
        <button key={i.id} onClick={() => (i.id ? ir(i.id) : ir())} aria-current={ativo === i.id ? 'page' : undefined} style={{ '--aba': COR[i.aba] } as React.CSSProperties}>
          <span className="nav-figurinha"><Desenho aba={i.aba} /></span>
          <span className="nav-rotulo">{i.rotulo}</span>
          {i.id === 'album' && e.pacotes.length > 0 && <span className="badge" aria-label={`${e.pacotes.length} pacotes`}>{e.pacotes.length}</span>}
          {i.id === 'trocas' && avisosTurma > 0 && <span className="badge" aria-label={`${avisosTurma} ${avisosTurma > 1 ? 'avisos' : 'aviso'} de trocas e duelos`}>{avisosTurma}</span>}
          {/* Só mensagem nova no chat: uma bolinha sem número (trocas e duelos vêm antes). */}
          {i.id === 'trocas' && avisosTurma === 0 && !!chat?.novas && <span className="badge badge-ponto" aria-label="Mensagens novas na conversa da turma" />}
        </button>
      ))}
    </nav>
  );
}
