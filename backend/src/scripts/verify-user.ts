import mongoose from 'mongoose';
import { User } from '../models/user.model';

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/content-topic-assistant')
  .then(async () => {
    console.log('已连接到MongoDB');
    
    // 查找测试用户（包含密码字段）
    const testUser = await User.findOne({ username: 'testuser' }).select('+password');
    if (!testUser) {
      console.log('测试用户不存在');
      process.exit(0);
    }
    
    console.log('测试用户信息:', {
      username: testUser.username,
      email: testUser.email,
      passwordHash: testUser.password ? '存在' : '不存在',
      passwordLength: testUser.password ? testUser.password.length : 0
    });
    
    // 验证密码
    const isPasswordValid = await testUser.comparePassword('password123');
    console.log('密码验证结果:', isPasswordValid ? '正确' : '错误');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('操作失败:', err);
    process.exit(1);
  });