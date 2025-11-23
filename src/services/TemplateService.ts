import { LotteryResult, LotteryType, MessageTemplate } from '../types';
import { logger } from '../utils/logger';
import { 
  formatAnimalInfo, 
  formatarDataCompleta, 
  gerarMilhares, 
  gerarCentenas, 
  gerarPalpitesPorAnimal,
  JOGO_DO_BICHO_ANIMAIS
} from '../config/jogoDoBichoConfig';

export class TemplateService {
  private templates: Map<string, MessageTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    // Templates padrão
    const defaultTemplates: MessageTemplate[] = [
      {
        name: 'Formato Completo Jogo do Bicho',
        content: `{lottery_name_upper} - {lottery_state}, {lottery_time}\n Resultado do dia {date_complete}\n\n{results_formatted}\n\n{footer_text}\n{footer_link}\n\nPalpites do {tipster_name}\n{date_complete}\n\nBICHOS\n{palpites_bichos}\n\nMILHARES\n{milhares}\n\nCENTENAS\n{centenas}\n\n{footer_text}\n{footer_link}\n\nLISTA DE ATRASADOS 🕗\n{lottery_name_upper} - 1º Prêmio no Geral\nOFICIAL\n-------------------------------------------\n{atrasados_formatted}\n\n{footer_text}\n{footer_link}`,
        variables: [
          'lottery_name_upper', 'lottery_state', 'lottery_time', 'date_complete',
          'results_formatted', 'footer_text', 'footer_link', 'tipster_name',
          'palpites_bichos', 'milhares', 'centenas', 'atrasados_formatted'
        ],
        lotteryTypes: [
          LotteryType.FEDERAL,
          LotteryType.RIO_DE_JANEIRO,
          LotteryType.LOOK_GO,
          LotteryType.PT_SP,
          LotteryType.NACIONAL,
          LotteryType.MALUQUINHA_RJ,
          LotteryType.LOTEP,
          LotteryType.LOTECE,
          LotteryType.MINAS_GERAIS,
          LotteryType.BOA_SORTE,
          LotteryType.LOTERIAS_CAIXA
        ],
        enabled: true
      },
      {
        name: 'Padrão Completo',
        content: '🎯 RESULTADO {lottery_name} - {date}\n\n1º Prêmio: {first}\n2º Prêmio: {second}\n3º Prêmio: {third}\n4º Prêmio: {fourth}\n5º Prêmio: {fifth}\n\n📊 Fonte: {source}',
        variables: ['lottery_name', 'date', 'first', 'second', 'third', 'fourth', 'fifth', 'source'],
        lotteryTypes: [
          LotteryType.FEDERAL,
          LotteryType.RIO_DE_JANEIRO,
          LotteryType.LOOK_GO,
          LotteryType.PT_SP,
          LotteryType.NACIONAL,
          LotteryType.MALUQUINHA_RJ,
          LotteryType.LOTEP,
          LotteryType.LOTECE,
          LotteryType.MINAS_GERAIS,
          LotteryType.BOA_SORTE,
          LotteryType.LOTERIAS_CAIXA
        ],
        enabled: true
      },
      {
        name: 'Resumo Rápido',
        content: '🎯 {lottery_name}: {first} - {second} - {third} - {fourth} - {fifth}',
        variables: ['lottery_name', 'first', 'second', 'third', 'fourth', 'fifth'],
        lotteryTypes: [
          LotteryType.FEDERAL,
          LotteryType.RIO_DE_JANEIRO,
          LotteryType.LOOK_GO,
          LotteryType.PT_SP,
          LotteryType.NACIONAL,
          LotteryType.MALUQUINHA_RJ,
          LotteryType.LOTEP,
          LotteryType.LOTECE,
          LotteryType.MINAS_GERAIS,
          LotteryType.BOA_SORTE,
          LotteryType.LOTERIAS_CAIXA
        ],
        enabled: true
      },
      {
        name: 'Apenas 1º Prêmio',
        content: '🎯 {lottery_name} - 1º: {first}',
        variables: ['lottery_name', 'first'],
        lotteryTypes: [
          LotteryType.FEDERAL,
          LotteryType.RIO_DE_JANEIRO,
          LotteryType.LOOK_GO,
          LotteryType.PT_SP,
          LotteryType.NACIONAL,
          LotteryType.MALUQUINHA_RJ,
          LotteryType.LOTEP,
          LotteryType.LOTECE,
          LotteryType.MINAS_GERAIS,
          LotteryType.BOA_SORTE,
          LotteryType.LOTERIAS_CAIXA
        ],
        enabled: true
      },
      {
        name: 'Formato Bicho',
        content: '🐦 {lottery_name} - {date}\n\n🦅 1º: {first}\n🐴 2º: {second}\n🐮 3º: {third}\n🐶 4º: {fourth}\n🐱 5º: {fifth}',
        variables: ['lottery_name', 'date', 'first', 'second', 'third', 'fourth', 'fifth'],
        lotteryTypes: [
          LotteryType.FEDERAL,
          LotteryType.RIO_DE_JANEIRO,
          LotteryType.LOOK_GO,
          LotteryType.PT_SP,
          LotteryType.NACIONAL,
          LotteryType.MALUQUINHA_RJ,
          LotteryType.LOTEP,
          LotteryType.LOTECE,
          LotteryType.MINAS_GERAIS,
          LotteryType.BOA_SORTE,
          LotteryType.LOTERIAS_CAIXA
        ],
        enabled: true
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.name, template);
    });
  }

  formatMessage(template: MessageTemplate, result: LotteryResult, customConfig?: {
    footerText?: string;
    footerLink?: string;
    tipsterName?: string;
    palpitesAnimais?: string[];
  }): string {
    try {
      let message = template.content;
      
      // Configurações padrão
      const config = {
        footerText: customConfig?.footerText || 'Teste rodapé8',
        footerLink: customConfig?.footerLink || 'link www.teste.com',
        tipsterName: customConfig?.tipsterName || 'Nome Teste1',
        palpitesAnimais: customConfig?.palpitesAnimais || ['Gato', 'Pavão', 'Urso', 'Jacaré']
      };
      
      // Formatar resultados com animais
      const resultsFormatted = this.formatResultsWithAnimals(result);
      
      // Gerar palpites de bichos
      const palpitesBichos = this.formatPalpitesBichos(config.palpitesAnimais);
      
      // Gerar milhares e centenas
      const milhares = gerarMilhares(15).join(', ');
      const centenas = gerarCentenas(15).join(', ');
      
      // Mapeamento de variáveis
      const variables = {
        lottery_name: this.getLotteryDisplayName(result.lotteryType),
        lottery_name_upper: this.getLotteryDisplayName(result.lotteryType).toUpperCase(),
        lottery_state: this.getLotteryState(result.lotteryType),
        lottery_time: this.getLotteryTime(result.lotteryType),
        date: this.formatDate(result.date),
        date_complete: formatarDataCompleta(new Date(result.date)),
        first: result.results.first || 'N/A',
        second: result.results.second || 'N/A',
        third: result.results.third || 'N/A',
        fourth: result.results.fourth || 'N/A',
        fifth: result.results.fifth || 'N/A',
        source: result.source,
        results_formatted: resultsFormatted,
        footer_text: config.footerText,
        footer_link: config.footerLink,
        tipster_name: config.tipsterName,
        palpites_bichos: palpitesBichos,
        milhares: milhares,
        centenas: centenas,
        atrasados_formatted: this.formatAtrasados(result)
      };

      // Substitui variáveis
      template.variables.forEach(variable => {
        const value = variables[variable as keyof typeof variables] || 'N/A';
        message = message.replace(new RegExp(`{${variable}}`, 'g'), String(value));
      });

      return message;
      
    } catch (error) {
      logger.error('Erro ao formatar mensagem:', error);
      return `Erro ao formatar mensagem para ${result.lotteryType}`;
    }
  }

  getTemplate(name: string): MessageTemplate | undefined {
    return this.templates.get(name);
  }

  getAllTemplates(): MessageTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesForLotteryType(lotteryType: LotteryType): MessageTemplate[] {
    return this.getAllTemplates().filter(template => 
      template.lotteryTypes.includes(lotteryType) && template.enabled
    );
  }

  addTemplate(template: MessageTemplate): void {
    this.templates.set(template.name, template);
  }

  removeTemplate(name: string): boolean {
    return this.templates.delete(name);
  }

  private getLotteryDisplayName(lotteryType: LotteryType): string {
    const names = {
      [LotteryType.FEDERAL]: 'FEDERAL',
      [LotteryType.RIO_DE_JANEIRO]: 'RIO DE JANEIRO',
      [LotteryType.LOOK_GO]: 'LOOK GO',
      [LotteryType.PT_SP]: 'PT SÃO PAULO',
      [LotteryType.NACIONAL]: 'NACIONAL',
      [LotteryType.MALUQUINHA_RJ]: 'MALUQUINHA RJ',
      [LotteryType.LOTEP]: 'LOTEP',
      [LotteryType.LOTECE]: 'LOTECE',
      [LotteryType.MINAS_GERAIS]: 'MINAS GERAIS',
      [LotteryType.BOA_SORTE]: 'BOA SORTE',
      [LotteryType.LOTERIAS_CAIXA]: 'LOTERIAS CAIXA'
    };
    
    return names[lotteryType] || lotteryType;
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  }

  // Método para criar mensagem personalizada
  createCustomMessage(result: LotteryResult, customFormat?: string): string {
    if (customFormat) {
      const template: MessageTemplate = {
        name: 'Custom',
        content: customFormat,
        variables: this.extractVariables(customFormat),
        lotteryTypes: [result.lotteryType],
        enabled: true
      };
      
      return this.formatMessage(template, result);
    }
    
    // Usa template padrão se não houver formato customizado
    const templates = this.getTemplatesForLotteryType(result.lotteryType);
    if (templates.length > 0) {
      return this.formatMessage(templates[0], result);
    }
    
    // Mensagem fallback
    return this.formatMessage(this.getTemplate('Padrão Completo')!, result);
  }

  private extractVariables(template: string): string[] {
    const matches = template.match(/\{([^}]+)\}/g);
    return matches ? matches.map(m => m.slice(1, -1)) : [];
  }

  private formatResultsWithAnimals(result: LotteryResult): string {
    const positions = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
    let formatted = '';
    
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i] as keyof typeof result.results;
      const value = result.results[position];
      
      if (value) {
        const numero = parseInt(value.toString());
        const animalInfo = formatAnimalInfo(numero);
        formatted += `${(i + 1)}º\t\t ${animalInfo}\n`;
      }
    }
    
    return formatted.trim();
  }

  private formatPalpitesBichos(animais: string[]): string {
    const palpites = gerarPalpitesPorAnimal(animais);
    let formatted = '';
    
    for (const palpite of palpites) {
      formatted += `${palpite.animal.emoji} ${palpite.animal.nome} - Grupo ${palpite.animal.grupo.toString().padStart(2, '0')}, Dezenas: ${palpite.palpites.join(', ')}\n`;
    }
    
    return formatted.trim();
  }

  private formatAtrasados(result: LotteryResult): string {
    // Para demonstração, vamos criar atrasados fictícios
    // Em produção, isso viria do histórico real
    const atrasadosFicticios = [
      { animal: 'Gato', dias: 13, emoji: '🐈' },
      { animal: 'Coelho', dias: 11, emoji: '🐇' },
      { animal: 'Touro', dias: 11, emoji: '🐂' },
      { animal: 'Cabra', dias: 9, emoji: '🐐' },
      { animal: 'Avestruz', dias: 7, emoji: '🦩' },
      { animal: 'Cachorro', dias: 5, emoji: '🐕' },
      { animal: 'Elefante', dias: 5, emoji: '🐘' },
      { animal: 'Cavalo', dias: 5, emoji: '🐎' },
      { animal: 'Águia', dias: 4, emoji: '🦅' },
      { animal: 'Pavão', dias: 4, emoji: '🦚' }
    ];
    
    let formatted = '';
    
    for (const atrasado of atrasadosFicticios) {
      formatted += `${atrasado.emoji} ${atrasado.animal} atrasado a ${atrasado.dias} dias\n`;
    }
    
    return formatted.trim();
  }

  private getLotteryState(lotteryType: LotteryType): string {
    const states = {
      [LotteryType.FEDERAL]: 'BRASIL',
      [LotteryType.RIO_DE_JANEIRO]: 'RJ',
      [LotteryType.LOOK_GO]: 'GO',
      [LotteryType.PT_SP]: 'SP',
      [LotteryType.NACIONAL]: 'BRASIL',
      [LotteryType.MALUQUINHA_RJ]: 'RJ',
      [LotteryType.LOTEP]: 'PI',
      [LotteryType.LOTECE]: 'CE',
      [LotteryType.MINAS_GERAIS]: 'MG',
      [LotteryType.BOA_SORTE]: 'PB',
      [LotteryType.LOTERIAS_CAIXA]: 'BRASIL'
    };
    
    return states[lotteryType] || 'BRASIL';
  }

  private getLotteryTime(lotteryType: LotteryType): string {
    const times = {
      [LotteryType.FEDERAL]: '20:00',
      [LotteryType.RIO_DE_JANEIRO]: '14:00, 19:00',
      [LotteryType.LOOK_GO]: '16:00',
      [LotteryType.PT_SP]: '14:00, 20:00',
      [LotteryType.NACIONAL]: '19:00',
      [LotteryType.MALUQUINHA_RJ]: '13:00, 18:00',
      [LotteryType.LOTEP]: '15:00',
      [LotteryType.LOTECE]: '16:00',
      [LotteryType.MINAS_GERAIS]: '13:00, 19:00',
      [LotteryType.BOA_SORTE]: '14:00',
      [LotteryType.LOTERIAS_CAIXA]: '20:00'
    };
    
    return times[lotteryType] || '20:00';
  }
}

export const templateService = new TemplateService();