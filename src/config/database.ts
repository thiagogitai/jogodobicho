import { Database } from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export class DatabaseManager {
  private db: Database;
  public run: (sql: string, params?: any[]) => Promise<void>;
  public get: (sql: string, params?: any[]) => Promise<any>;
  public all: (sql: string, params?: any[]) => Promise<any[]>;

  constructor() {
    const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
    
    // Cria diretório data se não existir
    const fs = require('fs');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    
    // Promisify methods
    this.run = promisify(this.db.run.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));

    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      logger.info('Inicializando banco de dados SQLite...');
      
      // Cria tabelas
      await this.createTables();
      
      // Insere dados iniciais
      await this.insertInitialData();
      
      logger.info('✅ Banco de dados inicializado com sucesso');
    } catch (error) {
      logger.error('Erro ao inicializar banco de dados:', error);
      throw error;
    }
  }

  private async createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS lottery_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lottery_type TEXT NOT NULL,
        date TEXT NOT NULL,
        results TEXT NOT NULL,
        prizes TEXT,
        source TEXT NOT NULL,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(lottery_type, date)
      )`,
      
      `CREATE TABLE IF NOT EXISTS message_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        variables TEXT NOT NULL,
        lottery_types TEXT NOT NULL,
        enabled BOOLEAN DEFAULT true,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS group_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'telegram')),
        group_id TEXT NOT NULL,
        instance_name TEXT,
        enabled BOOLEAN DEFAULT true,
        lottery_types TEXT NOT NULL,
        template_id INTEGER,
        schedule TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES message_templates(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS scrape_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lottery_type TEXT NOT NULL UNIQUE,
        url TEXT NOT NULL,
        enabled BOOLEAN DEFAULT true,
        selectors TEXT NOT NULL,
        headers TEXT,
        proxy_enabled BOOLEAN DEFAULT false,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
        message TEXT NOT NULL,
        context TEXT,
        source TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cron_expression TEXT NOT NULL,
        enabled BOOLEAN DEFAULT true,
        lottery_types TEXT NOT NULL,
        groups TEXT NOT NULL,
        last_run DATETIME,
        next_run DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
        active BOOLEAN DEFAULT true,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS api_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        active BOOLEAN DEFAULT true,
        expires_at DATETIME NOT NULL,
        last_used_at DATETIME,
        usage_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS send_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        lottery_result_id INTEGER NOT NULL,
        message_content TEXT NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES group_configs(id),
        FOREIGN KEY (lottery_result_id) REFERENCES lottery_results(id)
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Cria índices
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_lottery_results_date ON lottery_results(date)',
      'CREATE INDEX IF NOT EXISTS idx_lottery_results_type ON lottery_results(lottery_type)',
      'CREATE INDEX IF NOT EXISTS idx_lottery_results_status ON lottery_results(status)',
      'CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level)',
      'CREATE INDEX IF NOT EXISTS idx_system_logs_source ON system_logs(source)',
      'CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_send_history_group ON send_history(group_id)',
      'CREATE INDEX IF NOT EXISTS idx_send_history_result ON send_history(lottery_result_id)',
      'CREATE INDEX IF NOT EXISTS idx_api_tokens_token ON api_tokens(token)',
      'CREATE INDEX IF NOT EXISTS idx_api_tokens_user ON api_tokens(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_api_tokens_expires ON api_tokens(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)',
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_send_history_sent_at ON send_history(sent_at)'
    ];

    for (const index of indexes) {
      await this.run(index);
    }
  }

  private async insertInitialData() {
    // Verifica se já existem dados
    const count = await this.get('SELECT COUNT(*) as count FROM scrape_configs');
    if (count.count > 0) {
      logger.info('Dados iniciais já existem, pulando inserção');
      return;
    }

    // Configurações de scrape padrão
    const scrapeConfigs = [
      { lottery_type: 'FEDERAL', url: 'https://www.jogodobicho.net/federal', selectors: JSON.stringify({ results: '.result-federal .numbers' }), enabled: true },
      { lottery_type: 'RIO_DE_JANEIRO', url: 'https://www.jogodobicho.net/rio-de-janeiro', selectors: JSON.stringify({ results: '.result-rio .numbers' }), enabled: true },
      { lottery_type: 'LOOK_GO', url: 'https://www.jogodobicho.net/goias', selectors: JSON.stringify({ results: '.result-go .numbers' }), enabled: true },
      { lottery_type: 'PT_SP', url: 'https://www.jogodobicho.net/sao-paulo', selectors: JSON.stringify({ results: '.result-sp .numbers' }), enabled: true },
      { lottery_type: 'NACIONAL', url: 'https://www.jogodobicho.net/nacional', selectors: JSON.stringify({ results: '.result-nacional .numbers' }), enabled: true },
      { lottery_type: 'MALUQUINHA_RJ', url: 'https://www.jogodobicho.net/maluquinha', selectors: JSON.stringify({ results: '.result-maluquinha .numbers' }), enabled: true },
      { lottery_type: 'LOTEP', url: 'https://www.loterias.caixa.gov.br/Paginas/LOTEP.aspx', selectors: JSON.stringify({ results: '.result-lotep .numbers' }), enabled: true },
      { lottery_type: 'LOTECE', url: 'https://www.loterias.caixa.gov.br/Paginas/LOTECE.aspx', selectors: JSON.stringify({ results: '.result-lotece .numbers' }), enabled: true },
      { lottery_type: 'MINAS_GERAIS', url: 'https://www.jogodobicho.net/minas-gerais', selectors: JSON.stringify({ results: '.result-mg .numbers' }), enabled: true },
      { lottery_type: 'BOA_SORTE', url: 'https://www.jogodobicho.net/boa-sorte', selectors: JSON.stringify({ results: '.result-boa-sorte .numbers' }), enabled: true },
      { lottery_type: 'LOTERIAS_CAIXA', url: 'https://loterias.caixa.gov.br', selectors: JSON.stringify({ results: '.result-loterias .numbers' }), enabled: true }
    ];

    for (const config of scrapeConfigs) {
      await this.run(
        'INSERT INTO scrape_configs (lottery_type, url, selectors, enabled) VALUES (?, ?, ?, ?)',
        [config.lottery_type, config.url, config.selectors, config.enabled]
      );
    }

    // Criar usuário administrador padrão
    const adminPassword = crypto.createHash('sha256').update('admin123').digest('hex');
    await this.run(
      'INSERT OR IGNORE INTO users (username, email, password_hash, role, active) VALUES (?, ?, ?, ?, ?)',
      ['admin', 'admin@jogodobicho.com', adminPassword, 'admin', true]
    );

    // Templates de mensagem padrão
    const templates = [
      {
        name: 'Padrão Completo',
        content: '🎯 RESULTADO {lottery_name} - {date}\n\n1º Prêmio: {first}\n2º Prêmio: {second}\n3º Prêmio: {third}\n4º Prêmio: {fourth}\n5º Prêmio: {fifth}\n\n📊 Fonte: {source}',
        variables: JSON.stringify(['lottery_name', 'date', 'first', 'second', 'third', 'fourth', 'fifth', 'source']),
        lottery_types: JSON.stringify(['FEDERAL', 'RIO_DE_JANEIRO', 'LOOK_GO', 'PT_SP', 'NACIONAL', 'MALUQUINHA_RJ', 'LOTEP', 'LOTECE', 'MINAS_GERAIS', 'BOA_SORTE', 'LOTERIAS_CAIXA']),
        enabled: true
      },
      {
        name: 'Resumo Rápido',
        content: '🎯 {lottery_name}: {first} - {second} - {third} - {fourth} - {fifth}',
        variables: JSON.stringify(['lottery_name', 'first', 'second', 'third', 'fourth', 'fifth']),
        lottery_types: JSON.stringify(['FEDERAL', 'RIO_DE_JANEIRO', 'LOOK_GO', 'PT_SP', 'NACIONAL', 'MALUQUINHA_RJ', 'LOTEP', 'LOTECE', 'MINAS_GERAIS', 'BOA_SORTE', 'LOTERIAS_CAIXA']),
        enabled: true
      },
      {
        name: 'Apenas 1º Prêmio',
        content: '🎯 {lottery_name} - 1º: {first}',
        variables: JSON.stringify(['lottery_name', 'first']),
        lottery_types: JSON.stringify(['FEDERAL', 'RIO_DE_JANEIRO', 'LOOK_GO', 'PT_SP', 'NACIONAL', 'MALUQUINHA_RJ', 'LOTEP', 'LOTECE', 'MINAS_GERAIS', 'BOA_SORTE', 'LOTERIAS_CAIXA']),
        enabled: true
      }
    ];

    for (const template of templates) {
      await this.run(
        'INSERT INTO message_templates (name, content, variables, lottery_types, enabled) VALUES (?, ?, ?, ?, ?)',
        [template.name, template.content, template.variables, template.lottery_types, template.enabled]
      );
    }

    logger.info('✅ Dados iniciais inseridos com sucesso');
  }

  // Métodos utilitários
  static getInstance(): DatabaseManager {
    if (!databaseManager) {
      databaseManager = new DatabaseManager();
    }
    return databaseManager;
  }

  async close() {
    return new Promise<void>((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  getDb() {
    return this.db;
  }
}

// Singleton instance
let databaseManager: DatabaseManager | null = null;

export const getDatabase = (): DatabaseManager => {
  if (!databaseManager) {
    databaseManager = new DatabaseManager();
  }
  return databaseManager;
};

export default getDatabase;