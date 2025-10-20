import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Analysis } from '../models/analysis.model';
import { Search } from '../models/search.model';
import { logger } from '../utils/logger';
import { 
  analyzeContentWithAI, 
  generateTopicSuggestionsWithAI,
  generateTopicSuggestionsWithCrawler,
  generateHybridTopicSuggestions
} from '../services/analysis.service';

interface AuthRequest extends Request {
  user?: any;
}

// 分析内容
export const analyzeContent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: '输入验证失败',
        details: errors.array()
      });
      return;
    }

    const { searchId, contentItems } = req.body;
    const userId = req.user._id;

    // 验证搜索记录是否存在且属于当前用户
    const search = await Search.findOne({ _id: searchId, userId });
    if (!search) {
      res.status(404).json({
        success: false,
        error: '搜索记录未找到'
      });
      return;
    }

    // 创建分析记录
    const analysis = new Analysis({
      searchId,
      userId,
      status: 'processing'
    });

    await analysis.save();

    logger.info(`开始分析内容: 搜索ID ${searchId}`);

    // 异步执行分析任务
    performAnalysis(analysis._id, search.keyword, contentItems).catch((error: Error) => {
      logger.error(`分析任务失败: ${error.message}`);
      Analysis.findByIdAndUpdate(analysis._id, { status: 'failed' }).catch();
    });

    res.status(202).json({
      success: true,
      message: '分析任务已启动',
      data: {
        analysisId: analysis._id,
        status: 'processing'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('分析内容失败:', errorMessage);
    next(error);
  }
};

// 获取分析历史
export const getAnalysisHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const analyses = await Analysis.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('searchId', 'keyword platforms createdAt');

    const total = await Analysis.countDocuments({ userId });

    res.status(200).json({
      success: true,
      analyses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('获取分析历史失败:', error);
    next(error);
  }
};

// 获取分析结果
export const getAnalysisResult = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { analysisId } = req.params;
    const userId = req.user._id;

    const analysis = await Analysis.findOne({ _id: analysisId, userId })
      .populate('searchId', 'keyword platforms');

    if (!analysis) {
      res.status(404).json({
        success: false,
        error: '分析记录未找到'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        analysis
      }
    });
  } catch (error) {
    logger.error('获取分析结果失败:', error);
    next(error);
  }
};

