import { Icone, type NomeIcone } from './Icone';
import { ir } from '../lib/rota';
import { useEstado } from '../lib/store';
import { useConta } from '../lib/conta';
import { jogar } from '../screens/Inicio';

const itens: { id: string; rotulo: string; icone: NomeIcone }[] = [
  { id: '', rotulo: 'Início', icone: 'inicio' },
  { id: 'album', rotulo: 'Álbum', icone: 'album' },
  { id: 'jogar', rotulo: 'Jogar', icone: 'play' },
  { id: 'trocas', rotulo: 'Trocas', icone: 'trocas' },
  { id: 'ranking', rotulo: 'Ranking', icone: 'ranking' },
];

export function Nav({ ativo }: { ativo: string }) {
  const e = useEstado();
  const { propostasNovas, desafiosNovos } = useConta();
  const avisosTurma = propostasNovas + desafiosNovos;
  return (
    <nav className="nav" aria-label="Menu principal">
      {itens.map((i) => i.id === 'jogar' ? (
        <button key="jogar" className="nav-jogar" onClick={jogar} aria-label="Jogar a próxima fase" aria-current={ativo === 'mundos' ? 'page' : undefined}>
          <span className="nav-jogar-bola"><Icone nome="play" cheio tamanho={30} /></span>
          Jogar
        </button>
      ) : (
        <button key={i.id} onClick={() => (i.id ? ir(i.id) : ir())} aria-current={ativo === i.id ? 'page' : undefined}>
          <Icone nome={i.icone} />
          {i.rotulo}
          {i.id === 'album' && e.pacotes.length > 0 && <span className="badge" aria-label={`${e.pacotes.length} pacotes`}>{e.pacotes.length}</span>}
          {i.id === 'trocas' && avisosTurma > 0 && <span className="badge" aria-label={`${avisosTurma} ${avisosTurma > 1 ? 'avisos' : 'aviso'} de trocas e duelos`}>{avisosTurma}</span>}
        </button>
      ))}
    </nav>
  );
}
