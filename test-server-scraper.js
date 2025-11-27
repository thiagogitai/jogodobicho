// Testar scraper real direto no servidor
const axios = require('axios');

async function testRealScraping() {
  console.log('🔍 Testando scraper real com proxy no servidor...\n');
  
  const today = new Date().toLocaleDateString('pt-BR');
  const currentTime = new Date().toLocaleTimeString('pt-BR');
  
  console.log(`📅 Data: ${today}`);
  console.log(`⏰ Hora atual: ${currentTime}`);
  console.log('');
  
  try {
    console.log('🚀 Testando endpoint de scraping real...');
    
    // Testar o endpoint que usa o scraper real
    const response = await axios.post('http://localhost:3001/api/scrape/today-all', {
      useRealScraper: true
    });
    
    console.log(`\n✅ Resultado do servidor:`);
    console.log(`- Salvos: ${response.data.saved} resultados`);
    console.log(`- Itens: ${response.data.items.length}`);
    
    // Verificar se são resultados reais ou mock
    if (response.data.items.length > 0) {
      const firstItem = response.data.items[0];
      console.log(`\n📋 Primeiro resultado:`);
      console.log(`- Tipo: ${firstItem.lotteryType}`);
      console.log(`- Data: ${firstItem.date}`);
      console.log(`- Fonte: ${firstItem.source}`);
      
      if (firstItem.source && firstItem.source.includes('Multi Fonte Scraper')) {
        console.log('\n⚠️  ATENÇÃO: Ainda está usando dados MOCK/simulados!');
        console.log('   O scraper real não está funcionando corretamente.');
      } else {
        console.log('\n✅ SUCESSO: Está usando resultados REAIS dos sites!');
      }
    }
    
  } catch (error) {
    console.log('\n❌ Erro no teste:');
    console.log(`Status: ${error.response?.status || 'Sem resposta'}`);
    console.log(`Erro: ${error.response?.data?.error || error.message}`);
    if (error.response?.data?.detail) {
      console.log(`Detalhes: ${error.response.data.detail}`);
    }
  }
  
  // Verificar logs do servidor
  console.log('\n📄 Verificando últimos logs do servidor...');
  try {
    const logsResponse = await axios.get('http://localhost:3001/api/logs/recent');
    if (logsResponse.data && logsResponse.data.length > 0) {
      console.log('\n📝 Últimos logs:');
      logsResponse.data.slice(-5).forEach(log => {
        console.log(`- ${log.timestamp}: ${log.message}`);
      });
    }
  } catch (error) {
    console.log('(Logs não disponíveis)');
  }
}

testRealScraping();