const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

async function createTokenNoExpiry() {
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  
  return new Promise((resolve, reject) => {
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
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 10); // 10 anos - praticamente sem expiração
      
      // Limpar tokens antigos
      db.run('DELETE FROM api_tokens WHERE user_id = ?', [userId], (err) => {
        if (err) {
          console.log('⚠️  Erro ao limpar tokens antigos:', err.message);
        }
      });
      
      // Inserir token manualmente
      db.run(
        'INSERT INTO api_tokens (user_id, name, token, expires_at, active) VALUES (?, ?, ?, ?, 1)',
        [userId, 'Token Sem Expiração', token, expiresAt.toISOString()],
        function(err) {
          if (err) {
            console.error('❌ Erro ao criar token:', err.message);
            reject(err);
          } else {
            console.log('✅ Token criado (expira em 10 anos)!');
            console.log('🔐 Token:', token);
            console.log('');
            console.log('📝 Use este token nos headers:');
            console.log(`Authorization: Bearer ${token}`);
            resolve(token);
          }
          db.close();
        }
      );
    });
  });
}

createTokenNoExpiry().catch(console.error);