// Gera a arte dos Sabimons com o Higgsfield. Lê arte/pedido.json e grava em arte/sabimons/originais/.
// A chave fica no GitHub (Settings → Secrets and variables → Actions):
//   HIGGSFIELD_API_KEY = "<key id>:<key secret>"   (ou HF_API_KEY e HF_API_SECRET separados)
//
// Pedido (arte/pedido.json):
//   { "acao": "gerar", "formas": [1], "numeros": ["001", ...] }
//   - forma 1 nasce só do texto; formas 2 e 3 usam a forma 1 como imagem de referência.
//   - imagens que já existem não são refeitas, a não ser com "refazer": true.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const BASE = process.env.HIGGSFIELD_BASE ?? 'https://platform.higgsfield.ai';
const PASTA = 'arte/sabimons/originais';
const REFS = 'arte/sabimons/referencias.json';

const chave = process.env.HIGGSFIELD_API_KEY
  ?? (process.env.HF_API_KEY && process.env.HF_API_SECRET ? `${process.env.HF_API_KEY}:${process.env.HF_API_SECRET}` : undefined);

interface Sabimon { numero: string; nomes: string[]; tipo: string; formas: string[] }
interface Pedido {
  acao: 'gerar' | 'modelos';
  formas: number[];
  numeros?: string[];
  refazer?: boolean;
  /** modelo para a forma 1 (só texto) */
  modelo?: string;
  /** modelo para as formas 2 e 3 (texto + imagem de referência) */
  modeloRef?: string;
  /** campos extras mandados em todo pedido ao Higgsfield */
  extra?: Record<string, unknown>;
}

const ESTILO = 'Original creature for a creature-collecting adventure game, stylized 3D game character render, dynamic action pose ready for battle, brave determined expression, big expressive eyes, strong readable silhouette, its elemental power clearly visible as glowing effects, vibrant saturated colors, dramatic rim lighting, full body, centered, plain pure white background, no text, no logo, no frame, no scenery. Exciting but friendly for kids aged 9 to 11, not scary, no blood. Original design, not based on any existing franchise or character.';
const MESMO_BICHO = 'This is a big evolution of the creature in the reference image. Follow the CHANGE list: new pose, bigger body, new parts, and the new colors if any. Follow the KEEP list so it is clearly recognizable as the same creature line. Do not copy the reference pose. Isolated character on a plain pure white background: absolutely no environment, no scenery, no dark background.';
const HERDA = 'Keep the special features the reference already has (emblems, cape, claws, armor, markings) and make them bigger and more powerful.';

