const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

// Testar com a data que você forneceu (20/11/2025)
async function testSpecificDate() {
  console.log('🎯 TESTANDO COM A DATA QUE VOCÊ FORNECEU: 20/11/2025');
  console.log('=' .repeat(70));
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // URL exata que você forneceu
    const url = 'https://www.resultadofacil.com.br/resultados-maluca-bahia-do-dia-2025-11-20';
    
    console.log(`📍 Acessando: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    console.log('\n📋 ANALISANDO CONTEÚDO DA PÁGINA...');
    
    // 1. Verificar se tem a estrutura que você mencionou (Maluca Bahia)
    const pageTitle = $('title').text();
    const pageText = $('body').text();
    
    console.log(`✅ Título da página: ${pageTitle}`);
    console.log(`✅ Contém "Maluca": ${pageText.toLowerCase().includes('maluca')}`);
    console.log(`✅ Contém "Bahia": ${pageText.toLowerCase().includes('bahia')}`);
    console.log(`✅ Contém data 20/11: ${pageText.includes('20') && pageText.includes('11')}`);
    
    // 2. Procurar tabelas de resultados especificamente
    const tables = $('table').map((i, table) => {
      const $table = $(table);
      const headers = $table.find('th').map((j, th) => $(th).text().trim()).get();
      const rows = $table.find('tr').map((j, row) => {
        return $(row).find('td').map((k, td) => $(td).text().trim()).get();
      }).get().filter(row => row.length > 0);
      
      // Verificar se é tabela de resultados
      const hasNumbers = headers.some(h => /\d{3,4}/.test(h)) || rows.some(row => row.some(cell => /\d{3,4}/.test(cell)));
      const hasPositions = headers.some(h => /(1º|2º|3º|4º|5º|6º|7º|8º|9º|10º|11º|12º|13º|14º)/i.test(h));
      const hasAnimals = headers.some(h => /(gato|cavalo|urso|vaca|burro|jacar[ée]|coelho|pav[ãa]o|galo|avestruz|cobra|elefante|macaco|porco|tigre)/i.test(h));
      
      return {
        tableIndex: i,
        headers: headers.slice(0, 10), // Limitar para não poluir
        rows: rows.slice(0, 5), // Limitar para não poluir
        hasNumbers,
        hasPositions,
        hasAnimals,
        totalRows: rows.length,
        totalHeaders: headers.length
      };
    }).get();
    
    const resultTables = tables.filter(t => t.hasNumbers || t.hasPositions);
    
    console.log(`\n✅ Tabelas encontradas: ${tables.length}`);
    console.log(`✅ Tabelas com resultados: ${resultTables.length}`);
    
    // 3. Mostrar detalhes das tabelas com resultados
    resultTables.forEach(table => {
      console.log(`\n📊 Tabela ${table.tableIndex + 1}:`);
      console.log(`   Cabeçalhos: ${table.headers.join(' | ')}`);
      console.log(`   Linhas: ${table.totalRows}`);
      console.log(`   Tem números: ${table.hasNumbers}`);
      console.log(`   Tem posições: ${table.hasPositions}`);
      console.log(`   Tem animais: ${table.hasAnimals}`);
      
      // Mostrar primeiras linhas como exemplo
      if (table.rows.length > 0) {
        console.log(`   Exemplo de linha: ${table.rows[0].join(' | ')}`);
      }
    });
    
    // 4. Procurar por texto específico de resultados
    console.log('\n🔍 PROCURANDO POR PADRÕES DE RESULTADOS NO TEXTO...');
    
    // Procurar por: "1º 1234 - Animal" ou "1º 1234 Animal"
    const resultPatterns = [
      /(1[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi,
      /(2[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi,
      /(3[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi,
      /(4[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi,
      /(5[º°]\s*)(\d{3,4})\s*[-–—]?\s*([a-zA-Zà-úÀ-Ú\s]+)/gi
    ];
    
    const foundResults = [];
    
    resultPatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(pageText)) !== null) {
        foundResults.push({
          position: match[1].trim(),
          number: match[2],
          animal: match[3].trim(),
          patternIndex: index + 1
        });
      }
    });
    
    console.log(`\n✅ Resultados encontrados no texto: ${foundResults.length}`);
    foundResults.slice(0, 10).forEach(result => {
      console.log(`   ${result.position} ${result.number} - ${result.animal}`);
    });
    
    // 5. Procurar em elementos específicos
    console.log('\n🔍 PROCURANDO EM ELEMENTOS ESPECÍFICOS...');
    
    const specificElements = $('div[class*="result"], div[class*="bicho"], div[class*="loteria"], section[class*="result"]').map((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      const numbers = text.match(/\b\d{3,4}\b/g) || [];
      const animals = text.match(/(gato|cavalo|urso|vaca|burro|jacar[ée]|coelho|pav[ãa]o|galo|avestruz|cobra|elefante|macaco|porco|tigre)/gi) || [];
      
      return {
        element: $el.prop('tagName')?.toLowerCase(),
        className: $el.attr('class'),
        numbersCount: numbers.length,
        animalsCount: animals.length,
        preview: text.substring(0, 150),
        hasCompletePattern: numbers.length > 0 && animals.length > 0
      };
    }).get();
    
    const validElements = specificElements.filter(el => el.hasCompletePattern || el.numbersCount > 0);
    
    console.log(`✅ Elementos com resultados: ${validElements.length}`);
    validElements.slice(0, 3).forEach(el => {
      console.log(`\n   Elemento: ${el.element}`);
      console.log(`   Classe: ${el.className}`);
      console.log(`   Números: ${el.numbersCount}`);
      console.log(`   Animais: ${el.animalsCount}`);
      console.log(`   Preview: ${el.preview}`);
    });
    
    // 6. Tirar screenshot para análise visual
    console.log('\n📸 TIRANDO SCREENSHOT PARA ANÁLISE...');
    await page.screenshot({ 
      path: 'resultado-facil-maluca-bahia-2025-11-20.png',
      fullPage: true 
    });
    
    console.log('✅ Screenshot salvo: resultado-facil-maluca-bahia-2025-11-20.png');
    
    // 7. Criar relatório completo
    const report = {
      url: url,
      date: '2025-11-20',
      analysis: {
        title: pageTitle,
        hasMaluca: pageText.toLowerCase().includes('maluca'),
        hasBahia: pageText.toLowerCase().includes('bahia'),
        hasDate: pageText.includes('20') && pageText.includes('11'),
        tablesFound: tables.length,
        resultTablesFound: resultTables.length,
        textResultsFound: foundResults.length,
        elementResultsFound: validElements.length
      },
      resultTables: resultTables,
      textResults: foundResults.slice(0, 10),
      elementResults: validElements.slice(0, 3),
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('resultado-facil-maluca-bahia-analysis.json', JSON.stringify(report, null, 2));
    
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log('=' .repeat(70));
    console.log(`URL: ${url}`);
    console.log(`Data: 20/11/2025`);
    console.log(`Título: ${pageTitle}`);
    console.log(`Tabelas de resultados: ${resultTables.length}`);
    console.log(`Resultados no texto: ${foundResults.length}`);
    console.log(`Resultados em elementos: ${validElements.length}`);
    console.log(`Screenshot: resultado-facil-maluca-bahia-2025-11-20.png`);
    console.log(`Relatório: resultado-facil-maluca-bahia-analysis.json`);
    
    await browser.close();
    
    return report;
    
  } catch (error) {
    console.error('❌ Erro ao analisar:', error);
    await browser.close();
    throw error;
  }
}

// Testar também com outras datas e bancas
async function testMultipleUrls() {
  console.log('\n🚀 TESTANDO MÚLTIPLAS URLS DO RESULTADO FÁCIL');
  console.log('=' .repeat(70));
  
  const testUrls = [
    'https://www.resultadofacil.com.br/resultados-maluca-bahia-do-dia-2025-11-20',
    'https://www.resultadofacil.com.br/resultados-paratodos-rio-do-dia-2025-11-20',
    'https://www.resultadofacil.com.br/resultados-federal-sao-paulo-do-dia-2025-11-20',
    'https://www.resultadofacil.com.br/resultados-corujinha-minas-do-dia-2025-11-20'
  ];
  
  const browser = await puppeteer.launch({ headless: false });
  const results = [];
  
  for (const url of testUrls) {
    try {
      console.log(`\n📍 Testando: ${url}`);
      
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // Verificar rapidamente se tem resultados
      const hasTables = $('table').length > 0;
      const hasNumbers = /\b\d{3,4}\b/.test(content);
      const hasAnimals = /(gato|cavalo|urso|vaca|burro|jacar[ée]|coelho|pav[ãa]o|galo)/i.test(content);
      
      results.push({
        url,
        hasTables,
        hasNumbers,
        hasAnimals,
        title: $('title').text(),
        status: hasTables && hasNumbers ? 'RESULTADOS ENCONTRADOS' : hasTables ? 'TABELAS MAS SEM NÚMEROS' : 'SEM TABELAS'
      });
      
      console.log(`   Status: ${results[results.length - 1].status}`);
      console.log(`   Tabelas: ${hasTables}, Números: ${hasNumbers}, Animais: ${hasAnimals}`);
      
      await page.close();
      
    } catch (error) {
      results.push({
        url,
        error: error.message,
        status: 'ERRO'
      });
      console.log(`   Status: ERRO - ${error.message}`);
    }
    
    // Pequena pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  await browser.close();
  
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('=' .repeat(70));
  results.forEach(result => {
    console.log(`${result.url.split('/').pop()}: ${result.status}`);
  });
  
  return results;
}

// Executar testes
async function runAllTests() {
  try {
    // Testar a URL específica que você forneceu
    await testSpecificDate();
    
    // Testar múltiplas URLs
    await testMultipleUrls();
    
    console.log('\n✅ Todos os testes concluídos!');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
  }
}

if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testSpecificDate, testMultipleUrls };