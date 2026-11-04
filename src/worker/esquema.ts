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
];
