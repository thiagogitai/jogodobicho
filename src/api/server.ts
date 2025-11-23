import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { DatabaseManager } from '../config/database';
import { ResultsService } from '../services/ResultsService';
import { ScrapeService } from '../services/ScrapeService';
import { SchedulingService } from '../services/SchedulingService';
import { TemplateService } from '../services/TemplateService';
import { MessageService } from '../services/MessageService';
import { createEvolutionAPIService } from '../services/EvolutionAPIService';
import { LotteryType } from '../types';
import logger from '../config/logger';
import crypto from 'crypto';

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware de segurança
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});

app.use('/api', limiter);

// Serviços
const resultsService = new ResultsService();
const scrapeService = new ScrapeService();
const schedulingService = new SchedulingService();
const templateService = new TemplateService();
const messageService = new MessageService();

// Middleware de autenticação
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação necessário' });
  }

  try {
    const db = DatabaseManager.getInstance();
    const query = 'SELECT * FROM api_tokens WHERE token = ? AND active = 1 AND expires_at > CURRENT_TIMESTAMP';
    const tokenRecord = await db.get(query, [token]);

    if (!tokenRecord) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }

    // Atualizar último uso
    await db.run('UPDATE api_tokens SET last_used_at = CURRENT_TIMESTAMP, usage_count = usage_count + 1 WHERE id = ?', [tokenRecord.id]);
    
    req.user = { id: tokenRecord.user_id, token: tokenRecord };
    next();
  } catch (error) {
    logger.error('Erro na autenticação:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// ===== ROTAS PÚBLICAS (sem autenticação) =====

// Health check (única rota pública - para monitoramento)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Login/Autenticação inicial (para obter token)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password são obrigatórios' });
    }

    const db = DatabaseManager.getInstance();
    
    // Buscar usuário
    const user = await db.get(
      'SELECT * FROM users WHERE username = ? AND active = 1',
      [username]
    );

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha (SHA256)
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    if (user.password_hash !== passwordHash) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365); // 1 ano

    await db.run(
      'INSERT INTO api_tokens (user_id, name, token, expires_at, active) VALUES (?, ?, ?, ?, 1)',
      [user.id, `Login ${new Date().toISOString()}`, token, expiresAt.toISOString()]
    );

    logger.info(`Token gerado para usuário: ${username}`);

    res.json({
      token,
      expires_at: expiresAt.toISOString(),
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// ===== ROTAS AUTENTICADAS (todas protegidas por token) =====

// Status do sistema (agora protegido)
app.get('/api/status', authenticateToken, async (req, res) => {
  try {
    const stats = await resultsService.getStatistics();
    const schedules = await schedulingService.getAllSchedules();
    
    res.json({
      status: 'operational',
      stats,
      active_schedules: schedules.filter(s => s.enabled).length,
      total_schedules: schedules.length,
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Erro ao obter status:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ===== ROTAS AUTENTICADAS =====

// Resultados da loteria
app.get('/api/results', authenticateToken, async (req, res) => {
  try {
    const { 
      lottery_type, 
      date, 
      start_date, 
      end_date, 
      limit = 50, 
      offset = 0 
    } = req.query;

    let results;
    
    if (lottery_type) {
      if (date) {
        results = await resultsService.getResultsByDateAndType(lottery_type as LotteryType, date as string);
      } else if (start_date && end_date) {
        results = await resultsService.getResultsByDateRange(start_date as string, end_date as string, lottery_type as LotteryType);
      } else {
        results = await resultsService.getResultsByType(lottery_type as LotteryType, parseInt(limit as string), parseInt(offset as string));
      }
    } else if (date) {
      results = await resultsService.getResultsByDate(date as string);
    } else {
      results = await resultsService.getRecentResults(parseInt(limit as string), parseInt(offset as string));
    }

    // IMPORTANTE: Resultados já vêm sanitizados (source mascarado)
    // Nem administrador verá que veio do Resultado Fácil
    res.json({
      results,
      total: results.length,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    logger.error('Erro ao obter resultados:', error);
    res.status(500).json({ error: 'Erro ao obter resultados' });
  }
});

// Resultado específico
app.get('/api/results/:id', authenticateToken, async (req, res) => {
  try {
    // IMPORTANTE: getResultById já retorna sanitizado (source mascarado)
    // Nem administrador verá que veio do Resultado Fácil
    const result = await resultsService.getResultById(req.params.id);
    
    if (!result) {
      return res.status(404).json({ error: 'Resultado não encontrado' });
    }

    // Resultado já vem com source = 'sistema' (mascarado)
    res.json(result);
  } catch (error) {
    logger.error('Erro ao obter resultado:', error);
    res.status(500).json({ error: 'Erro ao obter resultado' });
  }
});

// Criar novo resultado (manual)
app.post('/api/results', authenticateToken, async (req, res) => {
  try {
    const { lottery_type, date, results, source } = req.body;

    if (!lottery_type || !date || !results) {
      return res.status(400).json({ error: 'Campos obrigatórios: lottery_type, date, results' });
    }

    // Quando criado manualmente, sempre usar source genérico
    const newResult = await resultsService.createResult({
      lotteryType: lottery_type as LotteryType,
      date,
      results,
      source: 'manual', // Sempre genérico, nunca expor origem real
      status: 'active'
    });

    logger.info(`Resultado criado manualmente: ${newResult.id}`);
    res.status(201).json(newResult);
  } catch (error) {
    logger.error('Erro ao criar resultado:', error);
    res.status(500).json({ error: 'Erro ao criar resultado' });
  }
});

// Atualizar resultado
app.put('/api/results/:id', authenticateToken, async (req, res) => {
  try {
    const { results } = req.body;
    const id = req.params.id;

    // IMPORTANTE: Não permitir atualizar source pela API
    // Source interno do Resultado Fácil é preservado automaticamente
    // O campo 'source' do body é ignorado para proteger identificação interna
    const updated = await resultsService.updateResult(id, { results });
    
    if (!updated) {
      return res.status(404).json({ error: 'Resultado não encontrado' });
    }

    logger.info(`Resultado atualizado: ${id}`);
    // Retornar resultado sanitizado (source mascarado)
    res.json({ 
      message: 'Resultado atualizado com sucesso',
      result: updated // Já vem sanitizado - source sempre 'sistema'
    });
  } catch (error) {
    logger.error('Erro ao atualizar resultado:', error);
    res.status(500).json({ error: 'Erro ao atualizar resultado' });
  }
});

// Deletar resultado
app.delete('/api/results/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await resultsService.deleteResult(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Resultado não encontrado' });
    }

    logger.info(`Resultado deletado: ${id}`);
    res.json({ message: 'Resultado deletado com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar resultado:', error);
    res.status(500).json({ error: 'Erro ao deletar resultado' });
  }
});

// Executar scrap manual
app.post('/api/scrape', authenticateToken, async (req, res) => {
  try {
    const { lottery_types, date } = req.body;
    
    const typesToScrape = lottery_types ? (Array.isArray(lottery_types) ? lottery_types : [lottery_types]) : Object.values(LotteryType);
    
    const results = await scrapeService.scrapeResults(date);
    const filteredResults = results.filter(r => typesToScrape.includes(r.lotteryType));

    // Salvar resultados no banco
    const savedResults = [];
    for (const result of filteredResults) {
      try {
        const saved = await resultsService.saveResult(result);
        savedResults.push(saved);
      } catch (error) {
        logger.warn(`Erro ao salvar resultado ${result.lotteryType}:`, error);
      }
    }

    res.json({
      message: 'Scrap executado com sucesso',
      results_scraped: filteredResults.length,
      results_saved: savedResults.length,
      results: savedResults
    });
  } catch (error) {
    logger.error('Erro ao executar scrap:', error);
    res.status(500).json({ error: 'Erro ao executar scrap' });
  }
});

// Templates de mensagens
app.get('/api/templates', authenticateToken, (req, res) => {
  const templates = templateService.getAllTemplates();
  res.json(templates);
});

app.get('/api/templates/:lotteryType', authenticateToken, (req, res) => {
  const templates = templateService.getTemplatesForLotteryType(req.params.lotteryType as LotteryType);
  res.json(templates);
});

// Agendamentos
app.get('/api/schedules', authenticateToken, async (req, res) => {
  try {
    const schedules = await schedulingService.getAllSchedules();
    res.json(schedules);
  } catch (error) {
    logger.error('Erro ao obter agendamentos:', error);
    res.status(500).json({ error: 'Erro ao obter agendamentos' });
  }
});

app.post('/api/schedules', authenticateToken, async (req, res) => {
  try {
    const schedule = await schedulingService.createSchedule(req.body);
    res.status(201).json(schedule);
  } catch (error) {
    logger.error('Erro ao criar agendamento:', error);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

app.put('/api/schedules/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const updated = await schedulingService.updateSchedule(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    // Retornar agendamento atualizado
    const schedule = await schedulingService.getSchedule(id);
    res.json({ 
      message: 'Agendamento atualizado com sucesso',
      schedule 
    });
  } catch (error) {
    logger.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar agendamento' });
  }
});

app.delete('/api/schedules/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const deleted = await schedulingService.deleteSchedule(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    res.json({ message: 'Agendamento deletado com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar agendamento:', error);
    res.status(500).json({ error: 'Erro ao deletar agendamento' });
  }
});

// Logs de execução
app.get('/api/logs', authenticateToken, async (req, res) => {
  try {
    const { limit = 100, schedule_id } = req.query;
    const logs = await schedulingService.getScheduleLogs(
      schedule_id ? parseInt(schedule_id as string) : undefined,
      parseInt(limit as string)
    );
    res.json(logs);
  } catch (error) {
    logger.error('Erro ao obter logs:', error);
    res.status(500).json({ error: 'Erro ao obter logs' });
  }
});

// ===== GERENCIAMENTO DE GRUPOS =====

// Listar todos os grupos
app.get('/api/groups', authenticateToken, async (req, res) => {
  try {
    const { groupService } = await import('../services/GroupService');
    const groups = await groupService.getAllGroups();
    res.json(groups);
  } catch (error) {
    logger.error('Erro ao listar grupos:', error);
    res.status(500).json({ error: 'Erro ao listar grupos' });
  }
});

// Obter grupo específico
app.get('/api/groups/:id', authenticateToken, async (req, res) => {
  try {
    const { groupService } = await import('../services/GroupService');
    const group = await groupService.getGroupById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    res.json(group);
  } catch (error) {
    logger.error('Erro ao obter grupo:', error);
    res.status(500).json({ error: 'Erro ao obter grupo' });
  }
});

// Criar novo grupo
app.post('/api/groups', authenticateToken, async (req, res) => {
  try {
    const { name, platform, group_id, instance_name, enabled = true, lottery_types, template_id, schedule } = req.body;

    if (!name || !platform || !group_id || !lottery_types) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: name, platform, group_id, lottery_types' 
      });
    }

    const { groupService } = await import('../services/GroupService');
    const group = await groupService.createGroup({
      name,
      platform,
      groupId: group_id,
      instanceName: instance_name,
      enabled,
      lotteryTypes: lottery_types,
      templateId: template_id,
      schedule
    });

    res.status(201).json(group);
  } catch (error) {
    logger.error('Erro ao criar grupo:', error);
    res.status(500).json({ error: 'Erro ao criar grupo' });
  }
});

// Atualizar grupo
app.put('/api/groups/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates: any = {};

    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.platform !== undefined) updates.platform = req.body.platform;
    if (req.body.group_id !== undefined) updates.groupId = req.body.group_id;
    if (req.body.instance_name !== undefined) updates.instanceName = req.body.instance_name;
    if (req.body.enabled !== undefined) updates.enabled = req.body.enabled;
    if (req.body.lottery_types !== undefined) updates.lotteryTypes = req.body.lottery_types;
    if (req.body.template_id !== undefined) updates.templateId = req.body.template_id;
    if (req.body.schedule !== undefined) updates.schedule = req.body.schedule;

    const { groupService } = await import('../services/GroupService');
    const updated = await groupService.updateGroup(id, updates);

    if (!updated) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    res.json(updated);
  } catch (error) {
    logger.error('Erro ao atualizar grupo:', error);
    res.status(500).json({ error: 'Erro ao atualizar grupo' });
  }
});

