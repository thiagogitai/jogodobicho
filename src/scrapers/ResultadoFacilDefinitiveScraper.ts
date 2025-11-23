import puppeteer from 'puppeteer';
import { DateUtils } from '../utils/DateUtils.js';
import { ScrapingResult, LotteryPrize } from '../types/index';
import logger from '../config/logger';
import { 
  RESULTADO_FACIL_BANCAS, 
  getResultadoFacilUrl, 
  getCurrentDateFormatted,
  getYesterdayDateFormatted 
} from '../config/resultadoFacilBancasConfig';

export class ResultadoFacilDefinitiveScraper {
  
  /**
   * Gera URL para uma banca específica
   * IMPORTANTE: Sempre usa data atual se não fornecida
   */
  private getBancaUrl(bancaKey: string, date?: string): string {
    // Se não fornecer data, usa data ATUAL (não ontem)
    const targetDate = date || getCurrentDateFormatted();
    return getResultadoFacilUrl(bancaKey, targetDate);
  }

  /**
   * Scrape de todas as bancas
   * IMPORTANTE: Por padrão usa data ATUAL, não ontem
   */
  async scrapeAllBancas(date?: string): Promise<ScrapingResult[]> {
    // Se não fornecer data, usa data ATUAL (não ontem)
    const targetDate = date || getCurrentDateFormatted();
    const results: ScrapingResult[] = [];
    
    logger.info(`Iniciando scrape do Resultado Fácil para data: ${targetDate}`);
    logger.info(`Total de bancas para scrape: ${Object.keys(this.bancaUrls).length}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Configurar user agent e viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      // Processar cada banca usando a configuração centralizada
      for (const [bancaKey, bancaConfig] of Object.entries(RESULTADO_FACIL_BANCAS)) {
        try {
          const url = this.getBancaUrl(bancaKey, targetDate);
          const bancaName = bancaConfig.displayName;
          
          logger.info(`Processando banca: ${bancaName} - URL: ${url}`);
          
          const result = await this.scrapeBanca(page, url, bancaName, targetDate);
          if (result) {
            results.push(result);
            logger.info(`✅ Resultado extraído: ${bancaName} - ${result.prizes.length} prêmios`);
          } else {
            logger.warn(`⚠️ Nenhum resultado encontrado para: ${bancaName}`);
          }
          
          // Pequena pausa entre requisições para evitar bloqueio
          await page.waitForTimeout(2000);
          
        } catch (error) {
          logger.error(`❌ Erro ao processar banca ${bancaKey}: ${error}`);
        }
      }

    } catch (error) {
      logger.error(`Erro geral no scrape do Resultado Fácil: ${error}`);
    } finally {
      await browser.close();
    }

    logger.info(`Scrape concluído! Total de resultados: ${results.length}`);
    return results;
  }

  private async scrapeBanca(page: puppeteer.Page, url: string, bancaName: string, targetDate: string): Promise<ScrapingResult | null> {
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(3000);

      // Tentar diferentes estratégias de extração
      const strategies = [
        () => this.extractByTable(page),
        () => this.extractByDivs(page),
        () => this.extractByTextPattern(page)
      ];

      for (const strategy of strategies) {
        try {
          const prizes = await strategy();
          if (prizes.length > 0) {
            return {
              lotteryName: bancaName,
              date: targetDate,
              prizes: prizes,
              source: 'resultadofacil', // Identificador interno - nunca exposto na API
              scrapedAt: new Date().toISOString(),
              format: this.detectFormat(prizes),
              status: 'success'
            };
          }
        } catch (error) {
          logger.warn(`Estratégia de extração falhou para ${bancaName}: ${error}`);
          continue;
        }
      }

      return null;
    } catch (error) {
      logger.error(`Erro ao acessar URL ${url}: ${error}`);
      return null;
    }
  }

  private async extractByTable(page: puppeteer.Page): Promise<LotteryPrize[]> {
    const prizes: LotteryPrize[] = [];
    
    // Procurar tabelas de resultados
    const tables = await page.$$('table');
    
    for (const table of tables) {
      const rows = await table.$$('tr');
      
      for (const row of rows) {
        const text = await row.evaluate(el => el.textContent?.trim() || '');
        
        // Procurar padrões de resultados na linha
        const rowPrizes = this.extractPrizesFromText(text);
        if (rowPrizes.length > 0) {
          prizes.push(...rowPrizes);
        }
      }
    }
    
    return prizes;
  }

  private async extractByDivs(page: puppeteer.Page): Promise<LotteryPrize[]> {
    const prizes: LotteryPrize[] = [];
    
    // Procurar divs que podem conter resultados
    const divs = await page.$$('[class*="result"], [class*="premio"], [class*="jogo"]');
    
    for (const div of divs) {
      const text = await div.evaluate(el => el.textContent?.trim() || '');
      
      // Procurar padrões de resultados no texto
      const divPrizes = this.extractPrizesFromText(text);
      if (divPrizes.length > 0) {
        prizes.push(...divPrizes);
      }
    }
    
    return prizes;
  }

  private async extractByTextPattern(page: puppeteer.Page): Promise<LotteryPrize[]> {
    // Obter todo o texto da página
    const pageText = await page.evaluate(() => document.body.textContent || '');
    
    // Extrair prêmios do texto
    return this.extractPrizesFromText(pageText);
  }

  private extractPrizesFromText(text: string): LotteryPrize[] {
    const prizes: LotteryPrize[] = [];
    
    // Padrões para extrair prêmios (baseados nas análises dos sites)
    const patterns = [
      // Padrão: 1º 1234 - 2º 5678 - 3º 9012 - 4º 3456 - 5º 7890
      /(\d+º)\s*(\d{3,4})/g,
      // Padrão: 1° 1234, 2° 5678, 3° 9012, 4° 3456, 5° 7890
      /(\d+°)\s*(\d{3,4})/g,
      // Padrão: Prêmio 1º 1234 Milhar 25 Vaca
      /(?:Prêmio|Premio)?\s*(\d+º)\s*(\d{3,4})(?:\s*Milhar)?\s*(\d{1,2})?\s*(\w+)?/gi,
      // Padrão de números de 3-4 dígitos em sequência (mais cuidadoso)
      /\b(\d{3,4})\b/g
    ];
    
    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      
      if (matches.length >= 5) {
        matches.slice(0, 10).forEach((match, index) => {
          let number: string;
          let position: number;
          
          if (match[1] && match[2]) {
            // Padrão com posição e número
            position = parseInt(match[1].replace(/[º°]/, ''));
            number = match[2];
          } else if (match[1] && !match[2]) {
            // Apenas número
            position = index + 1;
            number = match[1];
          } else {
            return;
          }
          
          if (number && number.length >= 3 && number.length <= 4) {
            prizes.push({
              position: position,
              number: number,
              animal: this.getAnimalByNumber(number),
              group: this.getGroupByNumber(number)
            });
          }
        });
        
        break; // Usar o primeiro padrão que encontrar resultados
      }
    }
    
    return prizes;
  }

  private getAnimalByNumber(number: string): string {
    const num = parseInt(number.slice(-2));
    
    // Grupos e animais do jogo do bicho
    const animals = {
      1: 'Avestruz', 2: 'Águia', 3: 'Burro', 4: 'Borboleta', 5: 'Cachorro',
      6: 'Cabra', 7: 'Carneiro', 8: 'Camelo', 9: 'Cobra', 10: 'Coelho',
      11: 'Cavalo', 12: 'Elefante', 13: 'Galo', 14: 'Gato', 15: 'Jacaré',
      16: 'Leão', 17: 'Macaco', 18: 'Porco', 19: 'Pavão', 20: 'Peru',
      21: 'Touro', 22: 'Tigre', 23: 'Urso', 24: 'Veado', 25: 'Vaca'
    };
    
    const group = Math.ceil(num / 4);
    return animals[group as keyof typeof animals] || 'Desconhecido';
  }

  private getGroupByNumber(number: string): string {
    const num = parseInt(number.slice(-2));
    return Math.ceil(num / 4).toString().padStart(2, '0');
  }

  private detectFormat(prizes: LotteryPrize[]): string {
    if (prizes.length <= 5) return '1-5';
    if (prizes.length <= 7) return '1-7';
    return '1-10';
  }

  /**
   * Scrape de ontem (para histórico)
   */
  async scrapeYesterday(): Promise<ScrapingResult[]> {
    const yesterday = getYesterdayDateFormatted();
    return this.scrapeAllBancas(yesterday);
  }

  /**
   * Scrape de hoje (data atual)
   */
  async scrapeToday(): Promise<ScrapingResult[]> {
    const today = getCurrentDateFormatted();
    return this.scrapeAllBancas(today);
  }

  /**
   * Scrape de uma banca específica
   */
  async scrapeBanca(bancaKey: string, date?: string): Promise<ScrapingResult | null> {
    const targetDate = date || getCurrentDateFormatted();
    const bancaConfig = RESULTADO_FACIL_BANCAS[bancaKey];
    
    if (!bancaConfig) {
      logger.error(`Banca não encontrada: ${bancaKey}`);
      return null;
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      const url = this.getBancaUrl(bancaKey, targetDate);
      const result = await this.scrapeBanca(page, url, bancaConfig.displayName, targetDate);
      
      await browser.close();
      return result;
    } catch (error) {
      logger.error(`Erro ao fazer scrape da banca ${bancaKey}:`, error);
      await browser.close();
      return null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Testar uma URL específica com data atual
      const testUrl = this.getBancaUrl('PT_RIO', getCurrentDateFormatted());
      await page.goto(testUrl, { 
        waitUntil: 'networkidle2', 
        timeout: 15000 
      });
      
      await browser.close();
      return true;
    } catch (error) {
      logger.error(`Erro ao testar conexão: ${error}`);
      return false;
    }
  }

  /**
   * Método para obter estatísticas sobre as bancas
   */
  getBancaStats(): { 
    total: number; 
    bancas: string[];
    bancasComMultiplosHorarios: number;
    bancasNacionais: number;
    bancasComEstado: number;
  } {
    const bancas = Object.values(RESULTADO_FACIL_BANCAS);
    return {
      total: bancas.length,
      bancas: bancas.map(b => b.displayName),
      bancasComMultiplosHorarios: bancas.filter(b => b.horarios.length > 1).length,
      bancasNacionais: bancas.filter(b => !b.hasEstado).length,
      bancasComEstado: bancas.filter(b => b.hasEstado).length
    };
  }

  /**
   * Retorna horários de uma banca específica
   */
  getBancaHorarios(bancaKey: string): string[] {
    const banca = RESULTADO_FACIL_BANCAS[bancaKey];
    return banca ? banca.horarios : [];
  }

  /**
   * Retorna todas as bancas configuradas
   */
  getAllBancas(): typeof RESULTADO_FACIL_BANCAS {
    return RESULTADO_FACIL_BANCAS;
  }
}