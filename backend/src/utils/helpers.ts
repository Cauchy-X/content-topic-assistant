import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

// 验证请求结果中间件
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: '输入验证失败',
      details: errors.array()
    });
    return;
  }
  next();
};

// 异步错误处理包装器
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};