import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugSiteStructure() {
  try {
    console.log('🔍 Debugando estrutura do site...\n');
    
    const url = 'https://amp.resultadofacil.com.br/horarios-jogo-do-bicho';
    console.log(`📡 Buscando: ${url}\n`);
    
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      }
    });
    
    console.log(`✅ Resposta recebida - Status: ${response.status}`);
    console.log(`📏 Tamanho do HTML: ${response.data.length} caracteres\n`);
    
    const $ = cheerio.load(response.data);
    
    // Analisa títulos e headings
    console.log('📋 HEADINGS ENCONTRADOS:');
    $('h1, h2, h3, h4, h5, h6').each((i, el) => {
      const tag = el.tagName;
      const text = $(el).text().trim();
      if (text.length > 0 && text.length < 100) {
        console.log(`  <${tag}>: ${text}`);
      }
    });
    
    console.log('\n🎯 ELEMENTOS COM TEXTOS DE LOTERIAS:');
    const lotteryKeywords = ['FEDERAL', 'RIO', 'LOOK', 'PT', 'NACIONAL', 'MALUQUINHA', 'LOTEP', 'LOTECE', 'MINAS', 'BOA SORTE'];
    
    $('*').each((i, el) => {
      const text = $(el).text().toUpperCase().trim();
      const hasLottery = lotteryKeywords.some(keyword => text.includes(keyword));
      const hasNumbers = /\d{4,5}/.test(text);
      
      if (hasLottery && hasNumbers && text.length < 200) {
        const tagName = el.tagName;
        const classes = $(el).attr('class') || '';
        const id = $(el).attr('id') || '';
        console.log(`  <${tagName}> class="${classes}" id="${id}": ${text.substring(0, 100)}...`);
      }
    });
    
    console.log('\n📊 TABELAS ENCONTRADAS:');
    $('table').each((i, table) => {
      const rows = $(table).find('tr').length;
      const cols = $(table).find('tr:first-child td, tr:first-child th').length;
      const tableText = $(table).text().substring(0, 100);
      console.log(`  Tabela ${i+1}: ${rows}x${cols} - ${tableText}...`);
    });
    
    console.log('\n🔢 ELEMENTOS COM NÚMEROS DE 4-5 DÍGITOS:');
    $('*').each((i, el) => {
      const text = $(el).text();
      const numbers = text.match(/\b\d{4,5}\b/g);
      if (numbers && numbers.length >= 3) {
        const tagName = el.tagName;
        const classes = $(el).attr('class') || '';
        console.log(`  <${tagName}> class="${classes}": ${numbers.join(', ')}`);
      }
    });
    
    console.log('\n🏷️  CLASSES CSS COMUNS:');
    const classes = new Set<string>();
    $('[class]').each((i, el) => {
      const classList = $(el).attr('class')?.split(' ') || [];
      classList.forEach(cls => {
        if (cls.length > 2 && cls.length < 30) {
          classes.add(cls);
        }
      });
    });
    
    const commonClasses = Array.from(classes).sort().slice(0, 50);
    commonClasses.forEach(cls => console.log(`  .${cls}`));
    
    console.log('\n📱 SALVANDO HTML PARA ANÁLISE...');
    const fs = require('fs');
    fs.writeFileSync('debug-html.html', response.data);
    console.log('✅ HTML salvo em debug-html.html');
    
  } catch (error) {
    console.error('❌ Erro ao debugar site:', error.message);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Headers:`, error.response.headers);
    }
  }
}

// Executa o debug
debugSiteStructure();