import { logger } from '../utils/logger';

// 解析AI返回的选题建议
function parseTopicSuggestions(content: string): any[] {
  try {
    // 尝试直接解析JSON
    const suggestions = JSON.parse(content);
    
    // 如果是数组，直接处理
    if (Array.isArray(suggestions)) {
      return suggestions.map((suggestion: any, index: number) => ({
        id: `suggestion_${Date.now()}_${index}`,
        title: suggestion.title || suggestion.选题标题 || `选题建议 ${index + 1}`,
        category: suggestion.category || '综合',
        difficulty: suggestion.difficulty || 'easy', // 使用英文
        heat: suggestion.heat || suggestion.popularity || Math.floor(Math.random() * 40) + 60, // 支持两种字段名
        description: suggestion.description || suggestion.选题描述 || `基于关键词的选题建议`,
        keywords: Array.isArray(suggestion.keywords) ? suggestion.keywords : [],
        platform: suggestion.platform || '小红书',
        competitionLevel: suggestion.competitionLevel || 'medium',
        estimatedViews: suggestion.estimatedViews || Math.floor(Math.random() * 90000) + 10000,
        suggestedContentType: suggestion.suggestedContentType || 'article',
        createdAt: new Date().toISOString()
      }));
    }
    
    // 如果是对象，尝试提取相关信息
    if (typeof suggestions === 'object' && suggestions !== null) {
      // 处理DeepSeek返回的格式
      if (suggestions.选题标题) {
        return [{
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
      }
      
      // 处理Doubao返回的格式
      if (suggestions.选题标题 || suggestions.内容方向) {
        return [{
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
      }
    }
    
    // 如果无法识别格式，返回空数组
    logger.warn('无法识别AI返回的格式, 返回空数组');
    return [];
  } catch (error) {
    // 如果直接解析失败，尝试提取JSON部分
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const suggestions = JSON.parse(jsonMatch[0]);
        
        // 为每个建议添加ID和创建时间
        return suggestions.map((suggestion: any, index: number) => ({
          id: `suggestion_${Date.now()}_${index}`,
          title: suggestion.title || suggestion.选题标题 || `选题建议 ${index + 1}`,
          category: suggestion.category || '综合',
          difficulty: suggestion.difficulty || '初级',
          heat: suggestion.heat || suggestion.popularity || Math.floor(Math.random() * 40) + 60, // 支持两种字段名
          description: suggestion.description || suggestion.选题描述 || `基于关键词的选题建议`,
          keywords: Array.isArray(suggestion.keywords) ? suggestion.keywords : [],
          platform: suggestion.platform || '小红书',
          competitionLevel: suggestion.competitionLevel || 'medium',
          estimatedViews: suggestion.estimatedViews || Math.floor(Math.random() * 90000) + 10000,
          suggestedContentType: suggestion.suggestedContentType || 'article',
          createdAt: new Date().toISOString()
        }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '未知错误';
        logger.error('解析AI返回的选题建议失败:', errorMessage);
      }
    }
    
    // 尝试提取对象格式
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        const suggestion = JSON.parse(objectMatch[0]);
        
        // 处理DeepSeek返回的格式
        if (suggestion.选题标题) {
          return [{
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
        }
        
        // 处理Doubao返回的格式
        if (suggestion.选题标题 || suggestion.内容方向) {
          return [{
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
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '未知错误';
        logger.error('解析AI返回的选题建议失败:', errorMessage);
      }
    }
    
    // 如果仍然失败，返回空数组
    logger.warn('解析选题建议失败，返回空数组');
    return [];
  }
}