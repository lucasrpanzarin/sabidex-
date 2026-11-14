import type { Capitulo } from '../data/tipos';
import { FASES, chave, type Estado } from './jogo';

/**
 * Como está cada matéria para a criança, na ordem do Início (Lucas, 12/11/2026):
 * primeiro o que ela ainda não fez e tem prêmio para ganhar, por último o que já terminou.
 *  - 'nova': nenhuma fase feita na matéria (ex.: Ciências acabou de chegar)
 *  - 'unidade-nova': já estudou a matéria, mas chegou uma unidade que ela não começou
 *  - 'faltam': ainda tem fase para fazer
 *  - 'desafio': fez todas as fases, mas o Desafio do dia de hoje ainda vale pacote
 *  - 'feito': fez tudo e não tem prêmio esperando hoje
 */
export type SituacaoMateria = 'nova' | 'unidade-nova' | 'faltam' | 'desafio' | 'feito';

const ORDEM: SituacaoMateria[] = ['nova', 'unidade-nova', 'faltam', 'desafio', 'feito'];

export interface ResumoMateria {
  materia: string;
  situacao: SituacaoMateria;
  unidades: number;
  /** Fases que faltam em todas as unidades da matéria. */
  faltam: number;
  /** A primeira unidade (na ordem recebida) que a criança ainda não começou. */
  unidadeNova?: Capitulo;
  /** O Desafio do dia dá para jogar (tem unidade começada) e ainda não foi ganho hoje. */
  desafioPendente: boolean;
  desafioFeito: boolean;
}

/** `desafios` vem de materiasDoDesafio + situacaoDesafio (pode / feito). */
export function resumoMaterias(e: Estado, caps: Capitulo[], materias: string[], desafios: { materia: string; pode: boolean; feito: boolean }[]): ResumoMateria[] {
  const lista = materias.map((m, i) => {
    const doMateria = caps.filter((c) => c.materia === m);
    const feitasDe = (c: Capitulo) => FASES.filter((f) => e.feitas[chave(c.id, f)]).length;
    const faltam = doMateria.reduce((s, c) => s + FASES.length - feitasDe(c), 0);
    const unidadeNova = doMateria.find((c) => feitasDe(c) === 0);
    const d = desafios.find((x) => x.materia === m);
    const desafioPendente = !!d && d.pode && !d.feito;
    const comecou = doMateria.some((c) => feitasDe(c) > 0);
    const situacao: SituacaoMateria = !comecou ? 'nova' : unidadeNova ? 'unidade-nova' : faltam > 0 ? 'faltam' : desafioPendente ? 'desafio' : 'feito';
    return { i, r: { materia: m, situacao, unidades: doMateria.length, faltam, unidadeNova, desafioPendente, desafioFeito: !!d?.feito } };
  });
  return lista.sort((a, b) => ORDEM.indexOf(a.r.situacao) - ORDEM.indexOf(b.r.situacao) || a.i - b.i).map((x) => x.r);
}
