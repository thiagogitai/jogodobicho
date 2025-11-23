import axios, { AxiosInstance } from 'axios';
import { LotteryResult, LotteryType } from '../types';
import { logger } from '../utils/logger';

export interface EvolutionAPIConfig {
  baseUrl: string;
  apiToken: string;
  instanceName?: string;
}

export interface MessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface InstanceInfo {
  instanceName: string;
  status: 'open' | 'close' | 'connecting';
  qrcode?: string;
  qrcodeUrl?: string;
  webhook?: string;
  webhook_by_events?: boolean;
  webhook_base64?: boolean;
  events?: string[];
  reject_call?: boolean;
  msg_call?: string;
  groups_ignore?: boolean;
  always_online?: boolean;
  read_messages?: boolean;
  read_status?: boolean;
  chatwoot_account_id?: string;
  chatwoot_token?: string;
  chatwoot_url?: string;
  chatwoot_sign_msg?: boolean;
  websocket?: {
    enabled?: boolean;
    events?: string[];
  };
}

export interface CreateInstanceRequest {
  instanceName: string;
  token?: string;
  qrcode?: boolean;
  integration?: string;
  number?: string;
  webhook?: {
    url: string;
    webhook_by_events?: boolean;
    webhook_base64?: boolean;
    events?: string[];
  };
  settings?: {
    reject_call?: boolean;
    msg_call?: string;
    groups_ignore?: boolean;
    always_online?: boolean;
    read_messages?: boolean;
    read_status?: boolean;
  };
}

export class EvolutionAPIService {
  private config: EvolutionAPIConfig;
  private axios: AxiosInstance;

