import puppeteer from 'puppeteer';

// Sites que você mencionou para analisar
const sites = [
  { name: 'Deunoposte', url: 'https://www.ojogodobicho.com/deu_no_poste.htm' },
  { name: 'Resultado Facil', url: 'https://amp.resultadofacil.com.br/horarios-jogo-do-bicho' },
  { name: 'Meu Jogo do Bicho', url: 'https://www.meujogodobicho.com.br' },
  { name: 'Bicho Certo', url: 'https://www.bichocerto.com' },
  { name: 'Resultado Jogo Bicho', url: 'https://www.resultadojogobicho.com' },
  { name: 'Resultado Nacional', url: 'https://www.resultadonacional.com' },
  { name: 'Look Loterias', url: 'https://www.lookloterias.com' },
  { name: 'Giga Bicho', url: 'https://www.gigabicho.com.br' },
  { name: 'Portal Brasil', url: 'https://www.portalbrasil.net/jogodobicho/' }
];

async function analyzeSiteStructure() {
  const browser = await puppeteer.launch({ 
    headless: false, // Abrir navegador para ver o que está acontecendo
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Configurar user agent e viewport
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('🔍 INICIANDO ANÁLISE DETALHADA DOS SITES');
  console.log('='.repeat(60));

  for (const site of sites) {
    console.log(`\n📍 Analisando: ${site.name}`);
    console.log(`🔗 URL: ${site.url}`);
    
    try {
      await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Aguardar um pouco para carregar conteúdo dinâmico
      await page.waitForTimeout(3000);
      
      // Tirar screenshot para análise visual
      await page.screenshot({ path: `analysis-${site.name.replace(/\s+/g, '_')}.png`, fullPage: true });
      
      // Analisar estrutura da página
      const analysis = await page.evaluate(() => {
        const result = {
          title: document.title,
          url: window.location.href,
          hasResults: false,
          resultElements: [] as any[],
          dateElements: [] as any[],
          numbers: [] as string[],
          animals: [] as string[],
          schedules: [] as string[]
        };
        
        // Procurar por elementos que contenham resultados
        const keywords = ['resultado', 'deu no poste', 'premio', 'ganhador', 'sorteio', 'bicho'];
        
        // Procurar em headings
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
          const text = heading.textContent?.toLowerCase() || '';
          if (keywords.some(keyword => text.includes(keyword))) {
            result.resultElements.push({
              type: 'heading',
              tag: heading.tagName,
              text: heading.textContent?.trim(),
              className: heading.className,
              id: heading.id
            });
          }
        });
        
        // Procurar em divs e sections
        const containers = document.querySelectorAll('div, section, article, table');
        containers.forEach(container => {
          const text = container.textContent?.toLowerCase() || '';
          if (keywords.some(keyword => text.includes(keyword))) {
            result.resultElements.push({
              type: 'container',
              tag: container.tagName,
              className: container.className,
              id: container.id,
              innerHTML: container.innerHTML.substring(0, 500) // Limitar para não ficar muito grande
            });
          }
        });
        
        // Procurar números (formato do jogo do bicho: 4 dígitos)
        const numberRegex = /\b\d{4}\b/g;
        const textContent = document.body.textContent || '';
        const numbers = textContent.match(numberRegex) || [];
        result.numbers = [...new Set(numbers)].slice(0, 20); // Únicos e limitados
        
        // Procurar animais do jogo do bicho
        const animals = [
          'avestruz', 'águia', 'burro', 'borboleta', 'cachorro', 'cabra', 'carneiro',
          'camelo', 'cobra', 'coelho', 'cavalo', 'elefante', 'galo', 'gato', 'jacaré',
          'leão', 'macaco', 'porco', 'pavão', 'peru', 'touro', 'tigre', 'urso', 'veado',
          'vaca'
        ];
        
        animals.forEach(animal => {
          if (textContent.toLowerCase().includes(animal)) {
            result.animals.push(animal);
          }
        });
        
        // Procurar horários/horários de sorteio
        const timeRegex = /\b(?:0?[1-9]|1[0-9]|2[0-3]):[0-5][0-9]\b/g;
        const times = textContent.match(timeRegex) || [];
        result.schedules = [...new Set(times)].slice(0, 10);
        
        // Procurar datas
        const dateRegex = /\b(?:0?[1-9]|[12][0-9]|3[01])[\/\-](?:0?[1-9]|1[0-2])[\/\-](?:\d{2}|\d{4})\b/g;
        const dates = textContent.match(dateRegex) || [];
        result.dateElements = [...new Set(dates)].slice(0, 10);
        
        result.hasResults = result.numbers.length > 0 || result.animals.length > 0;
        
        return result;
      });
      
      console.log('📊 Análise da página:');
      console.log(`   Título: ${analysis.title}`);
      console.log(`   URL final: ${analysis.url}`);
      console.log(`   Tem resultados: ${analysis.hasResults ? '✅ SIM' : '❌ NÃO'}`);
      
      if (analysis.hasResults) {
        console.log(`   📋 Números encontrados: ${analysis.numbers.join(', ')}`);
        console.log(`   🐾 Animais encontrados: ${analysis.animals.join(', ')}`);
        console.log(`   ⏰ Horários encontrados: ${analysis.schedules.join(', ')}`);
        console.log(`   📅 Datas encontradas: ${analysis.dateElements.join(', ')}`);
      }
      
      if (analysis.resultElements.length > 0) {
        console.log('   🎯 Elementos com resultados:');
        analysis.resultElements.forEach((element, index) => {
          console.log(`     ${index + 1}. ${element.type} (${element.tag}) - ${element.text?.substring(0, 100)}`);
          if (element.className) console.log(`        Classe: ${element.className}`);
          if (element.id) console.log(`        ID: ${element.id}`);
        });
      }
      
      // Analisar links para páginas de resultados
      const links = await page.evaluate(() => {
        const resultLinks = [];
        const allLinks = document.querySelectorAll('a');
        
        allLinks.forEach(link => {
          const href = link.href;
          const text = link.textContent?.toLowerCase() || '';
          const title = link.title?.toLowerCase() || '';
          
          const keywords = ['resultado', 'deu no poste', 'sorteio', 'premio', 'bicho', 'loteria'];
          
          if (keywords.some(keyword => text.includes(keyword) || title.includes(keyword) || href.includes(keyword))) {
            resultLinks.push({
              href: href,
              text: link.textContent?.trim(),
              title: link.title
            });
          }
        });
        
        return resultLinks.slice(0, 10); // Limitar
      });
      
      if (links.length > 0) {
        console.log('   🔗 Links relacionados a resultados:');
        links.forEach((link, index) => {
          console.log(`     ${index + 1}. ${link.text} -> ${link.href}`);
        });
      }
      
      console.log('✅ Análise concluída para este site');
      
    } catch (error) {
      console.log(`❌ Erro ao analisar ${site.name}:`, error.message);
    }
    
    // Pequena pausa entre sites
    await page.waitForTimeout(2000);
  }
  
  await browser.close();
  console.log('\n🎉 Análise completa de todos os sites finalizada!');
  console.log('📸 Screenshots salvas para análise visual');
}

// Executar análise
analyzeSiteStructure().catch(console.error);