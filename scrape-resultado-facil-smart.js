const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrapeMalucaBahiaSpecific() {
  console.log('🎯 EXTRAINDO RESULTADOS MALUCA BAHIA - 20/11/2025');
  console.log('=' .repeat(70));
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    const url = 'https://www.resultadofacil.com.br/resultados-maluca-bahia-do-dia-2025-11-20';
    
    console.log(`📍 Acessando: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    console.log('\n📋 EXTRAINDO RESULTADOS...');
    
    // 1. Procurar por tabelas de resultados
    const results = {
      url: url,
      date: '20/11/2025',
      banca: 'Maluca Bahia',
      prizes: [],
      rawData: [],
      foundIn: 'unknown'
    };
    
    // Procurar em tabelas
    $('table').each((i, table) => {
      const $table = $(table);
      const headers = $table.find('th').map((j, th) => $(th).text().trim()).get();
      const rows = [];
      
      $table.find('tr').each((j, row) => {
        const rowData = [];
        $(row).find('td').each((k, td) => {
          rowData.push($(td).text().trim());
        });
        if (rowData.length > 0) {
          rows.push(rowData);
        }
      });
      
      // Verificar se é tabela de resultados
      const hasNumbers = headers.some(h => /\d{3,4}/.test(h)) || rows.some(row => row.some(cell => /\d{3,4}/.test(cell)));
      const hasPositions = headers.some(h => /(1º|2º|3º|4º|5º|6º|7º|8º|9º|10º|11º|12º|13º|14º)/i.test(h)) || rows.some(row => row.some(cell => /(1º|2º|3º|4º|5º|6º|7º|8º|9º|10º|11º|12º|13º|14º)/i.test(cell)));
      
      if (hasNumbers || hasPositions) {
        console.log(`✅ Tabela ${i + 1} encontrada:`);
        console.log(`   Headers: ${headers.join(' | ')}`);
        console.log(`   Rows: ${rows.length}`);
        
        results.foundIn = 'table';
        results.rawData.push({
          tableIndex: i,
          headers: headers,
          rows: rows
        });
        
        // Extrair prêmios específicos
        rows.forEach((row, rowIndex) => {
          // Procurar por padrões como: "1º 1234 - Gato" ou "1º 1234 Gato"
          const fullRowText = row.join(' ');
          
          // Padrões de extração
          const patterns = [
            /(1[º°]?)\s*(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
            /(2[º°]?)\s*(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
            /(3[º°]?)\s*(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
            /(4[º°]?)\s*(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
            /(5[º°]?)\s*(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
            /(6[º°]?)\s*(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
            /(7[º°]?)\s*(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
            /(8[º°]?)\s*(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
            /(9[º°]?)\s*(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
            /(10[º°]?)\s*(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i
          ];
          
          patterns.forEach(pattern => {
            const match = fullRowText.match(pattern);
            if (match) {
              results.prizes.push({
                position: match[1],
                number: match[2],
                animal: match[3].trim(),
                source: `table_${i}_row_${rowIndex}`
              });
            }
          });
        });
      }
    });
    
    // Se não encontrou em tabelas, procurar no texto geral
    if (results.prizes.length === 0) {
      console.log('🔍 Procurando no texto geral...');
      
      const pageText = $('body').text();
      
      // Procurar por padrões de resultado
      const textPatterns = [
        /(1[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi,
        /(2[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi,
        /(3[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi,
        /(4[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi,
        /(5[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi,
        /(6[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi,
        /(7[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi,
        /(8[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi,
        /(9[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi,
        /(10[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi,
        /(11[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi,
        /(12[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi,
        /(13[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi,
        /(14[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi
      ];
      
      textPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(pageText)) !== null) {
          results.prizes.push({
            position: match[1],
            number: match[2],
            animal: match[3].trim(),
            source: 'text'
          });
        }
      });
      
      results.foundIn = 'text';
    }
    
    // Se ainda não encontrou, procurar em elementos específicos
    if (results.prizes.length === 0) {
      console.log('🔍 Procurando em elementos específicos...');
      
      $('div, section, article, p, span').each((i, el) => {
        const $el = $(el);
        const text = $el.text().trim();
        
        // Procurar padrões neste elemento específico
        const elementPatterns = [
          /(1[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
          /(2[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
          /(3[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
          /(4[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
          /(5[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
          /(6[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
          /(7[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
          /(8[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
          /(9[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i,
          /(10[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/i
        ];
        
        elementPatterns.forEach(pattern => {
          const match = text.match(pattern);
          if (match) {
            results.prizes.push({
              position: match[1],
              number: match[2],
              animal: match[3].trim(),
              source: `element_${i}`,
              elementTag: $el.prop('tagName')?.toLowerCase(),
              elementClass: $el.attr('class')
            });
          }
        });
      });
      
      if (results.prizes.length > 0) {
        results.foundIn = 'elements';
      }
    }
    
    // Tirar screenshot
    await page.screenshot({ 
      path: 'maluca-bahia-results-20-11-2025.png',
      fullPage: true 
    });
    
    console.log('\n📊 RESULTADOS EXTRAÍDOS:');
    console.log('=' .repeat(50));
    console.log(`Banca: ${results.banca}`);
    console.log(`Data: ${results.date}`);
    console.log(`Fonte dos resultados: ${results.foundIn}`);
    console.log(`Total de prêmios: ${results.prizes.length}`);
    
    if (results.prizes.length > 0) {
      console.log('\n🏆 PRÊMIOS ENCONTRADOS:');
      results.prizes.forEach(prize => {
        console.log(`   ${prize.position} ${prize.number} - ${prize.animal} (${prize.source})`);
      });
    } else {
      console.log('\n❌ NENHUM PRÊMIO ENCONTRADO');
      console.log('Dados brutos salvos para análise...');
    }
    
    // Salvar resultados completos
    const output = {
      ...results,
      timestamp: new Date().toISOString(),
      screenshot: 'maluca-bahia-results-20-11-2025.png'
    };
    
    fs.writeFileSync('maluca-bahia-complete-results.json', JSON.stringify(output, null, 2));
    
    console.log('\n✅ Resultados salvos em:');
    console.log('   - maluca-bahia-complete-results.json');
    console.log('   - maluca-bahia-results-20-11-2025.png');
    
    await browser.close();
    
    return results;
    
  } catch (error) {
    console.error('❌ Erro ao extrair resultados:', error);
    await browser.close();
    throw error;
  }
}

// Criar scraper genérico para Resultado Fácil
class ResultadoFacilSmartScraper {
  constructor() {
    this.baseUrl = 'https://www.resultadofacil.com.br';
  }
  
  async scrapeBancaForDate(banca, estado, date) {
    const dateStr = date.split('/').reverse().join('-'); // DD/MM/YYYY -> YYYY-MM-DD
    const url = `${this.baseUrl}/resultados-${banca}-${estado}-do-dia-${dateStr}`;
    
    console.log(`\n🎯 Scraping: ${banca} - ${estado} - ${date}`);
    console.log(`URL: ${url}`);
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const results = {
        banca: banca,
        estado: estado,
        date: date,
        url: url,
        prizes: [],
        foundResults: false,
        error: null
      };
      
      // Procurar por padrões de resultado em todo o conteúdo
      const pageText = $('body').text();
      
      // Padrão para extrair: "1º 1234 - Animal"
      const resultPattern = /(\d{1,2}[º°]?)\s*(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi;
      let match;
      
      while ((match = resultPattern.exec(pageText)) !== null) {
        const animal = match[3].trim();
        // Verificar se é um animal válido (mais de 2 letras, não é apenas número)
        if (animal.length > 2 && !/^\d+$/.test(animal)) {
          results.prizes.push({
            position: match[1],
            number: match[2],
            animal: animal,
            source: 'text_pattern'
          });
        }
      }
      
      // Procurar em tabelas também
      $('table').each((i, table) => {
        const $table = $(table);
        const rows = [];
        
        $table.find('tr').each((j, row) => {
          const rowData = [];
          $(row).find('td').each((k, td) => {
            rowData.push($(td).text().trim());
          });
          if (rowData.length > 0) {
            rows.push(rowData);
          }
        });
        
        // Procurar padrões em cada linha
        rows.forEach((row, rowIndex) => {
          const rowText = row.join(' ');
          const tablePattern = /(\d{1,2}[º°]?)\s*(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi;
          let tableMatch;
          
          while ((tableMatch = tablePattern.exec(rowText)) !== null) {
            const animal = tableMatch[3].trim();
            if (animal.length > 2 && !/^\d+$/.test(animal)) {
              results.prizes.push({
                position: tableMatch[1],
                number: tableMatch[2],
                animal: animal,
                source: `table_${i}_row_${rowIndex}`
              });
            }
          }
        });
      });
      
      results.foundResults = results.prizes.length > 0;
      
      console.log(`✅ Prêmios encontrados: ${results.prizes.length}`);
      if (results.prizes.length > 0) {
        results.prizes.slice(0, 5).forEach(prize => {
          console.log(`   ${prize.position} ${prize.number} - ${prize.animal}`);
        });
        if (results.prizes.length > 5) {
          console.log(`   ... e mais ${results.prizes.length - 5} prêmios`);
        }
      }
      
      await browser.close();
      return results;
      
    } catch (error) {
      await browser.close();
      return {
        banca: banca,
        estado: estado,
        date: date,
        url: url,
        prizes: [],
        foundResults: false,
        error: error.message
      };
    }
  }
}

// Testar scraper inteligente
async function testSmartScraper() {
  console.log('\n🚀 TESTANDO SCRAPER INTELIGENTE');
  console.log('=' .repeat(70));
  
  const scraper = new ResultadoFacilSmartScraper();
  
  // Testar com a data que você forneceu
  const testCases = [
    { banca: 'maluca', estado: 'bahia', date: '20/11/2025' },
    { banca: 'paratodos', estado: 'rio', date: '20/11/2025' },
    { banca: 'federal', estado: 'sao-paulo', date: '20/11/2025' },
    { banca: 'corujinha', estado: 'minas', date: '20/11/2025' }
  ];
  
  const allResults = [];
  
  for (const testCase of testCases) {
    try {
      const result = await scraper.scrapeBancaForDate(testCase.banca, testCase.estado, testCase.date);
      allResults.push(result);
      
      console.log(`\n📊 ${testCase.banca.toUpperCase()} - ${testCase.estado.toUpperCase()}: ${result.foundResults ? '✅ SUCESSO' : '❌ SEM RESULTADOS'}`);
      
    } catch (error) {
      console.log(`\n❌ ${testCase.banca.toUpperCase()} - ${testCase.estado.toUpperCase()}: ERRO - ${error.message}`);
    }
    
    // Pequena pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Salvar todos os resultados
  const output = {
    timestamp: new Date().toISOString(),
    testDate: '20/11/2025',
    totalTested: testCases.length,
    successful: allResults.filter(r => r.foundResults).length,
    results: allResults.filter(r => r.foundResults),
    allResults: allResults
  };
  
  fs.writeFileSync('resultado-facil-smart-scraper-test.json', JSON.stringify(output, null, 2));
  
  console.log('\n📊 RESUMO FINAL:');
  console.log('=' .repeat(70));
  console.log(`Total testado: ${testCases.length}`);
  console.log(`Sucessos: ${output.successful}`);
  console.log(`Falhas: ${testCases.length - output.successful}`);
  
  if (output.successful > 0) {
    console.log('\n✅ BANCAS COM RESULTADOS:');
    output.results.forEach(result => {
      console.log(`   - ${result.banca.toUpperCase()} ${result.estado.toUpperCase()}: ${result.prizes.length} prêmios`);
    });
  }
  
  return output;
}

// Executar
if (require.main === module) {
  // Primeiro extrair especificamente a Maluca Bahia
  scrapeMalucaBahiaSpecific()
    .then(() => {
      // Depois testar o scraper inteligente
      return testSmartScraper();
    })
    .then(() => {
      console.log('\n✅ Todos os testes concluídos!');
    })
    .catch(error => {
      console.error('❌ Erro:', error);
    });
}

module.exports = { scrapeMalucaBahiaSpecific, ResultadoFacilSmartScraper, testSmartScraper };