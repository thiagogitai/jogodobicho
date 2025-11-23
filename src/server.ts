import 'dotenv/config';
import { startAPIServer } from './api/server';
import { logger } from './utils/logger';

// Iniciar servidor
logger.info('🚀 Iniciando servidor...');
startAPIServer();

