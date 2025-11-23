import { BaseScraper, GenericScraper } from './BaseScraper';
import { LotteryType } from '../types';
import { logger } from '../utils/logger';

export class ScraperManager {
  private scrapers: Map<LotteryType, BaseScraper> = new Map();

  constructor() {
    this.initializeScrapers();
  }

  private initializeScrapers() {
    // Configurações de scrapers para cada loteria
    const scraperConfigs = [
      {
        type: LotteryType.FEDERAL,
        name: 'Federal',
        url: 'https://www.loteriasonline.caixa.gov.br/federal',
        selectors: { results: '.resultado-federal .numero' }
      },
      {
        type: LotteryType.RIO_DE_JANEIRO,
        name: 'Rio de Janeiro',
        url: 'https://www.jogodobicho.net/rio-de-janeiro',
        selectors: { results: '.resultados-rio table tbody' }
      },
      {
        type: LotteryType.LOOK_GO,
        name: 'Look GO',
        url: 'https://www.jogodobicho.net/goias',
        selectors: { results: '.resultados-goias table tbody' }
      },
      {
        type: LotteryType.PT_SP,
        name: 'PT São Paulo',
        url: 'https://www.jogodobicho.net/sao-paulo',
        selectors: { results: '.resultados-sp table tbody' }
      },
      {
        type: LotteryType.NACIONAL,
        name: 'Nacional',
        url: 'https://www.jogodobicho.net/nacional',
        selectors: { results: '.resultados-nacional table tbody' }
      },
      {
        type: LotteryType.MALUQUINHA_RJ,
        name: 'Maluquinha Rio',
        url: 'https://www.jogodobicho.net/maluquinha-rj',
        selectors: { results: '.resultados-maluquinha table tbody' }
      },
      {
        type: LotteryType.LOTEP,
        name: 'LOTEP',
        url: 'https://www.loterias.caixa.gov.br/Paginas/LOTEP.aspx',
        selectors: { results: '.resultado-lotep .numbers' }
      },
      {
        type: LotteryType.LOTECE,
        name: 'LOTECE',
        url: 'https://www.loterias.caixa.gov.br/Paginas/LOTECE.aspx',
        selectors: { results: '.resultado-lotece .numbers' }
      },
      {
        type: LotteryType.MINAS_GERAIS,
        name: 'Minas Gerais',
        url: 'https://www.jogodobicho.net/minas-gerais',
        selectors: { results: '.resultados-mg table tbody' }
      },
      {
        type: LotteryType.BOA_SORTE,
        name: 'Boa Sorte',
        url: 'https://www.jogodobicho.net/boa-sorte',
        selectors: { results: '.resultados-boa-sorte table tbody' }
      },
      {
        type: LotteryType.LOTERIAS_CAIXA,
        name: 'Loterias da Caixa',
        url: 'https://loterias.caixa.gov.br',
        selectors: { results: '.resultados-loterias .numbers' }
      }
    ];

    scraperConfigs.forEach(config => {
      const scraper = new GenericScraper(
        config.name,
        config.url,
        config.type,
        config.selectors
      );
      this.scrapers.set(config.type, scraper);
    });

    logger.info(`Inicializados ${this.scrapers.size} scrapers`);
  }

  getScraper(type: LotteryType): BaseScraper | undefined {
    return this.scrapers.get(type);
  }

  getAllScrapers(): BaseScraper[] {
    return Array.from(this.scrapers.values());
  }

  async scrapeByType(type: LotteryType): Promise<any> {
    const scraper = this.getScraper(type);
    if (!scraper) {
      throw new Error(`Scraper não encontrado para ${type}`);
    }

    try {
      logger.info(`Iniciando scrape para ${scraper.name}`);
      // Aqui será integrado com o proxy manager e axios
      return await this.executeScrape(scraper);
    } catch (error) {
      logger.error(`Erro no scrape de ${scraper.name}:`, error);
      throw error;
    }
  }

  private async executeScrape(scraper: BaseScraper): Promise<any> {
    // Implementação será feita no serviço principal
    logger.info(`Executando scrape para ${scraper.name}`);
    return {};
  }

  async scrapeAll(): Promise<Map<LotteryType, any>> {
    const results = new Map<LotteryType, any>();
    
    for (const [type, scraper] of this.scrapers) {
      try {
        const result = await this.scrapeByType(type);
        results.set(type, result);
        logger.info(`Scrape bem-sucedido para ${scraper.name}`);
      } catch (error) {
        logger.error(`Falha no scrape de ${scraper.name}:`, error);
        results.set(type, null);
      }
    }

    return results;
  }
}

export const scraperManager = new ScraperManager();