const axios = require('axios');

async function checkTodayResults() {
  try {
    const today = new Date().toISOString().substring(0, 10);
    console.log(`📅 Verificando resultados de hoje (${today})...`);
    
    const response = await axios.get('http://localhost:3001/web/results', {
      params: { date: today }
    });
    
    console.log(`✅ Encontrados ${response.data.length} resultados para hoje:`);
    response.data.forEach(result => {
      console.log(`- ${result.lotteryType}: ${JSON.stringify(result.results)}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar resultados:', error.response?.data || error.message);
  }
}

checkTodayResults();