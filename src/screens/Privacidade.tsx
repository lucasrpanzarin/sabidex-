// Política de privacidade (as lojas pedem um endereço público para ela).
// RASCUNHO: revisar com um advogado antes de publicar nas lojas. Ao mudar o texto,
// mude também VERSAO_PRIVACIDADE em src/worker/index.ts.
import type { ReactNode } from 'react';
import { Icone } from '../components/Icone';
import { voltar } from '../lib/rota';

/** E-mail para pedidos sobre dados. */
const EMAIL_CONTATO = 'lucas@fastgsa.com';
/** Data da última mudança no texto. Só mude também `VERSAO_PRIVACIDADE` (servidor) se a mudança for importante. */
const ATUALIZADA = '5 de novembro de 2026 (responsável vê o placar da turma)';

function Parte({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="coluna" style={{ gap: 6 }}>
      <h2 className="display h3" style={{ margin: 0 }}>{titulo}</h2>
      <div style={{ lineHeight: 1.5 }}>{children}</div>
    </section>
  );
}

export function Privacidade() {
  const contato = EMAIL_CONTATO ? <a href={`mailto:${EMAIL_CONTATO}`} style={{ color: 'var(--t-cyan)' }}>{EMAIL_CONTATO}</a> : <strong>(e-mail de contato a definir)</strong>;
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
        Se você entrar com Google ou Apple, recebemos deles só o seu nome e o seu e-mail.
        Se pedir "Esqueci minha senha", o e-mail com o link é enviado pelo serviço Resend.
      </Parte>
      <Parte titulo="O que guardamos da criança">
        Só um <strong>apelido</strong>, uma <strong>cor</strong>, um <strong>PIN</strong> de 4 números (embaralhado) e o <strong>progresso no jogo</strong>:
        fases feitas, notas, XP, cartas, compras na lojinha do jogo, propostas de troca de cartas e as respostas dos duelos (Duelo do Saber).
        Se o chat da turma estiver ligado, guardamos também as <strong>mensagens</strong> que a criança escreve, por 60 dias.
        Nunca pedimos nome completo, e-mail, telefone, foto, endereço ou localização da criança.
      </Parte>
      <Parte titulo="Quem vê o quê">
        O adulto responsável vê o progresso dos filhos. Os administradores da turma (quem criou a turma e os adultos que ele convidar, como o professor ou outro responsável) veem o apelido e o progresso dos alunos da turma.
        Colegas da mesma turma veem só o apelido, a cor, as cartas, o XP da semana, as vitórias e os resultados dos duelos com ela e, se os adultos deixarem, se a criança está estudando agora.
        O responsável de uma criança da turma vê o mesmo placar que os colegas veem (apelido, cor, cartas, XP da semana, vitórias nos duelos e quem está estudando agora).
      </Parte>
      <Parte titulo="Busca de turmas">
        Adultos com conta podem procurar uma turma pelo nome ou pela escola, para pedir que o filho entre nela.
        A busca mostra só o <strong>nome da turma</strong>, o <strong>nome da escola</strong>, quantas crianças ela tem e o primeiro nome de quem a criou. Nunca mostra os apelidos das crianças.
        Crianças não usam a busca. Os administradores da turma podem tirá-la da busca a qualquer momento.
        Quando um responsável pede para o filho entrar, os administradores da turma veem o primeiro nome do responsável, o apelido, a cor e o XP da criança, e decidem se aceitam.
      </Parte>
      <Parte titulo="Chat da turma">
        Existe um chat escrito só entre colegas da <strong>mesma turma da escola</strong>, num grupo único (não há mensagem privada).
        Ele vem ligado (depois que o responsável confirma o e-mail), e o <strong>responsável</strong> vê isso ao criar o perfil do filho, podendo desligar ali ou depois, a qualquer momento, na área dos adultos. Um <strong>administrador da turma</strong> (como o professor) também pode desligar para a turma toda. Criança sem conta da família não escreve.
        O administrador escolhe o horário (o padrão é das 7h às 21h).
        O responsável e os administradores da turma (como o professor) podem <strong>ler todas as mensagens</strong>, e a criança é avisada disso na tela do chat.
        O app bloqueia palavrões, telefones, endereços, links, e-mails e nomes de redes sociais, e não aceita fotos nem áudios.
        A criança pode tocar em "Avisar um adulto" numa mensagem. Os administradores da turma podem apagar mensagens e pausar as mensagens de um aluno.
        As mensagens são apagadas sozinhas depois de 60 dias, ou na hora, junto com o perfil da criança.
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
