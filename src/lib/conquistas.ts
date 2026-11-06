// Conquistas da criança (Lucas, 05/11/2026): aparecem no "Meu perfil".
// São só figurinhas de honra: NÃO dão pacote, XP nem Sabicoins (pacotes só vêm do estudo).
// Tudo é calculado com o que o jogo já guarda, então quem já jogava ganha as conquistas na hora.

import { capitulos } from '../data';
import { FIGURINHAS } from './figurinhas';
import { estrelasDoMundo, FASES, nivel, sequenciaInfo, type Estado } from './jogo';
import { mundosCompletos } from './loja';

export type Desenho = 'passo' | 'livro' | 'mundo' | 'nota' | 'estrela' | 'carta' | 'evoluir' | 'lendaria' | 'chama' | 'nivel' | 'calendario';
export type CorConquista = 'coral' | 'yellow' | 'cyan' | 'pink' | 'green';

export interface Conquista {
  id: string;
  titulo: string;
  /** O que precisa fazer, em frase curta. */
  como: string;
  desenho: Desenho;
  cor: CorConquista;
  /** Quanto já tem e quanto precisa. */
  tem: number;
  alvo: number;
  ganhou: boolean;
}

type Dados = Pick<Estado, 'xp' | 'feitas' | 'notas' | 'cartas' | 'dias'>;

/** Dia "AAAA-MM-DD" ao meio-dia (evita erro de fuso). */
const meioDia = (dia: string) => { const [a, m, d] = dia.split('-').map(Number); return new Date(a, m - 1, d, 12); };

/** A maior sequência de dias que a criança já fez (com 1 folga por semana, como no início). */
export function maiorSequencia(dias: string[]): number {
  return [...new Set(dias)].reduce((maior, d) => Math.max(maior, sequenciaInfo(dias, meioDia(d)).dias), 0);
}

/** Números do perfil. */
export function numerosDoPerfil(e: Dados) {
  const tem = (id: string) => (e.cartas[id] ?? 0) > 0;
  const figurinhas = FIGURINHAS.filter((f) => tem(f.id));
  return {
    nivel: nivel(e.xp).nivel,
    fases: Object.keys(e.feitas).filter((k) => (FASES as string[]).includes(k.split(':')[1])).length,
    mundos: mundosCompletos(e.feitas),
    estrelas: capitulos.reduce((s, c) => s + estrelasDoMundo(e as Estado, c).tem, 0),
    notas10: capitulos.filter((c) => (e.notas[c.id] ?? 0) >= 10).length,
    figurinhas: figurinhas.length,
    bichos: new Set(figurinhas.map((f) => f.s.id)).size,
    forma2: figurinhas.some((f) => f.forma === 2),
    forma3: figurinhas.some((f) => f.forma === 3),
    lendaria: figurinhas.some((f) => f.s.raridade === 'lendaria'),
    diasEstudados: new Set(e.dias).size,
    maiorSequencia: maiorSequencia(e.dias),
  };
}

export function conquistasDe(e: Dados): Conquista[] {
  const n = numerosDoPerfil(e);
  const c = (id: string, titulo: string, como: string, desenho: Desenho, cor: CorConquista, tem: number, alvo: number): Conquista =>
    ({ id, titulo, como, desenho, cor, tem: Math.min(tem, alvo), alvo, ganhou: tem >= alvo });
  return [
    c('primeira-fase', 'Primeiro passo', 'Termine sua primeira fase.', 'passo', 'green', n.fases, 1),
    c('dez-fases', 'Estudioso', 'Termine 10 fases.', 'livro', 'cyan', n.fases, 10),
    c('mundo', 'Unidade completa', 'Termine as 5 fases de uma unidade.', 'mundo', 'yellow', n.mundos, 1),
    c('tres-mundos', 'Explorador', 'Complete 3 unidades.', 'mundo', 'coral', n.mundos, 3),
    c('nota-10', 'Nota 10', 'Tire 10 numa prova.', 'nota', 'pink', n.notas10, 1),
    c('estrelas-30', 'Chuva de estrelas', 'Junte 30 estrelas nas unidades.', 'estrela', 'yellow', n.estrelas, 30),
    c('bichos-5', 'Colecionador', 'Tenha 5 Sabimons diferentes.', 'carta', 'cyan', n.bichos, 5),
    c('bichos-20', 'Todos os bichos', 'Tenha os 20 Sabimons.', 'carta', 'pink', n.bichos, 20),
    c('evoluir', 'Evoluiu!', 'Tenha uma carta da forma 2.', 'evoluir', 'green', n.forma2 ? 1 : 0, 1),
    c('forma-final', 'Forma final', 'Tenha uma carta da forma 3.', 'evoluir', 'coral', n.forma3 ? 1 : 0, 1),
    c('lendaria', 'Lendária', 'Tenha uma carta lendária.', 'lendaria', 'yellow', n.lendaria ? 1 : 0, 1),
    c('sequencia-7', 'Fogo aceso', 'Estude 7 dias seguidos.', 'chama', 'coral', n.maiorSequencia, 7),
    c('sequencia-30', 'Um mês de estudo', 'Estude 30 dias seguidos.', 'chama', 'pink', n.maiorSequencia, 30),
    c('dias-20', 'Sempre por aqui', 'Estude em 20 dias diferentes.', 'calendario', 'cyan', n.diasEstudados, 20),
    c('nivel-5', 'Nível 5', 'Chegue ao nível 5.', 'nivel', 'green', n.nivel, 5),
    c('nivel-10', 'Nível 10', 'Chegue ao nível 10.', 'nivel', 'yellow', n.nivel, 10),
  ];
}
