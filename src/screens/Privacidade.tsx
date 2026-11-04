// Política de privacidade (as lojas pedem um endereço público para ela).
// RASCUNHO: revisar com um advogado antes de publicar nas lojas. Ao mudar o texto,
// mude também VERSAO_PRIVACIDADE em src/worker/index.ts.
import type { ReactNode } from 'react';
import { Icone } from '../components/Icone';
import { voltar } from '../lib/rota';

/** E-mail para pedidos sobre dados. Preencher antes de publicar nas lojas. */
const EMAIL_CONTATO = '';
const ATUALIZADA = 'novembro de 2026';

function Parte({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="coluna" style={{ gap: 6 }}>
      <h2 className="display h3" style={{ margin: 0 }}>{titulo}</h2>
      <div style={{ lineHeight: 1.5 }}>{children}</div>
    </section>
  );
}

export function Privacidade() {
  const contato = EMAIL_CONTATO ? <a href={`mailto:${EMAIL_CONTATO}`} style={{ color: 'var(--cyan-2)' }}>{EMAIL_CONTATO}</a> : <strong>(e-mail de contato a definir)</strong>;
  return (
    <main className="tela" style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
      <button className="voltar" onClick={() => voltar('adulto')}><Icone nome="voltar" tamanho={18} espessura={3} />Voltar</button>
      <div>
        <div className="eyebrow">Para pais, mães e professores</div>
        <h1 className="display h1">Política de privacidade</h1>
        <p className="muted small" style={{ margin: '4px 0 0' }}>Atualizada em {ATUALIZADA}.</p>
      </div>
      <Parte titulo="Resumo">
        O Sabidex é um app de estudo para crianças. Guardamos o mínimo para o jogo funcionar.
        Não mostramos anúncios, não vendemos dados e não usamos ferramentas de rastreamento de terceiros.
      </Parte>
      <Parte titulo="O que guardamos do adulto">
        Nome, e-mail e senha (a senha fica embaralhada, nunca em texto). Guardamos também a data em que você aceitou esta política.
      </Parte>
      <Parte titulo="O que guardamos da criança">
        Só um <strong>apelido</strong>, uma <strong>cor</strong>, um <strong>PIN</strong> de 4 números (embaralhado) e o <strong>progresso no jogo</strong>:
        fases feitas, notas, XP, cartas, compras na lojinha do jogo e propostas de troca de cartas.
        Nunca pedimos nome completo, e-mail, telefone, foto, endereço ou localização da criança.
      </Parte>
      <Parte titulo="Quem vê o quê">
        O adulto responsável vê o progresso dos filhos. O professor vê o apelido e o progresso dos alunos da turma dele.
        Colegas da mesma turma veem só o apelido, a cor, as cartas e o XP da semana.
        Não existe chat: as crianças só trocam propostas de cartas.
      </Parte>
      <Parte titulo="Autorização dos pais">
        A conta da família só pode ser criada por um adulto, que confirma ser o responsável pela criança.
        Sem conta, o progresso fica guardado apenas no aparelho e não é enviado para nós.
      </Parte>
      <Parte titulo="Onde os dados ficam">
        Nos servidores da Cloudflare, que hospeda o Sabidex. Eles podem ficar fora do Brasil.
        A conexão é sempre protegida (HTTPS).
      </Parte>
      <Parte titulo="Por quanto tempo">
        Enquanto a conta existir. Você pode apagar o perfil de um filho ou a conta inteira a qualquer momento,
        na área dos adultos do app ("Apagar minha conta"). Os dados são apagados na hora.
      </Parte>
      <Parte titulo="Seus direitos">
        Pela Lei Geral de Proteção de Dados (LGPD), você pode pedir para ver, corrigir ou apagar os dados seus e dos seus filhos.
        Fale com a gente em {contato}.
      </Parte>
    </main>
  );
}
