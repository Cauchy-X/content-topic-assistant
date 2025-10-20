import { logger } from '../utils/logger';

// 爬虫规则接口
export interface CrawlerRule {
  name: string;
  description: string;
  urlPatterns: string[]; // URL匹配模式（支持正则表达式）
  siteType: string;
  selectors: {
    title?: string[];
    content?: string[];
    author?: string[];
    date?: string[];
    image?: string[];
    price?: string[];
    rating?: string[];
    views?: string[];
    likes?: string[];
    comments?: string[];
    shares?: string[];
  };
  preprocessing?: {
    // 内容预处理规则
    removeElements?: string[]; // 需要移除的元素选择器
    replacePatterns?: Array<{ pattern: RegExp; replacement: string }>; // 文本替换规则
    extractPatterns?: Array<{ name: string; pattern: RegExp; group: number }>; // 提取特定信息的正则表达式
  };
  metadata?: {
    // 元数据提取规则
    customFields?: Array<{ name: string; selector: string; attribute?: string }>;
  };
  options?: {
    // 爬取选项
    usePuppeteer?: boolean; // 是否使用Puppeteer
    waitForSelector?: string; // 等待特定选择器
    delay?: number; // 请求延迟（毫秒）
    retries?: number; // 重试次数
    headers?: Record<string, string>; // 自定义请求头
  };
}

// 规则引擎类
export class CrawlerRuleEngine {
  private rules: Map<string, CrawlerRule> = new Map();
  
  // 添加规则
  addRule(rule: CrawlerRule): void {
    this.rules.set(rule.name, rule);
    logger.info(`添加爬虫规则: ${rule.name}`);
  }
  
  // 移除规则
  removeRule(name: string): boolean {
    const result = this.rules.delete(name);
    if (result) {
      logger.info(`移除爬虫规则: ${name}`);
    }
    return result;
  }
  
  // 获取规则
  getRule(name: string): CrawlerRule | undefined {
    return this.rules.get(name);
  }
  
  // 获取所有规则
  getAllRules(): CrawlerRule[] {
    return Array.from(this.rules.values());
  }
  
  // 根据URL匹配规则
  matchRule(url: string): CrawlerRule | null {
    for (const rule of this.rules.values()) {
      for (const pattern of rule.urlPatterns) {
        try {
          const regex = new RegExp(pattern);
          if (regex.test(url)) {
            return rule;
          }
        } catch (error) {
          logger.warn(`无效的正则表达式: ${pattern}`);
        }
      }
    }
    return null;
  }
  
  // 根据站点类型获取规则
  getRulesBySiteType(siteType: string): CrawlerRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.siteType === siteType);
  }
  
  // 从JSON文件加载规则
  loadRulesFromJSON(rulesJSON: string): void {
    try {
      const rules = JSON.parse(rulesJSON) as CrawlerRule[];
      for (const rule of rules) {
        this.addRule(rule);
      }
      logger.info(`从JSON加载了 ${rules.length} 条规则`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error('加载规则JSON失败:', errorMessage);
    }
  }
  
  // 导出规则为JSON
  exportRulesToJSON(): string {
    const rules = Array.from(this.rules.values());
    return JSON.stringify(rules, null, 2);
  }
}

