import apiClient, { ApiResponse, PaginatedResponse, PaginationParams } from './apiClient';

export interface Topic {
  id: string;
  keyword: string;
  platform: string;
  title: string;
  content: string;
  summary?: string; // 为web平台添加摘要字段
  author: string;
  publishTime: string;
  url: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  heat: number;
}

export interface TopicSearchParams {
  keyword: string;
  platforms: string[]; // 修改为数组格式，与后端匹配
  sort?: string;
  page?: number;
  limit?: number;
  offset?: number;
}

export interface TopicSearchResponse {
  topics: Topic[];
  total: number;
  hasMore: boolean;
}

export const topicService = {
  // 搜索话题
  searchTopics: async (params: TopicSearchParams): Promise<TopicSearchResponse> => {
    // 添加调试日志，检查请求发送前的关键词
    console.log('前端发送搜索请求，原始关键词:', params.keyword);
    console.log('前端发送搜索请求，关键词字符代码:', params.keyword.split('').map(c => c.charCodeAt(0)));
    
    const response = await apiClient.post<ApiResponse<TopicSearchResponse>>('/search/search', params);
    return response.data.data;
  },

  // 获取话题详情
  getTopicById: async (id: string): Promise<Topic> => {
    const response = await apiClient.get<ApiResponse<Topic>>(`/topics/${id}`);
    return response.data.data;
  },

  // 获取用户搜索历史
  getSearchHistory: async (): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<string[]>>('/topics/search-history');
    return response.data.data;
  },

  // 清除搜索历史
  clearSearchHistory: async (): Promise<void> => {
    await apiClient.delete('/topics/search-history');
  },

  // 收藏话题
  favoriteTopic: async (topicId: string): Promise<void> => {
    await apiClient.post(`/topics/${topicId}/favorite`);
  },

  // 取消收藏话题
  unfavoriteTopic: async (topicId: string): Promise<void> => {
    await apiClient.delete(`/topics/${topicId}/favorite`);
  },

  // 获取收藏的话题
  getFavoriteTopics: async (params: PaginationParams): Promise<PaginatedResponse<Topic>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Topic>>>('/topics/favorites', {
      params,
    });
    return response.data.data;
  },

  // 获取热门话题
  getHotTopics: async (platform: string, limit: number = 10): Promise<Topic[]> => {
    const response = await apiClient.get<ApiResponse<Topic[]>>('/topics/hot', {
      params: { platform, limit },
    });
    return response.data.data;
  },
};