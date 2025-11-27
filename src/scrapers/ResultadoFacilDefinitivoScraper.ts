import puppeteer from 'puppeteer';
import { DateUtils } from '../utils/DateUtils';
import { ScrapingResult } from '../types';

export class ResultadoFacilDefinitivoScraper {
  async scrapeResultadoFacil(date?: string): Promise<ScrapingResult[]> {
    const targetDate = date || DateUtils.getYesterday();
    const results: ScrapingResult[] = [];

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );
      await page.setViewport({ width: 1366, height: 768 });

      const url = 'https://amp.resultadofacil.com.br/horarios-jogo-do-bicho';
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch {
        const altUrl = 'https://resultadofacil.com.br/horarios-jogo-do-bicho';
        await page.goto(altUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      }

      await page.waitForTimeout(2000);
      const pageText = await page.evaluate(() => document.body.innerText);

      if (pageText && pageText.length > 0) {
        // Placeholder simples: retorna lista vazia para compilar/testar
      }

      return results;
    } finally {
      await browser.close();
    }
  }
}