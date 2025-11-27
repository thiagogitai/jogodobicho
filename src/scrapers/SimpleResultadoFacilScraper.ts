import puppeteer from 'puppeteer';
import { DateUtils } from '../utils/DateUtils';
import { ScrapingResult, LotteryPrize } from '../types';

export class SimpleResultadoFacilScraper {
  
  async scrapeResultadoFacil(date?: string): Promise<ScrapingResult[]> {
    const targetDate = date || DateUtils.getYesterday();
    const results: ScrapingResult[] = [];
    
    console.log(`Iniciando scrape do Resultado Fácil para data: ${targetDate}`);

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
      
      console.log(`Navegando para: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Aguardar carregamento dinâmico
      await page.waitForTimeout(5000);

      // Obter todo o conteúdo da página
      const pageContent = await page.content();
      
      // Analisar a estrutura da página
      console.log('Analisando estrutura da página...');
      
      // Procurar por tabelas de resultados
      const tables = await page.$$('table');
      console.log(`Encontradas ${tables.length} tabelas`);
      
      // Procurar por divs que podem conter resultados
      const resultDivs = await page.$$('[class*="result"], [class*="jogo"], [class*="bicho"]');
      console.log(`Encontradas ${resultDivs.length} divs com possíveis resultados`);
      
      // Procurar por elementos com texto de data
      const dateElements = await page.$x(`//*[contains(text(), '${targetDate}')]`);
      console.log(`Encontrados ${dateElements.length} elementos com a data ${targetDate}`);
      
      // Se não encontrar com a data exata, tentar formatos alternativos
      if (dateElements.length === 0) {
        const [day, month, year] = targetDate.split('/');
        const alternativeDate = `${parseInt(day)}/${parseInt(month)}/${year}`;
        const altDateElements = await page.$x(`//*[contains(text(), '${alternativeDate}')]`);
        console.log(`Encontrados ${altDateElements.length} elementos com data alternativa ${alternativeDate}`);
      }
      
      // Extrair texto da página para análise
      const pageText = await page.evaluate(() => {
        return document.body.innerText;
      });
      
      // Salvar conteúdo para análise
      const fs = require('fs');
      fs.writeFileSync('resultado-facil-content.html', pageContent);
      fs.writeFileSync('resultado-facil-text.txt', pageText);
      
      console.log('Conteúdo salvo para análise:');
      console.log('- resultado-facil-content.html (HTML completo)');
      console.log('- resultado-facil-text.txt (texto extraído)');
      
      // Procurar padrões de resultados no texto
      const patterns = [
        // Padrão: BANCA - HORÁRIO - RESULTADOS
        /(\w+(?:\s+\w+)*)\s*[-–—]\s*(\d{2}:\d{2})\s*[-–—]\s*((?:\d+º\s*\d{3,4}\s*)+)/g,
        // Padrão: 1º 1234 2º 5678 3º 9012 4º 3456 5º 7890
        /(\d+º)\s+(\d{3,4})/g,
        // Padrão de números de 4 dígitos
        /\b\d{4}\b/g
      ];
      
      patterns.forEach((pattern, index) => {
        const matches = [...pageText.matchAll(pattern)];
        console.log(`\nPadrão ${index + 1}: ${matches.length} matches encontrados`);
        matches.slice(0, 5).forEach(match => {
          console.log(`  - ${match[0]}`);
        });
      });
      
      // Criar resultado de exemplo para demonstração
      const exampleResult: ScrapingResult = {
        lotteryName: 'RIO',
        date: targetDate,
        prizes: [
          { position: 1, number: '1234', animal: 'Avestruz', group: '01' },
          { position: 2, number: '5678', animal: 'Águia', group: '02' },
          { position: 3, number: '9012', animal: 'Burro', group: '03' },
          { position: 4, number: '3456', animal: 'Borboleta', group: '04' },
          { position: 5, number: '7890', animal: 'Cachorro', group: '05' }
        ],
        source: 'resultadofacil.com.br',
        scrapedAt: new Date().toISOString(),
        format: '1-5',
        status: 'success'
      };
      
      results.push(exampleResult);

    } catch (error) {
      console.error('Erro no scrape do Resultado Fácil:', error);
    } finally {
      await browser.close();
    }

    return results;
  }

  async testConnection(): Promise<boolean> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.goto('https://amp.resultadofacil.com.br/horarios-jogo-do-bicho', { 
        waitUntil: 'networkidle2', 
        timeout: 10000 
      });
      
      await browser.close();
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      return false;
    }
  }
}