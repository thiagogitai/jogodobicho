const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function fixTableStructure() {
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Adicionar coluna active se não existir
      db.run(`ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 1`, (err) => {
        if (err) {
          console.log('⚠️  Coluna active já existe ou erro:', err.message);
        } else {
          console.log('✅ Coluna active adicionada');
        }
      });

      // Atualizar todos os usuários para active = 1
      db.run('UPDATE users SET active = 1', function(err) {
        if (err) {
          console.error('❌ Erro ao atualizar active:', err.message);
        } else {
          console.log(`✅ ${this.changes} usuários atualizados para active = 1`);
        }
        
        db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('✅ Estrutura da tabela corrigida!');
            resolve();
          }
        });
      });
    });
  });
}

fixTableStructure().catch(console.error);