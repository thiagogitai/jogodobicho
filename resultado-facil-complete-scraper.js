const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

// Lista completa de bancas e estados baseada no que descobrimos
const BANCAS = [
  'maluca',
  'paratodos', 
  'federal',
  'corujinha',
  'galo',
  'centauro',
  'trovão',
  'boa-sorte',
  'loteria-federal',
  'rio',
  'sao-paulo',
  'minas',
  'bahia',
  'ceara',
  'parana',
  'goias',
  'pernambuco',
  'paraiba'
];

const ESTADOS = [
  'bahia',
  'rio', 
  'sao-paulo',
  'minas',
  'ceara',
  'parana',
  'goias',
  'pernambuco',
  'paraiba',
  'rio-grande-do-norte',
  'alagoas',
  'sergipe',
  'espirito-santo'
];

class ResultadoFacilCompleteScraper {
  constructor() {
    this.baseUrl = 'https://www.resultadofacil.com.br';
  }
  
  getUrlForDate(banca, estado, date) {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return `${this.baseUrl}/resultados-${banca}-${estado}-do-dia-${dateStr}`;
  }
  
  async scrapeResults(banca, estado, date) {
    const url = this.getUrlForDate(banca, estado, date);
    console.log(`\n🎯 Acessando: ${url}`);
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const results = {
        banca,
        estado,
        date: date.toISOString(),
        url,
        prizes: [],
        foundResults: false,
        error: null
      };
      
      // Procurar tabelas de resultados
      $('table').each((i, table) => {
        const $table = $(table);
        const headers = $table.find('th').map((j, th) => $(th).text().trim()).get();
        const rows = $table.find('tr').map((j, row) => {
          return $(row).find('td').map((k, td) => $(td).text().trim()).get();
        }).get().filter(row => row.length > 0);
        
        // Verificar se é uma tabela de resultados (tem números de 3-4 dígitos e/ou posições 1º, 2º, etc)
        const hasPrizeNumbers = headers.some(h => /(1º|2º|3º|4º|5º|6º|7º|8º|9º|10º)/i.test(h));
        const hasNumbers = headers.some(h => /\d{3,4}/.test(h)) || rows.some(row => row.some(cell => /\d{3,4}/.test(cell)));
        
        if (hasPrizeNumbers || hasNumbers) {
          console.log(`✅ Tabela ${i + 1} encontrada: ${headers.length} colunas, ${rows.length} linhas`);
          
          // Extrair resultados
          rows.forEach((row, rowIndex) => {
            if (row.length >= 2) {
              const prize = {
                position: headers[rowIndex] || `Linha ${rowIndex + 1}`,
                number: row.find(cell => /\d{3,4}/.test(cell)) || '',
                animal: row.find(cell => /[a-zA-Zà-úÀ-Ú]/i.test(cell)) || '',
                fullRow: row
              };
              
              if (prize.number) {
                results.prizes.push(prize);
              }
            }
          });
          
          results.foundResults = true;
        }
      });
      
      // Se não encontrou em tabelas, procurar em divs/elementos
      if (!results.foundResults) {
        $('div, section, article, p').each((i, el) => {
          const $el = $(el);
          const text = $el.text().trim();
          
          // Procurar por padrão: "1º 1234 - Animal"
          const resultPattern = /(1º|2º|3º|4º|5º|6º|7º|8º|9º|10º)\s*(\d{3,4})\s*[-–—]\s*([a-zA-Zà-úÀ-Ú\s]+)/gi;
          let match;
          
          while ((match = resultPattern.exec(text)) !== null) {
            results.prizes.push({
              position: match[1],
              number: match[2],
              animal: match[3].trim(),
              source: 'text'
            });
            results.foundResults = true;
          }
        });
      }
      
      await browser.close();
      
      console.log(`✅ Resultados encontrados: ${results.foundResults ? 'SIM' : 'NÃO'}`);
      console.log(`✅ Prêmios extraídos: ${results.prizes.length}`);
      
      return results;
      
    } catch (error) {
      await browser.close();
      
      return {
        banca,
        estado,
        date: date.toISOString(),
        url,
        prizes: [],
        foundResults: false,
        error: error.message
      };
    }
  }
  
  async scrapeAllForDate(date) {
    console.log(`\n🚀 INICIANDO SCRAPE COMPLETO PARA: ${date.toISOString().split('T')[0]}`);
    console.log('=' .repeat(70));
    
    const allResults = [];
    let successfulScrapes = 0;
    let failedScrapes = 0;
    
    // Testar combinações mais comuns primeiro
    const priorityCombinations = [
      { banca: 'maluca', estado: 'bahia' },
      { banca: 'paratodos', estado: 'rio' },
      { banca: 'federal', estado: 'sao-paulo' },
      { banca: 'corujinha', estado: 'minas' },
      { banca: 'maluca', estado: 'rio' },
      { banca: 'paratodos', estado: 'bahia' },
      { banca: 'federal', estado: 'rio' },
      { banca: 'galo', estado: 'sao-paulo' }
    ];
    
    // Testar combinações prioritárias
    for (const combo of priorityCombinations) {
      try {
        const result = await this.scrapeResults(combo.banca, combo.estado, date);
        allResults.push(result);
        
        if (result.foundResults) {
          successfulScrapes++;
          console.log(`✅ ${combo.banca} - ${combo.estado}: SUCESSO (${result.prizes.length} prêmios)`);
        } else {
          console.log(`⚠️  ${combo.banca} - ${combo.estado}: SEM RESULTADOS`);
        }
        
      } catch (error) {
        failedScrapes++;
        console.log(`❌ ${combo.banca} - ${combo.estado}: ERRO - ${error.message}`);
      }
      
      // Pequena pausa entre requisições
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 RESUMO DO SCRAPE:');
    console.log('=' .repeat(70));
    console.log(`Total de tentativas: ${priorityCombinations.length}`);
    console.log(`Sucessos: ${successfulScrapes}`);
    console.log(`Sem resultados: ${priorityCombinations.length - successfulScrapes - failedScrapes}`);
    console.log(`Falhas: ${failedScrapes}`);
    
    // Salvar resultados
    const output = {
      date: date.toISOString(),
      timestamp: new Date().toISOString(),
      totalCombinations: priorityCombinations.length,
      successfulScrapes,
      failedScrapes,
      results: allResults.filter(r => r.foundResults),
      allAttempts: allResults
    };
    
    const filename = `resultado-facil-complete-${date.toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(output, null, 2));
    
    console.log(`\n✅ Resultados salvos em: ${filename}`);
    
    return output;
  }
}

// Executar scraper completo
async function runCompleteScraper() {
  const scraper = new ResultadoFacilCompleteScraper();
  
  // Testar com ontem
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  try {
    const results = await scraper.scrapeAllForDate(yesterday);
    
    console.log('\n🎯 RESULTADOS ENCONTRADOS:');
    console.log('=' .repeat(70));
    
    results.results.forEach(result => {
      console.log(`\n📍 ${result.banca.toUpperCase()} - ${result.estado.toUpperCase()}`);
      console.log(`URL: ${result.url}`);
      console.log(`Prêmios: ${result.prizes.length}`);
      
      if (result.prizes.length > 0) {
        result.prizes.slice(0, 3).forEach(prize => {
          console.log(`  - ${prize.position}: ${prize.number} - ${prize.animal}`);
        });
        if (result.prizes.length > 3) {
          console.log(`  ... e mais ${result.prizes.length - 3} prêmios`);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no scraper completo:', error);
  }
}

// Executar
if (require.main === module) {
  runCompleteScraper().catch(console.error);
}

module.exports = { ResultadoFacilCompleteScraper };