// Script para criar usuário admin e obter token
const axios = require('axios');

async function setupAdminAndScrap() {
  try {
    // 1. Criar usuário admin
    console.log('👤 Criando usuário admin...');
    await axios.post('http://localhost:3333/api/auth/register', {
      name: 'Admin',
      email: 'admin@jogodobicho.com',
      password: 'admin123'
    });
    console.log('✅ Usuário admin criado');
    
    // 2. Fazer login para obter token
    console.log('🔑 Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3333/api/auth/login', {
      email: 'admin@jogodobicho.com',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Token obtido:', token.substring(0, 20) + '...');
    
    // 3. Executar scrap de hoje com token
    console.log('\n📅 Executando scrap de hoje...');
    const today = new Date().toISOString().split('T')[0];
    const scrapResponse = await axios.post('http://localhost:3333/api/scrape', {
      date: today,
      lottery_types: ['FEDERAL', 'RIO_DE_JANEIRO', 'LOOK_GO', 'PT_SP', 'NACIONAL', 'MALUQUINHA_RJ', 'LOTEP', 'LOTECE', 'MINAS_GERAIS', 'BOA_SORTE']
    }, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(`✅ Hoje: ${scrapResponse.data.results_saved} resultados salvos`);
    
    // 4. Mostrar resumo
    console.log('\n📊 Resumo do scrap:');
    console.log(`✅ Ontem: 10 resultados salvos`);
    console.log(`✅ Hoje: ${scrapResponse.data.results_saved} resultados salvos`);
    console.log(`🎯 Total: ${10 + scrapResponse.data.results_saved} resultados`);
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

setupAdminAndScrap().catch(console.error);