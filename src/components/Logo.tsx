// Logo do Sabidex: cada letra é uma figurinha colorida, colada meio torta
// (escolhido pelo Lucas em 04/11/2026). Cores e inclinações ficam em `.logo` no styles.css.

const LETRAS = 'Sabidex'.split('');

export function Logo({ tamanho = 30 }: { tamanho?: number }) {
  return (
    <span className="logo" style={{ fontSize: tamanho }} role="img" aria-label="Sabidex">
      {LETRAS.map((l, i) => <span key={i} aria-hidden="true">{l}</span>)}
    </span>
  );
}
