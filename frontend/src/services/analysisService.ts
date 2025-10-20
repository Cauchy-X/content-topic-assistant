import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

export interface ContentAnalysis {
  topicDirections: string[];
  userConcerns: string[];
  sentimentAnalysis: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topicSuggestions: Array<{
    topic: string;
    reason: string;
  }>;
  summary?: string;
  keywords?: string[];
  sentiment?: {
    polarity: 'positive' | 'negative' | 'neutral';
    score: number;
  };
  difficulty?: string;
  readingTime?: number;
  wordCount?: number;
}

export interface TopicSuggestion {
  id: string;
  title: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | '初级' | '中级' | '高级';
  heat?: number;
  competitionLevel?: 'low' | 'medium' | 'high' | '低' | '中' | '高' | '中等';
  estimatedViews?: number;
  estimatedEngagement?: number;
  suggestedContentType?: 'article' | 'video' | 'image' | 'mixed';
  description?: string;
  keywords?: string[];
  createdAt?: string;
  targetAudience?: string;
  contentType?: string;
  trendScore?: number;
  uniqueAngle?: string;
  contentOutline?: string[];
  sources?: string[];
}

export interface SuggestionParams {
  keywords: string[];
  platform: string;
  count?: number;
  model?: 'deepseek' | 'doubao';
  useCrawler?: boolean; // 新增参数，控制是否使用爬虫数据
}

export interface ContentOutline {
  id: string;
  title: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
  }>;
}

export interface AnalysisResult {
  success: boolean;
  data?: TopicSuggestion[];
  error?: string;
}

export const analysisService = {
  // 生成选题建议
  async generateSuggestions(params: SuggestionParams): Promise<AnalysisResult> {
    try {
      console.log('发送选题建议请求:', params);
      
      // 确保关键词是数组格式
      const requestData = {
        ...params,
        keywords: Array.isArray(params.keywords) ? params.keywords : [params.keywords]
      };
      
      console.log('格式化后的请求参数:', requestData);
      
      const response = await axios.post(`${API_BASE_URL}/analysis/suggestions`, requestData);
      
      console.log('选题建议原始响应:', response.data);
      
      // 处理不同的响应格式
      if (response.data) {
        // 后端返回的格式是 { success: true, data: suggestions }
        if (response.data.success && response.data.data) {
          console.log('返回格式1: success + data', response.data.data);
          return {
            success: true,
            data: Array.isArray(response.data.data) ? response.data.data : []
          };
        }
        // 如果直接返回数组
        else if (Array.isArray(response.data)) {
          console.log('返回格式2: 直接数组', response.data);
          return {
            success: true,
            data: response.data
          };
        }
        // 如果有suggestions字段
        else if (response.data.suggestions) {
          console.log('返回格式3: suggestions字段', response.data.suggestions);
          return {
            success: true,
            data: Array.isArray(response.data.suggestions) ? response.data.suggestions : []
          };
        }
        // 如果有data字段但不是success格式
        else if (response.data.data) {
          console.log('返回格式4: data字段', response.data.data);
          return {
            success: true,
            data: Array.isArray(response.data.data) ? response.data.data : []
          };
        }
      }
      
      console.warn('无法处理的响应格式:', response.data);
      return {
        success: false,
        error: response.data?.error || '生成选题建议失败'
      };
    } catch (error) {
      console.error('生成选题建议失败:', error);
      
      // 如果是axios错误，尝试获取错误信息
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        return {
          success: false,
          error: error.response.data.error
        };
      }
      
      return {
        success: false,
        error: '网络错误，请稍后重试'
      };
    }
  },

  // 分析内容
  async analyzeContent(searchId: string, contentItems: any[]): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/analysis/analyze`, {
        searchId,
        contentItems
      });
      return response.data;
    } catch (error) {
      console.error('分析内容失败:', error);
      throw error;
    }
  },

  // 获取分析历史
  async getAnalysisHistory(page = 1, limit = 10): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/analysis/history`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('获取分析历史失败:', error);
      throw error;
    }
  },

  // 获取分析结果
  async getAnalysisResult(analysisId: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/analysis/result/${analysisId}`);
      return response.data;
    } catch (error) {
      console.error('获取分析结果失败:', error);
      throw error;
    }
  }
};