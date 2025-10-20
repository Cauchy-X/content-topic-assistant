import { logger } from '../utils/logger';

// 测试环境变量加载
export function testEnvVariables(): void {
  console.log('=== 环境变量测试开始 ===');
  
  // 直接检查process.env中的值
  console.log('1. 直接检查process.env:');
  console.log('   process.env.DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '已配置' : '未配置');
  console.log('   process.env.DOUBAO_API_KEY:', process.env.DOUBAO_API_KEY ? '已配置' : '未配置');
  console.log('   process.env.DOUBAO_MODEL_ID:', process.env.DOUBAO_MODEL_ID || '未配置');
  
  // 通过中间变量检查
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const doubaoKey = process.env.DOUBAO_API_KEY;
  const doubaoModel = process.env.DOUBAO_MODEL_ID;
  
  console.log('\n2. 通过中间变量检查:');
  console.log('   deepseekKey:', deepseekKey ? `已配置 (长度: ${deepseekKey.length})` : '未配置');
  console.log('   doubaoKey:', doubaoKey ? `已配置 (长度: ${doubaoKey.length})` : '未配置');
  console.log('   doubaoModel:', doubaoModel || '未配置');
  
  // 输出实际值的前几个字符（用于验证）
  if (deepseekKey) {
    console.log('   DEEPSEEK_API_KEY前5位:', deepseekKey.substring(0, 5) + '...');
  }

  if (doubaoKey) {
    console.log('   DOUBAO_API_KEY前5位:', doubaoKey.substring(0, 5) + '...');
  }
  
  // 检查AI_CONFIG对象
  const AI_CONFIG = {
    deepseek: {
      apiKey: deepseekKey,
      model: 'deepseek-chat'
    },
    doubao: {
      apiKey: doubaoKey,
      model: doubaoModel || 'doubao-pro-4k'
    }
  };
  
  console.log('\n3. AI_CONFIG对象:');
  console.log('   AI_CONFIG.deepseek.apiKey:', AI_CONFIG.deepseek.apiKey ? '已配置' : '未配置');
  console.log('   AI_CONFIG.doubao.apiKey:', AI_CONFIG.doubao.apiKey ? '已配置' : '未配置');
  console.log('   AI_CONFIG.deepseek.model:', AI_CONFIG.deepseek.model);
  console.log('   AI_CONFIG.doubao.model:', AI_CONFIG.doubao.model);
  
  // 检查dotenv是否正确加载
  console.log('\n4. dotenv配置检查:');
  console.log('   NODE_ENV:', process.env.NODE_ENV || '未设置');
  console.log('   PORT:', process.env.PORT || '未设置');
  
  // 检查当前工作目录
  console.log('\n5. 当前工作目录:', process.cwd());
  
  console.log('=== 环境变量测试结束 ===\n');
}