import { BaseModel } from './base.model';

export interface PgUser {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  subscription_plan: 'free' | 'basic' | 'premium';
  subscription_expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
  subscription_plan?: 'free' | 'basic' | 'premium';
  subscription_expires_at?: Date;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: 'user' | 'admin';
  subscription_plan?: 'free' | 'basic' | 'premium';
  subscription_expires_at?: Date;
}

export class PgUserModel extends BaseModel {
  /**
   * 创建新用户
   */
  async createUser(userData: CreateUserRequest): Promise<PgUser> {
    const bcrypt = require('bcryptjs');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);
    
    const query = `
      INSERT INTO users (username, email, password_hash, role, subscription_plan, subscription_expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      userData.username,
      userData.email,
      passwordHash,
      userData.role || 'user',
      userData.subscription_plan || 'free',
      userData.subscription_expires_at || null
    ];
    
    const users = await this.query<PgUser>(query, values);
    return users[0];
  }

  /**
   * 根据ID获取用户
   */
  async getUserById(id: number): Promise<PgUser | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    return this.queryOne<PgUser>(query, [id]);
  }

  /**
   * 根据用户名获取用户
   */
  async getUserByUsername(username: string): Promise<PgUser | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    return this.queryOne<PgUser>(query, [username]);
  }

  /**
   * 根据邮箱获取用户
   */
  async getUserByEmail(email: string): Promise<PgUser | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    return this.queryOne<PgUser>(query, [email]);
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: number, userData: UpdateUserRequest): Promise<PgUser | null> {
    const bcrypt = require('bcryptjs');
    
    // 构建动态更新查询
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (userData.username !== undefined) {
      updates.push(`username = $${paramIndex++}`);
      values.push(userData.username);
    }
    
    if (userData.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(userData.email);
    }
    
    if (userData.password !== undefined) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(passwordHash);
    }
    
    if (userData.role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(userData.role);
    }
    
    if (userData.subscription_plan !== undefined) {
      updates.push(`subscription_plan = $${paramIndex++}`);
      values.push(userData.subscription_plan);
    }
    
    if (userData.subscription_expires_at !== undefined) {
      updates.push(`subscription_expires_at = $${paramIndex++}`);
      values.push(userData.subscription_expires_at);
    }
    
    if (updates.length === 0) {
      return this.getUserById(id);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const users = await this.query<PgUser>(query, values);
    return users.length > 0 ? users[0] : null;
  }

  /**
   * 删除用户
   */
  async deleteUser(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await this.query(query, [id]);
    return result.length > 0;
  }

  /**
   * 验证用户密码
   */
  async validatePassword(user: PgUser, password: string): Promise<boolean> {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(password, user.password_hash);
  }

  /**
   * 获取所有用户
   */
  async getAllUsers(limit = 50, offset = 0): Promise<PgUser[]> {
    const query = `
      SELECT * FROM users 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    return this.query<PgUser>(query, [limit, offset]);
  }

  /**
   * 获取用户总数
   */
  async getUserCount(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM users';
    const result = await this.queryOne<{count: string}>(query);
    return result ? parseInt(result.count) : 0;
  }
}

// 延迟初始化模型实例
export let pgUserModel: PgUserModel;

export function initPgUserModel(): PgUserModel {
  if (!pgUserModel) {
    pgUserModel = new PgUserModel();
  }
  return pgUserModel;
}