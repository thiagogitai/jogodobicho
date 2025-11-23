import * as cheerio from 'cheerio';
import { LotteryResult, LotteryType } from '../types';
import { logger } from '../utils/logger';
import { BaseScraper } from './BaseScraper';

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
              date: this.getYesterdayDate(),
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
                date: this.getYesterdayDate(),
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
        // Aqui seria integrado com o proxy manager
        // Por enquanto, retorna resultados simulados para demonstração
        
        const mockResults = this.generateMockResults();
        mockResults.forEach((result, type) => {
          if (!allResults.has(type)) {
            allResults.set(type, result);
          }
        });
        
      } catch (error) {
        logger.error(`❌ Erro na fonte ${source.name}:`, error);
      }
    }
    
    return allResults;
  }

  private generateMockResults(): Map<LotteryType, LotteryResult> {
    const results = new Map<LotteryType, LotteryResult>();
    const yesterday = this.getYesterdayDate();
    
    // Gera resultados simulados para demonstração
    const mockData = [
      { type: LotteryType.FEDERAL, name: 'Federal', numbers: ['1234', '5678', '9012', '3456', '7890'] },
      { type: LotteryType.RIO_DE_JANEIRO, name: 'Rio de Janeiro', numbers: ['2345', '6789', '0123', '4567', '8901'] },
      { type: LotteryType.LOOK_GO, name: 'Look GO', numbers: ['3456', '7890', '1234', '5678', '9012'] },
      { type: LotteryType.PT_SP, name: 'PT São Paulo', numbers: ['4567', '8901', '2345', '6789', '0123'] },
      { type: LotteryType.NACIONAL, name: 'Nacional', numbers: ['5678', '9012', '3456', '7890', '1234'] },
      { type: LotteryType.MALUQUINHA_RJ, name: 'Maluquinha RJ', numbers: ['6789', '0123', '4567', '8901', '2345'] },
      { type: LotteryType.LOTEP, name: 'LOTEP', numbers: ['7890', '1234', '5678', '9012', '3456'] },
      { type: LotteryType.LOTECE, name: 'LOTECE', numbers: ['8901', '2345', '6789', '0123', '4567'] },
      { type: LotteryType.MINAS_GERAIS, name: 'Minas Gerais', numbers: ['9012', '3456', '7890', '1234', '5678'] },
      { type: LotteryType.BOA_SORTE, name: 'Boa Sorte', numbers: ['0123', '4567', '8901', '2345', '6789'] }
    ];

    mockData.forEach(data => {
      const result: LotteryResult = {
        lotteryType: data.type,
        date: yesterday,
        results: {
          first: data.numbers[0],
          second: data.numbers[1],
          third: data.numbers[2],
          fourth: data.numbers[3],
          fifth: data.numbers[4]
        },
        source: 'Multi Fonte Scraper',
        status: 'active'
      };
      
      results.set(data.type, result);
    });

    return results;
  }
}