import { LotteryResult, LotteryType } from '../types';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';

export class ResultsService {
  private db = getDatabase();

  async saveResults(results: Map<LotteryType, LotteryResult>): Promise<void> {
    logger.info(`Salvando ${results.size} resultados no banco de dados`);
    
    for (const [type, result] of results) {
      try {
        // Verifica se já existe resultado para esta data e tipo
        const existing = await this.getResultByDateAndType(result.date, type);
        
        if (existing && existing.id) {
          // Atualiza resultado existente
          await this.updateResult(existing.id, result);
          logger.info(`✅ Resultado atualizado: ${type}`);
        } else {
          // Cria novo resultado
          await this.createResult(result);
          logger.info(`✅ Resultado criado: ${type}`);
        }
        
      } catch (error) {
        logger.error(`Erro ao salvar resultado ${type}:`, error);
      }
    }
  }

  async createResult(result: LotteryResult): Promise<LotteryResult | null> {
    try {
      const stmt = `
        INSERT INTO lottery_results (lottery_type, date, results, prizes, source, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        result.lotteryType,
        result.date,
        JSON.stringify(result.results),
        result.prizes ? JSON.stringify(result.prizes) : null,
        result.source,
        result.status || 'active'
      ];

      await this.db.run(stmt, params);
      
      // Pega o ID do resultado inserido
      const lastId = await this.db.get('SELECT last_insert_rowid() as id');
      
      return {
        ...result,
        id: lastId.id.toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
    } catch (error) {
      logger.error('Erro ao criar resultado:', error);
      return null;
    }
  }

  async updateResult(id: string, result: Partial<LotteryResult>, includeInternal: boolean = false): Promise<LotteryResult | null> {
    try {
      const stmt = `
        UPDATE lottery_results 
        SET results = ?, prizes = ?, source = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      // Se source for fornecido e não for interno, preservar source original do banco
      // para não sobrescrever identificação interna do Resultado Fácil
      let sourceToSave = result.source;
      if (result.source && !includeInternal) {
        // Se tentar atualizar source pela API, não permitir sobrescrever source interno
        const existing = await this.getResultById(id, true);
        if (existing && (existing as any)._internalSource === 'resultadofacil') {
          // Preservar source interno, não sobrescrever
          sourceToSave = existing.source;
        }
      }
      
      const params = [
        JSON.stringify(result.results),
        result.prizes ? JSON.stringify(result.prizes) : null,
        sourceToSave,
        result.status,
        id
      ];

      await this.db.run(stmt, params);
      
      // Retorna o resultado atualizado (já sanitizado se não for interno)
      return await this.getResultById(id, includeInternal);
      
    } catch (error) {
      logger.error('Erro ao atualizar resultado:', error);
      return null;
    }
  }

  async getResultById(id: string, includeInternal: boolean = false): Promise<LotteryResult | null> {
    try {
      const row = await this.db.get(
        'SELECT * FROM lottery_results WHERE id = ?',
        [id]
      );

      if (!row) return null;
      
      const result = this.mapRowToResult(row);
      
      // Se não for uso interno, sanitizar
      return includeInternal ? result : this.sanitizeResultForAPI(result) as LotteryResult;
      
    } catch (error) {
      logger.error('Erro ao buscar resultado por ID:', error);
      return null;
    }
  }

  async getResultByDateAndType(date: string, lotteryType: LotteryType, includeInternal: boolean = false): Promise<LotteryResult | null> {
    try {
      const row = await this.db.get(
        'SELECT * FROM lottery_results WHERE date = ? AND lottery_type = ?',
        [date, lotteryType]
      );

      if (!row) return null;
      
      const result = this.mapRowToResult(row);
      
      // Se não for uso interno, sanitizar
      return includeInternal ? result : this.sanitizeResultForAPI(result) as LotteryResult;
      
    } catch (error) {
      logger.error('Erro ao buscar resultado por data e tipo:', error);
      return null;
    }
  }
  
  async getResultsByType(lotteryType: LotteryType, limit: number = 50, offset: number = 0, includeInternal: boolean = false): Promise<LotteryResult[]> {
    try {
      const rows = await this.db.all(
        'SELECT * FROM lottery_results WHERE lottery_type = ? AND status = "active" ORDER BY date DESC LIMIT ? OFFSET ?',
        [lotteryType, limit, offset]
      );

      const results = rows.map(row => this.mapRowToResult(row));
      
      // Se não for uso interno, sanitizar todos
      return includeInternal 
        ? results 
        : results.map(r => this.sanitizeResultForAPI(r) as LotteryResult);
      
    } catch (error) {
      logger.error('Erro ao buscar resultados por tipo:', error);
      return [];
    }
  }
  
