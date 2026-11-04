// Ará, a arara mascote do Sabidex.
export function Ara({ tamanho = 120, humor = 'feliz' }: { tamanho?: number; humor?: 'feliz' | 'triste' }) {
  return (
    <svg width={tamanho} height={Math.round((tamanho * 140) / 120)} viewBox="0 0 120 140" role="img" aria-label="Ará, a arara">
      <defs>
        <linearGradient id="araCorpo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF6B6B" /><stop offset="1" stopColor="#DC2626" /></linearGradient>
        <linearGradient id="araAzul" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#67E8F9" /><stop offset="1" stopColor="#0891B2" /></linearGradient>
        <linearGradient id="araOuro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FDE68A" /><stop offset="1" stopColor="#EAB308" /></linearGradient>
      </defs>
      <path d="M52 108c-4 14-2 24 4 30 6-6 10-18 8-30z" fill="url(#araAzul)" />
      <path d="M60 108c2 14 8 22 16 26 2-10-2-20-8-28z" fill="url(#araOuro)" />
      <ellipse cx="60" cy="82" rx="34" ry="36" fill="url(#araCorpo)" />
      <path d="M28 74c-14 8-18 28-10 40 12-2 22-16 20-32z" fill="url(#araAzul)" />
      <path d="M30 92c-6 4-8 12-6 18 6-2 10-8 10-14z" fill="url(#araOuro)" />
      <path d="M92 74c14 8 18 28 10 40-12-2-22-16-20-32z" fill="url(#araOuro)" />
      <ellipse cx="60" cy="94" rx="18" ry="16" fill="#FECACA" opacity=".55" />
      <circle cx="60" cy="42" r="30" fill="url(#araCorpo)" />
      <path d="M42 18c4-12 18-16 24-8-8 0-14 4-16 10z" fill="#FF6B6B" />
      <ellipse cx="48" cy="40" rx="11" ry="12" fill="#FFFFFF" />
      <ellipse cx="72" cy="40" rx="11" ry="12" fill="#FFFFFF" />
      <circle cx="50" cy={humor === 'triste' ? 44 : 42} r="6" fill="#0B1026" />
      <circle cx="74" cy={humor === 'triste' ? 44 : 42} r="6" fill="#0B1026" />
      <circle cx="52" cy="39" r="2.2" fill="#FFFFFF" /><circle cx="76" cy="39" r="2.2" fill="#FFFFFF" />
      {humor === 'triste' && <path d="M38 28l18 6M82 28l-18 6" stroke="#7F1D1D" strokeWidth="3" strokeLinecap="round" />}
      <path d="M50 54c4-4 16-4 20 0 0 10-6 18-10 20-4-2-10-10-10-20z" fill="#334155" />
      <path d="M52 55c4-2 12-2 16 0-2 4-14 4-16 0z" fill="#94A3B8" />
      <ellipse cx="40" cy="30" rx="10" ry="5" fill="#FFFFFF" opacity=".25" transform="rotate(-25 40 30)" />
    </svg>
  );
}
