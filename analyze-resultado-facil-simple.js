const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

async function analyzeResultadoFacil() {
  console.log('🔍 ANALISANDO RESULTADO FÁCIL - ESTRUTURA DE BANCAS E ESTADOS');
  console.log('=' .repeat(70));
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Começar pela URL que você forneceu
    const malucaUrl = 'https://www.resultadofacil.com.br/resultados-maluca-bahia-do-dia-2025-11-20';
    
    await page.goto(malucaUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    console.log('📍 ANALISANDO ESTRUTURA DA PÁGINA...');
    
    // 1. Procurar por menu de navegação ou links de estados/bancas
    const navLinks = $('nav a, header a, footer a, .menu a, .navigation a, a[href*="resultados"]').map((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      
      return {
        text,
        href,
        fullUrl: href.startsWith('http') ? href : `https://www.resultadofacil.com.br${href}`
      };
    }).get();
    
    console.log(`✓ Links de navegação encontrados: ${navLinks.length}`);
    
    // 2. Filtrar apenas links de resultados
    const resultLinks = navLinks.filter(link => 
      link.href.includes('resultados') && 
      link.href.includes('do-dia') &&
      link.text.length > 0
    );
    
    console.log(`✓ Links de resultados encontrados: ${resultLinks.length}`);
    
    // 3. Analisar padrões das URLs
    const patterns = resultLinks.map(link => {
      const href = link.href;
      
      // Extrair partes da URL
      const parts = href.split('/').filter(part => part);
      const resultadosIndex = parts.indexOf('resultados-maluca-bahia-do-dia-2025-11-20'.split('/')[1]);
      
      if (resultadosIndex >= 0) {
        const urlPart = parts[resultadosIndex];
        
        // Procurar padrão: resultados-[banca]-[estado]-do-dia-[data]
        const patternMatch = urlPart.match(/resultados-([a-z]+)-?([a-z]+)?-do-dia-?(\d{4}-\d{2}-\d{2})?/i);
        
        return {
          original: href,
          pattern: urlPart,
          banca: patternMatch ? patternMatch[1] : '',
          estado: patternMatch ? patternMatch[2] : '',
          text: link.text
        };
      }
      
      return null;
    }).filter(p => p);
    
    console.log(`✓ Padrões analisados: ${patterns.length}`);
    
    // 4. Descobrir bancas únicas
    const bancas = [...new Set(patterns.map(p => p.banca).filter(b => b && b.length > 2))];
    const estados = [...new Set(patterns.map(p => p.estado).filter(s => s && s.length > 2))];
    
    console.log(`\n📊 BANCAS ENCONTRADAS: ${bancas.length}`);
    bancas.forEach(banca => console.log(`  - ${banca}`));
    
    console.log(`\n📊 ESTADOS ENCONTRADOS: ${estados.length}`);
    estados.forEach(estado => console.log(`  - ${estado}`));
    
    // 5. Procurar por seletores na página atual
    console.log('\n🔍 ANALISANDO SELETORES NA PÁGINA...');
    
    // Procurar select de estados/bancas
    const stateSelect = $('select[name*="estado"], select[id*="estado"], select[class*="estado"]').html();
    const bancaSelect = $('select[name*="banca"], select[id*="banca"], select[class*="banca"]').html();
    
    console.log(`✓ Seletor de estado: ${!!stateSelect}`);
    console.log(`✓ Seletor de banca: ${!!bancaSelect}`);
    
    // 6. Procurar links de navegação na página atual
    const pageLinks = $('a[href*="resultados"]').map((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      
      // Tentar extrair banca e estado
      const parts = href.split('-');
      const hasResultados = parts.includes('resultados');
      const hasDia = parts.includes('do') && parts.includes('dia');
      
      return {
        text,
        href,
        hasResultados,
        hasDia,
        fullUrl: href.startsWith('http') ? href : `https://www.resultadofacil.com.br${href}`
      };
    }).get();
    
    const validPageLinks = pageLinks.filter(link => link.hasResultados && link.hasDia && link.text.length > 0);
    
    console.log(`✓ Links de navegação na página: ${validPageLinks.length}`);
    validPageLinks.slice(0, 10).forEach(link => {
      console.log(`  - ${link.text}: ${link.href}`);
    });
    
    // 7. Testar padrões conhecidos
    console.log('\n🧪 TESTANDO PADRÕES CONHECIDOS...');
    
    const testPatterns = [
      'resultados-maluca-bahia-do-dia-2025-11-20',
      'resultados-paratodos-rio-do-dia-2025-11-20',
      'resultados-federal-sao-paulo-do-dia-2025-11-20',
      'resultados-corujinha-minas-do-dia-2025-11-20'
    ];
    
    for (const pattern of testPatterns) {
      const testUrl = `https://www.resultadofacil.com.br/${pattern}`;
      
      try {
        const testPage = await browser.newPage();
        await testPage.goto(testUrl, { waitUntil: 'networkidle2', timeout: 15000 });
        await testPage.waitForTimeout(2000);
        
        const testContent = await testPage.content();
        const test$ = cheerio.load(testContent);
        
        // Verificar se tem resultados
        const hasTable = test$('table').length > 0;
        const hasResults = test$('div, section, article').filter((i, el) => {
          return /\d{3,4}/.test(test$(el).text());
        }).length > 0;
        
        console.log(`✓ ${pattern}: ${hasTable ? 'TABELA' : ''} ${hasResults ? 'RESULTADOS' : ''}`);
        
        await testPage.close();
      } catch (error) {
        console.log(`✗ ${pattern}: ERRO`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 8. Analisar estrutura de resultados na página atual
    console.log('\n📋 ANALISANDO ESTRUTURA DE RESULTADOS...');
    
    const resultElements = $('table, .result, .results, [class*="bicho"], [class*="loteria"]').map((i, el) => {
      const element = $(el);
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
    console.log(`✓ Elementos com números: ${validResults.length}`);
    
    // Salvar análise
    const analysis = {
      url: malucaUrl,
      bancas: bancas,
      estados: estados,
      padraoUrl: 'resultados-[banca]-[estado]-do-dia-[data]',
      formatoData: 'YYYY-MM-DD',
      elementosResultados: validResults.slice(0, 3),
      linksNavegacao: validPageLinks.slice(0, 5),
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('resultado-facil-analysis.json', JSON.stringify(analysis, null, 2));
    
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log('=' .repeat(50));
    console.log(`URL Analisada: ${malucaUrl}`);
    console.log(`Padrão URL: resultados-[banca]-[estado]-do-dia-[data]`);
    console.log(`Formato Data: YYYY-MM-DD`);
    console.log(`Bancas encontradas: ${bancas.length}`);
    console.log(`Estados encontrados: ${estados.length}`);
    console.log(`Elementos com resultados: ${validResults.length}`);
    
    await browser.close();
    
    return analysis;
    
  } catch (error) {
    console.error('Erro na análise:', error);
    await browser.close();
    throw error;
  }
}

// Executar análise
analyzeResultadoFacil()
  .then(analysis => {
    console.log('\n✅ Análise completa salva em resultado-facil-analysis.json');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });