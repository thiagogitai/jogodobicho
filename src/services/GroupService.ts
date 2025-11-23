import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { GroupConfig, LotteryType } from '../types';

export class GroupService {
  private db = getDatabase();

  /**
   * Criar novo grupo
   */
  async createGroup(group: Omit<GroupConfig, 'id'>): Promise<GroupConfig> {
    try {
      const stmt = `
        INSERT INTO group_configs (name, platform, group_id, instance_name, enabled, lottery_types, template_id, schedule)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        group.name,
        group.platform,
        group.groupId,
        group.instanceName || null,
        group.enabled ? 1 : 0,
        JSON.stringify(group.lotteryTypes),
        group.templateId || null,
        group.schedule || null
      ];

      await this.db.run(stmt, params);
      const lastId = await this.db.get('SELECT last_insert_rowid() as id');
      
      logger.info(`Grupo criado: ${group.name} (ID: ${lastId.id})`);

      return {
        ...group,
        id: lastId.id.toString()
      };
    } catch (error) {
      logger.error('Erro ao criar grupo:', error);
      throw error;
    }
  }

  /**
   * Listar todos os grupos
   */
  async getAllGroups(): Promise<GroupConfig[]> {
    try {
      const rows = await this.db.all(
        'SELECT * FROM group_configs ORDER BY created_at DESC'
      );

      return rows.map(row => this.mapRowToGroup(row));
    } catch (error) {
      logger.error('Erro ao listar grupos:', error);
      return [];
    }
  }

  /**
   * Obter grupo por ID
   */
  async getGroupById(id: string): Promise<GroupConfig | null> {
    try {
      const row = await this.db.get(
        'SELECT * FROM group_configs WHERE id = ?',
        [id]
      );

      return row ? this.mapRowToGroup(row) : null;
    } catch (error) {
      logger.error('Erro ao obter grupo:', error);
      return null;
    }
  }

  /**
   * Obter grupos ativos
   */
  async getActiveGroups(): Promise<GroupConfig[]> {
    try {
      const rows = await this.db.all(
        'SELECT * FROM group_configs WHERE enabled = 1 ORDER BY name ASC'
      );

      return rows.map(row => this.mapRowToGroup(row));
    } catch (error) {
      logger.error('Erro ao obter grupos ativos:', error);
      return [];
    }
  }

  /**
   * Atualizar grupo
   */
  async updateGroup(id: string, updates: Partial<GroupConfig>): Promise<GroupConfig | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }

      if (updates.platform !== undefined) {
        fields.push('platform = ?');
        values.push(updates.platform);
      }

      if (updates.groupId !== undefined) {
        fields.push('group_id = ?');
        values.push(updates.groupId);
      }

      if (updates.instanceName !== undefined) {
        fields.push('instance_name = ?');
        values.push(updates.instanceName);
      }

      if (updates.enabled !== undefined) {
        fields.push('enabled = ?');
        values.push(updates.enabled ? 1 : 0);
      }

      if (updates.lotteryTypes !== undefined) {
        fields.push('lottery_types = ?');
        values.push(JSON.stringify(updates.lotteryTypes));
      }

      if (updates.templateId !== undefined) {
        fields.push('template_id = ?');
        values.push(updates.templateId || null);
      }

      if (updates.schedule !== undefined) {
        fields.push('schedule = ?');
        values.push(updates.schedule || null);
      }

      if (fields.length === 0) {
        return await this.getGroupById(id);
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = `UPDATE group_configs SET ${fields.join(', ')} WHERE id = ?`;
      await this.db.run(stmt, values);

      logger.info(`Grupo atualizado: ${id}`);

      return await this.getGroupById(id);
    } catch (error) {
      logger.error('Erro ao atualizar grupo:', error);
      return null;
    }
  }

  /**
   * Deletar grupo
   */
  async deleteGroup(id: string): Promise<boolean> {
    try {
      await this.db.run(
        'DELETE FROM group_configs WHERE id = ?',
        [id]
      );

      logger.info(`Grupo deletado: ${id}`);
      return true;
    } catch (error) {
      logger.error('Erro ao deletar grupo:', error);
      return false;
    }
  }

  /**
   * Ativar/Desativar grupo
   */
  async toggleGroup(id: string, enabled: boolean): Promise<boolean> {
    try {
      await this.db.run(
        'UPDATE group_configs SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [enabled ? 1 : 0, id]
      );

      logger.info(`Grupo ${enabled ? 'ativado' : 'desativado'}: ${id}`);
      return true;
    } catch (error) {
      logger.error('Erro ao alterar status do grupo:', error);
      return false;
    }
  }

  /**
   * Adicionar bancas (lottery types) ao grupo
   */
  async addLotteryTypesToGroup(id: string, lotteryTypes: LotteryType[]): Promise<boolean> {
    try {
      const group = await this.getGroupById(id);
      if (!group) {
        return false;
      }

      // Combinar tipos existentes com novos (sem duplicatas)
      const existingTypes = new Set(group.lotteryTypes);
      lotteryTypes.forEach(type => existingTypes.add(type));

      await this.db.run(
        'UPDATE group_configs SET lottery_types = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(Array.from(existingTypes)), id]
      );

      logger.info(`Bancas adicionadas ao grupo ${id}: ${lotteryTypes.join(', ')}`);
      return true;
    } catch (error) {
      logger.error('Erro ao adicionar bancas ao grupo:', error);
      return false;
    }
  }

  /**
   * Remover bancas (lottery types) do grupo
   */
  async removeLotteryTypesFromGroup(id: string, lotteryTypes: LotteryType[]): Promise<boolean> {
    try {
      const group = await this.getGroupById(id);
      if (!group) {
        return false;
      }

      // Remover tipos especificados
      const existingTypes = new Set(group.lotteryTypes);
      lotteryTypes.forEach(type => existingTypes.delete(type));

      await this.db.run(
        'UPDATE group_configs SET lottery_types = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(Array.from(existingTypes)), id]
      );

      logger.info(`Bancas removidas do grupo ${id}: ${lotteryTypes.join(', ')}`);
      return true;
    } catch (error) {
      logger.error('Erro ao remover bancas do grupo:', error);
      return false;
    }
  }

  /**
   * Mapear linha do banco para GroupConfig
   */
  private mapRowToGroup(row: any): GroupConfig {
    return {
      id: row.id.toString(),
      name: row.name,
      platform: row.platform,
      groupId: row.group_id,
      instanceName: row.instance_name || undefined,
      enabled: row.enabled === 1,
      lotteryTypes: JSON.parse(row.lottery_types || '[]') as LotteryType[],
      templateId: row.template_id?.toString() || undefined,
      schedule: row.schedule || undefined
    };
  }
}

export const groupService = new GroupService();

