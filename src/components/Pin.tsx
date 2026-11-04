// Teclado de PIN com 4 números, grande para dedos de criança.
export function Pin({ valor, onChange, rotulo }: { valor: string; onChange: (v: string) => void; rotulo: string }) {
  const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  return (
    <div className="coluna" style={{ alignItems: 'center', gap: 14 }}>
      <div className="display h3" id="pin-rotulo">{rotulo}</div>
      <div className="linha" style={{ gap: 14 }} role="status" aria-label={`${valor.length} de 4 números digitados`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: i < valor.length ? 'var(--yellow)' : 'transparent', border: '2.5px solid ' + (i < valor.length ? 'var(--yellow)' : 'var(--line-2)') }} />
        ))}
      </div>
      <div role="group" aria-labelledby="pin-rotulo" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 76px)', gap: 10 }}>
        {teclas.map((t, i) => t === '' ? <span key={i} /> : (
          <button key={i} type="button" className="btn btn-escuro" style={{ minHeight: 60, fontSize: 26, padding: 0 }}
            aria-label={t === '⌫' ? 'Apagar' : t}
            onClick={() => onChange(t === '⌫' ? valor.slice(0, -1) : (valor + t).slice(0, 4))}>{t}</button>
        ))}
      </div>
    </div>
  );
}
