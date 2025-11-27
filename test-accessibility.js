const axios = require('axios');
const cheerio = require('cheerio');

// Testar sem proxy primeiro
const axiosConfig = {
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
};

const axiosDirect = axios.create(axiosConfig);

// Função para extrair números do HTML
function extractNumbers(text) {
  const matches = text.match(/\b\d{4}\b/g);
  return matches ? matches.filter(num => num.length === 4) : [];
}

// Função para detectar tipo de loteria
function detectLotteryType(text) {
  const patterns = [
    { regex: /rio.*janeiro/i, type: 'RIO_DE_JANEIRO' },
    { regex: /são.*paulo|sao.*paulo/i, type: 'PT_SP' },
    { regex: /federal/i, type: 'FEDERAL' },
    { regex: /minas/i, type: 'MINAS_GERAIS' },
    { regex: /goiás|goias/i, type: 'LOOK_GO' },
    { regex: /nacional/i, type: 'NACIONAL' },
    { regex: /maluquinha/i, type: 'MALUQUINHA_RJ' },
    { regex: /boa.*sorte/i, type: 'BOA_SORTE' },
    { regex: /lotece/i, type: 'LOTECE' },
    { regex: /lotep/i, type: 'LOTEP' }
  ];
  
  for (const pattern of patterns) {
    if (text.match(pattern.regex)) {
      return pattern.type;
    }
  }
  return null;
}

// Função para verificar se site está acessível
async function checkSiteAccess(url, name) {
  console.log(`\n🌐 Testando: ${name}`);
  console.log(`📍 URL: ${url}`);
  
  try {
    const startTime = Date.now();
    const response = await axiosDirect.get(url);
    const endTime = Date.now();
    
    console.log(`✅ Conectado! Tempo: ${endTime - startTime}ms`);
    console.log(`📄 Tamanho: ${response.data.length} bytes`);
    console.log(`📊 Status: ${response.status}`);
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Verificar se tem resultados de ontem (24/11/2025)
    const yesterday = '24/11/2025';
    const datePatterns = [
      /24\/11\/2025/g,
      /24\.11\.2025/g,
      /25\/11\/2025/g,
      /25\.11\.2025/g
    ];
    
    let foundDate = false;
    datePatterns.forEach(pattern => {
      if (html.match(pattern)) {
        foundDate = true;
        console.log(`📅 Encontrada data: ${pattern.source}`);
      }
    });
    
    // Procurar por horários/PTM
    const timeMatches = html.match(/PT[MSP]\s*\d*/g);
    if (timeMatches) {
      console.log(`⏰ Horários encontrados: ${timeMatches.slice(0, 10).join(', ')}`);
    }
    
    // Procurar números de 4 dígitos
    const numbers = extractNumbers(html);
    if (numbers.length > 0) {
      console.log(`🔢 Primeiros números: ${numbers.slice(0, 10).join(', ')}`);
    }
    
    // Procurar tipos de loteria
    const lotteryTypes = ['RIO', 'SÃO PAULO', 'FEDERAL', 'MINAS', 'GOIÁS', 'NACIONAL', 'MALUQUINHA'];
    lotteryTypes.forEach(type => {
      const regex = new RegExp(type, 'gi');
      const matches = html.match(regex);
      if (matches) {
        console.log(`🏆 ${type}: ${matches.length} ocorrências`);
      }
    });
    
    return {
      success: true,
      hasDate: foundDate,
      timeMatches: timeMatches ? timeMatches.length : 0,
      numbers: numbers.length,
      responseTime: endTime - startTime
    };
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Testar acessibilidade dos sites
async function testSiteAccessibility() {
  console.log('🚀 Testando acessibilidade dos sites (sem proxy)...\n');
  
  const sites = [
    {
      name: 'Jogo do Bicho.net',
      url: 'https://www.jogodobicho.net'
    },
    {
      name: 'Resultado Fácil RJ',
      url: 'https://www.resultadofacil.com.br/rj'
    },
    {
      name: 'Resultado Fácil SP', 
      url: 'https://www.resultadofacil.com.br/sp'
    },
    {
      name: 'Deunoposte RJ',
      url: 'https://www.deunoposte.com.br'
    },
    {
      name: 'Deunoposte SP',
      url: 'https://www.deunoposte.com.br/sp'
    },
    {
      name: 'Meu Jogo do Bicho',
      url: 'https://www.meujogodobicho.com'
    }
  ];
  
  const results = [];
  
  for (const site of sites) {
    const result = await checkSiteAccess(site.url, site.name);
    results.push({
      name: site.name,
      url: site.url,
      ...result
    });
    
    // Pausa entre requisições
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📊 RESUMO DE ACESSIBILIDADE:');
  console.log('==============================');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const date = result.hasDate ? '📅' : '⚠️';
    const details = result.success 
      ? `${result.responseTime}ms | 📅${result.hasDate ? 'Sim' : 'Não'} | ⏰${result.timeMatches} | 🔢${result.numbers}`
      : result.error;
    
    console.log(`${status} ${date} ${result.name}: ${details}`);
  });
  
  const accessible = results.filter(r => r.success).length;
  const withDate = results.filter(r => r.success && r.hasDate).length;
  
  console.log(`\n✅ Sites acessíveis: ${accessible}/${results.length}`);
  console.log(`📅 Sites com data de ontem: ${withDate}/${results.length}`);
  
  // Agora testar scraping específico nos sites acessíveis
  console.log('\n🔍 Iniciando scraping nos sites acessíveis...');
  
  for (const site of results.filter(r => r.success)) {
    console.log(`\n📋 Scraping detalhado: ${site.name}`);
    
    try {
      const response = await axiosDirect.get(site.url);
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Extrair resultados específicos de ontem
      const yesterday = '24/11/2025';
      const dateElements = $(`*:contains("${yesterday}")`);
      
      if (dateElements.length > 0) {
        console.log(`✅ Encontrados ${dateElements.length} elementos com data de ontem`);
        
        dateElements.each((i, elem) => {
          const element = $(elem);
          const text = element.text();
          const numbers = extractNumbers(text);
          const lotteryType = detectLotteryType(text);
          
          if (numbers.length >= 3 && lotteryType) {
            console.log(`🏆 ${lotteryType}: ${numbers.slice(0, 5).join('-')}`);
          }
        });
      } else {
        console.log(`⚠️  Nenhum elemento encontrado com data ${yesterday}`);
        
        // Mostrar o que tem no site
        const allText = $('body').text();
        const lines = allText.split('\n').filter(line => line.trim().length > 0);
        console.log('📄 Primeiras linhas do conteúdo:');
        lines.slice(0, 10).forEach(line => console.log(`   ${line.trim()}`));
      }
      
    } catch (error) {
      console.log(`❌ Erro no scraping: ${error.message}`);
    }
  }
}

// Executar teste
testSiteAccessibility().catch(console.error);