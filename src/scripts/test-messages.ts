import { scrapeService } from '../services/ScrapeService';
import { resultsService } from '../services/ResultsService';
import { messageService } from '../services/MessageService';
import { logger } from '../utils/logger';

async function testMessageSending() {
  try {
    console.log('🚀 Iniciando teste de envio de mensagens...\n');
    
    // Testa conexão com Evolution API
    console.log('🔗 Testando conexão com Evolution API...');
    const connectionTest = await messageService.testConnection();
    
    if (connectionTest) {
      console.log('✅ Conexão Evolution API estabelecida com sucesso!\n');
    } else {
      console.log('⚠️  Conexão Evolution API não estabelecida. Mensagens serão simuladas.\n');
    }
    
    // Busca resultados mais recentes
    console.log('📊 Buscando resultados mais recentes...');
    const latestResults = await resultsService.getLatestResults(5);
    
    if (latestResults.length === 0) {
      console.log('📥 Nenhum resultado encontrado, buscando resultados de ontem...');
      const scrapedResults = await scrapeService.scrapeYesterdayResults();
      await resultsService.saveResults(scrapedResults);
      console.log(`✅ ${scrapedResults.size} resultados salvos no banco\n`);
    } else {
      console.log(`✅ Encontrados ${latestResults.length} resultados no banco\n`);
    }
    
    // Busca novamente para garantir que temos resultados
    const resultsToSend = await resultsService.getLatestResults(10);
    
    if (resultsToSend.length === 0) {
      console.log('❌ Nenhum resultado disponível para envio');
      return;
    }
    
    // Converte para Map
    const resultsMap = new Map();
    resultsToSend.forEach(result => {
      resultsMap.set(result.lotteryType, result);
    });
    
    console.log(`📤 Enviando ${resultsMap.size} resultados para os grupos configurados...\n`);
    
    // Envia mensagens
    const sendResults = await messageService.sendResultsToGroups(resultsMap);
    
    console.log('\n📊 Resultados do envio:');
    console.log(`   ✅ Sucessos: ${sendResults.filter(r => r.success).length}`);
    console.log(`   ❌ Falhas: ${sendResults.filter(r => !r.success).length}`);
    
    // Detalhes por grupo
    console.log('\n📋 Detalhes por grupo:');
    sendResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const platform = result.platform.toUpperCase();
      console.log(`   ${status} ${platform} - ${result.groupId}: ${result.success ? 'ENVIADO' : 'FALHA'}`);
      if (result.error) {
        console.log(`      Erro: ${result.error}`);
      }
    });
    
    // Exemplo de mensagens que seriam enviadas
    console.log('\n💬 Exemplos de mensagens:');
    const exampleResult = resultsToSend[0];
    if (exampleResult) {
      const exampleMessage = messageService.formatSingleResult(exampleResult, {
        id: 'example',
        name: 'Exemplo',
        platform: 'whatsapp',
        groupId: 'example-group',
        enabled: true,
        lotteryTypes: [exampleResult.lotteryType],
        templateId: 'Padrão Completo'
      });
      console.log(`   ${exampleMessage.replace(/\n/g, '\n   ')}`);
    }
    
    console.log('\n🎉 Teste de envio concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste de envio:', error);
    logger.error('Erro no teste de envio de mensagens:', error);
  }
}

// Adiciona método para formatar mensagem individual
(messageService as any).formatSingleResult = function(result: any, groupConfig: any) {
  const lotteryName = {
    'FEDERAL': 'FEDERAL',
    'RIO_DE_JANEIRO': 'RIO DE JANEIRO',
    'LOOK_GO': 'LOOK GO',
    'PT_SP': 'PT SÃO PAULO',
    'NACIONAL': 'NACIONAL',
    'MALUQUINHA_RJ': 'MALUQUINHA RJ',
    'LOTEP': 'LOTEP',
    'LOTECE': 'LOTECE',
    'MINAS_GERAIS': 'MINAS GERAIS',
    'BOA_SORTE': 'BOA SORTE',
    'LOTERIAS_CAIXA': 'LOTERIAS CAIXA'
  }[result.lotteryType] || result.lotteryType;
  
  let message = `🎯 *${lotteryName}* - ${new Date(result.date).toLocaleDateString('pt-BR')}\n\n`;
  message += `🥇 1º: ${result.results.first || 'N/A'}\n`;
  message += `🥈 2º: ${result.results.second || 'N/A'}\n`;
  message += `🥉 3º: ${result.results.third || 'N/A'}\n`;
  if (result.results.fourth) message += `4º: ${result.results.fourth}\n`;
  if (result.results.fifth) message += `5º: ${result.results.fifth}\n`;
  
  return message;
};

// Executa se chamado diretamente
if (require.main === module) {
  testMessageSending();
}

export { testMessageSending };