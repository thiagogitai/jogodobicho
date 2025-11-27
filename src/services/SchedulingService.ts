import cron from 'node-cron';
import { LotteryType } from '../types';
import { ScrapeService } from './ScrapeService';
import { MessageService } from './MessageService';
import { ResultsService } from './ResultsService';
import { DatabaseManager } from '../config/database';
import { logger } from '../utils/logger';

export interface ScheduleConfig {
  id?: number;
  lotteryType: LotteryType;
  cronExpression: string;
  enabled: boolean;
  templateId?: number;
  groupIds?: number[];
  lastRun?: Date;
  nextRun?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScheduleLog {
  id?: number;
  scheduleId: number;
  lotteryType: LotteryType;
  status: 'success' | 'error' | 'warning';
  message: string;
  resultsCount?: number;
  executionTime?: number;
  errorDetails?: string;
  createdAt?: Date;
}

export class SchedulingService {
  private jobs: Map<number, cron.ScheduledTask> = new Map();
  private scrapeService: ScrapeService;
  private messageService: MessageService;
  private resultsService: ResultsService;
  private db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
    this.scrapeService = new ScrapeService();
    this.messageService = new MessageService();
    this.resultsService = new ResultsService();
    this.initializeSchedules();
  }

  async initializeSchedules(): Promise<void> {
    try {
      const schedules = await this.getAllSchedules();
      
      for (const schedule of schedules) {
        if (schedule.enabled) {
          await this.startSchedule(schedule);
        }
      }
      
      logger.info(`Initialized ${schedules.filter(s => s.enabled).length} active schedules`);
    } catch (error) {
      logger.error('Failed to initialize schedules:', error);
    }
  }