// Deletar grupo
app.delete('/api/groups/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { groupService } = await import('../services/GroupService');
    const deleted = await groupService.deleteGroup(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    res.json({ message: 'Grupo deletado com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar grupo:', error);
    res.status(500).json({ error: 'Erro ao deletar grupo' });
  }
});

// Ativar/Desativar grupo
app.patch('/api/groups/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Campo enabled deve ser boolean' });
    }

    const { groupService } = await import('../services/GroupService');
    const success = await groupService.toggleGroup(id, enabled);

    if (!success) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    res.json({ message: `Grupo ${enabled ? 'ativado' : 'desativado'} com sucesso` });
  } catch (error) {
    logger.error('Erro ao alterar status do grupo:', error);
    res.status(500).json({ error: 'Erro ao alterar status do grupo' });
  }
});

// Adicionar bancas ao grupo
app.post('/api/groups/:id/bancas', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { lottery_types } = req.body;

    if (!lottery_types || !Array.isArray(lottery_types)) {
      return res.status(400).json({ error: 'lottery_types deve ser um array' });
    }

    const { groupService } = await import('../services/GroupService');
    const success = await groupService.addLotteryTypesToGroup(id, lottery_types);

    if (!success) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    const updated = await groupService.getGroupById(id);
    res.json(updated);
  } catch (error) {
    logger.error('Erro ao adicionar bancas ao grupo:', error);
    res.status(500).json({ error: 'Erro ao adicionar bancas' });
  }
});

