import puppeteer, { Page, Browser } from 'puppeteer';
import { LotteryResult, LotteryType } from '../types';
import { logger } from '../utils/logger';
import { LOTTERY_SITES_CONFIG, detectFormatFromContent, getExpectedFormat } from '../config/lotterySitesConfig';
import { formatAnimalInfo } from '../config/jogoDoBichoConfig';

export interface ScrapingResult {
  success: boolean;
  result?: LotteryResult;
  error?: string;
  attempts: number;
  formatDetected?: {
    numbers: number;
    digits: 3 | 4;
    confidence: number;
  };
}

export class IntelligentScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.page = await this.browser.newPage();
      
      // Configurar user agent e viewport
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await this.page.setViewport({ width: 1920, height: 1080 });
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  async scrapeLottery(lotteryType: LotteryType, targetDate?: string): Promise<ScrapingResult> {
    try {
      await this.initialize();
      
      const config = LOTTERY_SITES_CONFIG.find(c => c.lotteryType === lotteryType);
      if (!config) {
        return {
          success: false,
          error: `Configuração não encontrada para ${lotteryType}`,
          attempts: 0
        };
      }

      const urls = [config.url, ...(config.backupUrls || [])];
      let lastError: string = '';
      
      for (let attempt = 0; attempt < urls.length; attempt++) {
        try {
          logger.info(`Tentando scrap de ${lotteryType} na URL: ${urls[attempt]} (tentativa ${attempt + 1})`);
          
          const result = await this.scrapeUrl(urls[attempt], config, lotteryType, targetDate || undefined);
          if (result.success) {
            return result;
          }
          
          lastError = result.error || 'Erro desconhecido';
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Erro desconhecido';
          logger.warn(`Erro na tentativa ${attempt + 1} para ${lotteryType}:`, error);
        }
      }
      
      return {
        success: false,
        error: `Falhou após ${urls.length} tentativas. Último erro: ${lastError}`,
        attempts: urls.length
      };
      
    } catch (error) {
      logger.error(`Erro geral ao fazer scrap de ${lotteryType}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        attempts: 0
      };
    }
  }

  private async scrapeUrl(url: string, config: any, lotteryType: LotteryType, targetDate?: string): Promise<ScrapingResult> {
    if (!this.page) {
      throw new Error('Página não inicializada');
    }

    try {
      // Navegar para a URL
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Aguardar carregamento do conteúdo
      await this.page.waitForTimeout(2000);
      
      // Obter conteúdo da página
      const content = await this.page.content();
      
      // Detectar formato automaticamente
      const formatDetected = detectFormatFromContent(content, lotteryType);
      logger.info(`Formato detectado para ${lotteryType}:`, formatDetected);
      
      // Extrair resultados baseado no formato detectado
      const extractedResults = await this.extractResults(content, config, formatDetected);
      
      if (extractedResults.length === 0) {
        return {
          success: false,
          error: 'Nenhum resultado encontrado',
          attempts: 1,
          formatDetected
        };
      }
      
      // Detectar data do resultado
      const extractedDate = this.extractDate(content);
      const resultDate = targetDate || extractedDate || new Date().toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
      
      // Criar objeto de resultado
      const result: LotteryResult = {
        lotteryType,
        date: resultDate,
        results: this.formatResults(extractedResults, formatDetected.numbers),
        source: url,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return {
        success: true,
        result,
        attempts: 1,
        formatDetected
      };
      
    } catch (error) {
      logger.error(`Erro ao fazer scrap da URL ${url}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        attempts: 1
      };
    }
  }

  private async extractResults(content: string, config: any, format: { numbers: number; digits: 3 | 4; confidence: number }): Promise<string[]> {
    // Implementar diferentes estratégias de extração baseado no tipo de conteúdo
    const strategies = [
      () => this.extractFromTable(content, config),
      () => this.extractFromList(content, config),
      () => this.extractFromCards(content, config),
      () => this.extractFromText(content, config)
    ];
    
    let allResults: string[] = [];
    
    for (const strategy of strategies) {
      try {
        const results = strategy();
        if (results.length > 0) {
          allResults = [...allResults, ...results];
        }
      } catch (error) {
        logger.warn('Erro em estratégia de extração:', error);
      }
    }
    
    // Filtrar e validar resultados
    const validResults = this.filterValidNumbers(allResults, format.digits);
    
    // Se detectou formato específico, garantir quantidade correta
    if (validResults.length >= format.numbers) {
      return validResults.slice(0, format.numbers);
    }
    
    return validResults;
  }

  private extractFromTable(content: string, config: any): string[] {
    // Implementar extração de tabelas HTML
    const tableRegex = /<table[^>]*>(.*?)<\/table>/gis;
    const tables = content.match(tableRegex) || [];
    
    const results: string[] = [];
    
    for (const table of tables) {
      // Procurar números nas células
      const cellRegex = /<td[^>]*>(.*?)<\/td>/gis;
      const cells = table.match(cellRegex) || [];
      
      for (const cell of cells) {
        const text = this.stripHtml(cell);
        const numbers = this.extractNumbersFromText(text);
        results.push(...numbers);
      }
    }
    
    return results;
  }

  private extractFromList(content: string, config: any): string[] {
    // Implementar extração de listas HTML
    const listRegex = /<li[^>]*>(.*?)<\/li>/gis;
    const listItems = content.match(listRegex) || [];
    
    const results: string[] = [];
    
    for (const item of listItems) {
      const text = this.stripHtml(item);
      const numbers = this.extractNumbersFromText(text);
      results.push(...numbers);
    }
    
    return results;
  }

  private extractFromCards(content: string, config: any): string[] {
    // Implementar extração de cards/divs
    const cardRegex = /<div[^>]*class="[^"]*(?:result|card|prize)[^"]*"[^>]*>(.*?)<\/div>/gis;
    const cards = content.match(cardRegex) || [];
    
    const results: string[] = [];
    
    for (const card of cards) {
      const text = this.stripHtml(card);
      const numbers = this.extractNumbersFromText(text);
      results.push(...numbers);
    }
    
    return results;
  }

  private extractFromText(content: string, config: any): string[] {
    // Implementar extração de texto puro
    const text = this.stripHtml(content);
    return this.extractNumbersFromText(text);
  }

  private extractNumbersFromText(text: string): string[] {
    // Procurar números com 3 ou 4 dígitos
    const numberRegex = /\b\d{3,4}\b/g;
    const matches = text.match(numberRegex) || [];
    
    // Filtrar números válidos (100-9999)
    return matches.filter(num => {
      const n = parseInt(num);
      return n >= 100 && n <= 9999;
    });
  }

  private filterValidNumbers(numbers: string[], expectedDigits: 3 | 4): string[] {
    const validNumbers = numbers.filter(num => {
      const n = parseInt(num);
      if (isNaN(n)) return false;
      
      // Validar dezenas do jogo do bicho (1-100)
      const dezena = n % 100;
      return dezena >= 1 && dezena <= 100;
    });
    
    // Remover duplicatas
    const uniqueNumbers = [...new Set(validNumbers)];
    
    // Ordenar e pegar os primeiros resultados mais prováveis
    return uniqueNumbers.slice(0, 20); // Máximo 20 números
  }

  private formatResults(numbers: string[], expectedCount: number): Record<string, string | null> {
    const positions = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
    const results: Record<string, string | null> = {};
    
    for (let i = 0; i < Math.min(numbers.length, expectedCount); i++) {
      if (positions[i] && numbers[i]) {
        results[positions[i]] = numbers[i];
      }
    }
    
    // Preencher posições faltantes com null
    for (let i = numbers.length; i < expectedCount; i++) {
      if (positions[i]) {
        results[positions[i]] = null;
      }
    }
    
    return results;
  }

  private extractDate(content: string): string | null {
    // Procurar datas no formato brasileiro
    const dateRegex = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g;
    const matches = content.match(dateRegex);
    
    if (matches && matches.length > 0) {
      // Pegar a primeira data encontrada
      const dateStr = matches[0];
      const parts = dateStr.split(/[\/\-]/);
      
      if (parts.length === 3) {
        const day = parseInt(parts[0] || '1');
        const month = parseInt(parts[1] || '1');
        const year = parseInt(parts[2] || '2000') < 100 ? 2000 + parseInt(parts[2] || '2000') : parseInt(parts[2] || '2000');
        
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
          return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
      }
    }
    
    return null;
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remover tags HTML
      .replace(/&[^;]+;/g, ' ') // Remover entidades HTML
      .replace(/\s+/g, ' ') // Normalizar espaços
      .trim();
  }

  // Método para obter data de ontem
  getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
  }

  // Método para scrap de ontem de todas as loterias
  async scrapeAllLotteriesYesterday(): Promise<ScrapingResult[]> {
    const yesterday = this.getYesterdayDate();
    const results: ScrapingResult[] = [];
    
    logger.info(`Iniciando scrap de ontem (${yesterday}) para todas as loterias...`);
    
    const lotteryTypes = Object.values(LotteryType);
    
    for (const lotteryType of lotteryTypes) {
      try {
        logger.info(`Scraping ${lotteryType}...`);
        const result = await this.scrapeLottery(lotteryType, yesterday);
        results.push(result);
        
        // Pequena pausa entre requisições para evitar bloqueio
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        logger.error(`Erro ao fazer scrap de ${lotteryType}:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          attempts: 0
        });
      }
    }
    
    logger.info(`Scrap completo! ${results.filter(r => r.success).length}/${results.length} loterias com resultados.`);
    return results;
  }
}