  async createSchedule(config: ScheduleConfig): Promise<ScheduleConfig> {
    const query = `
      INSERT INTO schedules (name, cron_expression, enabled, lottery_types, groups)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const groupIdsJson = config.groupIds ? JSON.stringify(config.groupIds) : null;
    
    const result = await this.db.run(query, [
      config.name || config.lotteryType, // Usar lotteryType como nome se não houver nome
      config.cronExpression,
      config.enabled ? 1 : 0,
      JSON.stringify([config.lotteryType]), // Converter para array JSON
      groupIdsJson || '[]'
    ]);
    
    const newSchedule = {
      ...config,
      id: result.lastID,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (config.enabled) {
      await this.startSchedule(newSchedule);
    }
    
    logger.info(`Created schedule for ${config.lotteryType}: ${config.cronExpression}`);
    return newSchedule;
  }

  async updateSchedule(id: number, config: Partial<ScheduleConfig>): Promise<boolean> {
    const fields = [];
    const values = [];
    
    if (config.cronExpression !== undefined) {
      fields.push('cron_expression = ?');
      values.push(config.cronExpression);
    }
    
    if (config.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(config.enabled ? 1 : 0);
    }
    
    if (config.templateId !== undefined) {
      fields.push('template_id = ?');
      values.push(config.templateId);
    }
    
    if (config.groupIds !== undefined) {
      fields.push('group_ids = ?');
      values.push(JSON.stringify(config.groupIds));
    }
    
    if (fields.length === 0) return false;
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const query = `UPDATE schedules SET ${fields.join(', ')} WHERE id = ?`;
    
    try {
      await this.db.run(query, values);
      
      const updatedSchedule = await this.getSchedule(id);
      if (updatedSchedule) {
        await this.stopSchedule(id);
        if (updatedSchedule.enabled) {
          await this.startSchedule(updatedSchedule);
        }
      }
      
      logger.info(`Updated schedule ${id}`);
      return true;
    } catch (error) {
      logger.error(`Failed to update schedule ${id}:`, error);
      return false;
    }
  }

  async deleteSchedule(id: number): Promise<boolean> {
    try {
      await this.stopSchedule(id);
      await this.db.run('DELETE FROM schedules WHERE id = ?', [id]);
      logger.info(`Deleted schedule ${id}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete schedule ${id}:`, error);
      return false;
    }
  }

  async getSchedule(id: number): Promise<ScheduleConfig | null> {
    const query = 'SELECT * FROM schedules WHERE id = ?';
    const row = await this.db.get(query, [id]);
    
    if (!row) return null;
    
    return this.mapScheduleRow(row);
  }

  async getAllSchedules(): Promise<ScheduleConfig[]> {
    const query = 'SELECT * FROM schedules ORDER BY name';
    const rows = await this.db.all(query);
    
    return rows.map(row => this.mapScheduleRow(row));
  }

  async getScheduleLogs(scheduleId?: number, limit = 50): Promise<ScheduleLog[]> {
    let query = 'SELECT * FROM schedule_logs';
    const params = [];
    
    if (scheduleId) {
      query += ' WHERE schedule_id = ?';
      params.push(scheduleId);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    const rows = await this.db.all(query, params);
    
    return rows.map(row => ({
      id: row.id,
      scheduleId: row.schedule_id,
      lotteryType: row.lottery_type,
      status: row.status,
      message: row.message,
      resultsCount: row.results_count,
      executionTime: row.execution_time,
      errorDetails: row.error_details,
      createdAt: new Date(row.created_at)
    }));
  }

  private async startSchedule(schedule: ScheduleConfig): Promise<void> {
    try {
      const job = cron.schedule(schedule.cronExpression, async () => {
        await this.executeSchedule(schedule);
      }, { timezone: 'America/Sao_Paulo' });
      this.jobs.set(schedule.id!, job);
      logger.info(`Started schedule ${schedule.id} for ${schedule.lotteryType}`);
    } catch (error) {
      logger.error(`Failed to start schedule ${schedule.id}:`, error);
      await this.logScheduleExecution(schedule.id!, schedule.lotteryType, 'error', 'Failed to start schedule', 0, 0, error.message);
    }
  }

  private async stopSchedule(id: number): Promise<void> {
    const job = this.jobs.get(id);
    if (job) {
      job.stop();
      this.jobs.delete(id);
      logger.info(`Stopped schedule ${id}`);
    }
  }

  private async executeSchedule(schedule: ScheduleConfig): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info(`Executing schedule ${schedule.id} for ${schedule.lotteryType}`);
      
      // Scrape results for the specific lottery type
      const results = await this.scrapeService.scrapeResultsByType(schedule.lotteryType);
      
      if (results.length === 0) {
        const message = `No results found for ${schedule.lotteryType}`;
        await this.logScheduleExecution(schedule.id!, schedule.lotteryType, 'warning', message, 0, Date.now() - startTime);
        return;
      }
      
      // Send messages if groups are configured
      if (schedule.groupIds && schedule.groupIds.length > 0) {
        const templateId = schedule.templateId || 1; // Default template
        
        for (const groupId of schedule.groupIds) {
          try {
            await this.messageService.sendResultsToGroup(
              groupId,
              templateId,
              results
            );
          } catch (error) {
            logger.error(`Failed to send to group ${groupId}:`, error);
          }
        }
      }
      
      const executionTime = Date.now() - startTime;
      const message = `Successfully scraped ${results.length} results and sent to ${schedule.groupIds?.length || 0} groups`;
      
      await this.logScheduleExecution(
        schedule.id!,
        schedule.lotteryType,
        'success',
        message,
        results.length,
        executionTime
      );
      
      // Update next run time
      // node-cron não fornece próxima execução nativamente
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      await this.logScheduleExecution(
        schedule.id!,
        schedule.lotteryType,
        'error',
        'Schedule execution failed',
        0,
        executionTime,
        error.message
      );
      
      logger.error(`Schedule ${schedule.id} execution failed:`, error);
    }
  }

  private async logScheduleExecution(
    scheduleId: number,
    lotteryType: LotteryType,
    status: 'success' | 'error' | 'warning',
    message: string,
    resultsCount?: number,
    executionTime?: number,
    errorDetails?: string
  ): Promise<void> {
    const query = `
      INSERT INTO schedule_logs (schedule_id, lottery_types, status, message, results_count, execution_time, error_details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.db.run(query, [
      scheduleId,
      JSON.stringify([lotteryType]), // Converter para array JSON
      status,
      message,
      resultsCount || 0,
      executionTime || 0,
      errorDetails || null
    ]);
  }

  private async updateNextRun(scheduleId: number, nextRun: Date): Promise<void> {
    await this.db.run(
      'UPDATE schedules SET next_run = ?, last_run = CURRENT_TIMESTAMP WHERE id = ?',
      [nextRun, scheduleId]
    );
  }

  private mapScheduleRow(row: any): ScheduleConfig {
    const lotteryTypes = row.lottery_types ? JSON.parse(row.lottery_types) : [];
    return {
      id: row.id,
      name: row.name,
      lotteryType: lotteryTypes[0] || '', // Pegar o primeiro tipo como principal
      cronExpression: row.cron_expression,
      enabled: Boolean(row.enabled),
      templateId: row.template_id,
      groupIds: row.groups ? JSON.parse(row.groups) : [],
      lastRun: row.last_run ? new Date(row.last_run) : undefined,
      nextRun: row.next_run ? new Date(row.next_run) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  // Utility methods for common schedule configurations
  static getDefaultCronExpressions(): Record<string, string> {
    return {
      'FEDERAL': '0 20 * * *',      // 20:00 daily
      'RIO': '0 14,19 * * *',       // 14:00 and 19:00 daily
      'LOOK_GO': '0 16 * * *',      // 16:00 daily
      'PT_SP': '0 14,20 * * *',     // 14:00 and 20:00 daily
      'NACIONAL': '0 19 * * *',     // 19:00 daily
      'MALUQUINHA_RIO': '0 13,18 * * *', // 13:00 and 18:00 daily
      'LOTEP': '0 15 * * *',        // 15:00 daily
      'LOTECE': '0 16 * * *',       // 16:00 daily
      'MINAS_GERAIS': '0 13,19 * * *', // 13:00 and 19:00 daily
      'BOA_SORTE': '0 14 * * *',    // 14:00 daily
      'LOTERIAS_CAIXA': '0 20 * * *' // 20:00 daily
    };
  }

  async stopAllSchedules(): Promise<void> {
    for (const [id, job] of this.jobs) {
      job.stop();
    }
    this.jobs.clear();
    logger.info('Stopped all schedules');
  }
}