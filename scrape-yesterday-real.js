const axios = require('axios');
const cheerio = require('cheerio');

// Configuração do proxy
const proxyManager = {
  proxies: [
    { host: '191.240.64.41', port: 8080, username: 'krinstinct1234', password: 'krinstinct1234' },
    { host: '191.240.64.42', port: 8080, username: 'krinstinct1234', password: 'krinstinct1234' }
  ],
  currentIndex: 0,
  
  getNextProxy() {
    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return proxy;
  },
  
  getAxiosInstance(proxy) {
    return axios.create({
      proxy: proxy ? {
        host: proxy.host,
        port: proxy.port,
        auth: {
          username: proxy.username,
          password: proxy.password
        }
      } : false,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
  }
};

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

// Função para extrair resultados de ontem
function extractYesterdayResults($, targetDate) {
  const results = [];
  
  // Procurar por elementos que contenham a data de ontem
  const dateElements = $(`*:contains("${targetDate}")`);
  
  dateElements.each((i, elem) => {
    const element = $(elem);
    const text = element.text();
    
    // Procurar números próximos a este elemento
    let searchArea = element.parent();
    if (searchArea.length === 0) searchArea = element;
    
    const numbers = extractNumbers(searchArea.text());
    const lotteryType = detectLotteryType(text);
    
    if (numbers.length >= 3 && lotteryType) {
      results.push({
        lotteryType: lotteryType,
        date: targetDate.split('/').reverse().join('-'), // Converter para formato ISO
        results: {
          first: numbers[0] || '',
          second: numbers[1] || '',
          third: numbers[2] || '',
          fourth: numbers[3] || '',
          fifth: numbers[4] || ''
        },
        source: 'scraper-real',
        status: 'active'
      });
    }
  });
  
  return results;
}

// Função principal de scraping
async function scrapeYesterdayResults() {
  console.log('🚀 Iniciando scraping dos resultados de ontem...\n');
  
  // Data de ontem no formato brasileiro
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = yesterday.toLocaleDateString('pt-BR'); // 24/11/2025
  const isoDate = yesterday.toISOString().split('T')[0]; // 2025-11-24
  
  console.log(`📅 Buscando resultados de: ${targetDate} (${isoDate})`);
  
  const allResults = [];
  const sites = [
    {
      name: 'Jogo do Bicho.net',
      url: 'https://www.jogodobicho.net',
      urlDate: `https://www.jogodobicho.net/${isoDate}`
    },
    {
      name: 'Resultado Fácil RJ',
      url: 'https://www.resultadofacil.com.br/rj',
      urlDate: `https://www.resultadofacil.com.br/rj/${isoDate}`
    },
    {
      name: 'Resultado Fácil SP', 
      url: 'https://www.resultadofacil.com.br/sp',
      urlDate: `https://www.resultadofacil.com.br/sp/${isoDate}`
    },
    {
      name: 'Deunoposte RJ',
      url: 'https://www.deunoposte.com.br',
      urlDate: `https://www.deunoposte.com.br/resultado/${isoDate}`
    },
    {
      name: 'Deunoposte SP',
      url: 'https://www.deunoposte.com.br/sp',
      urlDate: `https://www.deunoposte.com.br/sp/resultado/${isoDate}`
    }
  ];
  
  for (const site of sites) {
    console.log(`\n🌐 Acessando: ${site.name}`);
    console.log(`📍 URL: ${site.urlDate}`);
    
    try {
      const proxy = proxyManager.getNextProxy();
      const axios = proxyManager.getAxiosInstance(proxy);
      
      console.log(`🔌 Usando proxy: ${proxy.host}:${proxy.port}`);
      
      // Tentar primeiro a URL com data específica
      let response;
      try {
        response = await axios.get(site.urlDate);
        console.log(`✅ Conectado via URL com data!`);
      } catch (error) {
        console.log(`⚠️  URL com data falhou, tentando URL principal...`);
        response = await axios.get(site.url);
        console.log(`✅ Conectado via URL principal!`);
      }
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      console.log(`📄 HTML recebido: ${html.length} bytes`);
      
      // Extrair resultados de ontem
      const results = extractYesterdayResults($, targetDate);
      
      if (results.length > 0) {
        console.log(`🏆 ${results.length} resultados encontrados:`);
        results.forEach(result => {
          console.log(`   - ${result.lotteryType}: ${result.results.first}-${result.results.second}-${result.results.third}-${result.results.fourth}-${result.results.fifth}`);
        });
        allResults.push(...results);
      } else {
        console.log(`⚠️  Nenhum resultado com data ${targetDate} encontrado`);
        
        // Mostrar alguns números encontrados no HTML
        const allNumbers = extractNumbers(html);
        if (allNumbers.length > 0) {
          console.log(`   🔢 Números encontrados: ${allNumbers.slice(0, 10).join(', ')}${allNumbers.length > 10 ? '...' : ''}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
    
    // Pausa entre sites
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n📊 RESUMO FINAL:');
  console.log('==================');
  console.log(`✅ Total de resultados encontrados: ${allResults.length}`);
  
  if (allResults.length > 0) {
    console.log('\n📋 Resultados por tipo:');
    const byType = {};
    allResults.forEach(result => {
      if (!byType[result.lotteryType]) byType[result.lotteryType] = 0;
      byType[result.lotteryType]++;
    });
    
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} resultados`);
    });
  }
  
  return allResults;
}

// Executar
scrapeYesterdayResults().catch(console.error);