import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '../utils/logger';

// 通用爬虫配置
const CRAWLER_CONFIG = {
  // 默认请求头
  defaultHeaders: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  },
  // 请求超时时间（毫秒）
  timeout: 30000,
  // 重试次数
  maxRetries: 3,
  // 重试间隔（毫秒）
  retryDelay: 2000,
  // 请求间隔（毫秒）
  delayBetweenRequests: 1000,
  // Puppeteer配置
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-images',
      '--disable-default-apps',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-background-networking'
    ]
  }
};

// 搜索引擎配置
const SEARCH_ENGINE_CONFIG = {
  bing: {
    name: 'Bing',
    searchURL: 'https://www.bing.com/search',
    resultSelector: '.b_algo',
    titleSelector: 'h2 a',
    linkSelector: 'h2 a',
    snippetSelector: '.b_caption p',
    nextSelector: '.sb_pagN'
  },
  baidu: {
    name: 'Baidu',
    searchURL: 'https://www.baidu.com/s',
    resultSelector: '#content_left .c-container',
    titleSelector: 'h3 a',
    linkSelector: 'h3 a',
    snippetSelector: '.c-abstract',
    nextSelector: '.n:contains("下一页")'
  }
};

// 网站特定爬取规则
const SITE_RULES = {
  // 通用新闻网站规则
  'news': {
    titleSelectors: ['h1', '.title', '.headline', '[data-testid="headline"]'],
    contentSelectors: ['.article-content', '.content', '.post-content', 'article', '.story-body'],
    authorSelectors: ['.author', '.byline', '.writer', '[data-testid="author"]'],
    dateSelectors: ['.date', '.publish-date', '.timestamp', 'time', '[data-testid="date"]'],
    imageSelectors: ['img', '.article-image', '.featured-image']
  },
  // 通用博客网站规则
  'blog': {
    titleSelectors: ['h1', '.post-title', '.entry-title'],
    contentSelectors: ['.post-content', '.entry-content', '.blog-content'],
    authorSelectors: ['.author', '.post-author', '.byline'],
    dateSelectors: ['.post-date', '.entry-date', '.published'],
    imageSelectors: ['img', '.post-image', '.featured-image']
  },
  // 通用电商网站规则
  'ecommerce': {
    titleSelectors: ['h1', '.product-title', '.item-title'],
    contentSelectors: ['.product-description', '.item-description', '.details'],
    priceSelectors: ['.price', '.current-price', '.sale-price'],
    imageSelectors: ['.product-image', '.item-image', '.gallery img'],
    ratingSelectors: ['.rating', '.stars', '.reviews-score']
  },
  // 通用视频网站规则
  'video': {
    titleSelectors: ['h1', '.video-title', '.title'],
    contentSelectors: ['.video-description', '.description'],
    authorSelectors: ['.channel-name', '.uploader', '.creator'],
    viewSelectors: ['.views', '.view-count'],
    imageSelectors: ['.thumbnail', '.video-thumb', 'video poster']
  },
  // 百科网站规则
  'encyclopedia': {
    titleSelectors: ['h1', '.title', '.headline-title'],
    contentSelectors: ['.content', '.para', '.description', '.summary', 'article', '.lemma-summary'],
    authorSelectors: ['.author', '.editor', '.contributor'],
    dateSelectors: ['.date', '.update-time', '.last-modified', 'time'],
    imageSelectors: ['img', '.picture', '.photo', '.image']
  },
  // 政府网站规则
  'gov': {
    titleSelectors: ['h1', '.title', '.article-title', '.main-title'],
    contentSelectors: ['.content', '.article-content', '.text', '.main-content', '.article-body'],
    authorSelectors: ['.author', '.source', '.publisher'],
    dateSelectors: ['.date', '.publish-date', '.time', '.release-time'],
    imageSelectors: ['img', '.photo', '.picture']
  }
};

// 网站类型检测规则
const SITE_TYPE_DETECTION = {
  news: ['news', 'article', 'story', 'report', 'journalism'],
  blog: ['blog', 'post', 'diary', 'journal'],
  ecommerce: ['shop', 'store', 'buy', 'product', 'cart', 'price'],
  video: ['video', 'watch', 'play', 'stream', 'tube'],
  social: ['social', 'share', 'community', 'forum', 'discussion'],
  encyclopedia: ['baike.baidu.com', 'wikipedia.org', 'zh.wikipedia.org'],
  gov: ['gov.cn']
};

// 爬虫选项接口
export interface CrawlerOptions {
  usePuppeteer?: boolean;
  waitForSelector?: string;
  excludeSelectors?: string[];
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

// 搜索选项接口
export interface SearchOptions {
  engines?: string[];
  maxResults?: number;
  crawlResults?: boolean;
  crawlerOptions?: CrawlerOptions;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  usePuppeteer?: boolean;
  waitForSelector?: string;
  excludeSelectors?: string[];
}

// 爬虫结果接口
export interface CrawlerResult {
  id: string;
  title: string;
  content: string;
  url: string;
  author?: string;
  publishTime?: string;
  platform: string;
  siteType: string;
  metrics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
  images?: string[];
  metadata?: Record<string, any>;
}

// 搜索引擎结果接口
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  engine: string;
}

// 延迟函数
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// 检测网站类型
export function detectSiteType(url: string): string {
  const urlLower = url.toLowerCase();
  
  for (const [type, keywords] of Object.entries(SITE_TYPE_DETECTION)) {
    if (keywords.some(keyword => urlLower.includes(keyword))) {
      return type;
    }
  }
  
  return 'general';
}

// 通用网页爬虫服务
export class UniversalCrawler {
  private browser: Browser | null = null;
  
