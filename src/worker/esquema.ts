// Tabelas do banco D1. Criadas automaticamente na primeira requisição.

export const ESQUEMA = [
  `CREATE TABLE IF NOT EXISTS adultos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    senha_sal TEXT NOT NULL,
    falhas INTEGER NOT NULL DEFAULT 0,
    bloqueado_ate INTEGER NOT NULL DEFAULT 0,
    criado INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS turmas (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    dono_id TEXT NOT NULL,
    criado INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS criancas (
    id TEXT PRIMARY KEY,
    turma_id TEXT NOT NULL,
    apelido TEXT NOT NULL,
    apelido_chave TEXT NOT NULL,
    cor TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    pin_sal TEXT NOT NULL,
    falhas INTEGER NOT NULL DEFAULT 0,
    bloqueado_ate INTEGER NOT NULL DEFAULT 0,
    progresso TEXT NOT NULL DEFAULT '{}',
    xp_semana INTEGER NOT NULL DEFAULT 0,
    semana TEXT NOT NULL DEFAULT '',
    criado INTEGER NOT NULL,
    visto INTEGER NOT NULL DEFAULT 0,
    UNIQUE (turma_id, apelido_chave)
  )`,
  `CREATE TABLE IF NOT EXISTS cartas (
    crianca_id TEXT NOT NULL,
    carta_id TEXT NOT NULL,
    qtd INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (crianca_id, carta_id)
  )`,
  `CREATE TABLE IF NOT EXISTS trocas (
    id TEXT PRIMARY KEY,
    turma_id TEXT NOT NULL,
    de_id TEXT NOT NULL,
    para_id TEXT NOT NULL,
    carta_dar TEXT NOT NULL,
    carta_receber TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    trava TEXT,
    criado INTEGER NOT NULL,
    resolvido INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS trocas_para ON trocas (para_id, status)`,
  `CREATE INDEX IF NOT EXISTS trocas_de ON trocas (de_id, status)`,
  `CREATE INDEX IF NOT EXISTS criancas_turma ON criancas (turma_id)`,
  `CREATE TABLE IF NOT EXISTS sessoes (
    token_hash TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    ref_id TEXT NOT NULL,
    expira INTEGER NOT NULL
  )`,
  // As cartas antigas dos capítulos (ids "h-…") foram substituídas pelos Sabimons.
  // No aparelho, quem tinha cartas antigas ganha pacotes de Sabimons no lugar.
  `DELETE FROM cartas WHERE carta_id LIKE 'h-%'`,
  `UPDATE trocas SET status = 'cancelada', resolvido = unixepoch() * 1000
    WHERE status = 'pendente' AND (carta_dar LIKE 'h-%' OR carta_receber LIKE 'h-%')`,
];

/**
 * Colunas acrescentadas depois. Cada uma roda sozinha; se a coluna já existe, o erro é ignorado.
 *
 * Conta da família: a criança pode ter um adulto responsável (familia_id = id do adulto).
 * Criança da família que ainda não está numa turma fica com turma_id = 'familia:<id do adulto>'
 * (assim o apelido continua único dentro da família e nenhuma consulta de turma a encontra).
 */
