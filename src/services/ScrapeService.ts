import { LotteryResult, LotteryType } from '../types';
import { proxyManager } from '../utils/proxyManager';
import { logger } from '../utils/logger';
import { ResultadoFacilScraper } from '../scrapers/ResultadoFacilScraper';
import { MultiSourceScraper } from '../scrapers/MultiSourceScraper';
import { scraperManager } from '../scrapers/ScraperManager';

export class ScrapeService {
  private resultadoFacilScraper: ResultadoFacilScraper;
  private multiSourceScraper: MultiSourceScraper;

  constructor() {
    this.resultadoFacilScraper = new ResultadoFacilScraper();
    this.multiSourceScraper = new MultiSourceScraper();
  }

  async scrapeAllResults(): Promise<Map<LotteryType, LotteryResult>> {
    logger.info('Iniciando scrape de todos os resultados');
    
    try {
      // Primeiro tenta o scraper multi-fonte inteligente
      logger.info('🎯 Tentando scraper multi-fonte inteligente...');
      const multiResults = await this.multiSourceScraper.scrapeFromMultipleSources();
      
      if (multiResults.size > 0) {
        logger.info(`✅ Resultados extraídos do scraper multi-fonte: ${multiResults.size}`);
        return multiResults;
      }
      
      // Se não conseguir, tenta o Resultado Fácil
      logger.info('🎯 Tentando Resultado Fácil...');
      const html = await this.fetchWithProxy(this.resultadoFacilScraper.url);
      const results = await this.resultadoFacilScraper.scrape(html);
      
      logger.info(`✅ Resultados extraídos do Resultado Fácil: ${results.size}`);
      return results;
      
    } catch (error) {
      logger.error('❌ Erro nos scrapers principais, tentando scrapers individuais:', error);
      // Se falhar, tenta scrapers individuais
      return await this.scrapeIndividualResults();
    }
  }

  async scrapeYesterdayResults(): Promise<Map<LotteryType, LotteryResult>> {
    logger.info('Buscando resultados de ontem');
    return await this.scrapeAllResults();
  }

  private async fetchWithProxy(url: string): Promise<string> {
    let lastError: Error | null = null;
    const maxRetries = parseInt(process.env.MAX_RETRIES || '3');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const proxy = proxyManager.getNextProxy();
        const axios = proxyManager.getAxiosInstance(proxy || undefined);
        
        logger.info(`Tentativa ${attempt} de ${maxRetries} - Proxy: ${proxy || 'sem proxy'}`);
        
        const response = await axios.get(url);
        
        if (response.status === 200) {
          logger.info(`Sucesso ao buscar ${url}`);
          return response.data;
        }
        
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Tentativa ${attempt} falhou:`, error.message);
        
        if (attempt < maxRetries) {
          // Espera antes de tentar novamente
          await this.delay(2000 * attempt);
        }
      }
    }

    throw lastError || new Error(`Falha ao buscar ${url} após ${maxRetries} tentativas`);
  }

  private async scrapeIndividualResults(): Promise<Map<LotteryType, LotteryResult>> {
    const results = new Map<LotteryType, LotteryResult>();
    const scrapers = scraperManager.getAllScrapers();

    for (const scraper of scrapers) {
      try {
        logger.info(`Scraping individual: ${scraper.name}`);
        const html = await this.fetchWithProxy(scraper.url);
        
        // Usa o scraper apropriado
        if (scraper instanceof ResultadoFacilScraper) {
          const scraperResults = await scraper.scrape(html);
          scraperResults.forEach((result, type) => {
            results.set(type, result);
          });
        } else {
          // @ts-ignore - será implementado nos scrapers individuais
          const result = await scraper.scrape(html);
          results.set(result.lotteryType, result);
        }
        
      } catch (error) {
        logger.error(`Erro ao scrape ${scraper.name}:`, error);
      }
    }

    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeSpecificLottery(type: LotteryType): Promise<LotteryResult | null> {
    logger.info(`Scraping loteria específica: ${type}`);
    
    try {
      const scraper = scraperManager.getScraper(type);
      if (!scraper) {
        logger.warn(`Scraper não encontrado para ${type}`);
        return null;
      }

      const html = await this.fetchWithProxy(scraper.url);
      
      if (scraper instanceof ResultadoFacilScraper) {
        const results = await scraper.scrape(html);
        return results.get(type) || null;
      } else {
        // @ts-ignore
        return await scraper.scrape(html);
      }
      
    } catch (error) {
      logger.error(`Erro ao scrape ${type}:`, error);
      return null;
    }
  }
}

export const scrapeService = new ScrapeService();