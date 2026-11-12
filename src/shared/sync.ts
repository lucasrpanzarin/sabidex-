// Regras de sincronização usadas pelo app e pelo servidor.
// As cartas ficam numa tabela à parte no servidor (por causa das trocas);
// o resto do progresso é mesclado aqui, sem nunca perder nada.

/**
 * Uma compra na lojinha: um item colocado num Sabimon, ou uma evolução.
 * O saldo de Sabicoins é sempre XP total − soma dos preços das compras.
 */
export interface Compra {
  id: string;
  sabimon: string;
  /** id do item da loja (quando é item) */
  item?: string;
  /** forma nova (quando é evolução). `sabimon` é a carta: "s001-1", "s001-2" ou "s001-3" (compras antigas: só "s001") */
  forma?: 2 | 3;
  preco: number;
}

export interface ProgressoSync {
  xp: number;
  feitas: Record<string, true>;
  notas: Record<string, number>;
  pacotes: { id: string; tipo: 'normal' | 'epico'; capitulo: string }[];
  /** ids de pacotes já abertos (para um pacote aberto não voltar) */
  abertos: string[];
  dias: string[];
  compras: Compra[];
}

export const progressoVazio = (): ProgressoSync => ({ xp: 0, feitas: {}, notas: {}, pacotes: [], abertos: [], dias: [], compras: [] });

/**
 * Pacote de boas-vindas (Lucas, 05/11/2026): toda conta nova de criança já nasce com 1 pacote normal,
 * para ela entender o jogo logo de cara. A carta sai na sorte, como em qualquer pacote. Id fixo: nunca vem duas vezes.
 */
export const PACOTE_BOAS_VINDAS = 'boas-vindas';
export function comBoasVindas(p: ProgressoSync): ProgressoSync {
  if (p.abertos.includes(PACOTE_BOAS_VINDAS) || p.pacotes.some((x) => x.id === PACOTE_BOAS_VINDAS)) return p;
  return { ...p, pacotes: [{ id: PACOTE_BOAS_VINDAS, tipo: 'normal' as const, capitulo: PACOTE_BOAS_VINDAS }, ...p.pacotes].slice(0, 50) };
}

const uniq = <T,>(a: T[]) => [...new Set(a)];

/** Junta o progresso do servidor com o do aparelho: guarda sempre o maior/mais completo. */
export function mesclar(s: ProgressoSync, c: ProgressoSync): ProgressoSync {
  const abertos = uniq([...s.abertos, ...c.abertos]).slice(-500);
  const fechado = new Set(abertos);
  const porId = new Map<string, ProgressoSync['pacotes'][number]>();
  for (const p of [...s.pacotes, ...c.pacotes]) if (!fechado.has(p.id)) porId.set(p.id, p);
  const notas: Record<string, number> = { ...s.notas };
  for (const [k, v] of Object.entries(c.notas)) notas[k] = Math.max(v, notas[k] ?? 0);
  return {
    xp: Math.max(s.xp, c.xp),
    feitas: { ...s.feitas, ...c.feitas },
    notas,
    pacotes: [...porId.values()].slice(0, 50),
    abertos,
    dias: uniq([...s.dias, ...c.dias]).sort().slice(-400),
    compras: [...new Map([...(s.compras ?? []), ...(c.compras ?? [])].map((x) => [x.id, x])).values()].slice(0, 500),
  };
}

