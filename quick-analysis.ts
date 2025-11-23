import axios from 'axios';
import * as cheerio from 'cheerio';

// Sites principais para analisar
const sites = [
  { name: 'Resultado Facil', url: 'https://amp.resultadofacil.com.br/horarios-jogo-do-bicho' },
  { name: 'Deunoposte', url: 'https://www.ojogodobicho.com/deu_no_poste.htm' },
  { name: 'Meu Jogo do Bicho', url: 'https://www.meujogodobicho.com.br' }
];

async function quickAnalysis() {
  console.log('🔍 ANÁLISE RÁPIDA DOS SITES DE RESULTADOS');
  console.log('='.repeat(60));

  for (const site of sites) {
    console.log(`\n📍 Analisando: ${site.name}`);
    console.log(`🔗 URL: ${site.url}`);
    
    try {
      const response = await axios.get(site.url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      console.log('📊 ANÁLISE:');
      
      // Procurar tabelas com resultados
      const tables = $('table');
      console.log(`   📋 Tabelas: ${tables.length}`);
      
      tables.each((i, table) => {
        const $table = $(table);
        const headers = $table.find('th, thead td').map((j, el) => $(el).text().trim()).get();
        const rows = $table.find('tr').length;
        const hasNumbers = /\b\d{4}\b/.test($table.text());
        
        if (hasNumbers || headers.some(h => /resultado|premio|sorteio/i.test(h))) {
          console.log(`   Tabela ${i + 1} (RELEVANTE):`);
          console.log(`     Cabeçalhos: ${headers.join(' | ')}`);
          console.log(`     Linhas: ${rows}`);
          
          // Mostrar primeiras linhas
          const firstRows = $table.find('tr').slice(1, 4).map((j, row) => {
            return $(row).find('td').map((k, cell) => $(cell).text().trim()).get().join(' | ');
          }).get();
          
          firstRows.forEach((row, idx) => {
            console.log(`     ${idx + 1}ª linha: ${row}`);
          });
        }
      });
      
      // Procurar divs com resultados
      const resultDivs = $('div, section').filter((i, el) => {
        const $el = $(el);
        const text = $el.text();
        const classes = $el.attr('class') || '';
        const id = $el.attr('id') || '';
        
        // Verificar se é um contêiner de resultados
        const hasResultKeywords = /resultado|deu no poste|premio|sorteio/i.test(text + ' ' + classes + ' ' + id);
        const hasFourDigitNumbers = /\b\d{4}\b/.test(text);
        const hasMinContent = text.length > 50 && text.length < 1000; // Não muito pequeno nem muito grande
        
        return hasResultKeywords && hasFourDigitNumbers && hasMinContent;
      });
      
      console.log(`   🎯 Divs com resultados: ${resultDivs.length}`);
      
      resultDivs.each((i, div) => {
        const $div = $(div);
        const tagName = div.tagName;
        const className = $div.attr('class') || '';
        const id = $div.attr('id') || '';
        const text = $div.text().trim();
        
        console.log(`     Div ${i + 1}:`);
        console.log(`       Tag: ${tagName}`);
        if (className) console.log(`       Classe: ${className}`);
        if (id) console.log(`       ID: ${id}`);
        console.log(`       Texto: ${text.substring(0, 150)}${text.length > 150 ? '...' : ''}`);
        
        // Extrair números
        const numbers = text.match(/\b\d{4}\b/g);
        if (numbers) {
          console.log(`       Números: ${numbers.slice(0, 10).join(', ')}${numbers.length > 10 ? '...' : ''}`);
        }
      });
      
      // Análise específica para resultado facil
      if (site.name === 'Resultado Facil') {
        console.log('   🔍 Análise específica Resultado Facil:');
        
        // Procurar elementos com classes específicas
        const specificElements = $('[class*="result"], [class*="jogo"], [class*="bicho"], [class*="loteria"]');
        console.log(`     Elementos específicos: ${specificElements.length}`);
        
        specificElements.each((i, el) => {
          const $el = $(el);
          const tagName = el.tagName;
          const className = $el.attr('class') || '';
          const text = $el.text().trim();
          
          if (text.length > 20 && /\d/.test(text)) { // Tem conteúdo e números
            console.log(`       ${i + 1}. ${tagName} - ${className}`);
            console.log(`          Texto: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
          }
        });
      }
      
      // Procurar horários
      const timeElements = $('*:contains("horário"):contains("sorteio"):contains("resultado")');
      if (timeElements.length > 0) {
        console.log(`   ⏰ Menções a horários: ${timeElements.length}`);
      }
      
      // Procurar datas
      const dateElements = $('*:contains("\"):contains("\"):contains("2024"):contains("2025")');
      if (dateElements.length > 0) {
        console.log(`   📅 Menções a datas: ${dateElements.length}`);
      }
      
      console.log('✅ Análise concluída para este site');
      
    } catch (error) {
      console.log(`❌ Erro ao acessar ${site.name}: ${error.message}`);
    }
    
    console.log('─'.repeat(40));
  }
  
  console.log('\n🎉 Análise completa!');
  console.log('💡 Próximos passos:');
  console.log('   1. Criar seletores CSS específicos para cada site');
  console.log('   2. Mapear os formatos de resultados (1-5, 1-7, 1-10 prêmios)');
  console.log('   3. Identificar diferenças entre 3 e 4 dígitos');
}

// Executar análise
quickAnalysis().catch(console.error);