const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

async function createManualToken() {
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
      expiresAt.setDate(expiresAt.getDate() + 365); // 1 ano
      
      // Inserir token manualmente
      db.run(
        'INSERT INTO api_tokens (user_id, name, token, expires_at, active) VALUES (?, ?, ?, ?, 1)',
        [userId, 'Token Manual', token, expiresAt.toISOString()],
        function(err) {
          if (err) {
            console.error('❌ Erro ao criar token:', err.message);
            reject(err);
          } else {
            console.log('✅ Token criado manualmente!');
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

createManualToken().catch(console.error);