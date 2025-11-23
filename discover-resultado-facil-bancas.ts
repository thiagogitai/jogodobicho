import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

interface BancaInfo {
  name: string;
  urlPattern: string;
  states: string[];
  lotteryTypes: string[];
}

interface ResultadoFacilCompleteAnalysis {
  baseUrl: string;
  navigationStructure: {
    states: string[];
    bancas: BancaInfo[];
    lotteryTypes: string[];
    dateFormat: string;
  };
  urlPatterns: {
    statePattern: string;
    bancaPattern: string;
    datePattern: string;
    completePattern: string;
  };
  sampleResults: any[];
}

async function discoverBancasAndStates(): Promise<ResultadoFacilCompleteAnalysis> {
  console.log('🔍 DESCOBRINDO TODAS AS BANCAS E ESTADOS DO RESULTADO FÁCIL');
  console.log('=' .repeat(70));
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Começar pela página principal
    const mainUrl = 'https://www.resultadofacil.com.br';
    await page.goto(mainUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const analysis: ResultadoFacilCompleteAnalysis = {
      baseUrl: mainUrl,
      navigationStructure: {
        states: [],
        bancas: [],
        lotteryTypes: [],
        dateFormat: 'YYYY-MM-DD'
      },
      urlPatterns: {
        statePattern: '',
        bancaPattern: '',
        datePattern: '',
        completePattern: ''
      },
      sampleResults: []
    };
    
    console.log('📍 ANALISANDO PÁGINA PRINCIPAL...');
    
    // 1. Procurar menu de navegação ou links de estados
    const navLinks = $('nav a, header a, footer a, .menu a, .navigation a').map((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim().toLowerCase();
      
      // Procurar por estados e bancas
      const isStateLink = /(bahia|rio|são paulo|minas|ceará|paraná|goiás|pernambuco|paraíba)/i.test(text);
      const isBancaLink = /(maluca|paratodos|federal|corujinha|galo|centauro|trovão)/i.test(text);
      const isResultLink = /resultado/i.test(text) && /bicho/i.test(text);
      
      return {
        text: $(el).text().trim(),
        href,
        isStateLink,
        isBancaLink,
        isResultLink,
        fullUrl: href.startsWith('http') ? href : `${mainUrl}${href}`
      };
    }).get();
    
    console.log(`✓ Links de navegação encontrados: ${navLinks.length}`);
    
    // 2. Procurar especificamente por links de resultados por estado
    const resultLinks = $('a[href*="resultados"]').map((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      
      // Extrair padrões
      const stateMatch = href.match(/resultados-([a-z]+)/i);
      const bancaMatch = href.match(/resultados-([a-z]+)-([a-z]+)/i);
      const dateMatch = href.match(/(\d{4}-\d{2}-\d{2})/);
      
      return {
        text,
        href,
        state: stateMatch ? stateMatch[1] : '',
        banca: bancaMatch ? bancaMatch[2] : '',
        hasDate: !!dateMatch,
        fullUrl: href.startsWith('http') ? href : `${mainUrl}${href}`
      };
    }).get();
    
    console.log(`✓ Links de resultados encontrados: ${resultLinks.length}`);
    resultLinks.slice(0, 10).forEach(l => console.log(`  - ${l.text}: ${l.href}`));
    
    // 3. Acessar a URL que você forneceu para entender a estrutura
    console.log('\n📅 ANALISANDO URL DA MALUCA BAHIA...');
    const malucaUrl = 'https://www.resultadofacil.com.br/resultados-maluca-bahia-do-dia-2025-11-20';
    
    const malucaPage = await browser.newPage();
    await malucaPage.goto(malucaUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await malucaPage.waitForTimeout(3000);
    
    const malucaContent = await malucaPage.content();
    const maluca$ = cheerio.load(malucaContent);
    
    // Procurar por seletores de estado/banca
    const stateSelect = maluca$('select[name*="estado"], select[id*="estado"]').html();
    const bancaSelect = maluca$('select[name*="banca"], select[id*="banca"]').html();
    
    console.log(`✓ Seletor de estado encontrado: ${!!stateSelect}`);
    console.log(`✓ Seletor de banca encontrado: ${!!bancaSelect}`);
    
    // 4. Procurar por links de navegação na página da Maluca
    const navigationLinks = maluca$('a[href*="resultados-"]').map((i, el) => {
      const href = maluca$(el).attr('href') || '';
      const text = maluca$(el).text().trim();
      
      // Analisar padrão da URL
      const patternMatch = href.match(/resultados-([a-z]+)-?([a-z]+)?-?do-dia-?(\d{4}-\d{2}-\d{2})?/i);
      
      return {
        text,
        href,
        pattern: patternMatch ? patternMatch[0] : '',
        banca: patternMatch ? patternMatch[1] : '',
        state: patternMatch ? patternMatch[2] : '',
        fullUrl: href.startsWith('http') ? href : `${mainUrl}${href}`
      };
    }).get();
    
    console.log(`✓ Links de navegação na página Maluca: ${navigationLinks.length}`);
    
    // 5. Tentar descobrir padrões de URL
    const uniquePatterns = [...new Set(navigationLinks.map(l => l.pattern).filter(p => p))];
    console.log(`✓ Padrões únicos encontrados: ${uniquePatterns.length}`);
    uniquePatterns.slice(0, 5).forEach(p => console.log(`  - ${p}`));
    
    // 6. Criar lista de bancas e estados baseado nos padrões encontrados
    const discoveredBancas = [...new Set(navigationLinks.map(l => l.banca).filter(b => b && b.length > 2))];
    const discoveredStates = [...new Set(navigationLinks.map(l => l.state).filter(s => s && s.length > 2))];
    
    console.log(`\n📊 BANCAS DESCOBERTAS: ${discoveredBancas.length}`);
    discoveredBancas.forEach(b => console.log(`  - ${b}`));
    
    console.log(`\n📊 ESTADOS DESCOBERTOS: ${discoveredStates.length}`);
    discoveredStates.forEach(s => console.log(`  - ${s}`));
    
    // 7. Testar padrão de URL para diferentes bancas/estados
    console.log('\n🧪 TESTANDO PADRÕES DE URL...');
    
    // Padrões possíveis baseados no que encontramos
    const testPatterns = [
      'resultados-maluca-rio-do-dia-2025-11-20',
      'resultados-paratodos-sao-paulo-do-dia-2025-11-20',
      'resultados-federal-bahia-do-dia-2025-11-20',
      'resultados-corujinha-minas-do-dia-2025-11-20'
    ];
    
    for (const pattern of testPatterns) {
      const testUrl = `${mainUrl}/${pattern}`;
      try {
        const testPage = await browser.newPage();
        await testPage.goto(testUrl, { waitUntil: 'networkidle2', timeout: 15000 });
        await testPage.waitForTimeout(2000);
        
        const testContent = await testPage.content();
        const test$ = cheerio.load(testContent);
        
        const hasResults = test$('table, div[class*="result"]').length > 0;
        const title = test$('title').text();
        
        console.log(`✓ ${pattern}: ${hasResults ? 'RESULTADOS ENCONTRADOS' : 'SEM RESULTADOS'} (${title})`);
        
        await testPage.close();
      } catch (error) {
        console.log(`✗ ${pattern}: ERRO AO ACESSAR`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 8. Descobrir estrutura de resultados
    console.log('\n📋 ANALISANDO ESTRUTURA DOS RESULTADOS...');
    
    const resultElements = maluca$('table, .result, .results, [class*="bicho"]').map((i, el) => {
      const element = maluca$(el);
      const text = element.text().trim();
      const numbers = text.match(/\b\d{3,4}\b/g) || [];
      const animals = text.match(/(gato|cavalo|urso|vaca|burro|jacar[ée]|coelho|pav[ãa]o|galo|avestruz|cobra|elefante|macaco|porco|tigre)/gi) || [];
      
      return {
        tag: element.prop('tagName')?.toLowerCase(),
        className: element.attr('class') || '',
        numbersCount: numbers.length,
        animalsCount: animals.length,
        preview: text.substring(0, 100)
      };
    }).get();
    
    const validResults = resultElements.filter(r => r.numbersCount > 0);
    console.log(`✓ Elementos com números encontrados: ${validResults.length}`);
    
    // Montar análise final
    analysis.navigationStructure.states = discoveredStates;
    analysis.navigationStructure.bancas = discoveredBancas.map(banca => ({
      name: banca,
      urlPattern: `resultados-${banca}-[estado]-do-dia-[data]`,
      states: discoveredStates,
      lotteryTypes: ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º']
    }));
    analysis.navigationStructure.lotteryTypes = ['Maluca', 'Paratodos', 'Federal', 'Corujinha'];
    
    analysis.urlPatterns = {
      statePattern: '/resultados-[banca]-[estado]-do-dia-[data]',
      bancaPattern: '[banca]-[estado]-do-dia-[data]',
      datePattern: 'YYYY-MM-DD',
      completePattern: 'https://www.resultadofacil.com.br/resultados-[banca]-[estado]-do-dia-[data]'
    };
    
    analysis.sampleResults = validResults.slice(0, 3);
    
    await malucaPage.close();
    await browser.close();
    
    return analysis;
    
  } catch (error) {
    console.error('Erro na análise completa:', error);
    await browser.close();
    throw error;
  }
}

// Criar scraper definitivo para Resultado Fácil
class ResultadoFacilDefinitiveScraper {
  private baseUrl = 'https://www.resultadofacil.com.br';
  
  constructor(
    private banca: string,
    private state: string
  ) {}
  
  getUrlForDate(date: Date): string {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return `${this.baseUrl}/resultados-${this.banca}-${this.state}-do-dia-${dateStr}`;
  }
  
  async scrapeResults(date: Date): Promise<any> {
    const url = this.getUrlForDate(date);
    console.log(`Acessando: ${url}`);
    
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
        const $table = $(table);
        const headers = $table.find('th').map((j, th) => $(th).text().trim()).get();
        const rows = $table.find('tr').map((j, row) => {
          return $(row).find('td').map((k, td) => $(td).text().trim()).get();
        }).get().filter(row => row.length > 0);
        
        // Verificar se é uma tabela de resultados
        const hasPrizeNumbers = headers.some(h => /(1º|2º|3º|4º|5º|6º|7º|8º|9º|10º)/i.test(h));
        const hasNumbers = headers.some(h => /\d{3,4}/.test(h)) || rows.some(row => row.some(cell => /\d{3,4}/.test(cell)));
        
        if (hasPrizeNumbers || hasNumbers) {
          results.push({
            tableIndex: i,
            headers,
            rows,
            type: hasPrizeNumbers ? 'prizes' : 'numbers'
          });
        }
      });
      
      await browser.close();
      
      return {
        date: date.toISOString(),
        banca: this.banca,
        state: this.state,
        url,
        results,
        foundResults: results.length > 0
      };
      
    } catch (error) {
      await browser.close();
      throw error;
    }
  }
}

// Testar descoberta de bancas
async function testBancaDiscovery() {
  console.log('🚀 INICIANDO TESTE DE DESCOBERTA DE BANCAS');
  
  try {
    const analysis = await discoverBancasAndStates();
    
    // Salvar análise
    require('fs').writeFileSync('resultado-facil-complete-analysis.json', JSON.stringify(analysis, null, 2));
    
    console.log('\n📋 RELATÓRIO FINAL:');
    console.log('=' .repeat(70));
    console.log(`Base URL: ${analysis.baseUrl}`);
    console.log(`Estados encontrados: ${analysis.navigationStructure.states.length}`);
    console.log(`Bancas encontradas: ${analysis.navigationStructure.bancas.length}`);
    console.log(`Padrão URL: ${analysis.urlPatterns.completePattern}`);
    
    console.log('\n📊 BANCAS DISPONÍVEIS:');
    analysis.navigationStructure.bancas.forEach(banca => {
      console.log(`  - ${banca.name}: ${banca.urlPattern}`);
    });
    
    console.log('\n📊 ESTADOS DISPONÍVEIS:');
    analysis.navigationStructure.states.forEach(state => {
      console.log(`  - ${state}`);
    });
    
    // Testar scraper com diferentes bancas
    console.log('\n🧪 TESTANDO SCRAPER COM DIFERENTES BANCAS...');
    
    const testCases = [
      { banca: 'maluca', state: 'bahia' },
      { banca: 'paratodos', state: 'rio' },
      { banca: 'federal', state: 'sao-paulo' }
    ];
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    for (const testCase of testCases) {
      try {
        const scraper = new ResultadoFacilDefinitiveScraper(testCase.banca, testCase.state);
        const result = await scraper.scrapeResults(yesterday);
        
        console.log(`✅ ${testCase.banca} - ${testCase.state}: ${result.foundResults ? 'RESULTADOS ENCONTRADOS' : 'SEM RESULTADOS'} (${result.results.length} tabelas)`);
      } catch (error) {
        console.log(`❌ ${testCase.banca} - ${testCase.state}: ERRO`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

// Executar
if (require.main === module) {
  testBancaDiscovery().catch(console.error);
}

export { discoverBancasAndStates, ResultadoFacilDefinitiveScraper, testBancaDiscovery };