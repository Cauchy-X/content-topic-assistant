import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { logger } from '../utils/logger';

// 生成JWT令牌
export const generateToken = (userId: string, expiresIn: string = '7d'): string => {
  try {
    const payload = { id: userId }; // 使用 'id' 而不是 'userId' 以保持兼容性
    const secret = process.env.JWT_SECRET || 'default_secret';
    // 使用类型断言解决 TypeScript 类型问题
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('生成令牌失败:', errorMessage);
    throw error;
  }
};

// 验证JWT令牌
export const verifyToken = (token: string): any => {
  const secret = process.env.JWT_SECRET || 'default_secret';
  
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    logger.error('JWT验证失败:', error);
    throw new Error('无效的令牌');
  }
};

// 通过令牌获取用户信息
export const getUserByToken = async (token: string): Promise<any> => {
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password'); // 使用 decoded.id 而不是 decoded.userId
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    return user;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('通过令牌获取用户信息失败:', errorMessage);
    throw error;
  }
};