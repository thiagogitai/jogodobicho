const axios = require('axios');

async function checkYesterdayResultsDetailed() {
  console.log('🔍 Verificando resultados de ontem em detalhes...\n');
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().substring(0, 10);
  
  console.log(`📅 Data de ontem: ${dateStr}`);
  console.log(`⏰ Hora atual: ${new Date().toLocaleTimeString('pt-BR')}`);
  console.log('');
  
  // Verificar o que temos no banco de dados de ontem
  try {
    console.log('📊 Verificando resultados de ontem no banco...');
    const response = await axios.get('http://localhost:3001/web/results', {
      params: { date: dateStr }
    });
    
    if (response.data.length === 0) {
      console.log('⚠️  NENHUM resultado de ontem encontrado no banco');
    } else {
      console.log(`✅ ${response.data.length} resultados de ontem no banco:`);
      response.data.forEach(result => {
        console.log(`\n🏆 ${result.lotteryType}:`);
        console.log(`   📅 Data: ${result.date}`);
        console.log(`   🔢 Números: ${result.results.first}-${result.results.second}-${result.results.third}-${result.results.fourth}-${result.results.fifth}`);
        console.log(`   🌐 Fonte: ${result.source}`);
        console.log(`   ⏰ Criado em: ${result.createdAt}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Erro ao verificar resultados de ontem:', error.message);
  }
  
  // Testar scraping específico de ontem
  console.log('\n🔄 Testando scraping específico de ontem...');
  try {
    const scrapeResponse = await axios.post('http://localhost:3001/api/scrape/yesterday-all');
    
    console.log('\n✅ Resultado do scraping de ontem:');
    console.log(`- Salvos: ${scrapeResponse.data.saved} resultados`);
    console.log(`- Itens: ${scrapeResponse.data.items.length}`);
    
    if (scrapeResponse.data.items.length > 0) {
      console.log('\n📋 Resultados obtidos:');
      scrapeResponse.data.items.forEach(item => {
        console.log(`- ${item.lotteryType}: ${item.date} (${item.source})`);
      });
    }
    
  } catch (error) {
    console.log('❌ Erro no scraping de ontem:', error.message);
    if (error.response?.data) {
      console.log('Detalhes:', error.response.data);
    }
  }
  
  // Verificar logs do servidor
  console.log('\n📄 Verificando logs do servidor...');
  try {
    // Ver se há endpoint de logs
    const logsResponse = await axios.get('http://localhost:3001/api/logs/recent').catch(() => null);
    
    if (logsResponse && logsResponse.data) {
      console.log('\n📝 Últimos logs do servidor:');
      logsResponse.data.slice(-10).forEach(log => {
        console.log(`- ${log.timestamp}: ${log.message}`);
      });
    } else {
      console.log('(Endpoint de logs não disponível)');
    }
    
  } catch (error) {
    console.log('(Logs não disponíveis)');
  }
}

checkYesterdayResultsDetailed();