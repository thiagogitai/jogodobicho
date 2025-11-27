const { MultiSourceScraper } = require('./src/scrapers/MultiSourceScraper');
const { logger } = require('./src/utils/logger');

async function testRealScraper() {
  console.log('🔍 Testando scraper real com proxy...\n');
  
  const today = new Date().toLocaleDateString('pt-BR');
  const currentTime = new Date().toLocaleTimeString('pt-BR');
  
  console.log(`📅 Data: ${today}`);
  console.log(`⏰ Hora atual: ${currentTime}`);
  console.log('');
  
  try {
    const scraper = new MultiSourceScraper();
    console.log('🚀 Iniciando scraper real...');
    
    const results = await scraper.scrapeFromMultipleSources();
    
    console.log(`\n✅ Scraper real finalizado!`);
    console.log(`📊 Total de resultados obtidos: ${results.size}`);
    
    if (results.size > 0) {
      console.log('\n📋 Resultados obtidos:');
      for (const [type, result] of results) {
        console.log(`\n🏆 ${type}:`);
        console.log(`   📅 Data: ${result.date}`);
        console.log(`   🔢 Números: ${result.results.first}-${result.results.second}-${result.results.third}-${result.results.fourth}-${result.results.fifth}`);
        console.log(`   🌐 Fonte: ${result.source}`);
      }
    } else {
      console.log('\n⚠️  Nenhum resultado real foi obtido dos sites');
    }
    
  } catch (error) {
    console.log('\n❌ Erro no scraper real:', error.message);
    console.log('Stack:', error.stack);
  }
}

testRealScraper();