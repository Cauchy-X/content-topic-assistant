const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model').User;

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/content-topic-assistant')
  .then(async () => {
    console.log('已连接到MongoDB');
    
    // 查找测试用户
    const testUser = await User.findOne({ username: 'testuser' });
    if (!testUser) {
      console.log('测试用户不存在');
      process.exit(0);
    }
    
    console.log('测试用户信息:', {
      username: testUser.username,
      email: testUser.email,
      passwordHash: testUser.password ? '存在' : '不存在'
    });
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare('password123', testUser.password);
    console.log('密码验证结果:', isPasswordValid ? '正确' : '错误');
    
    if (!isPasswordValid) {
      // 更新密码
      const hashedPassword = await bcrypt.hash('password123', 10);
      testUser.password = hashedPassword;
      await testUser.save();
      console.log('密码已更新');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('连接数据库失败:', err);
    process.exit(1);
  });