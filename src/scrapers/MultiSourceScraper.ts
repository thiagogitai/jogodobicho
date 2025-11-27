import * as cheerio from 'cheerio';
import { LotteryResult, LotteryType } from '../types';
import { logger } from '../utils/logger';
import { BaseScraper } from './BaseScraper';
import { proxyManager } from '../utils/proxyManager';

export class MultiSourceScraper extends BaseScraper {
  private sources = [
    {
      name: 'Jogo do Bicho.net',
      url: 'https://www.jogodobicho.net',
      selectors: {
        rio: '.result-rio .numbers',
        sp: '.result-sp .numbers',
        federal: '.result-federal .numbers'
      }
    },
    {
      name: 'Resultados Hoje',
      url: 'https://www.resultadoshoje.com.br/jogo-do-bicho',
      selectors: {
        results: '.result-numbers'
      }
    },
    {
      name: 'Loterias Caixa',
      url: 'https://loterias.caixa.gov.br',
      selectors: {
        federal: '.federal-result',
        lotep: '.lotep-result'
      }
    }
  ];

  constructor() {
    super('Multi Fonte', 'https://www.jogodobicho.net', LotteryType.NACIONAL);
  }

  async scrape(html: string): Promise<Map<LotteryType, LotteryResult>> {
    const results = new Map<LotteryType, LotteryResult>();
    
    // Tenta extrair de múltiplas fontes
    this.extractFromJogoDoBichoNet(html, results);
    this.extractFromGenericStructure(html, results);
    
    return results;
  }

  private extractFromJogoDoBichoNet(html: string, results: Map<LotteryType, LotteryResult>) {
    try {
      const $ = cheerio.load(html);
      
      // Mapeamento de seções para tipos de loteria
      const sectionMapping = [
        { selector: '.rio-de-janeiro, .result-rio', type: LotteryType.RIO_DE_JANEIRO, name: 'Rio de Janeiro' },
        { selector: '.sao-paulo, .result-sp', type: LotteryType.PT_SP, name: 'PT São Paulo' },
        { selector: '.federal, .result-federal', type: LotteryType.FEDERAL, name: 'Federal' },
        { selector: '.minas-gerais, .result-mg', type: LotteryType.MINAS_GERAIS, name: 'Minas Gerais' },
        { selector: '.goias, .result-go', type: LotteryType.LOOK_GO, name: 'Look GO' },
        { selector: '.nacional, .result-nacional', type: LotteryType.NACIONAL, name: 'Nacional' },
        { selector: '.maluquinha, .result-maluquinha', type: LotteryType.MALUQUINHA_RJ, name: 'Maluquinha RJ' }
      ];

      sectionMapping.forEach(mapping => {
        const section = $(mapping.selector);
        if (section.length > 0) {
          const numbers = this.extractNumbers(section.text());
          
          if (numbers.length >= 3) {
            const result: LotteryResult = {
              lotteryType: mapping.type,
              date: new Date().toISOString().split('T')[0],
              results: {
                first: numbers[0] || '',
                second: numbers[1] || '',
                third: numbers[2] || '',
                fourth: numbers[3] || '',
                fifth: numbers[4] || ''
              },
              source: this.url,
              status: 'active'
            };
            
            results.set(mapping.type, result);
            logger.info(`✅ Extraído ${mapping.name}: ${numbers.join(', ')}`);
          }
        }
      });
      
    } catch (error) {
      logger.error('Erro ao extrair de Jogo do Bicho Net:', error);
    }
  }

