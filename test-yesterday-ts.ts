import { IntelligentScraper } from './src/scrapers/IntelligentScraper';
import { DateUtils } from './src/utils/DateUtils';

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
      console.log(`\n${index + 1}. ${result.lotteryType || 'Unknown'}`);
      console.log(`   Status: ${result.success ? '✅ Sucesso' : '❌ Falha'}`);
      
      if (result.success && result.result) {
        const lotteryResult = result.result;
        console.log(`   Data: ${lotteryResult.date}`);
        console.log(`   Fonte: ${lotteryResult.source}`);
        
        if (lotteryResult.results) {
          const resultKeys = Object.keys(lotteryResult.results);
          console.log(`   Prêmios encontrados: ${resultKeys.length}`);
          console.log('   Resultados:');
          
          resultKeys.forEach((key, idx) => {
            const value = lotteryResult.results[key];
            console.log(`     ${key}: ${value}`);
          });
        }
        
        if (result.formatDetected) {
          console.log(`   Formato detectado: ${result.formatDetected.numbers} números, ${result.formatDetected.digits} dígitos (confiança: ${result.formatDetected.confidence})`);
        }
      } else if (!result.success) {
        console.log(`   Erro: ${result.error}`);
      }
    });
    
    // Estatísticas gerais
    const successful = results.filter(r => r.success).length;
    const totalResults = results.reduce((acc, r) => {
      if (r.result && r.result.results) {
        return acc + Object.keys(r.result.results).length;
      }
      return acc;
    }, 0);
    
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