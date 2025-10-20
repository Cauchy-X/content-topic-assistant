# 数据库开发指南

本文档介绍内容主题助手项目的数据库架构、模型和操作方法。

## 数据库架构

项目使用三种数据库系统：

1. **MongoDB** - 存储非结构化数据，如搜索结果缓存
2. **PostgreSQL** - 存储结构化数据，如用户信息、搜索任务、分析结果
3. **Redis** - 缓存和会话存储

## PostgreSQL 数据模型

### 用户模型 (PgUser)

位置: `src/models/pg-user.model.ts`

功能:
- 用户注册、登录、认证
- 用户信息管理
- 密码加密和验证

主要方法:
- `createUser()` - 创建新用户
- `getUserById()` - 根据ID获取用户
- `getUserByEmail()` - 根据邮箱获取用户
- `validatePassword()` - 验证用户密码
- `updateUser()` - 更新用户信息
- `deleteUser()` - 删除用户

### 搜索任务模型 (PgSearchTask)

位置: `src/models/pg-search-task.model.ts`

功能:
- 创建和管理搜索任务
- 跟踪任务状态
- 按用户和状态查询任务

主要方法:
- `createSearchTask()` - 创建新搜索任务
- `getSearchTaskById()` - 根据ID获取任务
- `getSearchTasksByUserId()` - 获取用户的搜索任务
- `updateSearchTask()` - 更新任务状态
- `deleteSearchTask()` - 删除任务

### 分析结果模型 (PgAnalysisResult)

位置: `src/models/pg-analysis-result.model.ts`

功能:
- 存储内容分析结果
- 主题方向和建议管理
- 情感分析数据

主要方法:
- `createAnalysisResult()` - 创建新分析结果
- `getAnalysisResultById()` - 根据ID获取结果
- `getAnalysisResultBySearchTaskId()` - 获取搜索任务的分析结果
- `updateAnalysisResult()` - 更新分析结果
- `getPopularTopicDirections()` - 获取热门话题方向

## 数据库连接配置

数据库连接配置位于 `src/config/database.ts`:

- `connectDB()` - 连接MongoDB
- `connectPostgresDB()` - 连接PostgreSQL
- `connectAllDatabases()` - 连接所有数据库
- `initPostgresDB()` - 初始化PostgreSQL表结构

## 数据库初始化

PostgreSQL表结构初始化脚本位于 `src/config/postgres-init.sql`，包含:
- 表结构定义
- 索引创建
- 触发器设置
- 示例数据
- 视图创建

## 测试数据库

运行数据库测试:

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 运行数据库测试
npx ts-node src/scripts/test-database.ts
```

测试脚本将验证:
- 数据库连接
- 用户模型操作
- 搜索任务模型操作
- 分析结果模型操作

## 环境配置

在 `.env` 文件中配置数据库连接:

```
# MongoDB
MONGODB_URI=mongodb://localhost:27017/content-topic-assistant

# PostgreSQL
POSTGRES_URL=postgresql://postgres:password@localhost:5432/content-hub

# Redis
REDIS_URL=redis://localhost:6379
```

## 使用示例

### 创建用户

```typescript
import { pgUserModel } from './models/pg-user.model';

const user = await pgUserModel.createUser({
  username: 'newuser',
  email: 'user@example.com',
  password: 'securepassword'
});
```

### 创建搜索任务

```typescript
import { pgSearchTaskModel } from './models/pg-search-task.model';

const task = await pgSearchTaskModel.createSearchTask({
  keyword: '人工智能',
  platforms: ['知乎', '微博'],
  user_id: user.id
});
```

### 创建分析结果

```typescript
import { pgAnalysisResultModel } from './models/pg-analysis-result.model';

const result = await pgAnalysisResultModel.createAnalysisResult({
  search_task_id: task.id,
  user_id: user.id,
  topic_directions: ['技术发展', '应用场景'],
  user_concerns: ['隐私安全', '就业影响'],
  sentiment_analysis: {
    positive: 0.6,
    negative: 0.2,
    neutral: 0.2
  },
  topic_suggestions: [{
    title: '人工智能在医疗领域的应用',
    angle: '技术前沿',
    reason: '结合最新技术发展',
    content_outline: ['技术原理', '应用案例', '未来展望']
  }]
});
```

## 故障排除

### 连接问题

1. 确保数据库服务已启动
2. 检查连接字符串配置
3. 验证网络连接和防火墙设置

### 初始化问题

1. 确保PostgreSQL用户有创建表的权限
2. 检查数据库是否存在
3. 验证SQL脚本语法

### 性能优化

1. 定期分析查询性能
2. 优化索引使用
3. 考虑数据分区和归档策略