import { Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';

// 用户注册验证
export const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含至少一个小写字母、一个大写字母和一个数字'),
];

// 用户登录验证
export const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('密码不能为空'),
];

// 用户更新验证
export const validateUserUpdate = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
];

// 搜索内容验证
export const validateSearchContent = [
  body('keyword')
    .notEmpty()
    .withMessage('搜索关键词不能为空')
    .isLength({ max: 100 })
    .withMessage('搜索关键词长度不能超过100个字符'),
  
  body('platforms')
    .isArray({ min: 1 })
    .withMessage('请至少选择一个平台')
    .custom((platforms) => {
      const validPlatforms = ['weibo', 'douyin', 'xiaohongshu', 'zhihu', 'web'];
      const isValid = platforms.every((platform: string) => validPlatforms.includes(platform));
      if (!isValid) {
        throw new Error('无效的平台选择');
      }
      return true;
    }),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('搜索结果数量限制必须在1-100之间'),
];

// 搜索历史验证
export const validateSearchHistory = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
];

// 搜索结果验证
export const validateSearchResult = [
  param('searchId')
    .isMongoId()
    .withMessage('无效的搜索ID'),
];

// 分析内容验证
export const validateAnalyzeContent = [
  body('searchId')
    .isMongoId()
    .withMessage('无效的搜索ID'),
  
  body('contentItems')
    .isArray({ min: 1 })
    .withMessage('请至少提供一个内容项'),
];

// 分析历史验证
export const validateAnalysisHistory = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
];

// 分析结果验证
export const validateAnalysisResult = [
  param('analysisId')
    .isMongoId()
    .withMessage('无效的分析ID'),
];