export const MIGRACOES = [
  `ALTER TABLE adultos ADD COLUMN aceite INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE adultos ADD COLUMN aceite_versao TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE criancas ADD COLUMN familia_id TEXT`,
  `CREATE INDEX IF NOT EXISTS criancas_familia ON criancas (familia_id)`,
  // Adulto que entrou com Google/Apple e nunca criou senha (tem_senha = 0).
  `ALTER TABLE adultos ADD COLUMN tem_senha INTEGER NOT NULL DEFAULT 1`,
  // Links de "esqueci minha senha" (valem 1 hora e uma vez só).
  `CREATE TABLE IF NOT EXISTS recuperacoes (
    token_hash TEXT PRIMARY KEY,
    adulto_id TEXT NOT NULL,
    expira INTEGER NOT NULL,
    usado INTEGER NOT NULL DEFAULT 0,
    criado INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS recuperacoes_adulto ON recuperacoes (adulto_id, criado)`,
  // Data da prova da escola de cada capítulo. turma_id é a turma ou 'familia:<id do adulto>'.
  `CREATE TABLE IF NOT EXISTS datas_prova (
    turma_id TEXT NOT NULL,
    capitulo TEXT NOT NULL,
    data TEXT NOT NULL,
    PRIMARY KEY (turma_id, capitulo)
  )`,
  // Chat da turma (decisão do Lucas em 04/11/2026). Só grupo da turma, sem mensagem privada.
  // O professor liga para a turma (chat = 1) e escolhe o horário; o responsável autoriza cada filho (chat_ok = 1).
  // Desde 05/11/2026 (Lucas) turma nova e filho novo já vêm com o chat ligado (o servidor grava 1 ao criar);
  // professor e responsável podem desligar. Quem já existia foi ligado uma vez em AJUSTES_UMA_VEZ.
  `ALTER TABLE turmas ADD COLUMN chat INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE turmas ADD COLUMN chat_inicio INTEGER NOT NULL DEFAULT 7`,
  `ALTER TABLE turmas ADD COLUMN chat_fim INTEGER NOT NULL DEFAULT 21`,
  // "Estudando agora" na lista da turma: o professor pode desligar para a turma e o responsável para o filho.
  `ALTER TABLE turmas ADD COLUMN mostrar_online INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE criancas ADD COLUMN chat_ok INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE criancas ADD COLUMN mostrar_online INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE criancas ADD COLUMN mudo_ate INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE criancas ADD COLUMN ativo INTEGER NOT NULL DEFAULT 0`,
  // Mensagens somem depois de 60 dias. apagada = 1 quando o professor apaga (só os adultos ainda veem).
  `CREATE TABLE IF NOT EXISTS mensagens (
    id TEXT PRIMARY KEY,
    turma_id TEXT NOT NULL,
    crianca_id TEXT NOT NULL,
    texto TEXT NOT NULL,
    criado INTEGER NOT NULL,
    apagada INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS mensagens_turma ON mensagens (turma_id, criado)`,
  `CREATE INDEX IF NOT EXISTS mensagens_crianca ON mensagens (crianca_id, criado)`,
  // "Avisar um adulto" numa mensagem (vai para os administradores da turma).
  `CREATE TABLE IF NOT EXISTS avisos_chat (
    id TEXT PRIMARY KEY,
    turma_id TEXT NOT NULL,
    mensagem_id TEXT NOT NULL,
    por_id TEXT NOT NULL,
    criado INTEGER NOT NULL,
    resolvido INTEGER NOT NULL DEFAULT 0,
    UNIQUE (mensagem_id, por_id)
  )`,
  // Administradores da turma além do dono (ex.: o pai criou a turma e convidou o professor).
  // Podem quase tudo; só o dono convida e remove administradores.
  `CREATE TABLE IF NOT EXISTS turma_admins (
    turma_id TEXT NOT NULL,
    adulto_id TEXT NOT NULL,
    criado INTEGER NOT NULL,
    PRIMARY KEY (turma_id, adulto_id)
  )`,
  `CREATE INDEX IF NOT EXISTS turma_admins_adulto ON turma_admins (adulto_id)`,
  // Convite para administrar: o código fica embaralhado (hash). Vale 7 dias e uma vez só.
  `CREATE TABLE IF NOT EXISTS convites_admin (
    codigo_hash TEXT PRIMARY KEY,
    turma_id TEXT NOT NULL,
    criado INTEGER NOT NULL,
    expira INTEGER NOT NULL,
    usado INTEGER NOT NULL DEFAULT 0
  )`,
  // Duelo do Saber (Lucas, 05/11/2026): dois colegas da turma respondem as mesmas 10 perguntas.
  // Ninguém perde carta: carta_de/carta_para são só as parceiras na batalha.
  // status: 'novo' (só quem desafiou jogou ou vai jogar), 'esperando' (vez do colega), 'feito', 'recusado', 'cancelado', 'expirado'.
  `CREATE TABLE IF NOT EXISTS duelos (
    id TEXT PRIMARY KEY,
    turma_id TEXT NOT NULL,
    de_id TEXT NOT NULL,
    para_id TEXT NOT NULL,
    perguntas TEXT NOT NULL,
    carta_de TEXT NOT NULL,
    carta_para TEXT,
    resp_de TEXT,
    resp_para TEXT,
    acertos_de INTEGER,
    acertos_para INTEGER,
    jogou_de INTEGER,
    jogou_para INTEGER,
    status TEXT NOT NULL DEFAULT 'novo',
    vencedor TEXT,
    criado INTEGER NOT NULL,
    resolvido INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS duelos_de ON duelos (de_id, status)`,
  `CREATE INDEX IF NOT EXISTS duelos_para ON duelos (para_id, status)`,
  `CREATE INDEX IF NOT EXISTS duelos_turma ON duelos (turma_id, status, resolvido)`,
  // Código da família (Lucas, 05/11/2026): a criança entra sozinha no aparelho dela com esse código,
  // toca no próprio nome e digita o PIN. Mesmo formato do código da turma (ex.: ARARA-4821) e nunca igual a um.
  `ALTER TABLE adultos ADD COLUMN codigo_familia TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS adultos_codigo_familia ON adultos (codigo_familia)`,
  // Pacotes abertos pelo servidor (Lucas, 05/11/2026): quem sorteia a carta é o servidor.
  // sem_novo = garantia; pacotes_dia/pacotes_hoje = limite por dia; epicos = épicos já abertos;
  // ultimo_pacote = o último aberto (se a internet cair no meio, a criança recebe a mesma carta de novo).
  `ALTER TABLE criancas ADD COLUMN sem_novo INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE criancas ADD COLUMN pacotes_dia TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE criancas ADD COLUMN pacotes_hoje INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE criancas ADD COLUMN epicos INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE criancas ADD COLUMN ultimo_pacote TEXT NOT NULL DEFAULT ''`,
  // Códigos errados por internet (IP): muitos erros seguidos bloqueiam por um tempo.
  `CREATE TABLE IF NOT EXISTS tentativas (
    chave TEXT PRIMARY KEY,
    n INTEGER NOT NULL,
    inicio INTEGER NOT NULL
  )`,
  // Busca de turmas e pedidos para entrar (Lucas, 05/11/2026). Só adultos buscam.
  // escola = nome da escola; na_busca = 0 quando um administrador esconde a turma da busca;
  // busca = nome + escola sem acentos (preenchido pelo servidor).
  `ALTER TABLE turmas ADD COLUMN escola TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE turmas ADD COLUMN na_busca INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE turmas ADD COLUMN busca TEXT NOT NULL DEFAULT ''`,
  // tipo 'crianca': o responsável pede para o filho (crianca_id) entrar na turma.
  // tipo 'juntar': o dono da turma origem_id pede para levar todas as crianças para a turma.
  // status: 'pendente', 'aceito', 'recusado', 'cancelado'.
  `CREATE TABLE IF NOT EXISTS pedidos_turma (
    id TEXT PRIMARY KEY,
    turma_id TEXT NOT NULL,
    tipo TEXT NOT NULL,
    adulto_id TEXT NOT NULL,
    crianca_id TEXT,
    origem_id TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    criado INTEGER NOT NULL,
    resolvido INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS pedidos_turma_destino ON pedidos_turma (turma_id, status)`,
  `CREATE INDEX IF NOT EXISTS pedidos_turma_adulto ON pedidos_turma (adulto_id, status)`,
  // Ajustes que mudam dados e só podem rodar UMA vez (cada um fica anotado aqui depois de rodar).
  `CREATE TABLE IF NOT EXISTS ajustes_feitos (nome TEXT PRIMARY KEY, feito INTEGER NOT NULL)`,
];

/**
 * Ajustes de dados que rodam uma vez só, na ordem, numa transação cada. Se um já está em `ajustes_feitos`, não roda mais
 * (assim não desfaz o que os adultos mudarem depois).
 */
export const AJUSTES_UMA_VEZ: { nome: string; sql: string[] }[] = [
  // Chat ligado para quem já existia (Lucas, 05/11/2026). Só filhos com conta da família (os outros não escrevem).
  { nome: 'chat-ligado-para-todos-2026-11-05', sql: [
    `UPDATE turmas SET chat = 1`,
    `UPDATE criancas SET chat_ok = 1 WHERE familia_id IS NOT NULL`,
  ] },
];

/** Muda sozinha quando uma tabela ou migração nova entra (o servidor só confere tudo de novo quando ela muda). */
export const VERSAO_ESQUEMA = (() => {
  let h = 5381;
  for (const ch of [...ESQUEMA, ...MIGRACOES].join('\n')) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return h.toString(36);
})();

export const SEM_TURMA = 'familia:';
export const turmaDaFamilia = (adultoId: string) => SEM_TURMA + adultoId;
export const temTurma = (turmaId: string) => !turmaId.startsWith(SEM_TURMA);
