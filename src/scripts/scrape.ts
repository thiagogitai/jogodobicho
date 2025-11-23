import { scrapeService } from '../services/ScrapeService';
import { resultsService } from '../services/ResultsService';
import { logger } from '../utils/logger';
import moment from 'moment';

async function scrapeYesterdayResults() {
  try {
    console.log('🎯 Iniciando scrape de resultados de ontem...\n');
    
    const yesterday = moment().subtract(1, 'day').format('DD/MM/YYYY');
    console.log(`📅 Buscando resultados de: ${yesterday}\n`);
    
    console.log('🔄 Iniciando scrape com proxy rotation...\n');
    
    const results = await scrapeService.scrapeYesterdayResults();
    
    console.log(`\n✅ Scrape concluído! ${results.size} loterias encontradas:\n`);
    
    // Salva os resultados no banco de dados
    console.log('💾 Salvando resultados no banco de dados...');
    await resultsService.saveResults(results);
    console.log('✅ Resultados salvos com sucesso!\n');
    
    results.forEach((result, lotteryType) => {
      console.log(`🏆 ${lotteryType}:`);
      console.log(`   📊 Data: ${result.date}`);
      console.log(`   🔢 Resultados:`, result.results);
      if (result.prizes) {
        console.log(`   💰 Prêmios:`, result.prizes);
      }
      console.log(`   🔗 Fonte: ${result.source}`);
      console.log('');
    });

    // Estatísticas
    const successful = Array.from(results.values()).filter(r => r.results.first).length;
    const failed = results.size - successful;
    
    console.log(`📈 Estatísticas:`);
    console.log(`   ✅ Sucesso: ${successful}`);
    console.log(`   ❌ Falhas: ${failed}`);
    console.log(`   📊 Taxa de sucesso: ${((successful / results.size) * 100).toFixed(1)}%`);
    
    // Estatísticas do banco
    const stats = await resultsService.getStatistics();
    if (stats) {
      console.log(`\n📊 Estatísticas do Banco:`);
      console.log(`   💾 Total de resultados: ${stats.totalResults}`);
      console.log(`   🗄️  Tipo de banco: ${stats.databaseType}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar scrape:', error);
    logger.error('Erro no script de scrape:', error);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  scrapeYesterdayResults();
}

export { scrapeYesterdayResults };