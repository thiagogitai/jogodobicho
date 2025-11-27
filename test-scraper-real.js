const axios = require('axios');
const cheerio = require('cheerio');

// Configurar proxy
const proxyConfig = {
  host: '191.240.64.41',
  port: 8080,
  auth: {
    username: 'krinstinct1234',
    password: 'krinstinct1234'
  }
};

// Criar axios com proxy
const axiosWithProxy = axios.create({
  proxy: proxyConfig,
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
});

async function scrapeRealWebsite(url, name) {
  console.log(`\n🌐 Acessando: ${name}`);
  console.log(`📍 URL: ${url}`);
  
  try {
    const response = await axiosWithProxy.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    
    console.log(`✅ Conectado! Tamanho: ${html.length} bytes`);
    
    // Procurar por resultados de ontem (24/11/2025)
    const yesterday = '24/11/2025';
    const datePatterns = [
      /24\/11\/2025/g,
      /25\/11\/2025/g,
      /24\.11\.2025/g,
      /25\.11\.2025/g
    ];
    
    let foundDate = false;
    datePatterns.forEach(pattern => {
      if (html.match(pattern)) {
        foundDate = true;
        console.log(`📅 Encontrada data: ${pattern.source}`);
      }
    });
    
    if (!foundDate) {
      console.log('⚠️  Data de ontem NÃO encontrada no HTML');
    }
    
    // Procurar por números de 4 dígitos (padrão jogo do bicho)
    const numbers = html.match(/\b\d{4}\b/g);
    if (numbers) {
      console.log(`🔢 Números de 4 dígitos encontrados: ${numbers.slice(0, 20).join(', ')}${numbers.length > 20 ? '...' : ''}`);
    }
    
    // Procurar por horários
    const timePatterns = [
      /\d{1,2}:\d{2}/g,  // 14:30, 9:45
      /PT\s*[A-Z]/g,     // PT P, PT V, etc
      /P[TMP]\s*\d*/g    // PT, PM, PTM com números
    ];
    
    timePatterns.forEach(pattern => {
      const matches = html.match(pattern);
      if (matches) {
        console.log(`⏰ Horários encontrados (${pattern.source}): ${matches.slice(0, 10).join(', ')}`);
      }
    });
    
    // Procurar por nomes de loterias
    const lotteryNames = ['RIO', 'SÃO PAULO', 'FEDERAL', 'MINAS', 'GOIÁS', 'NACIONAL', 'MALUQUINHA'];
    lotteryNames.forEach(name => {
      const regex = new RegExp(name, 'gi');
      const matches = html.match(regex);
      if (matches) {
        console.log(`🏆 ${name}: ${matches.length} ocorrências`);
      }
    });
    
    return {
      success: true,
      htmlSize: html.length,
      hasDate: foundDate,
      numbers: numbers ? numbers.slice(0, 10) : [],
      url: url
    };
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    return {
      success: false,
      error: error.message,
      url: url
    };
  }
}

async function testAllSites() {
  console.log('🚀 Iniciando teste de scraping REAL com proxy...\n');
  
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
    const result = await scrapeRealWebsite(site.url, site.name);
    results.push(result);
    
    // Pequena pausa entre requisições
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('========================');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const date = result.hasDate ? '📅' : '⚠️';
    console.log(`${status} ${date} ${result.url} - ${result.success ? result.htmlSize + ' bytes' : result.error}`);
  });
  
  const successful = results.filter(r => r.success).length;
  const withDate = results.filter(r => r.hasDate).length;
  
  console.log(`\n✅ Sites acessados: ${successful}/${results.length}`);
  console.log(`📅 Sites com data de ontem: ${withDate}/${results.length}`);
}

// Executar teste
testAllSites().catch(console.error);