import axios from 'axios';
import { logger } from '../utils/logger';
import { AnalysisResult } from '../models/analysis.model';
import { universalCrawler, CrawlerResult, CrawlerOptions } from './universal-crawler.service';

// AI模型配置函数
const getAIConfig = () => {
  return {
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      baseURL: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat'
    },
    doubao: {
      apiKey: process.env.DOUBAO_API_KEY || '',
      baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
      model: process.env.DOUBAO_MODEL_ID || 'doubao-pro-4k' // 从环境变量读取模型ID，或使用默认值
    }
  };
};

// 分析内容与AI服务
export const analyzeContentWithAI = async (keyword: string, contentItems: any[]): Promise<AnalysisResult> => {
  try {
    // 准备分析提示词
    const prompt = createAnalysisPrompt(keyword, contentItems);
    
    // 尝试使用DeepSeek模型
    let result: AnalysisResult;
    try {
      result = await callDeepSeekAPI(prompt);
    } catch (error) {
      logger.warn('DeepSeek API调用失败，尝试使用Doubao模型', error);
      result = await callDoubaoAPI(prompt);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('AI分析失败:', errorMessage);
    throw new Error('AI分析服务不可用');
  }
};

// 创建分析提示词
function createAnalysisPrompt(keyword: string, contentItems: any[]): string {
  const contentText = contentItems.map(item => 
    `标题: ${item.title}\n内容: ${item.content}\n平台: ${item.platform}\n发布时间: ${item.publishTime}\n`
  ).join('\n---\n');

  return `
请分析以下关于"${keyword}"的内容，并提供详细的分析报告：

${contentText}

请按照以下JSON格式返回分析结果：
{
  "topicDirections": [
    {
      "direction": "主题方向描述",
      "weight": 0.8,
      "examples": ["示例1", "示例2"]
    }
  ],
  "userConcerns": [
    {
      "concern": "用户关注点",
      "frequency": 0.7,
      "sentiment": "positive/negative/neutral"
    }
  ],
  "sentimentAnalysis": {
    "overall": "positive/negative/neutral",
    "positiveRatio": 0.6,
    "negativeRatio": 0.2,
    "neutralRatio": 0.2,
    "keyEmotions": ["情感1", "情感2"]
  },
  "topicSuggestions": [
    {
      "topic": "建议主题",
      "potential": 0.8,
      "reason": "推荐理由"
    }
  ]
}

请确保返回的是有效的JSON格式，不要包含任何其他文本。
`;
}

// 调用DeepSeek API
async function callDeepSeekAPI(prompt: string): Promise<AnalysisResult> {
  const aiConfig = getAIConfig();
  const { apiKey, baseURL, model } = aiConfig.deepseek;
  
  if (!apiKey) {
    throw new Error('DeepSeek API密钥未配置');
  }

  try {
    const response = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model,
        messages: [
          { role: 'system', content: '你是一个专业的内容分析师，擅长分析社交媒体内容并提供洞察。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    return parseAnalysisResult(content);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('DeepSeek API调用失败:', errorMessage);
    throw error;
  }
}

// 调用Doubao API
async function callDoubaoAPI(prompt: string): Promise<AnalysisResult> {
  const aiConfig = getAIConfig();
  const { apiKey, baseURL, model } = aiConfig.doubao;
  
  if (!apiKey) {
    throw new Error('Doubao API密钥未配置');
  }

  try {
    const response = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model,
        messages: [
          { role: 'system', content: '你是一个专业的内容分析师，擅长分析社交媒体内容并提供洞察。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    return parseAnalysisResult(content);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('Doubao API调用失败:', errorMessage);
    throw error;
  }
}

// 生成选题建议与AI服务
export const generateTopicSuggestionsWithAI = async (
  keywords: string[], 
  platform: string, 
  count: number = 5,
  model?: string
): Promise<any[]> => {
  try {
    // 准备选题建议提示词
    const prompt = createTopicSuggestionsPrompt(keywords, platform, count);
    
    // 如果指定了模型，直接使用指定的模型
    if (model === 'deepseek') {
      logger.info('使用指定的DeepSeek模型生成选题建议');
      return await callDeepSeekForSuggestions(prompt);
    } else if (model === 'doubao') {
      logger.info('使用指定的豆包模型生成选题建议');
      return await callDoubaoForSuggestions(prompt);
    }
    
    // 尝试使用DeepSeek模型
    let result: any[];
    try {
      result = await callDeepSeekForSuggestions(prompt);
    } catch (error) {
      logger.warn('DeepSeek API调用失败，尝试使用Doubao模型', error);
      result = await callDoubaoForSuggestions(prompt);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('AI生成选题建议失败:', errorMessage);
    throw new Error('AI选题建议服务不可用');
  }
};

// 创建选题建议提示词
function createTopicSuggestionsPrompt(keywords: string[], platform: string, count: number): string {
  return `
你将根据用户提供的关键词和平台等数据，生成${count}个高质量的选题建议，并严格按照规定的JSON格式输出。

关键词: ${keywords.join(', ')}
平台: ${platform}
需要生成的选题数量: ${count}

请严格按照以下JSON格式返回选题建议数组，每个对象必须包含所有字段：
[
  {
    "title": "选题标题",
    "category": "分类",
    "difficulty": "easy",
    "popularity": 85,
    "description": "选题描述",
    "keywords": ["关键词1", "关键词2"],
    "platform": "平台",
    "competitionLevel": "low",
    "estimatedViews": 50000,
    "suggestedContentType": "article"
  }
]

重要要求：
1. 你必须根据上述关键词和平台生成${count}个选题建议
2. 选题应该具有创新性和实用性
3. difficulty字段必须使用以下值之一：easy、medium、hard
4. competitionLevel字段必须使用以下值之一：low、medium、high
5. 热度值在60-100之间
6. 预估浏览量在10000-100000之间
7. 建议的内容类型要适合平台特性
8. 每个选题建议必须包含所有字段，不能缺少任何字段
9. 只返回JSON数组，不要包含任何其他文本或解释

请确保返回的是有效的JSON数组格式，可以直接被JSON.parse()解析。
`;
}

// 调用DeepSeek API生成选题建议
async function callDeepSeekForSuggestions(prompt: string): Promise<any[]> {
  const aiConfig = getAIConfig();
  const { apiKey, baseURL, model } = aiConfig.deepseek;
  
  if (!apiKey) {
    throw new Error('DeepSeek API密钥未配置');
  }

  try {
    const response = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model,
        messages: [
          { role: 'system', content: '你是一个专业的内容策划师，擅长根据关键词和平台特点生成高质量的选题建议。你会根据用户提供的关键词和平台等数据，生成指定数量的选题，并严格按照规定的JSON格式输出。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    return parseTopicSuggestions(content);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('DeepSeek API调用失败:', errorMessage);
    throw error;
  }
}

// 调用Doubao API生成选题建议
async function callDoubaoForSuggestions(prompt: string): Promise<any[]> {
  const aiConfig = getAIConfig();
  const { apiKey, baseURL, model } = aiConfig.doubao;
  
  if (!apiKey) {
    throw new Error('Doubao API密钥未配置');
  }

  try {
    const response = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model,
        messages: [
          { role: 'system', content: '你是一个专业的内容策划师，擅长根据关键词和平台特点生成高质量的选题建议。你会根据用户提供的关键词和平台等数据，生成指定数量的选题，并严格按照规定的JSON格式输出。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    return parseTopicSuggestions(content);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('Doubao API调用失败:', errorMessage);
    throw error;
  }
}

// 解析AI返回的选题建议
function parseTopicSuggestions(content: string): any[] {
  try {
    logger.info('AI返回原始内容:', content);
    
    // 尝试直接解析JSON
    const suggestions = JSON.parse(content);
    logger.info('解析后的建议类型:', typeof suggestions);
    logger.info('是否为数组:', Array.isArray(suggestions));
    
    // 如果是数组，直接处理
    if (Array.isArray(suggestions)) {
      logger.info(`处理${suggestions.length}条建议`);
      const processedSuggestions = suggestions.map((suggestion: any, index: number) => {
        logger.info(`处理建议${index + 1}:`, JSON.stringify(suggestion, null, 2));
        
        const processed = {
          id: `suggestion_${Date.now()}_${index}`,
          title: suggestion.title || suggestion.选题标题 || `选题建议 ${index + 1}`,
          category: suggestion.category || '综合',
          difficulty: suggestion.difficulty || 'easy', // 使用英文默认值
          heat: suggestion.heat || suggestion.popularity || Math.floor(Math.random() * 40) + 60, // 支持两种字段名
          description: suggestion.description || suggestion.选题描述 || `基于关键词的选题建议`,
          keywords: Array.isArray(suggestion.keywords) ? suggestion.keywords : [],
          platform: suggestion.platform || '小红书',
          competitionLevel: suggestion.competitionLevel || 'medium', // 保持英文
          estimatedViews: suggestion.estimatedViews || Math.floor(Math.random() * 90000) + 10000,
          suggestedContentType: suggestion.suggestedContentType || 'article',
          createdAt: new Date().toISOString()
        };
        
        logger.info(`处理后的建议${index + 1}:`, JSON.stringify(processed, null, 2));
        return processed;
      });
      
      logger.info('最终处理结果:', JSON.stringify(processedSuggestions, null, 2));
      return processedSuggestions;
    }
    
    // 如果是对象，尝试提取相关信息
    if (typeof suggestions === 'object' && suggestions !== null) {
      logger.info('处理对象格式建议');
      // 处理DeepSeek返回的格式
      if (suggestions.选题标题) {
        const processed = [{
          id: `suggestion_${Date.now()}_0`,
          title: suggestions.选题标题,
          category: '综合',
          difficulty: 'easy', // 使用英文
          heat: suggestions.heat || suggestions.popularity || 85, // 支持两种字段名
          description: suggestions.核心亮点 ? suggestions.核心亮点.join(' ') : 'AI生成的选题建议',
          keywords: [],
          platform: '小红书',
          competitionLevel: 'medium',
          estimatedViews: 50000,
          suggestedContentType: 'article',
          createdAt: new Date().toISOString()
        }];
        
        logger.info('处理DeepSeek格式结果:', JSON.stringify(processed, null, 2));
        return processed;
      }
      
      // 处理Doubao返回的格式
      if (suggestions.选题标题 || suggestions.内容方向) {
        const processed = [{
          id: `suggestion_${Date.now()}_0`,
          title: suggestions.选题标题 || 'AI生成的选题',
          category: '综合',
          difficulty: 'easy', // 使用英文
          heat: suggestions.heat || suggestions.popularity || 85, // 支持两种字段名
          description: suggestions.内容方向 ? suggestions.内容方向.join(' ') : 'AI生成的选题建议',
          keywords: [],
          platform: '小红书',
          competitionLevel: 'medium',
          estimatedViews: 50000,
          suggestedContentType: 'article',
          createdAt: new Date().toISOString()
        }];
        
        logger.info('处理Doubao格式结果:', JSON.stringify(processed, null, 2));
        return processed;
      }
    }
    
    // 如果无法识别格式，返回空数组
    logger.warn('无法识别AI返回的格式，返回空数组');
    return [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('解析选题建议失败:', errorMessage);
    
    // 如果直接解析失败，尝试提取JSON部分
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        logger.info('尝试提取JSON数组部分');
        const suggestions = JSON.parse(jsonMatch[0]);
        
        // 为每个建议添加ID和创建时间
        const processedSuggestions = suggestions.map((suggestion: any, index: number) => ({
          id: `suggestion_${Date.now()}_${index}`,
          title: suggestion.title || suggestion.选题标题 || `选题建议 ${index + 1}`,
          category: suggestion.category || '综合',
          difficulty: suggestion.difficulty || 'easy', // 使用英文
          heat: suggestion.heat || suggestion.popularity || Math.floor(Math.random() * 40) + 60, // 支持两种字段名
          description: suggestion.description || suggestion.选题描述 || `基于关键词的选题建议`,
          keywords: Array.isArray(suggestion.keywords) ? suggestion.keywords : [],
          platform: suggestion.platform || '小红书',
          competitionLevel: suggestion.competitionLevel || 'medium', // 保持英文
          estimatedViews: suggestion.estimatedViews || Math.floor(Math.random() * 90000) + 10000,
          suggestedContentType: suggestion.suggestedContentType || 'article',
          createdAt: new Date().toISOString()
        }));
        
        logger.info('提取JSON数组处理结果:', JSON.stringify(processedSuggestions, null, 2));
        return processedSuggestions;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '未知错误';
        logger.error('解析提取的JSON失败:', errorMessage);
      }
    }
    
    // 尝试提取对象格式
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        logger.info('尝试提取JSON对象部分');
        const suggestion = JSON.parse(objectMatch[0]);
        
        // 处理DeepSeek返回的格式
        if (suggestion.选题标题) {
          const processed = [{
            id: `suggestion_${Date.now()}_0`,
            title: suggestion.选题标题,
            category: '综合',
            difficulty: 'easy', // 使用英文
            heat: suggestion.heat || suggestion.popularity || 85, // 支持两种字段名
            description: suggestion.核心亮点 ? suggestion.核心亮点.join(' ') : 'AI生成的选题建议',
            keywords: [],
            platform: '小红书',
            competitionLevel: 'medium',
            estimatedViews: 50000,
            suggestedContentType: 'article',
            createdAt: new Date().toISOString()
          }];
          
          logger.info('提取JSON对象处理结果:', JSON.stringify(processed, null, 2));
          return processed;
        }
        
        // 处理Doubao返回的格式
        if (suggestion.选题标题 || suggestion.内容方向) {
          const processed = [{
            id: `suggestion_${Date.now()}_0`,
            title: suggestion.选题标题 || 'AI生成的选题',
            category: '综合',
            difficulty: 'easy', // 使用英文
            heat: suggestion.heat || suggestion.popularity || 85, // 支持两种字段名
            description: suggestion.内容方向 ? suggestion.内容方向.join(' ') : 'AI生成的选题建议',
            keywords: [],
            platform: '小红书',
            competitionLevel: 'medium',
            estimatedViews: 50000,
            suggestedContentType: 'article',
            createdAt: new Date().toISOString()
          }];
          
          logger.info('提取Doubao对象处理结果:', JSON.stringify(processed, null, 2));
          return processed;
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '未知错误';
        logger.error('解析提取的对象失败:', errorMessage);
      }
    }
    
    // 如果仍然失败，返回空数组
    logger.warn('解析选题建议失败，返回空数组');
    return [];
  }
}

// 解析AI返回的分析结果
function parseAnalysisResult(content: string): AnalysisResult {
  try {
    // 尝试直接解析JSON
    return JSON.parse(content);
  } catch (error) {
    // 如果直接解析失败，尝试提取JSON部分
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '未知错误';
        logger.error('解析AI返回结果失败:', errorMessage);
      }
    }
    
    // 如果仍然失败，返回默认结果
    logger.warn('使用默认分析结果');
    return {
      topicDirections: [
        {
          direction: '通用主题',
          weight: 0.5,
          examples: ['示例1', '示例2']
        }
      ],
      userConcerns: [
        {
          concern: '用户关注点',
          frequency: 0.5,
          sentiment: 'neutral'
        }
      ],
      sentimentAnalysis: {
        overall: 'neutral',
        positiveRatio: 0.33,
        negativeRatio: 0.33,
        neutralRatio: 0.34,
        keyEmotions: ['中性']
      },
      topicSuggestions: [
        {
          topic: '建议主题',
          potential: 0.5,
          reason: '基于内容分析的建议'
        }
      ]
    };
  }
}

// 基于爬虫数据的选题建议
export const generateTopicSuggestionsWithCrawler = async (
  keywords: string[], 
  platform: string, 
  count: number = 5,
  options?: any
): Promise<any[]> => {
  try {
    logger.info(`开始基于爬虫数据生成选题建议，关键词: ${keywords.join(', ')}, 平台: ${platform}`);
    
    // 1. 搜索相关内容
    const searchResults = [];
    for (const keyword of keywords) {
      const results = await universalCrawler.searchWeb(keyword, {
        maxResults: 10,
        engines: ['bing'],
        crawlResults: true
      });
      searchResults.push(...results);
    }
    logger.info(`搜索到 ${searchResults.length} 条相关内容`);
    
    // 2. 基于搜索结果生成简单的选题建议
    const suggestions = searchResults.slice(0, count).map(result => ({
      id: result.id,
      title: result.title,
      description: result.content.substring(0, 200) + '...',
      category: '未分类',
      keywords: keywords,
      platform: platform,
      difficulty: 'medium', // 使用英文
      heat: Math.floor(Math.random() * 40) + 60, // 使用heat字段
      competitionLevel: 'medium', // 使用英文
      estimatedViews: Math.floor(Math.random() * 90000) + 10000,
      suggestedContentType: 'article',
      createdAt: new Date().toISOString()
    }));
    
    logger.info(`生成了 ${suggestions.length} 个选题建议`);
    return suggestions;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('基于爬虫数据生成选题建议失败:', errorMessage);
    throw new Error(`爬虫选题建议服务不可用: ${errorMessage}`);
  }
};

// 混合模式：结合AI和爬虫数据生成选题建议
export const generateHybridTopicSuggestions = async (
  keywords: string[], 
  platform: string, 
  count: number = 5,
  model?: string,
  options?: any
): Promise<any[]> => {
  try {
    logger.info(`开始混合模式生成选题建议，关键词: ${keywords.join(', ')}, 平台: ${platform}`);
    
    // 1. 获取爬虫数据
    const crawlerSuggestions = await generateTopicSuggestionsWithCrawler(
      keywords, 
      platform, 
      Math.ceil(count / 2), 
      options
    );
    
    // 2. 获取AI建议
    const aiSuggestions = await generateTopicSuggestionsWithAI(
      keywords, 
      platform, 
      Math.ceil(count / 2), 
      model
    );
    
    // 3. 合并和去重
    const allSuggestions = [...crawlerSuggestions, ...aiSuggestions];
    const uniqueSuggestions = removeDuplicateSuggestions(allSuggestions);
    
    // 4. 按热度排序并返回指定数量
    const sortedSuggestions = uniqueSuggestions
      .sort((a, b) => (b.heat || 0) - (a.heat || 0))
      .slice(0, count);
    
    logger.info(`混合模式生成了 ${sortedSuggestions.length} 个选题建议`);
    return sortedSuggestions;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('混合模式生成选题建议失败:', errorMessage);
    
    // 降级到纯AI模式
    logger.info('降级到纯AI模式生成选题建议');
    return generateTopicSuggestionsWithAI(keywords, platform, count, model);
  }
};

// 去重函数
function removeDuplicateSuggestions(suggestions: any[]): any[] {
  const seen = new Set<string>();
  return suggestions.filter(suggestion => {
    const key = `${suggestion.title}_${suggestion.platform || 'unknown'}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// 获取热点话题
export const getHotTopics = async (
  platform?: string,
  options?: any
): Promise<any[]> => {
  try {
    logger.info(`获取热点话题，平台: ${platform || '全部'}`);
    
    // 使用universalCrawler搜索热点话题
    const searchResults = await universalCrawler.searchWeb('热点 热门 最新', {
      maxResults: 20,
      engines: ['bing'],
      crawlResults: false
    });
    
    // 转换为热点话题格式
    const hotTopics = searchResults.map(result => ({
      id: result.id,
      title: result.title,
      platform: platform || result.platform,
      heat: Math.floor(Math.random() * 100), // 简单的热度计算
      summary: result.content.substring(0, 150) + '...',
      url: result.url,
      publishTime: new Date().toISOString()
    }));
    
    return hotTopics;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('获取热点话题失败:', errorMessage);
    throw new Error(`热点话题服务不可用: ${errorMessage}`);
  }
};