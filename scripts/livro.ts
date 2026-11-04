// Robô do livro: transforma fotos das páginas do livro da escola num capítulo do Sabidex.
// Lê livro/pedido.json. Ações:
//  - "ler":      lê cada foto em livro/<capitulo>/fotos/ e escreve a transcrição fiel em livro/<capitulo>/paginas.md
//  - "gerar":    a partir de paginas.md, cria o capítulo (src/data/<arquivo>.ts) e livro/<capitulo>/capitulo.json
//  - "conferir": um segundo robô, separado, confere cada item contra o livro e escreve livro/<capitulo>/conferencia.md
//  - "tudo":     ler + gerar + conferir
// A chave fica no segredo ANTHROPIC_API_KEY do GitHub. Regras de pedagogia: docs/ESTUDOS.md.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { capitulos } from '../src/data/index';
import type { Capitulo, Raridade } from '../src/data/tipos';
import { validarCapitulo, espalharRespostas, guiaDaIdade } from '../src/lib/conteudo';

const MODELO = 'claude-opus-5-5';
interface Pedido {
  acao: 'ler' | 'gerar' | 'conferir' | 'tudo';
  /** id do capítulo, ex.: "historia-11" (também é o nome da pasta em livro/) */
  capitulo: string;
  materia?: string;
  numero?: number;
  /** ano escolar da criança (padrão 4) — muda o tamanho das frases e o vocabulário */
  ano?: number;
}

const resultado: Record<string, unknown> = { quando: new Date().toISOString() };
const salvarResultado = () => writeFileSync('livro/resultado.json', JSON.stringify(resultado, null, 2) + '\n');
const avisos: string[] = [];

let cliente: Anthropic | null = null;
function claude() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('Falta o segredo ANTHROPIC_API_KEY no GitHub.');
  return (cliente ??= new Anthropic());
}

/** Pede um texto ao Claude. Se o robô recusar, outro modelo tenta (fallbacks). */
async function pedirTexto(system: string, content: Anthropic.Beta.BetaContentBlockParam[], esforco: 'low' | 'medium' | 'high' = 'medium') {
  const r = await claude().beta.messages.stream({
    model: MODELO,
    max_tokens: 32000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: esforco },
    system,
    messages: [{ role: 'user', content }],
  }).finalMessage();
  if (r.stop_reason === 'refusal') throw new Error('O robô se recusou a ler esta parte. Confira a foto.');
  return r.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim();
}

/** Pede uma resposta no formato exato do schema (JSON validado). */
async function pedirDados<T extends z.ZodType>(system: string, texto: string, schema: T, esforco: 'medium' | 'high' = 'high'): Promise<z.infer<T>> {
  const r = await claude().beta.messages.parse({
    model: MODELO,
    max_tokens: 32000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: esforco, format: betaZodOutputFormat(schema) },
    system,
    messages: [{ role: 'user', content: texto }],
  });
  if (r.stop_reason === 'refusal') throw new Error('O robô se recusou a gerar o conteúdo.');
  if (r.stop_reason === 'max_tokens') throw new Error('A resposta ficou grande demais. Tente com menos páginas.');
  if (!r.parsed_output) throw new Error('O robô respondeu fora do formato esperado.');
  return r.parsed_output;
}

// ---------- 1. LER: foto → transcrição fiel ----------

const LEITOR = `Você transcreve páginas de livros didáticos brasileiros do ensino fundamental, a partir de fotos tiradas com celular.
Sua transcrição é a ÚNICA fonte que outro robô vai usar para criar atividades para crianças, então fidelidade é tudo.

Regras:
- Copie o texto exatamente como está no livro, em português, na ordem de leitura (títulos, parágrafos, boxes, legendas).
- Marque a estrutura em Markdown: "#" para título do capítulo, "##" para subtítulos, "> " para boxes/quadros laterais.
- Para cada imagem, mapa, gráfico, linha do tempo ou ilustração escreva: [IMAGEM: o que ela mostra, em uma ou duas frases] e copie a legenda/crédito se houver.
- Linhas do tempo e tabelas: transcreva todas as datas e valores, em lista ou tabela Markdown.
- Exercícios do livro: transcreva sob "### Atividades do livro" (eles mostram o que a professora espera que a criança saiba).
- Se uma palavra ou trecho estiver ilegível, cortado ou borrado, escreva [ILEGÍVEL]. NUNCA complete com o que você acha que estaria escrito.
- Na primeira linha, escreva "Página do livro: N" com o número impresso na página (ou "Página do livro: ?" se não aparecer).
- Não comente, não resuma, não corrija o livro. Só transcreva.`;

