const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

async function setupComplete() {
  const dbPath = path.join(__dirname, 'database.sqlite');
  
  console.log('🚀 Criando banco de dados e usuário admin...');
  
  // Conectar ao banco de dados
  const db = new sqlite3.Database(dbPath);
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Criar tabela de usuários
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Criar tabela de tokens
      db.run(`CREATE TABLE IF NOT EXISTS api_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        last_used_at DATETIME,
        usage_count INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`);

      // Criar índices
      db.run(`CREATE INDEX IF NOT EXISTS idx_api_tokens_token ON api_tokens(token)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id)`);

      // Inserir usuário admin
      const passwordHash = crypto.createHash('sha256').update('admin123').digest('hex');
      
      db.run(
        `INSERT OR IGNORE INTO users (name, email, username, password_hash, role, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['Administrador', 'admin@jogodobicho.com', 'admin', passwordHash, 'admin', 'active'],
        function(err) {
          if (err) {
            console.log('⚠️  Usuário admin já existe ou erro:', err.message);
          } else {
            console.log('✅ Usuário admin criado com sucesso!');
          }
          
          // Criar token para o admin
          const token = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 365); // 1 ano
          
          db.run(
            `INSERT INTO api_tokens (user_id, name, token, expires_at, active) 
             VALUES ((SELECT id FROM users WHERE username = ?), ?, ?, ?, 1)`,
            ['admin', 'Token Admin', token, expiresAt.toISOString()],
            function(err) {
              if (err) {
                console.log('❌ Erro ao criar token:', err.message);
              } else {
                console.log('✅ Token criado com sucesso!');
                console.log('');
                console.log('🔐 Token de autenticação:');
                console.log(token);
                console.log('');
                console.log('📝 Use este token nos headers:');
                console.log(`Authorization: Bearer ${token}`);
                console.log('');
                console.log('📧 Login: admin@jogodobicho.com');
                console.log('🔑 Senha: admin123');
              }
              
              db.close((err) => {
                if (err) {
                  reject(err);
                } else {
                  console.log('✅ Setup completo!');
                  resolve();
                }
              });
            }
          );
        }
      );
    });
  });
}

setupComplete().catch(console.error);