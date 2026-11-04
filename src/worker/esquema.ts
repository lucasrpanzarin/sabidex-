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
];

export const SEM_TURMA = 'familia:';
export const turmaDaFamilia = (adultoId: string) => SEM_TURMA + adultoId;
export const temTurma = (turmaId: string) => !turmaId.startsWith(SEM_TURMA);
