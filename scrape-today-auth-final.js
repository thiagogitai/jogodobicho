const axios = require('axios');

const AUTH_TOKEN = '537c2a268b8ae793dfb7e6ba30cb8aebf400877ec3ce1a1daa25cec8bb270be0';

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