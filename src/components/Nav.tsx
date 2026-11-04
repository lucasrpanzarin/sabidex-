import { Icone, type NomeIcone } from './Icone';
import { ir } from '../lib/rota';
import { useEstado } from '../lib/store';
import { useConta } from '../lib/conta';

const itens: { id: string; rotulo: string; icone: NomeIcone }[] = [
  { id: '', rotulo: 'Início', icone: 'inicio' },
  { id: 'mundos', rotulo: 'Fases', icone: 'fases' },
  { id: 'album', rotulo: 'Álbum', icone: 'album' },
  { id: 'trocas', rotulo: 'Trocas', icone: 'trocas' },
  { id: 'ranking', rotulo: 'Ranking', icone: 'ranking' },
];

export function Nav({ ativo }: { ativo: string }) {
  const e = useEstado();
  const { propostasNovas } = useConta();
  return (
    <nav className="nav" aria-label="Menu principal">
      {itens.map((i) => (
        <button key={i.id} onClick={() => (i.id ? ir(i.id) : ir())} aria-current={ativo === i.id ? 'page' : undefined}>
          <Icone nome={i.icone} />
          {i.rotulo}
          {i.id === 'album' && e.pacotes.length > 0 && <span className="badge" aria-label={`${e.pacotes.length} pacotes`}>{e.pacotes.length}</span>}
          {i.id === 'trocas' && propostasNovas > 0 && <span className="badge" aria-label={`${propostasNovas} propostas de troca`}>{propostasNovas}</span>}
        </button>
      ))}
    </nav>
  );
}
