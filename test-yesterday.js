const { IntelligentScraper } = require('./dist/scrapers/IntelligentScraper.js');
const { DateUtils } = require('./dist/utils/DateUtils.js');

async function testYesterdayScraping() {
  const scraper = new IntelligentScraper();
  const yesterday = DateUtils.getYesterday();
  
  console.log('🎯 Testando scraper com data de ontem:', yesterday);
  console.log('📅 Formatos a testar: 1-5, 1-7, 1-10 prêmios, 3-4 dígitos');
  console.log('='.repeat(60));
  
  try {
    const results = await scraper.scrapeAllLotteriesYesterday();
    
    console.log('✅ Scraping concluído!');
    console.log('📊 Resultados encontrados:', results.length);
    
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.lotteryName} (${result.lotteryType})`);
      console.log(`   Data: ${result.date}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Status: ${result.success ? '✅ Sucesso' : '❌ Falha'}`);
      
      if (result.success && result.results.length > 0) {
        console.log(`   Prêmios encontrados: ${result.results.length}`);
        console.log(`   Formatos detectados:`);
        
        const formats = result.results.reduce((acc, r) => {
          const key = `${r.prizeNumber} (${r.number.length} dígitos)`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        
        Object.entries(formats).forEach(([format, count]) => {
          console.log(`     - ${format}: ${count} vez(es)`);
        });
        
        // Mostrar primeiros 3 resultados como exemplo
        console.log('   Exemplos:');
        result.results.slice(0, 3).forEach(r => {
          console.log(`     ${r.position}º: ${r.number} - ${r.animal} ${r.animalEmoji}`);
        });
      } else if (!result.success) {
        console.log(`   Erro: ${result.error}`);
      }
    });
    
    // Estatísticas gerais
    const successful = results.filter(r => r.success).length;
    const totalResults = results.reduce((acc, r) => acc + (r.results?.length || 0), 0);
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 Estatísticas Gerais:');
    console.log(`   Total de loterias: ${results.length}`);
    console.log(`   Sucessos: ${successful}/${results.length}`);
    console.log(`   Total de resultados: ${totalResults}`);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testYesterdayScraping();