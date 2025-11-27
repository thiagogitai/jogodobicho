const axios = require('axios');

async function getValidToken() {
  try {
    console.log('🧪 Testando login com username: admin, password: admin123...');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    const token = response.data.token;
    console.log('✅ Login bem-sucedido!');
    console.log('🔐 Token:', token);
    console.log('');
    console.log('📝 Use este token nos headers:');
    console.log(`Authorization: Bearer ${token}`);
    
    // Testar o token
    console.log('');
    console.log('🧪 Testando token em endpoint protegido...');
    const testResponse = await axios.get('http://localhost:3001/api/status', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Token válido! Status do sistema:', testResponse.data.status);
    return token;
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    return null;
  }
}

getValidToken().then(token => {
  if (token) {
    // Salvar token em arquivo para uso posterior
    const fs = require('fs');
    fs.writeFileSync('auth-token.txt', token);
    console.log('💾 Token salvo em auth-token.txt');
  }
});