  private extractFromGenericStructure(html: string, results: Map<LotteryType, LotteryResult>) {
    try {
      const $ = cheerio.load(html);
      
      // Procura por padrões genéricos de resultados
      const patterns = [
        // Padrão: "RIO: 1234-5678-9012-3456-7890"
        { regex: /RIO[^\d]*(\d{4})[^\d]*(\d{4})?[^\d]*(\d{4})?[^\d]*(\d{4})?[^\d]*(\d{4})?/gi, type: LotteryType.RIO_DE_JANEIRO },
        { regex: /SÃO PAULO[^\d]*(\d{4})[^\d]*(\d{4})?[^\d]*(\d{4})?[^\d]*(\d{4})?[^\d]*(\d{4})?/gi, type: LotteryType.PT_SP },
        { regex: /FEDERAL[^\d]*(\d{4})[^\d]*(\d{4})?[^\d]*(\d{4})?[^\d]*(\d{4})?[^\d]*(\d{4})?/gi, type: LotteryType.FEDERAL },
        { regex: /MINAS[^\d]*(\d{4})[^\d]*(\d{4})?[^\d]*(\d{4})?[^\d]*(\d{4})?[^\d]*(\d{4})?/gi, type: LotteryType.MINAS_GERAIS },
        { regex: /LOOK[^\d]*(\d{4})[^\d]*(\d{4})?[^\d]*(\d{4})?[^\d]*(\d{4})?[^\d]*(\d{4})?/gi, type: LotteryType.LOOK_GO },
        { regex: /NACIONAL[^\d]*(\d{4})[^\d]*(\d{4})?[^\d]*(\d{4})?[^\d]*(\d{4})?[^\d]*(\d{4})?/gi, type: LotteryType.NACIONAL }
      ];

      const bodyText = $('body').text();
      
      patterns.forEach(pattern => {
        const matches = bodyText.match(pattern.regex);
        if (matches && matches.length > 0) {
          matches.forEach(match => {
            const numbers = this.extractNumbers(match);
            if (numbers.length >= 3) {
              const result: LotteryResult = {
                lotteryType: pattern.type,
                date: new Date().toISOString().split('T')[0],
                results: {
                  first: numbers[0] || '',
                  second: numbers[1] || '',
                  third: numbers[2] || '',
                  fourth: numbers[3] || '',
                  fifth: numbers[4] || ''
                },
                source: this.url,
                status: 'active'
              };
              
              results.set(pattern.type, result);
              logger.info(`✅ Extraído genérico ${pattern.type}: ${numbers.join(', ')}`);
            }
          });
        }
      });
      
    } catch (error) {
      logger.error('Erro ao extrair estrutura genérica:', error);
    }
  }

  async scrapeFromMultipleSources(): Promise<Map<LotteryType, LotteryResult>> {
    const allResults = new Map<LotteryType, LotteryResult>();
    
    for (const source of this.sources) {
      try {
        logger.info(`🔄 Tentando fonte: ${source.name}`);
        
        // Usar proxy manager para obter resultados reais
        const proxy = proxyManager.getNextProxy();
        const axios = proxyManager.getAxiosInstance(proxy || undefined);
        
        logger.info(`📡 Acessando: ${source.url} com proxy: ${proxy || 'sem proxy'}`);
        
        const response = await axios.get(source.url);
        
        if (response.status === 200) {
          logger.info(`✅ Sucesso ao acessar ${source.name}`);
          
          // Processar HTML real
          const results = this.processRealSource(response.data, source);
          results.forEach((result, type) => {
            if (!allResults.has(type)) {
              allResults.set(type, result);
            }
          });
        }
        
      } catch (error) {
        logger.error(`❌ Erro na fonte ${source.name}:`, error.message);
      }
    }
    
    return allResults;
  }
  
  private processRealSource(html: string, source: any): Map<LotteryType, LotteryResult> {
    const results = new Map<LotteryType, LotteryResult>();
    const $ = cheerio.load(html);
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Processar cada tipo de loteria baseado na fonte
      if (source.name === 'Jogo do Bicho.net') {
        this.extractFromJogoDoBichoNetReal($, results, today);
      } else if (source.name === 'Resultados Hoje') {
        this.extractFromResultadosHojeReal($, results, today);
      } else if (source.name === 'Loterias Caixa') {
        this.extractFromLoteriasCaixaReal($, results, today);
      }
      
    } catch (error) {
      logger.error(`Erro ao processar fonte ${source.name}:`, error);
    }
    
