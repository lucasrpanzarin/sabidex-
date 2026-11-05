// Lê vozes/pedido.json e fala com o ElevenLabs. Ações:
//  - "listar":  salva em vozes/lista.json as vozes brasileiras disponíveis
//  - "amostra": grava uma frase de teste com cada voz em vozes/amostras/
//  - "gerar":   grava todos os temas com cada voz em public/audio/<voz>/
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { capitulos } from '../src/data/index';

const KEY = process.env.ELEVENLABS_API_KEY;
const API = 'https://api.elevenlabs.io';
interface Voz { nome: string; id?: string; dono?: string; busca?: string; modelo?: string }
interface Pedido { acao: 'listar' | 'minhas' | 'amostra' | 'gerar'; modelo?: string; vozes?: Voz[]; frase?: string; capitulos?: string[] }

const resultado: Record<string, unknown> = { quando: new Date().toISOString() };
const salvarResultado = () => writeFileSync('vozes/resultado.json', JSON.stringify(resultado, null, 2) + '\n');

async function api(caminho: string, init: RequestInit = {}) {
  const r = await fetch(API + caminho, { ...init, headers: { 'xi-api-key': KEY!, ...(init.headers ?? {}) } });
  if (!r.ok) throw new Error(`${caminho}: HTTP ${r.status} ${await r.text()}`);
  return r;
}

function texto(t: { titulo: string; pontos: string[] }) {
  return (t.titulo + '. ' + t.pontos.join(' '))
    .replace(/\*\*/g, '').replace(/a\.C\./g, 'antes de Cristo').replace(/\bséculo 19\b/g, 'século dezenove')
    // Contas de Matemática: o sinal vira palavra para a voz ler certo.
    .replace(/\s*×\s*/g, ' vezes ').replace(/\s*÷\s*/g, ' dividido por ').replace(/\s+−\s+/g, ' menos ')
    .replace(/\s+\+\s+/g, ' mais ').replace(/\s+=\s+/g, ' é igual a ').replace(/_{3}/g, 'um número');
}

async function falar(voz: Voz, frase: string, modelo: string) {
  const r = await api(`/v1/text-to-speech/${voz.id!}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: frase, model_id: modelo, language_code: 'pt', voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true } }),
  });
  return Buffer.from(await r.arrayBuffer());
}

/** Acha a voz pelo nome na biblioteca quando não temos o id. */
async function resolver(v: Voz) {
  if (v.id) return;
  const r = await (await api(`/v1/shared-voices?page_size=20&language=pt&search=${encodeURIComponent(v.busca ?? v.nome)}`)).json() as { voices: Record<string, string>[] };
  const achada = r.voices[0];
  if (!achada) throw new Error(`Não achei a voz "${v.busca ?? v.nome}" na biblioteca.`);
  v.id = achada.voice_id; v.dono = achada.public_owner_id;
  const lista = (resultado.encontradas ??= []) as unknown[];
  lista.push({ busca: v.busca, nome: achada.name, id: achada.voice_id });
}

async function adicionarSeCompartilhada(v: Voz) {
  if (!v.dono) return;
  try {
    await api(`/v1/voices/add/${v.dono}/${v.id!}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ new_name: `Sabidex ${v.nome}` }) });
  } catch (e) { if (!String(e).includes('already')) console.log('aviso ao adicionar voz:', String(e).slice(0, 200)); }
}

async function main() {
  const p: Pedido = JSON.parse(readFileSync('vozes/pedido.json', 'utf8'));
  resultado.acao = p.acao;
  if (!KEY) throw new Error('Falta o segredo ELEVENLABS_API_KEY no GitHub.');
  const modelo = p.modelo ?? 'eleven_multilingual_v2';

  if (p.acao === 'listar') {
    const lista: unknown[] = [];
    for (const gen of ['female', 'male']) {
      const r = await (await api(`/v1/shared-voices?page_size=100&language=pt&gender=${gen}&sort=usage_character_count_1y`)).json() as { voices: Record<string, unknown>[] };
      for (const v of r.voices) lista.push({ nome: v.name, id: v.voice_id, dono: v.public_owner_id, genero: v.gender, idade: v.age, sotaque: v.accent, uso: v.use_case, descricao: String(v.description ?? '').slice(0, 200), amostra: v.preview_url });
    }
    mkdirSync('vozes', { recursive: true });
    writeFileSync('vozes/lista.json', JSON.stringify(lista, null, 2) + '\n');
    resultado.total = lista.length;
  }

  if (p.acao === 'minhas') {
    // Vozes da conta (inclui as adicionadas da biblioteca) e, se der, as favoritas da biblioteca.
    const minhas = await (await api('/v2/voices?page_size=100')).json() as { voices: Record<string, unknown>[] };
    resultado.minhas = minhas.voices.map((v) => ({ nome: v.name, id: v.voice_id, categoria: v.category, criada: v.created_at_unix, rotulos: v.labels }));
    for (const q of ['favorites=true', 'favorited=true', 'is_favorited=true']) {
      try {
        const f = await (await api(`/v1/shared-voices?page_size=50&${q}`)).json() as { voices: Record<string, unknown>[] };
        (resultado as Record<string, unknown>)[`favoritas_${q}`] = f.voices.slice(0, 20).map((v) => ({ nome: v.name, id: v.voice_id, dono: v.public_owner_id }));
      } catch (e) { (resultado as Record<string, unknown>)[`favoritas_${q}`] = String(e).slice(0, 160); }
    }
  }

  if (p.acao === 'amostra' || p.acao === 'gerar') {
    for (const v of p.vozes ?? []) { await resolver(v); await adicionarSeCompartilhada(v); }
  }

  if (p.acao === 'amostra') {
    mkdirSync('vozes/amostras', { recursive: true });
    const frase = p.frase ?? 'Oi! Eu sou o Ará. Hoje vamos aprender sobre os khoi-khoi e os san, os povos mais antigos da África. Eles não escreviam: deixaram pinturas rupestres nas rochas!';
    const feitos: string[] = [];
    for (const v of p.vozes ?? []) {
      writeFileSync(`vozes/amostras/${v.nome}.mp3`, await falar(v, frase, v.modelo ?? modelo));
      feitos.push(v.nome);
    }
    resultado.amostras = feitos;
  }

  if (p.acao === 'gerar') {
    let caracteres = 0;
    const caps = capitulos.filter((c) => !p.capitulos || p.capitulos.includes(c.id));
    for (const v of p.vozes ?? []) {
      mkdirSync(`public/audio/${v.nome}`, { recursive: true });
      for (const cap of caps) {
        for (const [i, t] of cap.temas.entries()) {
          const arquivo = (t.audio ?? `audio/${cap.id}-${i}.mp3`).replace(/^audio\//, '');
          const frase = texto(t);
          caracteres += frase.length;
          writeFileSync(`public/audio/${v.nome}/${arquivo}`, await falar(v, frase, v.modelo ?? modelo));
        }
      }
    }
    resultado.caracteres = caracteres;
  }
  resultado.ok = true;
}

main().catch((e) => { resultado.ok = false; resultado.erro = String(e).slice(0, 800); console.error(e); }).finally(salvarResultado);
