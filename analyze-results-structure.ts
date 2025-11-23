import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

// Sites específicos para analisar os resultados
const sites = [
  { name: 'Deunoposte', url: 'https://www.ojogodobicho.com/deu_no_poste.htm' },
  { name: 'Resultado Facil', url: 'https://amp.resultadofacil.com.br/horarios-jogo-do-bicho' },
  { name: 'Meu Jogo do Bicho', url: 'https://www.meujogodobicho.com.br' },
  { name: 'Bicho Certo', url: 'https://www.bichocerto.com' },
  { name: 'Resultado Jogo Bicho', url: 'https://www.resultadojogobicho.com' },
  { name: 'Giga Bicho', url: 'https://www.gigabicho.com.br' }
];

async function analyzeResultStructure() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Configurar user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('🔍 ANALISANDO ESTRUTURA DE RESULTADOS DOS SITES');
  console.log('='.repeat(60));

  for (const site of sites) {
    console.log(`\n📍 Analisando: ${site.name}`);
    console.log(`🔗 URL: ${site.url}`);
    
    try {
      await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      console.log('📊 ANÁLISE DETALHADA:');
      
      // Procurar por tabelas de resultados
      const tables = $('table');
      console.log(`   📋 Tabelas encontradas: ${tables.length}`);
      
      tables.each((i, table) => {
        const $table = $(table);
        const headers = $table.find('th, thead td').map((j, el) => $(el).text().trim()).get();
        const rows = $table.find('tr:not(:first-child)').length;
        
        console.log(`   Tabela ${i + 1}:`);
        console.log(`     Cabeçalhos: ${headers.join(' | ')}`);
        console.log(`     Linhas: ${rows}`);
        
        // Verificar se contém números de 4 dígitos
        const tableText = $table.text();
        const fourDigitNumbers = tableText.match(/\b\d{4}\b/g);
        if (fourDigitNumbers) {
          console.log(`     Números 4 dígitos: ${fourDigitNumbers.slice(0, 5).join(', ')}${fourDigitNumbers.length > 5 ? '...' : ''}`);
        }
      });
      
      // Procurar por divs/sections que possam conter resultados
      const resultContainers = $('div, section, article').filter((i, el) => {
        const $el = $(el);
        const text = $el.text();
        const classes = $el.attr('class') || '';
        const id = $el.attr('id') || '';
        
        // Verificar se contém palavras-chave relacionadas a resultados
        const keywords = ['resultado', 'deu no poste', 'premio', 'sorteio', 'ganhador'];
        const hasKeywords = keywords.some(keyword => 
          text.toLowerCase().includes(keyword) || 
          classes.toLowerCase().includes(keyword) || 
          id.toLowerCase().includes(keyword)
        );
        
        // Verificar se contém números de 4 dígitos
        const hasFourDigitNumbers = /\b\d{4}\b/.test(text);
        
        return hasKeywords && hasFourDigitNumbers;
      });
      
      console.log(`   🎯 Contêineres de resultados: ${resultContainers.length}`);
      
      resultContainers.each((i, container) => {
        const $container = $(container);
        const tagName = container.tagName;
        const className = $container.attr('class') || '';
        const id = $container.attr('id') || '';
        const text = $container.text().trim();
        
        console.log(`   Contêiner ${i + 1}:`);
        console.log(`     Tag: ${tagName}`);
        if (className) console.log(`     Classe: ${className}`);
        if (id) console.log(`     ID: ${id}`);
        console.log(`     Texto: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
        
        // Extrair números específicos
        const numbers = text.match(/\b\d{4}\b/g);
        if (numbers) {
          console.log(`     Números: ${numbers.slice(0, 10).join(', ')}${numbers.length > 10 ? '...' : ''}`);
        }
      });
      
      // Procurar por horários de sorteio
      const timeElements = $('*:contains("horário"):contains("sorteio"):contains("resultado")');
      console.log(`   ⏰ Elementos com horários: ${timeElements.length}`);
      
      // Procurar links para páginas de resultados específicos
      const resultLinks = $('a').filter((i, el) => {
        const $el = $(el);
        const href = $el.attr('href') || '';
        const text = $el.text().toLowerCase();
        
        const keywords = ['resultado', 'deu no poste', 'sorteio', 'premio'];
        return keywords.some(keyword => href.includes(keyword) || text.includes(keyword));
      });
      
      console.log(`   🔗 Links para resultados: ${resultLinks.length}`);
      resultLinks.each((i, link) => {
        const $link = $(link);
        console.log(`     ${i + 1}. ${$link.text().trim()} -> ${$link.attr('href')}`);
      });
      
      // Análise específica para cada site
      if (site.name === 'Resultado Facil') {
        console.log('   🔍 Análise específica para Resultado Facil:');
        
        // Procurar por elementos com classes específicas
        const specificElements = $('[class*="result"], [class*="jogo"], [class*="bicho"]');
        console.log(`     Elementos específicos encontrados: ${specificElements.length}`);
        
        specificElements.each((i, el) => {
          const $el = $(el);
          console.log(`       ${i + 1}. ${el.tagName} - Classe: ${$el.attr('class')} - Texto: ${$el.text().trim().substring(0, 100)}`);
        });
      }
      
      // Salvar HTML para análise posterior
      const fs = require('fs');
      fs.writeFileSync(`html-${site.name.replace(/\s+/g, '_')}.html`, html);
      
      console.log('✅ Análise concluída');
      
    } catch (error) {
      console.log(`❌ Erro ao analisar ${site.name}:`, error.message);
    }
    
    await page.waitForTimeout(2000);
  }
  
  await browser.close();
  console.log('\n🎉 Análise completa!');
  console.log('📄 Arquivos HTML salvos para análise detalhada');
}

// Executar análise
analyzeResultStructure().catch(console.error);