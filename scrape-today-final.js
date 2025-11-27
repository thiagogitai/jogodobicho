const axios = require('axios');

async function scrapeToday() {
  try {
    console.log('🚀 Iniciando scraping de hoje...');
    
    const response = await axios.post('http://localhost:3001/api/scrape/today-all', {});
    
    console.log('✅ Scraping de hoje completo!');
    console.log('📊 Resultados:', response.data);
    
  } catch (error) {
    console.error('❌ Erro no scraping de hoje:', error.response?.data || error.message);
  }
}

scrapeToday();