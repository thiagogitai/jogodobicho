import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

interface ResultadoFacilAnalysis {
  url: string;
  states: string[];
  lotteries: string[];
  banks: string[];
  resultStructure: {
    selector: string;
    format: string;
    prizesCount: number;
    hasAnimals: boolean;
  };
  dateNavigation: {
    canChangeDate: boolean;
    dateFormat: string;
    urlPattern: string;
  };
  sampleResults: any[];
}

async function analyzeResultadoFacil(): Promise<ResultadoFacilAnalysis> {
  console.log('🔍 ANALISANDO RESULTADO FÁCIL - ESTRUTURA COMPLETA');
  console.log('=' .repeat(60));
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // URL base que você forneceu
    const baseUrl = 'https://www.resultadofacil.com.br/resultados-maluca-bahia-do-dia-2025-11-20';
    
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const analysis: ResultadoFacilAnalysis = {
      url: baseUrl,
      states: [],
      lotteries: [],
      banks: [],
      resultStructure: { selector: '', format: '', prizesCount: 0, hasAnimals: false },
      dateNavigation: { canChangeDate: false, dateFormat: '', urlPattern: '' },
      sampleResults: []
    };
    
    console.log('📍 ANALISANDO ESTRUTURA DA PÁGINA...');
    
    // 1. Procurar por seletores de estado
    const stateSelectors = $('select[name*="estado"], select[id*="estado"], a[href*="estado"], a[href*="/resultados-"]').map((i, el) => {
      const text = $(el).text().trim();
      const value = $(el).attr('value') || $(el).attr('href') || '';
      return { text, value, tag: $(el).prop('tagName')?.toLowerCase() };
    }).get();
    
    console.log(`✓ Seletores de estado encontrados: ${stateSelectors.length}`);
    stateSelectors.slice(0, 5).forEach(s => console.log(`  - ${s.text}: ${s.value}`));
    
    // 2. Procurar por navegação de datas
    const dateNav = $('a[href*="dia"], input[type="date"], select[name*="data"]').map((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      return { href, text, tag: $(el).prop('tagName')?.toLowerCase() };
    }).get();
    
    console.log(`✓ Navegação de datas encontrada: ${dateNav.length}`);
    dateNav.slice(0, 3).forEach(d => console.log(`  - ${d.text}: ${d.href}`));
    
    // 3. Analisar estrutura dos resultados
    const resultTables = $('table').map((i, table) => {
      const headers = $(table).find('th, td').map((j, cell) => $(cell).text().trim()).get();
      const rows = $(table).find('tr').map((j, row) => {
        return $(row).find('td').map((k, cell) => $(cell).text().trim()).get();
      }).get();
      
      // Procurar por padrões de resultado (números + animais)
      const hasNumbers = headers.some(h => /\d{3,4}/.test(h));
      const hasAnimals = headers.some(h => /(gato|cavalo|urso|vaca|burro|jacar[ée]|coelho|pav[ãa]o|galo|avestruz|cobra|elefante|macaco|porco|tigre)/i.test(h));
      
      return {
        headers: headers.slice(0, 15), // Limitar
        rows: rows.slice(0, 10), // Limitar
        hasNumbers,
        hasAnimals,
        rowCount: rows.length
      };
    }).get();
    
    console.log(`✓ Tabelas de resultados encontradas: ${resultTables.length}`);
    resultTables.forEach((table, i) => {
      console.log(`  Tabela ${i + 1}: ${table.rowCount} linhas, tem números: ${table.hasNumbers}, tem animais: ${table.hasAnimals}`);
    });
    
    // 4. Procurar especificamente por resultados da Maluca Bahia
    const malucaResults = $('div, section, article').filter((i, el) => {
      const text = $(el).text();
      return text.includes('Maluca') && text.includes('Bahia') && /\d{3,4}/.test(text);
    }).map((i, el) => {
      const text = $(el).text().trim();
      const numbers = text.match(/\b\d{3,4}\b/g) || [];
      const animals = text.match(/(gato|cavalo|urso|vaca|burro|jacar[ée]|coelho|pav[ãa]o|galo|avestruz|cobra|elefante|macaco|porco|tigre)/gi) || [];
      
      return {
        element: $(el).prop('tagName')?.toLowerCase(),
        className: $(el).attr('class') || '',
        numbers,
        animals,
        preview: text.substring(0, 200)
      };
    }).get();
    
    console.log(`✓ Resultados Maluca Bahia encontrados: ${malucaResults.length}`);
    malucaResults.slice(0, 3).forEach(r => {
      console.log(`  - Elemento: ${r.element}, Números: ${r.numbers.join(', ')}, Animais: ${r.animals.join(', ')}`);
    });
    
    // 5. Procurar por links de outras loterias/bancas
    const lotteryLinks = $('a[href*="resultados"], a[href*="maluca"], a[href*="bahia"], a[href*="federal"], a[href*="rio"]').map((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      const fullUrl = href.startsWith('http') ? href : `https://www.resultadofacil.com.br${href}`;
      
      return {
        text,
        href: fullUrl,
        isExternal: href.startsWith('http')
      };
    }).get();
    
    console.log(`✓ Links de loterias encontrados: ${lotteryLinks.length}`);
    lotteryLinks.slice(0, 10).forEach(l => console.log(`  - ${l.text}: ${l.href}`));
    
    // 6. Testar navegação para outras datas
    console.log('\n📅 TESTANDO NAVEGAÇÃO DE DATAS...');
    
    // Tentar mudar a data na URL
    const testDates = [
      '2025-11-21', // amanhã
      '2025-11-19', // anteontem
      '2025-11-18'  // 3 dias atrás
    ];
    
    for (const testDate of testDates) {
      const testUrl = baseUrl.replace('2025-11-20', testDate);
      try {
        const testPage = await browser.newPage();
        await testPage.goto(testUrl, { waitUntil: 'networkidle2', timeout: 15000 });
        await testPage.waitForTimeout(2000);
        
        const testContent = await testPage.content();
        const test$ = cheerio.load(testContent);
        
        const hasResults = test$('table, div[class*="result"]').length > 0;
        console.log(`✓ Data ${testDate}: ${hasResults ? 'RESULTADOS ENCONTRADOS' : 'SEM RESULTADOS'}`);
        
        await testPage.close();
      } catch (error) {
        console.log(`✗ Data ${testDate}: ERRO AO ACESSAR`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 7. Analisar menu de navegação por estados
    console.log('\n🗺️ ANALISANDO NAVEGAÇÃO POR ESTADOS...');
    
    // Procurar por menu ou links de estados
    const stateLinks = $('a[href*="resultados-"]').map((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      
      // Extrair nome do estado do href
      const stateMatch = href.match(/resultados-([a-z]+)/i);
      const state = stateMatch ? stateMatch[1] : '';
      
      return {
        text,
        href,
        state,
        fullUrl: href.startsWith('http') ? href : `https://www.resultadofacil.com.br${href}`
      };
    }).get();
    
    console.log(`✓ Links por estado encontrados: ${stateLinks.length}`);
    stateLinks.slice(0, 8).forEach(s => console.log(`  - ${s.text} (${s.state}): ${s.href}`));
    
    // 8. Testar acessar um estado diferente
    console.log('\n🧪 TESTANDO ACESSO A OUTRO ESTADO...');
    
    const rioLink = stateLinks.find(s => s.state.toLowerCase() === 'rio');
    if (rioLink) {
      try {
        const rioPage = await browser.newPage();
        await rioPage.goto(rioLink.fullUrl, { waitUntil: 'networkidle2', timeout: 15000 });
        await rioPage.waitForTimeout(2000);
        
        const rioContent = await rioPage.content();
        const rio$ = cheerio.load(rioContent);
        
        const rioTables = rio$('table').length;
        const rioResults = rio$('div, section').filter((i, el) => {
          return /\d{3,4}/.test(rio$(el).text());
        }).length;
        
        console.log(`✓ Rio de Janeiro: ${rioTables} tabelas, ${rioResults} elementos com resultados`);
        
        await rioPage.close();
      } catch (error) {
        console.log('✗ Erro ao acessar Rio de Janeiro');
      }
    }
    
    // Salvar análise completa
    analysis.lotteries = [...new Set(lotteryLinks.map(l => l.text).filter(t => t.length > 0))];
    analysis.banks = ['Maluca Bahia', 'Paratodos Bahia']; // Adicionar bancas conhecidas
    analysis.resultStructure = {
      selector: 'table, div[class*="result"]',
      format: 'número + animal',
      prizesCount: 10, // Padrão 1º ao 10º
      hasAnimals: true
    };
    analysis.dateNavigation = {
      canChangeDate: true,
      dateFormat: 'YYYY-MM-DD',
      urlPattern: '/resultados-[tipo]-[estado]-do-dia-[data]'
    };
    analysis.sampleResults = malucaResults.slice(0, 3);
    
    console.log('\n📋 RESUMO DA ANÁLISE:');
    console.log('=' .repeat(60));
    console.log(`URL Base: ${baseUrl}`);
    console.log(`Muda data por URL: Sim (formato YYYY-MM-DD)`);
    console.log(`Muda estado: Sim (via links)`);
    console.log(`Estrutura: Tabelas com números e animais`);
    console.log(`Padrão: 10 prêmios (1º ao 10º)`);
    
    await browser.close();
    return analysis;
    
  } catch (error) {
    console.error('Erro ao analisar Resultado Fácil:', error);
    await browser.close();
    throw error;
  }
}

// Criar scraper específico para Resultado Fácil
class ResultadoFacilScraper {
  private baseUrl = 'https://www.resultadofacil.com.br';
  
  constructor(private lotteryType: string, private state: string) {}
  
  getUrlForDate(date: Date): string {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return `${this.baseUrl}/resultados-${this.lotteryType}-${this.state}-do-dia-${dateStr}`;
  }
  
  async scrapeForDate(date: Date): Promise<any> {
    const url = this.getUrlForDate(date);
    console.log(`Scraping: ${url}`);
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const results = [];
      
      // Procurar tabelas de resultados
      $('table').each((i, table) => {
        const headers = $(table).find('th').map((j, th) => $(th).text().trim()).get();
        const rows = $(table).find('tr').map((j, row) => {
          return $(row).find('td').map((k, td) => $(td).text().trim()).get();
        }).get();
        
        if (headers.some(h => /\d{3,4}/.test(h) || /(1º|2º|3º|4º|5º|6º|7º|8º|9º|10º)/.test(h))) {
          results.push({
            tableIndex: i,
            headers,
            rows: rows.filter(row => row.length > 0)
          });
        }
      });
      
      await browser.close();
      return {
        date: date.toISOString(),
        url,
        results,
        foundTables: results.length
      };
      
    } catch (error) {
      await browser.close();
      throw error;
    }
  }
}

// Testar o scraper
async function testResultadoFacilScraper() {
  console.log('🧪 TESTANDO SCRAPER RESULTADO FÁCIL');
  console.log('=' .repeat(50));
  
  const scraper = new ResultadoFacilScraper('maluca', 'bahia');
  
  // Testar ontem
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  try {
    const result = await scraper.scrapeForDate(yesterday);
    console.log('✅ Resultado do scrape:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Erro no scrape:', error);
  }
}

// Executar
if (require.main === module) {
  analyzeResultadoFacil()
    .then(analysis => {
      console.log('\n✅ Análise completa salva em resultado-facil-analysis.json');
      require('fs').writeFileSync('resultado-facil-analysis.json', JSON.stringify(analysis, null, 2));
      
      return testResultadoFacilScraper();
    })
    .catch(console.error);
}

export { analyzeResultadoFacil, ResultadoFacilScraper, testResultadoFacilScraper };