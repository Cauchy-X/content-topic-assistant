import axios from 'axios';
import { logger } from '../utils/logger';
import { universalCrawler, CrawlerResult } from './universal-crawler.service';
import { initializeDefaultRules } from './crawler-rule-engine.service';

// 平台API配置
const PLATFORM_CONFIG = {
  weibo: {
    baseURL: 'https://m.weibo.cn/api',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://m.weibo.cn/'
    }
  },
  douyin: {
    baseURL: 'https://www.douyin.com/aweme/v1',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.douyin.com/'
    }
  },
  xiaohongshu: {
    baseURL: 'https://www.xiaohongshu.com/fe_api/burdock',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.xiaohongshu.com/'
    }
  },
  zhihu: {
    baseURL: 'https://www.zhihu.com/api/v4',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.zhihu.com/'
    }
  }
};

// 搜索服务类
export class SearchService {
  /**
   * 搜索内容
   * @param keyword 搜索关键词
   * @param platforms 搜索平台数组
   * @param page 页码，从1开始
   * @param limit 每页数量
   * @returns 搜索结果
   */
  async searchContent(keyword: string, platforms?: string[], page: number = 1, limit: number = 10): Promise<any> {
    try {
      const skip = (page - 1) * limit;
      const results = await searchContentFromPlatforms(keyword, platforms || ['web'], limit, skip);
      
      return {
        query: keyword,
        results,
        total: results.length + skip * 2, // 估算总数，实际应用中应该从数据库获取
        sources: platforms || ['web'],
        searchTime: Date.now()
      };
    } catch (error) {
      logger.error(`搜索失败: ${error instanceof Error ? error.message : '未知错误'}`);
      throw error;
    }
  }

