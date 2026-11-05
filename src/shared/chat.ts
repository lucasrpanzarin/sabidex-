// Regras do chat da turma, usadas pelo app (para avisar antes de mandar) e pelo servidor (que decide).
// Decisão do Lucas (04/11/2026): chat escrito só no grupo da turma, sem mensagem privada,
// ligado pelo professor E autorizado pelo responsável, com pais e professor podendo ler tudo.
// Desde 05/11/2026 (Lucas): vem ligado para turma nova e filho novo; professor e responsável podem desligar.

export const MAX_TEXTO = 200;
/** No máximo 5 mensagens a cada 30 segundos. */
export const LIMITE_MENSAGENS = 5;
export const JANELA_LIMITE = 30_000;
/** As mensagens somem depois de 60 dias. */
export const GUARDAR_DIAS = 60;
/** "Estudando agora": mexeu no app nos últimos 2 minutos. */
export const ONLINE_MS = 2 * 60_000;
export const HORARIO_PADRAO = { inicio: 7, fim: 21 };

/** Hora de Brasília (sem horário de verão). */
export const horaBrasilia = (agora = Date.now()) => new Date(agora - 3 * 3600_000).getUTCHours();

/** O chat está aberto agora? `fim` é a hora em que fecha (21 = fecha às 21h). */
export const dentroDoHorario = (inicio: number, fim: number, agora = Date.now()) => {
  const h = horaBrasilia(agora);
  return inicio <= fim ? h >= inicio && h < fim : h >= inicio || h < fim;
};

/** Deixa o texto fácil de comparar: minúsculo, sem acento, sem truques (p0rr4, p.o.r.r.a). */
export function normalizar(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/0/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[4@]/g, 'a').replace(/5|\$/g, 's').replace(/7/g, 't')
    .replace(/(.)\1+/g, '$1');
}

// Palavrões e ofensas mais comuns (comparados sem acento, sem letras repetidas).
const PALAVROES = [
  'porra', 'caralho', 'cacete', 'merda', 'bosta', 'puta', 'puto', 'putaria', 'foder', 'foda', 'fodase', 'fudido', 'fdp', 'vsf', 'vtnc', 'pqp', 'krl', 'crl',
  'buceta', 'boceta', 'xoxota', 'piroca', 'pau no cu', 'cu', 'cuzao', 'arrombado', 'viado', 'sapatao', 'traveco',
  'otario', 'idiota', 'imbecil', 'retardado', 'mongoloide', 'debil', 'babaca', 'escroto', 'corno', 'vagabundo', 'vagabunda', 'piranha', 'vadia',
  'desgracado', 'desgraca', 'lixo humano', 'gordo nojento', 'safado', 'safada', 'punheta', 'siririca', 'tesao', 'sexo',
  'te odeio', 'se mata', 'vai morrer', 'cala a boca',
];
// Palavras curtas só valem sozinhas (para "cu" não pegar "cuidado").
// Ficaram de fora nomes de bichos que também são xingamento (macaco, veado, pinto): aqui se fala muito de bicho.
const SOLTAS = new Set(['cu', 'puto', 'puta', 'foda', 'krl', 'crl', 'fdp', 'vsf', 'vtnc', 'pqp', 'debil', 'corno', 'sexo']);

// Redes e jeitos de passar contato para fora do app.
const CONTATO = ['whatsapp', 'whats', 'zap', 'zapzap', 'wpp', 'instagram', 'insta', 'tiktok', 'telegram', 'discord', 'facebook', 'snapchat', 'kwai', 'youtube',
  'meu numero', 'meu telefone', 'meu celular', 'meu endereco', 'minha rua', 'onde voce mora', 'onde vc mora', 'onde tu mora', 'manda foto', 'me manda foto'];

export type Bloqueio = 'vazio' | 'grande' | 'palavrao' | 'contato' | 'link';

export const MOTIVO: Record<Bloqueio, string> = {
  vazio: 'Escreva alguma coisa.',
  grande: `Mensagem muito grande. Use até ${MAX_TEXTO} letras.`,
  palavrao: 'Essa mensagem tem palavras que não podem aqui. Escreva de outro jeito, com respeito.',
  contato: 'Aqui não pode passar telefone, endereço nem rede social. É para a sua segurança.',
  link: 'Aqui não pode mandar links nem e-mails.',
};

/** Confere a mensagem. Devolve o texto limpo, ou o motivo de não poder mandar. */
export function conferirMensagem(bruto: string): { ok: true; texto: string } | { ok: false; motivo: Bloqueio } {
  const texto = bruto.replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e\ufeff]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!texto) return { ok: false, motivo: 'vazio' };
  if (texto.length > MAX_TEXTO) return { ok: false, motivo: 'grande' };
  // Links, e-mails e @perfil
  if (/https?:|www\.|\S+@\S+\.\S+|\b[a-z0-9-]+\.(com|br|net|org|io|gg|me|app|ly|tv|xyz)\b/i.test(texto) || /(^|\s)@\w{2,}/.test(texto)) return { ok: false, motivo: 'link' };
  // Telefone: 8 números ou mais, mesmo com espaços, pontos ou traços no meio
  if ((texto.match(/\d/g) ?? []).length >= 8 && /\d[\d\s.()-]{7,}\d/.test(texto)) return { ok: false, motivo: 'contato' };
  const palavras = normalizar(texto).split(/[^a-z]+/).filter(Boolean);
  const junto = ` ${palavras.join(' ')} `;
  // Letras separadas para escapar do filtro ("p o r r a", "z.a.p"): junta tudo e confere de novo.
  const separado = palavras.filter((w) => w.length === 1).length >= 3;
  const semEspaco = palavras.join('').replace(/(.)\1+/g, '$1');
  const tem = (termo: string, prefixo: boolean) => {
    const q = normalizar(termo);
    if (junto.includes(` ${q} `) || (prefixo && q.length >= 5 && junto.includes(` ${q}`))) return true;
    return separado && !q.includes(' ') && q.length >= 3 && semEspaco.includes(q);
  };
  if (CONTATO.some((c) => tem(c, false))) return { ok: false, motivo: 'contato' };
  if (PALAVROES.some((p) => tem(p, !SOLTAS.has(p)))) return { ok: false, motivo: 'palavrao' };
  return { ok: true, texto };
}
