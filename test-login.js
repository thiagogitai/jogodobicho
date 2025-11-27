const axios = require('axios');

async function testLogin() {
  try {
    console.log('🧪 Testando login com credenciais simples...');
    
    // Testar login básico
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login bem-sucedido!');
    console.log('🔐 Token:', token);
    console.log('');
    console.log('📝 Para usar nos headers:');
    console.log(`Authorization: Bearer ${token}`);
    
  } catch (error) {
    console.log('❌ Login falhou:', error.response?.data || error.message);
    console.log('');
    console.log('🔄 Tentando criar usuário primeiro...');
    
    try {
      // Criar usuário
      const registerResponse = await axios.post('http://localhost:3001/api/auth/register', {
        name: 'Admin User',
        email: 'admin@jogodobicho.com',
        password: 'admin123'
      });
      
      console.log('✅ Usuário criado:', registerResponse.data);
      
      // Agora fazer login
      const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
        username: 'admin@jogodobicho.com',
        password: 'admin123'
      });
      
      const token = loginResponse.data.token;
      console.log('✅ Login bem-sucedido!');
      console.log('🔐 Token:', token);
      
    } catch (registerError) {
      console.error('❌ Erro ao criar usuário:', registerError.response?.data || registerError.message);
    }
  }
}

testLogin();