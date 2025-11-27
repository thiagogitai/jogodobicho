const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

async function fixUserStatus() {
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  
  return new Promise((resolve, reject) => {
    // Atualizar status do usuário para active = 1
    db.run(
      'UPDATE users SET active = 1 WHERE username = ?',
      ['admin'],
      function(err) {
        if (err) {
          console.error('❌ Erro ao atualizar status:', err.message);
          reject(err);
        } else {
          console.log('✅ Status do usuário atualizado para active = 1');
          resolve();
        }
        db.close();
      }
    );
  });
}

fixUserStatus().catch(console.error);