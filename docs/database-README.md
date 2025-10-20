# 内容选题助手 - 本地数据库构建指南

本指南将帮助您在本地环境中构建内容选题助手所需的数据库系统。

## 数据库架构

内容选题助手使用以下数据库系统：

- **MongoDB**: 存储爬取的原始内容数据（文档数据库）
- **PostgreSQL**: 存储结构化数据，如用户信息、分析结果等（关系数据库）
- **Redis**: 用作缓存和会话存储（可选）

## 快速开始

### 选项1：使用Docker（推荐）

1. 安装Docker Desktop（参考：[database-installation.md](docs/database-installation.md)）
2. 运行启动脚本：
   ```bash
   scripts\start-databases.bat
   ```

### 选项2：手动安装

1. 安装MongoDB、PostgreSQL和Redis（参考：[database-installation.md](docs/database-installation.md)）
2. 运行初始化脚本：
   ```bash
   scripts\init-databases.bat
   ```

## 文件结构

```
content-topic-assistant/
├── database/
│   ├── mongodb/
│   │   └── init-mongo.js          # MongoDB初始化脚本
│   └── postgresql/
│       └── init-postgres.sql      # PostgreSQL初始化脚本
├── scripts/
│   ├── start-databases.bat        # 启动数据库服务（Docker）
│   ├── stop-databases.bat         # 停止数据库服务（Docker）
│   ├── init-databases.bat         # 初始化数据库（无Docker）
│   ├── backup-databases.bat       # 备份数据库
│   └── restore-databases.bat      # 恢复数据库
├── docs/
│   ├── database-setup.md          # 数据库设置指南
│   └── database-installation.md   # 数据库安装指南
├── .env.local                     # 本地环境变量配置
└── docker-compose.local.yml       # Docker Compose配置
```

## 数据库连接信息

- **MongoDB**: `mongodb://localhost:27017/content-topic-assistant`
- **PostgreSQL**: `postgresql://postgres:password@localhost:5432/content-hub`
- **Redis**: `redis://localhost:6379`

## 环境配置

确保应用程序的`.env.local`文件包含正确的数据库连接信息：

```
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/content-topic-assistant
POSTGRES_URL=postgresql://postgres:password@localhost:5432/content-hub
REDIS_URL=redis://localhost:6379
```

## 数据管理

### 备份数据库

```bash
scripts\backup-databases.bat
```

### 恢复数据库

```bash
scripts\restore-databases.bat TIMESTAMP
```

## 开发工具连接

### MongoDB

可以使用MongoDB Compass连接到本地MongoDB实例：
- 连接字符串: `mongodb://localhost:27017`
- 数据库: `content-topic-assistant`

### PostgreSQL

可以使用pgAdmin或DBeaver连接到本地PostgreSQL实例：
- 主机: `localhost`
- 端口: `5432`
- 数据库: `content-hub`
- 用户名: `postgres`
- 密码: `password`

### Redis

可以使用RedisInsight连接到本地Redis实例：
- 主机: `localhost`
- 端口: `6379`

## 故障排除

1. **服务无法启动**：检查端口是否被占用
2. **连接被拒绝**：确保数据库服务正在运行
3. **认证失败**：检查用户名和密码是否正确

更多详细信息，请参考：
- [数据库设置指南](docs/database-setup.md)
- [数据库安装指南](docs/database-installation.md)

## 下一步

数据库构建完成后，您可以：

1. 启动后端服务
2. 启动前端服务
3. 开始使用内容选题助手

如有任何问题，请参考文档或联系开发团队。