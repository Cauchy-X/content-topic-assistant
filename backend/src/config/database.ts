import mongoose from 'mongoose';
import { Pool, PoolClient } from 'pg';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

// 连接MongoDB数据库
export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/content-topic-assistant';
    
    const options: mongoose.ConnectOptions = {
      // 连接池配置
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    await mongoose.connect(mongoURI, options);
    
    logger.info('MongoDB连接成功');
    
    // 监听连接事件
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB连接错误:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB连接断开');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB重新连接成功');
    });
    
  } catch (error) {
    logger.error('MongoDB连接失败:', error);
    process.exit(1);
  }
};

// 断开MongoDB连接
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB连接已断开');
  } catch (error) {
    logger.error('断开MongoDB连接失败:', error);
  }
};

// PostgreSQL连接池
let pgPool: Pool | null = null;

// 连接PostgreSQL数据库
export const connectPostgresDB = async (): Promise<Pool> => {
  try {
    const postgresURL = process.env.POSTGRES_URL || 'postgresql://postgres:password@localhost:5432/content-hub';
    
    pgPool = new Pool({
      connectionString: postgresURL,
      max: 10, // 最大连接数
      idleTimeoutMillis: 30000, // 空闲连接超时时间
      connectionTimeoutMillis: 2000, // 连接超时时间
    });
    
    // 测试连接
    const client = await pgPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    logger.info('PostgreSQL连接成功');
    
    // 监听连接事件
    pgPool.on('error', (error) => {
      logger.error('PostgreSQL连接池错误:', error);
    });
    
    pgPool.on('connect', () => {
      logger.info('PostgreSQL新连接已建立');
    });
    
    pgPool.on('remove', () => {
      logger.info('PostgreSQL连接已移除');
    });
    
    return pgPool;
    
  } catch (error) {
    logger.error('PostgreSQL连接失败:', error);
    throw error;
  }
};

// 获取PostgreSQL连接池
export const getPostgresPool = (): Pool => {
  if (!pgPool) {
    throw new Error('PostgreSQL连接池未初始化，请先调用connectPostgresDB()');
  }
  return pgPool;
};

// 断开PostgreSQL连接
export const disconnectPostgresDB = async (): Promise<void> => {
  try {
    if (pgPool) {
      await pgPool.end();
      pgPool = null;
      logger.info('PostgreSQL连接已断开');
    }
  } catch (error) {
    logger.error('断开PostgreSQL连接失败:', error);
  }
};

/**
 * 初始化PostgreSQL数据库
 */
export async function initPostgresDB(): Promise<void> {
  try {
    const pool = getPostgresPool();
    const client = await pool.connect();
    
    try {
      // 读取初始化SQL文件
      const initSQLPath = path.join(__dirname, 'postgres-init.sql');
      const initSQL = fs.readFileSync(initSQLPath, 'utf8');
      
      // 执行初始化SQL
      await client.query(initSQL);
      logger.info('PostgreSQL数据库初始化成功');
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('PostgreSQL数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 连接所有数据库
 */
export async function connectAllDatabases(): Promise<void> {
  await connectDB();
  await connectPostgresDB();
  
  // 初始化PostgreSQL数据库结构
  await initPostgresDB();
}

// 断开所有数据库连接
export const disconnectAllDatabases = async (): Promise<void> => {
  try {
    await Promise.all([
      disconnectDB(),
      disconnectPostgresDB()
    ]);
    logger.info('所有数据库连接已断开');
  } catch (error) {
    logger.error('断开数据库连接失败:', error);
  }
};