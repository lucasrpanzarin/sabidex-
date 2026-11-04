import { Nav } from './components/Nav';
import { FASES, type Fase } from './lib/jogo';
import { useRota } from './lib/rota';
import { useEstado } from './lib/store';
import { Album, AbrirPacote, EmBreve } from './screens/Colecao';
import { TelaFase } from './screens/Fases';
import { BoasVindas, Inicio } from './screens/Inicio';
import { Mundo, Mundos } from './screens/Mundos';

export function App() {
  const e = useEstado();
  const [pagina = '', a, b] = useRota();

  if (!e.perfil) return <div className="app"><BoasVindas /></div>;

  let tela;
  let aba = pagina;
  let comNav = true;
  switch (pagina) {
    case 'mundos': tela = <Mundos />; break;
    case 'mundo': tela = <Mundo id={a} />; aba = 'mundos'; break;
    case 'fase':
      tela = FASES.includes(b as Fase) ? <TelaFase capId={a} fase={b as Fase} /> : <Mundos />;
      comNav = false; break;
    case 'pacote': tela = <AbrirPacote />; comNav = false; break;
    case 'album': tela = <Album />; break;
    case 'trocas': tela = <EmBreve tipo="trocas" />; break;
    case 'ranking': tela = <EmBreve tipo="ranking" />; break;
    default: tela = <Inicio />; aba = '';
  }
  return (
    <div className="app">
      {tela}
      {comNav && <Nav ativo={aba} />}
    </div>
  );
}
