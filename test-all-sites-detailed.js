const axios = require('axios');

async function testAllSitesDetailed() {
  console.log('🔍 Testando todos os sites em detalhes para ontem...\n');
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('pt-BR');
  const dateStr = yesterday.toISOString().substring(0, 10);
  
  console.log(`📅 Data de ontem: ${yesterdayStr} (${dateStr})`);
  console.log(`⏰ Hora atual: ${new Date().toLocaleTimeString('pt-BR')}`);
  console.log('');
  
  // Todos os sites que deveriam ter resultados de ontem
  const sites = [
    {
      name: 'Deunoposte - PPT, PTM, PT, PTV, FED, COR',
      url: 'https://www.ojogodobicho.com/deu_no_poste.htm',
      expected: '6 loterias (PPT 11h, PTM 14h, PT 16h, PTV 18h, FED 20h, COR 21h)'
    },
    {
      name: 'Resultado Fácil - Rio de Janeiro',
      url: 'https://www.resultadofacil.com.br/rio-de-janeiro',
      expected: 'Múltiplos horários: 11h, 14h, 16h, 18h, 20h, 21h'
    },
    {
      name: 'Resultado Fácil - São Paulo',
      url: 'https://www.resultadofacil.com.br/sao-paulo',
      expected: 'Múltiplos horários: 11h, 14h, 16h, 18h, 20h, 21h'
    },
    {
      name: 'Resultado Fácil - Minas Gerais',
      url: 'https://www.resultadofacil.com.br/minas-gerais',
      expected: 'Horários específicos MG: 13h, 19h'
    },
    {
      name: 'Resultado Fácil - Federal',
      url: 'https://www.resultadofacil.com.br/federal',
      expected: 'Federal: 20h (quartas e sábados)'
    },
    {
      name: 'Resultado Fácil - Maluca BA',
      url: 'https://www.resultadofacil.com.br/resultados-maluca-bahia-do-dia',
      expected: 'Maluca BA: 10h, 12h, 15h, 19h, 21h'
    },
    {
      name: 'Resultado Fácil - LOTECE',
      url: 'https://www.resultadofacil.com.br/lotoce-ceara',
      expected: 'LOTECE: 11h, 14h, 15:45h, 19h'
    },
    {
      name: 'Resultado Fácil - LOTEP',
      url: 'https://www.resultadofacil.com.br/lotep-parana',
      expected: 'LOTEP: 15h'
    },
    {
      name: 'Jogo do Bicho.net',
      url: 'https://www.jogodobicho.net',
      expected: 'Várias loterias: Rio, SP, Federal, etc.'
    },
    {
      name: 'Meu Jogo do Bicho',
      url: 'https://www.meujogodobicho.com',
      expected: 'Resultados completos por estado'
    }
  ];
  
  let totalResults = 0;
  let successfulSites = 0;
  
  console.log('🌐 Testando cada site individualmente:\n');
  
  for (const site of sites) {
    console.log(`📍 ${site.name}`);
    console.log(`   URL: ${site.url}`);
    console.log(`   Esperado: ${site.expected}`);
    
    try {
      const response = await axios.post('http://localhost:3001/api/scrape/test-site', {
        url: site.url,
        name: site.name
      });
      
      const data = response.data;
      totalResults += data.resultsFound;
      successfulSites++;
      
      console.log(`   ✅ ACESSADO: ${data.resultsFound} números encontrados`);
      console.log(`   📅 Datas no site: ${data.dates?.length || 0} (${data.dates?.slice(0, 3).join(', ') || 'nenhuma'})`);
      console.log(`   ⏰ Horários no site: ${data.times?.length || 0} (${data.times?.slice(0, 5).join(', ') || 'nenhum'})`);
      console.log(`   📊 Tem resultados de ontem: ${data.hasYesterdayResults ? 'SIM ✅' : 'NÃO ❌'}`);
      
      if (data.numbers && data.numbers.length > 0) {
        console.log(`   🔢 Primeiros números: ${data.numbers.slice(0, 8).join('-')}${data.numbers.length > 8 ? '...' : ''}`);
      }
      
      // Verificar se tem a data de ontem especificamente
      const hasDateYesterday = data.dates?.some(date => date === yesterdayStr);
      if (hasDateYesterday) {
        console.log(`   🎯 DATA DE ONTEM ENCONTRADA! ✅`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERRO: ${error.response?.data?.error || error.message}`);
      if (error.response?.data?.detail) {
        console.log(`   🔍 Detalhes: ${error.response?.data?.detail}`);
      }
    }
    
    console.log('');
    
    // Delay entre requisições para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('📊 RESUMO DO TESTE:');
  console.log(`✅ Sites acessados com sucesso: ${successfulSites}/${sites.length}`);
  console.log(`🔢 Total de números encontrados: ${totalResults}`);
  console.log(`📅 Data verificada: ${yesterdayStr}`);
  
  console.log('\n🚨 PROBLEMA IDENTIFICADO:');
  console.log('- O scraper só está pegando 1 resultado quando deveria pegar dezenas');
  console.log('- Cada site tem múltiplos horários mas só 1 está sendo capturado');
  console.log('- Precisamos capturar TODOS os horários de cada site');
}

testAllSitesDetailed();