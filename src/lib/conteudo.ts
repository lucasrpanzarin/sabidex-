// Regras de qualidade do conteúdo de estudo, por idade.
// Usadas por `npm run conferir` (scripts/conferir.ts) e pelos testes. Explicação completa em docs/ESTUDOS.md.

import { GERADORES } from './contas';
import type { Capitulo, Questao } from '../data/tipos';

export interface PerfilIdade {
  idade: string;
  /** máximo de palavras numa frase de explicação (pontos dos temas) */
  palavrasPorFrase: number;
  /** máximo de palavras numa pergunta */
  palavrasPorPergunta: number;
  regras: string[];
}

export function perfilDoAno(ano: number): PerfilIdade {
  if (ano <= 2) return {
    idade: '6 a 7 anos', palavrasPorFrase: 10, palavrasPorPergunta: 10,
    regras: [
      'Uma ideia por frase. Só palavras do dia a dia; palavra nova só se for a palavra-chave, e explicada na hora.',
      'Nada de datas difíceis: use "há muito tempo", "antes", "depois".',
      'Perguntas de lembrar e reconhecer. Opções com 1 a 3 palavras.',
    ],
  };
  if (ano <= 5) return {
    idade: ano === 3 ? '8 a 9 anos' : '9 a 11 anos', palavrasPorFrase: 20, palavrasPorPergunta: 22,
    regras: [
      'Frases curtas (até 15 palavras é o ideal), na ordem direta: quem fez, o quê, onde, quando.',
      'Uma ideia por frase. Palavra nova aparece explicada na mesma frase ou na seguinte.',
      'Ligue o conteúdo ao mundo da criança: comida, palavras que ela usa, lugares do Brasil, a escola.',
      'Datas: escreva "antes de Cristo" por extenso nos textos; no campo "ano" da linha do tempo pode usar "a.C.".',
      'Pode pedir comparação simples (igual/diferente), causa e consequência direta e "por quê".',
      'Evite números grandes demais e listas com mais de 4 itens numa frase.',
      'Temas sensíveis (escravidão, guerras, doenças) com verdade e respeito, sem detalhes de violência.',
    ],
  };
  return {
    idade: '11 a 14 anos', palavrasPorFrase: 28, palavrasPorPergunta: 30,
    regras: [
      'Frases claras, até 25 palavras. Termos técnicos do livro podem ser usados, sempre definidos na primeira vez.',
      'Inclua perguntas de analisar: comparar pontos de vista, achar causas múltiplas, interpretar uma fonte.',
      'Temas sensíveis com verdade e respeito.',
    ],
  };
}

/** Texto do guia de idade para colocar no pedido ao robô. */
export function guiaDaIdade(ano: number) {
  const p = perfilDoAno(ano);
  return `Público: crianças do ${ano}º ano (${p.idade}), que vão ler sozinhas no celular.
Linguagem: português do Brasil, tom amigo e animado, sem infantilizar.
- Cada frase com no máximo ${p.palavrasPorFrase} palavras; cada pergunta com no máximo ${p.palavrasPorPergunta} palavras.
${p.regras.map((r) => '- ' + r).join('\n')}`;
}

const palavras = (s: string) => s.replace(/\*\*/g, '').split(/\s+/).filter(Boolean).length;
const frases = (s: string) => s.split(/(?<=[.!?])\s+/).filter(Boolean);
const PROIBIDAS = [/todas as (alternativas|anteriores)/i, /nenhuma das (alternativas|anteriores)/i, /\bNÃO\b/, /\bincorret[ao]\b/i, /\bEXCETO\b/i];

/**
 * Confere um capítulo e devolve a lista de problemas.
 * Começa com "ERRO:" o que quebra o jogo; com "AVISO:" o que deixa pior para a criança.
 */