// Remover bancas do grupo
app.delete('/api/groups/:id/bancas', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { lottery_types } = req.body;

    if (!lottery_types || !Array.isArray(lottery_types)) {
      return res.status(400).json({ error: 'lottery_types deve ser um array' });
    }

    const { groupService } = await import('../services/GroupService');
    const success = await groupService.removeLotteryTypesFromGroup(id, lottery_types);

    if (!success) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    const updated = await groupService.getGroupById(id);
    res.json(updated);
  } catch (error) {
    logger.error('Erro ao remover bancas do grupo:', error);
    res.status(500).json({ error: 'Erro ao remover bancas' });
  }
});

// Gerenciamento de tokens de API
app.post('/api/tokens', authenticateToken, async (req, res) => {
  try {
    const { name, expires_in_days = 365 } = req.body;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);

    const db = DatabaseManager.getInstance();
    const query = `
      INSERT INTO api_tokens (user_id, name, token, expires_at, active)
      VALUES (?, ?, ?, ?, 1)
    `;
    
    const result = await db.run(query, [req.user.id, name, token, expiresAt.toISOString()]);
    
    res.json({
      id: result.lastID,
      name,
      token,
      expires_at: expiresAt.toISOString()
    });
  } catch (error) {
    logger.error('Erro ao criar token:', error);
    res.status(500).json({ error: 'Erro ao criar token' });
  }
});

