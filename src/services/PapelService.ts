import puppeteer from 'puppeteer';
import { logger } from '../utils/logger';
import { RESULTADO_FACIL_BASE_URL, RESULTADO_FACIL_BANCAS, getResultadoFacilUrl } from '../config/resultadoFacilBancasConfig';
import { ResultadoFacilDefinitiveScraper } from '../scrapers/ResultadoFacilDefinitiveScraper';

export interface PapelResult {
  banca: string;
  date: string;
  horario?: string;
  premios: {
    position: number;
    milhar: string;
    grupo: string;
  }[];
  tipo: 'papel' | 'pendente' | 'extra';
  fonte?: string;
}

export class PapelService {
  private baseUrl = RESULTADO_FACIL_BASE_URL;

  /**
   * Verifica se há resultados pendentes ou extras na página de resultados
   * "Papel" pode ser resultados não oficiais, pendentes ou extras
   */
  async verificarPapelPendentes(bancaKey: string, date?: string): Promise<PapelResult[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      const dateStr = date || new Date().toISOString().split('T')[0];
      const url = getResultadoFacilUrl(bancaKey, dateStr);

      logger.info(`Verificando papel/pendentes em: ${url}`);

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(3000);

      const pageText = await page.evaluate(() => document.body.innerText);
      const results: PapelResult[] = [];

      // Verificar se há menção a "pendente", "extra", "papel" na página
      const hasPendente = pageText.toLowerCase().includes('pendente');
      const hasExtra = pageText.toLowerCase().includes('extra');
      const hasPapel = pageText.toLowerCase().includes('papel');

      if (hasPendente || hasExtra || hasPapel) {
        logger.info(`Página contém referências a pendente/extra/papel para ${bancaKey}`);

        // Usar o scraper para extrair todos os resultados
        const scraper = new ResultadoFacilDefinitiveScraper();
        const scrapingResults = await scraper.scrapeBanca(page, url, bancaKey, dateStr);

        if (scrapingResults && scrapingResults.prizes && scrapingResults.prizes.length > 0) {
          // Agrupar por horário se houver múltiplos sorteios
          const premios = scrapingResults.prizes.map(p => ({
            position: p.position,
            milhar: p.number,
            grupo: p.group
          }));

          results.push({
            banca: bancaKey,
            date: dateStr,
            premios,
            tipo: hasPendente ? 'pendente' : hasExtra ? 'extra' : 'papel',
            fonte: url
          });
        }
      }

      return results;

    } catch (error) {
      logger.error(`Erro ao verificar papel/pendentes de ${bancaKey}:`, error);
      return [];
    } finally {
      await browser.close();
    }
  }

  /**
   * Verifica papel/pendentes para todas as bancas
   */
  async verificarTodosPapelPendentes(date?: string): Promise<PapelResult[]> {
    const allResults: PapelResult[] = [];
    const bancaKeys = Object.keys(RESULTADO_FACIL_BANCAS);

    for (const bancaKey of bancaKeys) {
      try {
        const results = await this.verificarPapelPendentes(bancaKey, date);
        allResults.push(...results);

        // Pausa entre requisições
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`Erro ao processar ${bancaKey}:`, error);
      }
    }

    return allResults;
  }
}

export const papelService = new PapelService();

