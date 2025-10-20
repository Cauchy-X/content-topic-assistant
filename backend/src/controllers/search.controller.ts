import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';
import { Search } from '../models/search.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { universalCrawler } from '../services/universal-crawler.service';

// 创建搜索服务实例
const searchService = new SearchService();

/**
 * 通用搜索函数，处理搜索逻辑
 */
async function performSearch(req: Request, res: Response, isAuthenticated: boolean = true) {
  try {
    const { keyword, platforms, page = 1, limit = 10 } = req.body;

    // 验证必需参数
    if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空'
      });
    }

    // 验证分页参数
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: '页码必须是大于0的整数'
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: '每页数量必须是1-100之间的整数'
      });
    }

    // 验证平台参数
    if (platforms && (!Array.isArray(platforms) || platforms.length === 0)) {
      return res.status(400).json({
        success: false,
        message: '平台参数必须是非空数组'
      });
    }

    logger.info(`开始搜索: 关键词="${keyword}", 平台=${platforms || '全部'}, 页码=${pageNum}, 每页=${limitNum}`);

    // 调用搜索服务
    const searchResults = await searchService.searchContent(
      keyword.trim(),
      platforms,
      pageNum,
      limitNum
    );

    // 格式化响应数据
    const formattedResults = formatSearchResults(searchResults, pageNum, limitNum);

    logger.info(`搜索完成: 关键词="${keyword}", 找到${formattedResults.pagination.total}条结果`);

    return res.status(200).json({
      success: true,
      data: formattedResults,
      message: '搜索成功'
    });
  } catch (error: any) {
    logger.error(`搜索失败: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      success: false,
      message: '服务器内部错误，请稍后再试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * 格式化搜索结果
 */
function formatSearchResults(searchResults: any, page: number, limit: number) {
  // 确保results是数组
  const results = Array.isArray(searchResults.results) ? searchResults.results : [];
  
  // 计算真实的总数，而不是硬编码
  const total = searchResults.total || results.length;
  
  // 计算分页信息
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // 返回与前端期望格式匹配的数据结构
  return {
    topics: results,  // 将results改为topics，与前端期望匹配
    total: total,
    hasMore: hasNext,  // 使用hasNext作为hasMore
    // 保留原有分页信息，以防其他地方需要
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev
    },
    sources: searchResults.sources || [],
    searchTime: searchResults.searchTime || 0
  };
}

/**
 * 无需认证的搜索接口（测试用）
 */
export const searchContentWithoutAuth = async (req: Request, res: Response) => {
  return performSearch(req, res, false);
};

/**
 * 搜索接口 - 移除认证要求
 */
export const searchContent = async (req: Request, res: Response) => {
  return performSearch(req, res, false);
};

/**
 * 获取搜索历史 - 移除认证要求
 */
export const getSearchHistory = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // 验证分页参数
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: '页码必须是大于0的整数'
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: '每页数量必须是1-100之间的整数'
      });
    }

    // 由于移除了认证，返回空的搜索历史
    return res.status(200).json({
      success: true,
      data: {
        history: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          totalPages: 0
        }
      },
      message: '获取搜索历史成功'
    });
  } catch (error: any) {
    logger.error(`获取搜索历史失败: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      success: false,
      message: '服务器内部错误，请稍后再试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 获取搜索结果详情 - 移除认证要求
 */
export const getSearchResults = async (req: Request, res: Response) => {
  try {
    const { searchId } = req.params;

    if (!searchId) {
      return res.status(400).json({
        success: false,
        message: '搜索ID不能为空'
      });
    }

    // 由于移除了认证，返回一个通用的错误消息
    return res.status(404).json({
      success: false,
      message: '搜索结果不存在或需要认证'
    });
  } catch (error: any) {
    logger.error(`获取搜索结果失败: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      success: false,
      message: '服务器内部错误，请稍后再试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 删除搜索历史
 */
export const deleteSearch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    const { searchId } = req.params;

    if (!searchId) {
      return res.status(400).json({
        success: false,
        message: '搜索ID不能为空'
      });
    }

    const result = await Search.deleteOne({
      _id: searchId,
      userId: req.user.id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: '搜索记录不存在'
      });
    }

    return res.status(200).json({
      success: true,
      message: '删除搜索记录成功'
    });
  } catch (error: any) {
    logger.error(`删除搜索记录失败: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      success: false,
      message: '服务器内部错误，请稍后再试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 爬取单个URL - 移除认证要求
 */
export const crawlUrl = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'URL不能为空且必须是字符串'
      });
    }

    // 简单的URL格式验证
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'URL格式不正确'
      });
    }

    logger.info(`开始爬取URL: ${url}`);

    // 调用爬取服务
    const crawlResult = await searchService.crawlUrl(url);

    logger.info(`URL爬取完成: ${url}, 成功=${crawlResult.success}`);

    return res.status(200).json({
      success: true,
      data: crawlResult,
      message: 'URL爬取成功'
    });
  } catch (error: any) {
    logger.error(`URL爬取失败: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      success: false,
      message: '服务器内部错误，请稍后再试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 批量爬取URL - 移除认证要求
 */
export const batchCrawl = async (req: Request, res: Response) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'URL列表不能为空且必须是数组'
      });
    }

    // 验证每个URL格式
    for (const url of urls) {
      if (typeof url !== 'string') {
        return res.status(400).json({
          success: false,
          message: '所有URL都必须是字符串'
        });
      }

      try {
        new URL(url);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: `URL格式不正确: ${url}`
        });
      }
    }

    // 限制批量爬取数量
    if (urls.length > 10) {
      return res.status(400).json({
        success: false,
        message: '批量爬取URL数量不能超过10个'
      });
    }

    logger.info(`开始批量爬取URL: ${urls.length}个`);

    // 调用批量爬取服务
    const crawlResults = await searchService.batchCrawl(urls);

    const successCount = crawlResults.filter(r => r.success).length;
    logger.info(`批量URL爬取完成: 成功${successCount}/${urls.length}个`);

    return res.status(200).json({
      success: true,
      data: crawlResults,
      message: `批量爬取完成，成功${successCount}/${urls.length}个`
    });
  } catch (error: any) {
    logger.error(`批量URL爬取失败: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      success: false,
      message: '服务器内部错误，请稍后再试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 直接测试universalCrawler（无需认证）
 */
export const testDirectCrawler = async (req: Request, res: Response) => {
  try {
    const { keyword, options = {} } = req.body;

    // 验证必需参数
    if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空'
      });
    }

    // 设置默认选项
    const defaultOptions = {
      maxResults: 3,
      engines: ['bing'], // 默认只使用Bing
      crawlResults: false, // 默认不爬取内容
      timeout: 20000 // 默认20秒超时
    };

    const searchOptions = { ...defaultOptions, ...options };

    logger.info(`开始直接测试爬虫: 关键词="${keyword}", 选项=${JSON.stringify(searchOptions)}`);

    const startTime = Date.now();

    // 直接调用universalCrawler
    const results = await universalCrawler.searchWeb(keyword, searchOptions);

    const endTime = Date.now();
    const duration = endTime - startTime;

    logger.info(`直接爬虫测试完成: 关键词="${keyword}", 耗时=${duration}ms, 结果数=${results.length}`);

    return res.status(200).json({
      success: true,
      data: {
        query: keyword,
        results,
        total: results.length,
        searchTime: duration,
        options: searchOptions
      },
      message: '直接爬虫测试成功'
    });
  } catch (error: any) {
    logger.error(`直接爬虫测试失败: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      success: false,
      message: '服务器内部错误，请稍后再试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};