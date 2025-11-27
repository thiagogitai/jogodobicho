const axios = require('axios');

async function checkYesterdayResults() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().substring(0, 10);
    console.log(`📅 Verificando resultados de ontem (${dateStr})...`);
    
    const response = await axios.get('http://localhost:3001/web/results', {
      params: { date: dateStr }
    });
    
    console.log(`✅ Encontrados ${response.data.length} resultados para ontem:`);
    response.data.forEach(result => {
      console.log(`- ${result.lotteryType}: ${JSON.stringify(result.results)}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar resultados:', error.response?.data || error.message);
  }
}

checkYesterdayResults();