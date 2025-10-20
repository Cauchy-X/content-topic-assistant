import apiClient, { ApiResponse } from './apiClient';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export const authService = {
  // 用户登录
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    console.log('发送登录请求:', credentials);
    const response = await apiClient.post<ApiResponse<{user: User, token: string}>>('/auth/login', credentials);
    console.log('登录响应:', response.data);
    const { user, token } = response.data.data;
    return {
      user,
      token,
      expiresIn: 3600 // 默认1小时过期时间
    };
  },

  // 用户注册
  register: async (userData: RegisterRequest): Promise<User> => {
    const response = await apiClient.post<ApiResponse<User>>('/auth/register', userData);
    return response.data.data;
  },

  // 获取当前用户信息
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  // 更新用户信息
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await apiClient.put<ApiResponse<User>>('/auth/profile', userData);
    return response.data.data;
  },

  // 修改密码
  changePassword: async (passwordData: { oldPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.post('/auth/change-password', passwordData);
  },

  // 刷新token
  refreshToken: async (): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/refresh');
    return response.data.data;
  },

  // 登出
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};