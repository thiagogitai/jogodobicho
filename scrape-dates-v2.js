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
      // Usar a rota correta para scrap geral
      console.log('  📊 Scrap geral...');
      const response = await axios.post('http://localhost:3333/api/scrape', {
        date: date,
        lottery_types: ['FEDERAL', 'RIO_DE_JANEIRO', 'LOOK_GO', 'PT_SP', 'NACIONAL', 'MALUQUINHA_RJ', 'LOTEP', 'LOTECE', 'MINAS_GERAIS', 'BOA_SORTE']
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`  ✅ Scrap geral: ${response.data.results_saved} resultados salvos`);
      
      // Scrap rápido de ontem (para teste)
      if (label === 'ontem') {
        console.log('  📊 Scrap rápido ontem...');
        const response2 = await axios.post('http://localhost:3333/api/scrape/yesterday-lite', {}, {
          headers: { 'Content-Type': 'application/json' }
        });
        console.log(`  ✅ Scrap rápido: ${response2.data.length || 0} resultados`);
      }
      
    } catch (error) {
      console.error(`  ❌ Erro em ${label}:`, error.response?.data || error.message);
    }
  }
  
  console.log('\n✅ Scrap concluído!');
}

// Executar
executeScrap().catch(console.error);