const axios = require('axios');

async function testScrapingTodayFixed() {
  console.log('🔍 Testando scraping de hoje com correção de data...\n');
  
  const today = new Date().toISOString().substring(0, 10);
  const currentTime = new Date().toLocaleTimeString('pt-BR');
  
  console.log(`📅 Data: ${today}`);
  console.log(`⏰ Hora atual: ${currentTime}`);
  console.log('');
  
  // Testar scraping de hoje
  try {
    console.log('🔄 Testando: Scraping Completo de Hoje (com data corrigida)');
    const response = await axios.post('http://localhost:3001/api/scrape/today-all');
    
    console.log(`✅ Resultado:`);
    console.log(`- Salvos: ${response.data.saved} resultados`);
    console.log(`- Itens: ${response.data.items.length}`);
    
    // Verificar as datas dos resultados
    response.data.items.forEach(item => {
      console.log(`  - ${item.lotteryType}: ${item.date} (${item.source})`);
    });
    
    console.log('');
    
  } catch (error) {
    console.log(`❌ Erro no scraping:`);
    console.log(`Status: ${error.response?.status || 'Sem resposta'}`);
    console.log(`Erro: ${error.response?.data?.error || error.message}`);
    console.log('');
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
      console.log(`✅ ${response.data.length} resultados encontrados no banco para hoje:`);
      response.data.forEach(result => {
        console.log(`  - ${result.lotteryType}: ${result.results.first}-${result.results.second}-${result.results.third}-${result.results.fourth}-${result.results.fifth}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Erro ao verificar resultados no banco:', error.message);
  }
}

testScrapingTodayFixed();