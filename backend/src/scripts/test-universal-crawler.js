const axios = require('axios');
const { searchContent } = require('../src/services/search.service');
const { crawlUrlContent, batchCrawlUrls } = require('../src/services/search.service');

// 测试配置
const API_BASE_URL = 'http://localhost:3000/api';
const TEST_KEYWORD = '人工智能';
const TEST_URL = 'https://www.zhihu.com/question/123456789'; // 测试URL

// 测试用例
async function testWebSearch() {
  console.log('=== 测试全网搜索功能 ===');
  try {
    const platforms = ['web', 'weibo', 'zhihu'];
    const results = await searchContent(TEST_KEYWORD, platforms, 10, 0);
    
    console.log(`搜索关键词: ${TEST_KEYWORD}`);
    console.log(`搜索平台: ${platforms.join(', ')}`);
    console.log(`结果数量: ${results.length}`);
    
    // 按平台分组显示结果
    const resultsByPlatform = {};
    results.forEach(item => {
      if (!resultsByPlatform[item.platform]) {
        resultsByPlatform[item.platform] = [];
      }
      resultsByPlatform[item.platform].push(item);
    });
    
    Object.keys(resultsByPlatform).forEach(platform => {
      console.log(`\n${platform} 平台结果 (${resultsByPlatform[platform].length}条):`);
      resultsByPlatform[platform].slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title}`);
        console.log(`     URL: ${item.url}`);
        console.log(`     作者: ${item.author || '未知'}`);
      });
    });
    
    return { success: true, count: results.length };
  } catch (error) {
    console.error('全网搜索测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

async function testUrlCrawl() {
  console.log('\n=== 测试URL深度爬取功能 ===');
  try {
    const result = await crawlUrlContent(TEST_URL, false);
    
    if (result) {
      console.log(`爬取URL: ${TEST_URL}`);
      console.log(`标题: ${result.title}`);
      console.log(`内容长度: ${result.content ? result.content.length : 0} 字符`);
      console.log(`作者: ${result.author || '未知'}`);
      console.log(`平台: ${result.platform || '未知'}`);
      console.log(`图片数量: ${result.images ? result.images.length : 0}`);
      console.log(`链接数量: ${result.links ? result.links.length : 0}`);
      
      return { success: true, title: result.title };
    } else {
      console.log('无法获取URL内容');
      return { success: false, error: '无法获取URL内容' };
    }
  } catch (error) {
    console.error('URL爬取测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

async function testBatchCrawl() {
  console.log('\n=== 测试批量URL爬取功能 ===');
  try {
    const testUrls = [
      'https://www.zhihu.com/question/123456789',
      'https://www.zhihu.com/question/987654321',
      'https://example.com/article/1'
    ];
    
    const results = await batchCrawlUrls(testUrls, false);
    
    console.log(`批量爬取URLs数量: ${testUrls.length}`);
    console.log(`成功爬取数量: ${results.length}`);
    
    results.forEach((result, index) => {
      console.log(`\nURL ${index + 1}: ${result.url}`);
      console.log(`  标题: ${result.title}`);
      console.log(`  内容长度: ${result.content ? result.content.length : 0} 字符`);
    });
    
    return { success: true, count: results.length };
  } catch (error) {
    console.error('批量爬取测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

async function testApiEndpoints() {
  console.log('\n=== 测试API端点 ===');
  
  try {
    // 测试搜索API
    console.log('测试搜索API...');
    const searchResponse = await axios.post(`${API_BASE_URL}/search`, {
      keyword: TEST_KEYWORD,
      platforms: ['web', 'zhihu'],
      limit: 5
    }, {
      headers: {
        'Authorization': 'Bearer test-token', // 需要替换为有效token
        'Content-Type': 'application/json'
      }
    });
    
    if (searchResponse.data.success) {
      console.log(`搜索API测试成功，返回${searchResponse.data.data.topics.length}条结果`);
    } else {
      console.log('搜索API测试失败:', searchResponse.data.error);
    }
    
    // 测试URL爬取API
    console.log('\n测试URL爬取API...');
    const crawlResponse = await axios.post(`${API_BASE_URL}/crawl`, {
      url: TEST_URL,
      usePuppeteer: false
    }, {
      headers: {
        'Authorization': 'Bearer test-token', // 需要替换为有效token
        'Content-Type': 'application/json'
      }
    });
    
    if (crawlResponse.data.success) {
      console.log(`URL爬取API测试成功，标题: ${crawlResponse.data.data.title}`);
    } else {
      console.log('URL爬取API测试失败:', crawlResponse.data.error);
    }
    
    return { success: true };
  } catch (error) {
    console.error('API端点测试失败:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始全网爬虫功能测试...\n');
  
  const results = {
    webSearch: await testWebSearch(),
    urlCrawl: await testUrlCrawl(),
    batchCrawl: await testBatchCrawl(),
    apiEndpoints: await testApiEndpoints()
  };
  
  console.log('\n=== 测试结果汇总 ===');
  Object.keys(results).forEach(test => {
    const result = results[test];
    console.log(`${test}: ${result.success ? '✅ 成功' : '❌ 失败'}`);
    if (!result.success) {
      console.log(`  错误: ${result.error}`);
    }
  });
  
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n总体结果: ${successCount}/${totalTests} 测试通过`);
  
  if (successCount === totalTests) {
    console.log('🎉 所有测试通过！全网爬虫功能正常工作。');
  } else {
    console.log('⚠️ 部分测试失败，请检查相关功能。');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testWebSearch,
  testUrlCrawl,
  testBatchCrawl,
  testApiEndpoints,
  runAllTests
};