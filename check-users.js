const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkUsers() {
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  
  return new Promise((resolve, reject) => {
    db.all('SELECT id, name, email, username, role FROM users', (err, rows) => {
      if (err) {
        console.error('❌ Erro ao buscar usuários:', err.message);
        reject(err);
      } else {
        console.log('📋 Usuários encontrados:');
        rows.forEach(row => {
          console.log(`ID: ${row.id}, Nome: ${row.name}, Email: ${row.email}, Username: ${row.username}, Role: ${row.role}`);
        });
        resolve(rows);
      }
      db.close();
    });
  });
}

checkUsers().catch(console.error);