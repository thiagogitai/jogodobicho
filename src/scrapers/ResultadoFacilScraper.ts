import puppeteer from 'puppeteer';
import { DateUtils } from '../utils/DateUtils';
import { ProxyManager } from '../utils/proxyManager';
import { ScrapingResult, LotteryPrize, LotteryType } from '../types';
import { logger } from '../utils/logger';
import {
  RESULTADO_FACIL_BANCAS,
  getResultadoFacilUrl,
  getAllBancas,
  BancaConfig
} from '../config/resultadoFacilBancasConfig';

export class ResultadoFacilScraper {
  public url: string = 'https://www.resultadofacil.com.br';
  private proxyManager: ProxyManager;

  constructor() {
    this.proxyManager = new ProxyManager();
  }

  async scrapeResultadoFacil(date?: string): Promise<ScrapingResult[]> {
    const targetDate = date || DateUtils.getYesterday();
    const results: ScrapingResult[] = [];

    logger.info(`Iniciando scrape do Resultado Fácil para data: ${targetDate}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();

      // Configurar user agent e viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      // Obter todas as bancas configuradas
      const bancas = getAllBancas();

      for (const banca of bancas) {
        try {
          // Construir URL dinâmica para a banca e data
          const url = getResultadoFacilUrl(banca.key, targetDate);
          logger.info(`Navegando para banca ${banca.displayName}: ${url}`);

          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

          // Extrair resultados da página específica da banca
          const bancaResults = await this.extractBancaPage(page, banca, targetDate);

          if (bancaResults.length > 0) {
            results.push(...bancaResults);
            logger.info(`✅ ${bancaResults.length} resultados encontrados para ${banca.displayName}`);
          } else {
            logger.warn(`⚠️ Nenhum resultado encontrado para ${banca.displayName}`);
          }

          // Pequena pausa para não sobrecarregar
          await page.waitForTimeout(1000);

        } catch (error) {
          logger.error(`Erro ao processar banca ${banca.displayName}: ${error}`);
        }
      }

    } catch (error) {
      logger.error(`Erro geral no scrape do Resultado Fácil: ${error}`);
    } finally {
      await browser.close();
    }

    return results;
  }

  private async extractBancaPage(page: any, banca: BancaConfig, targetDate: string): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];

    // Estratégias de extração para a página de detalhe
    // Geralmente as páginas de detalhe têm tabelas ou cards com os horários

    try {
      // Procurar por blocos de horário (ex: 11:00, 14:00)
      // A estrutura geralmente é um card por horário
      const cards = await page.$$('[class*="result"], [class*="card"], [class*="box"], div.white-box');

      for (const card of cards) {
        const text = await card.evaluate((el: any) => el.textContent?.trim() || '');

        // Verificar se contém horário válido
        const timeMatch = text.match(/(\d{2}:\d{2})/);
        if (timeMatch) {
          const time = timeMatch[1];
          const prizes = this.extractPrizesFromText(text);

          if (prizes.length > 0) {
            const result: ScrapingResult = {
              lotteryName: banca.displayName,
              date: targetDate,
              time: time,
              prizes: prizes,
              source: 'resultadofacil.com.br',
              scrapedAt: new Date().toISOString(),
              format: this.detectFormat(prizes),
              status: 'success'
            };

            results.push(result);
          }
        }
      }

      // Se não achou por cards, tenta tabelas
      if (results.length === 0) {
        const tables = await page.$$('table');
        for (const table of tables) {
          const text = await table.evaluate((el: any) => el.textContent?.trim() || '');
          const prizes = this.extractPrizesFromText(text);

          if (prizes.length > 0) {
            // Tenta achar o horário na tabela ou próximo a ela
            // Implementação simplificada
            const result: ScrapingResult = {
              lotteryName: banca.displayName,
              date: targetDate,
              prizes: prizes,
              source: 'resultadofacil.com.br',
              scrapedAt: new Date().toISOString(),
              format: this.detectFormat(prizes),
              status: 'success'
            };
            results.push(result);
          }
        }
      }

    } catch (error) {
      logger.warn(`Erro na extração da página da banca ${banca.name}: ${error}`);
    }

    return results;
  }

  private extractPrizesFromText(text: string): LotteryPrize[] {
    const prizes: LotteryPrize[] = [];

    // Padrões para extrair prêmios
    const patterns = [
      // 1º 1234 - 2º 5678 - 3º 9012 - 4º 3456 - 5º 7890
      /(\d+º)\s*(\d{3,4})/g,
      // 1° 1234, 2° 5678, 3° 9012, 4° 3456, 5° 7890
      /(\d+°)\s*(\d{3,4})/g,
      // 1 1234 2 5678 3 9012 4 3456 5 7890
      /(?:^|\s)(\d)\s+(\d{3,4})(?:\s|$)/g,
      // Números de 3-4 dígitos em sequência (fallback)
      /(\d{3,4})/g
    ];

    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];

      if (matches.length >= 5) {
        matches.slice(0, 10).forEach((match, index) => {
          // Ajuste para pegar o grupo correto dependendo do regex
          const number = match[2] || (match[1].length >= 3 ? match[1] : null);

          if (number && number.length >= 3 && number.length <= 4) {
            prizes.push({
              position: index + 1,
              number: number,
              animal: this.getAnimalByNumber(number),
              group: this.getGroupByNumber(number)
            });
          }
        });

        // Se encontrou 5 ou mais prêmios com este padrão, para
        if (prizes.length >= 5) break;
      }
    }

    // Se falhou ou misturou, tenta limpar e pegar apenas os primeiros 5-10 válidos
    return prizes.slice(0, 10);
  }

  private getAnimalByNumber(number: string): string {
    const num = parseInt(number.slice(-2));
    if (isNaN(num)) return 'Desconhecido';

    // Grupos e animais do jogo do bicho
    const animals = {
      1: 'Avestruz', 2: 'Águia', 3: 'Burro', 4: 'Borboleta', 5: 'Cachorro',
      6: 'Cabra', 7: 'Carneiro', 8: 'Camelo', 9: 'Cobra', 10: 'Coelho',
      11: 'Cavalo', 12: 'Elefante', 13: 'Galo', 14: 'Gato', 15: 'Jacaré',
      16: 'Leão', 17: 'Macaco', 18: 'Porco', 19: 'Pavão', 20: 'Peru',
      21: 'Touro', 22: 'Tigre', 23: 'Urso', 24: 'Veado', 25: 'Vaca'
    };

    const group = Math.ceil(num / 4) || 25; // 00 é vaca (25)
    return animals[group as keyof typeof animals] || 'Desconhecido';
  }

  private getGroupByNumber(number: string): string {
    const num = parseInt(number.slice(-2));
    if (isNaN(num)) return '00';
    const group = Math.ceil(num / 4) || 25;
    return group.toString().padStart(2, '0');
  }

  private detectFormat(prizes: LotteryResult[]): string {
    if (prizes.length <= 5) return '1-5';
    if (prizes.length <= 7) return '1-7';
    return '1-10';
  }

  async scrapeYesterday(): Promise<ScrapingResult[]> {
    const yesterday = DateUtils.getYesterday();
    return this.scrapeResultadoFacil(yesterday);
  }

  async testConnection(): Promise<boolean> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.goto('https://www.resultadofacil.com.br', {
        waitUntil: 'networkidle2',
        timeout: 10000
      });

      await browser.close();
      return true;
    } catch (error) {
      logger.error(`Erro ao testar conexão: ${error}`);
      return false;
    }
  }
}