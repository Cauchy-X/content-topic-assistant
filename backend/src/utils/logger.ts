import * as winston from 'winston';
import * as path from 'path';

const logDir = 'logs';

// 创建日志记录器
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'content-topic-assistant-backend' },
  transports: [
    // 错误日志
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),
    // 所有日志
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log')
    })
  ]
});

// 开发环境下添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        // 如果有元数据，添加到消息中
        if (Object.keys(meta).length > 0) {
          // 使用JSON.stringify确保中文字符正确显示
          msg += ` ${JSON.stringify(meta, null, 2)}`;
        }
        return msg;
      })
    )
  }));
}

export default logger;