  async getRecentResults(limit: number = 50, offset: number = 0, includeInternal: boolean = false): Promise<LotteryResult[]> {
    try {
      const rows = await this.db.all(
        'SELECT * FROM lottery_results WHERE status = "active" ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );

      const results = rows.map(row => this.mapRowToResult(row));
      
      // Se não for uso interno, sanitizar todos
      return includeInternal 
        ? results 
        : results.map(r => this.sanitizeResultForAPI(r) as LotteryResult);
      
    } catch (error) {
      logger.error('Erro ao buscar resultados recentes:', error);
      return [];
    }
  }
  
  async getResultsByDateRange(startDate: string, endDate: string, lotteryType?: LotteryType, includeInternal: boolean = false): Promise<LotteryResult[]> {
    try {
      let query = 'SELECT * FROM lottery_results WHERE date >= ? AND date <= ?';
      const params: any[] = [startDate, endDate];
      
      if (lotteryType) {
        query += ' AND lottery_type = ?';
        params.push(lotteryType);
      }
      
      query += ' ORDER BY date DESC, lottery_type ASC';
      
      const rows = await this.db.all(query, params);

      const results = rows.map(row => this.mapRowToResult(row));
      
      // Se não for uso interno, sanitizar todos
      return includeInternal 
        ? results 
        : results.map(r => this.sanitizeResultForAPI(r) as LotteryResult);
      
    } catch (error) {
      logger.error('Erro ao buscar resultados por período:', error);
      return [];
    }
  }

  async getResultsByDate(date: string, includeInternal: boolean = false): Promise<LotteryResult[]> {
    try {
      const rows = await this.db.all(
        'SELECT * FROM lottery_results WHERE date = ? ORDER BY lottery_type ASC',
        [date]
      );

      const results = rows.map(row => this.mapRowToResult(row));
      
      // Se não for uso interno, sanitizar todos
      return includeInternal 
        ? results 
        : results.map(r => this.sanitizeResultForAPI(r) as LotteryResult);
      
    } catch (error) {
      logger.error('Erro ao buscar resultados por data:', error);
      return [];
    }
  }

  async getResultsByDateRange(startDate: string, endDate: string, includeInternal: boolean = false): Promise<LotteryResult[]> {
    try {
      const rows = await this.db.all(
        'SELECT * FROM lottery_results WHERE date >= ? AND date <= ? ORDER BY date DESC, lottery_type ASC',
        [startDate, endDate]
      );

      const results = rows.map(row => this.mapRowToResult(row));
      
      // Se não for uso interno, sanitizar todos
      return includeInternal 
        ? results 
        : results.map(r => this.sanitizeResultForAPI(r) as LotteryResult);
      
    } catch (error) {
      logger.error('Erro ao buscar resultados por período:', error);
      return [];
    }
  }

  async getLatestResults(limit: number = 10, includeInternal: boolean = false): Promise<LotteryResult[]> {
    try {
      const rows = await this.db.all(
        'SELECT * FROM lottery_results WHERE status = "active" ORDER BY date DESC, lottery_type ASC LIMIT ?',
        [limit]
      );

      const results = rows.map(row => this.mapRowToResult(row));
      
      // Se não for uso interno, sanitizar todos
      return includeInternal 
        ? results 
        : results.map(r => this.sanitizeResultForAPI(r) as LotteryResult);
      
    } catch (error) {
      logger.error('Erro ao buscar resultados recentes:', error);
      return [];
    }
  }

  async deleteResult(id: string): Promise<boolean> {
    try {
      await this.db.run(
        'DELETE FROM lottery_results WHERE id = ?',
        [id]
      );

      const success = true; // Assume success since no error was thrown
      if (success) {
        logger.info(`✅ Resultado deletado: ${id}`);
      }
      
      return success;
      
    } catch (error) {
      logger.error('Erro ao deletar resultado:', error);
      return false;
    }
  }

  private mapRowToResult(row: any): LotteryResult {
    // Identificar internamente se veio do Resultado Fácil
    const isResultadoFacil = row.source && (
      row.source.includes('resultadofacil.com.br') ||
      row.source.includes('resultado-facil') ||
      row.source === 'resultadofacil'
    );
    
    // Para uso interno no backend - não expor na API
    // O campo source será mascarado na API para não revelar a origem
    return {
      id: row.id.toString(),
      lotteryType: row.lottery_type as LotteryType,
      date: row.date,
      results: JSON.parse(row.results),
      prizes: row.prizes ? JSON.parse(row.prizes) : undefined,
      source: row.source, // Mantém original para uso interno
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      // Campo interno (não será serializado na API)
      _internalSource: isResultadoFacil ? 'resultadofacil' : row.source
    } as LotteryResult & { _internalSource?: string };
  }
  
  /**
   * Remove informações internas antes de enviar para API
   * Garante que nem administrador veja a origem real do Resultado Fácil
   * IMPORTANTE: Source sempre retorna genérico, nunca expõe 'resultadofacil'
   */
  private sanitizeResultForAPI(result: LotteryResult): Omit<LotteryResult, '_internalSource'> {
    const { _internalSource, ...sanitized } = result as any;
    
    // Mascarar source - sempre retornar como "sistema" 
    // Nunca expor que veio do Resultado Fácil
    const maskedSource = 'sistema'; // Sempre genérico na API
    
    return {
      ...sanitized,
      source: maskedSource // NUNCA expõe origem real, nem para admin
    };
  }
  
  /**
   * Método interno para obter source real (apenas para logs/debug interno)
   * NUNCA expor na API
   */
  async getInternalSource(resultId: string): Promise<string | null> {
    try {
      const row = await this.db.get(
        'SELECT source FROM lottery_results WHERE id = ?',
        [resultId]
      );
      return row ? row.source : null;
    } catch (error) {
      logger.error('Erro ao buscar source interno:', error);
      return null;
    }
  }

  // Estatísticas
  async getStatistics(): Promise<any> {
    try {
      const totalResults = await this.db.get('SELECT COUNT(*) as total FROM lottery_results');
      const resultsByType = await this.db.all(`
        SELECT lottery_type, COUNT(*) as count 
        FROM lottery_results 
        WHERE status = 'active' 
        GROUP BY lottery_type 
        ORDER BY count DESC
      `);
      const latestResult = await this.db.get(`
        SELECT lottery_type, date 
        FROM lottery_results 
        WHERE status = 'active' 
        ORDER BY date DESC, created_at DESC 
        LIMIT 1
      `);

      return {
        totalResults: totalResults.total,
        resultsByType: resultsByType,
        latestResult: latestResult,
        databaseType: 'SQLite'
      };
      
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      return null;
    }
  }
}

export const resultsService = new ResultsService();