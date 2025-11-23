import { ResultadoFacilScraper } from './src/scrapers/ResultadoFacilScraper.js';
import { DateUtils } from './src/utils/DateUtils.js';
import logger from './src/config/logger';

async function testResultadoFacilScraper() {
  console.log('🧪 Iniciando teste do scraper Resultado Fácil...\n');
  
  const scraper = new ResultadoFacilScraper();
  
  try {
    // Testar conexão
    console.log('📡 Testando conexão com o site...');
    const connectionTest = await scraper.testConnection();
    
    if (!connectionTest) {
      console.log('❌ Falha na conexão com o site');
      return;
    }
    
    console.log('✅ Conexão estabelecida com sucesso!\n');
    
    // Obter data de ontem
    const yesterday = DateUtils.getYesterdayDate();
    console.log(`📅 Buscando resultados de: ${yesterday}\n`);
    
    // Executar scraper
    console.log('🔍 Iniciando scrape do Resultado Fácil...');
    const results = await scraper.scrapeYesterday();
    
    console.log(`\n📊 Resultados encontrados: ${results.length}\n`);
    
    // Exibir resultados detalhados
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. 🏆 ${result.lotteryName}`);
      console.log(`   📅 Data: ${result.date}`);
      console.log(`   ⏰ Horário: ${result.format}`);
      console.log(`   🔢 Prêmios: ${result.prizes.length}`);
      
      result.prizes.slice(0, 5).forEach((prize, prizeIndex) => {
        console.log(`      ${prize.position}º: ${prize.number} - ${prize.animal} (${prize.group})`);
      });
      
      if (result.prizes.length > 5) {
        console.log(`      ... e mais ${result.prizes.length - 5} prêmios`);
      }
    });
    
    // Estatísticas
    const totalPrizes = results.reduce((sum, result) => sum + result.prizes.length, 0);
    const avgPrizes = results.length > 0 ? Math.round(totalPrizes / results.length) : 0;
    
    console.log('\n📈 Estatísticas:');
    console.log(`   Total de bancas: ${results.length}`);
    console.log(`   Total de prêmios: ${totalPrizes}`);
    console.log(`   Média de prêmios por banca: ${avgPrizes}`);
    
    // Verificar formatos
    const formats = results.reduce((acc, result) => {
      acc[result.format] = (acc[result.format] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n📋 Formatos detectados:');
    Object.entries(formats).forEach(([format, count]) => {
      console.log(`   ${format}: ${count} bancas`);
    });
    
    // Verificar dígitos
    const digitCounts = results.reduce((acc, result) => {
      result.prizes.forEach(prize => {
        const digits = prize.number.length;
        acc[digits] = (acc[digits] || 0) + 1;
      });
      return acc;
    }, {} as Record<number, number>);
    
    console.log('\n🔢 Distribuição de dígitos:');
    Object.entries(digitCounts).forEach(([digits, count]) => {
      console.log(`   ${digits} dígitos: ${count} prêmios`);
    });
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    logger.error('Erro no teste do Resultado Fácil:', error);
  }
}

// Executar teste
if (import.meta.url === `file://${process.argv[1]}`) {
  testResultadoFacilScraper().catch(console.error);
}