const resultado: Record<string, unknown> = { quando: new Date().toISOString(), imagens: [] as unknown[] };
const salvar = () => writeFileSync('arte/resultado.json', JSON.stringify(resultado, null, 2) + '\n');
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function api(caminho: string, init: RequestInit = {}) {
  const url = caminho.startsWith('http') ? caminho : BASE + caminho;
  const r = await fetch(url, {
    ...init,
    headers: { Authorization: `Key ${chave}`, 'Content-Type': 'application/json', Accept: 'application/json', ...(init.headers ?? {}) },
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`${init.method ?? 'GET'} ${url}: HTTP ${r.status} ${texto.slice(0, 600)}`);
  try { return JSON.parse(texto) as Record<string, any>; } catch { throw new Error(`${url}: resposta não é JSON: ${texto.slice(0, 300)}`); }
}

function urlDaImagem(j: Record<string, any>): string | undefined {
  return j.images?.[0]?.url ?? j.image?.url ?? j.output?.images?.[0]?.url ?? j.results?.[0]?.url ?? j.jobs?.[0]?.results?.raw?.url;
}

// Nomes possíveis dos modelos no Higgsfield (o primeiro que existir é usado).
const TEXTO: Candidato[] = [
  { modelo: 'alibaba/qwen-image-3/text-to-image' },
  { modelo: 'bytedance/seedream/v4/text-to-image' },
  { modelo: 'bytedance/seedream/v4.5/text-to-image' },
  { modelo: 'bytedance/seedream/v4' },
  { modelo: 'seedream/v4/text-to-image' },
  { modelo: 'google/nano-banana-pro/text-to-image' },
  { modelo: 'google/nano-banana/text-to-image' },
  { modelo: 'nano-banana-pro/text-to-image' },
  { modelo: 'higgsfield-ai/soul/standard', extra: { resolution: '1080p' } },
];
const COM_REFERENCIA: Candidato[] = [
  { modelo: 'alibaba/qwen-image-3/edit' },
  { modelo: 'bytedance/seedream/v4/edit' },
  { modelo: 'bytedance/seedream/v4.5/edit' },
  { modelo: 'seedream/v4/edit' },
  { modelo: 'google/nano-banana-pro/edit' },
  { modelo: 'google/nano-banana/edit' },
  { modelo: 'nano-banana-pro/edit' },
];
interface Candidato { modelo: string; extra?: Record<string, unknown> }
const escolhido: Record<string, Candidato> = {};

/** Tenta os nomes de modelo até achar um que exista (nome errado não gasta crédito). */
async function gerarComCandidatos(tipo: 'texto' | 'ref', lista: Candidato[], corpo: Record<string, unknown>) {
  const tentativas = escolhido[tipo] ? [escolhido[tipo]] : lista;
  const falhas: string[] = [];
  for (const c of tentativas) {
    try {
      const url = await gerarImagem(c.modelo, { ...corpo, ...(c.extra ?? {}) });
      escolhido[tipo] = c;
      return { url, modelo: c.modelo };
    } catch (e) {
      if (!String(e).includes('model_not_found')) throw e;
      falhas.push(c.modelo);
    }
  }
  throw new Error(`Nenhum nome de modelo existe: ${falhas.join(', ')}`);
}

/** Pergunta ao Higgsfield a lista de modelos, se ele tiver esse endereço. */
async function sondar() {
  const achados: Record<string, unknown> = {};
  for (const c of ['/models/alibaba/qwen-image-3/text-to-image', '/models/alibaba/qwen-image-3/edit']) {
    try { achados[c] = JSON.stringify(await api(c)).slice(0, 3000); } catch (e) { achados[c] = String(e).slice(0, 200); }
  }
  resultado.sondagem = achados;
}

/** Manda o pedido e espera a imagem ficar pronta. Devolve o endereço da imagem. */
async function gerarImagem(modelo: string, corpo: Record<string, unknown>) {
  const envio = await api(`/${modelo}`, { method: 'POST', body: JSON.stringify(corpo) });
  const pronta = urlDaImagem(envio);
  if (pronta) return pronta;
  const id = envio.request_id ?? envio.id;
  const statusUrl: string = envio.status_url ?? `/requests/${id}/status`;
  if (!id && !envio.status_url) throw new Error(`Resposta sem id: ${JSON.stringify(envio).slice(0, 400)}`);
  const limite = Date.now() + 8 * 60_000;
  while (Date.now() < limite) {
    await espera(4000);
    const s = await api(statusUrl);
    const st = String(s.status ?? '').toLowerCase();
    if (st === 'completed' || st === 'succeeded') {
      const u = urlDaImagem(s);
      if (!u) throw new Error(`Pronto mas sem imagem: ${JSON.stringify(s).slice(0, 400)}`);
      return u;
    }
    if (['failed', 'nsfw', 'canceled', 'cancelled', 'error'].includes(st)) throw new Error(`Higgsfield recusou (${st}): ${JSON.stringify(s).slice(0, 400)}`);
  }
  throw new Error(`Demorou demais (pedido ${id}).`);
}

async function baixarPng(url: string, destino: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`baixar ${url}: HTTP ${r.status}`);
  const bytes = Buffer.from(await r.arrayBuffer());
  const sharp = (await import('sharp')).default;
  const img = sharp(bytes);
  const { width = 0, height = 0 } = await img.metadata();
  await img.png().toFile(destino);
  return { largura: width, altura: height };
}

