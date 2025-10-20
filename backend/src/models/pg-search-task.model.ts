import { BaseModel } from './base.model';

export interface PgSearchTask {
  id: number;
  keyword: string;
  platforms: string[];
  user_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: Date;
  updated_at: Date;
}

export interface CreateSearchTaskRequest {
  keyword: string;
  platforms: string[];
  user_id: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface UpdateSearchTaskRequest {
  keyword?: string;
  platforms?: string[];
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export class PgSearchTaskModel extends BaseModel {
  /**
   * 创建新的搜索任务
   */
  async createSearchTask(taskData: CreateSearchTaskRequest): Promise<PgSearchTask> {
    const query = `
      INSERT INTO search_tasks (keyword, platforms, user_id, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [
      taskData.keyword,
      JSON.stringify(taskData.platforms),
      taskData.user_id,
      taskData.status || 'pending'
    ];
    
    const tasks = await this.query<PgSearchTask>(query, values);
    return tasks[0];
  }

  /**
   * 根据ID获取搜索任务
   */
  async getSearchTaskById(id: number): Promise<PgSearchTask | null> {
    const query = 'SELECT * FROM search_tasks WHERE id = $1';
    return this.queryOne<PgSearchTask>(query, [id]);
  }

  /**
   * 根据用户ID获取搜索任务列表
   */
  async getSearchTasksByUserId(userId: number, limit = 20, offset = 0): Promise<PgSearchTask[]> {
    const query = `
      SELECT * FROM search_tasks 
      WHERE user_id = $1
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    return this.query<PgSearchTask>(query, [userId, limit, offset]);
  }

  /**
   * 根据状态获取搜索任务列表
   */
  async getSearchTasksByStatus(status: string, limit = 20, offset = 0): Promise<PgSearchTask[]> {
    const query = `
      SELECT * FROM search_tasks 
      WHERE status = $1
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    return this.query<PgSearchTask>(query, [status, limit, offset]);
  }

  /**
   * 更新搜索任务
   */
  async updateSearchTask(id: number, taskData: UpdateSearchTaskRequest): Promise<PgSearchTask | null> {
    // 构建动态更新查询
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (taskData.keyword !== undefined) {
      updates.push(`keyword = $${paramIndex++}`);
      values.push(taskData.keyword);
    }
    
    if (taskData.platforms !== undefined) {
      updates.push(`platforms = $${paramIndex++}`);
      values.push(JSON.stringify(taskData.platforms));
    }
    
    if (taskData.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(taskData.status);
    }
    
    if (updates.length === 0) {
      return this.getSearchTaskById(id);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `
      UPDATE search_tasks 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const tasks = await this.query<PgSearchTask>(query, values);
    return tasks.length > 0 ? tasks[0] : null;
  }

  /**
   * 删除搜索任务
   */
  async deleteSearchTask(id: number): Promise<boolean> {
    const query = 'DELETE FROM search_tasks WHERE id = $1';
    const result = await this.query(query, [id]);
    return result.length > 0;
  }

  /**
   * 获取所有搜索任务
   */
  async getAllSearchTasks(limit = 50, offset = 0): Promise<PgSearchTask[]> {
    const query = `
      SELECT * FROM search_tasks 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    return this.query<PgSearchTask>(query, [limit, offset]);
  }

  /**
   * 获取搜索任务总数
   */
  async getSearchTaskCount(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM search_tasks';
    const result = await this.queryOne<{count: string}>(query);
    return result ? parseInt(result.count) : 0;
  }

  /**
   * 获取用户的搜索任务总数
   */
  async getUserSearchTaskCount(userId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM search_tasks WHERE user_id = $1';
    const result = await this.queryOne<{count: string}>(query, [userId]);
    return result ? parseInt(result.count) : 0;
  }

  /**
   * 获取待处理的搜索任务
   */
  async getPendingTasks(limit = 10): Promise<PgSearchTask[]> {
    const query = `
      SELECT * FROM search_tasks 
      WHERE status = 'pending'
      ORDER BY created_at ASC 
      LIMIT $1
    `;
    return this.query<PgSearchTask>(query, [limit]);
  }
}

// 延迟初始化模型实例
export let pgSearchTaskModel: PgSearchTaskModel;

export function initPgSearchTaskModel(): PgSearchTaskModel {
  if (!pgSearchTaskModel) {
    pgSearchTaskModel = new PgSearchTaskModel();
  }
  return pgSearchTaskModel;
}