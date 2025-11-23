import { DatabaseManager } from '../config/database';
import crypto from 'crypto';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

async function createUser() {
  const db = DatabaseManager.getInstance();
  
  console.log('=== CRIAR NOVO USUÁRIO ===');
  const username = await question('Username: ');
  const email = await question('Email: ');
  const password = await question('Password: ');
  const role = await question('Role (admin/user/viewer) [user]: ') || 'user';
  
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  
  try {
    const result = await db.run(
      'INSERT INTO users (username, email, password_hash, role, active) VALUES (?, ?, ?, ?, ?)',
      [username, email, passwordHash, role, true]
    );
    
    console.log(`✅ Usuário criado com ID: ${result.lastID}`);
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  }
}

async function createToken() {
  const db = DatabaseManager.getInstance();
  
  // Listar usuários
  const users = await db.all('SELECT id, username, email, role FROM users WHERE active = 1');
  
  if (users.length === 0) {
    console.log('❌ Nenhum usuário ativo encontrado. Crie um usuário primeiro.');
    return;
  }
  
  console.log('\n=== USUÁRIOS DISPONÍVEIS ===');
  users.forEach(user => {
    console.log(`${user.id}: ${user.username} (${user.email}) - ${user.role}`);
  });
  
  const userId = await question('\nID do usuário: ');
  const tokenName = await question('Nome do token: ');
  const expiresInDays = parseInt(await question('Dias até expirar [365]: ') || '365');
  
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  
  try {
    const result = await db.run(
      'INSERT INTO api_tokens (user_id, name, token, expires_at, active) VALUES (?, ?, ?, ?, ?)',
      [userId, tokenName, token, expiresAt.toISOString(), true]
    );
    
    console.log(`\n🎉 TOKEN CRIADO COM SUCESSO!`);
    console.log(`ID: ${result.lastID}`);
    console.log(`Token: ${token}`);
    console.log(`Nome: ${tokenName}`);
    console.log(`Expira em: ${expiresAt.toISOString()}`);
    console.log(`\n⚠️  GUARDE ESTE TOKEN EM LOCAL SEGURO! ELE NÃO SERÁ MOSTRADO NOVAMENTE.`);
  } catch (error) {
    console.error('❌ Erro ao criar token:', error);
  }
}

async function listTokens() {
  const db = DatabaseManager.getInstance();
  
  const tokens = await db.all(`
    SELECT t.id, t.name, t.token, t.created_at, t.expires_at, t.last_used_at, t.usage_count, t.active,
           u.username, u.email
    FROM api_tokens t
    JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
  `);
  
  console.log('\n=== TOKENS DE API ===');
  tokens.forEach(token => {
    const isExpired = new Date(token.expires_at) < new Date();
    const status = token.active && !isExpired ? '✅ Ativo' : '❌ Inativo';
    
    console.log(`\n${token.name} (${status})`);
    console.log(`  ID: ${token.id}`);
    console.log(`  Usuário: ${token.username} (${token.email})`);
    console.log(`  Token: ${token.token.substring(0, 8)}...${token.token.substring(56)}`);
    console.log(`  Criado: ${token.created_at}`);
    console.log(`  Expira: ${token.expires_at}`);
    console.log(`  Último uso: ${token.last_used_at || 'Nunca'}`);
    console.log(`  Usos: ${token.usage_count}`);
  });
}

async function revokeToken() {
  const db = DatabaseManager.getInstance();
  
  const tokenId = await question('ID do token para revogar: ');
  
  try {
    await db.run('UPDATE api_tokens SET active = 0 WHERE id = ?', [tokenId]);
    console.log('✅ Token revogado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao revogar token:', error);
  }
}

async function testAPI() {
  const token = await question('Token de API para testar: ');
  
  try {
    const response = await fetch('http://localhost:3000/api/results?limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API funcionando!');
      console.log('Resultados:', data);
    } else {
      console.log('❌ Erro na API:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
}

async function main() {
  console.log('=== GERENCIADOR DE API - JOGO DO BICHO ===\n');
  
  while (true) {
    console.log('\nOpções:');
    console.log('1. Criar usuário');
    console.log('2. Criar token de API');
    console.log('3. Listar tokens');
    console.log('4. Revogar token');
    console.log('5. Testar API');
    console.log('6. Sair');
    
    const choice = await question('\nEscolha uma opção: ');
    
    switch (choice) {
      case '1':
        await createUser();
        break;
      case '2':
        await createToken();
        break;
      case '3':
        await listTokens();
        break;
      case '4':
        await revokeToken();
        break;
      case '5':
        await testAPI();
        break;
      case '6':
        console.log('👋 Até logo!');
        rl.close();
        return;
      default:
        console.log('❌ Opção inválida!');
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { createUser, createToken, listTokens, revokeToken };