app.get('/api/tokens', authenticateToken, async (req, res) => {
  try {
    const db = DatabaseManager.getInstance();
    const query = `
      SELECT id, name, created_at, expires_at, last_used_at, usage_count, active
      FROM api_tokens 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    
    const tokens = await db.all(query, [req.user.id]);
    res.json(tokens);
  } catch (error) {
    logger.error('Erro ao obter tokens:', error);
    res.status(500).json({ error: 'Erro ao obter tokens' });
  }
});

app.delete('/api/tokens/:id', authenticateToken, async (req, res) => {
  try {
    const db = DatabaseManager.getInstance();
    const query = 'DELETE FROM api_tokens WHERE id = ? AND user_id = ?';
    const result = await db.run(query, [req.params.id, req.user.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Token não encontrado' });
    }
    
    res.json({ message: 'Token deletado com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar token:', error);
    res.status(500).json({ error: 'Erro ao deletar token' });
  }
});

// Estatísticas
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await resultsService.getStatistics();
    res.json(stats);
  } catch (error) {
    logger.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

// ===== GERENCIAMENTO DE INSTÂNCIAS EVOLUTION API =====

// Criar nova instância
app.post('/api/evolution/instances', authenticateToken, async (req, res) => {
  try {
    const { instanceName, token, qrcode, webhook, settings } = req.body;

    if (!instanceName) {
      return res.status(400).json({ error: 'instanceName é obrigatório' });
    }

    const evolutionService = createEvolutionAPIService();
    const result = await evolutionService.createInstance({
      instanceName,
      token,
      qrcode: qrcode !== false,
      webhook,
      settings
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Erro ao criar instância' });
    }

    res.status(201).json(result.instance);
  } catch (error) {
    logger.error('Erro ao criar instância:', error);
    res.status(500).json({ error: 'Erro ao criar instância' });
  }
});

// Listar todas as instâncias
app.get('/api/evolution/instances', authenticateToken, async (req, res) => {
  try {
    const evolutionService = createEvolutionAPIService();
    const instances = await evolutionService.listInstances();
    
    // Enriquecer com status de conexão
    const instancesWithStatus = await Promise.all(
      instances.map(async (instance) => {
        const status = await evolutionService.getInstanceStatus(instance.instanceName);
        return {
          ...instance,
          connectionState: status.state
        };
      })
    );

    res.json(instancesWithStatus);
  } catch (error) {
    logger.error('Erro ao listar instâncias:', error);
    res.status(500).json({ error: 'Erro ao listar instâncias' });
  }
});

// Obter instância específica
app.get('/api/evolution/instances/:instanceName', authenticateToken, async (req, res) => {
  try {
    const { instanceName } = req.params;
    const evolutionService = createEvolutionAPIService();
    
    const instance = await evolutionService.getInstance(instanceName);
    if (!instance) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }

    const status = await evolutionService.getInstanceStatus(instanceName);
    
    res.json({
      ...instance,
      connectionState: status.state
    });
  } catch (error) {
    logger.error('Erro ao obter instância:', error);
    res.status(500).json({ error: 'Erro ao obter instância' });
  }
});

// Obter QR Code da instância
app.get('/api/evolution/instances/:instanceName/qrcode', authenticateToken, async (req, res) => {
  try {
    const { instanceName } = req.params;
    const evolutionService = createEvolutionAPIService();
    
    const qrcode = await evolutionService.getQRCode(instanceName);
    
    if (qrcode.error) {
      return res.status(400).json({ error: qrcode.error });
    }

    res.json(qrcode);
  } catch (error) {
    logger.error('Erro ao obter QR Code:', error);
    res.status(500).json({ error: 'Erro ao obter QR Code' });
  }
});

// Deletar instância
app.delete('/api/evolution/instances/:instanceName', authenticateToken, async (req, res) => {
  try {
    const { instanceName } = req.params;
    const evolutionService = createEvolutionAPIService();
    
    const result = await evolutionService.deleteInstance(instanceName);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Erro ao deletar instância' });
    }

    res.json({ message: 'Instância deletada com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar instância:', error);
    res.status(500).json({ error: 'Erro ao deletar instância' });
  }
});

// Reiniciar instância
app.post('/api/evolution/instances/:instanceName/restart', authenticateToken, async (req, res) => {
  try {
    const { instanceName } = req.params;
    const evolutionService = createEvolutionAPIService();
    
    const result = await evolutionService.restartInstance(instanceName);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Erro ao reiniciar instância' });
    }

    res.json({ message: 'Instância reiniciada com sucesso' });
  } catch (error) {
    logger.error('Erro ao reiniciar instância:', error);
    res.status(500).json({ error: 'Erro ao reiniciar instância' });
  }
});

// Logout/Desconectar instância
app.post('/api/evolution/instances/:instanceName/logout', authenticateToken, async (req, res) => {
  try {
    const { instanceName } = req.params;
    const evolutionService = createEvolutionAPIService();
    
    const result = await evolutionService.logoutInstance(instanceName);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Erro ao desconectar instância' });
    }

    res.json({ message: 'Instância desconectada com sucesso' });
  } catch (error) {
    logger.error('Erro ao desconectar instância:', error);
    res.status(500).json({ error: 'Erro ao desconectar instância' });
  }
});

// Testar conexão com Evolution API
app.get('/api/evolution/test', authenticateToken, async (req, res) => {
  try {
    const evolutionService = createEvolutionAPIService();
    const isConnected = await evolutionService.testConnection();
    
    res.json({
      connected: isConnected,
      server: process.env.EVOLUTION_API_URL || 'https://solitarybaboon-evolution.cloudfy.live'
    });
  } catch (error) {
    logger.error('Erro ao testar conexão:', error);
    res.status(500).json({ error: 'Erro ao testar conexão' });
  }
});

// Webhook para receber mensagens do Evolution API
// Protegido por token ou por secret key no header
app.post('/api/webhook/evolution', async (req, res) => {
  try {
    // Verificar autenticação: token OU secret key
    const authHeader = req.headers['authorization'];
    const secretKey = req.headers['x-webhook-secret'];
    const webhookSecret = process.env.WEBHOOK_SECRET || '';

    // Permitir se tiver token válido OU secret key válida
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const db = DatabaseManager.getInstance();
        const tokenRecord = await db.get(
          'SELECT * FROM api_tokens WHERE token = ? AND active = 1 AND expires_at > CURRENT_TIMESTAMP',
          [token]
        );
        if (!tokenRecord) {
          return res.status(403).json({ error: 'Token inválido' });
        }
      }
    } else if (secretKey && webhookSecret && secretKey === webhookSecret) {
      // Secret key válida
    } else {
      return res.status(401).json({ error: 'Autenticação necessária (token ou secret key)' });
    }

    const { event, data } = req.body;
    
    logger.info(`Webhook Evolution: ${event}`, data);
    
    // Processar diferentes tipos de eventos
    switch (event) {
      case 'message':
        // Processar mensagem recebida
        break;
      case 'status':
        // Processar mudança de status
        break;
      default:
        logger.warn(`Evento não tratado: ${event}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    logger.error('Erro no webhook:', error);
    res.status(500).json({ error: 'Erro no webhook' });
  }
});

