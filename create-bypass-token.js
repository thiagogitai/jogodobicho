const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

async function bypassAuthentication() {
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  
  return new Promise((resolve, reject) => {
    // Criar token especial de bypass
    const bypassToken = 'bypass-token-123456789';
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 100); // 100 anos
    
    // Obter ID do usuário admin
    db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, row) => {
      if (err) {
        console.error('❌ Erro ao buscar usuário:', err.message);
        reject(err);
        db.close();
        return;
      }
      
      if (!row) {
        console.log('❌ Usuário admin não encontrado');
        reject(new Error('Usuário não encontrado'));
        db.close();
        return;
      }
      
      const userId = row.id;
      
      // Inserir token de bypass
      db.run(
        'INSERT INTO api_tokens (user_id, name, token, expires_at, active) VALUES (?, ?, ?, ?, 1)',
        [userId, 'Bypass Token', bypassToken, expiresAt.toISOString()],
        function(err) {
          if (err) {
            console.error('❌ Erro ao criar token de bypass:', err.message);
            reject(err);
          } else {
            console.log('✅ Token de bypass criado!');
            console.log('🔐 Token:', bypassToken);
            console.log('');
            console.log('📝 Use este token nos headers:');
            console.log(`Authorization: Bearer ${bypassToken}`);
            resolve(bypassToken);
          }
          db.close();
        }
      );
    });
  });
}

bypassAuthentication().catch(console.error);