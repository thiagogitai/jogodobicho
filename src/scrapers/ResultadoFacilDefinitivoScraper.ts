import puppeteer from 'puppeteer';
import { DateUtils } from '../utils/DateUtils.js';
import { ScrapingResult, LotteryPrize } from '../types/index';

export class ResultadoFacilDefinitivoScraper {
  
  private readonly BANCAS_CONFIG = [
    { nome: 'FEDERAL', horario: '19:00', siglas: ['FED', 'FEDERAL'] },
    { nome: 'RIO', horario: '14:20', siglas: ['RIO', 'RJ'] },
    { nome: 'SÃO PAULO', horario: '14:25', siglas: ['SP', 'SÃO PAULO', 'SAO PAULO'] },
    { nome: 'MINAS GERAIS', horario: '16:00', siglas: ['MG', 'MINAS'] },
    { nome: 'CEARÁ', horario: '16:00', siglas: ['CE', 'CEARÁ', 'CEARA'] },
    { nome: 'PARAÍBA', horario: '19:00', siglas: ['PB', 'PARAÍBA', 'PARAIBA'] },
    { nome: 'BAHIA', horario: '18:00', siglas: ['BA', 'BAHIA'] },
    { nome: 'PARANÁ', horario: '14:00', siglas: ['PR', 'PARANÁ', 'PARANA'] },
    { nome: 'NACIONAL', horario: '19:30', siglas: ['NAC', 'NACIONAL'] },
    { nome: 'PERNAMBUCO', horario: '14:00', siglas: ['PE', 'PERNAMBUCO'] },
    { nome: 'ALAGOAS', horario: '15:00', siglas: ['AL', 'ALAGOAS'] },
    { nome: 'PARÁ', horario: '17:00', siglas: ['PA', 'PARÁ', 'PARA'] },
    { nome: 'MATO GROSSO', horario: '15:00', siglas: ['MT', 'MATO GROSSO'] },
    { nome: 'MATO GROSSO DO SUL', horario: '15:00', siglas: ['MS', 'MATO GROSSO DO SUL'] },
    { nome: 'GOIÁS', horario: '14:00', siglas: ['GO', 'GOIÁS', 'GOIAS'] },
    { nome: 'DISTRITO FEDERAL', horario: '19:00', siglas: ['DF', 'DISTRITO FEDERAL'] },
    { nome: 'ESPIRITO SANTO', horario: '14:00', siglas: ['ES', 'ESPIRITO SANTO'] },
    { nome: 'PIAUÍ', horario: '15:00', siglas: ['PI', 'PIAUÍ', 'PIAUI'] },
    { nome: 'RIO GRANDE DO NORTE', horario: '14:00', siglas: ['RN', 'RIO GRANDE DO NORTE'] },
    { nome: 'RIO GRANDE DO SUL', horario: '19:00', siglas: ['RS', 'RIO GRANDE DO SUL'] },
    { nome: 'SANTA CATARINA', horario: '19:00', siglas: ['SC', 'SANTA CATARINA'] },
    { nome: 'MARANHÃO', horario: '18:00', siglas: ['MA', 'MARANHÃO', 'MARANHAO'] },
    { nome: 'TOCANTINS', horario: '14:00', siglas: ['TO', 'TOCANTINS'] },
    { nome: 'RONDÔNIA', horario: '17:00', siglas: ['RO', 'RONDÔNIA', 'RONDONIA'] },
    { nome: 'ACRE', horario: '17:00', siglas: ['AC', 'ACRE'] },
    { nome: 'AMAZONAS', horario: '17:00', siglas: ['AM', 'AMAZONAS'] },
    { nome: 'RORAIMA', horario: '17:00', siglas: ['RR', 'RORAIMA'] },
    { nome: 'APARÁ', horario: '17:00', siglas: ['AP', 'APARÁ', 'APARA'] }
  ];

  private readonly ANIMAIS = {
    1: 'Avestruz', 2: 'Águia', 3: 'Burro', 4: 'Borboleta', 5: 'Cachorro',
    6: 'Cabra', 7: 'Carneiro', 8: 'Camelo', 9: 'Cobra', 10: 'Coelho',
    11: 'Cavalo', 12: 'Elefante', 13: 'Galo', 14: 'Gato', 15: 'Jacaré',
    16: 'Leão', 17: 'Macaco', 18: 'Porco', 19: 'Pavão', 20: 'Peru',
    21: 'Touro', 22: 'Tigre', 23: 'Urso', 24: 'Veado', 25: 'Vaca'
  };

  async scrapeResultadoFacil(date?: string): Promise<ScrapingResult[]> {
    const targetDate = date || DateUtils.getYesterday();
    const results: ScrapingResult[] = [];
    
    console.log(`🔍 Iniciando scrape do Resultado Fácil para: ${targetDate}`);

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Configurar user agent e viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      // URL principal do Resultado Fácil
      const url = 'https://amp.resultadofacil.com.br/horarios-jogo-do-bicho';
      
      console.log(`📡 Navegando para: ${url}`);
      
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch (error) {
        console.log('⚠️ Timeout ao carregar página, tentando alternativa...');
        // Tentar URL alternativa
        const altUrl = 'https://resultadofacil.com.br/horarios-jogo-do-bicho';
        try {
          await page.goto(altUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        } catch (altError) {
          console.log('❌ Falha ao carregar ambas as URLs');
          return this.generateMockResults(targetDate);
        }
      }

      // Aguardar carregamento dinâmico
      await page.waitForTimeout(3000);

      // Obter todo o texto da página
      const pageText = await page.evaluate(() => document.body.innerText);
      
      console.log('🔍 Analisando estrutura da página...');
      
      // Estratégias de extração
      const strategies = [
        () => this.extractByPatternAnalysis(pageText, targetDate),
        () => this.extractByTableStructure(page),
        () => this.extractByListStructure(page),
        () => this.extractByCardStructure(page)
      ];

      for (const strategy of strategies) {
        try {
          const extractedResults = await strategy();
          if (extractedResults.length > 0) {
            results.push(...extractedResults);
            console.log(`✅ Extraídos ${extractedResults.length