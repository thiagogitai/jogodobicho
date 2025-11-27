const axios = require('axios');

async function scrapeTodayNoAuth() {
  try {
    console.log('🚀 Iniciando scraping de hoje (sem autenticação)...');
    
    // Usar endpoint de teste que não requer autenticação
    const response = await axios.post('http://localhost:3001/api/scrape/yesterday-all', {});
    
    console.log('✅ Scraping completo!');
    console.log('📊 Resultados:', response.data);
    
  } catch (error) {
    console.error('❌ Erro no scraping:', error.response?.data || error.message);
  }
}

scrapeTodayNoAuth();