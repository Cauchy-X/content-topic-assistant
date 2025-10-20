// 通用API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

// 分页响应类型
export interface PaginatedResponse<T = any> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
  code?: number;
}

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

// 内容类型枚举
export enum ContentType {
  ARTICLE = 'article',
  VIDEO = 'video',
  SOCIAL = 'social',
  OTHER = 'other',
}

// 平台枚举
export enum Platform {
  ZHIHU = 'zhihu',
  WEIBO = 'weibo',
  XIAOHONGSHU = 'xiaohongshu',
  DOUYIN = 'douyin',
  WEB = 'web',
  ALL = 'all',
}

// 排序方式枚举
export enum SortType {
  HOT = 'hot',
  NEW = 'new',
  COMMENTS = 'comments',
  LIKES = 'likes',
}

// 分析类型枚举
export enum AnalysisType {
  ALL = 'all',
  ANALYSIS = 'analysis',
  SUGGESTIONS = 'suggestions',
  OUTLINE = 'outline',
}

// 路由路径常量
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  TOPIC_SEARCH: '/topic-search',
  CONTENT_ANALYSIS: '/content-analysis',
  NOT_FOUND: '/404',
} as const;

// API端点常量
export const API_ENDPOINTS = {
  // 认证相关
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  CURRENT_USER: '/api/auth/me',
  LOGOUT: '/api/auth/logout',
  
  // 话题相关
  SEARCH_TOPICS: '/api/topics/search',
  GET_TOPIC_DETAIL: '/api/topics/:id',
  GET_HOT_TOPICS: '/api/topics/hot',
  
  // 分析相关
  ANALYZE_CONTENT: '/api/analysis/content',
  GENERATE_SUGGESTIONS: '/api/analysis/suggestions',
  GENERATE_OUTLINE: '/api/analysis/outline',
} as const;

// 本地存储键名常量
export const STORAGE_KEYS = {
  TOKEN: 'content_topic_assistant_token',
  USER: 'content_topic_assistant_user',
  THEME: 'content_topic_assistant_theme',
} as const;