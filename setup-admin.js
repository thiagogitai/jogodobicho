const axios = require('axios');

async function setupAdmin() {
  try {
    console.log('🚀 Criando usuário admin...');
    
    // Criar usuário admin
    const registerResponse = await axios.post('http://localhost:3000/api/auth/register', {
      username: 'admin',
      email: 'admin@jogodobicho.com',
      password: 'admin123',
      role: 'admin'
    });

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('📧 Email:', 'admin@jogodobicho.com');
    console.log('🔑 Senha:', 'admin123');

    // Fazer login para obter token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@jogodobicho.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('🔐 Token de autenticação:', token);
    console.log('');
    console.log('📝 Use este token para autenticar as requisições:');
    console.log(`Authorization: Bearer ${token}`);
    
    // Testar o token
    console.log('');
    console.log('🧪 Testando token...');
    const testResponse = await axios.get('http://localhost:3000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Token válido! Usuário autenticado:', testResponse.data.user.username);
    
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('⚠️  Usuário admin já existe. Tentando fazer login...');
      
      try {
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
          email: 'admin@jogodobicho.com',
          password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('🔐 Token de autenticação:', token);
        console.log('');
        console.log('📝 Use este token para autenticar as requisições:');
        console.log(`Authorization: Bearer ${token}`);
      } catch (loginError) {
        console.error('❌ Erro ao fazer login:', loginError.response?.data || loginError.message);
      }
    } else {
      console.error('❌ Erro ao criar usuário admin:', error.response?.data || error.message);
    }
  }
}

setupAdmin();