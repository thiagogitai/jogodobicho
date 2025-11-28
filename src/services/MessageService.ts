import { LotteryResult, LotteryType, GroupConfig } from '../types';
import { createUazAPIService } from './UazAPIService';
import { templateService } from './TemplateService';
import { resultsService } from './ResultsService';
import { logger } from '../utils/logger';

export interface SendResult {
  success: boolean;
  groupId: string;
  platform: 'whatsapp' | 'telegram';
  messageId?: string;
  error?: string;
}

export class MessageService {
  private uazAPI = createUazAPIService();

  async sendResultsToGroups(results: Map<LotteryType, LotteryResult>): Promise<SendResult[]> {
    logger.info(`Enviando resultados para grupos configurados`);

    const sendResults: SendResult[] = [];

    try {
      // Busca configurações de grupos ativos
      const groupConfigs = await this.getActiveGroupConfigs();
      logger.info(`Encontrados ${groupConfigs.length} grupos ativos`);

      for (const groupConfig of groupConfigs) {
        try {
          // Filtra resultados que este grupo deve receber
          const relevantResults = this.filterResultsForGroup(results, groupConfig);

          if (relevantResults.size === 0) {
            logger.info(`Nenhum resultado relevante para o grupo ${groupConfig.name}`);
            continue;
          }

          // Formata mensagem para o grupo
          const message = this.formatMessageForGroup(relevantResults, groupConfig);

          // Envia mensagem
          const sendResult = await this.sendMessageToGroup(groupConfig, message);

          // Salva histórico de envio
          await this.saveSendHistory(groupConfig, relevantResults, message, sendResult);

          sendResults.push({
            success: sendResult.success,
            groupId: groupConfig.groupId,
            platform: groupConfig.platform,
            messageId: sendResult.messageId,
            error: sendResult.error
          });

        } catch (error) {
          logger.error(`Erro ao enviar para grupo ${groupConfig.name}:`, error);

          sendResults.push({
            success: false,
            groupId: groupConfig.groupId,
            platform: groupConfig.platform,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      logger.info(`✅ Envio concluído: ${sendResults.filter(r => r.success).length}/${sendResults.length} sucessos`);
      return sendResults;

    } catch (error) {
      logger.error('Erro ao enviar resultados para grupos:', error);
      return [];
    }
  }

  async sendResultToGroup(result: LotteryResult, groupConfig: GroupConfig): Promise<SendResult> {
    try {
      const message = this.formatSingleResult(result, groupConfig);
      return await this.sendMessageToGroup(groupConfig, message);

    } catch (error) {
      logger.error(`Erro ao enviar resultado para grupo ${groupConfig.name}:`, error);

      return {
        success: false,
        groupId: groupConfig.groupId,
        platform: groupConfig.platform,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  private async sendMessageToGroup(groupConfig: GroupConfig, message: string): Promise<SendResult> {
    try {
      // Usar instanceName do grupo ou padrão
      const instanceName = groupConfig.instanceName || process.env.EVOLUTION_INSTANCE_NAME || 'default';

      const response = await this.uazAPI.sendMessage(
        instanceName,
        groupConfig.platform,
        groupConfig.groupId,
        message
      );

      return {
        success: response.success,
        groupId: groupConfig.groupId,
        platform: groupConfig.platform,
        messageId: response.messageId,
        error: response.error
      };

    } catch (error) {
      logger.error(`Erro ao enviar mensagem para ${groupConfig.platform} ${groupConfig.groupId}:`, error);

      return {
        success: false,
        groupId: groupConfig.groupId,
        platform: groupConfig.platform,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  private formatMessageForGroup(results: Map<LotteryType, LotteryResult>, groupConfig: GroupConfig): string {
    let message = '🎯 *RESULTADOS DO JOGO DO BICHO* 🎯\n\n';

    // Adiciona data se todos forem do mesmo dia
    const dates = new Set(Array.from(results.values()).map(r => r.date));
    if (dates.size === 1) {
      const date = Array.from(dates)[0];
      message += `📅 *Data:* ${this.formatDate(date)}\n\n`;
    }

    // Adiciona cada resultado
    for (const [type, result] of results) {
      const lotteryName = this.getLotteryDisplayName(type);
      message += `*${lotteryName}:*\n`;
      message += `🥇 ${result.results.first || 'N/A'}\n`;
      message += `🥈 ${result.results.second || 'N/A'}\n`;
      message += `🥉 ${result.results.third || 'N/A'}\n`;
      if (result.results.fourth) message += `4º ${result.results.fourth}\n`;
      if (result.results.fifth) message += `5º ${result.results.fifth}\n`;
      message += '\n';
    }

    message += '🍀 *Boa sorte!* 🍀';

    return message;
  }

  private formatSingleResult(result: LotteryResult, groupConfig: GroupConfig): string {
    // Usa template personalizado se disponível
    const templates = templateService.getTemplatesForLotteryType(result.lotteryType);

    if (templates.length > 0) {
      return templateService.formatMessage(templates[0], result);
    }

    // Formatação padrão
    const lotteryName = this.getLotteryDisplayName(result.lotteryType);
    let message = `🎯 *${lotteryName}* - ${this.formatDate(result.date)}\n\n`;
    message += `🥇 1º: ${result.results.first || 'N/A'}\n`;
    message += `🥈 2º: ${result.results.second || 'N/A'}\n`;
    message += `🥉 3º: ${result.results.third || 'N/A'}\n`;
    if (result.results.fourth) message += `4º: ${result.results.fourth}\n`;
    if (result.results.fifth) message += `5º: ${result.results.fifth}\n`;

    return message;
  }

  private filterResultsForGroup(results: Map<LotteryType, LotteryResult>, groupConfig: GroupConfig): Map<LotteryType, LotteryResult> {
    const filtered = new Map<LotteryType, LotteryResult>();

    for (const [type, result] of results) {
      if (groupConfig.lotteryTypes.includes(type)) {
        filtered.set(type, result);
      }
    }

    return filtered;
  }

  private async getActiveGroupConfigs(): Promise<GroupConfig[]> {
    // Buscar grupos ativos do banco de dados
    const { groupService } = await import('./GroupService');
    return await groupService.getActiveGroups();
  }

  private async saveSendHistory(groupConfig: GroupConfig, results: Map<LotteryType, LotteryResult>, message: string, sendResult: SendResult): Promise<void> {
    try {
      // Salva histórico de envio no banco de dados
      logger.info(`Salvando histórico de envio para ${groupConfig.name}: ${sendResult.success ? 'SUCESSO' : 'FALHA'}`);

      // Aqui seria implementado o salvamento real no banco
      // Por enquanto, apenas logamos

    } catch (error) {
      logger.error('Erro ao salvar histórico de envio:', error);
    }
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

  // Método para testar conexão com Evolution API
  async testConnection(): Promise<boolean> {
    return await this.uazAPI.testConnection();
  }
}

export const messageService = new MessageService();