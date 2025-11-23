const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

// Lista de bancas conhecidas e para testar
const BANCAS_CONHECIDAS = [
  'maluca',
  'paratodos',
  'federal', 
  'corujinha',
  'galo',
  'centauro',
  'trovao',
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
  'paraiba',
  'rio-grande-do-norte',
  'alagoas',
  'sergipe',
  'espirito-santo',
  'maranhao',
  'piaui',
  'ceara',
  'paraiba',
  'alagoas',
  'pernambuco',
  'bahia',
  'sergipe'
];

// Horários conhecidos de sorteio
const HORARIOS = ['10', '11', '12', '14', '15', '16', '17', '18', '19', '20', '21'];

async function discoverResultadoFacilComplete() {
  console.log('🎯 DESCOBRINDO TODAS AS BANCAS DO RESULTADO FÁCIL - MÉTODO COMPLETO');
  console.log('=' .repeat(70));
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  const discoveredBancas = new Map();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];
  
  try {
    console.log('\n📅 Testando com data:', dateStr);
    
    // 1. Testar bancas conhecidas com diferentes estados
    console.log('\n🧪 TESTANDO BANCAS CONHECIDAS...');
    
    const estados = ['rio', 'sao-paulo', 'minas', 'bahia', 'ceara', 'parana'];
    let testedCount = 0;
    let foundCount = 0;
    
    for (const banca of BANCAS_CONHECIDAS.slice(0, 15)) { // Limitar para não demorar muito
      for (const estado of estados) {
        const url = `https://www.resultadofacil.com.br/resultados-${banca}-${estado}-do-dia-${dateStr}`;
        
        try {
          console.log(`   Testando: ${banca} - ${estado}`);
          
          const testPage = await browser.newPage();
          await testPage.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
          await testPage.waitForTimeout(1000);
          
          const content = await testPage.content();
          const $ = cheerio.load(content);
          
          // Verificar se tem resultados
          const hasTables = $('table').length > 0;
          const hasNumbers = /\b\d{3,4}\b/.test(content);
          const title = $('title').text().toLowerCase();
          const hasBanca = title.includes(banca) || content.toLowerCase().includes(banca);
          
          if (hasTables && hasNumbers && hasBanca) {
            console.log(`   ✅ ENCONTRADO: ${banca} - ${estado}`);
            
            if (!discoveredBancas.has(banca)) {
              discoveredBancas.set(banca, {
                banca: banca,
                estados: new Set(),
                urls: [],
                successCount: 0
              });
            }
            
            const bancaData = discoveredBancas.get(banca);
            bancaData.estados.add(estado);
            bancaData.urls.push(url);
            bancaData.successCount++;
            foundCount++;
          }
          
          await testPage.close();
          testedCount++;
          
        } catch (error) {
          // Ignorar erros individuais
          console.log(`   ❌ Erro: ${banca} - ${estado}`);
        }
        
        // Pequena pausa
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`\n📊 Resultados parciais: ${foundCount}/${testedCount} combinações funcionam`);
    
    // 2. Procurar na página principal por menus/links
    console.log('\n🔍 PROCURANDO NA PÁGINA PRINCIPAL...');
    
    try {
      await page.goto('https://www.resultadofacil.com.br', { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // Procurar menus de navegação
      const navMenus = $('nav, header, footer, .menu, .navigation, .sidebar').find('a').map((i, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim().toLowerCase();
        
        return {
          text,
          href,
          hasResultados: href.includes('resultados') || text.includes('resultado'),
          hasBicho: href.includes('bicho') || text.includes('bicho'),
          hasLoteria: href.includes('loteria') || text.includes('loteria')
        };
      }).get();
      
      const relevantLinks = navMenus.filter(link => 
        link.hasResultados || link.hasBicho || link.hasLoteria
      );
      
      console.log(`✅ Links relevantes encontrados: ${relevantLinks.length}`);
      
      // 3. Procurar por select/options
      const selects = $('select').map((i, el) => {
        const $select = $(el);
        const name = $select.attr('name') || $select.attr('id') || '';
        const options = $select.find('option').map((j, opt) => ({
          value: $(opt).attr('value') || '',
          text: $(opt).text().trim()
        })).get();
        
        return {
          name,
          options,
          hasBanca: name.toLowerCase().includes('banca') || name.toLowerCase().includes('loteria'),
          hasEstado: name.toLowerCase().includes('estado') || name.toLowerCase().includes('uf')
        };
      }).get();
      
      const bancaSelects = selects.filter(s => s.hasBanca && s.options.length > 0);
      console.log(`✅ Selects de bancas encontrados: ${bancaSelects.length}`);
      
      bancaSelects.forEach(select => {
        console.log(`   Select "${select.name}": ${select.options.length} opções`);
        select.options.slice(0, 5).forEach(option => {
          console.log(`     - ${option.text}: ${option.value}`);
        });
      });
      
      // 4. Procurar por links diretos no conteúdo
      const contentLinks = $('a[href*="resultados"]').map((i, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        
        // Tentar extrair banca do href
        const bancaMatch = href.match(/resultados-([a-z-]+)/i);
        
        return {
          text,
          href,
          banca: bancaMatch ? bancaMatch[1] : null
        };
      }).get();
      
      console.log(`✅ Links de resultados no conteúdo: ${contentLinks.length}`);
      
      contentLinks.forEach(link => {
        if (link.banca && !discoveredBancas.has(link.banca)) {
          console.log(`   📌 Nova banca encontrada: ${link.banca}`);
          discoveredBancas.set(link.banca, {
            banca: link.banca,
            estados: new Set(),
            urls: [link.href],
            successCount: 0,
            source: 'content_links'
          });
        }
      });
      
    } catch (error) {
      console.log('❌ Erro ao acessar página principal:', error.message);
    }
    
    // 5. Testar novas bancas descobertas
    console.log('\n🧪 TESTANDO NOVAS BANCAS...');
    
    const newBancas = Array.from(discoveredBancas.keys()).filter(banca => 
      !BANCAS_CONHECIDAS.includes(banca)
    );
    
    if (newBancas.length > 0) {
      console.log(`   Novas bancas para testar: ${newBancas.length}`);
      
      for (const banca of newBancas.slice(0, 5)) { // Limitar
        const url = `https://www.resultadofacil.com.br/resultados-${banca}-rio-do-dia-${dateStr}`;
        
        try {
          const testPage = await browser.newPage();
          await testPage.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
          
          const content = await testPage.content();
          const $ = cheerio.load(content);
          
          const hasResults = $('table').length > 0 && /\b\d{3,4}\b/.test(content);
          
          if (hasResults) {
            console.log(`   ✅ Nova banca FUNCIONAL: ${banca}`);
            const bancaData = discoveredBancas.get(banca);
            bancaData.estados.add('rio');
            bancaData.successCount++;
          } else {
            console.log(`   ⚠️  Nova banca sem resultados: ${banca}`);
          }
          
          await testPage.close();
          
        } catch (error) {
          console.log(`   ❌ Erro ao testar nova banca ${banca}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // 6. Resultado final
    console.log('\n📊 RESULTADO FINAL DA DESCobERTA:');
    console.log('=' .repeat(70));
    
    const finalBancas = Array.from(discoveredBancas.values())
      .filter(banca => banca.successCount > 0)
      .sort((a, b) => b.successCount - a.successCount);
    
    console.log(`\n✅ BANCAS FUNCIONAIS ENCONTRADAS: ${finalBancas.length}`);
    
    finalBancas.forEach((banca, index) => {
      console.log(`\n${index + 1}. ${banca.banca.toUpperCase()}`);
      console.log(`   Estados: ${Array.from(banca.estados).join(', ')}`);
      console.log(`   Sucessos: ${banca.successCount}`);
      console.log(`   Exemplo URL: ${banca.urls[0]}`);
    });
    
    // Salvar resultados
    const results = {
      timestamp: new Date().toISOString(),
      testDate: dateStr,
      totalBancas: finalBancas.length,
      bancas: finalBancas.map(banca => ({
        banca: banca.banca,
        estados: Array.from(banca.estados),
        successCount: banca.successCount,
        sampleUrl: banca.urls[0]
      })),
      summary: {
        testedCombinations: testedCount,
        successfulCombinations: foundCount,
        newBancasDiscovered: newBancas.filter(b => discoveredBancas.get(b).successCount > 0).length
      }
    };
    
    fs.writeFileSync('resultado-facil-bancas-funcionais.json', JSON.stringify(results, null, 2));
    
    console.log(`\n✅ Dados salvos em: resultado-facil-bancas-funcionais.json`);
    
    await browser.close();
    
    return finalBancas;
    
  } catch (error) {
    console.error('❌ Erro na descoberta:', error);
    await browser.close();
    throw error;
  }
}

// Executar descoberta completa
if (require.main === module) {
  discoverResultadoFacilComplete()
    .then(bancas => {
      console.log(`\n🎉 DESCobERTA CONCLUÍDA!`);
      console.log(`Foram encontradas ${bancas.length} bancas funcionais no Resultado Fácil`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { discoverResultadoFacilComplete };