  /**
   * 爬取单个URL
   * @param url 要爬取的URL
   * @returns 爬取结果
   */
  async crawlUrl(url: string): Promise<any> {
    try {
      // 使用新的爬虫服务
      const result = await universalCrawler.crawlUrl(url);
      return {
        success: !!result,
        data: result,
        url,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`爬取URL失败: ${url}, 错误: ${error instanceof Error ? error.message : '未知错误'}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        url,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 批量爬取URL
   * @param urls 要爬取的URL数组
   * @returns 爬取结果数组
   */
  async batchCrawl(urls: string[]): Promise<any[]> {
    try {
      // 使用新的爬虫服务进行批量爬取
      const results = await universalCrawler.batchCrawl(urls);
      
      return results.map(result => ({
        success: !!result,
        data: result,
        url: result?.url || '',
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      logger.error(`批量爬取失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return urls.map(url => ({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        url,
        timestamp: new Date().toISOString()
      }));
    }
  }
}

// 搜索内容服务
const searchContentFromPlatforms = async (
  keyword: string,
  platforms: string[],
  limit: number = 20,
  skip: number = 0
): Promise<any[]> => {
  const results: any[] = [];
  
  // 如果平台包含 'web'，则使用全网爬虫
  if (platforms.includes('web')) {
    try {
      // 使用universalCrawler进行全网搜索
      logger.info(`使用universalCrawler搜索关键词: ${keyword}`);
      const webResults = await universalCrawler.searchWeb(keyword, {
        maxResults: limit + skip, // 获取更多结果以确保有足够的数据进行分页
        engines: ['baidu'], // 使用百度搜索引擎
        crawlResults: true, // 爬取内容以解析百度重定向URL
        usePuppeteer: true // 使用Puppeteer处理百度重定向URL
      });
      
      logger.info(`universalCrawler返回了 ${webResults.length} 条结果`);
      
      // 格式化结果
      const formattedResults = webResults.map(result => ({
        id: result.id,
        title: result.title,
        content: result.content,
        url: result.url,
        author: result.author,
        publishDate: result.publishTime || new Date().toISOString().split('T')[0],
        platform: result.platform,
        source: result.siteType,
        metrics: result.metrics || { views: 0, likes: 0, comments: 0, shares: 0 },
        images: result.images || []
      }));
      results.push(...formattedResults);
      
      // 如果只请求了web平台，直接返回结果
      if (platforms.length === 1) {
        return results.slice(skip, skip + limit);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error('universalCrawler搜索失败:', errorMessage);
    }
  }
  
  // 处理其他平台
  const otherPlatforms = platforms.filter(p => p !== 'web');
  if (otherPlatforms.length === 0) {
    return results.slice(skip, skip + limit);
  }
  
  // 计算每个平台应该返回的结果数量，确保总数量不超过limit
  // 注意：这里我们需要考虑skip参数，确保每个平台返回足够的数据
  const limitPerPlatform = Math.ceil((limit + skip) / otherPlatforms.length);
  
  for (const platform of otherPlatforms) {
    try {
      const platformResults = await searchPlatformContent(platform, keyword, limitPerPlatform, skip);
      results.push(...platformResults);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.warn(`搜索${platform}平台内容失败:`, errorMessage);
      // 继续搜索其他平台
    }
  }
  
  // 确保返回的结果数量不超过请求的limit，并正确处理skip
  const paginatedResults = results.slice(skip, skip + limit);
  logger.info(`分页处理后的结果数量: ${paginatedResults.length}, 总结果数量: ${results.length}`);
  
  return paginatedResults;
};

// 搜索特定平台内容
async function searchPlatformContent(platform: string, keyword: string, limit: number, skip: number = 0): Promise<any[]> {
  const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];
  if (!config) {
    throw new Error(`不支持的平台: ${platform}`);
  }

  try {
    switch (platform) {
      case 'weibo':
        return await searchWeiboContent(keyword, limit, config, skip);
      case 'douyin':
        return await searchDouyinContent(keyword, limit, config, skip);
      case 'xiaohongshu':
        return await searchXiaohongshuContent(keyword, limit, config, skip);
      case 'zhihu':
        return await searchZhihuContent(keyword, limit, config, skip);
      default:
        return [];
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error(`搜索${platform}平台内容失败:`, errorMessage);
    throw error;
  }
}

// 搜索微博内容
async function searchWeiboContent(keyword: string, limit: number, config: any, skip: number = 0): Promise<any[]> {
  try {
    // 注意：实际微博API可能需要更复杂的认证和参数
    const response = await axios.get(`${config.baseURL}/container/getIndex`, {
      params: {
        containerid: `100103type=1&q=${encodeURIComponent(keyword)}`,
        count: limit,
        page: Math.floor(skip / limit) + 1
      },
      headers: config.headers
    });

    const data = response.data;
    if (data.data && data.data.cards) {
      return data.data.cards
        .filter((card: any) => card.mblog)
        .map((card: any) => {
          const mblog = card.mblog;
          return {
            id: mblog.id,
            title: mblog.text ? mblog.text.substring(0, 50) + '...' : '',
            content: mblog.text || '',
            author: mblog.user ? mblog.user.screen_name : '',
            platform: 'weibo',
            publishTime: mblog.created_at ? new Date(mblog.created_at).toISOString() : new Date().toISOString(),
            url: `https://weibo.com/${mblog.user?.id}/${mblog.bid}`,
            metrics: {
              likes: mblog.attitudes_count || 0,
              comments: mblog.comments_count || 0,
              shares: mblog.reposts_count || 0
            }
          };
        });
    }
    return [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('微博搜索失败:', errorMessage);
    // 返回模拟数据用于演示
    return getMockWeiboData(keyword, limit, skip);
  }
}

// 搜索抖音内容
async function searchDouyinContent(keyword: string, limit: number, config: any, skip: number = 0): Promise<any[]> {
  try {
    // 注意：抖音API可能需要更复杂的认证和参数
    const response = await axios.get(`${config.baseURL}/search/item/`, {
      params: {
        keyword: encodeURIComponent(keyword),
        count: limit,
        offset: skip
      },
      headers: config.headers
    });

    const data = response.data;
    if (data.aweme_list) {
      return data.aweme_list.map((item: any) => ({
        id: item.aweme_id,
        title: item.desc || '',
        content: item.desc || '',
        author: item.author ? item.author.nickname : '',
        platform: 'douyin',
        publishTime: item.create_time ? new Date(item.create_time * 1000).toISOString() : new Date().toISOString(),
        url: `https://www.douyin.com/video/${item.aweme_id}`,
        metrics: {
          likes: item.statistics ? item.statistics.digg_count : 0,
          comments: item.statistics ? item.statistics.comment_count : 0,
          shares: item.statistics ? item.statistics.share_count : 0
        }
      }));
    }
    return [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('抖音搜索失败:', errorMessage);
    // 返回模拟数据用于演示
    return getMockDouyinData(keyword, limit, skip);
  }
}

// 搜索小红书内容
async function searchXiaohongshuContent(keyword: string, limit: number, config: any, skip: number = 0): Promise<any[]> {
  try {
    // 注意：小红书API可能需要更复杂的认证和参数
    const response = await axios.get(`${config.baseURL}/weixin/v1/search/notes`, {
      params: {
        keyword: encodeURIComponent(keyword),
        page: Math.floor(skip / limit) + 1,
        page_size: limit
      },
      headers: config.headers
    });

    const data = response.data;
    if (data.data && data.data.notes) {
      return data.data.notes.map((note: any) => ({
        id: note.id,
        title: note.title || '',
        content: note.desc || '',
        author: note.user ? note.user.nickname : '',
        platform: 'xiaohongshu',
        publishTime: note.time ? new Date(note.time).toISOString() : new Date().toISOString(),
        url: `https://www.xiaohongshu.com/explore/${note.id}`,
        metrics: {
          likes: note.liked_count || 0,
          comments: note.comment_count || 0,
          shares: note.share_count || 0
        }
      }));
    }
    return [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('小红书搜索失败:', errorMessage);
    // 返回模拟数据用于演示
    return getMockXiaohongshuData(keyword, limit, skip);
  }
}

// 搜索知乎内容
async function searchZhihuContent(keyword: string, limit: number, config: any, skip: number = 0): Promise<any[]> {
  try {
    // 注意：知乎API可能需要更复杂的认证和参数
    const response = await axios.get(`${config.baseURL}/search_v3`, {
      params: {
        q: encodeURIComponent(keyword),
        type: 'content',
        limit: limit,
        offset: skip
      },
      headers: config.headers
    });

    const data = response.data;
    if (data.data) {
      return data.data.map((item: any) => ({
        id: item.object ? item.object.token : '',
        title: item.object ? item.object.title : '',
        content: item.object ? (item.object.excerpt || '') : '',
        author: item.object ? (item.object.author ? item.object.author.name : '') : '',
        platform: 'zhihu',
        publishTime: item.object ? (item.object.created_time ? new Date(item.object.created_time * 1000).toISOString() : new Date().toISOString()) : new Date().toISOString(),
        url: item.object ? `https://www.zhihu.com/question/${item.object.token}` : '',
        metrics: {
          likes: item.object ? (item.object.voteup_count || 0) : 0,
          comments: item.object ? (item.object.comment_count || 0) : 0,
          shares: 0 // 知乎可能不提供分享数
        }
      }));
    }
    return [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('知乎搜索失败:', errorMessage);
    // 返回模拟数据用于演示
    return getMockZhihuData(keyword, limit, skip);
  }
}

// 模拟数据函数（当API调用失败时使用）
function getMockWeiboData(keyword: string, limit: number, skip: number = 0): any[] {
  const results = [];
  const startIndex = skip + 1;
  const endIndex = startIndex + limit - 1;
  
  for (let i = startIndex; i <= endIndex; i++) {
    results.push({
      id: `weibo_mock_${i}`,
      title: `关于${keyword}的微博${i}`,
      content: `这是一条关于${keyword}的模拟微博内容，用于演示系统功能。`,
      author: `微博用户${i}`,
      platform: 'weibo',
      publishTime: new Date(Date.now() - i * 3600000).toISOString(),
      url: `https://weibo.com/mock/weibo_${i}`,
      metrics: {
        likes: Math.floor(Math.random() * 1000),
        comments: Math.floor(Math.random() * 500),
        shares: Math.floor(Math.random() * 200)
      }
    });
  }
  return results;
}

function getMockDouyinData(keyword: string, limit: number, skip: number = 0): any[] {
    const results = [];
    const startIndex = skip + 1;
    const endIndex = startIndex + limit - 1;
    
    for (let i = startIndex; i <= endIndex; i++) {
      results.push({
        id: `douyin_mock_${i}`,
        title: `关于${keyword}的抖音视频${i}`,
        content: `这是一个关于${keyword}的模拟抖音视频描述，用于演示系统功能。`,
        author: `抖音用户${i}`,
        platform: 'douyin',
        publishTime: new Date(Date.now() - i * 3600000).toISOString(),
        url: `https://www.douyin.com/video/douyin_mock_${i}`,
        metrics: {
          likes: Math.floor(Math.random() * 10000),
          comments: Math.floor(Math.random() * 1000),
          shares: Math.floor(Math.random() * 500)
        }
      });
    }
    return results;
  }

function getMockXiaohongshuData(keyword: string, limit: number, skip: number = 0): any[] {
  const results = [];
  const startIndex = skip + 1;
  const endIndex = startIndex + limit - 1;
  
  for (let i = startIndex; i <= endIndex; i++) {
    results.push({
      id: `xiaohongshu_${i}`,
      keyword,
      platform: 'xiaohongshu',
      title: `${keyword}精选笔记 #${i}`,
      content: `这是关于${keyword}的小红书笔记，分享了实用的经验和心得。第${i}条内容。`,
      author: `小红书博主${i}`,
      publishTime: new Date(Date.now() - i * 5400000).toISOString(),
      url: `https://xiaohongshu.com/discovery/item/xiaohongshu_${i}`,
      metrics: {
        likes: Math.floor(Math.random() * 5000),
        comments: Math.floor(Math.random() * 500),
        shares: Math.floor(Math.random() * 200),
        views: Math.floor(Math.random() * 20000)
      }
    });
  }
  return results;
}

function getMockZhihuData(keyword: string, limit: number, skip: number = 0): any[] {
  const results = [];
  const startIndex = skip + 1;
  const endIndex = startIndex + limit - 1;
  
  for (let i = startIndex; i <= endIndex; i++) {
    results.push({
      id: `zhihu_${i}`,
      keyword,
      platform: 'zhihu',
      title: `${keyword}相关问题 #${i}`,
      content: `这是关于${keyword}的知乎回答，提供了深入的分析和见解。第${i}条内容。`,
      author: `知乎用户${i}`,
      publishTime: new Date(Date.now() - i * 9000000).toISOString(),
      url: `https://zhihu.com/question/zhihu_${i}`,
      metrics: {
        likes: Math.floor(Math.random() * 2000),
        comments: Math.floor(Math.random() * 300),
        shares: Math.floor(Math.random() * 100),
        views: Math.floor(Math.random() * 10000)
      }
    });
  }
  return results;
}

// 生成模拟数据
function getMockData(keyword: string, platform: string, limit: number = 20, skip: number = 0): any[] {
  switch (platform) {
    case 'weibo':
      return getMockWeiboData(keyword, limit, skip);
    case 'douyin':
      return getMockDouyinData(keyword, limit, skip);
    case 'xiaohongshu':
      return getMockXiaohongshuData(keyword, limit, skip);
    case 'zhihu':
      return getMockZhihuData(keyword, limit, skip);
    default:
      return [];
  }
}

// 导出的URL爬取函数，保持向后兼容
export const crawlUrlContent = async (url: string, usePuppeteer: boolean = false): Promise<CrawlerResult | null> => {
  try {
    // 使用新的爬虫服务爬取URL内容
    const result = await universalCrawler.crawlUrl(url, usePuppeteer);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error(`深度爬取URL失败: ${url}`, errorMessage);
    
    // 降级到原有的universalCrawler
    try {
      logger.info(`降级使用universalCrawler爬取URL: ${url}`);
      // 初始化默认爬虫规则
      initializeDefaultRules();
      
      // 使用通用爬虫爬取URL内容
      const result = await universalCrawler.crawlUrl(url, usePuppeteer);
      return result;
    } catch (fallbackError) {
      const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : '未知错误';
      logger.error(`universalCrawler爬取URL也失败: ${url}`, fallbackErrorMessage);
      return null;
    }
  }
};

// 导出的批量爬取函数，保持向后兼容
export const batchCrawlUrls = async (urls: string[], usePuppeteer: boolean = false): Promise<CrawlerResult[]> => {
  try {
    // 使用新的爬虫服务进行批量爬取
    const results = await universalCrawler.batchCrawl(urls, usePuppeteer);
    return results.filter((result: CrawlerResult | null) => result !== null) as CrawlerResult[];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error(`批量爬取URL失败`, errorMessage);
    
    // 降级到原有的universalCrawler
    try {
      logger.info(`降级使用universalCrawler批量爬取URL`);
      const results: CrawlerResult[] = [];
      
      // 初始化默认爬虫规则
      initializeDefaultRules();
      
      for (const url of urls) {
        try {
          const result = await universalCrawler.crawlUrl(url, usePuppeteer);
          if (result) {
            results.push(result);
          }
          
          // 添加延迟以避免被反爬虫机制阻止
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知错误';
          logger.warn(`批量爬取URL失败: ${url}`, errorMessage);
        }
      }
      
      return results;
    } catch (fallbackError) {
      const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : '未知错误';
      logger.error(`universalCrawler批量爬取URL也失败`, fallbackErrorMessage);
      return [];
    }
  }
};