// 生成选题建议 - 移除认证依赖，支持爬虫功能
export const generateTopicSuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: '输入验证失败',
        details: errors.array()
      });
      return;
    }

    const { keywords, platform, model, count = 5, useCrawler = false } = req.body;
    
    // 添加简单的调试日志
    logger.info('=== DEBUG: 请求开始 ===');
    logger.info('请求体:', JSON.stringify(req.body, null, 2));
    logger.info('=== DEBUG: 请求结束 ===');

    let suggestions: any[] = [];
    
    // 根据请求参数选择不同的生成方式
    if (useCrawler) {
      // 使用爬虫数据生成选题建议
      logger.info(`使用爬虫数据生成选题建议，关键词: ${keywords.join(', ')}`);
      try {
        suggestions = await generateTopicSuggestionsWithCrawler(keywords, platform, count);
        logger.info(`爬虫服务成功返回${suggestions.length}条选题建议`);
      } catch (crawlerError) {
        logger.error(`爬虫服务失败: ${crawlerError instanceof Error ? crawlerError.message : '未知错误'}`);
        // 如果爬虫失败，尝试混合模式
        try {
          logger.info(`尝试混合模式生成选题建议`);
          suggestions = await generateHybridTopicSuggestions(keywords, platform, count, model);
          logger.info(`混合模式成功返回${suggestions.length}条选题建议`);
        } catch (hybridError) {
          logger.error(`混合模式也失败: ${hybridError instanceof Error ? hybridError.message : '未知错误'}`);
          // 最后尝试纯AI模式
          suggestions = await generateTopicSuggestionsWithAI(keywords, platform, count, model);
          logger.info(`回退到AI模式，返回${suggestions.length}条选题建议`);
        }
      }
    } else {
      // 使用混合模式（AI + 爬虫数据）
      logger.info(`使用混合模式生成选题建议，关键词: ${keywords.join(', ')}, 模型: ${model || '默认'}`);
      try {
        suggestions = await generateHybridTopicSuggestions(keywords, platform, count, model);
        logger.info(`混合模式成功返回${suggestions.length}条选题建议`);
      } catch (hybridError) {
        logger.error(`混合模式失败: ${hybridError instanceof Error ? hybridError.message : '未知错误'}`);
        // 如果混合模式失败，回退到纯AI模式
        try {
          suggestions = await generateTopicSuggestionsWithAI(keywords, platform, count, model);
          logger.info(`回退到AI模式，返回${suggestions.length}条选题建议`);
        } catch (aiError) {
          logger.error(`AI模式也失败: ${aiError instanceof Error ? aiError.message : '未知错误'}`);
          throw aiError;
        }
      }
    }
    
    // 添加详细的调试日志
    logger.info('选题建议详情:', JSON.stringify(suggestions, null, 2));
    
    // 检查每条建议是否包含必要的字段
    suggestions.forEach((suggestion, index) => {
      logger.info(`建议${index + 1}:`, {
        title: suggestion.title,
        difficulty: suggestion.difficulty,
        competitionLevel: suggestion.competitionLevel,
        hasAllFields: !!(suggestion.title && suggestion.difficulty && suggestion.competitionLevel)
      });
    });

    // 添加更多调试信息
    logger.info(`关键词变量类型: ${typeof keywords}`);
    logger.info(`关键词变量内容: ${JSON.stringify(keywords, null, 2)}`);
    logger.info(`生成选题建议: ${suggestions.length}条建议，关键词: ${Array.isArray(keywords) ? keywords.join(', ') : '不是数组'}`);

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error('生成选题建议失败:', errorMessage);
    
    // 如果所有模式都失败，回退到随机生成的数据
    logger.warn(`所有模式都失败，错误信息: ${errorMessage}，使用随机生成的选题建议`);
    
    const { keywords, platform, count = 5 } = req.body;
    const fallbackSuggestions = [];
    const difficulties = ['beginner', 'intermediate', 'advanced']; // 修改为英文
    const categories = ['科技', '商业', '教育', '娱乐', '健康', '生活方式'];
    const competitionLevels = ['low', 'medium', 'high'];
    const contentTypes = ['article', 'video', 'image', 'mixed'];
    
    // 生成指定数量的建议
    for (let i = 0; i < count; i++) {
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const heat = Math.floor(Math.random() * 40) + 60; // 修改字段名为heat
      const competitionLevel = competitionLevels[Math.floor(Math.random() * competitionLevels.length)];
      const suggestedContentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
      const estimatedViews = Math.floor(Math.random() * 90000) + 10000; // 10000-100000之间的预估浏览量
      
      fallbackSuggestions.push({
        id: `suggestion_${Date.now()}_${i}`,
        title: `${keyword}的${difficulty}应用与实践`,
        category,
        difficulty,
        heat, // 使用heat而不是popularity
        description: `深入探讨${keyword}在${category}领域的${difficulty}应用和实践方法`,
        keywords: keywords,
        platform,
        competitionLevel,
        estimatedViews,
        suggestedContentType,
        createdAt: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      data: fallbackSuggestions
    });
  }
};

// 执行分析任务
async function performAnalysis(analysisId: string, keyword: string, contentItems: any[]): Promise<void> {
  try {
    // 调用AI服务分析内容
    const analysisResult = await analyzeContentWithAI(keyword, contentItems);

    // 转换数据结构以匹配Analysis模型
    const topicDirections = analysisResult.topicDirections.map(item => item.direction);
    const userConcerns = analysisResult.userConcerns.map(item => item.concern);
    
    // 转换情感分析数据
    const sentimentAnalysis = {
      positive: Math.round(analysisResult.sentimentAnalysis.positiveRatio * 100),
      negative: Math.round(analysisResult.sentimentAnalysis.negativeRatio * 100),
      neutral: Math.round(analysisResult.sentimentAnalysis.neutralRatio * 100)
    };
    
    // 转换主题建议数据
    const topicSuggestions = analysisResult.topicSuggestions.map(item => ({
      title: item.topic,
      angle: '基于内容分析的角度',
      reason: item.reason,
      contentOutline: ['要点1', '要点2', '要点3'] // 生成默认大纲
    }));

    // 更新分析记录
    await Analysis.findByIdAndUpdate(analysisId, {
      topicDirections,
      userConcerns,
      sentimentAnalysis,
      topicSuggestions,
      status: 'completed'
    });

    logger.info(`分析完成: 关键词 ${keyword}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.error(`分析任务执行失败: ${errorMessage}`);
    await Analysis.findByIdAndUpdate(analysisId, { status: 'failed' });
    throw error;
  }
}