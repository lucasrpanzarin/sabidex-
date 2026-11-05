// Contas de Matemática geradas na hora: mesmo tipo de conta e mesmo método do livro, números novos a cada vez.
// Assim, jogar de novo é treinar de verdade (e não decorar a resposta).
// Cada tipo de conta tem um "gerador". O capítulo diz quais tipos entram em cada fase (campo `matematica` em tipos.ts).
// Para uma unidade nova (ex.: frações), crie geradores novos aqui, no mesmo nível do livro.

/** Desenho que aparece junto da conta. */
export type Visual =
  /** Balança de pratos. `null` = pacote sem a medida ("?"). `pende` = lado mais pesado (sem pende, está equilibrada). */
  | { tipo: 'balanca'; esquerda: (number | null)[]; direita: (number | null)[]; pende?: 'esquerda' | 'direita' }
  /** Setas de ida e volta: de → (ida) → para, e para → (volta) → de. `null` = quadrinho para descobrir. */
  | { tipo: 'setas'; de: number | null; para: number | null; ida: string; volta: string };

export interface Conta {
  /** id do gerador (vai para a Revisão do Ará) */
  tipo: string;
  enunciado: string;
  /** conta em destaque, com "?" no lugar do número que falta (ex.: "? × 3 = 30") */
  sentenca?: string;
  visual?: Visual;
  resposta: number;
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
  const [item, quantos, receita, plural] = um(r, [
    ['ovos', 'Quantos', 'torta', 'tortas'],
    ['copos de leite', 'Quantos', 'torta', 'tortas'],
    ['colheres de achocolatado', 'Quantas', 'bolo de caneca', 'bolos de caneca'],
    ['laranjas', 'Quantas', 'copo de suco', 'copos de suco'],
  ] as const);
  if (r() < 0.6) return { tipo: 'multiplos-receita', enunciado: `Cada ${receita} usa ${por} ${item}. ${quantos} ${item} para fazer ${n} ${plural}?`, resposta: por * n, unidade: item,
    explicacao: `São múltiplos de ${por}: ${n} × ${por} = ${por * n}.` };
  return { tipo: 'multiplos-receita', enunciado: `Cada ${receita} usa ${por} ${item}. Com ${por * n} ${item}, quantos ${plural} dá para fazer?`, resposta: n, unidade: plural,
    explicacao: `Usamos a divisão: ${por * n} ÷ ${por} = ${n}. Prova real: ${n} × ${por} = ${por * n}.` };
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
};

/** Cria uma conta do tipo pedido (números novos a cada vez). */
export function gerarConta(tipo: string, r: Rng = Math.random): Conta | null {
  const g = GERADORES[tipo];
  return g ? g(r) : null;
}

/** Cria a lista de contas de uma fase, na ordem dos tipos (do mais fácil para o mais difícil). */
export function gerarContas(tipos: string[], r: Rng = Math.random): Conta[] {
  return tipos.map((t) => gerarConta(t, r)).filter((c): c is Conta => !!c);
}
