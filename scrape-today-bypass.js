const axios = require('axios');

const AUTH_TOKEN = 'bypass-token-123456789';

async function scrapeToday() {
  try {
    console.log('🚀 Iniciando scraping de hoje...');
    
    const response = await axios.post('http://localhost:3001/api/scrape', {
      lottery_types: ['PPT', 'PTM', 'PT', 'PTV', 'FED', 'COR', 'BANCA_1', 'BANCA_2', 'BANCA_3', 'BANCA_4', 'BANCA_5']
    }, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Scraping de hoje completo!');
    console.log('📊 Resultados:', response.data);
    
  } catch (error) {
    console.error('❌ Erro no scraping de hoje:', error.response?.data || error.message);
  }
}

scrapeToday();