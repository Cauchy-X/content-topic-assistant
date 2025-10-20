import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import * as analysisController from '../controllers/analysis.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// 分析内容
router.post('/analyze', authenticate, [
  body('searchId').notEmpty().withMessage('搜索ID不能为空'),
  body('contentItems').isArray({ min: 1 }).withMessage('内容项不能为空')
], analysisController.analyzeContent);

// 生成选题建议 - 移除认证中间件，添加爬虫参数支持
router.post('/suggestions', [
  body('keywords').isArray({ min: 1 }).withMessage('关键词不能为空'),
  body('platform').isString().withMessage('平台必须是字符串'),
  body('model').optional().isIn(['deepseek', 'doubao']).withMessage('模型必须是deepseek或doubao'),
  body('count').optional().isInt({ min: 1, max: 20 }).withMessage('数量必须是1-20之间的整数'),
  body('useCrawler').optional().isBoolean().withMessage('useCrawler必须是布尔值')
], (req: Request, res: Response, next: NextFunction) => {
  console.log('=== ROUTE DEBUG: 请求到达路由处理函数 ===');
  console.log('req.body:', req.body);
  console.log('=== ROUTE DEBUG: 结束 ===');
  next();
}, analysisController.generateTopicSuggestions);

// 获取分析历史
router.get('/history', authenticate, analysisController.getAnalysisHistory);

// 获取分析结果
router.get('/result/:analysisId', authenticate, analysisController.getAnalysisResult);

export default router;