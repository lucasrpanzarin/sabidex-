import { Nav } from './components/Nav';
import { FASES, type Fase } from './lib/jogo';
import { ir, useRota } from './lib/rota';
import { useEstado } from './lib/store';
import { Adulto, ConfirmarEmail, NovaSenha } from './screens/Adulto';
import { Album, AbrirPacote } from './screens/Colecao';
import { TelaFase } from './screens/Fases';
import { BoasVindas, Inicio } from './screens/Inicio';
import { Mundo, Mundos } from './screens/Mundos';
import { Revisao } from './screens/Revisao';
import { MeuDia } from './screens/MeuDia';
import { TelaExtra } from './screens/Extras';
import { EXTRAS, type Extra } from './lib/jogo';
import { Loja } from './screens/Loja';
import { Privacidade } from './screens/Privacidade';
import { ContaCriada, EntrarConta, MinhaConta, Ranking, Trocas } from './screens/Turma';
import { useEffect } from 'react';
import { api, useConta } from './lib/conta';
import { Chat } from './screens/Chat';
import { Duelos } from './screens/Duelo';

export function App() {
  const e = useEstado();
  const [pagina = '', a, b] = useRota();
  const { contaNova, conta } = useConta();

  // "Estudando agora": com o app aberto e na tela, avisa o servidor a cada minuto (só para quem está numa turma).
  useEffect(() => {
    if (!conta?.codigo) return;
    const ping = () => { if (document.visibilityState === 'visible') void api('/crianca/ping', { corpo: {} }); };
    ping();
    const t = setInterval(ping, 60_000);
    document.addEventListener('visibilitychange', ping);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', ping); };
  }, [conta?.codigo]);

  // Telas que não precisam do perfil da criança
  if (pagina === 'nova-senha') return <div className="app"><NovaSenha token={a ?? ''} /></div>;
  if (pagina === 'confirmar-email') return <div className="app"><ConfirmarEmail token={a ?? ''} /></div>;
  if (pagina === 'privacidade') return <div className="app"><Privacidade /></div>;
  if (pagina === 'adulto') return <div className="app"><Adulto turmaId={a} /></div>;
  if (pagina === 'entrar') return <div className="app"><EntrarConta aoTerminar={() => ir()} aoVoltar={() => (e.perfil ? ir('trocas') : ir())} /></div>;
  if (!e.perfil) return <div className="app"><BoasVindas /></div>;
  // Logo depois de criar a conta na turma: mostra código, apelido e PIN para um adulto anotar.
  if (contaNova) return <div className="app"><ContaCriada /></div>;

  let tela;
  let aba = pagina;
  let comNav = true;
  switch (pagina) {
    case 'mundos': tela = <Mundos materia={a} />; break;
    case 'mundo': tela = <Mundo id={a} />; aba = 'mundos'; break;
    case 'fase':
      tela = FASES.includes(b as Fase) ? <TelaFase capId={a} fase={b as Fase} /> : <Mundos />;
      comNav = false; break;
    case 'pacote': tela = <AbrirPacote />; comNav = false; break;
    case 'extra':
      tela = EXTRAS.includes(b as Extra) ? <TelaExtra capId={a} x={b as Extra} /> : <Mundos />;
      comNav = false; break;
    case 'revisao': tela = <Revisao />; comNav = false; break;
    case 'album': tela = <Album id={a} />; break;
    case 'loja': tela = <Loja key={a ?? ''} sabimonId={a} />; aba = 'album'; break;
    case 'trocas': tela = <Trocas />; break;
    case 'duelos': tela = <Duelos />; aba = 'trocas'; break;
    case 'chat': tela = <Chat />; aba = 'trocas'; comNav = false; break;
    case 'dia': tela = <MeuDia />; aba = ''; break;
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
