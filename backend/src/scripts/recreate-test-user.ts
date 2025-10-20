import mongoose from 'mongoose';
import { User } from '../models/user.model';

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/content-topic-assistant')
  .then(async () => {
    console.log('已连接到MongoDB');
    
    // 删除现有测试用户
    await User.deleteOne({ username: 'testuser' });
    console.log('已删除现有测试用户');
    
    // 创建新的测试用户（让模型自动加密密码）
    const newUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123', // 明文密码，模型会自动加密
      role: 'user',
      subscription: {
        plan: 'free'
      }
    });
    
    await newUser.save();
    console.log('新测试用户创建成功');
    
    // 验证新用户
    const savedUser = await User.findOne({ username: 'testuser' }).select('+password');
    if (!savedUser) {
      console.log('用户创建失败');
      process.exit(1);
    }
    const isPasswordValid = await savedUser.comparePassword('password123');
    console.log('密码验证结果:', isPasswordValid ? '正确' : '错误');
    
    console.log('用户名: testuser');
    console.log('邮箱: test@example.com');
    console.log('密码: password123');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('操作失败:', err);
    process.exit(1);
  });