function prepararFoto(caminho: string): { dados: string; tipo: 'image/jpeg' | 'image/png' | 'image/webp' } {
  // Fotos de celular são grandes: reduz para 2000 px e JPEG, se o ImageMagick existir (existe no GitHub).
  try {
    const saida = join(tmpdir(), `sabidex-${Date.now()}.jpg`);
    execFileSync('convert', [caminho, '-auto-orient', '-resize', '2000x2000>', '-quality', '85', saida]);
    return { dados: readFileSync(saida).toString('base64'), tipo: 'image/jpeg' };
  } catch {
    const ext = caminho.toLowerCase().split('.').pop();
    if (statSync(caminho).size > 5_000_000) throw new Error(`A foto ${caminho} tem mais de 5 MB. Mande uma versão menor.`);
    return { dados: readFileSync(caminho).toString('base64'), tipo: ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg' };
  }
}

async function ler(p: Pedido) {
  const pasta = `livro/${p.capitulo}/fotos`;
  if (!existsSync(pasta)) throw new Error(`Não achei a pasta ${pasta}. Coloque as fotos das páginas lá.`);
  const fotos = readdirSync(pasta).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort((a, b) => a.localeCompare(b, 'pt', { numeric: true }));
  if (!fotos.length) throw new Error(`A pasta ${pasta} está vazia.`);
  const partes: string[] = [`<!-- Transcrição feita pelo robô em ${new Date().toISOString().slice(0, 10)}. Confira com o livro antes de gerar. -->`];
  for (const f of fotos) {
    console.log('lendo', f);
    const { dados, tipo } = prepararFoto(join(pasta, f));
    const texto = await pedirTexto(LEITOR, [
      { type: 'image', source: { type: 'base64', media_type: tipo, data: dados } },
      { type: 'text', text: `Transcreva esta página (arquivo ${f}).` },
    ]);
    const ilegiveis = (texto.match(/\[ILEGÍVEL\]/g) ?? []).length;
    if (ilegiveis) avisos.push(`${f}: ${ilegiveis} trecho(s) ilegível(is). Tire a foto de novo, com mais luz e sem tremer.`);
    partes.push(`\n---\n\n<!-- foto: ${f} -->\n${texto}`);
  }
  writeFileSync(`livro/${p.capitulo}/paginas.md`, partes.join('\n') + '\n');
  resultado.fotosLidas = fotos.length;
}

// ---------- 2. GERAR: transcrição → capítulo ----------

const fonte = z.string().describe('Número da página do livro de onde saiu a informação, ex.: "112". Use "?" se não souber.');
const Gerado = z.object({
  titulo: z.string(),
  subtitulo: z.string(),
  temas: z.array(z.object({ titulo: z.string(), pontos: z.array(z.string()), fonte })),
  pares: z.array(z.object({ palavra: z.string(), significado: z.string(), fonte })),
  linha: z.array(z.object({ ano: z.string(), ordem: z.number(), fato: z.string(), fonte })),
  quiz: z.array(z.object({ frase: z.string(), verdadeira: z.boolean(), explicacao: z.string(), fonte })),
  prova: z.array(z.object({
    pergunta: z.string(),
    opcoes: z.array(z.string()).describe('Exatamente 4 opções'),
    certa: z.number().int().describe('Índice da opção certa, de 0 a 3'),
    explicacao: z.string(),
    nivel: z.enum(['lembrar', 'entender', 'aplicar', 'analisar']),
    fonte,
  })),
  cartas: z.array(z.object({
    nome: z.string(),
    raridade: z.enum(['comum', 'rara', 'epica', 'lendaria']),
    simbolo: z.string().describe('1 ou 2 letras, ou um símbolo curto'),
    fato: z.string(),
    fonte,
  })),
  // Material pronto para os próximos jogos (veja docs/ESTUDOS.md). Ainda não aparece no app.
  extras: z.object({
    lacunas: z.array(z.object({ frase: z.string().describe('Frase com ___ no lugar da palavra-chave'), resposta: z.string(), distratores: z.array(z.string()), fonte })),
    quemSouEu: z.array(z.object({ resposta: z.string(), pistas: z.array(z.string()).describe('3 pistas, da mais difícil para a mais fácil'), fonte })),
    grupos: z.array(z.object({ nome: z.string(), itens: z.array(z.string()), fonte })),
    causaConsequencia: z.array(z.object({ causa: z.string(), consequencia: z.string(), fonte })),
  }),
});
type Gerado = z.infer<typeof Gerado>;

function geradorSystem(ano: number) {
  return `Você é um professor do ${ano}º ano e designer de jogos educativos. Você cria o conteúdo do Sabidex, app em que crianças estudam a matéria da escola em fases curtas de jogo.

Fonte: use SOMENTE a transcrição do livro que vou mandar. Não traga fatos, datas, nomes ou números de fora, nem que você tenha certeza.
Se algo estiver [ILEGÍVEL], ignore aquele trecho. Em cada item, preencha "fonte" com a página do livro.

${guiaDaIdade(ano)}

O que criar:
1. temas (4 a 7): um por subtítulo do livro, na ordem do livro. Cada tema tem 3 a 5 "pontos": frases curtas com as ideias principais, e as palavras-chave em **negrito**. Os pontos viram narração em áudio, então devem soar bem lidos em voz alta.
2. pares (8 a 10): palavra-chave do capítulo + significado curto (até 10 palavras), para o jogo da memória. Escolha as palavras que a prova do livro cobraria.
3. linha (6 a 10): fatos com data, em qualquer ordem. "ordem" é um número para ordenar (antes de Cristo é negativo; para séculos use o ano do meio, ex.: século 16 = 1550). Se o capítulo não tiver datas, use etapas de um processo em ordem (ordem 1, 2, 3...) e escreva "ano" como "1º", "2º"...
4. quiz (10 a 12): frases de verdadeiro ou falso, metade de cada. As falsas devem ser erros que uma criança realmente cometeria (confundir dois povos, trocar causa e efeito), nunca absurdos. A explicação corrige o erro em uma frase.
5. prova (exatamente 10): múltipla escolha com 4 opções e uma só certa. Misture os níveis: 3 "lembrar", 4 "entender", 2 "aplicar", 1 "analisar". As erradas devem ser plausíveis (do mesmo tipo da certa e com tamanho parecido). Proibido: "todas as anteriores", "nenhuma das anteriores", pergunta com "NÃO" ou "INCORRETA", pegadinha. A explicação diz por que a certa é certa.
6. cartas (exatamente 12): pessoas, lugares, objetos e ideias marcantes do capítulo, com um fato curioso de uma frase. Raridades: 5 comum, 3 rara, 2 epica, 2 lendaria. As lendárias são as 2 coisas mais importantes ou impressionantes do capítulo.
7. extras: 8 lacunas (frase do livro com a palavra-chave trocada por ___, mais 3 distratores), 4 "quem sou eu" (3 pistas cada), 2 a 3 grupos para classificar (ex.: "khoi-khoi" x "san", com 3 a 5 itens cada) e 4 pares de causa e consequência.

Escolha o que é mais importante: o que o livro repete, põe em negrito, em box, nas atividades ou no resumo. Cubra todos os subtítulos, não só o começo.`;
}

async function gerar(p: Pedido) {
  const transcricao = `livro/${p.capitulo}/paginas.md`;
  if (!existsSync(transcricao)) throw new Error(`Não achei ${transcricao}. Rode a ação "ler" antes.`);
  const ano = p.ano ?? 4;
  const g = await pedirDados(geradorSystem(ano), `Transcrição do livro (${p.materia ?? 'matéria não informada'}, capítulo ${p.numero ?? '?'}):\n\n${readFileSync(transcricao, 'utf8')}`, Gerado);

  const id = p.capitulo;
  const numero = p.numero ?? Number(id.match(/\d+$/)?.[0] ?? 0);
  const materia = p.materia ?? id.replace(/-\d+$/, '').replace(/^./, (c) => c.toUpperCase());
  const prefixo = materia.slice(0, 1).toLowerCase();
  // As cartas continuam a numeração dos capítulos já existentes da mesma matéria.
  const outros = capitulos.filter((c) => c.id !== id).flatMap((c) => c.cartas).filter((c) => c.id.startsWith(prefixo + '-'));
  const inicio = outros.reduce((m, c) => Math.max(m, c.numero), 0) + 1;

  const cap: Capitulo = {
    id, numero, materia,
    titulo: g.titulo,
    subtitulo: g.subtitulo,
    temas: g.temas.map((t, i) => ({ titulo: t.titulo, pontos: t.pontos, audio: `audio/c${numero}-${i}.mp3` })),
    pares: g.pares.map(({ palavra, significado }) => ({ palavra, significado })),
    linha: g.linha.map(({ ano: a, ordem, fato }) => ({ ano: a, ordem, fato })),
    quiz: g.quiz.map(({ frase, verdadeira, explicacao }) => ({ frase, verdadeira, explicacao })),
    prova: espalharRespostas(g.prova.map((q) => ({
      pergunta: q.pergunta,
      opcoes: q.opcoes.slice(0, 4) as [string, string, string, string],
      certa: Math.min(3, Math.max(0, q.certa)) as 0 | 1 | 2 | 3,
      explicacao: q.explicacao,
    }))),
    cartas: g.cartas.map((c, i) => ({
      id: `${prefixo}-${String(inicio + i).padStart(3, '0')}`,
      numero: inicio + i,
      nome: c.nome,
      raridade: c.raridade as Raridade,
      simbolo: c.simbolo,
      fato: c.fato,
    })),
  };

  const problemas = validarCapitulo(cap, ano);
  const nomeArquivo = id.replace(/-/g, '');
  const nomeVar = nomeArquivo;
  writeFileSync(`src/data/${nomeArquivo}.ts`,
    `import type { Capitulo } from "./tipos";\n\n` +
    `// RASCUNHO feito pelo robô do livro (scripts/livro.ts) a partir de livro/${id}/paginas.md.\n` +
    `// Confira com o livro e com livro/${id}/conferencia.md antes de colocar em src/data/index.ts.\n` +
    `export const ${nomeVar}: Capitulo = ${JSON.stringify(cap, null, 2)};\n`);
  writeFileSync(`livro/${id}/capitulo.json`, JSON.stringify({ ano, gerado: g, problemas }, null, 2) + '\n');
  resultado.arquivo = `src/data/${nomeArquivo}.ts`;
  resultado.problemasAutomaticos = problemas;
  return { cap, g };
}

// ---------- 3. CONFERIR: segundo robô, separado, contra o livro ----------

const Conferencia = z.object({
  itens: z.array(z.object({
    onde: z.string().describe('Ex.: "prova 3", "quiz 7", "tema 2, ponto 1", "carta Pirâmide"'),
    gravidade: z.enum(['erro', 'atencao']),
    problema: z.string(),
    sugestao: z.string(),
  })),
  coberturaFaltando: z.array(z.string()).describe('Assuntos importantes do livro que ficaram de fora'),
  resumo: z.string(),
});

const CONFERENTE = `Você é um revisor exigente de material didático infantil. Recebe a transcrição de um livro escolar e o conteúdo de jogo criado a partir dele.
Confira item por item e aponte:
- "erro": fato que não está no livro ou contradiz o livro; resposta marcada como certa que está errada; mais de uma opção certa; verdadeiro/falso ambíguo; data ou nome trocado.
- "atencao": frase difícil demais para a idade, palavra que a criança não conhece sem explicação, distrator absurdo ou óbvio, pegadinha, explicação que não ensina, conteúdo que pode assustar ou ofender.
Não aponte gosto pessoal. Se estiver tudo certo num item, não fale dele. Escreva em português simples: quem vai ler é o dono do app, que não é professor.`;

async function conferir(p: Pedido, gerado?: Gerado) {
  const transcricao = readFileSync(`livro/${p.capitulo}/paginas.md`, 'utf8');
  const g = gerado ?? (JSON.parse(readFileSync(`livro/${p.capitulo}/capitulo.json`, 'utf8')) as { gerado: Gerado }).gerado;
  const ano = p.ano ?? 4;
  const c = await pedirDados(CONFERENTE + '\n\n' + guiaDaIdade(ano),
    `TRANSCRIÇÃO DO LIVRO:\n\n${transcricao}\n\nCONTEÚDO CRIADO (as perguntas da prova foram reembaralhadas depois, então ignore a posição da resposta certa):\n\n${JSON.stringify(g, null, 2)}`,
    Conferencia);
  const auto = (JSON.parse(readFileSync(`livro/${p.capitulo}/capitulo.json`, 'utf8')) as { problemas: string[] }).problemas;
  const erros = c.itens.filter((i) => i.gravidade === 'erro');
  const atencao = c.itens.filter((i) => i.gravidade === 'atencao');
  const linha = (i: (typeof c.itens)[number]) => `- **${i.onde}:** ${i.problema}\n  - Sugestão: ${i.sugestao}`;
  const md = [
    `# Conferência do capítulo ${p.capitulo}`,
    '',
    c.resumo,
    '',
    `## Erros (${erros.length}) — precisam ser corrigidos`,
    ...(erros.length ? erros.map(linha) : ['Nenhum.']),
    '',
    `## Atenção (${atencao.length}) — vale olhar`,
    ...(atencao.length ? atencao.map(linha) : ['Nada.']),
    '',
    '## Ficou de fora',
    ...(c.coberturaFaltando.length ? c.coberturaFaltando.map((x) => `- ${x}`) : ['Nada importante.']),
    '',
    '## Checagem automática (tamanho e formato)',
    ...(auto.length ? auto.map((x) => `- ${x}`) : ['Tudo dentro das regras.']),
    '',
    '## Antes de publicar',
    '- [ ] Corrigi os erros acima no arquivo do capítulo',
    '- [ ] Conferi as datas e nomes com o livro',
    `- [ ] Coloquei o capítulo em \`src/data/index.ts\``,
    '- [ ] Pedi as narrações (vozes/pedido.json)',
    '- [ ] `npm test` e `npm run build` passaram',
    '',
  ].join('\n');
  writeFileSync(`livro/${p.capitulo}/conferencia.md`, md);
  resultado.conferencia = { erros: erros.length, atencao: atencao.length, faltando: c.coberturaFaltando.length };
}

async function main() {
  const p: Pedido = JSON.parse(readFileSync('livro/pedido.json', 'utf8'));
  resultado.acao = p.acao;
  resultado.capitulo = p.capitulo;
  if (!/^[a-z]+-\d+$/.test(p.capitulo ?? '')) throw new Error('"capitulo" precisa ser no formato materia-numero, ex.: "historia-11".');
  mkdirSync(`livro/${p.capitulo}`, { recursive: true });
  if (p.acao === 'ler' || p.acao === 'tudo') await ler(p);
  let g: Gerado | undefined;
  if (p.acao === 'gerar' || p.acao === 'tudo') g = (await gerar(p)).g;
  if (p.acao === 'conferir' || p.acao === 'tudo') await conferir(p, g);
  resultado.avisos = avisos;
  resultado.ok = true;
}

main().catch((e) => { resultado.ok = false; resultado.erro = String(e?.message ?? e); console.error(e); })
  .finally(() => { resultado.avisos ??= avisos; salvarResultado(); });
