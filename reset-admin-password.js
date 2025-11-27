const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

async function resetAdminPassword() {
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  
  return new Promise((resolve, reject) => {
    // Atualizar senha do admin
    const passwordHash = crypto.createHash('sha256').update('admin123').digest('hex');
    
    db.run(
      'UPDATE users SET password_hash = ? WHERE username = ?',
      [passwordHash, 'admin'],
      function(err) {
        if (err) {
          console.error('❌ Erro ao atualizar senha:', err.message);
          reject(err);
        } else {
          console.log('✅ Senha do admin atualizada para: admin123');
          console.log('✅ Hash da senha:', passwordHash);
          resolve();
        }
        db.close();
      }
    );
  });
}

resetAdminPassword().catch(console.error);