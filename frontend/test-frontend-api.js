// 测试前端API调用
const axios = require('axios');

// 模拟localStorage
const mockLocalStorage = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjNiYjVkOTZjMDJlOTQ3NWM4NDIxMiIsImlhdCI6MTc2MDgwNDIxNSwiZXhwIjoxNzYxNDA5MDE1fQ.4f1PUwwyvLHa65AJ8IE7XoLiK9QSL532MPzGXHsFl_8'
};

// 创建axios实例，模拟前端apiClient
const apiClient = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加请求拦截器
apiClient.interceptors.request.use((config) => {
  const token = mockLocalStorage.token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 添加响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('API响应结构:', response.data);
    
    if (response.data && response.data.success === false) {
      const errorMessage = response.data.error || '请求失败';
      console.error('API返回错误:', errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
    
    return response;
  },
  (error) => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

// 模拟前端的generateSuggestions函数
const generateSuggestions = async (params) => {
  try {
    console.log('发送选题建议请求，参数:', params);
    const response = await apiClient.post('/analysis/suggestions', params);
    console.log('选题建议原始响应:', response);
    console.log('响应数据:', response.data);
    console.log('响应数据类型:', typeof response.data);
    
    // 检查响应结构
    if (!response.data) {
      console.error('响应数据为空');
      throw new Error('响应数据为空');
    }
    
    // 检查success字段
    if (response.data.success === false) {
      const errorMsg = response.data.error || '请求失败';
      console.error('API返回错误:', errorMsg);
      throw new Error(errorMsg);
    }
    
    // 检查data字段
    if (!response.data.data) {
      console.error('响应中缺少data字段');
      throw new Error('响应中缺少data字段');
    }
    
    const suggestions = response.data.data;
    console.log('解析的选题建议:', suggestions);
    console.log('选题建议类型:', typeof suggestions);
    console.log('是否为数组:', Array.isArray(suggestions));
    
    // 确保返回的是数组
    if (!Array.isArray(suggestions)) {
      console.error('选题建议不是数组:', suggestions);
      throw new Error('选题建议格式错误');
    }
    
    return suggestions;
  } catch (error) {
    console.error('生成选题建议失败:', error);
    throw error;
  }
};

// 测试函数
const testTopicSuggestions = async () => {
  try {
    console.log('=== 开始测试选题建议API ===');
    
    // 模拟前端请求参数
    const params = {
      keywords: ['人工智能'],
      platform: 'tech',
      count: 5
    };
    
    // 调用API
    const suggestions = await generateSuggestions(params);
    
    console.log('=== API调用成功 ===');
    console.log('建议数量:', suggestions.length);
    
    if (suggestions.length > 0) {
      console.log('第一个建议:');
      console.log('- 标题:', suggestions[0].title);
      console.log('- 分类:', suggestions[0].category);
      console.log('- 难度:', suggestions[0].difficulty);
      console.log('- 热度:', suggestions[0].popularity);
      console.log('- 竞争程度:', suggestions[0].competitionLevel);
      console.log('- 描述:', suggestions[0].description);
    }
    
    console.log('=== 测试完成 ===');
  } catch (error) {
    console.error('测试失败:', error.message);
  }
};

// 运行测试
testTopicSuggestions();