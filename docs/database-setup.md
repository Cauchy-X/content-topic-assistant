# 本地数据库设置指南

本文档介绍如何设置和管理内容选题助手的本地数据库环境。

## 数据库架构

内容选题助手使用以下数据库：

- **MongoDB**: 存储爬取的原始内容数据（文档数据库）
- **PostgreSQL**: 存储结构化数据，如用户信息、分析结果等（关系数据库）
- **Redis**: 用作缓存和会话存储（可选）

## 快速开始

### 1. 启动数据库服务

运行以下命令启动所有数据库服务：

```bash
scripts\start-databases.bat
```

或者手动执行：

```bash
docker-compose -f docker-compose.local.yml up -d mongodb postgres redis
```

### 2. 停止数据库服务

运行以下命令停止所有数据库服务：

```bash
scripts\stop-databases.bat
```

或者手动执行：

```bash
docker-compose -f docker-compose.local.yml down
```

## 数据库连接信息

启动后，可以通过以下连接信息访问数据库：

- **MongoDB**: `mongodb://localhost:27017`
- **PostgreSQL**: `postgresql://postgres:password@localhost:5432/content-hub`
- **Redis**: `redis://localhost:6379`

## 数据备份

### 创建备份

运行以下命令创建数据库备份：

```bash
scripts\backup-databases.bat
```

备份文件将保存在 `database\backups` 目录中，按时间戳命名。

### 恢复备份

运行以下命令恢复数据库备份：

```bash
scripts\restore-databases.bat TIMESTAMP
```

其中 `TIMESTAMP` 是备份文件的时间戳，例如：`20231115_143022`

## 环境配置

本地开发环境变量配置文件位于 `.env.local`，包含以下主要配置：

```
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/content-topic-assistant
POSTGRES_URL=postgresql://postgres:password@localhost:5432/content-hub
REDIS_URL=redis://localhost:6379
```

## 数据库初始化脚本

- **MongoDB**: `database\mongodb\init-mongo.js` - 创建集合、索引和初始数据
- **PostgreSQL**: `database\postgresql\init-postgres.sql` - 创建表结构、索引和触发器

## 数据持久化

数据库数据存储在Docker卷中：

- `mongodb_data`: MongoDB数据
- `postgres_data`: PostgreSQL数据
- `redis_data`: Redis数据

这些卷在容器重启后会保留数据。

## 故障排除

### 检查服务状态

```bash
docker-compose -f docker-compose.local.yml ps
```

### 查看日志

```bash
# MongoDB日志
docker-compose -f docker-compose.local.yml logs mongodb

# PostgreSQL日志
docker-compose -f docker-compose.local.yml logs postgres

# Redis日志
docker-compose -f docker-compose.local.yml logs redis
```

### 重置数据库

如果需要完全重置数据库：

```bash
# 停止服务
docker-compose -f docker-compose.local.yml down

# 删除卷（注意：这将删除所有数据）
docker volume rm content-topic-assistant_mongodb_data
docker volume rm content-topic-assistant_postgres_data
docker volume rm content-topic-assistant_redis_data

# 重新启动服务
docker-compose -f docker-compose.local.yml up -d
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