// 默认规则集
export const DEFAULT_CRAWLER_RULES: CrawlerRule[] = [
  // 微博规则
  {
    name: 'weibo',
    description: '微博内容爬取规则',
    urlPatterns: ['weibo\\.com', 'm\\.weibo\\.cn'],
    siteType: 'social',
    selectors: {
      title: ['.txt', '.content'],
      content: ['.txt', '.content'],
      author: ['.name', '.username'],
      date: ['.time', '.date'],
      image: ['.img', '.pic'],
      likes: ['.like', '.heart'],
      comments: ['.comment', '.reply'],
      shares: ['.share', '.repost']
    },
    options: {
      usePuppeteer: true,
      waitForSelector: '.txt',
      delay: 1000
    }
  },
  
  // 知乎规则
  {
    name: 'zhihu',
    description: '知乎内容爬取规则',
    urlPatterns: ['zhihu\\.com'],
    siteType: 'qa',
    selectors: {
      title: ['h1', '.QuestionHeader-title'],
      content: ['.RichContent', '.QuestionAnswer-content'],
      author: ['.AuthorInfo-name', '.UserLink-link'],
      date: ['.ContentItem-time', '.Question-mainColumnTime'],
      image: ['.origin_image', '.content_image'],
      likes: ['.VoteButton--up', '.VoteButton'],
      comments: ['.ContentItem-action', '.CommentButton']
    },
    options: {
      usePuppeteer: true,
      waitForSelector: '.RichContent',
      delay: 2000
    }
  },
  
  // 小红书规则
  {
    name: 'xiaohongshu',
    description: '小红书内容爬取规则',
    urlPatterns: ['xiaohongshu\\.com'],
    siteType: 'social',
    selectors: {
      title: ['.title', '.note-title'],
      content: ['.desc', '.note-content'],
      author: ['.author-name', '.user-name'],
      date: ['.date', '.publish-time'],
      image: ['.cover', '.note-img'],
      likes: ['.like-count', '.heart-count'],
      comments: ['.comment-count'],
      shares: ['.share-count']
    },
    options: {
      usePuppeteer: true,
      waitForSelector: '.note-content',
      delay: 1500
    }
  },
  
  // 抖音规则
  {
    name: 'douyin',
    description: '抖音内容爬取规则',
    urlPatterns: ['douyin\\.com'],
    siteType: 'video',
    selectors: {
      title: ['.desc', '.video-desc'],
      content: ['.desc', '.video-desc'],
      author: ['.nickname', '.author-name'],
      date: ['.time', '.publish-time'],
      image: ['.cover', '.video-cover'],
      views: ['.play-count', '.view-count'],
      likes: ['.like-count', '.digg-count'],
      comments: ['.comment-count'],
      shares: ['.share-count', '.forward-count']
    },
    options: {
      usePuppeteer: true,
      waitForSelector: '.video-desc',
      delay: 2000
    }
  },
  
  // 通用新闻网站规则
  {
    name: 'general-news',
    description: '通用新闻网站爬取规则',
    urlPatterns: ['.*news.*', '.*article.*', '.*journal.*'],
    siteType: 'news',
    selectors: {
      title: ['h1', '.title', '.headline', '[data-testid="headline"]'],
      content: ['.article-content', '.content', '.post-content', 'article', '.story-body'],
      author: ['.author', '.byline', '.writer', '[data-testid="author"]'],
      date: ['.date', '.publish-date', '.timestamp', 'time', '[data-testid="date"]'],
      image: ['img', '.article-image', '.featured-image']
    },
    preprocessing: {
      removeElements: ['.ad', '.advertisement', '.sidebar', '.footer', 'script', 'style'],
      replacePatterns: [
        { pattern: /\\s+/g, replacement: ' ' },
        { pattern: /\\n+/g, replacement: ' ' }
      ]
    }
  },
  
  // 通用博客网站规则
  {
    name: 'general-blog',
    description: '通用博客网站爬取规则',
    urlPatterns: ['.*blog.*', '.*post.*'],
    siteType: 'blog',
    selectors: {
      title: ['h1', '.post-title', '.entry-title'],
      content: ['.post-content', '.entry-content', '.blog-content'],
      author: ['.author', '.post-author', '.byline'],
      date: ['.post-date', '.entry-date', '.published'],
      image: ['img', '.post-image', '.featured-image']
    },
    preprocessing: {
      removeElements: ['.ad', '.advertisement', '.sidebar', '.footer', 'script', 'style'],
      replacePatterns: [
        { pattern: /\\s+/g, replacement: ' ' },
        { pattern: /\\n+/g, replacement: ' ' }
      ]
    }
  },
  
  // 通用电商网站规则
  {
    name: 'general-ecommerce',
    description: '通用电商网站爬取规则',
    urlPatterns: ['.*shop.*', '.*store.*', '.*product.*'],
    siteType: 'ecommerce',
    selectors: {
      title: ['h1', '.product-title', '.item-title'],
      content: ['.product-description', '.item-description', '.details'],
      price: ['.price', '.current-price', '.sale-price'],
      image: ['.product-image', '.item-image', '.gallery img'],
      rating: ['.rating', '.stars', '.reviews-score']
    },
    preprocessing: {
      removeElements: ['.ad', '.advertisement', '.sidebar', '.footer', 'script', 'style'],
      replacePatterns: [
        { pattern: /\\s+/g, replacement: ' ' },
        { pattern: /\\n+/g, replacement: ' ' }
      ]
    },
    metadata: {
      customFields: [
        { name: 'price', selector: '.price', attribute: 'text' },
        { name: 'currency', selector: '.price', attribute: 'data-currency' }
      ]
    }
  },
  
  // 通用视频网站规则
  {
    name: 'general-video',
    description: '通用视频网站爬取规则',
    urlPatterns: ['.*video.*', '.*watch.*', '.*tube.*'],
    siteType: 'video',
    selectors: {
      title: ['h1', '.video-title', '.title'],
      content: ['.video-description', '.description'],
      author: ['.channel-name', '.uploader', '.creator'],
      views: ['.views', '.view-count'],
      image: ['.thumbnail', '.video-thumb', 'video poster']
    },
    preprocessing: {
      removeElements: ['.ad', '.advertisement', '.sidebar', '.footer', 'script', 'style'],
      replacePatterns: [
        { pattern: /\\s+/g, replacement: ' ' },
        { pattern: /\\n+/g, replacement: ' ' }
      ]
    }
  }
];

// 导出规则引擎单例
export const crawlerRuleEngine = new CrawlerRuleEngine();

// 初始化默认规则
export function initializeDefaultRules(): void {
  for (const rule of DEFAULT_CRAWLER_RULES) {
    crawlerRuleEngine.addRule(rule);
  }
  logger.info(`初始化了 ${DEFAULT_CRAWLER_RULES.length} 条默认爬虫规则`);
}