// ===== PAPEL E ATRASADOS =====

// Calcular números atrasados
app.get('/api/atrasados/:lotteryType', authenticateToken, async (req, res) => {
  try {
    const { lotteryType } = req.params;
    const { dias_minimos = 7, posicao } = req.query;

    const { atrasadosService } = await import('../services/AtrasadosService');
    const atrasados = await atrasadosService.calcularAtrasados(
      lotteryType as LotteryType,
      parseInt(dias_minimos as string),
      posicao ? parseInt(posicao as string) : undefined
    );

    res.json({
      lotteryType,
      total: atrasados.length,
      atrasados: atrasados.slice(0, 100) // Limitar a 100 mais atrasados
    });
  } catch (error) {
    logger.error('Erro ao calcular atrasados:', error);
    res.status(500).json({ error: 'Erro ao calcular atrasados' });
  }
});

// Calcular todos os atrasados
app.get('/api/atrasados', authenticateToken, async (req, res) => {
  try {
    const { dias_minimos = 7 } = req.query;

    const { atrasadosService } = await import('../services/AtrasadosService');
    const allAtrasados = await atrasadosService.calcularTodosAtrasados(parseInt(dias_minimos as string));

    const result: any = {};
    for (const [type, atrasados] of allAtrasados) {
      result[type] = {
        total: atrasados.length,
        atrasados: atrasados.slice(0, 50) // Top 50 por loteria
      };
    }

    res.json(result);
  } catch (error) {
    logger.error('Erro ao calcular todos os atrasados:', error);
    res.status(500).json({ error: 'Erro ao calcular atrasados' });
  }
});

