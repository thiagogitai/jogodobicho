const puppeteer = require('puppeteer');
const fs = require('fs');

async function testResultadoFacilFinal() {
  console.log('🧪 Iniciando teste final do Resultado Fácil...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Configurar user agent e viewport
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });

    // URL principal do Resultado Fácil
    const url = 'https://amp.resultadofacil.com.br/horarios-jogo-do-bicho';
    
    console.log(`📡 Navegando para: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Aguardar carregamento dinâmico
    console.log('⏳ Aguardando carregamento...');
    await page.waitForTimeout(5000);

    // Obter data de ontem
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const targetDate = yesterday.toLocaleDateString('pt-BR');
    console.log(`📅 Buscando resultados de: ${targetDate}\n`);

    // Análise detalhada da estrutura
    console.log('🔍 Analisando estrutura da página...\n');
    
    // 1. Procurar todas as tabelas
    const tables = await page.$$('table');
    console.log(`✅ Encontradas ${tables.length} tabelas`);
    
    // 2. Procurar por divs com classes específicas
    const resultDivs = await page.$$('[class*="result"], [class*="jogo"], [class*="bicho"], [class*="loteria"]');
    console.log(`✅ Encontradas ${resultDivs.length} divs com possíveis resultados`);
    
    // 3. Procurar por elementos com texto da data
    const dateElements = await page.$x(`//*[contains(text(), '${targetDate}')]`);
    console.log(`✅ Encontrados ${dateElements.length} elementos com a data ${targetDate}`);
    
    // 4. Procurar por horários (padrão HH:MM)
    const timeElements = await page.$x('//*[matches(text(), "\\d{2}:\d{2}")]');
    console.log(`✅ Encontrados ${timeElements.length} elementos com horários`);
    
    // 5. Procurar por números de 4 dígitos (possíveis resultados)
    const numberElements = await page.$x('//*[matches(text(), "\\b\\d{4}\\b")]');
    console.log(`✅ Encontrados ${numberElements.length} elementos com números de 4 dígitos`);
    
    // 6. Procurar por nomes de bancas
    const bancas = [
      'FEDERAL', 'RIO', 'SÃO PAULO', 'MINAS GERAIS', 'CEARÁ', 'PARAÍBA',
      'BAHIA', 'PARANÁ', 'NACIONAL', 'PERNAMBUCO', 'ALAGOAS', 'PARÁ',
      'MATO GROSSO', 'MATO GROSSO DO SUL', 'GOIÁS', 'DISTRITO FEDERAL',
      'ESPIRITO SANTO', 'PIAUÍ', 'RIO GRANDE DO NORTE', 'RIO GRANDE DO SUL',
      'SANTA CATARINA', 'MARANHÃO', 'TOCANTINS', 'RONDÔNIA', 'ACRE',
      'AMAZONAS', 'RORAIMA', 'APARÁ'
    ];
    
    let bancaElements = 0;
    for (const banca of bancas.slice(0, 10)) { // Testar apenas as 10 primeiras
      const elements = await page.$x(`//*[contains(translate(text(), 'áéíóúãõç', 'aeiouao'), translate('${banca.toLowerCase()}', 'áéíóúãõç', 'aeiouao'))]`);
      bancaElements += elements.length;
    }
    console.log(`✅ Encontrados aproximadamente ${bancaElements} elementos com nomes de bancas`);
    
    console.log('\n📋 Análise detalhada das estruturas encontradas:');
    
    // Analisar cada tabela encontrada
    for (let i = 0; i < Math.min(tables.length, 3); i++) {
      const table = tables[i];
      const html = await table.evaluate(el => el.outerHTML);
      const text = await table.evaluate(el => el.textContent);
      
      console.log(`\n📊 Tabela ${i + 1}:`);
      console.log(`   Texto: ${text.substring(0, 200)}...`);
      
      // Procurar linhas e colunas
      const rows = await table.$$('tr');
      console.log(`   Linhas: ${rows.length}`);
      
      if (rows.length > 0) {
        const cells = await rows[0].$$('td, th');
        console.log(`   Colunas: ${cells.length}`);
      }
    }
    
    // Analisar divs com resultados
    console.log('\n🎯 Análise de divs com possíveis resultados:');
    for (let i = 0; i < Math.min(resultDivs.length, 5); i++) {
      const div = resultDivs[i];
      const text = await div.evaluate(el => el.textContent);
      const classes = await div.evaluate(el => el.className);
      
      console.log(`\n   Div ${i + 1} (classes: ${classes}):`);
      console.log(`   Texto: ${text.substring(0, 150)}...`);
    }
    
    // Extrair todo o texto da página para análise de padrões
    const pageText = await page.evaluate(() => {
      return document.body.innerText;
    });
    
    // Salvar conteúdo para análise
    fs.writeFileSync('resultado-facil-final-analysis.txt', 
      `ANÁLISE COMPLETA DO RESULTADO FÁCIL\n` +
      `Data: ${new Date().toISOString()}\n` +
      `URL: ${url}\n` +
      `Data buscada: ${targetDate}\n\n` +
      `CONTEÚDO DA PÁGINA:\n${pageText.substring(0, 5000)}...\n\n` +
      `ESTATÍSTICAS:\n` +
      `- Tabelas: ${tables.length}\n` +
      `- Divs com possíveis resultados: ${resultDivs.length}\n` +
      `- Elementos com data: ${dateElements.length}\n` +
      `- Elementos com horários: ${timeElements.length}\n` +
      `- Elementos com números de 4 dígitos: ${numberElements.length}\n`
    );
    
    console.log('\n💾 Análise completa salva em: resultado-facil-final-analysis.txt');
    
    // Procurar padrões específicos de resultados
    console.log('\n🔍 Procurando padrões de resultados no texto...');
    
    // Padrões de busca
    const patterns = [
      { name: 'Resultados com posição', regex: /(\d+º)\s+(\d{4})/g },
      { name: 'Horários', regex: /(\d{2}:\d{2})/g },
      { name: 'Datas', regex: /(\d{2}\/\d{2}\/\d{4})/g },
      { name: 'Números de 4 dígitos', regex: /\b(\d{4})\b/g }
    ];
    
    patterns.forEach(pattern => {
      const matches = [...pageText.matchAll(pattern.regex)];
      console.log(`✅ ${pattern.name}: ${matches.length} encontrados`);
      if (matches.length > 0) {
        console.log(`   Exemplos: ${matches.slice(0, 5).map(m => m[0]).join(', ')}`);
      }
    });
    
    console.log('\n✅ Análise concluída!');
    console.log('📁 Arquivos salvos:');
    console.log('   - resultado-facil-final-analysis.txt (análise completa)');
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
  } finally {
    await browser.close();
  }
}

// Executar teste
testResultadoFacilFinal().catch(console.error);