    return results;
  }
  
  private extractFromJogoDoBichoNetReal($: cheerio.Root, results: Map<LotteryType, LotteryResult>, today: string) {
    // Extrair resultados reais do Jogo do Bicho.net
    const resultElements = $('.result-numbers, .resultado, .numeros');
    
    resultElements.each((i, element) => {
      const text = $(element).text();
      const numbers = this.extractNumbers(text);
      
      if (numbers.length >= 3) {
        // Detectar tipo de loteria pelo contexto
        const lotteryType = this.detectLotteryTypeFromContext(text);
        
        if (lotteryType) {
          const result: LotteryResult = {
            lotteryType,
            date: today,
            results: {
              first: numbers[0] || '',
              second: numbers[1] || '',
              third: numbers[2] || '',
              fourth: numbers[3] || '',
              fifth: numbers[4] || ''
            },
            source: 'jogodobicho.net',
            status: 'active'
          };
          
          results.set(lotteryType, result);
          logger.info(`✅ Extraído real ${lotteryType}: ${numbers.join(', ')}`);
        }
      }
    });
  }
  
  private extractFromResultadosHojeReal($: cheerio.Root, results: Map<LotteryType, LotteryResult>, today: string) {
    // Extrair resultados reais do Resultados Hoje
    const sections = $('.result-section, .lottery-result');
    
    sections.each((i, element) => {
      const text = $(element).text();
      const numbers = this.extractNumbers(text);
      
      if (numbers.length >= 3) {
        const lotteryType = this.detectLotteryTypeFromContext(text);
        
        if (lotteryType) {
          const result: LotteryResult = {
            lotteryType,
            date: today,
            results: {
              first: numbers[0] || '',
              second: numbers[1] || '',
              third: numbers[2] || '',
              fourth: numbers[3] || '',
              fifth: numbers[4] || ''
            },
            source: 'resultadoshoje.com.br',
            status: 'active'
          };
          
          results.set(lotteryType, result);
          logger.info(`✅ Extraído real ${lotteryType}: ${numbers.join(', ')}`);
        }
      }
    });
  }
  
  private extractFromLoteriasCaixaReal($: cheerio.Root, results: Map<LotteryType, LotteryResult>, today: string) {
    // Extrair resultados reais das Loterias Caixa
    const federalResults = $('.federal-result, .resultado-federal');
    
    federalResults.each((i, element) => {
      const text = $(element).text();
      const numbers = this.extractNumbers(text);
      
      if (numbers.length >= 5) {
        const result: LotteryResult = {
          lotteryType: LotteryType.FEDERAL,
          date: today,
          results: {
            first: numbers[0] || '',
            second: numbers[1] || '',
            third: numbers[2] || '',
            fourth: numbers[3] || '',
            fifth: numbers[4] || ''
          },
          source: 'loterias.caixa.gov.br',
          status: 'active'
        };
        
        results.set(LotteryType.FEDERAL, result);
        logger.info(`✅ Extraído real FEDERAL: ${numbers.join(', ')}`);
      }
    });
  }
  
  private detectLotteryTypeFromContext(text: string): LotteryType | null {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('rio') || lowerText.includes('rj')) return LotteryType.RIO_DE_JANEIRO;
    if (lowerText.includes('são paulo') || lowerText.includes('sp')) return LotteryType.PT_SP;
    if (lowerText.includes('federal')) return LotteryType.FEDERAL;
    if (lowerText.includes('minas') || lowerText.includes('mg')) return LotteryType.MINAS_GERAIS;
    if (lowerText.includes('look') || lowerText.includes('go')) return LotteryType.LOOK_GO;
    if (lowerText.includes('nacional')) return LotteryType.NACIONAL;
    if (lowerText.includes('maluquinha')) return LotteryType.MALUQUINHA_RJ;
    if (lowerText.includes('lotep')) return LotteryType.LOTEP;
    if (lowerText.includes('lotece')) return LotteryType.LOTECE;
    if (lowerText.includes('boa sorte')) return LotteryType.BOA_SORTE;
    
    return null;
  }


}