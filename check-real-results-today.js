const axios = require('axios');
const cheerio = require('cheerio');

async function checkRealResultsToday() {
  console.log('🔍 Verificando resultados REAIS de hoje nos sites...\n');
  
  const today = new Date().toLocaleDateString('pt-BR');
  const currentTime = new Date().toLocaleTimeString('pt-BR');
  
  console.log(`📅 Data: ${today}`);
  console.log(`⏰ Hora atual: ${currentTime}`);
  console.log('');
  
  // Sites para verificar
  const sites = [
    {
      name: 'Deunoposte',
      url: 'https://www.ojogodobicho.com/deu_no_poste.htm',
      description: 'PPT, PTM, PT, PTV, FED, COR'
    },
    {
      name: 'Resultado Fácil - RJ',
      url: 'https://www.resultadofacil.com.br/rio-de-janeiro',
      description: 'Resultados do Rio'
    },
    {
      name: 'Resultado Fácil - SP', 
      url: 'https://www.resultadofacil.com.br/sao-paulo',
      description: 'Resultados de SP'
    },
    {
      name: 'Jogo do Bicho.net',
      url: 'https://www.jogodobicho.net',
      description: 'Resultados de várias loterias'
    }
  ];
  
  for (const site of sites) {
    console.log(`🌐 Verificando: ${site.name}`);
    console.log(`   URL: ${site.url}`);
    console.log(`   Descrição: ${site.description}`);
    
    try {
      const response = await axios.get(site.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Procurar por data nos resultados
      const dateElements = $('body').text().match(/\d{2}\/\d{2}\/\d{4}/g);
      const timeElements = $('body').text().match(/\d{2}:\d{2}/g);
      
      console.log(`   📅 Datas encontradas: ${dateElements ? dateElements.join(', ') : 'Nenhuma'}`);
      console.log(`   ⏰ Horários encontrados: ${timeElements ? timeElements.slice(0, 10).join(', ') : 'Nenhum'}`);
      
      // Procurar números de resultado (4 dígitos)
      const numbers = $('body').text().match(/\b\d{4}\b/g);
      if (numbers && numbers.length > 0) {
        console.log(`   🔢 Números encontrados: ${numbers.slice(0, 10).join('-')}${numbers.length > 10 ? '...' : ''}`);
      } else {
        console.log(`   🔢 Números: Nenhum encontrado`);
      }
      
      // Verificar se tem resultados de hoje especificamente
      const hasTodayResults = $('body').text().includes(today) || 
                               $('body').text().includes('HOJE') || 
                               $('body').text().includes('hoje');
      
      console.log(`   ✅ Resultados de hoje: ${hasTodayResults ? 'SIM' : 'NÃO ENCONTRADO'}`);
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    console.log('');
    
    // Pequeno delay entre requisições
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🔍 Análise concluída!');
}

checkRealResultsToday();