const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

async function discoverAllBancasResultadoFacil() {
  console.log('🔍 DESCOBRINDO TODAS AS BANCAS DO RESULTADO FÁCIL');
  console.log('=' .repeat(70));
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Acessar a página principal do Resultado Fácil
    const mainUrl = 'https://www.resultadofacil.com.br';
    await page.goto(mainUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    console.log('📍 ANALISANDO PÁGINA PRINCIPAL...');
    
    // 1. Procurar por todos os links que contenham "resultados"
    const allResultLinks = $('a[href*="resultados"]').map((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      
      return {
        text,
        href,
        fullUrl: href.startsWith('http') ? href : `${mainUrl}${href}`
      };
    }).get();
    
    console.log(`✅ Total de links com "resultados": ${allResultLinks.length}`);
    
    // 2. Filtrar apenas links válidos (com padrão resultados-X-do-dia)
    const validLinks = allResultLinks.filter(link => {
      const href = link.href;
      return href.includes('resultados-') && 
             href.includes('-do-dia-') && 
             href.length > 20; // Evitar links muito curtos
    });
    
    console.log(`✅ Links válidos encontrados: ${validLinks.length}`);
    
    // 3. Analisar padrões das URLs para extrair bancas e estados
    const patterns = validLinks.map(link => {
      const href = link.href;
      
      // Padrão: resultados-[banca]-[estado]-do-dia-[data]
      // ou: resultados-[banca]-do-dia-[data] (sem estado)
      
      const pattern1 = href.match(/resultados-([a-z-]+)-([a-z-]+)-do-dia-(\d{4}-\d{2}-\d{2})/i);
      const pattern2 = href.match(/resultados-([a-z-]+)-do-dia-(\d{4}-\d{2}-\d{2})/i);
      
      if (pattern1) {
        // Tem banca e estado
        return {
          type: 'banca-estado',
          banca: pattern1[1],
          estado: pattern1[2],
          date: pattern1[3],
          originalHref: href,
          text: link.text
        };
      } else if (pattern2) {
        // Só tem banca
        return {
          type: 'banca-only',
          banca: pattern2[1],
          estado: null,
          date: pattern2[2],
          originalHref: href,
          text: link.text
        };
      }
      
      return null;
    }).filter(p => p);
    
    console.log(`✅ Padrões extraídos: ${patterns.length}`);
    
    // 4. Organizar por bancas únicas
    const bancasMap = new Map();
    
    patterns.forEach(pattern => {
      const banca = pattern.banca;
      const estado = pattern.estado;
      
      if (!bancasMap.has(banca)) {
        bancasMap.set(banca, {
          banca: banca,
          estados: new Set(),
          sampleUrls: [],
          texts: new Set()
        });
      }
      
      const bancaData = bancasMap.get(banca);
      if (estado) {
        bancaData.estados.add(estado);
      }
      bancaData.sampleUrls.push(pattern.originalHref);
      if (pattern.text) {
        bancaData.texts.add(pattern.text);
      }
    });
    
    // 5. Converter para array e ordenar
    const bancas = Array.from(bancasMap.values()).map(bancaData => ({
      banca: bancaData.banca,
      estados: Array.from(bancaData.estados),
      sampleUrls: bancaData.sampleUrls.slice(0, 3), // Limitar exemplos
      texts: Array.from(bancaData.texts),
      totalEstados: bancaData.estados.size
    }));
    
    // Ordenar por número de estados (mais completo primeiro)
    bancas.sort((a, b) => b.totalEstados - a.totalEstados);
    
    console.log(`\n📊 BANCAS ENCONTRADAS: ${bancas.length}`);
    console.log('=' .repeat(70));
    
    bancas.forEach((banca, index) => {
      console.log(`\n${index + 1}. ${banca.banca.toUpperCase()}`);
      console.log(`   Estados: ${banca.estados.join(', ')}`);
      console.log(`   Total de estados: ${banca.totalEstados}`);
      if (banca.texts.length > 0) {
        console.log(`   Textos: ${banca.texts.join(', ')}`);
      }
      if (banca.sampleUrls.length > 0) {
        console.log(`   Exemplo URL: ${banca.sampleUrls[0]}`);
      }
    });
    
    // 6. Testar algumas bancas para ver se têm resultados
    console.log('\n🧪 TESTANDO BANCAS PARA VERIFICAR RESULTADOS...');
    console.log('=' .repeat(70));
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    // Testar as 5 primeiras bancas com mais estados
    const testBancas = bancas.slice(0, 5);
    
    for (const banca of testBancas) {
      // Testar com o primeiro estado disponível
      const estadoToTest = banca.estados[0] || 'rio'; // Fallback para 'rio'
      const testUrl = `https://www.resultadofacil.com.br/resultados-${banca.banca}-${estadoToTest}-do-dia-${dateStr}`;
      
      try {
        const testPage = await browser.newPage();
        await testPage.goto(testUrl, { waitUntil: 'networkidle2', timeout: 15000 });
        await testPage.waitForTimeout(2000);
        
        const testContent = await testPage.content();
        const test$ = cheerio.load(testContent);
        
        // Verificar se tem tabelas de resultados
        const hasTables = test$('table').length > 0;
        const hasNumbers = /\b\d{3,4}\b/.test(testContent);
        const title = test$('title').text();
        
        console.log(`\n${banca.banca.toUpperCase()} - ${estadoToTest}:`);
        console.log(`   URL: ${testUrl}`);
        console.log(`   Título: ${title}`);
        console.log(`   Tabelas: ${hasTables ? '✅' : '❌'}`);
        console.log(`   Números: ${hasNumbers ? '✅' : '❌'}`);
        
        await testPage.close();
        
      } catch (error) {
        console.log(`\n${banca.banca.toUpperCase()} - ${estadoToTest}:`);
        console.log(`   URL: ${testUrl}`);
        console.log(`   ❌ Erro: ${error.message}`);
      }
      
      // Pequena pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 7. Salvar resultados completos
    const completeResults = {
      timestamp: new Date().toISOString(),
      totalBancas: bancas.length,
      bancas: bancas,
      testResults: [],
      summary: {
        bancasComEstados: bancas.filter(b => b.totalEstados > 0).length,
        bancasSemEstado: bancas.filter(b => b.totalEstados === 0).length,
        mediaEstadosPorBanca: bancas.reduce((sum, b) => sum + b.totalEstados, 0) / bancas.length
      }
    };
    
    fs.writeFileSync('resultado-facil-bancas-completas.json', JSON.stringify(completeResults, null, 2));
    
    console.log('\n📊 RESUMO FINAL:');
    console.log('=' .repeat(70));
    console.log(`Total de bancas encontradas: ${bancas.length}`);
    console.log(`Bancas com estados: ${bancas.filter(b => b.totalEstados > 0).length}`);
    console.log(`Bancas sem estado (nacional): ${bancas.filter(b => b.totalEstados === 0).length}`);
    console.log(`Média de estados por banca: ${(bancas.reduce((sum, b) => sum + b.totalEstados, 0) / bancas.length).toFixed(1)}`);
    console.log(`\n✅ Dados salvos em: resultado-facil-bancas-completas.json`);
    
    await browser.close();
    
    return {
      bancas,
      total: bancas.length,
      summary: completeResults.summary
    };
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
    await browser.close();
    throw error;
  }
}

// Executar descoberta
if (require.main === module) {
  discoverAllBancasResultadoFacil()
    .then(results => {
      console.log('\n✅ Descoberta concluída!');
      console.log(`Foram encontradas ${results.total} bancas no Resultado Fácil`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { discoverAllBancasResultadoFacil };