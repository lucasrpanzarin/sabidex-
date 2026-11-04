// Perfis da família neste aparelho: a criança toca no dela e digita o PIN.
import { useEffect, useState } from 'react';
import { entrarNoPerfil, type PerfilAparelho } from '../lib/conta';
import { Pin } from './Pin';

export function Bolinha({ nome, cor, tamanho = 40 }: { nome: string; cor: string; tamanho?: number }) {
  return <span aria-hidden="true" style={{ width: tamanho, height: tamanho, flex: 'none', borderRadius: '50%', background: cor, display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontSize: tamanho * 0.45, color: 'var(--bg)', boxShadow: 'inset 0 -3px 0 #00000033, inset 0 2px 0 #FFFFFF88' }}>{nome[0]?.toUpperCase()}</span>;
}

export function EscolherPerfil({ perfis, titulo, aoEntrar }: { perfis: PerfilAparelho[]; titulo: string; aoEntrar?: () => void }) {
  const [escolhido, setEscolhido] = useState<PerfilAparelho | null>(null);
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!escolhido || pin.length !== 4) return;
    (async () => {
      setOcupado(true); setErro(null);
      const msg = await entrarNoPerfil(escolhido.id, pin);
      setOcupado(false);
      setPin('');
      if (msg) setErro(msg); else aoEntrar?.();
    })();
  }, [pin]); // eslint-disable-line react-hooks/exhaustive-deps

  if (perfis.length === 0) return null;
  if (escolhido) {
    return (
      <div className="coluna" style={{ alignItems: 'center', width: '100%' }}>
        <div className="linha" style={{ gap: 10 }}><Bolinha nome={escolhido.apelido} cor={escolhido.cor} /><span className="display h3">{escolhido.apelido}</span></div>
        {erro && <div className="aviso aviso-erro" role="alert" style={{ width: '100%' }}>{erro}</div>}
        <Pin valor={pin} onChange={setPin} rotulo={ocupado ? 'Entrando…' : 'Digite seu PIN'} />
        <button type="button" className="voltar" style={{ alignSelf: 'center' }} onClick={() => { setEscolhido(null); setPin(''); setErro(null); }}>Escolher outro perfil</button>
        <p className="muted small" style={{ textAlign: 'center', margin: 0 }}>Esqueceu o PIN? Peça para um adulto da sua casa criar um novo.</p>
      </div>
    );
  }
  return (
    <div className="coluna" style={{ width: '100%', gap: 10 }}>
      <div className="display h3">{titulo}</div>
      <div className="linha" style={{ flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {perfis.map((p) => (
          <button key={p.id} type="button" className="btn btn-escuro" style={{ gap: 10, minHeight: 56 }} onClick={() => setEscolhido(p)}>
            <Bolinha nome={p.apelido} cor={p.cor} tamanho={34} />{p.apelido}
          </button>
        ))}
      </div>
    </div>
  );
}