export function validarCapitulo(cap: Capitulo, ano = 4): string[] {
  const p = perfilDoAno(ano);
  const out: string[] = [];
  const erro = (m: string) => out.push('ERRO: ' + m);
  const aviso = (m: string) => out.push('AVISO: ' + m);

  if (!cap.temas.length && !cap.matematica) erro('nenhum tema');
  const m = cap.matematica;
  if (!m && cap.pares.length < 6) erro(`só ${cap.pares.length} pares (mínimo 6)`);
  if (!m && cap.linha.length < 6) erro(`só ${cap.linha.length} fatos na linha do tempo (mínimo 6)`);
  if (m) {
    const tipoOk = (onde: string, t: string) => { if (!GERADORES[t]) erro(`${onde}: tipo de conta "${t}" não existe em src/lib/contas.ts`); };
    if (m.exemplos.length < 3) erro(`só ${m.exemplos.length} exemplos resolvidos (mínimo 3)`);
    m.exemplos.forEach((x, i) => { tipoOk(`exemplo ${i + 1}`, x.treino); if (x.passos.length < 2) erro(`exemplo ${i + 1}: precisa de 2 passos ou mais`); });
    m.treino.forEach((t) => tipoOk('treino', t));
    m.desafio.forEach((t) => tipoOk('balança e sequências', t));
    m.prova.forEach((t) => tipoOk('prova de contas', t));
    if (m.treino.length < 8) aviso(`treino com ${m.treino.length} contas (ideal: 8 a 10)`);
    if (m.desafio.length < 6) aviso(`balança e sequências com ${m.desafio.length} contas (ideal: 6 a 10)`);
    if (m.prova.length !== 10) erro(`a prova de contas tem ${m.prova.length} contas (precisa de 10)`);
  }
  if (cap.prova.length !== 10) erro(`a prova tem ${cap.prova.length} questões (precisa de 10)`);
  if (cap.quiz.length < 8) aviso(`só ${cap.quiz.length} frases no quiz (ideal: 10 ou mais)`);

  const ordens = cap.linha.map((e) => e.ordem);
  if (new Set(ordens).size !== ordens.length) erro('dois fatos da linha do tempo têm a mesma "ordem" (não dá para saber qual vem antes)');

  const palavrasPares = cap.pares.map((x) => x.palavra.toLowerCase());
  if (new Set(palavrasPares).size !== palavrasPares.length) erro('palavra repetida no jogo da memória');

  const verdadeiras = cap.quiz.filter((q) => q.verdadeira).length;
  if (cap.quiz.length && (verdadeiras / cap.quiz.length < 0.35 || verdadeiras / cap.quiz.length > 0.65))
    aviso(`quiz desequilibrado: ${verdadeiras} verdadeiras de ${cap.quiz.length} (a criança acerta chutando)`);

  cap.prova.forEach((q, i) => {
    const n = `prova ${i + 1}`;
    if (q.opcoes.length !== 4 || q.opcoes.some((o) => !o?.trim())) erro(`${n}: precisa de 4 opções preenchidas`);
    if (new Set(q.opcoes.map((o) => o.trim().toLowerCase())).size !== q.opcoes.length) erro(`${n}: opções repetidas`);
    if (![0, 1, 2, 3].includes(q.certa)) erro(`${n}: resposta certa fora de 0 a 3`);
    const textos = [q.pergunta, ...q.opcoes];
    if (textos.some((t) => PROIBIDAS.some((r) => r.test(t)))) aviso(`${n}: usa "todas/nenhuma das anteriores", "NÃO", "EXCETO" ou "incorreta" (confunde quem tem 10 anos)`);
    if (palavras(q.pergunta) > p.palavrasPorPergunta) aviso(`${n}: pergunta longa (${palavras(q.pergunta)} palavras)`);
    const outras = q.opcoes.filter((_, j) => j !== q.certa).map((o) => o.length);
    const media = outras.reduce((a, b) => a + b, 0) / (outras.length || 1);
    if (q.opcoes[q.certa] && q.opcoes[q.certa].length > media * 1.8 && q.opcoes[q.certa].length > 25)
      aviso(`${n}: a resposta certa é bem mais comprida que as outras (entrega a resposta)`);
  });

  const posicoes = cap.prova.map((q) => q.certa);
  for (const pos of [0, 1, 2, 3]) {
    if (posicoes.filter((x) => x === pos).length > 4) aviso(`muitas respostas certas na letra ${'ABCD'[pos]}`);
  }

  cap.temas.forEach((t, i) => t.pontos.forEach((pt, j) => {
    const maior = Math.max(...frases(pt).map(palavras));
    if (maior > p.palavrasPorFrase) aviso(`tema ${i + 1}, ponto ${j + 1}: frase com ${maior} palavras (máximo ${p.palavrasPorFrase})`);
  }));

  // Jogos extras (opcionais)
  const opcoesOk = (n: string, certa: string, outras: string[]) => {
    const todas = [certa, ...outras].map((o) => o.trim().toLowerCase());
    if (todas.some((o) => !o) || new Set(todas).size !== todas.length) erro(`${n}: opções vazias ou repetidas`);
  };
  cap.lacunas?.forEach((l, i) => {
    if ((l.frase.match(/___/g) ?? []).length !== 1) erro(`lacuna ${i + 1}: a frase precisa ter um ___`);
    opcoesOk(`lacuna ${i + 1}`, l.resposta, l.distratores);
  });
  cap.quemSou?.forEach((q, i) => {
    if (q.pistas.length !== 3) erro(`quem sou eu ${i + 1}: precisa de 3 pistas`);
    opcoesOk(`quem sou eu ${i + 1}`, q.resposta, q.distratores);
    if (q.pistas.some((p) => p.toLowerCase().includes(q.resposta.toLowerCase()))) aviso(`quem sou eu ${i + 1}: a pista entrega o nome da resposta`);
  });
  cap.classificar?.forEach((c, i) => {
    if (c.grupos.length < 2 || c.grupos.length > 3) erro(`grupos ${i + 1}: use 2 ou 3 grupos`);
    const itens = c.grupos.flatMap((g) => g.itens);
    if (new Set(itens).size !== itens.length) erro(`grupos ${i + 1}: item repetido`);
    if (c.grupos.some((g) => g.itens.length < 2)) aviso(`grupos ${i + 1}: grupo com menos de 2 itens`);
  });
  if (cap.causas) {
    const efeitos = cap.causas.map((c) => c.consequencia);
    if (new Set(efeitos).size !== efeitos.length) erro('causas: consequência repetida');
  }

  return out;
}

/**
 * Espalha a resposta certa entre A, B, C e D, para a criança não aprender que "é sempre a B".
 * Sempre dá o mesmo resultado para a mesma prova (não depende de sorte).
 */
export function espalharRespostas(prova: Questao[]): Questao[] {
  const alvos = prova.map((_, i) => i % 4);
  // embaralha os alvos com uma sequência fixa
  let s = 7;
  const rng = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = alvos.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [alvos[i], alvos[j]] = [alvos[j], alvos[i]];
  }
  return prova.map((q, i) => {
    const alvo = alvos[i] as 0 | 1 | 2 | 3;
    const opcoes = q.opcoes.slice() as Questao['opcoes'];
    [opcoes[q.certa], opcoes[alvo]] = [opcoes[alvo], opcoes[q.certa]];
    return { ...q, opcoes, certa: alvo };
  });
}
