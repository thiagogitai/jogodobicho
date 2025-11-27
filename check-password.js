const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

async function checkPassword() {
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  
  return new Promise((resolve, reject) => {
    db.get('SELECT password_hash FROM users WHERE username = ?', ['admin'], (err, row) => {
      if (err) {
        console.error('❌ Erro ao buscar hash:', err.message);
        reject(err);
      } else if (!row) {
        console.log('❌ Usuário admin não encontrado');
        reject(new Error('Usuário não encontrado'));
      } else {
        const expectedHash = crypto.createHash('sha256').update('admin123').digest('hex');
        console.log('🔐 Hash no banco:', row.password_hash);
        console.log('🔐 Hash esperado:', expectedHash);
        console.log('✅ Hashes iguais:', row.password_hash === expectedHash);
        resolve(row.password_hash === expectedHash);
      }
      db.close();
    });
  });
}

checkPassword().catch(console.error);