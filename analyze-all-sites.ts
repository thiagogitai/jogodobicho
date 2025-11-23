import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

interface SiteAnalysis {
  url: string;
  lotteryTypes: string[];
  resultStructure: {
    selector: string;
    format: string;
    prizesCount: number;
    digits: number;
  };
  foundElements: any[];
  screenshot?: string;
}

async function analyzeSite(url: string, siteName: string): Promise<SiteAnalysis> {
  console.log(`\n=== ANALISANDO ${siteName.toUpperCase()}: ${url} ===`);
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Esperar um pouco para carregar conteúdo dinâmico
    await page.waitForTimeout(3000);
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const analysis: SiteAnalysis = {
      url,
      lotteryTypes: [],
      resultStructure: { selector: '', format: '', prizesCount: 0, digits: 0 },
      foundElements: []
    };
    
    // Procurar por diferentes estruturas de resultados
    
    // 1. Tabelas com resultados
    const tables = $('table').map((i, el) => {
      const headers = $(el).find('th, td').map((j, cell) => $(cell).text().trim()).get();
      const rows = $(el).find('tr').map((j, row) => {
        return $(row).find('td').map((k, cell) => $(cell).text().trim()).get();
      }).get();
      
      return {
        type: 'table',
        headers: headers.slice(0, 10), // Limitar para não poluir
        rows: rows.slice(0, 5), // Limitar para não poluir
        elementCount: $(el).find('td').length
      };
    }).get();
    
    // 2. Divs com classes que contenham "result", "bicho", "loteria"
    const resultDivs = $('div[class*="result"], div[class*="bicho"], div[class*="loteria"], div[class*="premio"]').map((i, el) => {
      const text = $(el).text().trim();
      const classes = $(el).attr('class') || '';
      
      // Procurar por padrões de números (3-4 dígitos)
      const numberMatches = text.match(/\b\d{3,4}\b/g) || [];
      
      return {
        type: 'div',
        classes,
        text: text.substring(0, 200), // Limitar texto
        numbersFound: numberMatches,
        numbersCount: numberMatches.length
      };
    }).get();
    
    // 3. Spans e elementos com texto de resultado
    const resultSpans = $('span, p, li').filter((i, el) => {
      const text = $(el).text();
      return /\b\d{3,4}\b.*(?:gato|cavalo|urso|vaca|burro|jacar[ée]|coelho|pav[ãa]o|galo|etc)/i.test(text);
    }).map((i, el) => {
      const text = $(el).text().trim();
      const numberMatches = text.match(/\b\d{3,4}\b/g) || [];
      const animalMatches = text.match(/(?:gato|cavalo|urso|vaca|burro|jacar[ée]|coelho|pav[ãa]o|galo|avestruz|cobra|elefante|galo|macaco|porco|tigre)/gi) || [];
      
      return {
        type: $(el).prop('tagName')?.toLowerCase(),
        text: text.substring(0, 150),
        numbers: numberMatches,
        animals: animalMatches,
        hasCompletePattern: numberMatches.length > 0 && animalMatches.length > 0
      };
    }).get();
    
    // 4. Procurar por loterias específicas mencionadas
    const lotteryKeywords = ['PPT', 'PTM', 'PT', 'PTV', 'FED', 'COR', 'FEDERAL', 'RIO', 'SÃO PAULO', 'MINAS', 'CEARÁ', 'BAHIA', 'PARANÁ'];
    const foundLotteries: string[] = [];
    
    lotteryKeywords.forEach(keyword => {
      if (content.toUpperCase().includes(keyword)) {
        foundLotteries.push(keyword);
      }
    });
    
    // 5. Procurar por datas (especialmente ontem)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateFormats = [
      yesterday.toLocaleDateString('pt-BR'),
      yesterday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      yesterday.toLocaleDateString('pt-BR', { weekday: 'long' })
    ];
    
    const foundDates = dateFormats.filter(date => content.includes(date));
    
    analysis.lotteryTypes = foundLotteries;
    analysis.foundElements = [
      ...tables.filter(t => t.elementCount > 0),
      ...resultDivs.filter(d => d.numbersCount > 0),
      ...resultSpans.filter(s => s.hasCompletePattern)
    ];
    
    console.log(`✓ Loterias encontradas: ${foundLotteries.join(', ')}`);
    console.log(`✓ Datas de ontem encontradas: ${foundDates.join(', ')}`);
    console.log(`✓ Tabelas com dados: ${tables.filter(t => t.elementCount > 0).length}`);
    console.log(`✓ Divs com resultados: ${resultDivs.filter(d => d.numbersCount > 0).length}`);
    console.log(`✓ Elementos com padrão completo: ${resultSpans.filter(s => s.hasCompletePattern).length}`);
    
    // Tirar screenshot para análise visual
    const screenshot = await page.screenshot({ encoding: 'base64', fullPage: true });
    analysis.screenshot = screenshot as string;
    
    await browser.close();
    return analysis;
    
  } catch (error) {
    console.error(`Erro ao analisar ${siteName}:`, error);
    await browser.close();
    return {
      url,
      lotteryTypes: [],
      resultStructure: { selector: '', format: '', prizesCount: 0, digits: 0 },
      foundElements: []
    };
  }
}

// Lista de sites para analisar
const sitesToAnalyze = [
  { name: 'deunoposte', url: 'https://www.ojogodobicho.com/deu_no_poste.htm' },
  { name: 'resultado_facil', url: 'https://amp.resultadofacil.com.br/horarios-jogo-do-bicho' },
  { name: 'meujogodobicho', url: 'https://www.meujogodobicho.com.br' },
  { name: 'bichocerto', url: 'https://www.bichocerto.com' },
  { name: 'resultadojogobicho', url: 'https://www.resultadojogobicho.com' },
  { name: 'resultadonacional', url: 'https://www.resultadonacional.com' },
  { name: 'lookloterias', url: 'https://lookloterias.com' },
  { name: 'gigabicho', url: 'https://www.gigabicho.com.br' },
  { name: 'portalbrasil', url: 'https://www.portalbrasil.net/jogodobicho/' }
];

async function analyzeAllSites() {
  console.log('🚀 INICIANDO ANÁLISE COMPLETA DOS SITES DE JOGO DO BICHO');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const site of sitesToAnalyze) {
    try {
      const analysis = await analyzeSite(site.url, site.name);
      results.push({
        site: site.name,
        url: site.url,
        ...analysis
      });
      
      // Salvar resultado parcial
      const fs = require('fs');
      fs.writeFileSync(`analysis-${site.name}.json`, JSON.stringify(analysis, null, 2));
      
    } catch (error) {
      console.error(`Erro crítico ao analisar ${site.name}:`, error);
    }
    
    // Pequena pausa entre análises
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Salvar relatório completo
  const fs = require('fs');
  fs.writeFileSync('complete-site-analysis.json', JSON.stringify(results, null, 2));
  
  console.log('\n📊 RELATÓRIO FINAL:');
  console.log('=' .repeat(60));
  results.forEach(result => {
    console.log(`\n📍 ${result.site.toUpperCase()}`);
    console.log(`URL: ${result.url}`);
    console.log(`Loterias: ${result.lotteryTypes.join(', ') || 'Nenhuma encontrada'}`);
    console.log(`Elementos encontrados: ${result.foundElements.length}`);
    console.log(`Screenshot salvo: analysis-${result.site}.json`);
  });
  
  return results;
}

// Executar análise
if (require.main === module) {
  analyzeAllSites().catch(console.error);
}

export { analyzeSite, analyzeAllSites };