  constructor(config: EvolutionAPIConfig) {
    this.config = config;
    this.axios = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.apiToken
      },
      timeout: 30000
    });
  }

  /**
   * Criar nova instância no Evolution API
   */
  async createInstance(request: CreateInstanceRequest): Promise<{ success: boolean; instance?: InstanceInfo; error?: string }> {
    try {
      logger.info(`Criando instância: ${request.instanceName}`);
      
      const response = await this.axios.post('/instance/create', {
        instanceName: request.instanceName,
        token: request.token,
        qrcode: request.qrcode !== false, // Default true
        integration: request.integration || 'WHATSAPP-BAILEYS',
        number: request.number,
        webhook: request.webhook,
        settings: request.settings
      });

      logger.info(`✅ Instância criada: ${request.instanceName}`);
      
      return {
        success: true,
        instance: response.data
      };
    } catch (error: any) {
      logger.error(`Erro ao criar instância ${request.instanceName}:`, error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Listar todas as instâncias
   */
  async listInstances(): Promise<InstanceInfo[]> {
    try {
      const response = await this.axios.get('/instance/fetchInstances');
      return response.data || [];
    } catch (error: any) {
      logger.error('Erro ao listar instâncias:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Obter informações de uma instância específica
   */
  async getInstance(instanceName: string): Promise<InstanceInfo | null> {
    try {
      const response = await this.axios.get(`/instance/fetchInstance/${instanceName}`);
      return response.data || null;
    } catch (error: any) {
      logger.error(`Erro ao obter instância ${instanceName}:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Deletar instância
   */
  async deleteInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`Deletando instância: ${instanceName}`);
      
      await this.axios.delete(`/instance/delete/${instanceName}`);
      
      logger.info(`✅ Instância deletada: ${instanceName}`);
      
      return { success: true };
    } catch (error: any) {
      logger.error(`Erro ao deletar instância ${instanceName}:`, error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Obter QR Code da instância
   */
  async getQRCode(instanceName: string): Promise<{ qrcode?: string; base64?: string; error?: string }> {
    try {
      const response = await this.axios.get(`/instance/connect/${instanceName}`);
      return {
        qrcode: response.data?.qrcode?.base64,
        base64: response.data?.qrcode?.base64
      };
    } catch (error: any) {
      logger.error(`Erro ao obter QR Code da instância ${instanceName}:`, error.response?.data || error.message);
      return {
        error: error.response?.data?.message || error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Verificar status de conexão da instância
   */
  async getInstanceStatus(instanceName: string): Promise<{ state: string; status?: any }> {
    try {
      const response = await this.axios.get(`/instance/connectionState/${instanceName}`);
      return response.data || { state: 'unknown' };
    } catch (error: any) {
      logger.error(`Erro ao verificar status da instância ${instanceName}:`, error.response?.data || error.message);
      return { state: 'error' };
    }
  }

  /**
   * Enviar mensagem de texto via WhatsApp
   */
  async sendWhatsAppMessage(instanceName: string, groupId: string, message: string): Promise<MessageResponse> {
    try {
      logger.info(`Enviando mensagem WhatsApp para grupo: ${groupId} (instância: ${instanceName})`);
      
      const response = await this.axios.post(`/message/sendText/${instanceName}`, {
        number: groupId,
        text: message,
        options: {
          delay: 1000,
          presence: 'composing'
        }
      });

      logger.info(`✅ Mensagem WhatsApp enviada com sucesso: ${response.data?.key?.id}`);
      
      return {
        success: true,
        messageId: response.data?.key?.id
      };
      
    } catch (error: any) {
      logger.error('Erro ao enviar mensagem WhatsApp:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Enviar mensagem de texto via Telegram
   */
  async sendTelegramMessage(instanceName: string, groupId: string, message: string): Promise<MessageResponse> {
    try {
      logger.info(`Enviando mensagem Telegram para grupo: ${groupId} (instância: ${instanceName})`);
      
      const response = await this.axios.post(`/message/sendText/${instanceName}`, {
        number: groupId,
        text: message,
        options: {
          delay: 1000
        }
      });

      logger.info(`✅ Mensagem Telegram enviada com sucesso: ${response.data?.messageId}`);
      
      return {
        success: true,
        messageId: response.data?.messageId
      };
      
    } catch (error: any) {
      logger.error('Erro ao enviar mensagem Telegram:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Enviar mensagem (genérico)
   */
  async sendMessage(instanceName: string, platform: 'whatsapp' | 'telegram', groupId: string, message: string): Promise<MessageResponse> {
    switch (platform) {
      case 'whatsapp':
        return await this.sendWhatsAppMessage(instanceName, groupId, message);
      case 'telegram':
        return await this.sendTelegramMessage(instanceName, groupId, message);
      default:
        return {
          success: false,
          error: `Plataforma não suportada: ${platform}`
        };
    }
  }

  /**
   * Enviar imagem
   */
  async sendImage(instanceName: string, platform: 'whatsapp' | 'telegram', groupId: string, imageUrl: string, caption?: string): Promise<MessageResponse> {
    try {
      logger.info(`Enviando imagem ${platform} para grupo: ${groupId} (instância: ${instanceName})`);
      
      const payload: any = {
        number: groupId,
        mediaUrl: imageUrl
      };

      if (caption) {
        payload.caption = caption;
      }

      const response = await this.axios.post(`/message/sendMedia/${instanceName}`, payload);

      logger.info(`✅ Imagem ${platform} enviada com sucesso`);
      
      return {
        success: true,
        messageId: response.data?.key?.id || response.data?.messageId
      };
      
    } catch (error: any) {
      logger.error(`Erro ao enviar imagem ${platform}:`, error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Testar conexão com o servidor Evolution API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.axios.get('/');
      const isWorking = response.data?.status === 200;
      
      if (isWorking) {
        logger.info('✅ Conexão Evolution API estabelecida com sucesso');
        logger.info(`Versão: ${response.data?.version || 'N/A'}`);
      } else {
        logger.warn('⚠️  Evolution API não está respondendo corretamente');
      }
      
      return isWorking;
    } catch (error: any) {
      logger.error('Erro ao testar conexão Evolution API:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Logout/Desconectar instância
   */
  async logoutInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`Desconectando instância: ${instanceName}`);
      
      await this.axios.delete(`/instance/logout/${instanceName}`);
      
      logger.info(`✅ Instância desconectada: ${instanceName}`);
      
      return { success: true };
    } catch (error: any) {
      logger.error(`Erro ao desconectar instância ${instanceName}:`, error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Reiniciar instância
   */
  async restartInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`Reiniciando instância: ${instanceName}`);
      
      await this.axios.put(`/instance/restart/${instanceName}`);
      
      logger.info(`✅ Instância reiniciada: ${instanceName}`);
      
      return { success: true };
    } catch (error: any) {
      logger.error(`Erro ao reiniciar instância ${instanceName}:`, error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro desconhecido'
      };
    }
  }
}

// Configuração da Evolution API usando servidor fornecido
export const createEvolutionAPIService = (): EvolutionAPIService => {
  const config: EvolutionAPIConfig = {
    baseUrl: process.env.EVOLUTION_API_URL || 'https://solitarybaboon-evolution.cloudfy.live',
    apiToken: process.env.EVOLUTION_API_TOKEN || '0eX8TyfZjyRQVryI2b7Mx6bvSAQUQHsc',
    instanceName: process.env.EVOLUTION_INSTANCE_NAME
  };

  if (!config.apiToken) {
    logger.warn('⚠️  Token da Evolution API não configurado. Usando token padrão.');
  }

  logger.info(`🔗 Evolution API configurado: ${config.baseUrl}`);

  return new EvolutionAPIService(config);
};