/** Endereço público da forma anterior (1 para a 2, 2 para a 3) para servir de referência. */
async function referencia(numero: string, forma: number, refs: Record<string, string>) {
  const salva = refs[`${numero}-${forma}`];
  if (salva) {
    const r = await fetch(salva, { method: 'HEAD' }).catch(() => undefined);
    if (r?.ok) return salva;
  }
  const repo = process.env.GITHUB_REPOSITORY;
  if (repo) {
    const raw = `https://raw.githubusercontent.com/${repo}/main/${PASTA}/${numero}-${forma}.png`;
    const r = await fetch(raw, { method: 'HEAD' }).catch(() => undefined);
    if (r?.ok) return raw;
  }
  throw new Error(`Não achei um endereço público da forma ${forma} do ${numero}. Gere essa forma de novo.`);
}

async function main() {
  const p: Pedido = JSON.parse(readFileSync('arte/pedido.json', 'utf8'));
  resultado.pedido = p;
  if (!chave) throw new Error('Falta o segredo HIGGSFIELD_API_KEY no GitHub.');
  const lista: Sabimon[] = JSON.parse(readFileSync('arte/sabimons/lista.json', 'utf8'));
  const refs: Record<string, string> = existsSync(REFS) ? JSON.parse(readFileSync(REFS, 'utf8')) : {};
  const texto = p.modelo ? [{ modelo: p.modelo }] : TEXTO;
  const comRef = p.modeloRef ? [{ modelo: p.modeloRef }] : COM_REFERENCIA;
  if (p.acao === 'modelos') {
    // Salva a lista completa de modelos de imagem (com o formato de pedido de cada um).
    const todos: Record<string, any>[] = [];
    for (let pagina = 1; pagina <= 10; pagina++) {
      const r = await api(`/models?page=${pagina}&page_size=100`);
      const itens = (r.items ?? r.models ?? []) as Record<string, any>[];
      todos.push(...itens.filter((m) => !todos.some((t) => t.slug === m.slug)));
      if (itens.length === 0 || todos.length >= (r.total ?? 0)) break;
    }
    const imagem = todos.filter((m) => m.output_type !== 'video');
    writeFileSync('arte/modelos.json', JSON.stringify(imagem, null, 2) + '\n');
    resultado.total = todos.length;
    resultado.imagem = imagem.map((m) => `${m.slug} | ${m.title} | ${m.base_credits}`);
    resultado.ok = true;
    return;
  }
  mkdirSync(PASTA, { recursive: true });

  const feitos = resultado.imagens as unknown[];
  for (const forma of [...p.formas].sort()) {
    for (const s of lista.filter((x) => !p.numeros || p.numeros.includes(x.numero))) {
      const nome = `${s.numero}-${forma}`;
      const destino = `${PASTA}/${nome}.png`;
      if (existsSync(destino) && !p.refazer) { feitos.push({ nome, pulado: 'já existe' }); continue; }
      const prompt = `${ESTILO} ${s.formas[forma - 1]}`;
      const corpo: Record<string, unknown> = { prompt, aspect_ratio: '1:1', resolution: '2k', ...(p.extra ?? {}) };
      if (forma > 1) {
        corpo.prompt = `${prompt} ${MESMO_BICHO}${forma === 3 ? ` ${HERDA}` : ''}`;
        corpo.image_urls = [await referencia(s.numero, forma - 1, refs)];
      }
      // Falha genérica do Higgsfield: tenta de novo até 3 vezes.
      let gerado: { url: string; modelo: string } | undefined;
      for (let tentativa = 1; !gerado; tentativa++) {
        try {
          gerado = forma > 1 ? await gerarComCandidatos('ref', comRef, corpo) : await gerarComCandidatos('texto', texto, corpo);
        } catch (e) {
          if (tentativa >= 3 || !String(e).includes('(failed)')) throw e;
          await espera(5000);
        }
      }
      const { url, modelo: usado } = gerado;
      const tamanho = await baixarPng(url, destino);
      refs[nome] = url;
      writeFileSync(REFS, JSON.stringify(refs, null, 2) + '\n');
      feitos.push({ nome, sabimon: s.nomes[forma - 1], modelo: usado, ...tamanho });
      salvar();
    }
  }
  resultado.ok = true;
}

main()
  .catch((e) => { resultado.ok = false; resultado.erro = String(e).slice(0, 1500); console.error(e); })
  .finally(salvar);
