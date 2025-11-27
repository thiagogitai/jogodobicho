const axios = require('axios');

async function testScrapingToday() {
  console.log('🔍 Testando scraping de hoje em diferentes sites...\n');
  
  const today = new Date().toISOString().substring(0, 10);
  const currentTime = new Date().toLocaleTimeString('pt-BR');
  
  console.log(`📅 Data: ${today}`);
  console.log(`⏰ Hora atual: ${currentTime}`);
  console.log('');
  
  // Testar diferentes endpoints
  const endpoints = [
    {
      name: 'Scraping Completo de Hoje',
      url: 'http://localhost:3001/api/scrape/today-all'
    },
    {
      name: 'Scraping Lite Ontem (para comparação)',
      url: 'http://localhost:3001/api/scrape/yesterday-lite'
    },
    {
      name: 'Scraping Completo Ontem (para comparação)',
      url: 'http://localhost:3001/api/scrape/yesterday-all'
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔄 Testando: ${endpoint.name}`);
      const response = await axios.post(endpoint.url);
      
      console.log(`✅ ${endpoint.name}:`);
      console.log(JSON.stringify(response.data, null, 2));
      console.log('');
      
    } catch (error) {
      console.log(`❌ Erro em ${endpoint.name}:`);
      console.log(`Status: ${error.response?.status || 'Sem resposta'}`);
      console.log(`Erro: ${error.response?.data?.error || error.message}`);
      console.log('Detalhes:', error.response?.data?.detail || 'Nenhum detalhe');
      console.log('');
    }
  }
  
  // Verificar resultados no banco
  console.log('📊 Verificando resultados no banco de dados...');
  try {
    const response = await axios.get('http://localhost:3001/web/results', {
      params: { date: today }
    });
    
    if (response.data.length === 0) {
      console.log('⚠️  NENHUM resultado encontrado para hoje no banco de dados');
    } else {
      console.log(`✅ ${response.data.length} resultados encontrados no banco:`);
      response.data.forEach(result => {
        console.log(`  - ${result.lotteryType}: ${result.results.first}-${result.results.second}-${result.results.third}-${result.results.fourth}-${result.results.fifth}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Erro ao verificar resultados no banco:', error.message);
  }
}

testScrapingToday();