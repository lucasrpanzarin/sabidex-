// Desafio do dia (Lucas, 12/11/2026): 10 perguntas misturadas das unidades já começadas de uma matéria.
// Nota 7 ou mais dá 1 pacote por matéria por dia. Uma chance por pergunta, como em todos os jogos.

import { useState } from 'react';
import { Ara } from '../components/Ara';
import { Icone } from '../components/Icone';
import { Moeda } from '../components/Loja';
import { Pacote } from '../components/Pacote';
import { estudoDa } from '../lib/conta';
import { concluirDesafio, montarDesafio, situacaoDesafio, type ItemDesafio } from '../lib/desafio';
import { hoje, nivel, notaDe, type Resultado } from '../lib/jogo';
import { aplicarMissoes } from '../lib/missoes';
import { registrarResposta } from '../lib/revisao';
import { ir } from '../lib/rota';
import { getEstado, setEstado } from '../lib/store';
import { Pergunta, TextoMat } from './Contas';
import { AvisoMissao, MOTIVO, Placar } from './Fases';

const LETRAS = ['A', 'B', 'C', 'D'];

export function Desafio({ materia }: { materia: string }) {
  const dia = hoje();
  const caps = estudoDa().caps;
  const sit = situacaoDesafio(getEstado(), materia);
  const [itens] = useState<ItemDesafio[]>(() => montarDesafio(getEstado(), caps, materia, dia, sit.tentativas));
  const [i, setI] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [retorno, setRetorno] = useState<{ ok: boolean; certa: string; explicacao: string } | null>(null);
  const [fim, setFim] = useState<Resultado | null>(null);

  // Já ganhou o pacote de hoje desta matéria: volta amanhã.
  if (!fim && sit.feito) {
    return (
      <main className="tela" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Ara tamanho={120} />
        <h1 className="display h1">Desafio feito!</h1>
        <div className="balao">Você já fez o Desafio de {materia} de hoje. Amanhã tem outro!</div>
        <button className="btn btn-amarelo btn-bloco" onClick={() => ir()}>Voltar ao início</button>
      </main>
    );
  }

  if (!itens.length) {
    return (
      <main className="tela" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Ara tamanho={120} />
        <h1 className="display h1">Ainda não dá</h1>
        <div className="balao">Comece uma unidade de {materia} (ouça os temas) para o desafio aparecer.</div>
        <button className="btn btn-amarelo btn-bloco" onClick={() => ir('mundos', materia)}>Ver as unidades</button>
      </main>
    );
  }

  if (fim) {
    const passou = notaDe(acertos, itens.length) >= 7;
    return (
      <main className="tela" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div className="pop"><Ara tamanho={120} /></div>
        <h1 className="display h1" style={{ color: 'var(--t-yellow)' }}>{passou ? 'Desafio vencido!' : 'Quase lá!'}</h1>
        <Placar acertos={acertos} total={itens.length} />
        <div className="painel coluna sobe" style={{ width: '100%', gap: 8 }}>
          <div className="linha" style={{ justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span className="display" style={{ fontSize: 30, color: 'var(--t-cyan)' }}>+{fim.xpGanho} XP</span>
            <span className="display linha" style={{ fontSize: 30, color: 'var(--t-yellow)', gap: 6 }}><Moeda tamanho={26} />+{fim.xpGanho}</span>
          </div>
          {fim.subiuNivel && <div className="display pop" style={{ fontSize: 22, color: 'var(--t-green)' }}>Subiu para o nível {nivel(fim.estado.xp).nivel}!</div>}
        </div>
        {fim.missao && <AvisoMissao m={fim.missao} />}
        {fim.pacotesGanhos.length > 0 && (
          <div className="painel-destaque sobe" style={{ width: '100%', borderColor: 'var(--pink)' }}>
            <div className="display" style={{ fontSize: 22 }}>{fim.pacotesGanhos.length > 1 ? `Você ganhou ${fim.pacotesGanhos.length} pacotes!` : 'Você ganhou um pacote!'}</div>
            {fim.pacotesGanhos.map((p, k) => <div key={k} className="muted small">{MOTIVO[p.motivo]}</div>)}
          </div>
        )}
        {!passou && <div className="balao">Com nota 7 você ganha o pacote do desafio. Tente de novo: vêm perguntas novas!</div>}
        <div className="coluna" style={{ width: '100%' }}>
          {fim.pacotesGanhos.length > 0
            ? <button className="btn btn-amarelo btn-bloco" onClick={() => ir('pacote')}>{fim.pacotesGanhos.length > 1 ? 'Abrir pacotes' : 'Abrir pacote'}</button>
            : !passou
              ? <button className="btn btn-amarelo btn-bloco" onClick={() => ir('desafio', materia, String(Date.now()))}>Tentar de novo</button>
              : null}
          <button className="btn btn-escuro btn-bloco" onClick={() => ir()}>Voltar ao início</button>
        </div>
      </main>
    );
  }

  const it = itens[i];
  const registrar = (ok: boolean) => {
    if (ok) setAcertos((a) => a + 1);
    if (it.id) setEstado((e) => ({ ...e, revisao: registrarResposta(e.revisao, it.id!, ok, dia) }));
  };
  const responder = (ok: boolean, certa: string, explicacao: string) => {
    if (retorno) return;
    registrar(ok);
    setRetorno({ ok, certa, explicacao });
  };
  const proxima = () => {
    setRetorno(null);
    if (i + 1 < itens.length) { setI(i + 1); return; }
    const antes = getEstado();
    // `acertos` já tem a última resposta (o estado atualiza antes do toque em "Terminar").
    const r = aplicarMissoes(antes, concluirDesafio(antes, materia, acertos, itens.length, itens[0].cap.id), { tipo: 'desafio', nota: notaDe(acertos, itens.length) });
    setEstado(r.estado);
    setFim(r);
  };
  const rotulo = i + 1 < itens.length ? 'Próxima' : 'Terminar';

  return (
    <main className="tela">
      <div className="coluna" style={{ gap: 2 }}>
        <div className="linha" style={{ justifyContent: 'space-between' }}>
          <button className="voltar" onClick={() => ir()}><Icone nome="voltar" tamanho={18} espessura={3} />Início</button>
          <span className="pilula">{i + 1}/{itens.length}</span>
        </div>
        <h1 className="display h2">Desafio do dia · {materia}</h1>
        <div className="muted small linha" style={{ gap: 6 }}><Pacote tamanho="mini" />Nota 7 ou mais ganha 1 pacote</div>
      </div>
      <div className="barra barra-rosa"><div style={{ width: `${(i / itens.length) * 100}%` }} /></div>
      <div className="eyebrow" style={{ color: 'var(--muted)' }}>Unidade {it.cap.numero} · {it.cap.titulo}</div>

      {it.tipo === 'conta' ? (
        <Pergunta key={i} conta={it.q} rotuloProxima={rotulo} onResposta={(ok) => registrar(ok)} onProxima={proxima} />
      ) : it.tipo === 'quiz' ? (
        <>
          <div className="painel-destaque" style={{ minHeight: 130, display: 'grid', placeItems: 'center' }}>
            <p className="display" style={{ fontSize: 22, margin: 0, textAlign: 'center' }}><TextoMat t={it.q.frase} /></p>
          </div>
          {!retorno && (
            <div className="linha" style={{ gap: 10 }}>
              {[true, false].map((v) => (
                <button key={String(v)} className={`btn ${v ? 'btn-verde' : 'btn-vermelho'}`} style={{ flex: 1, minHeight: 72, fontSize: 22 }}
                  onClick={() => responder(it.q.verdadeira === v, it.q.verdadeira ? 'Verdadeiro' : 'Falso', it.q.explicacao)}>
                  {v ? 'Verdadeiro' : 'Falso'}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="coluna">
          <legend className="display" style={{ fontSize: 22, marginBottom: 12 }}><TextoMat t={it.pergunta} /></legend>
          {it.opcoes.map((op, k) => {
            const ehCerta = k === it.certa;
            const cor = retorno && ehCerta ? '#22C55E' : 'var(--line)';
            return (
              <button key={k} disabled={!!retorno} onClick={() => responder(ehCerta, it.opcoes[it.certa], it.explicacao)} className="linha"
                style={{ minHeight: 60, borderRadius: 16, padding: '10px 12px', textAlign: 'left', fontWeight: 700,
                  background: retorno && ehCerta ? '#DCFCE7' : 'var(--surface)', border: `3px solid ${cor}`, opacity: retorno && !ehCerta ? 0.6 : 1 }}>
                <span style={{ width: 32, height: 32, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', background: 'var(--bg)' }}>{LETRAS[k]}</span>
                <TextoMat t={op} />
              </button>
            );
          })}
        </fieldset>
      )}

      {retorno && (
        <div className="coluna sobe" style={{ marginTop: 'auto' }}>
          <div className={`aviso ${retorno.ok ? 'aviso-ok' : 'aviso-erro'}`}>
            <span className="display" style={{ fontSize: 18 }}>{retorno.ok ? 'Acertou! ' : <>Era: <TextoMat t={retorno.certa.replace(/\.$/, '')} />. </>}</span><TextoMat t={retorno.explicacao} />
          </div>
          <button className="btn btn-amarelo btn-bloco" onClick={proxima}>{rotulo}</button>
        </div>
      )}
    </main>
  );
}