  // 初始化浏览器
  async initBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch(CRAWLER_CONFIG.puppeteer);
    }
  }
  
  // 关闭浏览器
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
  
  // 使用Axios获取页面内容
  async fetchWithAxios(url: string, headers?: Record<string, string>): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: { ...CRAWLER_CONFIG.defaultHeaders, ...headers },
        timeout: CRAWLER_CONFIG.timeout
      });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error(`Axios请求失败: ${url}`, errorMessage);
      
      // 添加更详细的错误信息
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // 服务器响应了，但状态码不在2xx范围内
          logger.error(`响应状态码: ${error.response.status}`, `响应头: ${JSON.stringify(error.response.headers)}`);
          if (error.response.status === 429) {
            logger.error('请求过于频繁，可能触发了反爬虫机制');
          } else if (error.response.status === 403) {
            logger.error('访问被拒绝，可能需要更真实的请求头或使用代理');
          }
        } else if (error.request) {
          // 请求已发出，但没有收到响应
          logger.error('没有收到响应，可能是网络问题或服务器不可达');
        } else {
          // 设置请求时发生错误
          logger.error('请求设置错误:', error.message);
        }
      }
      
      throw error;
    }
  }
  
  // 使用Puppeteer获取页面内容（适用于JavaScript渲染的页面）
  async fetchWithPuppeteer(url: string, waitForSelector?: string): Promise<string> {
    await this.initBrowser();
    
    if (!this.browser) {
      throw new Error('浏览器初始化失败');
    }
    
    const page: Page = await this.browser.newPage();
    
    try {
      // 设置更真实的浏览器环境
      await page.setUserAgent(CRAWLER_CONFIG.defaultHeaders['User-Agent'] || '');
      await page.setViewport({ width: 1920, height: 1080 });
      
      // 设置额外的请求头
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });
      
      // 添加一些反检测脚本
      await page.evaluateOnNewDocument(`
        // 覆盖window.navigator
        Object.defineProperty(window.navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // 覆盖chrome对象
        window.chrome = {
          runtime: {}
        };
        
        // 覆盖permissions
        if (window.navigator && window.navigator.permissions && window.navigator.permissions.query) {
          const originalQuery = window.navigator.permissions.query;
          window.navigator.permissions.query = function(parameters) {
            if (parameters && parameters.name === 'notifications') {
              return Promise.resolve({ state: window.Notification.permission });
            }
            return originalQuery.call(this, parameters);
          };
        }
      `);
      
      // 导航到目标页面
      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: CRAWLER_CONFIG.timeout 
      });
      
      // 等待一段时间，让页面完全加载
      await page.waitForTimeout(2000);
      
      // 如果指定了等待的选择器，等待它出现
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: 10000 });
      }
      
      return await page.content();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error(`Puppeteer请求失败: ${url}`, errorMessage);
      throw error;
    } finally {
      await page.close();
    }
  }
  
  // 提取段落内容的通用方法
  private extractParagraphs($: cheerio.CheerioAPI, selector: string, maxParagraphs: number, minLength: number = 20, excludeKeywords: string[] = []): string {
    const allParas: string[] = [];
    $(selector).each((i, elem) => {
      const text = $(elem).text().trim();
      if (text.length > minLength) {
        // 检查是否包含排除关键词
        const hasExcludedKeyword = excludeKeywords.some(keyword => text.includes(keyword));
        if (!hasExcludedKeyword) {
          allParas.push(text);
        }
      }
    });
    
    // 限制段落数量，避免内容过长
    if (allParas.length > 0) {
      return allParas.slice(0, maxParagraphs).join('\n\n');
    }
    
    return '';
  }

  // 批量爬取URL
  async batchCrawl(urls: string[], options: CrawlerOptions | boolean = false): Promise<CrawlerResult[]> {
    // 兼容旧的布尔参数格式
    let crawlerOptions: CrawlerOptions;
    if (typeof options === 'boolean') {
      crawlerOptions = { usePuppeteer: options };
    } else {
      crawlerOptions = options || {};
    }
    
    const {
      usePuppeteer = false,
      waitForSelector,
      excludeSelectors = [],
      headers = {},
      timeout = CRAWLER_CONFIG.timeout,
      retries = CRAWLER_CONFIG.maxRetries
    } = crawlerOptions;
    
    const results: CrawlerResult[] = [];
    
    logger.info(`开始批量爬取 ${urls.length} 个URL`);
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        logger.info(`批量爬取进度: ${i + 1}/${urls.length} - ${url}`);
        
        const result = await this.crawlUrl(url, {
          usePuppeteer,
          waitForSelector,
          excludeSelectors,
          headers,
          timeout,
          retries
        });
        
        if (result) {
          results.push(result);
        }
        
        // 添加延迟以避免被反爬虫机制阻止
        if (i < urls.length - 1) {
          await delay(CRAWLER_CONFIG.delayBetweenRequests);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        logger.error(`批量爬取失败: ${url}`, errorMessage);
      }
    }
    
    logger.info(`批量爬取完成，成功爬取 ${results.length}/${urls.length} 个URL`);
    return results;
  }

  // 处理百度重定向URL
  private async resolveBaiduRedirectUrl(url: string): Promise<string> {
    if (!url.includes('baidu.com/link?url=')) {
      return url;
    }
    
    try {
      // 确保浏览器已初始化
      await this.initBrowser();
      
      if (!this.browser) {
        throw new Error('浏览器初始化失败');
      }
      
      // 首先尝试从URL参数中解析
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const encodedUrl = urlParams.get('url') || urlParams.get('u');
      if (encodedUrl) {
        try {
          const decodedUrl = decodeURIComponent(encodedUrl);
          if (decodedUrl.startsWith('http')) {
            logger.info(`从参数解析百度重定向URL: ${url} -> ${decodedUrl}`);
            return decodedUrl;
          }
        } catch (e) {
          // 解码失败，继续使用Puppeteer方式
        }
      }
      
      // 使用Puppeteer访问重定向URL，获取最终跳转的URL
      const page = await this.browser.newPage();
      await page.setUserAgent(CRAWLER_CONFIG.defaultHeaders['User-Agent'] || '');
      
      // 设置请求拦截，获取重定向后的最终URL
      let finalUrl = url;
      
      // 监听所有请求，获取最终的非百度链接URL
      page.on('request', request => {
        const requestUrl = request.url();
        if (requestUrl !== url && !requestUrl.includes('baidu.com/link?url=') && requestUrl.startsWith('http')) {
          finalUrl = requestUrl;
        }
      });
      
      // 设置超时时间较短，避免长时间等待
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 10000 // 10秒超时
      });
      
      // 获取当前页面的URL
      const currentUrl = page.url();
      if (currentUrl !== url && !currentUrl.includes('baidu.com/link?url=')) {
        finalUrl = currentUrl;
      }
      
      await page.close();
      
      // 如果获取到了非百度链接的URL，则返回它
      if (finalUrl !== url && !finalUrl.includes('baidu.com/link?url=')) {
        logger.info(`解析百度重定向URL: ${url} -> ${finalUrl}`);
        return finalUrl;
      }
      
      return url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error(`解析百度重定向URL失败: ${url}`, errorMessage);
      return url;
    }
  }

  // 爬取单个URL
  async crawlUrl(url: string, options: CrawlerOptions | boolean = false): Promise<CrawlerResult | null> {
    // 兼容旧的布尔参数格式
    let crawlerOptions: CrawlerOptions;
    if (typeof options === 'boolean') {
      crawlerOptions = { usePuppeteer: options };
    } else {
      crawlerOptions = options || {};
    }
    
    const {
      usePuppeteer = false,
      waitForSelector,
      excludeSelectors = [],
      headers = {},
      timeout = CRAWLER_CONFIG.timeout,
      retries = CRAWLER_CONFIG.maxRetries
    } = crawlerOptions;
    
    // 处理百度重定向URL
    const resolvedUrl = await this.resolveBaiduRedirectUrl(url);
    
    let lastError: Error | null = null;
    
    // 重试逻辑
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.info(`爬取URL (尝试 ${attempt}/${retries}): ${resolvedUrl}`);
        
        const html = usePuppeteer 
          ? await this.fetchWithPuppeteer(resolvedUrl, waitForSelector)
          : await this.fetchWithAxios(resolvedUrl, headers);
        
        const $ = cheerio.load(html);
        const siteType = detectSiteType(resolvedUrl);
        const rules = SITE_RULES[siteType as keyof typeof SITE_RULES] || SITE_RULES.news;
        
        // 提取标题
        let title = '';
        for (const selector of rules.titleSelectors) {
          const element = $(selector).first();
          if (element.length) {
            title = element.text().trim();
            break;
          }
        }
        
        // 如果没有找到标题，尝试获取页面标题
        if (!title) {
          title = $('title').text().trim();
        }
        
        // 提取内容
        let content = '';
        for (const selector of rules.contentSelectors) {
          const element = $(selector).first();
          if (element.length) {
            content = element.text().trim();
            break;
          }
        }
        
        // 如果是百度百科，尝试使用特定的选择器
        if (siteType === 'encyclopedia' && resolvedUrl.includes('baike.baidu.com')) {
          // 尝试百度百科特定的内容选择器
          const baikeContentSelectors = [
            '.lemma-summary',  // 百度百科摘要
            '.para-title',     // 百度百科段落标题
            '.para',           // 百度百科段落
            '.description',    // 描述
            'div[class*="content"]',  // 内容div
            'div[class*="para"]'      // 段落div
          ];
          
          // 首先尝试获取摘要
          const summaryElement = $('.lemma-summary').first();
          if (summaryElement.length) {
            const summaryText = summaryElement.text().trim();
            if (summaryText.length > 20) {
              content = summaryText;
            }
          }
          
          // 如果没有摘要或摘要太短，尝试获取所有段落
          if (!content || content.length < 50) {
            content = this.extractParagraphs($, '.para', 5, 20, ['编辑', '目录']);
          }
          
          // 如果还是没有内容，尝试其他选择器
          if (!content || content.length < 50) {
            for (const selector of baikeContentSelectors) {
              const element = $(selector).first();
              if (element.length) {
                const text = element.text().trim();
                if (text.length > 50) {
                  content = text;
                  break;
                }
              }
            }
          }
        }
        
        // 如果是政府网站，尝试使用特定的选择器
        if (siteType === 'gov' && resolvedUrl.includes('gov.cn')) {
          // 尝试政府网站特定的内容选择器
          const govContentSelectors = [
            '.content',
            '.article-content',
            '.text',
            '.main-content',
            '.article-body',
            'div[class*="content"]',
            'div[class*="text"]',
            '.TRS_Editor',
            '.content_text'
          ];
          
          // 首先尝试获取主要内容区域
          for (const selector of govContentSelectors) {
            const element = $(selector).first();
            if (element.length) {
              const text = element.text().trim();
              if (text.length > 100) { // 政府文件通常较长
                content = text;
                break;
              }
            }
          }
          
          // 如果没有找到内容，尝试获取所有段落
          if (!content || content.length < 100) {
            const excludeKeywords = ['网站地图', '联系我们', '版权所有', 'ICP备案', '政府网站'];
            content = this.extractParagraphs($, 'p', 10, 20, excludeKeywords);
          }
        }
        
        // 如果仍然没有找到内容，尝试通用方法
        if (!content || content.length < 50) {
          content = this.extractParagraphs($, 'p', 3, 20);
        }
        
        // 移除排除选择器中的内容
        for (const selector of excludeSelectors) {
          $(selector).remove();
        }
        
        // 提取作者
        let author = '';
        if ('authorSelectors' in rules && rules.authorSelectors) {
          for (const selector of rules.authorSelectors) {
            const element = $(selector).first();
            if (element.length) {
              author = element.text().trim();
              break;
            }
          }
        }
        
        // 提取发布时间
        let publishTime = '';
        if ('dateSelectors' in rules && rules.dateSelectors) {
          for (const selector of rules.dateSelectors) {
            const element = $(selector).first();
            if (element.length) {
              publishTime = element.text().trim();
              break;
            }
          }
        }
        
        // 提取图片
        const images: string[] = [];
        if ('imageSelectors' in rules && rules.imageSelectors) {
          for (const selector of rules.imageSelectors) {
            $(selector).each((i, elem) => {
              const src = $(elem).attr('src');
              if (src && !images.includes(src)) {
                images.push(src);
              }
            });
          }
        }
        
        // 生成唯一ID
        const id = Buffer.from(resolvedUrl).toString('base64').substring(0, 10);
        
        logger.info(`成功爬取URL: ${resolvedUrl}`);
        
        return {
          id,
          title,
          content,
          url: resolvedUrl,
          author,
          publishTime,
          platform: 'web',
          siteType,
          images
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('未知错误');
        logger.error(`爬取URL失败 (尝试 ${attempt}/${retries}): ${url}`, lastError.message);
        
        // 如果不是最后一次尝试，等待一段时间再重试
        if (attempt < retries) {
          await delay(CRAWLER_CONFIG.retryDelay);
        }
      }
    }
    
    // 所有重试都失败了
    logger.error(`爬取URL最终失败: ${url}`, lastError?.message);
    return null;
  }
  
  // 使用搜索引擎搜索
  async searchWithEngine(keyword: string, engine: string = 'bing', maxResults: number = 10, options: { usePuppeteer?: boolean } = {}): Promise<SearchResult[]> {
    const config = SEARCH_ENGINE_CONFIG[engine as keyof typeof SEARCH_ENGINE_CONFIG];
    if (!config) {
      logger.error(`不支持的搜索引擎: ${engine}`);
      return [];
    }
    
    const { usePuppeteer = false } = options;
    const results: SearchResult[] = [];
    
    try {
      let searchURL = '';
      
      // 为不同搜索引擎构建正确的搜索URL
      if (engine === 'bing') {
        searchURL = `${config.searchURL}?q=${encodeURIComponent(keyword)}&count=${maxResults}&setlang=zh-CN`;
      } else if (engine === 'baidu') {
        searchURL = `${config.searchURL}?wd=${encodeURIComponent(keyword)}&rn=${maxResults}`;
      } else {
        searchURL = `${config.searchURL}?q=${encodeURIComponent(keyword)}&count=${maxResults}`;
      }
      
      logger.info(`使用 ${config.name} 搜索, URL: ${searchURL}, 使用Puppeteer: ${usePuppeteer}`);
      
      // 获取搜索结果页面
      let html: string;
      if (options.usePuppeteer) {
        logger.info(`使用Puppeteer访问搜索引擎: ${engine}`);
        html = await this.fetchWithPuppeteer(searchURL, config.resultSelector);
      } else {
        // 为不同搜索引擎添加特定的请求头
        const headers = {
          ...CRAWLER_CONFIG.defaultHeaders,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1'
        };

        // 为特定搜索引擎添加更真实的User-Agent
        if (engine === 'baidu') {
          headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        }
        
        html = await this.fetchWithAxios(searchURL, headers);
      }
      
      // 检查是否获取到了HTML内容
      if (!html || html.length < 1000) {
        logger.warn(`${config.name} 返回的HTML内容过短或为空`);
        return [];
      }
      
      const $ = cheerio.load(html);
      
      // 检查是否有搜索结果
      const resultElements = $(config.resultSelector);
      logger.info(`${config.name} 找到 ${resultElements.length} 个结果元素，选择器: ${config.resultSelector}`);
      
      if (resultElements.length === 0) {
        logger.warn(`${config.name} 没有找到匹配的搜索结果选择器: ${config.resultSelector}`);
        
        // 尝试使用备用选择器
        let fallbackSelector = '';
        if (engine === 'bing') {
          fallbackSelector = '.b_result';
        }
        
        if (fallbackSelector) {
          logger.info(`尝试使用备用选择器: ${fallbackSelector}`);
          const fallbackElements = $(fallbackSelector);
          logger.info(`备用选择器找到 ${fallbackElements.length} 个元素`);
          
          if (fallbackElements.length > 0) {
            $(fallbackSelector).each((i, elem) => {
              if (i >= maxResults) return false;
              
              // 检查元素是否存在
              if (!elem) return true;
              
              const titleElement = $(elem).find('h2 a, h3 a, a').first();
              const linkElement = $(elem).find('h2 a, h3 a, a').first();
              const snippetElement = $(elem).find('p, .snippet, .c-abstract').first();
              
              const title = titleElement.text().trim();
              let url = linkElement.attr('href');
              const snippet = snippetElement.text().trim();
              
              logger.info(`备用选择器结果 ${i+1}: 标题="${title}", URL="${url}"`);
              
              if (url && url.startsWith('http') && title) {
                results.push({
                  title,
                  url,
                  snippet,
                  engine: config.name
                });
              }
              return true;
            });
          }
        }
      } else {
        // 使用原始选择器
        $(config.resultSelector).each((i, elem) => {
          if (i >= maxResults) return false;
          
          const titleElement = $(elem).find(config.titleSelector).first();
          const linkElement = $(elem).find(config.linkSelector).first();
          const snippetElement = $(elem).find(config.snippetSelector).first();
          
          const title = titleElement.text().trim();
          let url = linkElement.attr('href');
          const snippet = snippetElement.text().trim();
          
          logger.info(`原始选择器结果 ${i+1}: 标题="${title}", URL="${url}"`);
          
          // 处理Bing搜索结果中的特殊URL格式
          if (url && url.startsWith('http')) {
            // Bing有时会返回重定向URL，需要提取真实URL
            if (url.includes('bing.com/a/clck?') || url.includes('bing.com/ck/a?')) {
              try {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                const realUrl = urlParams.get('u') || urlParams.get('url');
                if (realUrl) {
                  url = decodeURIComponent(realUrl);
                }
              } catch (e) {
                // 如果解析失败，使用原始URL
              }
            }
            
            results.push({
              title,
              url,
              snippet,
              engine: config.name
            });
          }
          
          return true; // 确保所有代码路径都有返回值
        });
      }
      
      logger.info(`从 ${config.name} 搜索到 ${results.length} 条结果`);
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error(`使用 ${config.name} 搜索失败:`, errorMessage);
      return [];
    }
  }
  
  // 计算相关性得分
  private calculateRelevanceScore(title: string, keyword: string): number {
    if (!title || !keyword) return 0;
    
    const titleLower = title.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    
    // 完全匹配
    if (titleLower === keywordLower) return 100;
    
    // 标题包含完整关键词
    if (titleLower.includes(keywordLower)) return 80;
    
    // 关键词分词匹配
    const keywordWords = keywordLower.split(/\s+/);
    let matchCount = 0;
    for (const word of keywordWords) {
      if (titleLower.includes(word)) matchCount++;
    }
    
    if (matchCount > 0) {
      return (matchCount / keywordWords.length) * 60;
    }
    
    return 0;
  }
  
  // 全网搜索
  async searchWeb(keyword: string, options: SearchOptions = {}): Promise<CrawlerResult[]> {
    const {
      maxResults = 20,
      engines = ['bing'],
      crawlResults = true,
      usePuppeteer = false,
      waitForSelector,
      excludeSelectors = [],
      headers = {},
      timeout = CRAWLER_CONFIG.timeout,
      retries = CRAWLER_CONFIG.maxRetries
    } = options;
    
    const allResults: CrawlerResult[] = [];
    const resultsPerEngine = Math.ceil(maxResults / engines.length);
    
    logger.info(`开始全网搜索: ${keyword}, 使用引擎: ${engines.join(', ')}, 使用Puppeteer: ${usePuppeteer}`);
    
    // 从多个搜索引擎获取结果
    for (const engine of engines) {
      try {
        logger.info(`开始使用 ${engine} 搜索引擎搜索`);
        const searchResults = await this.searchWithEngine(keyword, engine, resultsPerEngine, { usePuppeteer });
        logger.info(`${engine} 搜索引擎返回了 ${searchResults.length} 条结果`);
        
        // 如果需要爬取结果内容
        if (crawlResults) {
          for (const result of searchResults) {
            try {
              // 添加延迟以避免被反爬虫机制阻止
              await delay(1000);
              
              const crawledResult = await this.crawlUrl(result.url, {
                usePuppeteer,
                waitForSelector,
                excludeSelectors,
                headers,
                timeout,
                retries
              });
              
              if (crawledResult) {
                // 使用搜索引擎结果中的标题和摘要作为后备
                crawledResult.title = crawledResult.title || result.title;
                crawledResult.content = crawledResult.content || result.snippet;
                allResults.push(crawledResult);
              }
            } catch (error) {
              // 如果爬取失败，至少保留搜索引擎结果
              const errorMessage = error instanceof Error ? error.message : '未知错误';
              logger.warn(`爬取失败，使用搜索引擎结果: ${result.url}`, errorMessage);
              
              // 创建一个基本的爬虫结果
              allResults.push({
                id: Buffer.from(result.url).toString('base64').substring(0, 10),
                title: result.title,
                content: result.snippet,
                url: result.url,
                platform: 'web',
                siteType: 'news',
                images: []
              });
            }
          }
        } else {
          // 如果不需要爬取内容，直接使用搜索引擎结果
          for (const result of searchResults) {
            allResults.push({
              id: Buffer.from(result.url).toString('base64').substring(0, 10),
              title: result.title,
              content: result.snippet,
              url: result.url,
              platform: 'web',
              siteType: 'news',
              images: []
            });
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        logger.error(`使用 ${engine} 搜索引擎搜索失败:`, errorMessage);
      }
    }
    
    // 按相关性得分排序
    allResults.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a.title, keyword);
      const scoreB = this.calculateRelevanceScore(b.title, keyword);
      return scoreB - scoreA;
    });
    
    // 限制结果数量
    const limitedResults = allResults.slice(0, maxResults);
    
    logger.info(`全网搜索完成，返回 ${limitedResults.length} 条结果`);
    return limitedResults;
  }
}

// 导出单例实例
export const universalCrawler = new UniversalCrawler();