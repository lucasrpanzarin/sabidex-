import { useMemo, useState } from 'react';
import { Ara } from '../components/Ara';
import { Icone } from '../components/Icone';
import { capitulos } from '../data';
import { embaralhar, hoje, nivel, notaDe, type Resultado } from '../lib/jogo';
import { aplicarMissoes } from '../lib/missoes';
import { AvisoMissao, MOTIVO } from './Fases';
import { concluirRevisao, paraHoje, proximaData, registrarResposta, type ItemRevisao } from '../lib/revisao';
import { Moeda } from '../components/Loja';
import { ir } from '../lib/rota';
import { getEstado, setEstado } from '../lib/store';

const LETRAS = ['A', 'B', 'C', 'D'];

function quandoVolta(dia: string | null) {
  if (!dia) return 'Jogue as fases para ter perguntas para revisar.';
  const amanha = new Date(); amanha.setDate(amanha.getDate() + 1);
  if (dia === hoje(amanha)) return 'Volte amanhã: tem revisão esperando por você.';
  const [, m, d] = dia.split('-');
  return `A próxima revisão é no dia ${Number(d)}/${Number(m)}.`;
}

export function Revisao() {
  const dia = hoje();
  // A lista é montada uma vez por sessão: responder não muda as perguntas desta rodada.
  const [itens] = useState<ItemRevisao[]>(() => paraHoje(getEstado().revisao, capitulos, dia));
  const ordens = useMemo(() => itens.map(() => embaralhar([0, 1, 2, 3])), [itens]);
  const [i, setI] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [retorno, setRetorno] = useState<{ ok: boolean; certa: string; explicacao: string } | null>(null);
  const [fim, setFim] = useState<Resultado | null>(null);

  if (!itens.length || fim) {
    const e = getEstado();
    return (
      <main className="tela" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div className={fim ? 'pop' : ''}><Ara tamanho={120} /></div>
        <h1 className="display h1" style={fim ? { color: 'var(--t-yellow)' } : undefined}>
          {fim ? (acertos === itens.length ? 'Memória de arara!' : 'Revisão feita!') : 'Tudo revisado!'}
        </h1>
        {fim && <div className="display" style={{ fontSize: 26 }}>{acertos} de {itens.length} certas</div>}
        {fim && (
          <div className="painel coluna sobe" style={{ width: '100%', gap: 8 }}>
            <div className="linha" style={{ justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span className="display" style={{ fontSize: 30, color: 'var(--t-cyan)' }}>+{fim.xpGanho} XP</span>
              <span className="display linha" style={{ fontSize: 30, color: 'var(--t-yellow)', gap: 6 }}><Moeda tamanho={26} />+{fim.xpGanho}</span>
            </div>
            {fim.subiuNivel && <div className="display pop" style={{ fontSize: 22, color: 'var(--t-green)' }}>Subiu para o nível {nivel(fim.estado.xp).nivel}!</div>}
          </div>
        )}
        {fim?.missao && <AvisoMissao m={fim.missao} />}
        {fim && fim.pacotesGanhos.length > 0 && (
          <div className="painel-destaque sobe" style={{ width: '100%', borderColor: 'var(--pink)' }}>
            <div className="display" style={{ fontSize: 22 }}>{fim.pacotesGanhos.length > 1 ? `Você ganhou ${fim.pacotesGanhos.length} pacotes!` : 'Você ganhou um pacote!'}</div>
            {fim.pacotesGanhos.map((p, k) => <div key={k} className="muted small">{MOTIVO[p.motivo]}</div>)}
          </div>
        )}
        <div className="balao">
          {fim && acertos < itens.length ? 'As que você errou voltam amanhã. É assim que a memória fica forte! ' : ''}
          {quandoVolta(proximaData(e.revisao, dia))}
        </div>
        <div className="coluna" style={{ width: '100%' }}>
          {fim && fim.pacotesGanhos.length > 0
            ? <button className="btn btn-amarelo btn-bloco" onClick={() => ir('pacote')}>Abrir pacote</button>
            : <button className="btn btn-amarelo btn-bloco" onClick={() => ir()}>Voltar ao início</button>}
        </div>
      </main>
    );
  }

  const it = itens[i];
  const responder = (ok: boolean, certa: string) => {
    if (retorno) return;
    if (ok) setAcertos((a) => a + 1);
    setEstado((e) => ({ ...e, revisao: registrarResposta(e.revisao, it.id, ok, dia) }));
    setRetorno({ ok, certa, explicacao: it.q.explicacao });
  };
  const proxima = () => {
    setRetorno(null);
    if (i + 1 < itens.length) { setI(i + 1); return; }
    const caps = [...new Set(itens.map((x) => x.cap.id))];
    const antes = getEstado();
    const r = aplicarMissoes(antes, concluirRevisao(antes, acertos, itens.length, caps), { tipo: 'revisao', nota: notaDe(acertos, itens.length) });
    setEstado(r.estado);
    setFim(r);
  };

  return (
    <main className="tela">
      <div className="coluna" style={{ gap: 2 }}>
        <div className="linha" style={{ justifyContent: 'space-between' }}>
          <button className="voltar" onClick={() => ir()}><Icone nome="voltar" tamanho={18} espessura={3} />Início</button>
          <span className="pilula">{i + 1}/{itens.length}</span>
        </div>
        <h1 className="display h2">Revisão do Ará</h1>
        <div className="muted small">
          {getEstado().pacoteDia !== dia ? 'Termine para ganhar o pacote do dia' : 'Lembrar de novo deixa a memória forte'}
        </div>
      </div>
      <div className="barra barra-rosa"><div style={{ width: `${(i / itens.length) * 100}%` }} /></div>
      <div className="eyebrow" style={{ color: 'var(--muted)' }}>Mundo {it.cap.numero} · {it.cap.titulo}</div>

      {it.tipo === 'quiz' ? (
        <>
          <div className="painel-destaque" style={{ minHeight: 130, display: 'grid', placeItems: 'center' }}>
            <p className="display" style={{ fontSize: 22, margin: 0, textAlign: 'center' }}>{it.q.frase}</p>
          </div>
          {!retorno && (
            <div className="linha" style={{ gap: 10 }}>
              <button className="btn btn-verde" style={{ flex: 1, minHeight: 72, fontSize: 22 }} onClick={() => responder(it.q.verdadeira, it.q.verdadeira ? 'Verdadeiro' : 'Falso')}>Verdadeiro</button>
              <button className="btn btn-vermelho" style={{ flex: 1, minHeight: 72, fontSize: 22 }} onClick={() => responder(!it.q.verdadeira, it.q.verdadeira ? 'Verdadeiro' : 'Falso')}>Falso</button>
            </div>
          )}
        </>
      ) : (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="coluna">
          <legend className="display" style={{ fontSize: 22, marginBottom: 12 }}>{it.q.pergunta}</legend>
          {ordens[i].map((orig, k) => {
            const q = it.q as Extract<ItemRevisao, { tipo: 'prova' }>['q'];
            const ehCerta = orig === q.certa;
            const cor = retorno ? (ehCerta ? '#22C55E' : 'var(--line)') : 'var(--line)';
            return (
              <button key={k} disabled={!!retorno} onClick={() => responder(ehCerta, q.opcoes[q.certa])} className="linha"
                style={{ minHeight: 60, borderRadius: 16, padding: '10px 12px', textAlign: 'left', fontWeight: 700,
                  background: retorno && ehCerta ? '#DCFCE7' : 'var(--surface)', border: `3px solid ${cor}`, opacity: retorno && !ehCerta ? 0.6 : 1 }}>
                <span style={{ width: 32, height: 32, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', background: 'var(--bg)' }}>{LETRAS[k]}</span>
                {q.opcoes[orig]}
              </button>
            );
          })}
        </fieldset>
      )}

      {retorno && (
        <div className="coluna sobe" style={{ marginTop: 'auto' }}>
          <div className={`aviso ${retorno.ok ? 'aviso-ok' : 'aviso-erro'}`}>
            <span className="display" style={{ fontSize: 18 }}>{retorno.ok ? 'Acertou! ' : `Era: ${retorno.certa}. `}</span>{retorno.explicacao}
          </div>
          <button className="btn btn-amarelo btn-bloco" onClick={proxima}>{i + 1 < itens.length ? 'Próxima' : 'Terminar'}</button>
        </div>
      )}
    </main>
  );
}
