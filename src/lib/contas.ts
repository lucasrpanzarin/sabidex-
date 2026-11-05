// Contas de Matemática geradas na hora: mesmo tipo de conta e mesmo método do livro, números novos a cada vez.
// Assim, jogar de novo é treinar de verdade (e não decorar a resposta).
// Cada tipo de conta tem um "gerador". O capítulo diz quais tipos entram em cada fase (campo `matematica` em tipos.ts).
// Para uma unidade nova (ex.: frações), crie geradores novos aqui, no mesmo nível do livro.

/** Desenho que aparece junto da conta. */
export type Visual =
  /** Balança de pratos. `null` = pacote sem a medida ("?"). `pende` = lado mais pesado (sem pende, está equilibrada). */
  | { tipo: 'balanca'; esquerda: (number | null)[]; direita: (number | null)[]; pende?: 'esquerda' | 'direita' }
  /** Setas de ida e volta: de → (ida) → para, e para → (volta) → de. `null` = quadrinho para descobrir. */
  | { tipo: 'setas'; de: number | null; para: number | null; ida: string; volta: string }
  /** Cano (barra) dividido em `partes` iguais, com as primeiras `pintadas` partes pintadas. */
  | { tipo: 'barra'; partes: number; pintadas: number }
  /** Reta numérica do 0 ao 1 dividida em `partes` iguais, com uma seta na marcação `marca` (contando a partir do zero). */
  | { tipo: 'reta'; partes: number; marca: number }
  /** Quadrado de 10 × 10 quadradinhos (a unidade), com os primeiros `pintadas` quadradinhos pintados (centésimos). */
  | { tipo: 'quadriculado'; pintadas: number }
  /** Moedas e cédulas do real, em centavos (1, 5, 10, 25, 50 e 100 são moedas; 200 ou mais são cédulas). */
  | { tipo: 'moedas'; valores: number[] };

/** Resposta: um número, ou uma fração [numerador, denominador]. */
export type Resposta = number | [number, number];

export interface Conta {
  /** id do gerador (vai para a Revisão do Ará) */
  tipo: string;
  enunciado: string;
  /** conta em destaque, com "?" no lugar do número que falta (ex.: "? × 3 = 30") */
  sentenca?: string;
  visual?: Visual;
  resposta: Resposta;
  /** fração: só vale escrita do mesmo jeito (ex.: "três oitavos" → 3/8, e não 6/16) */
  exata?: boolean;
  /** resposta com vírgula (unidade 8): o teclado ganha a tecla de vírgula. A resposta é guardada como número (ex.: 12.5). */
  decimal?: boolean;
  /** dinheiro: a resposta aparece como "R$ 12,50" (sempre com 2 casas depois da vírgula) */
  reais?: boolean;
  /** palavra depois do número na resposta (ex.: "kg", "bolos") */
  unidade?: string;
  /** como resolver, em uma ou duas frases (aparece depois da resposta) */
  explicacao: string;
}

type Rng = () => number;
/** Número inteiro de min a max (os dois entram). */
const entre = (r: Rng, min: number, max: number) => min + Math.floor(r() * (max - min + 1));
const um = <T,>(r: Rng, l: readonly T[]): T => l[Math.floor(r() * l.length)];

