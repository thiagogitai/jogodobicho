import { ResultadoFacilDefinitivoScraper } from './src/scrapers/ResultadoFacilDefinitivoScraper';
import { DateUtils } from './src/utils/DateUtils';

async function testAllResultadoFacilLinks() {
  console.log('🚀 Iniciando teste do Resultado Fácil Definitivo Scraper...\n');
  
  const scraper = new ResultadoFacilDefinitivoScraper();
  const yesterday = DateUtils.getYesterdayDate();
  
  console.log(`📅 Data de ontem: ${yesterday}\n`);
  
  // Lista de todas as bancas que você forneceu
  const bancas = [
    'LOTECE',
    'LOTERIA_TRADICIONAL', 
    'LOTERIA_FEDERAL',
    'LOTERIA_DE_MINAS_GERAIS',
    'BOA_SORTE_SP',
    'LOTERIA_DO_RIO',
    'PERNAMBUCO',
    'PARA',
    'CEARA',
    'BAHIA',
    'MARANHAO',
    'PARAIBA',
    'ALAGOAS',
    'ESPIRITO_SANTO',
    'RIO_GRANDE_DO_NORTE',
    'PIAUI',
    'RIO_GRANDE_DO_SUL',
    'SANTA_CATARINA',
    'GOIAS',
    'MATO_GROSSO',
    'MATO_GROSSO_DO_SUL'
  ];
  
  const results = [];
  let successCount = 0;
  let errorCount = 0;
  
  try {
    const extracted = await scraper.scrapeResultadoFacil(yesterday);
    console.log(`✅ Extração concluída: ${extracted.length} entradas`);
    results.push(...extracted);
    successCount = extracted.length;
  } catch (err: any) {
    console.log(`❌ Erro na extração: ${err.message || err}`);
    errorCount = 1;
  }
  
  // Resumo final
  console.log('📋 RESUMO DO TESTE:');
  console.log('==================');
  console.log(`Total de bancas testadas: ${bancas.length}`);
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Falhas: ${errorCount}`);
  console.log(`📊 Taxa de sucesso: ${((successCount / bancas.length) * 100).toFixed(1)}%`);
  
  if (successCount > 0) {
    console.log('\n🎯 BANCAS COM SUCESSO:');
    results
      .filter(r => r.success)
      .forEach(r => console.log(`   ✅ ${r.banca}`));
  }
  
  if (errorCount > 0) {
    console.log('\n❌ BANCAS COM FALHA:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`   ❌ ${r.banca}: ${r.error}`));
  }
  
  // Salvar resultados em arquivo para análise posterior
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(__dirname, 'test-resultado-facil-results.json');
  
  fs.writeFileSync(outputPath, JSON.stringify({
    date: yesterday,
    timestamp: new Date().toISOString(),
    summary: {
      total: bancas.length,
      success: successCount,
      errors: errorCount,
      successRate: ((successCount / bancas.length) * 100).toFixed(1) + '%'
    },
    results: results
  }, null, 2));
  
  console.log(`\n💾 Resultados salvos em: ${outputPath}`);
}

// Executar o teste
testAllResultadoFacilLinks().catch(console.error);