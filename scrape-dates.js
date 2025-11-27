// Script para executar scrap de ontem e hoje
const axios = require('axios');

async function executeScrap() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  const dates = [
    { date: formatDate(yesterday), label: 'ontem' },
    { date: formatDate(today), label: 'hoje' }
  ];
  
  console.log('🚀 Iniciando scrap para:', dates.map(d => d.label).join(' e '));
  
  for (const { date, label } of dates) {
    console.log(`\n📅 Executando scrap de ${label} (${date})...`);
    
    try {
      // Scrap rápido para Resultado Fácil
      console.log('  📊 Resultado Fácil...');
      const response1 = await axios.post('http://localhost:3333/api/scrape/resultado-facil', {
        date: date,
        lottery_types: ['LOTECE', 'LOTERIA_TRADICIONAL', 'LOTERIA_FEDERAL', 'LOTERIA_NACIONAL']
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`  ✅ Resultado Fácil: ${response1.data.saved} resultados salvos`);
      
      // Scrap para outros sites
      console.log('  📊 Outros sites...');
      const response2 = await axios.post('http://localhost:3333/api/scrape/yesterday-all', {
        date: date
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`  ✅ Outros sites: ${response2.data.saved} resultados salvos`);
      
    } catch (error) {
      console.error(`  ❌ Erro em ${label}:`, error.response?.data || error.message);
    }
  }
  
  console.log('\n✅ Scrap concluído!');
}

// Executar
executeScrap().catch(console.error);