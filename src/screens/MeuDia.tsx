// "Meu dia": abre ao tocar nos dias seguidos do início. Mostra a sequência, os marcos e as missões do dia.
// Sem "você vai perder!" e sem contagem regressiva (docs/ESTUDOS.md): só o que já fez e o que pode fazer.

import { estudoDa } from '../lib/conta';
import { useEffect } from 'react';
import { Ara } from '../components/Ara';
import { Icone } from '../components/Icone';
import { Pacote } from '../components/Pacote';
import { sequenciaInfo } from '../lib/jogo';
import { MARCOS, MISSOES, destinoMissao, missaoFeita, missoesDeHoje, proximoMarco, quantasFeitas, type MissaoId } from '../lib/missoes';
import { ir } from '../lib/rota';
import { getEstado, setEstado, useEstado } from '../lib/store';
import { Chama, jogar } from './Inicio';

export function MeuDia() {
  const e = useEstado();
  const seq = sequenciaInfo(e.dias);
  const dias = seq.dias;
  const m = missoesDeHoje(e);
  const feitas = quantasFeitas(m);
  const todas = m.lista.length > 0 && feitas === m.lista.length;
  const prox = proximoMarco(dias);

  // Guarda as missões escolhidas hoje, para não mudarem durante o dia.
  useEffect(() => {
    const atual = getEstado();
    if (atual.missoes?.dia !== m.dia) setEstado({ ...atual, missoes: m });
  }, [m.dia]); // eslint-disable-line react-hooks/exhaustive-deps

  const irPara = (id: string) => {
    const d = destinoMissao(e, id, estudoDa().caps);
    if (d.length) ir(...d); else jogar();
  };

  return (
    <main className="tela">
      <div className="coluna" style={{ gap: 2 }}>
        <button className="voltar voltar-topo" onClick={() => ir()}><Icone nome="voltar" tamanho={18} espessura={3} />Início</button>
        <h1 className="display h1">Meu dia</h1>
      </div>

      <section className="painel-destaque coluna" style={{ gap: 10, borderColor: 'var(--coral)' }} aria-label="Dias seguidos">
        <div className="linha" style={{ gap: 12 }}>
          <Chama tamanho={52} />
          <div>
            <div className="display" style={{ fontSize: 30, lineHeight: 1 }}>{dias} {dias === 1 ? 'dia' : 'dias'}</div>
            <div className="muted small">estudando seguido</div>
          </div>
        </div>
        <div className="small">Pode faltar <strong>1 dia por semana</strong> sem perder a sequência.</div>
        <div className="linha" style={{ gap: 8 }}>
          {MARCOS.map((n) => {
            // "ganhou!" só quando o pacote já veio; chegou no marco mas ainda não jogou hoje: "jogue!"
            const ok = (e.marcos ?? []).includes(`marco${n}-${seq.inicio}`);
            const chegou = !ok && dias >= n;
            return (
              <div key={n} className="coluna" style={{ flex: 1, alignItems: 'center', gap: 4, padding: '8px 4px', borderRadius: 14,
                border: `3px solid ${chegou ? 'var(--yellow)' : 'var(--ink)'}`, background: ok ? 'var(--yellow)' : 'var(--surface)', opacity: ok || chegou ? 1 : 0.75 }}
                aria-label={`${n} dias: ${ok ? 'pacote ganho' : chegou ? 'jogue hoje com nota 7 para ganhar' : 'ainda não'}`}>
                <span className="display" style={{ fontSize: 20 }}>{n}</span>
                <span className="small" style={{ fontWeight: 800 }}>{ok ? 'ganhou!' : chegou ? 'jogue!' : 'dias'}</span>
              </div>
            );
          })}
        </div>
        <div className="muted small">
          {prox ? <>Com <strong>{prox} dias</strong> você ganha um pacote de Sabimons.</> : <>Você passou de 30 dias. Que estudo!</>}
        </div>
      </section>

      <section className="coluna" style={{ gap: 10 }} aria-label="Missões do dia">
        <div className="linha" style={{ justifyContent: 'space-between' }}>
          <h2 className="display h3">Missões do dia</h2>
          <span className="pilula">{feitas} de {m.lista.length}</span>
        </div>
        <div className="linha" style={{ gap: 10 }}>
          <Pacote tamanho="mini" />
          <span className="small" style={{ flex: 1 }}>Faça as {m.lista.length} missões e ganhe <strong>1 pacote</strong>. Cada jogo vale para uma missão e precisa de nota 7 ou mais.</span>
        </div>
        {m.lista.map((id) => {
          const mi = MISSOES[id as MissaoId];
          // A primeira missão que falta é o próximo passo: ganha o brilho e o "Fazer agora".
          const proxima = id === m.lista.find((x) => !missaoFeita(m, x));
          if (!mi) return null;
          const ok = missaoFeita(m, id);
          const n = m.progresso[id] ?? 0;
          return (
            <div key={id} className="painel linha" style={{ gap: 10, borderColor: ok ? 'var(--green)' : proxima ? 'var(--coral)' : undefined }}>
              <span style={{ width: 34, height: 34, flex: 'none', borderRadius: '50%', border: '3px solid var(--ink)', background: ok ? 'var(--green)' : 'var(--surface)', display: 'grid', placeItems: 'center' }}>
                {ok && <Icone nome="check" tamanho={18} espessura={3.5} />}
              </span>
              <span style={{ flex: 1 }}>
                <span className="display" style={{ fontSize: 18, display: 'block' }}>{mi.texto}</span>
                {mi.alvo > 1 && <span className="muted small">{Math.min(n, mi.alvo)} de {mi.alvo}</span>}
              </span>
              {ok
                ? <span className="small" style={{ fontWeight: 800, color: 'var(--t-green)' }}>Feita</span>
                : proxima
                  ? <button className="btn btn-amarelo chamar" style={{ minHeight: 44, padding: '8px 14px' }} onClick={() => irPara(id)}>Fazer agora</button>
                  : <button className="btn btn-escuro" style={{ minHeight: 44, padding: '8px 18px' }} onClick={() => irPara(id)}>Ir</button>}
            </div>
          );
        })}
      </section>

      {todas && (
        <div className="linha" style={{ alignItems: 'flex-end' }}>
          <div style={{ flex: 'none' }}><Ara tamanho={76} humor="comemorando" /></div>
          <div className="balao" style={{ flex: 1, marginBottom: 14 }}>Missões feitas! Seu pacote já está no álbum. Descanse e volte amanhã para novas missões.</div>
        </div>
      )}
    </main>
  );
}
