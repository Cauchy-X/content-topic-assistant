const axios = require('axios');

// 测试API客户端
async function testAPIClient() {
  try {
    console.log('测试选题建议API...');
    
    const response = await axios.post('http://localhost:5001/api/analysis/suggestions', {
      keywords: ['人工智能'],
      platform: '小红书',
      count: 5
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data && Array.isArray(response.data.data)) {
      console.log('成功获取建议:', response.data.data.length, '条');
      response.data.data.forEach((suggestion, index) => {
        console.log(`建议${index + 1}:`, suggestion.title);
      });
    } else {
      console.error('响应格式不正确');
    }
  } catch (error) {
    console.error('API请求失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testAPIClient();