/** Sorteio que repete o resultado com a mesma semente (para os testes). */
export function semente(n: number): Rng {
  let a = n >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOMES = ['Lívia', 'Caíque', 'Marcus', 'Isabela', 'Joana', 'Tânia', 'Ana', 'Luciana', 'Lilian', 'Thaís', 'Carolina', 'Rodrigo', 'Nádia', 'Luma', 'Eliane', 'Vinicius', 'Heitor', 'Juliana'];

/* ---------- Valor desconhecido ---------- */

function faltaSoma(r: Rng): Conta {
  const a = entre(r, 12, 99), b = entre(r, 5, 99), c = a + b;
  if (r() < 0.5) return { tipo: 'falta-soma', enunciado: 'Qual é o número que falta?', sentenca: `? + ${b} = ${c}`, resposta: a,
    explicacao: `A inversa da adição é a subtração: ${c} − ${b} = ${a}.` };
  return { tipo: 'falta-soma', enunciado: 'Qual é o número que falta?', sentenca: `${a} + ? = ${c}`, resposta: b,
    explicacao: `Tiramos a parcela que já sabemos da soma: ${c} − ${a} = ${b}.` };
}

function faltaSubtracao(r: Rng): Conta {
  const c = entre(r, 8, 90), b = entre(r, 5, 60), a = b + c;
  if (r() < 0.6) return { tipo: 'falta-subtracao', enunciado: 'Qual é o número que falta?', sentenca: `? − ${b} = ${c}`, resposta: a,
    explicacao: `Somamos a diferença ao subtraendo: ${c} + ${b} = ${a}.` };
  return { tipo: 'falta-subtracao', enunciado: 'Qual é o número que falta?', sentenca: `${a} − ? = ${c}`, resposta: b,
    explicacao: `Se ${a} − ? = ${c}, o número que tiramos é ${a} − ${c} = ${b}.` };
}

function faltaMultiplicacao(r: Rng): Conta {
  const b = entre(r, 2, 9), a = entre(r, 2, r() < 0.7 ? 12 : 25), c = a * b;
  if (r() < 0.5) return { tipo: 'falta-multiplicacao', enunciado: 'Qual é o número que falta?', sentenca: `? × ${b} = ${c}`, resposta: a,
    explicacao: `A inversa da multiplicação é a divisão: ${c} ÷ ${b} = ${a}.` };
  return { tipo: 'falta-multiplicacao', enunciado: 'Qual é o número que falta?', sentenca: `${b} × ? = ${c}`, resposta: a,
    explicacao: `Dividimos o produto pelo fator que já sabemos: ${c} ÷ ${b} = ${a}.` };
}

function faltaDivisao(r: Rng): Conta {
  const b = entre(r, 2, 9), c = entre(r, 2, 15), a = b * c;
  return { tipo: 'falta-divisao', enunciado: 'Qual é o número que falta?', sentenca: `? ÷ ${b} = ${c}`, resposta: a,
    explicacao: `Multiplicamos o quociente pelo divisor: ${c} × ${b} = ${a}.` };
}

/* ---------- Problemas da cozinha (os 7 passos) ---------- */

function problemaSoma(r: Rng): Conta {
  const n = um(r, NOMES), a = entre(r, 15, 99), b = entre(r, 12, 99);
  const [coisa, verbo] = um(r, [['croquetes', 'preparou'], ['brigadeiros', 'enrolou'], ['pães de queijo', 'assou'], ['cookies', 'vendeu']] as const);
  return { tipo: 'problema-soma', enunciado: `${n} ${verbo} ${a} ${coisa} de manhã e ${b} à tarde. Quantos ao todo?`, resposta: a + b, unidade: coisa,
    explicacao: `Queremos juntar duas quantidades: ${a} + ${b} = ${a + b}. Prova real: ${a + b} − ${b} = ${a}.` };
}

function problemaSubtracao(r: Rng): Conta {
  const n = um(r, NOMES), total = entre(r, 40, 150), parte = entre(r, 10, total - 8);
  const caso = um(r, [
    [`${n} fez ${total} gelatinas. Dessas, ${parte} são de abacaxi e as outras de morango. Quantas são de morango?`, 'gelatinas'],
    [`Havia ${total} taças na doceria. Algumas quebraram e sobraram ${total - parte}. Quantas quebraram?`, 'taças'],
    [`${n} tinha ${total} ovos e usou ${parte} nos bolos. Quantos ovos sobraram?`, 'ovos'],
  ] as const);
  const resposta = total - parte;
  if (caso[1] === 'taças') return { tipo: 'problema-subtracao', enunciado: caso[0], resposta: parte, unidade: 'taças',
    explicacao: `${total} − ? = ${total - parte}. Fazemos ${total} − ${total - parte} = ${parte}.` };
  return { tipo: 'problema-subtracao', enunciado: caso[0], resposta, unidade: caso[1],
    explicacao: `Tiramos uma parte do total: ${total} − ${parte} = ${resposta}. Prova real: ${resposta} + ${parte} = ${total}.` };
}

function problemaVezes(r: Rng): Conta {
  const n = um(r, NOMES), a = entre(r, 3, 12), b = entre(r, 2, 9);
  const caso = um(r, [
    [`${n} arrumou ${a} bandejas com ${b} salgados em cada uma. Quantos salgados ao todo?`, 'salgados'],
    [`Cada bolo leva ${b} ovos. Quantos ovos ${n} usa para fazer ${a} bolos?`, 'ovos'],
    [`${n} montou ${a} kits com ${b} sabonetes cada. Quantos sabonetes usou?`, 'sabonetes'],
  ] as const);
  return { tipo: 'problema-vezes', enunciado: caso[0], resposta: a * b, unidade: caso[1],
    explicacao: `${a} vezes ${b}: ${a} × ${b} = ${a * b}. Prova real: ${a * b} ÷ ${b} = ${a}.` };
}

function problemaDivisao(r: Rng): Conta {
  const n = um(r, NOMES), grupos = entre(r, 2, 9), cada = entre(r, 3, 15), total = grupos * cada;
  const caso = um(r, [
    [`${n} fez ${total} brigadeiros e põe ${cada} em cada caixa. Quantas caixas vai usar?`, grupos, 'caixas'],
    [`${n} dividiu ${total} balas igualmente entre ${grupos} marmitas. Quantas balas em cada uma?`, cada, 'balas'],
    [`${total} biscoitos foram arrumados em ${grupos} fileiras iguais. Quantos em cada fileira?`, cada, 'biscoitos'],
  ] as const);
  const divisor = caso[1] === grupos ? cada : grupos;
  return { tipo: 'problema-divisao', enunciado: caso[0], resposta: caso[1], unidade: caso[2],
    explicacao: `Dividimos: ${total} ÷ ${divisor} = ${caso[1]}. Prova real: ${caso[1]} × ${divisor} = ${total}.` };
}

/** Prova real: a criança faz a operação inversa e vê que volta ao número do começo. */
function provaReal(r: Rng): Conta {
  const op = um(r, ['+', '−', '×', '÷'] as const);
  if (op === '+') { const a = entre(r, 12, 99), b = entre(r, 12, 99);
    return { tipo: 'prova-real', enunciado: `Para conferir ${a} + ${b} = ${a + b}, fazemos a prova real. Quanto dá?`, sentenca: `${a + b} − ${b} = ?`, resposta: a,
      explicacao: `Tirando uma parcela da soma, sobra a outra: ${a + b} − ${b} = ${a}. A conta está certa!` }; }
  if (op === '−') { const c = entre(r, 10, 70), b = entre(r, 10, 60);
    return { tipo: 'prova-real', enunciado: `Para conferir ${b + c} − ${b} = ${c}, fazemos a prova real. Quanto dá?`, sentenca: `${c} + ${b} = ?`, resposta: b + c,
      explicacao: `Diferença mais subtraendo dá o minuendo: ${c} + ${b} = ${b + c}. A conta está certa!` }; }
  if (op === '×') { const a = entre(r, 3, 15), b = entre(r, 2, 9);
    return { tipo: 'prova-real', enunciado: `Para conferir ${a} × ${b} = ${a * b}, fazemos a prova real. Quanto dá?`, sentenca: `${a * b} ÷ ${b} = ?`, resposta: a,
      explicacao: `Dividindo o produto por um fator, sai o outro fator: ${a * b} ÷ ${b} = ${a}.` }; }
  const b = entre(r, 2, 9), c = entre(r, 3, 15);
  return { tipo: 'prova-real', enunciado: `Para conferir ${b * c} ÷ ${b} = ${c}, fazemos a prova real. Quanto dá?`, sentenca: `${c} × ${b} = ?`, resposta: b * c,
    explicacao: `Quociente vezes divisor dá o dividendo: ${c} × ${b} = ${b * c}. A conta está certa!` };
}

/** Setas de ida e volta (como os esquemas do livro): descobrir o número do quadrinho vazio. */
function setas(r: Rng): Conta {
  if (r() < 0.5) {
    const k = entre(r, 5, 60), a = entre(r, 4, 60), b = a + k, falta = r() < 0.5 ? 'de' : 'para';
    return { tipo: 'setas', enunciado: 'Complete o quadrinho vazio.', resposta: falta === 'de' ? a : b,
      visual: { tipo: 'setas', de: falta === 'de' ? null : a, para: falta === 'para' ? null : b, ida: `+ ${k}`, volta: `− ${k}` },
      explicacao: falta === 'de' ? `Voltando pela seta de baixo: ${b} − ${k} = ${a}.` : `Indo pela seta de cima: ${a} + ${k} = ${b}.` };
  }
  const k = entre(r, 2, 10), a = entre(r, 2, 12), b = a * k, falta = r() < 0.5 ? 'de' : 'para';
  return { tipo: 'setas', enunciado: 'Complete o quadrinho vazio.', resposta: falta === 'de' ? a : b,
    visual: { tipo: 'setas', de: falta === 'de' ? null : a, para: falta === 'para' ? null : b, ida: `× ${k}`, volta: `÷ ${k}` },
    explicacao: falta === 'de' ? `Voltando pela seta de baixo: ${b} ÷ ${k} = ${a}.` : `Indo pela seta de cima: ${a} × ${k} = ${b}.` };
}

/* ---------- Igualdade e balança ---------- */

const soma = (l: number[]) => l.reduce((x, y) => x + y, 0);

function balancaFalta(r: Rng): Conta {
  const esq = [entre(r, 1, 9), entre(r, 2, 9)];
  const p = entre(r, 1, 9);
  const totalEsq = soma(esq) + p;
  const d1 = entre(r, 1, totalEsq - 1);
  const dir = [d1, totalEsq - d1].filter((x) => x > 0);
  return { tipo: 'balanca-falta', enunciado: 'A balança está equilibrada. Quantos quilos tem o pacote "?"', resposta: p, unidade: 'kg',
    visual: { tipo: 'balanca', esquerda: [...esq, null], direita: dir },
    sentenca: `${esq.join(' + ')} + ? = ${dir.join(' + ')}`,
    explicacao: `A direita tem ${soma(dir)} kg. Sem o pacote, a esquerda tem ${soma(esq)} kg. Então o pacote tem ${soma(dir)} − ${soma(esq)} = ${p} kg.` };
}

function balancaDiferenca(r: Rng): Conta {
  const esq = [entre(r, 2, 12), entre(r, 1, 9)];
  let dir = [entre(r, 2, 12), entre(r, 1, 9)];
  if (soma(dir) === soma(esq)) dir = [dir[0] + entre(r, 1, 4), dir[1]];
  const pesada = soma(esq) > soma(dir) ? 'esquerda' : 'direita';
  const d = Math.abs(soma(esq) - soma(dir));
  return { tipo: 'balanca-diferenca', enunciado: 'A balança não está equilibrada. Quantos quilos o prato mais pesado tem a mais?', resposta: d, unidade: 'kg',
    visual: { tipo: 'balanca', esquerda: esq, direita: dir, pende: pesada },
    explicacao: `Esquerda: ${esq.join(' + ')} = ${soma(esq)} kg. Direita: ${dir.join(' + ')} = ${soma(dir)} kg. A diferença é ${d} kg.` };
}

/** Somar ou tirar o mesmo número dos dois membros, ou achar o número que equilibra. */
function sentencaMembros(r: Rng): Conta {
  const a = entre(r, 2, 15), b = entre(r, 2, 15), c = entre(r, 2, a + b - 1), d = a + b - c;
  const caso = entre(r, 0, 2);
  if (caso === 0) { const k = entre(r, 1, 9);
    return { tipo: 'sentenca-membros', enunciado: 'Qual número deixa a igualdade verdadeira?', sentenca: `${a} + ${b} + ${k} = ${c} + ${d} + ?`, resposta: k,
      explicacao: `${a} + ${b} = ${c} + ${d}. Somando o mesmo número dos dois lados, continua igual: ${k}.` }; }
  if (caso === 1) { const k = entre(r, 1, Math.min(a + b - 1, 9));
    return { tipo: 'sentenca-membros', enunciado: 'Qual número deixa a igualdade verdadeira?', sentenca: `${a} + ${b} − ${k} = ${a + b} − ?`, resposta: k,
      explicacao: `${a} + ${b} = ${a + b}. Tirando o mesmo número dos dois lados, continua igual: ${k}.` }; }
  return { tipo: 'sentenca-membros', enunciado: 'Qual número deixa a igualdade verdadeira?', sentenca: `${a} + ${b} = ${c} + ?`, resposta: d,
    explicacao: `O primeiro membro vale ${a + b}. Então ${c} + ? = ${a + b}, e ? = ${a + b} − ${c} = ${d}.` };
}

/* ---------- Sequências e múltiplos ---------- */

function multiplosSequencia(r: Rng): Conta {
  const k = entre(r, 2, 12), ini = entre(r, 0, 4);
  const termos = [0, 1, 2, 3].map((i) => k * (ini + i));
  return { tipo: 'multiplos-sequencia', enunciado: `Estes são múltiplos de ${k}. Qual vem depois?`, sentenca: `${termos.join(', ')}, ?`, resposta: k * (ini + 4),
    explicacao: `Os múltiplos de ${k} vão de ${k} em ${k}: ${termos[3]} + ${k} = ${k * (ini + 4)}.` };
}

function multiplosReceita(r: Rng): Conta {
  const por = entre(r, 2, 6), n = entre(r, 3, 10);
  // quantos/quantas: o primeiro combina com o ingrediente; o segundo, com a receita.
  const [item, quantos, receita, plural, quantosReceita] = um(r, [
    ['ovos', 'Quantos', 'torta', 'tortas', 'quantas'],
    ['copos de leite', 'Quantos', 'torta', 'tortas', 'quantas'],
    ['colheres de achocolatado', 'Quantas', 'bolo de caneca', 'bolos de caneca', 'quantos'],
    ['laranjas', 'Quantas', 'copo de suco', 'copos de suco', 'quantos'],
  ] as const);
  if (r() < 0.6) return { tipo: 'multiplos-receita', enunciado: `Cada ${receita} usa ${por} ${item}. ${quantos} ${item} para fazer ${n} ${plural}?`, resposta: por * n, unidade: item,
    explicacao: `São múltiplos de ${por}: ${n} × ${por} = ${por * n}.` };
  return { tipo: 'multiplos-receita', enunciado: `Cada ${receita} usa ${por} ${item}. Com ${por * n} ${item}, ${quantosReceita} ${plural} dá para fazer?`, resposta: n, unidade: plural,
    explicacao: `Usamos a divisão: ${por * n} ÷ ${por} = ${n}. Prova real: ${n} × ${por} = ${por * n}.` };
}

/* ---------- Frações (unidade 10) ---------- */

const NUMERAIS = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'];
const PARTES: Record<number, [string, string]> = {
  2: ['meio', 'meios'], 3: ['terço', 'terços'], 4: ['quarto', 'quartos'], 5: ['quinto', 'quintos'], 6: ['sexto', 'sextos'],
  7: ['sétimo', 'sétimos'], 8: ['oitavo', 'oitavos'], 9: ['nono', 'nonos'], 10: ['décimo', 'décimos'], 100: ['centésimo', 'centésimos'],
};
/** Como se lê a fração (ex.: 3/4 → "três quartos"; 1/4 → "um quarto"). */
export const lerFracao = (n: number, d: number) => `${NUMERAIS[n] ?? n} ${PARTES[d][n === 1 ? 0 : 1]}`;
const DENS = [2, 3, 4, 5, 6, 8, 10];

function fracaoUnitaria(r: Rng): Conta {
  const d = um(r, DENS);
  return { tipo: 'fracao-unitaria', enunciado: 'O cano foi cortado em partes iguais. Que fração do cano é a parte pintada?', resposta: [1, d],
    visual: { tipo: 'barra', partes: d, pintadas: 1 },
    explicacao: `O cano tem ${d} partes iguais e 1 está pintada: 1/${d}, ${lerFracao(1, d)}.` };
}

function fracaoFigura(r: Rng): Conta {
  const d = um(r, DENS), k = entre(r, 1, d - 1);
  return { tipo: 'fracao-figura', enunciado: 'Que fração do cano está pintada?', resposta: [k, d],
    visual: { tipo: 'barra', partes: d, pintadas: k },
    explicacao: `São ${d} partes iguais (denominador) e ${k} pintadas (numerador): ${k}/${d}, ${lerFracao(k, d)}.` };
}

function fracaoReta(r: Rng): Conta {
  const d = um(r, DENS), k = entre(r, 1, d - 1);
  return { tipo: 'fracao-reta', enunciado: 'Que fração a seta está mostrando na reta?', resposta: [k, d],
    visual: { tipo: 'reta', partes: d, marca: k },
    explicacao: `Do 0 ao 1 há ${d} partes iguais. A seta está na marcação ${k} depois do zero: ${k}/${d}.` };
}

function fracaoEscrita(r: Rng): Conta {
  const d = um(r, [2, 3, 4, 5, 6, 8, 10, 100]), k = d === 100 ? um(r, [1, 3, 7, 9]) : entre(r, 1, d - 1);
  return { tipo: 'fracao-escrita', enunciado: `Escreva com números: "${lerFracao(k, d)}".`, resposta: [k, d], exata: true,
    explicacao: `O numerador é ${k} e o denominador é ${d}: ${k}/${d}.` };
}

function fracaoUnitariaQuantidade(r: Rng): Conta {
  const d = um(r, [2, 3, 4, 5, 10, 100] as const), m = d === 100 ? entre(r, 2, 60) : entre(r, 3, 40), total = d * m;
  const caso = um(r, [
    [`Roberto precisa assentar ${total} pisos e já assentou 1/${d}. Quantos pisos ele assentou?`, 'pisos'],
    [`Leila tem ${total} pregos e já usou 1/${d}. Quantos pregos ela usou?`, 'pregos'],
    [`Quanto é 1/${d} de ${total}?`, ''],
  ] as const);
  return { tipo: 'fracao-unitaria-quantidade', enunciado: caso[0], resposta: m, unidade: caso[1] || undefined,
    explicacao: `Para achar 1/${d}, dividimos por ${d}: ${total} ÷ ${d} = ${m}.` };
}

function fracaoQuantidade(r: Rng): Conta {
  const d = um(r, [3, 4, 5, 6, 10] as const), k = entre(r, 2, d - 1), m = entre(r, 2, 25), total = d * m;
  return { tipo: 'fracao-quantidade', enunciado: `Quanto é ${k}/${d} de ${total}?`, resposta: k * m,
    explicacao: `1ª etapa: 1/${d} de ${total} → ${total} ÷ ${d} = ${m}. 2ª etapa: ${m} × ${k} = ${k * m}.` };
}

/** Problemas das profissões: quanto já foi feito ou quanto ainda falta. */
function fracaoProblema(r: Rng): Conta {
  const d = um(r, [4, 5, 10] as const), k = entre(r, 1, d - 1);
  const caso = entre(r, 0, 2);
  // Prédio de verdade: até 30 andares. Fio e tijolos podem ser mais.
  const m = caso === 0 ? entre(r, 1, Math.floor(30 / d)) : entre(r, 2, 30), total = d * m, feito = k * m;
  const [frase, unidade, perguntaFeito, perguntaFalta] = ([
    [`O prédio tem ${total} andares, e ${k}/${d} deles estão prontos.`, 'andares', 'Quantos andares estão prontos?', 'Quantos andares ainda faltam?'],
    [`O rolo tem ${total} metros de fio, e Gustavo já usou ${k}/${d} do rolo.`, 'metros', 'Quantos metros ele usou?', 'Quantos metros ainda há no rolo?'],
    [`A parede vai ter ${total} tijolos, e Rose já assentou ${k}/${d} deles.`, 'tijolos', 'Quantos tijolos ela assentou?', 'Quantos tijolos ainda faltam?'],
  ] as const)[caso];
  if (r() < 0.5) return { tipo: 'fracao-problema', enunciado: `${frase} ${perguntaFeito}`, resposta: feito, unidade,
    explicacao: `1/${d} de ${total} é ${total} ÷ ${d} = ${m}. Então ${k}/${d} é ${m} × ${k} = ${feito}.` };
  return { tipo: 'fracao-problema', enunciado: `${frase} ${perguntaFalta}`, resposta: total - feito, unidade,
    explicacao: `${k}/${d} de ${total} é ${feito} (${total} ÷ ${d} = ${m} e ${m} × ${k} = ${feito}). Faltam ${total} − ${feito} = ${total - feito}.` };
}

/** Parte do todo: "dos 12 operários, 3 não usavam capacete; que fração usava?". */
function fracaoParteTodo(r: Rng): Conta {
  // Pelo menos 2 de cada lado, para o verbo ficar sempre no plural ("2 quebraram", nunca "1 quebraram").
  const total = entre(r, 5, 20), nao = entre(r, 2, total - 2), sim = total - nao;
  const [grupo, sem, pergunta, com] = um(r, [
    ['operários', 'não usavam capacete', 'Que fração dos operários usava capacete?', 'usavam capacete'],
    ['pedreiros', 'estavam de folga', 'Que fração dos pedreiros estava trabalhando?', 'estavam trabalhando'],
    ['azulejos', 'quebraram', 'Que fração dos azulejos ficou inteira?', 'ficaram inteiros'],
  ] as const);
  return { tipo: 'fracao-parte-todo', enunciado: `Dos ${total} ${grupo}, ${nao} ${sem}. ${pergunta}`, resposta: [sim, total],
    explicacao: `${total} − ${nao} = ${sim} ${com}, de ${total} ao todo: ${sim}/${total}.` };
}

/** O que falta para completar o inteiro (ex.: assentou 7/10, falta 3/10). */
function fracaoResto(r: Rng): Conta {
  const d = um(r, [3, 4, 5, 6, 8, 10]), k = entre(r, 1, d - 1);
  const [quem, oque] = um(r, [['Rose assentou', 'dos tijolos'], ['Andressa pintou', 'da parede'], ['Gustavo usou', 'do rolo de fio']] as const);
  return { tipo: 'fracao-resto', enunciado: `${quem} ${k}/${d} ${oque}. Que fração ainda falta?`, resposta: [d - k, d],
    visual: { tipo: 'barra', partes: d, pintadas: k },
    explicacao: `O inteiro é ${d}/${d}. Já foram ${k}/${d}, então faltam ${d - k}/${d}.` };
}

function porcentagem(r: Rng): Conta {
  const n = entre(r, 1, 99);
  if (r() < 0.5) return { tipo: 'porcentagem', enunciado: `${n}/100 é igual a quantos por cento?`, resposta: n, unidade: '%',
    explicacao: `Fração com denominador 100 vira porcentagem: ${n}/100 = ${n}%.` };
  return { tipo: 'porcentagem', enunciado: `${n}% é quantos centésimos? Escreva a fração.`, resposta: [n, 100], exata: true,
    explicacao: `${n}% quer dizer ${n} a cada 100: ${n}/100.` };
}

/* ---------- Números com vírgula e dinheiro (unidade 8) ---------- */
// Tudo é calculado em centavos (números inteiros), para não errar arredondamento. 1 real = 100 centavos.

/** Escreve centavos com vírgula: 1250 → "12,5" (ou "12,50" com `casas` 2); 1200 → "12". */
export function virgula(centavos: number, casas = 0): string {
  const inteiro = Math.floor(centavos / 100), resto = centavos % 100;
  const precisa = resto === 0 ? 0 : resto % 10 === 0 ? 1 : 2;
  const d = Math.max(casas, precisa);
  if (d === 0) return String(inteiro);
  if (d === 1) return `${inteiro},${resto / 10}`;
  return `${inteiro},${String(resto).padStart(2, '0')}`;
}
/** "R$ 12,50" */
const rs = (centavos: number) => `R$ ${virgula(centavos, 2)}`;
/** Número sem zeros sobrando, com as casas que o livro usa no exemplo (ex.: 75,50 continua 75,50). */
const num = (centavos: number, casas: number) => virgula(centavos, casas);

const UNIDADES = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze',
  'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CENTENAS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
/** Número por extenso, de 0 a 999 (ex.: 87 → "oitenta e sete"). */
export function extenso(n: number): string {
  if (n < 20) return UNIDADES[n];
  if (n < 100) return DEZENAS[Math.floor(n / 10)] + (n % 10 ? ` e ${UNIDADES[n % 10]}` : '');
  if (n === 100) return 'cem';
  return CENTENAS[Math.floor(n / 100)] + (n % 100 ? ` e ${extenso(n % 100)}` : '');
}
/** Valor em reais por extenso (ex.: 8799 → "oitenta e sete reais e noventa e nove centavos"). */
export function reaisPorExtenso(centavos: number): string {
  const r = Math.floor(centavos / 100), c = centavos % 100;
  const parteR = r === 0 ? '' : `${extenso(r)} ${r === 1 ? 'real' : 'reais'}`;
  const parteC = c === 0 ? '' : `${extenso(c)} ${c === 1 ? 'centavo' : 'centavos'}`;
  return [parteR, parteC].filter(Boolean).join(' e ') || 'zero real';
}
const DECIMOS = ['', 'um décimo', 'dois décimos', 'três décimos', 'quatro décimos', 'cinco décimos', 'seis décimos', 'sete décimos', 'oito décimos', 'nove décimos'];
const centesimosPorExtenso = (n: number) => `${extenso(n)} ${n === 1 ? 'centésimo' : 'centésimos'}`;

const nomeMoeda = (m: number) => (m === 100 ? '1 real' : `${m} ${m === 1 ? 'centavo' : 'centavos'}`);

/** Quanto dinheiro há nas moedas (como na p. 90 do livro). */
function decimalMoedas(r: Rng): Conta {
  const qtd = entre(r, 2, 4);
  const valores = Array.from({ length: qtd }, () => um(r, [1, 5, 10, 10, 25, 25, 50, 100])).sort((a, b) => b - a);
  const total = soma(valores);
  const centavos = total % 100, reais = Math.floor(total / 100);
  return { tipo: 'decimal-moedas', enunciado: 'Quanto dinheiro tem aqui? Escreva com vírgula.', resposta: total / 100, decimal: true, reais: true,
    visual: { tipo: 'moedas', valores },
    explicacao: `${valores.map(nomeMoeda).join(' + ')}: ${reais ? `${reais} ${reais > 1 ? 'reais' : 'real'}${centavos ? ` e ${centavos} ${centavos === 1 ? 'centavo' : 'centavos'}` : ''}` : `${total} centavos`}, ou ${rs(total)}.` };
}

/** Décimos: o inteiro dividido em 10 partes iguais (barra pintada ou por extenso). */
function decimos(r: Rng): Conta {
  const k = entre(r, 1, 9);
  if (r() < 0.6) return { tipo: 'decimos', enunciado: 'Cada parte é 1 décimo da barra. Que número decimal está pintado?', resposta: k / 10, decimal: true,
    visual: { tipo: 'barra', partes: 10, pintadas: k },
    explicacao: `Cada parte é 1 décimo (0,1). Estão pintadas ${k} partes: ${DECIMOS[k]}, ou ${num(k * 10, 0)}.` };
  return { tipo: 'decimos', enunciado: `Escreva com algarismos e vírgula: ${DECIMOS[k]}.`, resposta: k / 10, decimal: true,
    explicacao: `Décimo é a 1ª casa depois da vírgula: ${DECIMOS[k]} = ${num(k * 10, 0)}.` };
}

/** Décimos na reta numérica do 0 ao 1. */
function decimalReta(r: Rng): Conta {
  const k = entre(r, 1, 9);
  return { tipo: 'decimal-reta', enunciado: 'Do 0 ao 1, a reta tem 10 partes iguais. Que número a seta mostra?', resposta: k / 10, decimal: true,
    visual: { tipo: 'reta', partes: 10, marca: k },
    explicacao: `Cada parte é 0,1. A seta está na marcação ${k} depois do zero: ${num(k * 10, 0)}.` };
}

/** Centésimos: o inteiro dividido em 100 partes iguais. */
function centesimos(r: Rng): Conta {
  const caso = entre(r, 0, 2);
  if (caso === 0) {
    const n = entre(r, 1, 99);
    return { tipo: 'centesimos', enunciado: 'Cada quadradinho é 1 centésimo do quadrado. Que número decimal está pintado?', resposta: n / 100, decimal: true,
      visual: { tipo: 'quadriculado', pintadas: n },
      explicacao: `Cada quadradinho é 1 centésimo (0,01). Estão pintados ${n}: ${centesimosPorExtenso(n)}, ou ${virgula(n, 2)}.` };
  }
  const n = caso === 1 ? entre(r, 1, 9) : entre(r, 11, 99);
  return { tipo: 'centesimos', enunciado: `Escreva com algarismos e vírgula: ${centesimosPorExtenso(n)}.`, resposta: n / 100, decimal: true,
    explicacao: n < 10
      ? `Centésimo é a 2ª casa depois da vírgula. Como não há décimos, pomos um 0 antes: ${virgula(n, 2)}.`
      : `Centésimos ocupam 2 casas depois da vírgula: ${centesimosPorExtenso(n)} = ${virgula(n, 2)}.` };
}

/** Décimos de real e centavos (1 décimo de real = 10 centavos). */
function decimosCentavos(r: Rng): Conta {
  const k = entre(r, 1, 9);
  if (r() < 0.5) return { tipo: 'decimos-centavos', enunciado: `${k * 10} centavos correspondem a quantos décimos de 1 real?`, resposta: k, unidade: k === 1 ? 'décimo' : 'décimos',
    explicacao: `Cada décimo de real é uma moeda de 10 centavos. ${k * 10} ÷ 10 = ${k}: ${DECIMOS[k]} de real (R$ ${num(k * 10, 2)}).` };
  return { tipo: 'decimos-centavos', enunciado: `${DECIMOS[k][0].toUpperCase()}${DECIMOS[k].slice(1)} de real ${k === 1 ? 'é' : 'são'} quantos centavos?`, resposta: k * 10, unidade: 'centavos',
    explicacao: `Cada décimo de real vale 10 centavos: ${k} × 10 = ${k * 10} centavos (R$ ${num(k * 10, 2)}).` };
}

/** Quadro de ordens: quanto vale cada algarismo (D, U, d, c). */
function valorAlgarismo(r: Rng): Conta {
  const digitos: number[] = [];
  while (digitos.length < 4) { const d = entre(r, 1, 9); if (!digitos.includes(d)) digitos.push(d); }
  const [D, U, d, c] = digitos;
  const numero = `${D}${U},${d}${c}`;
  const ordem = entre(r, 0, 3);
  const [alg, valor, nome] = ([
    [D, D * 1000, `das dezenas: vale ${D} dezenas, ou ${D * 10}`],
    [U, U * 100, `das unidades: vale ${U} unidade${U > 1 ? 's' : ''}, ou ${U}`],
    [d, d * 10, `dos décimos: vale ${DECIMOS[d]}, ou ${num(d * 10, 0)}`],
    [c, c, `dos centésimos: vale ${centesimosPorExtenso(c)}, ou ${virgula(c, 2)}`],
  ] as const)[ordem];
  return { tipo: 'valor-algarismo', enunciado: `No número ${numero}, quanto vale o algarismo ${alg}? Responda com um número (use vírgula se precisar).`, resposta: valor / 100, decimal: true,
    explicacao: `No quadro de ordens, o ${alg} está na ordem ${nome}.` };
}

/** Escrever com números um valor ou um número lido por extenso. */
function decimalEscrita(r: Rng): Conta {
  if (r() < 0.65) {
    const total = entre(r, 1, 99) * 100 + (r() < 0.15 ? 0 : entre(r, 1, 99));
    return { tipo: 'decimal-escrita', enunciado: `Escreva o preço com números: ${reaisPorExtenso(total)}.`, resposta: total / 100, decimal: true, reais: true,
      explicacao: `Os reais ficam antes da vírgula e os centavos depois (sempre 2 algarismos): ${rs(total)}.` };
  }
  const inteiro = entre(r, 2, 99), cent = entre(r, 11, 99);
  return { tipo: 'decimal-escrita', enunciado: `Escreva com algarismos: ${extenso(inteiro)} inteiros e ${centesimosPorExtenso(cent)}.`, resposta: (inteiro * 100 + cent) / 100, decimal: true,
    explicacao: `A parte inteira fica antes da vírgula e os centésimos ocupam 2 casas depois: ${virgula(inteiro * 100 + cent, 2)}.` };
}

/** Medidas com vírgula: centímetros e milímetros, metros e centímetros (p. 70 e 71). */
function decimalMedida(r: Rng): Conta {
  if (r() < 0.5) {
    const cm = entre(r, 3, 25), mm = entre(r, 1, 9);
    const coisa = um(r, ['A canetinha', 'O lápis de cor', 'A borracha', 'O apontador'] as const);
    return { tipo: 'decimal-medida', enunciado: `${coisa} mede ${cm} centímetros e ${mm} milímetros. Quantos centímetros, usando vírgula?`, resposta: (cm * 100 + mm * 10) / 100, decimal: true, unidade: 'cm',
      explicacao: `Cada centímetro tem 10 milímetros, então ${mm} mm são ${DECIMOS[mm]} do centímetro: ${num(cm * 100 + mm * 10, 0)} cm.` };
  }
  const cm = entre(r, 1, 60);
  const quem = um(r, NOMES);
  return { tipo: 'decimal-medida', enunciado: `${quem} mede 1 metro e ${cm} centímetro${cm > 1 ? 's' : ''}. Quantos metros, usando vírgula?`, resposta: (100 + cm) / 100, decimal: true, unidade: 'm',
    explicacao: `1 metro tem 100 centímetros, então ${cm} cm são ${centesimosPorExtenso(cm)} do metro: ${virgula(100 + cm, 2)} m.` };
}

/** Comparar preços: primeiro a parte inteira, depois os décimos, depois os centésimos (p. 73 e 74). */
function decimalComparar(r: Rng): Conta {
  const base = entre(r, 10, 89);
  // Dois preços com a mesma parte inteira (para comparar os décimos ou os centésimos) e um com outra parte inteira.
  const d1 = entre(r, 0, 9);
  const mesmoDecimo = r() < 0.4;
  const a = base * 100 + d1 * 10 + entre(r, 0, 9);
  let b = a;
  while (b === a) {
    const d2 = mesmoDecimo ? d1 : (d1 + entre(r, 1, 9)) % 10;
    b = base * 100 + d2 * 10 + entre(r, 0, 9);
  }
  const c = (base + (r() < 0.5 ? 1 : -1)) * 100 + entre(r, 0, 99);
  const lista = [a, b, c];
  for (let i = 2; i > 0; i--) { const j = entre(r, 0, i); [lista[i], lista[j]] = [lista[j], lista[i]]; }
  const maior = r() < 0.5;
  const certo = maior ? Math.max(a, b, c) : Math.min(a, b, c);
  const coisa = um(r, ['Três livros custam', 'Três brinquedos custam', 'Três blusas custam', 'Três cadernos custam'] as const);
  return { tipo: 'decimal-comparar', enunciado: `${coisa} ${rs(lista[0])}; ${rs(lista[1])} e ${rs(lista[2])}. Qual é o ${maior ? 'maior' : 'menor'} preço?`,
    resposta: certo / 100, decimal: true, reais: true,
    explicacao: `Comparamos primeiro a parte inteira (os reais). Se for igual, comparamos os décimos e depois os centésimos. O ${maior ? 'maior' : 'menor'} é ${rs(certo)}.` };
}

/** Um número com 0, 1 ou 2 casas depois da vírgula, em centavos, entre min e max reais. */
function decimalAte(r: Rng, min: number, max: number, casas: number): number {
  const inteiro = entre(r, min, max);
  if (casas === 0) return inteiro * 100;
  if (casas === 1) return inteiro * 100 + entre(r, 1, 9) * 10;
  return inteiro * 100 + entre(r, 1, 99);
}
const casasDe = (centavos: number) => (centavos % 100 === 0 ? 0 : centavos % 10 === 0 ? 1 : 2);

/** Adição com vírgula: vírgula embaixo de vírgula (p. 75 a 77). */
function decimalSoma(r: Rng): Conta {
  const caso = entre(r, 0, 3);
  const a = caso === 3 ? um(r, [50, 100, 200]) * 100 : decimalAte(r, 5, 99, entre(r, 1, 2));
  const b = decimalAte(r, caso === 3 ? 1 : 5, 99, caso === 2 ? 0 : entre(r, 1, 2));
  const casas = Math.max(casasDe(a), casasDe(b), 1);
  const t = a + b;
  return { tipo: 'decimal-soma', enunciado: 'Faça a adição. Lembre: vírgula embaixo de vírgula.', sentenca: `${num(a, 0)} + ${num(b, 0)} = ?`, resposta: t / 100, decimal: true,
    explicacao: `Armamos com as vírgulas alinhadas e completamos com zeros: ${virgula(a, casas)} + ${virgula(b, casas)}. Somamos da direita para a esquerda e pomos a vírgula no lugar: ${virgula(t, casas)}.` };
}

/** Subtração com vírgula: número inteiro vira 100,00 e troca quando precisa (p. 78 a 84). */
function decimalSubtracao(r: Rng): Conta {
  const caso = entre(r, 0, 2);
  let a: number, b: number;
  if (caso === 0) { a = um(r, [10, 20, 50, 100, 200]) * 100; b = decimalAte(r, 1, a / 100 - 1, entre(r, 1, 2)); }
  else { a = decimalAte(r, 20, 99, entre(r, 1, 2)); b = decimalAte(r, caso === 1 ? 1 : 10, Math.floor(a / 100) - 1, entre(r, 0, 2)); }
  const casas = Math.max(casasDe(a), casasDe(b), 1);
  const t = a - b;
  return { tipo: 'decimal-subtracao', enunciado: 'Faça a subtração. Lembre: vírgula embaixo de vírgula.', sentenca: `${num(a, 0)} − ${num(b, 0)} = ?`, resposta: t / 100, decimal: true,
    explicacao: `${casasDe(a) === 0 ? `Escrevemos ${num(a, 0)} como ${virgula(a, casas)}. ` : ''}Armamos ${virgula(a, casas)} − ${virgula(b, casas)} com as vírgulas alinhadas e subtraímos da direita para a esquerda, trocando quando precisa: ${virgula(t, casas)}. Prova real: ${virgula(t, casas)} + ${virgula(b, casas)} = ${virgula(a, casas)}.` };
}

/** Compra com dois ou três preços (sorvetes, blusas, comissões...). */
function problemaCompra(r: Rng): Conta {
  const n = um(r, NOMES);
  const caso = entre(r, 0, 2);
  if (caso === 0) {
    // Como na placa do livro: 2 bolas custam mais que 1 bola.
    const p1 = entre(r, 40, 59) * 10, p2 = p1 + entre(r, 5, 20) * 5, p3 = decimalAte(r, 5, 8, 2);
    const t = p1 + p2 + p3;
    return { tipo: 'problema-compra', enunciado: `No carrinho de sorvete, 1 bola custa ${rs(p1)}; 2 bolas custam ${rs(p2)}; o pote custa ${rs(p3)}. ${n} comprou um de cada. Quanto pagou?`,
      resposta: t / 100, decimal: true, reais: true,
      explicacao: `Somamos os três preços com as vírgulas alinhadas: ${virgula(p1, 2)} + ${virgula(p2, 2)} + ${virgula(p3, 2)} = ${virgula(t, 2)}. Pagou ${rs(t)}.` };
  }
  const [coisa, um1, outro, min, max] = caso === 1 ? (['duas blusas', 'uma', 'outra', 20, 99] as const) : (['dois livros', 'um', 'outro', 10, 40] as const);
  const p1 = decimalAte(r, min, max, entre(r, 1, 2)), p2 = decimalAte(r, min, max, entre(r, 1, 2)), t = p1 + p2;
  return { tipo: 'problema-compra', enunciado: `${n} comprou ${coisa}: ${um1} de ${rs(p1)} e ${outro} de ${rs(p2)}. Quanto gastou ao todo?`,
    resposta: t / 100, decimal: true, reais: true,
    explicacao: `Juntar é somar: ${virgula(p1, 2)} + ${virgula(p2, 2)} = ${virgula(t, 2)}. Gastou ${rs(t)}.` };
}

/** Troco: pagou com cédula(s) e recebeu a diferença (p. 79 a 84, 87 e 97). */
function problemaTroco(r: Rng): Conta {
  const n = um(r, NOMES);
  // Cada compra combina com o dinheiro usado (ninguém paga um iogurte com duas notas de 100).
  const [cedulas, pago, coisa] = um(r, [
    ['uma cédula de 10 reais', 1000, um(r, ['um iogurte', 'um picolé', 'um suco'] as const)],
    ['uma cédula de 20 reais', 2000, um(r, ['um caderno', 'um livro', 'um sorvete de pote'] as const)],
    ['uma cédula de 50 reais', 5000, um(r, ['um brinquedo', 'uma blusa', 'um livro'] as const)],
    ['uma cédula de 100 reais', 10000, um(r, ['um protetor solar', 'uma blusa', 'um brinquedo'] as const)],
    ['duas cédulas de 100 reais', 20000, um(r, ['uma conta', 'uma mochila', 'um tênis'] as const)],
  ] as const);
  // O preço fica entre a metade e quase o valor pago, como no livro (4,50 com 10; 87,50 com 100; 126,80 com 200).
  const preco = decimalAte(r, Math.floor(pago / 200), pago / 100 - 1, entre(r, 1, 2));
  const verbo = coisa === 'uma conta' ? 'tinha' : 'comprou';
  const t = pago - preco;
  return { tipo: 'problema-troco', enunciado: `${n} ${verbo} ${coisa} de ${rs(preco)} e pagou com ${cedulas}. Quanto recebeu de troco?`, resposta: t / 100, decimal: true, reais: true,
    explicacao: `Escrevemos ${pago / 100} como ${virgula(pago, 2)} e subtraímos: ${virgula(pago, 2)} − ${virgula(preco, 2)} = ${virgula(t, 2)}. O troco é ${rs(t)}.` };
}

/** Desconto: preço "De" menos preço "Por" (p. 78 e 96). */
function problemaDesconto(r: Rng): Conta {
  const coisa = um(r, ['O chaveiro', 'O vaso', 'A moldura de foto', 'A almofada', 'O protetor solar'] as const);
  const de = decimalAte(r, 12, 99, 2);
  const desconto = decimalAte(r, 1, Math.min(30, Math.floor(de / 100) - 2), entre(r, 1, 2));
  const por = de - desconto;
  return { tipo: 'problema-desconto', enunciado: `${coisa} estava "De: ${rs(de)}" e agora está "Por: ${rs(por)}". Qual é o valor do desconto?`, resposta: desconto / 100, decimal: true, reais: true,
    explicacao: `O desconto é a diferença entre os preços: ${virgula(de, 2)} − ${virgula(por, 2)} = ${virgula(desconto, 2)}. Desconto de ${rs(desconto)}.` };
}

/** Quanto falta para chegar a 1 real (p. 61). */
function faltaUmReal(r: Rng): Conta {
  const preco = entre(r, 5, 99);
  const coisa = um(r, ['A muda de alface', 'O chiclete', 'A bala', 'O adesivo'] as const);
  return { tipo: 'falta-um-real', enunciado: `${coisa} custa ${rs(preco)}. Quanto falta para custar R$ 1,00?`, resposta: (100 - preco) / 100, decimal: true, reais: true,
    explicacao: `1 real tem 100 centavos: 100 − ${preco} = ${100 - preco} ${100 - preco === 1 ? 'centavo' : 'centavos'}, ou ${rs(100 - preco)}.` };
}

/** Todos os tipos de conta. A chave é o nome usado nos capítulos. */
export const GERADORES: Record<string, (r: Rng) => Conta> = {
  'falta-soma': faltaSoma,
  'falta-subtracao': faltaSubtracao,
  'falta-multiplicacao': faltaMultiplicacao,
  'falta-divisao': faltaDivisao,
  'problema-soma': problemaSoma,
  'problema-subtracao': problemaSubtracao,
  'problema-vezes': problemaVezes,
  'problema-divisao': problemaDivisao,
  'prova-real': provaReal,
  'setas': setas,
  'balanca-falta': balancaFalta,
  'balanca-diferenca': balancaDiferenca,
  'sentenca-membros': sentencaMembros,
  'multiplos-sequencia': multiplosSequencia,
  'multiplos-receita': multiplosReceita,
  'fracao-unitaria': fracaoUnitaria,
  'fracao-figura': fracaoFigura,
  'fracao-reta': fracaoReta,
  'fracao-escrita': fracaoEscrita,
  'fracao-unitaria-quantidade': fracaoUnitariaQuantidade,
  'fracao-quantidade': fracaoQuantidade,
  'fracao-problema': fracaoProblema,
  'fracao-parte-todo': fracaoParteTodo,
  'fracao-resto': fracaoResto,
  'porcentagem': porcentagem,
  'decimal-moedas': decimalMoedas,
  'decimos': decimos,
  'decimal-reta': decimalReta,
  'centesimos': centesimos,
  'decimos-centavos': decimosCentavos,
  'valor-algarismo': valorAlgarismo,
  'decimal-escrita': decimalEscrita,
  'decimal-medida': decimalMedida,
  'decimal-comparar': decimalComparar,
  'decimal-soma': decimalSoma,
  'decimal-subtracao': decimalSubtracao,
  'problema-compra': problemaCompra,
  'problema-troco': problemaTroco,
  'problema-desconto': problemaDesconto,
  'falta-um-real': faltaUmReal,
};

/** Contas em que vale a pena armar no papel (aparece a dica "arme a conta no papel"). */
export const TIPOS_PAPEL = new Set([
  'problema-soma', 'problema-subtracao', 'problema-vezes', 'problema-divisao', 'prova-real',
  'balanca-falta', 'balanca-diferenca', 'multiplos-receita',
  'fracao-unitaria-quantidade', 'fracao-quantidade', 'fracao-problema',
  'decimal-soma', 'decimal-subtracao', 'problema-compra', 'problema-troco', 'problema-desconto',
]);

export const ehFracao = (r: Resposta): r is [number, number] => Array.isArray(r);

/** Confere a resposta digitada. Fração: aceita outra escrita do mesmo valor (2/4 = 1/2), menos quando a conta pede `exata`. */
export function confere(c: Conta, digitado: Resposta): boolean {
  const certo = c.resposta;
  if (ehFracao(certo) !== ehFracao(digitado)) return false;
  // Número com vírgula: compara em centavos (12,5 = 12,50 e não há erro de arredondamento).
  if (!ehFracao(certo) && !ehFracao(digitado)) return Math.round(certo * 100) === Math.round(digitado * 100);
  if (!ehFracao(certo) || !ehFracao(digitado)) return false;
  if (digitado[1] === 0) return false;
  return c.exata ? certo[0] === digitado[0] && certo[1] === digitado[1] : certo[0] * digitado[1] === digitado[0] * certo[1];
}

/** A resposta como texto ("3/4", "12" ou "12,5"; com `reais`, "12,50"). */
export const textoResposta = (r: Resposta, reais = false) => (ehFracao(r) ? `${r[0]}/${r[1]}` : virgula(Math.round(r * 100), reais ? 2 : 0));

/** A resposta certa como aparece para a criança: "R$ 12,50", "14,3 cm", "3/4". */
export const textoCerto = (c: Conta, r: Resposta = c.resposta) =>
  `${c.reais ? 'R$ ' : ''}${textoResposta(r, c.reais)}${c.unidade ? ' ' + c.unidade : ''}`;

/** Cria uma conta do tipo pedido (números novos a cada vez). */
export function gerarConta(tipo: string, r: Rng = Math.random): Conta | null {
  const g = GERADORES[tipo];
  return g ? g(r) : null;
}

/** Cria a lista de contas de uma fase, na ordem dos tipos (do mais fácil para o mais difícil). */
export function gerarContas(tipos: string[], r: Rng = Math.random): Conta[] {
  return tipos.map((t) => gerarConta(t, r)).filter((c): c is Conta => !!c);
}
