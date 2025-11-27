const axios = require('axios');

async function getToken() {
  try {
    console.log('🧪 Testando diferentes formatos de login...');
    
    // Testar formato 1: username/password
    try {
      const response1 = await axios.post('http://localhost:3001/api/auth/login', {
        username: 'admin',
        password: 'admin123'
      });
      console.log('✅ Login formato 1 funcionou!');
      console.log('🔐 Token:', response1.data.token);
      return response1.data.token;
    } catch (e) {
      console.log('❌ Formato 1 falhou:', e.response?.data || e.message);
    }
    
    // Testar formato 2: email/password
    try {
      const response2 = await axios.post('http://localhost:3001/api/auth/login', {
        email: 'admin@jogodobicho.com',
        password: 'admin123'
      });
      console.log('✅ Login formato 2 funcionou!');
      console.log('🔐 Token:', response2.data.token);
      return response2.data.token;
    } catch (e) {
      console.log('❌ Formato 2 falhou:', e.response?.data || e.message);
    }
    
    // Testar formato 3: name/password
    try {
      const response3 = await axios.post('http://localhost:3001/api/auth/login', {
        name: 'Administrador',
        password: 'admin123'
      });
      console.log('✅ Login formato 3 funcionou!');
      console.log('🔐 Token:', response3.data.token);
      return response3.data.token;
    } catch (e) {
      console.log('❌ Formato 3 falhou:', e.response?.data || e.message);
    }
    
    console.log('❌ Nenhum formato de login funcionou');
    return null;
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    return null;
  }
}

getToken().then(token => {
  if (token) {
    console.log('');
    console.log('📝 Use este token:');
    console.log(`Authorization: Bearer ${token}`);
  }
});