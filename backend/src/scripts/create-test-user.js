const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model').User;

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/content-topic-assistant')
  .then(async () => {
    console.log('已连接到MongoDB');
    
    // 检查是否已存在测试用户
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('测试用户已存在');
      process.exit(0);
    }
    
    // 创建测试用户
    const hashedPassword = await bcrypt.hash('password123', 10);
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'user',
      subscription: 'free'
    });
    
    await testUser.save();
    console.log('测试用户创建成功');
    console.log('用户名: testuser');
    console.log('邮箱: test@example.com');
    console.log('密码: password123');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('连接数据库失败:', err);
    process.exit(1);
  });