/** Limpa e limita o que chega do aparelho (o servidor nunca confia cegamente). */
export function sanitizar(x: unknown, fasesValidas: Set<string>): ProgressoSync {
  const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
  const num = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(Math.max(0, Math.floor(v)), max) : 0);
  const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  const feitas: Record<string, true> = {};
  for (const k of Object.keys(obj(o.feitas))) if (fasesValidas.has(k)) feitas[k] = true;
  const notas: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj(o.notas))) if (typeof v === 'number' && v >= 0 && v <= 10) notas[k.slice(0, 40)] = Math.round(v * 2) / 2;
  const pacotes = arr(o.pacotes)
    .filter((p): p is { id: string; tipo: 'normal' | 'epico'; capitulo: string } =>
      !!p && typeof p.id === 'string' && (p.tipo === 'normal' || p.tipo === 'epico') && typeof p.capitulo === 'string')
    .slice(0, 50).map((p) => ({ id: p.id.slice(0, 40), tipo: p.tipo, capitulo: p.capitulo.slice(0, 40) }));
  return {
    xp: num(o.xp, 10_000_000),
    feitas,
    notas,
    pacotes,
    abertos: arr(o.abertos).filter((s): s is string => typeof s === 'string').map((s) => s.slice(0, 40)).slice(-500),
    dias: arr(o.dias).filter((s): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)).slice(-400),
    compras: arr(o.compras).flatMap((x): Compra[] => {
      const k = obj(x);
      if (typeof k.id !== 'string' || typeof k.sabimon !== 'string' || !/^s\d{3}(-[123])?$/.test(k.sabimon)) return [];
      const preco = num(k.preco, 100_000);
      if (typeof k.item === 'string' && /^[a-z0-9]{1,20}$/.test(k.item)) return [{ id: k.id.slice(0, 40), sabimon: k.sabimon, item: k.item, preco }];
      if (k.forma === 2 || k.forma === 3) return [{ id: k.id.slice(0, 40), sabimon: k.sabimon, forma: k.forma, preco }];
      return [];
    }).slice(0, 500),
  };
}

/** Cartas novas vindas do aparelho: só ids conhecidos e quantidades pequenas. */
export function sanitizarDelta(x: unknown, cartasValidas: Set<string>): Record<string, number> {
  const out: Record<string, number> = {};
  if (!x || typeof x !== 'object') return out;
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
    if (cartasValidas.has(k) && typeof v === 'number' && Number.isInteger(v) && v > 0) out[k] = Math.min(v, 30);
  }
  return out;
}

/** Semana do ranking: a segunda-feira (horário de Brasília) no formato AAAA-MM-DD. */
export function semanaDe(agora = new Date()) {
  const br = new Date(agora.getTime() - 3 * 3600_000); // Brasília, sem horário de verão
  const dia = br.getUTCDay(); // 0 = domingo
  br.setUTCDate(br.getUTCDate() - ((dia + 6) % 7));
  return br.toISOString().slice(0, 10);
}

/** XP da semana depois de ganhar `ganho`: se a semana guardada já passou, começa do zero (máx. 2000 de uma vez). */
export function xpDaSemana(guardado: { semana: string; xp_semana: number }, ganho: number, semana = semanaDe()) {
  return (guardado.semana === semana ? guardado.xp_semana : 0) + Math.min(Math.max(0, ganho), 2000);
}

const PALAVRAS = ['SOL', 'LUA', 'MAR', 'RIO', 'ARARA', 'BOLA', 'PIPA', 'TATU', 'ONCA', 'BOTO', 'IPE', 'CAJU', 'MANGA', 'COCO', 'TUCANO', 'PEIXE', 'NUVEM', 'ESTRELA', 'FOGO', 'VENTO', 'PEDRA', 'FLOR', 'BAOBA', 'CARAVELA', 'MAPA', 'TREM', 'ROBO', 'FOGUETE'];

/** Código de turma fácil de ditar, ex.: ARARA-4821. */
export function gerarCodigo(rng: () => number = Math.random) {
  const p = PALAVRAS[Math.floor(rng() * PALAVRAS.length)];
  return `${p}-${String(Math.floor(rng() * 9000) + 1000)}`;
}

export const normalizarCodigo = (s: string) => s.trim().toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '');
export const normalizarApelido = (s: string) => s.trim().replace(/\s+/g, ' ').slice(0, 14);
export const pinValido = (s: unknown): s is string => typeof s === 'string' && /^\d{4}$/.test(s);
