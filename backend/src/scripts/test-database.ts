import { connectAllDatabases, disconnectAllDatabases } from '../config/database';
import { initPgUserModel, PgUserModel } from '../models/pg-user.model';
import { initPgSearchTaskModel, PgSearchTaskModel } from '../models/pg-search-task.model';
import { initPgAnalysisResultModel, PgAnalysisResultModel } from '../models/pg-analysis-result.model';

// 初始化模型实例
let pgUserModel: PgUserModel;
let pgSearchTaskModel: PgSearchTaskModel;
let pgAnalysisResultModel: PgAnalysisResultModel;

async function testDatabaseConnections(): Promise<void> {
  console.log('开始测试数据库连接...');
  
  try {
    // 连接所有数据库
    await connectAllDatabases();
    console.log('✅ 所有数据库连接成功');
    
    // 初始化模型
    pgUserModel = initPgUserModel();
    pgSearchTaskModel = initPgSearchTaskModel();
    pgAnalysisResultModel = initPgAnalysisResultModel();
    
    // 测试PostgreSQL用户模型
    await testPgUserModel();
    
    // 测试PostgreSQL搜索任务模型
    await testPgSearchTaskModel();
    
    // 测试PostgreSQL分析结果模型
    await testPgAnalysisResultModel();
    
    console.log('✅ 所有数据库测试通过');
  } catch (error) {
    console.error('❌ 数据库测试失败:', error);
  } finally {
    // 断开所有数据库连接
    await disconnectAllDatabases();
    console.log('🔌 所有数据库连接已断开');
  }
}

async function testPgUserModel(): Promise<void> {
  console.log('\n🧪 测试PostgreSQL用户模型...');
  
  try {
    // 创建测试用户
    const testUser = await pgUserModel.createUser({
      username: 'test_user',
      email: 'test@example.com',
      password: 'test_password'
    });
    console.log('✅ 用户创建成功:', testUser.username);
    
    // 查询用户
    const foundUser = await pgUserModel.getUserById(testUser.id);
    if (foundUser) {
      console.log('✅ 用户查询成功:', foundUser.email);
    }
    
    // 验证密码
    const isValid = await pgUserModel.validatePassword(testUser, 'test_password');
    console.log('✅ 密码验证:', isValid ? '成功' : '失败');
    
    // 更新用户
    const updatedUser = await pgUserModel.updateUser(testUser.id, {
      username: 'updated_user'
    });
    if (updatedUser) {
      console.log('✅ 用户更新成功:', updatedUser.username);
    }
    
    // 删除测试用户
    const isDeleted = await pgUserModel.deleteUser(testUser.id);
    console.log('✅ 用户删除:', isDeleted ? '成功' : '失败');
  } catch (error) {
    console.error('❌ 用户模型测试失败:', error);
    throw error;
  }
}

async function testPgSearchTaskModel(): Promise<void> {
  console.log('\n🧪 测试PostgreSQL搜索任务模型...');
  
  try {
    // 首先创建一个测试用户
    const testUser = await pgUserModel.createUser({
      username: 'test_task_user',
      email: 'task@example.com',
      password: 'test_password'
    });
    
    // 创建测试搜索任务
    const testTask = await pgSearchTaskModel.createSearchTask({
      keyword: '人工智能',
      platforms: ['知乎', '微博'],
      user_id: testUser.id
    });
    console.log('✅ 搜索任务创建成功:', testTask.keyword);
    
    // 查询搜索任务
    const foundTask = await pgSearchTaskModel.getSearchTaskById(testTask.id);
    if (foundTask) {
      console.log('✅ 搜索任务查询成功:', foundTask.keyword);
    }
    
    // 更新搜索任务
    const updatedTask = await pgSearchTaskModel.updateSearchTask(testTask.id, {
      status: 'completed'
    });
    if (updatedTask) {
      console.log('✅ 搜索任务更新成功:', updatedTask.status);
    }
    
    // 删除测试搜索任务
    const isDeleted = await pgSearchTaskModel.deleteSearchTask(testTask.id);
    console.log('✅ 搜索任务删除:', isDeleted ? '成功' : '失败');
    
    // 删除测试用户
    await pgUserModel.deleteUser(testUser.id);
  } catch (error) {
    console.error('❌ 搜索任务模型测试失败:', error);
    throw error;
  }
}

async function testPgAnalysisResultModel(): Promise<void> {
  console.log('\n🧪 测试PostgreSQL分析结果模型...');
  
  try {
    // 首先创建测试用户和搜索任务
    const testUser = await pgUserModel.createUser({
      username: 'test_analysis_user',
      email: 'analysis@example.com',
      password: 'test_password'
    });
    
    const testTask = await pgSearchTaskModel.createSearchTask({
      keyword: '区块链',
      platforms: ['知乎', 'B站'],
      user_id: testUser.id
    });
    
    // 创建测试分析结果
    const testResult = await pgAnalysisResultModel.createAnalysisResult({
      search_task_id: testTask.id,
      user_id: testUser.id,
      topic_directions: ['技术发展', '应用场景'],
      user_concerns: ['隐私安全', '就业影响'],
      sentiment_analysis: {
        positive: 0.6,
        negative: 0.2,
        neutral: 0.2
      },
      topic_suggestions: [{
        title: '区块链在金融领域的应用',
        angle: '技术前沿',
        reason: '结合最新技术发展',
        content_outline: ['技术原理', '应用案例', '未来展望']
      }]
    });
    console.log('✅ 分析结果创建成功，主题方向数量:', testResult.topic_directions.length);
    
    // 查询分析结果
    const foundResult = await pgAnalysisResultModel.getAnalysisResultById(testResult.id);
    if (foundResult) {
      console.log('✅ 分析结果查询成功，主题建议数量:', foundResult.topic_suggestions.length);
    }
    
    // 更新分析结果
    const updatedResult = await pgAnalysisResultModel.updateAnalysisResult(testResult.id, {
      topic_directions: ['技术发展', '应用场景', '未来趋势']
    });
    if (updatedResult) {
      console.log('✅ 分析结果更新成功，主题方向数量:', updatedResult.topic_directions.length);
    }
    
    // 删除测试分析结果
    const isDeleted = await pgAnalysisResultModel.deleteAnalysisResult(testResult.id);
    console.log('✅ 分析结果删除:', isDeleted ? '成功' : '失败');
    
    // 删除测试搜索任务和用户
    await pgSearchTaskModel.deleteSearchTask(testTask.id);
    await pgUserModel.deleteUser(testUser.id);
  } catch (error) {
    console.error('❌ 分析结果模型测试失败:', error);
    throw error;
  }
}

// 运行测试
testDatabaseConnections().catch(console.error);