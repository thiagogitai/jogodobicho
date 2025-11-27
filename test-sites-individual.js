const axios = require('axios');

async function testEachSiteIndividually() {
  console.log('🔍 Testando cada site individualmente com proxy...\n');
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().substring(0, 10);
  
  console.log(`📅 Data de ontem: ${dateStr}`);
  console.log(`⏰ Hora atual: ${new Date().toLocaleTimeString('pt-BR')}`);
  console.log('');
  
  // Sites que deveriam ter resultados de ontem
  const sites = [
    {
      name: 'Deunoposte (PPT, PTM, PT, PTV, FED, COR)',
      url: 'https://www.ojogodobicho.com/deu_no_poste.htm',
      expectedResults: 6 // 6 loterias
    },
    {
      name: 'Resultado Fácil - Rio',
      url: 'https://www.resultadofacil.com.br/rio-de-janeiro',
      expectedResults: 8 // várias loterias
    },
    {
      name: 'Resultado Fácil - São Paulo',
      url: 'https://www.resultadofacil.com.br/sao-paulo', 
      expectedResults: 8 // várias loterias
    },
    {
      name: 'Resultado Fácil - Minas Gerais',
      url: 'https://www.resultadofacil.com.br/minas-gerais',
      expectedResults: 5 // várias loterias
    },
    {
      name: 'Resultado Fácil - Federal',
      url: 'https://www.resultadofacil.com.br/federal',
      expectedResults: 1 // só federal
    },
    {
      name: 'Jogo do Bicho.net',
      url: 'https://www.jogodobicho.net',
      expectedResults: 10 // várias loterias
    }
  ];
  
  console.log('🌐 Testando cada site individualmente:\n');
  
  for (const site of sites) {
    console.log(`📍 Testando: ${site.name}`);
    console.log(`   URL: ${site.url}`);
    console.log(`   Esperado: ${site.expectedResults} resultados`);
    
    try {
      // Testar via endpoint do servidor
      const response = await axios.post('http://localhost:3001/api/scrape/test-site', {
        url: site.url,
        name: site.name
      });
      
      console.log(`   ✅ Sucesso: ${response.data.resultsFound} resultados encontrados`);
      console.log(`   📅 Data: ${response.data.date}`);
      console.log(`   ⏰ Horários: ${response.data.times?.join(', ') || 'Nenhum'}`);
      
      if (response.data.numbers && response.data.numbers.length > 0) {
        console.log(`   🔢 Números: ${response.data.numbers.slice(0, 5).join('-')}${response.data.numbers.length > 5 ? '...' : ''}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.response?.data?.error || error.message}`);
      if (error.response?.data?.detail) {
        console.log(`   🔍 Detalhes: ${error.response?.data?.detail}`);
      }
    }
    
    console.log('');
    
    // Pequeno delay entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('📊 Resumo do teste:');
  console.log('- Sites testados: 6');
  console.log('- Total esperado: múltiplos horários por site');
  console.log('- Verificar se todos os horários estão sendo capturados');
}

testEachSiteIndividually();