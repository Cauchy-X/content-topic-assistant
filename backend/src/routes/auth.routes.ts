import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getUserInfo, updateUserInfo } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// 用户注册
router.post('/register', [
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
    .withMessage('密码至少需要6个字符')
], register);

// 用户登录
router.post('/login', [
  body('username')
    .notEmpty()
    .withMessage('用户名或邮箱不能为空'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
], login);

// 获取用户信息
router.get('/profile', authenticate, getUserInfo);

// 更新用户信息
router.put('/profile', authenticate, [
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
    .normalizeEmail()
], updateUserInfo);

export default router;