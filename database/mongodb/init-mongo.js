// MongoDB初始化脚本
// 创建内容选题助手数据库和集合

// 切换到content-topic-assistant数据库
db = db.getSiblingDB('content-topic-assistant');

// 创建内容集合
db.createCollection('contents');

// 创建分析结果集合
db.createCollection('analysis_results');

// 创建用户集合
db.createCollection('users');

// 创建索引以提高查询性能
db.contents.createIndex({ "source": 1, "created_at": -1 });
db.contents.createIndex({ "title": "text", "content": "text" });
db.analysis_results.createIndex({ "content_id": 1 });
db.analysis_results.createIndex({ "created_at": -1 });
db.users.createIndex({ "email": 1 }, { unique: true });

// 插入初始管理员用户
db.users.insertOne({
  email: "admin@example.com",
  password: "$2b$10$example_hash_password", // 实际部署时需要替换为真正的哈希密码
  role: "admin",
  created_at: new Date(),
  updated_at: new Date()
});

print("MongoDB初始化完成");