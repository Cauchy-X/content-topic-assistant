import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { User } from '../models/user.model';
import { logger } from '../utils/logger';
import { generateToken } from '../services/auth.service';

interface AuthRequest extends Request {
  user?: any;
}

// 用户注册
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: '输入验证失败',
        details: errors.array()
      });
      return;
    }

    const { username, email, password } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: '用户名或邮箱已存在'
      });
      return;
    }

    // 创建新用户
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // 生成JWT令牌
    const token = generateToken(user._id);

    logger.info(`新用户注册: ${user.email}`);

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          subscription: user.subscription
        }
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('用户注册失败:', errorMessage);
    next(error);
  }
};

// 用户登录
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: '输入验证失败',
        details: errors.array()
      });
      return;
    }

    const { username, email, password } = req.body;
    const loginIdentifier = username || email; // 使用username或email作为登录标识符

    // 查找用户
    const user = await User.findOne({
      $or: [{ username: loginIdentifier }, { email: loginIdentifier }]
    }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
      return;
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
      return;
    }

    // 生成JWT令牌
    const token = generateToken(user._id);

    logger.info(`用户登录成功: ${loginIdentifier}`);

    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('用户登录失败:', errorMessage);
    next(error);
  }
};

// 获取用户信息
export const getUserInfo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户未找到'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('获取用户信息失败:', errorMessage);
    next(error);
  }
};

// 更新用户信息
export const updateUserInfo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: '输入验证失败',
        details: errors.array()
      });
      return;
    }

    const { username, email } = req.body;
    const userId = req.user._id;

    // 检查用户名或邮箱是否已被其他用户使用
    if (username || email) {
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : [])
        ]
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          error: '用户名或邮箱已被使用'
        });
        return;
      }
    }

    // 更新用户信息
    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: '用户未找到'
      });
      return;
    }

    logger.info(`用户信息更新: ${updatedUser.email}`);

    res.status(200).json({
      success: true,
      message: '用户信息更新成功',
      data: {
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          createdAt: updatedUser.createdAt
        }
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('更新用户信息失败:', errorMessage);
    next(error);
  }
};