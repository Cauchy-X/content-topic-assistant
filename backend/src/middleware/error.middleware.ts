import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let { statusCode = 500, message } = error;

  // 记录错误日志
  logger.error(`${req.method} ${req.path} - ${statusCode} - ${message}`, {
    error: error.stack,
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip
  });

  // Mongoose错误处理
  if (error.name === 'CastError') {
    statusCode = 400;
    message = '资源未找到';
  }

  // Mongoose验证错误
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values((error as any).errors).map((val: any) => val.message).join(', ');
  }

  // Mongoose重复键错误
  if (typeof error.code === 'number' && error.code === 11000) {
    statusCode = 400;
    message = '资源已存在';
  }

  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的令牌';
  }

  // JWT过期错误
  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '令牌已过期';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};