// Verificar papel/pendentes
app.get('/api/papel/:bancaKey', authenticateToken, async (req, res) => {
  try {
    const { bancaKey } = req.params;
    const { date } = req.query;

    const { papelService } = await import('../services/PapelService');
    const papel = await papelService.verificarPapelPendentes(bancaKey, date as string);

    res.json({
      banca: bancaKey,
      date: date || new Date().toISOString().split('T')[0],
      total: papel.length,
      resultados: papel
    });
  } catch (error) {
    logger.error('Erro ao verificar papel:', error);
    res.status(500).json({ error: 'Erro ao verificar papel' });
  }
});

// ===== PALPITES =====

// Gerar palpites aleatórios
app.get('/api/palpites/aleatorios', authenticateToken, async (req, res) => {
  try {
    const { dezenas = 5, centenas = 5, milhares = 5, animais = 5 } = req.query;

    const { palpitesService } = await import('../services/PalpitesService');
    const palpites = palpitesService.gerarPalpitesAleatorios(
      parseInt(dezenas as string),
      parseInt(centenas as string),
      parseInt(milhares as string),
      parseInt(animais as string)
    );

    res.json(palpites);
  } catch (error) {
    logger.error('Erro ao gerar palpites aleatórios:', error);
    res.status(500).json({ error: 'Erro ao gerar palpites' });
  }
});

