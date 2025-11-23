import puppeteer from 'puppeteer';
import { logger } from '../utils/logger';
import { RESULTADO_FACIL_BASE_URL } from '../config/resultadoFacilBancasConfig';

export interface PapelResult {
  banca: string;
  date: string;
  horario?: string;
  premios: {
    position: number;
    milhar: string;
    grupo: string;
  }[];
  tipo: 'papel' | 'atrasado';
}

export interface AtrasadoInfo {
  milhar: string;
  grupo: string;
  diasAtrasado: number;
  ultimaVez: string;
}

export class PapelAtrasadosScraper {
  private baseUrl = RESULTADO_FACIL_BASE_URL;

  /**
   * Extrai resultados de papel de uma banca específica
   * Papel geralmente são resultados não oficiais ou pendentes
   */
  async scrapePapel(bancaKey: string, date?: string): Promise<PapelResult[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      // Tentar diferentes padrões de URL para papel
      const dateStr = date || new Date().toISOString().split('T')[0];
      const urls = [
        `${this.baseUrl}/papel-${bancaKey.toLowerCase()}-do-dia-${dateStr}`,
        `${this.baseUrl}/resultados-papel-${bancaKey.toLowerCase()}-do-dia-${dateStr}`,
        `${this.baseUrl}/${bancaKey.toLowerCase()}-papel-do-dia-${dateStr}`,
        `${this.baseUrl}/papel-do-dia-${dateStr}?banca=${bancaKey}`,
      ];

      const results: PapelResult[] = [];

      for (const url of urls) {
        try {
          logger.info(`Tentando URL de papel: ${url}`);
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
          await page.waitForTimeout(2000);

          const pageText = await page.evaluate(() => document.body.innerText);
          
          // Verificar se a página contém resultados de papel
          if (pageText.toLowerCase().includes('papel') || 
              pageText.toLowerCase().includes('pendente') ||
              pageText.toLowerCase().includes('extra')) {
            
            const premios = await this.extractPremios(page);
            
            if (premios.length > 0) {
              results.push({
                banca: bancaKey,
                date: dateStr,
                premios,
                tipo: 'papel'
              });
              
              logger.info(`✅ Papel encontrado para ${bancaKey}: ${premios.length} prêmios`);
              break; // Se encontrou, não precisa testar outras URLs
            }
          }
        } catch (error) {
          // URL não existe ou erro, continuar para próxima
          continue;
        }
      }

      return results;

    } catch (error) {
      logger.error(`Erro ao extrair papel de ${bancaKey}:`, error);
      return [];
    } finally {
      await browser.close();
    }
  }

  /**
   * Extrai números atrasados de uma banca
   * Atrasados são números que não saem há muito tempo
   */
  async scrapeAtrasados(bancaKey: string): Promise<AtrasadoInfo[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      // Tentar diferentes padrões de URL para atrasados
      const urls = [
        `${this.baseUrl}/atrasados-${bancaKey.toLowerCase()}`,
        `${this.baseUrl}/resultados-atrasados-${bancaKey.toLowerCase()}`,
        `${this.baseUrl}/${bancaKey.toLowerCase()}-atrasados`,
        `${this.baseUrl}/atrasados?banca=${bancaKey}`,
        `${this.baseUrl}/numeros-atrasados-${bancaKey.toLowerCase()}`,
      ];

      for (const url of urls) {
        try {
          logger.info(`Tentando URL de atrasados: ${url}`);
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
          await page.waitForTimeout(2000);

          const pageText = await page.evaluate(() => document.body.innerText);
          
          // Verificar se a página contém informações de atrasados
          if (pageText.toLowerCase().includes('atrasado') || 
              pageText.toLowerCase().includes('não sai') ||
              pageText.toLowerCase().includes('frequência')) {
            
            const atrasados = await this.extractAtrasados(page);
            
            if (atrasados.length > 0) {
              logger.info(`✅ Atrasados encontrados para ${bancaKey}: ${atrasados.length} números`);
              return atrasados;
            }
          }
        } catch (error) {
          // URL não existe ou erro, continuar para próxima
          continue;
        }
      }

      // Se não encontrou em URLs específicas, tentar calcular baseado nos resultados históricos
      logger.info(`Tentando calcular atrasados baseado em histórico para ${bancaKey}`);
      return await this.calculateAtrasados(bancaKey);

    } catch (error) {
      logger.error(`Erro ao extrair atrasados de ${bancaKey}:`, error);
      return [];
    } finally {
      await browser.close();
    }
  }

  /**
   * Extrai prêmios de uma página
   */
  private async extractPremios(page: puppeteer.Page): Promise<PapelResult['premios']> {
    const premios: PapelResult['premios'] = [];

    try {
      // Tentar extrair de tabelas
      const tables = await page.$$('table');
      
      for (const table of tables) {
        const rows = await table.$$('tr');
        
        for (const row of rows) {
          const cells = await row.$$('td');
          if (cells.length >= 2) {
            const text = await row.evaluate(el => el.textContent?.trim() || '');
            
            // Procurar padrão: posição, milhar, grupo
            const match = text.match(/(\d+)[º°]\s*(\d{4})\s*(\d{1,2})/);
            if (match) {
              premios.push({
                position: parseInt(match[1]),
                milhar: match[2],
                grupo: match[3]
              });
            }
          }
        }
      }

      // Se não encontrou em tabelas, tentar por texto
      if (premios.length === 0) {
        const pageText = await page.evaluate(() => document.body.innerText);
        const matches = pageText.matchAll(/(\d+)[º°]\s*(\d{4})\s*(\d{1,2})/g);
        
        for (const match of matches) {
          premios.push({
            position: parseInt(match[1]),
            milhar: match[2],
            grupo: match[3]
          });
        }
      }

    } catch (error) {
      logger.error('Erro ao extrair prêmios:', error);
    }

    return premios;
  }

  /**
   * Extrai informações de números atrasados
   */
  private async extractAtrasados(page: puppeteer.Page): Promise<AtrasadoInfo[]> {
    const atrasados: AtrasadoInfo[] = [];

    try {
      // Tentar extrair de tabelas
      const tables = await page.$$('table');
      
      for (const table of tables) {
        const rows = await table.$$('tr');
        
        for (const row of rows) {
          const text = await row.evaluate(el => el.textContent?.trim() || '');
          
          // Procurar padrão: milhar, grupo, dias atrasado
          const match = text.match(/(\d{4})\s*(\d{1,2})\s*(\d+)\s*dias?/i);
          if (match) {
            atrasados.push({
              milhar: match[1],
              grupo: match[2],
              diasAtrasado: parseInt(match[3]),
              ultimaVez: '' // Será preenchido se disponível
            });
          }
        }
      }

    } catch (error) {
      logger.error('Erro ao extrair atrasados:', error);
    }

    return atrasados;
  }

  /**
   * Calcula números atrasados baseado em histórico de resultados
   * (Fallback se não encontrar página específica)
   */
  private async calculateAtrasados(bancaKey: string): Promise<AtrasadoInfo[]> {
    // Esta função precisaria acessar o banco de dados para calcular
    // quais números não saem há mais tempo
    // Por enquanto, retorna vazio
    logger.info('Cálculo de atrasados por histórico não implementado ainda');
    return [];
  }

  /**
   * Extrai papel e atrasados de todas as bancas
   */
  async scrapeAll(bancaKeys: string[], date?: string): Promise<{
    papel: PapelResult[];
    atrasados: AtrasadoInfo[];
  }> {
    const papel: PapelResult[] = [];
    const atrasados: AtrasadoInfo[] = [];

    for (const bancaKey of bancaKeys) {
      try {
        const papelResults = await this.scrapePapel(bancaKey, date);
        papel.push(...papelResults);

        const atrasadosResults = await this.scrapeAtrasados(bancaKey);
        atrasados.push(...atrasadosResults);

        // Pequena pausa entre requisições
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`Erro ao processar ${bancaKey}:`, error);
      }
    }

    return { papel, atrasados };
  }
}

