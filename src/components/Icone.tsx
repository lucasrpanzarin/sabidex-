const caminhos = {
  inicio: 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z',
  fases: 'M4 19c4 0 4-6 8-6s4-6 8-6M4 21a2 2 0 100-4 2 2 0 000 4zM20 9a2 2 0 100-4 2 2 0 000 4z',
  album: 'M5 4h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM15 9h4a2 2 0 012 2v7a2 2 0 01-2 2h-6a2 2 0 01-2-2v-1',
  trocas: 'M4 8h14l-4-4M20 16H6l4 4',
  turma: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20a6 6 0 0112 0M16 5.2a3 3 0 010 5.6M21 20a6 6 0 00-4-5.7',
  ranking: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM7 6H4a3 3 0 003 4M17 6h3a3 3 0 01-3 4',
  voltar: 'M15 5l-7 7 7 7',
  seguir: 'M9 5l7 7-7 7',
  play: 'M8 5l12 7-12 7z',
  pause: 'M7 5h3v14H7zM14 5h3v14h-3z',
  check: 'M5 12l5 5 9-10',
  cadeado: 'M7 11V8a5 5 0 0110 0v3M6 11h12a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8a1 1 0 011-1z',
  escudo: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  relogio: 'M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z',
  som: 'M4 9h4l5-4v14l-5-4H4zM16 8.5a4 4 0 010 7M18.5 6a7.5 7.5 0 010 12',
};

export type NomeIcone = keyof typeof caminhos;

export function Icone({ nome, tamanho = 24, cheio = false, espessura = 2.5 }: { nome: NomeIcone; tamanho?: number; cheio?: boolean; espessura?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true"
      fill={cheio ? 'currentColor' : 'none'} stroke={cheio ? 'none' : 'currentColor'}
      strokeWidth={espessura} strokeLinecap="round" strokeLinejoin="round">
      <path d={caminhos[nome]} />
    </svg>
  );
}
