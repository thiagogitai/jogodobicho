import axios, { AxiosInstance } from 'axios';
import { LotteryResult, LotteryType } from '../types';
import { logger } from '../utils/logger';

export interface UazAPIConfig {
    baseUrl: string;
    apiToken: string;
    instanceId?: string;
}

export interface MessageResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}

export interface InstanceInfo {
    id: string;
    name: string;
    status: 'connected' | 'disconnected' | 'connecting';
    qrcode?: string;
}

export class UazAPIService {
    private config: UazAPIConfig;
    private axios: AxiosInstance;

    constructor(config: UazAPIConfig) {
        this.config = config;
        this.axios = axios.create({
            baseURL: config.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiToken}`
            },
            timeout: 30000
        });
    }

    /**
     * Enviar mensagem de texto via WhatsApp
     */
    async sendWhatsAppMessage(phoneNumber: string, message: string): Promise<MessageResponse> {
        try {
            logger.info(`Enviando mensagem WhatsApp para: ${phoneNumber}`);

            const response = await this.axios.post('/send-message', {
                phone: phoneNumber,
                message: message,
                instanceId: this.config.instanceId
            });

            logger.info(`✅ Mensagem WhatsApp enviada com sucesso`);

            return {
                success: true,
                messageId: response.data?.messageId || response.data?.id
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
     * Enviar mensagem para grupo
     */
    async sendGroupMessage(groupId: string, message: string): Promise<MessageResponse> {
        try {
            logger.info(`Enviando mensagem para grupo: ${groupId}`);

            const response = await this.axios.post('/send-message', {
                chatId: groupId,
                message: message,
                instanceId: this.config.instanceId
            });

            logger.info(`✅ Mensagem enviada para grupo com sucesso`);

            return {
                success: true,
                messageId: response.data?.messageId || response.data?.id
            };

        } catch (error: any) {
            logger.error('Erro ao enviar mensagem para grupo:', error.response?.data || error.message);

            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Erro desconhecido'
            };
        }
    }

    /**
     * Enviar imagem
     */
    async sendImage(phoneNumber: string, imageUrl: string, caption?: string): Promise<MessageResponse> {
        try {
            logger.info(`Enviando imagem para: ${phoneNumber}`);

            const payload: any = {
                phone: phoneNumber,
                mediaUrl: imageUrl,
                instanceId: this.config.instanceId
            };

            if (caption) {
                payload.caption = caption;
            }

            const response = await this.axios.post('/send-media', payload);

            logger.info(`✅ Imagem enviada com sucesso`);

            return {
                success: true,
                messageId: response.data?.messageId || response.data?.id
            };

        } catch (error: any) {
            logger.error('Erro ao enviar imagem:', error.response?.data || error.message);

            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Erro desconhecido'
            };
        }
    }

    /**
     * Obter QR Code da instância
     */
    async getQRCode(): Promise<{ qrcode?: string; base64?: string; error?: string }> {
        try {
            const response = await this.axios.get(`/qrcode/${this.config.instanceId}`);
            return {
                qrcode: response.data?.qrcode,
                base64: response.data?.qrcode
            };
        } catch (error: any) {
            logger.error('Erro ao obter QR Code:', error.response?.data || error.message);
            return {
                error: error.response?.data?.message || error.message || 'Erro desconhecido'
            };
        }
    }

    /**
     * Verificar status de conexão
     */
    async getStatus(): Promise<{ state: string; status?: any }> {
        try {
            const response = await this.axios.get(`/status/${this.config.instanceId}`);
            return {
                state: response.data?.status || 'unknown',
                status: response.data
            };
        } catch (error: any) {
            logger.error('Erro ao verificar status:', error.response?.data || error.message);
            return { state: 'error' };
        }
    }

    /**
     * Testar conexão com o servidor UazAPI
     */
    async testConnection(): Promise<boolean> {
        try {
            const response = await this.axios.get('/health');
            const isWorking = response.status === 200;

            if (isWorking) {
                logger.info('✅ Conexão UazAPI estabelecida com sucesso');
            } else {
                logger.warn('⚠️  UazAPI não está respondendo corretamente');
            }

            return isWorking;
        } catch (error: any) {
            logger.error('Erro ao testar conexão UazAPI:', error.response?.data || error.message);
            return false;
        }
    }

    /**
     * Enviar mensagem (compatibilidade com interface antiga)
     */
    async sendMessage(instanceName: string, platform: 'whatsapp' | 'telegram', groupId: string, message: string): Promise<MessageResponse> {
        if (platform === 'whatsapp') {
            return await this.sendGroupMessage(groupId, message);
        }

        return {
            success: false,
            error: `Plataforma não suportada: ${platform}`
        };
    }
}

// Configuração da UazAPI
export const createUazAPIService = (): UazAPIService => {
    const config: UazAPIConfig = {
        baseUrl: process.env.UAZAPI_URL || 'https://api.uazapi.com',
        apiToken: process.env.UAZAPI_TOKEN || '',
        instanceId: process.env.UAZAPI_INSTANCE_ID
    };

    if (!config.apiToken) {
        logger.warn('⚠️  Token da UazAPI não configurado.');
    }

    logger.info(`🔗 UazAPI configurado: ${config.baseUrl}`);

    return new UazAPIService(config);
};
