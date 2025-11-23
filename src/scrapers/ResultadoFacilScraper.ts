import puppeteer from 'puppeteer';
import { DateUtils } from '../utils/DateUtils.js';
import { ProxyManager } from '../utils/proxyManager.js';
import { DatabaseService } from '../services/DatabaseService';
import { EvolutionAPI } from '../services/EvolutionAPI';
import { ScrapingResult, LotteryPrize } from '../types/index';
import logger from '../config/logger';

export class ResultadoFacilScraper {
  private proxyManager: ProxyManager;
  private dbService: DatabaseService;
  private evolutionAPI: EvolutionAPI;

  constructor() {
    this.proxyManager = new ProxyManager();
    this.dbService = new DatabaseService();
    this.evolutionAPI = new EvolutionAPI();
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

      // URL principal do Resultado Fácil
      const url = 'https://amp.resultadofacil.com.br/horarios-jogo-do-bicho';
      
      logger.info(`Navegando para: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Aguardar carregamento dinâmico
      await page.waitForTimeout(3000);

      // Obter resultados de todas as bancas
      const bancaResults = await this.extractAllBancas(page, targetDate);
      
      for (const result of bancaResults) {
        results.push(result);
        
        // Salvar no banco de dados
        try {
          await this.dbService.saveLotteryResult(result);
          logger.info(`Resultado salvo: ${result.lotteryName} - ${result.date}`);
        } catch (error) {
          logger.error(`Erro ao salvar resultado: ${error}`);
        }
      }

    } catch (error) {
      logger.error(`Erro no scrape do Resultado Fácil: ${error}`);
    } finally {
      await browser.close();
    }

    return results;
  }

  private async extractAllBancas(page: any, targetDate: string): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];
    
    // Mapeamento completo das bancas do Resultado Fácil
    const bancas = [
      { name: 'FEDERAL', selector: '.federal-results', time: '19:00' },
      { name: 'RIO', selector: '.rio-results', time: '14:20' },
      { name: 'SÃO PAULO', selector: '.sao-paulo-results', time: '14:25' },
      { name: 'MINAS GERAIS', selector: '.minas-results', time: '16:00' },
      { name: 'CEARÁ', selector: '.ceara-results', time: '16:00' },
      { name: 'PARAÍBA', selector: '.paraiba-results', time: '19:00' },
      { name: 'BAHIA', selector: '.bahia-results', time: '18:00' },
      { name: 'PARANÁ', selector: '.parana-results', time: '14:00' },
      { name: 'NACIONAL', selector: '.nacional-results', time: '19:30' },
      { name: 'PERNAMBUCO', selector: '.pernambuco-results', time: '14:00' },
      { name: 'ALAGOAS', selector: '.alagoas-results', time: '15:00' },
      { name: 'PARA', selector: '.para-results', time: '17:00' },
      { name: 'MATO GROSSO', selector: '.mato-grosso-results', time: '15:00' },
      { name: 'MATO GROSSO DO SUL', selector: '.mato-grosso-sul-results', time: '15:00' },
      { name: 'GOIÁS', selector: '.goias-results', time: '14:00' },
      { name: 'DISTRITO FEDERAL', selector: '.df-results', time: '19:00' },
      { name: 'ESPIRITO SANTO', selector: '.espirito-santo-results', time: '14:00' },
      { name: 'PIAUÍ', selector: '.piaui-results', time: '15:00' },
      { name: 'RIO GRANDE DO NORTE', selector: '.rn-results', time: '14:00' },
      { name: 'RIO GRANDE DO SUL', selector: '.rs-results', time: '19:00' },
      { name: 'SANTA CATARINA', selector: '.sc-results', time: '19:00' },
      { name: 'MARANHÃO', selector: '.maranhao-results', time: '18:00' },
      { name: 'TOCANTINS', selector: '.tocantins-results', time: '14:00' },
      { name: 'RONDÔNIA', selector: '.rondonia-results', time: '17:00' },
      { name: 'ACRE', selector: '.acre-results', time: '17:00' },
      { name: 'AMAZONAS', selector: '.amazonas-results', time: '17:00' },
      { name: 'RORAIMA', selector: '.roraima-results', time: '17:00' },
      { name: 'APARÁ', selector: '.apara-results', time: '17:00' }
    ];

    // Tentar diferentes estratégias de extração
    const strategies = [
      () => this.extractByCards(page, bancas, targetDate),
      () => this.extractByTables(page, bancas, targetDate),
      () => this.extractByLists(page, bancas, targetDate),
      () => this.extractByTextPattern(page, bancas, targetDate)
    ];

    for (const strategy of strategies) {
      try {
        const extractedResults = await strategy();
        if (extractedResults.length > 0) {
          results.push(...extractedResults);
          break;
        }
      } catch (error) {
        logger.warn(`Estratégia de extração falhou: ${error}`);
        continue;
      }
    }

    return results;
  }

  private async extractByCards(page: any, bancas: any[], targetDate: string): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];
    
    // Procurar cards de resultados
    const cards = await page.$$('[class*="result"], [class*="card"], [class*="box"]');
    
    for (const card of cards) {
      try {
        const text = await card.evaluate(el => el.textContent?.trim() || '');
        
        if (text.includes(targetDate)) {
          // Detectar banca pelo conteúdo
          const banca = this.detectBancaByText(text);
          
          if (banca) {
            const prizes = this.extractPrizesFromText(text);
            
            if (prizes.length > 0) {
              const result: ScrapingResult = {
                lotteryName: banca,
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
        logger.warn(`Erro ao extrair card: ${error}`);
      }
    }
    
    return results;
  }

  private async extractByTables(page: any, bancas: any[], targetDate: string): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];
    
    // Procurar tabelas de resultados
    const tables = await page.$$('table, [class*="table"]');
    
    for (const table of tables) {
      try {
        const rows = await table.$$('tr, [class*="row"]');
        
        for (const row of rows) {
          const text = await row.evaluate(el => el.textContent?.trim() || '');
          
          if (text.includes(targetDate)) {
            const banca = this.detectBancaByText(text);
            
            if (banca) {
              const prizes = this.extractPrizesFromText(text);
              
              if (prizes.length > 0) {
                const result: ScrapingResult = {
                  lotteryName: banca,
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
        }
      } catch (error) {
        logger.warn(`Erro ao extrair tabela: ${error}`);
      }
    }
    
    return results;
  }

  private async extractByLists(page: any, bancas: any[], targetDate: string): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];
    
    // Procurar listas de resultados
    const lists = await page.$$('ul, ol, [class*="list"]');
    
    for (const list of lists) {
      try {
        const items = await list.$$('li, [class*="item"]');
        
        for (const item of items) {
          const text = await item.evaluate(el => el.textContent?.trim() || '');
          
          if (text.includes(targetDate)) {
            const banca = this.detectBancaByText(text);
            
            if (banca) {
              const prizes = this.extractPrizesFromText(text);
              
              if (prizes.length > 0) {
                const result: ScrapingResult = {
                  lotteryName: banca,
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
        }
      } catch (error) {
        logger.warn(`Erro ao extrair lista: ${error}`);
      }
    }
    
    return results;
  }

  private async extractByTextPattern(page: any, bancas: any[], targetDate: string): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];
    
    // Obter todo o texto da página
    const pageText = await page.evaluate(() => document.body.textContent || '');
    
    // Procurar padrões de resultados
    const patterns = [
      // Padrão: BANCA - DATA - HORA
      /(\w+(?:\s+\w+)*)\s*[-–—]\s*(\d{2}\/\d{2}\/\d{4})\s*[-–—]\s*(\d{2}:\d{2})/gi,
      // Padrão: 1º 1234 - 2º 5678 - 3º 9012
      /(\d+º)\s+(\d{3,4})\s*[-–—]\s*(\d+º)\s+(\d{3,4})\s*[-–—]\s*(\d+º)\s+(\d{3,4})/gi,
      // Padrão: BANCA (horário)
      /(\w+(?:\s+\w+)*)\s*\((\d{2}:\d{2})\)/gi
    ];
    
    for (const pattern of patterns) {
      const matches = [...pageText.matchAll(pattern)];
      
      for (const match of matches) {
        try {
          const fullText = match[0];
          
          if (fullText.includes(targetDate)) {
            const banca = this.detectBancaByText(fullText);
            
            if (banca) {
              const prizes = this.extractPrizesFromText(fullText);
              
              if (prizes.length > 0) {
                const result: ScrapingResult = {
                  lotteryName: banca,
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
          logger.warn(`Erro ao processar padrão: ${error}`);
        }
      }
    }
    
    return results;
  }

  private detectBancaByText(text: string): string | null {
    const bancas = [
      'FEDERAL', 'RIO', 'SÃO PAULO', 'MINAS GERAIS', 'CEARÁ', 'PARAÍBA',
      'BAHIA', 'PARANÁ', 'NACIONAL', 'PERNAMBUCO', 'ALAGOAS', 'PARÁ',
      'MATO GROSSO', 'MATO GROSSO DO SUL', 'GOIÁS', 'DISTRITO FEDERAL',
      'ESPIRITO SANTO', 'PIAUÍ', 'RIO GRANDE DO NORTE', 'RIO GRANDE DO SUL',
      'SANTA CATARINA', 'MARANHÃO', 'TOCANTINS', 'RONDÔNIA', 'ACRE',
      'AMAZONAS', 'RORAIMA', 'APARÁ'
    ];
    
    const upperText = text.toUpperCase();
    
    for (const banca of bancas) {
      if (upperText.includes(banca)) {
        return banca;
      }
    }
    
    // Detectar por siglas comuns
    if (upperText.includes('FED')) return 'FEDERAL';
    if (upperText.includes('RJ') || upperText.includes('RIO')) return 'RIO';
    if (upperText.includes('SP') || upperText.includes('SÃO PAULO')) return 'SÃO PAULO';
    if (upperText.includes('MG') || upperText.includes('MINAS')) return 'MINAS GERAIS';
    if (upperText.includes('CE') || upperText.includes('CEARÁ')) return 'CEARÁ';
    if (upperText.includes('PB') || upperText.includes('PARAÍBA')) return 'PARAÍBA';
    if (upperText.includes('BA') || upperText.includes('BAHIA')) return 'BAHIA';
    if (upperText.includes('PR') || upperText.includes('PARANÁ')) return 'PARANÁ';
    if (upperText.includes('PE') || upperText.includes('PERNAMBUCO')) return 'PERNAMBUCO';
    if (upperText.includes('AL') || upperText.includes('ALAGOAS')) return 'ALAGOAS';
    if (upperText.includes('PA') || upperText.includes('PARÁ')) return 'PARÁ';
    if (upperText.includes('MT') || upperText.includes('MATO GROSSO')) return 'MATO GROSSO';
    if (upperText.includes('MS') || upperText.includes('MATO GROSSO DO SUL')) return 'MATO GROSSO DO SUL';
    if (upperText.includes('GO') || upperText.includes('GOIÁS')) return 'GOIÁS';
    if (upperText.includes('DF') || upperText.includes('DISTRITO FEDERAL')) return 'DISTRITO FEDERAL';
    if (upperText.includes('ES') || upperText.includes('ESPIRITO SANTO')) return 'ESPIRITO SANTO';
    if (upperText.includes('PI') || upperText.includes('PIAUÍ')) return 'PIAUÍ';
    if (upperText.includes('RN') || upperText.includes('RIO GRANDE DO NORTE')) return 'RIO GRANDE DO NORTE';
    if (upperText.includes('RS') || upperText.includes('RIO GRANDE DO SUL')) return 'RIO GRANDE DO SUL';
    if (upperText.includes('SC') || upperText.includes('SANTA CATARINA')) return 'SANTA CATARINA';
    if (upperText.includes('MA') || upperText.includes('MARANHÃO')) return 'MARANHÃO';
    if (upperText.includes('TO') || upperText.includes('TOCANTINS')) return 'TOCANTINS';
    if (upperText.includes('RO') || upperText.includes('RONDÔNIA')) return 'RONDÔNIA';
    if (upperText.includes('AC') || upperText.includes('ACRE')) return 'ACRE';
    if (upperText.includes('AM') || upperText.includes('AMAZONAS')) return 'AMAZONAS';
    if (upperText.includes('RR') || upperText.includes('RORAIMA')) return 'RORAIMA';
    if (upperText.includes('AP') || upperText.includes('APARÁ')) return 'APARÁ';
    
    return null;
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
      // Números de 3-4 dígitos em sequência
      /(\d{3,4})/g
    ];
    
    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      
      if (matches.length >= 5) {
        matches.slice(0, 10).forEach((match, index) => {
          const number = match[2] || match[1];
          
          if (number && number.length >= 3 && number.length <= 4) {
            prizes.push({
              position: index + 1,
              number: number,
              animal: this.getAnimalByNumber(number),
              group: this.getGroupByNumber(number)
            });
          }
        });
        
        break;
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
      await page.goto('https://amp.resultadofacil.com.br/horarios-jogo-do-bicho', { 
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