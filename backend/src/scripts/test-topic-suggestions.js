const axios = require('axios');

async function testTopicSuggestions() {
  try {
    // 首先登录获取token
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      username: 'testuser', // 使用username而不是email
      password: 'password123'
    });
    
    console.log('登录响应:', JSON.stringify(loginResponse.data, null, 2));
    const token = loginResponse.data.data.token;
    console.log('登录成功，获取到token');
    
    console.log('获取到的token:', token);
    console.log('请求头:', {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    // 使用token调用选题建议API
    const suggestionsResponse = await axios.post(
      'http://localhost:5001/api/analysis/suggestions',
      {
        keywords: ['人工智能'],
        platform: 'tech',
        count: 5
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('选题建议API调用成功');
    console.log('返回数据:', JSON.stringify(suggestionsResponse.data, null, 2));
    
    console.log('响应结构:');
    console.log('- success:', suggestionsResponse.data.success);
    console.log('- data存在:', !!suggestionsResponse.data.data);
    console.log('- suggestions存在:', !!suggestionsResponse.data.data?.suggestions);
    console.log('- suggestions类型:', typeof suggestionsResponse.data.data?.suggestions);
    console.log('- suggestions是否为数组:', Array.isArray(suggestionsResponse.data.data?.suggestions));
    
    // 验证返回数据结构
    if (suggestionsResponse.data.success && Array.isArray(suggestionsResponse.data.data)) {
      console.log('✅ API测试成功');
      console.log('返回建议数量:', suggestionsResponse.data.data.length);
      console.log('第一个建议标题:', suggestionsResponse.data.data[0].title);
    } else {
      console.log('❌ 返回数据结构不符合预期');
    }
    
  } catch (error) {
    console.error('测试失败:', error.response ? error.response.data : error.message);
  }
}

testTopicSuggestions();