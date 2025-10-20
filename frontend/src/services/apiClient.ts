import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api',
  timeout: 30000, // 增加超时时间到30秒
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加请求日志
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 添加调试日志，检查请求发送前的数据
    if (config.url?.includes('/search/search')) {
      console.log('axios请求拦截器 - 请求URL:', config.url);
      console.log('axios请求拦截器 - 请求方法:', config.method);
      console.log('axios请求拦截器 - 请求头:', config.headers);
      console.log('axios请求拦截器 - 请求体:', config.data);
      if (config.data && config.data.keyword) {
        console.log('axios请求拦截器 - 关键词:', config.data.keyword);
        console.log('axios请求拦截器 - 关键词字符代码:', config.data.keyword.split('').map((c: string) => c.charCodeAt(0)));
      }
    }
    
    // 添加对选题建议请求的调试日志
    if (config.url?.includes('/analysis/suggestions')) {
      console.log('axios请求拦截器 - 选题建议请求URL:', config.url);
      console.log('axios请求拦截器 - 选题建议请求方法:', config.method);
      console.log('axios请求拦截器 - 选题建议请求头:', config.headers);
      console.log('axios请求拦截器 - 选题建议请求体:', config.data);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理通用错误
apiClient.interceptors.response.use(
  (response) => {
    // 检查响应数据结构
    console.log('API响应结构:', response.data);
    
    // 添加对选题建议响应的调试日志
    if (response.config.url?.includes('/analysis/suggestions')) {
      console.log('axios响应拦截器 - 选题建议响应状态:', response.status);
      console.log('axios响应拦截器 - 选题建议响应数据:', response.data);
      console.log('axios响应拦截器 - 选题建议响应数据类型:', typeof response.data);
      console.log('axios响应拦截器 - 选题建议响应是否为数组:', Array.isArray(response.data));
      
      if (response.data && response.data.data) {
        console.log('axios响应拦截器 - 选题建议data字段:', response.data.data);
        console.log('axios响应拦截器 - 选题建议data字段类型:', typeof response.data.data);
        console.log('axios响应拦截器 - 选题建议data字段是否为数组:', Array.isArray(response.data.data));
      }
    }
    
    // 如果响应包含success字段且为false，抛出错误
    if (response.data && response.data.success === false) {
      const errorMessage = response.data.error || '请求失败';
      console.error('API返回错误:', errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
    
    return response;
  },
  (error) => {
    console.error('API请求错误:', error);
    
    // 添加对选题建议错误的调试日志
    if (error.config?.url?.includes('/analysis/suggestions')) {
      console.error('axios响应拦截器 - 选题建议请求错误:', error);
      console.error('axios响应拦截器 - 选题建议错误状态:', error.response?.status);
      console.error('axios响应拦截器 - 选题建议错误数据:', error.response?.data);
    }
    
    if (error.response) {
      // 服务器返回了错误状态码
      const status = error.response.status;
      
      if (status === 403) {
        // 权限不足
        error.message = '权限不足，无法访问此资源';
      } else if (status === 404) {
        // 资源不存在
        error.message = '请求的资源不存在';
      } else if (status === 500) {
        // 服务器内部错误
        error.message = '服务器内部错误，请稍后重试';
      } else {
        // 其他错误
        error.message = error.response.data?.message || `请求失败 (${status})`;
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      error.message = '网络连接失败，请检查网络设置';
    } else {
      // 请求配置出错
      error.message = '请求配置错误';
    }
    
    return Promise.reject(error);
  }
);

// 通用API响应接口
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

// 分页请求参数接口
export interface PaginationParams {
  page: number;
  size: number;
}

// 分页响应接口
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export default apiClient;