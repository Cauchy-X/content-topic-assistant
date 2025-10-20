import { Pool, PoolClient, QueryResultRow } from 'pg';
import { getPostgresPool } from '../config/database';

export abstract class BaseModel {
  protected pool: Pool;

  constructor() {
    this.pool = getPostgresPool();
  }

  protected async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: result.rowCount });
      return result.rows;
    } catch (error) {
      console.error('Query error', { text, error });
      throw error;
    }
  }

  protected async queryOne<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows.length > 0 ? rows[0] : null;
  }

  protected async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  protected async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}