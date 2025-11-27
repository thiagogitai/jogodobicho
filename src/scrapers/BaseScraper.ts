import * as cheerio from 'cheerio';
import { LotteryResult, LotteryType } from '../types';
import { logger } from '../utils/logger';

export abstract class BaseScraper {
  public name: string;
  protected url: string;
  protected lotteryType: LotteryType;

  constructor(name: string, url: string, lotteryType: LotteryType) {
    this.name = name;
    this.url = url;
    this.lotteryType = lotteryType;
  }

  abstract scrape(html: string): Promise<any>;

  protected parseDate(dateStr: string): string {
    // Converte formato brasileiro para ISO
    const parts = dateStr.split('/');
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return new Date().toISOString().split('T')[0];
  }

  protected extractNumbers(text: string): string[] {
    // Extrai números de 4-5 dígitos (formato do jogo do bicho)
    const matches = text.match(/\b\d{4,5}\b/g);
    return matches || [];
  }

  protected extractAnimals(text: string): string[] {
    // Mapeamento de animais do jogo do bicho
    const animals = [
      'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro', 'Cabra', 'Carneiro',
      'Camelo', 'Cobra', 'Coelho', 'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré',
      'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru', 'Touro', 'Tigre', 'Urso', 'Veado',
      'Vaca'
    ];
    
    const foundAnimals: string[] = [];
    animals.forEach(animal => {
      if (text.toLowerCase().includes(animal.toLowerCase())) {
        foundAnimals.push(animal);
      }
    });
    
    return foundAnimals;
  }

  protected getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  protected logResult(result: LotteryResult): void {
    logger.info(`[${this.name}] Resultado extraído:`, {
      date: result.date,
      lotteryType: result.lotteryType,
      results: result.results
    });
  }
}

// Scraper específico para Federal
export class FederalScraper extends BaseScraper {
  constructor() {
    super('Federal', 'https://www.loteriasonline.caixa.gov.br/federal', LotteryType.FEDERAL);
  }

  async scrape(html: string): Promise<LotteryResult> {
    const $ = cheerio.load(html);
    const result: LotteryResult = {
      lotteryType: this.lotteryType,
      date: this.getYesterdayDate(),
      results: {},
      prizes: {},
      source: this.url,
      status: 'active'
    };

    try {
      // Extrai resultados da Federal
      const resultElements = $('.resultado-federal .numero');
      const numbers = this.extractNumbers(resultElements.text());
      
      if (numbers.length >= 5) {
        result.results = {
          first: numbers[0],
          second: numbers[1],
          third: numbers[2],
          fourth: numbers[3],
          fifth: numbers[4]
        };
      }

      // Extrai prêmios
      const prizeElements = $('.premio-federal .valor');
      const prizes = prizeElements.map((i, el) => $(el).text().trim()).get();
      
      if (prizes.length >= 5) {
        result.prizes = {
          first: prizes[0],
          second: prizes[1],
          third: prizes[2],
          fourth: prizes[3],
          fifth: prizes[4]
        };
      }

      this.logResult(result);
      return result;
      
    } catch (error) {
      logger.error(`Erro ao fazer scrape da Federal:`, error);
      throw error;
    }
  }
}

// Scraper para Rio de Janeiro
export class RioDeJaneiroScraper extends BaseScraper {
  constructor() {
    super('Rio de Janeiro', 'https://www.jogodobicho.net/rio-de-janeiro', LotteryType.RIO_DE_JANEIRO);
  }

  async scrape(html: string): Promise<LotteryResult> {
    const $ = cheerio.load(html);
    const result: LotteryResult = {
      lotteryType: this.lotteryType,
      date: this.getYesterdayDate(),
      results: {},
      source: this.url,
      status: 'active'
    };

    try {
      // Extrai resultados do RJ
      const resultTable = $('.resultados-rio table tbody tr');
      const numbers = this.extractNumbers(resultTable.text());
      
      if (numbers.length >= 5) {
        result.results = {
          first: numbers[0],
          second: numbers[1],
          third: numbers[2],
          fourth: numbers[3],
          fifth: numbers[4]
        };
      }

      this.logResult(result);
      return result;
      
    } catch (error) {
      logger.error(`Erro ao fazer scrape do Rio de Janeiro:`, error);
      throw error;
    }
  }
}

// Scraper genérico para outros sites
export class GenericScraper extends BaseScraper {
  private selectors: {
    results: string;
    date?: string;
  };

  constructor(name: string, url: string, lotteryType: LotteryType, selectors: { results: string; date?: string }) {
    super(name, url, lotteryType);
    this.selectors = selectors;
  }

  async scrape(html: string): Promise<LotteryResult> {
    const $ = cheerio.load(html);
    const result: LotteryResult = {
      lotteryType: this.lotteryType,
      date: this.getYesterdayDate(),
      results: {},
      source: this.url,
      status: 'active'
    };

    try {
      // Extrai data se disponível
      if (this.selectors.date) {
        const dateText = $(this.selectors.date).text().trim();
        result.date = this.parseDate(dateText);
      }

      // Extrai resultados
      const resultsText = $(this.selectors.results).text();
      const numbers = this.extractNumbers(resultsText);
      
      if (numbers.length >= 5) {
        result.results = {
          first: numbers[0],
          second: numbers[1],
          third: numbers[2],
          fourth: numbers[3],
          fifth: numbers[4]
        };
      }

      this.logResult(result);
      return result;
      
    } catch (error) {
      logger.error(`Erro ao fazer scrape ${this.name}:`, error);
      throw error;
    }
  }
}