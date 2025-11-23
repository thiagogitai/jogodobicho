import { ResultadoFacilDefinitiveScraper } from './src/scrapers/ResultadoFacilDefinitiveScraper';
import { DateUtils } from './src/utils/DateUtils';

async function testAllResultadoFacilLinks() {
  console.log('🚀 Iniciando teste do Resultado Fácil Definitivo Scraper...\n');
  
  const scraper = new ResultadoFacilDefinitiveScraper();
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
  
  for (const banca of bancas) {
    console.log(`🔍 Testando banca: ${banca}`);
    
    try {
      const result = await scraper.scrapeBanca(banca, yesterday);
      
      if (result.success && result.data) {
        console.log(`✅ SUCESSO - ${banca}`);
        console.log(`   📊 Encontrados ${result.data.results.length} resultados`);
        console.log(`   🕐 Horário: ${result.data.time}`);
        console.log(`   📅 Data: ${result.data.date}`);
        
        // Mostrar os primeiros 3 resultados como amostra
        if (result.data.results.length > 0) {
          console.log('   🏆 Resultados (primeiros 3):');
          result.data.results.slice(0, 3).forEach((res, index) => {
            console.log(`      ${index + 1}º: ${res.number} - ${res.animal.name} ${res.animal.emoji}`);
          });
          if (result.data.results.length > 3) {
            console.log(`      ... e mais ${result.data.results.length - 3} resultados`);
          }
        }
        
        results.push({ banca, success: true, data: result.data });
        successCount++;
      } else {
        console.log(`❌ FALHA - ${banca}: ${result.error}`);
        results.push({ banca, success: false, error: result.error });
        errorCount++;
      }
      
    } catch (error) {
      console.log(`❌ ERRO - ${banca}: ${error.message}`);
      results.push({ banca, success: false, error: error.message });
      errorCount++;
    }
    
    console.log(''); // Linha em branco para separar
    
    // Pequena pausa entre requisições para não sobrecarregar o servidor
    await new Promise(resolve => setTimeout(resolve, 1000));
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