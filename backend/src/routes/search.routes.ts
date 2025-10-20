import { Router } from 'express';
import { body, query } from 'express-validator';
import { searchContent, getSearchHistory, getSearchResults, crawlUrl, batchCrawl, testDirectCrawler } from '../controllers/search.controller';
import { authenticate } from '../middleware/auth.middleware';
import { searchContentWithoutAuth } from '../controllers/search.controller';

const router = Router();

// 测试路由 - 不需要认证，仅用于测试
router.post('/test-search', [
  body('keyword')
    .notEmpty()
    .withMessage('关键词不能为空')
    .isLength({ max: 100 })
    .withMessage('关键词不能超过100个字符'),
  body('platforms')
    .isArray({ min: 1 })
    .withMessage('至少选择一个平台')
    .custom(platforms => {
      const validPlatforms = ['zhihu', 'weibo', 'douyin', 'bilibili', 'xiaohongshu', 'web'];
      return platforms.every((platform: string) => validPlatforms.includes(platform));
    })
    .withMessage('包含无效的平台选择')
], searchContentWithoutAuth);

// 直接测试爬虫路由 - 不需要认证，仅用于测试
router.post('/test/direct-crawler', [
  body('keyword')
    .notEmpty()
    .withMessage('关键词不能为空')
    .isLength({ max: 100 })
    .withMessage('关键词不能超过100个字符')
], testDirectCrawler);

// 搜索内容 - 移除认证要求
router.post('/search', [
  body('keyword')
    .notEmpty()
    .withMessage('关键词不能为空')
    .isLength({ max: 100 })
    .withMessage('关键词不能超过100个字符'),
  body('platforms')
    .isArray({ min: 1 })
    .withMessage('至少选择一个平台')
    .custom(platforms => {
      const validPlatforms = ['zhihu', 'weibo', 'douyin', 'bilibili', 'xiaohongshu', 'web'];
      return platforms.every((platform: string) => validPlatforms.includes(platform));
    })
    .withMessage('包含无效的平台选择')
], searchContent);

// 获取搜索历史 - 移除认证要求
router.get('/history', getSearchHistory);

// 获取搜索结果 - 移除认证要求
router.get('/results/:searchId', [
  query('searchId')
    .isMongoId()
    .withMessage('无效的搜索ID')
], getSearchResults);

// 深度爬取单个URL内容 - 移除认证要求
router.post('/crawl', [
  body('url')
    .isURL()
    .withMessage('请提供有效的URL'),
  body('usePuppeteer')
    .optional()
    .isBoolean()
    .withMessage('usePuppeteer必须是布尔值')
], crawlUrl);

// 批量深度爬取多个URL内容 - 移除认证要求
router.post('/batch-crawl', [
  body('urls')
    .isArray({ min: 1, max: 10 })
    .withMessage('请提供1-10个URL的数组'),
  body('urls.*')
    .isURL()
    .withMessage('数组中包含无效的URL'),
  body('usePuppeteer')
    .optional()
    .isBoolean()
    .withMessage('usePuppeteer必须是布尔值')
], batchCrawl);

export default router;