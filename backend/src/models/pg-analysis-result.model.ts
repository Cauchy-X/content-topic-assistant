import { BaseModel } from './base.model';

export interface PgAnalysisResult {
  id: number;
  search_task_id: number;
  user_id: number;
  topic_directions: string[];
  user_concerns: string[];
  sentiment_analysis: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topic_suggestions: {
    title: string;
    angle: string;
    reason: string;
    content_outline: string[];
  }[];
  created_at: Date;
  updated_at: Date;
}

export interface CreateAnalysisResultRequest {
  search_task_id: number;
  user_id: number;
  topic_directions: string[];
  user_concerns: string[];
  sentiment_analysis: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topic_suggestions: {
    title: string;
    angle: string;
    reason: string;
    content_outline: string[];
  }[];
}

export interface UpdateAnalysisResultRequest {
  topic_directions?: string[];
  user_concerns?: string[];
  sentiment_analysis?: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topic_suggestions?: {
    title: string;
    angle: string;
    reason: string;
    content_outline: string[];
  }[];
}

export class PgAnalysisResultModel extends BaseModel {
  /**
   * 创建新的分析结果
   */
  async createAnalysisResult(resultData: CreateAnalysisResultRequest): Promise<PgAnalysisResult> {
    const query = `
      INSERT INTO analysis_results (
        search_task_id, user_id, topic_directions, user_concerns, 
        sentiment_analysis, topic_suggestions
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      resultData.search_task_id,
      resultData.user_id,
      JSON.stringify(resultData.topic_directions),
      JSON.stringify(resultData.user_concerns),
      JSON.stringify(resultData.sentiment_analysis),
      JSON.stringify(resultData.topic_suggestions)
    ];
    
    const results = await this.query<PgAnalysisResult>(query, values);
    return results[0];
  }

  /**
   * 根据ID获取分析结果
   */
  async getAnalysisResultById(id: number): Promise<PgAnalysisResult | null> {
    const query = 'SELECT * FROM analysis_results WHERE id = $1';
    return this.queryOne<PgAnalysisResult>(query, [id]);
  }

  /**
   * 根据搜索任务ID获取分析结果
   */
  async getAnalysisResultBySearchTaskId(searchTaskId: number): Promise<PgAnalysisResult | null> {
    const query = 'SELECT * FROM analysis_results WHERE search_task_id = $1';
    return this.queryOne<PgAnalysisResult>(query, [searchTaskId]);
  }

  /**
   * 根据用户ID获取分析结果列表
   */
  async getAnalysisResultsByUserId(userId: number, limit = 20, offset = 0): Promise<PgAnalysisResult[]> {
    const query = `
      SELECT * FROM analysis_results 
      WHERE user_id = $1
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    return this.query<PgAnalysisResult>(query, [userId, limit, offset]);
  }

  /**
   * 更新分析结果
   */
  async updateAnalysisResult(id: number, resultData: UpdateAnalysisResultRequest): Promise<PgAnalysisResult | null> {
    // 构建动态更新查询
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (resultData.topic_directions !== undefined) {
      updates.push(`topic_directions = $${paramIndex++}`);
      values.push(JSON.stringify(resultData.topic_directions));
    }
    
    if (resultData.user_concerns !== undefined) {
      updates.push(`user_concerns = $${paramIndex++}`);
      values.push(JSON.stringify(resultData.user_concerns));
    }
    
    if (resultData.sentiment_analysis !== undefined) {
      updates.push(`sentiment_analysis = $${paramIndex++}`);
      values.push(JSON.stringify(resultData.sentiment_analysis));
    }
    
    if (resultData.topic_suggestions !== undefined) {
      updates.push(`topic_suggestions = $${paramIndex++}`);
      values.push(JSON.stringify(resultData.topic_suggestions));
    }
    
    if (updates.length === 0) {
      return this.getAnalysisResultById(id);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `
      UPDATE analysis_results 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const results = await this.query<PgAnalysisResult>(query, values);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 删除分析结果
   */
  async deleteAnalysisResult(id: number): Promise<boolean> {
    const query = 'DELETE FROM analysis_results WHERE id = $1';
    const result = await this.query(query, [id]);
    return result.length > 0;
  }

  /**
   * 获取所有分析结果
   */
  async getAllAnalysisResults(limit = 50, offset = 0): Promise<PgAnalysisResult[]> {
    const query = `
      SELECT * FROM analysis_results 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    return this.query<PgAnalysisResult>(query, [limit, offset]);
  }

  /**
   * 获取分析结果总数
   */
  async getAnalysisResultCount(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM analysis_results';
    const result = await this.queryOne<{count: string}>(query);
    return result ? parseInt(result.count) : 0;
  }

  /**
   * 获取用户的分析结果总数
   */
  async getUserAnalysisResultCount(userId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM analysis_results WHERE user_id = $1';
    const result = await this.queryOne<{count: string}>(query, [userId]);
    return result ? parseInt(result.count) : 0;
  }

  /**
   * 获取最近的分析结果
   */
  async getRecentAnalysisResults(days = 7, limit = 20): Promise<PgAnalysisResult[]> {
    const query = `
      SELECT * FROM analysis_results 
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      ORDER BY created_at DESC 
      LIMIT $1
    `;
    return this.query<PgAnalysisResult>(query, [limit]);
  }

  /**
   * 获取热门话题方向
   */
  async getPopularTopicDirections(limit = 10): Promise<{direction: string, count: number}[]> {
    const query = `
      SELECT jsonb_array_elements_text(topic_directions) as direction, COUNT(*) as count
      FROM analysis_results
      GROUP BY direction
      ORDER BY count DESC
      LIMIT $1
    `;
    return this.query<{direction: string, count: number}>(query, [limit]);
  }

  /**
   * 获取常见用户关注点
   */
  async getCommonUserConcerns(limit = 10): Promise<{concern: string, count: number}[]> {
    const query = `
      SELECT jsonb_array_elements_text(user_concerns) as concern, COUNT(*) as count
      FROM analysis_results
      GROUP BY concern
      ORDER BY count DESC
      LIMIT $1
    `;
    return this.query<{concern: string, count: number}>(query, [limit]);
  }
}

// 延迟初始化模型实例
export let pgAnalysisResultModel: PgAnalysisResultModel;

export function initPgAnalysisResultModel(): PgAnalysisResultModel {
  if (!pgAnalysisResultModel) {
    pgAnalysisResultModel = new PgAnalysisResultModel();
  }
  return pgAnalysisResultModel;
}