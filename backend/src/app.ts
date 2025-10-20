import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import path from 'path';

// 导入数据库连接
import { connectAllDatabases, disconnectAllDatabases } from './config/database';

// 导入路由
import authRoutes from './routes/auth.routes';
import searchRoutes from './routes/search.routes';
import analysisRoutes from './routes/analysis.routes';

// 导入中间件
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { testEnvVariables } from './utils/test-env';

// 加载环境变量
dotenv.config();

// 测试环境变量
testEnvVariables();

// 创建日志记录器
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log') 
    })
  ]
});

// 开发环境下添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 5001;

// 中间件配置
app.use(helmet()); // 安全头
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://192.168.1.7:3000', 'http://192.168.1.7:3002'],
  credentials: true
})); // 跨域
app.use(express.json({ limit: '10mb' })); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析

// 添加字符编码处理中间件
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    req.setEncoding('utf8');
  }
  next();
});

// 请求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  }
});
app.use('/api/', limiter);

// 请求日志
app.use((req, res, next): void => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analysis', analysisRoutes);

// 添加全局请求调试中间件
app.use('/api/analysis/suggestions', (req, res, next) => {
  console.log('=== APP DEBUG: 请求到达应用级中间件 ===');
  console.log('req.method:', req.method);
  console.log('req.url:', req.url);
  console.log('req.body:', req.body);
  console.log('=== APP DEBUG: 结束 ===');
  next();
});

// 健康检查
app.get('/health', (req, res): void => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 错误处理中间件
app.use(notFoundHandler);
app.use(errorHandler);

// 启动服务器
async function startServer(): Promise<void> {
  try {
    // 连接所有数据库
    await connectAllDatabases();
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      logger.info(`服务器运行在端口 ${PORT}`);
    });
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('收到SIGTERM信号, 正在关闭服务器...');
  try {
    await disconnectAllDatabases();
    logger.info('所有数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    logger.error('关闭数据库连接时出错:', error);
    process.exit(1);
  }
});

export default app;