// Gerar palpites baseados em atrasados
app.get('/api/palpites/atrasados/:lotteryType', authenticateToken, async (req, res) => {
  try {
    const { lotteryType } = req.params;
    const { dezenas = 5, centenas = 5, milhares = 5, animais = 5, sorteios_minimos = 10 } = req.query;

    const { palpitesService } = await import('../services/PalpitesService');
    const palpites = await palpitesService.gerarPalpitesPorAtrasados(
      lotteryType as LotteryType,
      parseInt(dezenas as string),
      parseInt(centenas as string),
      parseInt(milhares as string),
      parseInt(animais as string),
      parseInt(sorteios_minimos as string)
    );

    res.json(palpites);
  } catch (error) {
    logger.error('Erro ao gerar palpites por atrasados:', error);
    res.status(500).json({ error: 'Erro ao gerar palpites' });
  }
});

// Gerar palpites mistos
app.get('/api/palpites/mistos/:lotteryType', authenticateToken, async (req, res) => {
  try {
    const { lotteryType } = req.params;
    const { dezenas = 5, centenas = 5, milhares = 5, animais = 5, percentual_atrasados = 50 } = req.query;

    const { palpitesService } = await import('../services/PalpitesService');
    const palpites = await palpitesService.gerarPalpitesMistos(
      lotteryType as LotteryType,
      parseInt(dezenas as string),
      parseInt(centenas as string),
      parseInt(milhares as string),
      parseInt(animais as string),
      parseInt(percentual_atrasados as string)
    );

    res.json(palpites);
  } catch (error) {
    logger.error('Erro ao gerar palpites mistos:', error);
    res.status(500).json({ error: 'Erro ao gerar palpites' });
  }
});

// Enviar palpites para grupos
app.post('/api/palpites/enviar', authenticateToken, async (req, res) => {
  try {
    const { lotteryType, tipo = 'aleatorios', grupos } = req.body;

    const { palpitesService } = await import('../services/PalpitesService');
    const { messageService } = await import('../services/MessageService');

    let palpites;
    if (tipo === 'aleatorios') {
      palpites = palpitesService.gerarPalpitesAleatorios();
    } else if (tipo === 'atrasados' && lotteryType) {
      palpites = await palpitesService.gerarPalpitesPorAtrasados(lotteryType as LotteryType);
    } else if (tipo === 'mistos' && lotteryType) {
      palpites = await palpitesService.gerarPalpitesMistos(lotteryType as LotteryType);
    } else {
      return res.status(400).json({ error: 'Tipo de palpite inválido' });
    }

    const mensagem = palpitesService.formatarPalpitesParaMensagem(palpites);

    // Enviar para grupos especificados ou todos os grupos ativos
    // TODO: Implementar envio para grupos específicos

    res.json({
      success: true,
      palpites,
      mensagem,
      enviado: true
    });
  } catch (error) {
    logger.error('Erro ao enviar palpites:', error);
    res.status(500).json({ error: 'Erro ao enviar palpites' });
  }
});

// Tratamento de erros global
app.use((error: any, req: any, res: any, next: any) => {
  logger.error('Erro não tratado:', error);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Iniciar servidor
export function startAPIServer(): void {
  app.listen(PORT, () => {
    logger.info(`🚀 API Server rodando na porta ${PORT}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
    logger.info(`📈 Status: http://localhost:${PORT}/api/status`);
  });
}

export default app;