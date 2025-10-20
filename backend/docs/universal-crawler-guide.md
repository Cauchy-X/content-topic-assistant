# 全网爬虫功能使用指南

## 概述

本项目已扩展支持全网爬虫功能，不再局限于特定平台（微博、知乎等），现在可以：

1. 通过搜索引擎（Bing、百度）搜索全网内容
2. 深度爬取任意URL的详细内容
3. 批量爬取多个URL的内容
4. 自动识别网站类型并应用相应的爬取规则

## 功能特点

### 1. 全网搜索
- 支持通过多个搜索引擎搜索关键词
- 自动去重和结果排序
- 可配置每个搜索引擎的结果数量

### 2. URL深度爬取
- 支持静态页面和动态页面爬取
- 自动提取标题、内容、作者、发布时间等信息
- 可选择使用Puppeteer处理JavaScript渲染的页面

### 3. 可配置规则引擎
- 内置常见网站类型的爬取规则
- 支持自定义添加特定网站的爬取规则
- 自动识别网站类型并应用相应规则

## API使用方法

### 1. 全网搜索

```javascript
// 请求示例
POST /api/search
{
  "keyword": "人工智能",
  "platforms": ["web", "weibo", "zhihu"],
  "limit": 20,
  "page": 1
}

// 响应示例
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": "unique_id",
        "keyword": "人工智能",
        "platform": "web",
        "title": "文章标题",
        "content": "文章内容摘要...",
        "author": "作者名称",
        "publishTime": "2023-01-01T00:00:00.000Z",
        "url": "https://example.com/article",
        "likes": 100,
        "comments": 50,
        "shares": 20,
        "views": 1000
      }
    ],
    "total": 1000,
    "hasMore": true
  }
}
```

### 2. 深度爬取单个URL

```javascript
// 请求示例
POST /api/crawl
{
  "url": "https://example.com/article",
  "usePuppeteer": false
}

// 响应示例
{
  "success": true,
  "data": {
    "id": "unique_id",
    "url": "https://example.com/article",
    "title": "文章标题",
    "content": "完整的文章内容...",
    "author": "作者名称",
    "publishTime": "2023-01-01T00:00:00.000Z",
    "platform": "news",
    "metrics": {
      "likes": 100,
      "comments": 50,
      "shares": 20
    },
    "images": [
      "https://example.com/image1.jpg"
    ],
    "links": [
      "https://example.com/related-article"
    ]
  }
}
```

### 3. 批量爬取多个URL

```javascript
// 请求示例
POST /api/batch-crawl
{
  "urls": [
    "https://example.com/article1",
    "https://example.com/article2",
    "https://example.com/article3"
  ],
  "usePuppeteer": false
}

// 响应示例
{
  "success": true,
  "data": {
    "results": [
      // 每个URL的爬取结果，格式与单个URL爬取相同
    ],
    "total": 3,
    "processed": 3
  }
}
```

## 配置选项

### 搜索引擎配置

可以在 `universal-crawler.service.ts` 中修改搜索引擎配置：

```typescript
const SEARCH_ENGINES = {
  bing: {
    name: 'Bing',
    searchUrl: 'https://www.bing.com/search',
    resultSelector: '.b_algo',
    titleSelector: 'h2',
    linkSelector: 'a',
    snippetSelector: '.b_caption p'
  },
  baidu: {
    name: 'Baidu',
    searchUrl: 'https://www.baidu.com/s',
    resultSelector: '.result',
    titleSelector: 'h3 a',
    linkSelector: 'h3 a',
    snippetSelector: '.c-abstract'
  }
};
```

### 网站规则配置

可以在 `crawler-rule-engine.service.ts` 中添加或修改网站爬取规则：

```typescript
const DEFAULT_CRAWLER_RULES: CrawlerRule[] = [
  {
    name: 'news',
    description: '新闻网站',
    urlPatterns: ['news.', 'www.news.', '/news/'],
    contentSelectors: {
      title: ['h1', '.title', '.headline'],
      content: ['.article-content', '.post-content', 'article'],
      author: ['.author', '.byline', '.reporter'],
      publishTime: ['.publish-time', '.date', 'time'],
      images: ['img'],
      links: ['a']
    }
  },
  // 添加更多规则...
];
```

## 测试方法

运行测试脚本验证功能：

```bash
cd backend
node src/scripts/test-universal-crawler.js
```

## 注意事项

1. **合规性**: 请确保爬取行为符合目标网站的robots.txt和服务条款
2. **频率限制**: 批量爬取时已添加延迟，但仍需注意不要过度请求
3. **错误处理**: 网站结构变化可能导致爬取失败，需要更新规则
4. **Puppeteer使用**: 使用Puppeteer会消耗更多资源，仅在必要时启用

## 扩展功能

1. **添加新的搜索引擎**: 在 `SEARCH_ENGINES` 配置中添加新的搜索引擎
2. **自定义网站规则**: 通过规则引擎添加特定网站的爬取规则
3. **结果过滤**: 在搜索结果中添加过滤条件
4. **缓存机制**: 添加爬取结果缓存以提高性能

## 故障排除

1. **搜索无结果**: 检查搜索引擎配置和网络连接
2. **爬取失败**: 检查URL是否有效，是否需要使用Puppeteer
3. **规则不匹配**: 检查网站规则配置，可能需要更新选择器
4. **API错误**: 检查请求参数和认证信息