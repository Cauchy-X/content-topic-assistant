import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/content-topic-assistant')
  .then(async () => {
    console.log('已连接到MongoDB');
    
    // 查找测试用户
    const testUser = await User.findOne({ username: 'testuser' });
    if (!testUser) {
      console.log('测试用户不存在，正在创建...');
      
      // 创建测试用户
      const hashedPassword = await bcrypt.hash('password123', 10);
      const newUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'user',
        subscription: 'free'
      });
      
      await newUser.save();
      console.log('测试用户创建成功');
    } else {
      console.log('测试用户已存在，正在更新密码...');
      
      // 更新密码
      const hashedPassword = await bcrypt.hash('password123', 10);
      testUser.password = hashedPassword;
      await testUser.save();
      console.log('密码已更新');
    }
    
    console.log('用户名: testuser');
    console.log('邮箱: test@example.com');
    console.log('密码: password123');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('操作失败:', err);
    process.exit(1);
  });