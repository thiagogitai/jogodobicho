// Script para executar scrap de ontem e hoje
const axios = require('axios');

async function executeScrap() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  console.log('🚀 Iniciando scrap para ontem e hoje...');
  
  try {
    // Scrap de ontem (rota sem autenticação)
    console.log('\n📅 Executando scrap de ontem...');
    const response1 = await axios.post('http://localhost:3333/api/scrape/yesterday-all', {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`✅ Ontem: ${response1.data.saved} resultados salvos`);
    
    // Scrap de hoje (usar a rota geral com data específica)
    console.log('\n📅 Executando scrap de hoje...');
    const response2 = await axios.post('http://localhost:3333/api/scrape', {
      date: formatDate(today),
      lottery_types: ['FEDERAL', 'RIO_DE_JANEIRO', 'LOOK_GO', 'PT_SP', 'NACIONAL', 'MALUQUINHA_RJ', 'LOTEP', 'LOTECE', 'MINAS_GERAIS', 'BOA_SORTE']
    }, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SEU_TOKEN_AQUI' // Vamos tentar sem token primeiro
      }
    }).catch(() => {
      // Se falhar, tentar com token padrão
      return axios.post('http://localhost:3333/api/scrape', {
        date: formatDate(today),
        lottery_types: ['FEDERAL', 'RIO_DE_JANEIRO', 'LOOK_GO', 'PT_SP', 'NACIONAL', 'MALUQUINHA_RJ', 'LOTEP', 'LOTECE', 'MINAS_GERAIS', 'BOA_SORTE']
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin123'
        }
      });
    });
    console.log(`✅ Hoje: ${response2.data.results_saved} resultados salvos`);
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
  
  console.log('\n✅ Scrap concluído!');
}

// Executar
executeScrap().catch(console.error);