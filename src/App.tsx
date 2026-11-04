import { Nav } from './components/Nav';
import { FASES, type Fase } from './lib/jogo';
import { ir, useRota } from './lib/rota';
import { useEstado } from './lib/store';
import { Adulto } from './screens/Adulto';
import { Album, AbrirPacote } from './screens/Colecao';
import { TelaFase } from './screens/Fases';
import { BoasVindas, Inicio } from './screens/Inicio';
import { Mundo, Mundos } from './screens/Mundos';
import { EntrarConta, MinhaConta, Ranking, Trocas } from './screens/Turma';

export function App() {
  const e = useEstado();
  const [pagina = '', a, b] = useRota();

  // Telas que não precisam do perfil da criança
  if (pagina === 'adulto') return <div className="app"><Adulto turmaId={a} /></div>;
  if (pagina === 'entrar') return <div className="app"><EntrarConta aoTerminar={() => ir()} aoVoltar={() => (e.perfil ? ir('trocas') : ir())} /></div>;
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
    case 'trocas': tela = <Trocas />; break;
    case 'ranking': tela = <Ranking />; break;
    case 'conta': tela = <MinhaConta />; aba = ''; break;
    default: tela = <Inicio />; aba = '';
  }
  return (
    <div className="app">
      {tela}
      {comNav && <Nav ativo={aba} />}
    </div>
  );
}
