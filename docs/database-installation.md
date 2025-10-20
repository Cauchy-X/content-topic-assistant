# 本地数据库安装指南

本指南将帮助您在Windows系统上安装和配置内容选题助手所需的数据库。

## 方案一：使用Docker Desktop（推荐）

Docker是最简单、最快速的部署方式，可以在容器中运行所有数据库服务。

### 1. 安装Docker Desktop

1. 访问 [Docker Desktop官网](https://www.docker.com/products/docker-desktop/)
2. 下载Windows版本的Docker Desktop
3. 运行安装程序，按照提示完成安装
4. 重启计算机
5. 启动Docker Desktop，确保其正在运行

### 2. 启动数据库服务

安装完成后，打开命令提示符或PowerShell，导航到项目根目录：

```bash
cd d:\python-code\content-topic-assistant
```

运行以下命令启动数据库服务：

```bash
docker compose -f docker-compose.local.yml up -d mongodb postgres redis
```

### 3. 验证安装

运行以下命令检查服务状态：

```bash
docker compose -f docker-compose.local.yml ps
```

您应该看到mongodb、postgres和redis三个服务都在运行。

## 方案二：手动安装数据库

如果您不想使用Docker，可以手动安装各个数据库。

### 1. 安装MongoDB

1. 访问 [MongoDB Community Server下载页面](https://www.mongodb.com/try/download/community)
2. 选择Windows版本，下载MSI安装包
3. 运行安装程序，选择"Complete"安装
4. 在安装过程中，勾选"Install MongoDB as a Service"和"Install MongoDB Compass"
5. 完成安装后，MongoDB服务将自动启动

### 2. 安装PostgreSQL

1. 访问 [PostgreSQL官网](https://www.postgresql.org/download/windows/)
2. 下载Windows版本的PostgreSQL安装包
3. 运行安装程序，按照提示完成安装
4. 记住您设置的超级用户密码（默认为postgres）
5. 安装完成后，确保PostgreSQL服务正在运行

### 3. 安装Redis（可选）

Redis主要用于缓存，是可选组件。

1. 访问 [Redis for Windows下载页面](https://github.com/microsoftarchive/redis/releases)
2. 下载最新的.msi文件
3. 运行安装程序，按照提示完成安装
4. 安装完成后，Redis服务将自动启动

### 4. 初始化数据库

#### MongoDB初始化

1. 打开MongoDB Compass
2. 创建新连接，连接字符串为：`mongodb://localhost:27017`
3. 创建名为`content-topic-assistant`的数据库
4. 执行`database\mongodb\init-mongo.js`中的脚本

#### PostgreSQL初始化

1. 打开pgAdmin（随PostgreSQL安装）
2. 连接到本地PostgreSQL服务器
3. 创建名为`content-hub`的数据库
4. 执行`database\postgresql\init-postgres.sql`中的脚本

## 方案三：使用便携版数据库

如果您不想在系统上安装数据库，可以使用便携版。

### 1. 下载便携版MongoDB

1. 访问 [MongoDB下载页面](https://www.mongodb.com/try/download/community)
2. 选择Windows ZIP版本
3. 解压到`d:\python-code\content-topic-assistant\database\mongodb`目录
4. 创建数据目录：`mkdir d:\python-code\content-topic-assistant\database\mongodb\data`
5. 启动MongoDB：
   ```bash
   cd d:\python-code\content-topic-assistant\database\mongodb\bin
   mongod --dbpath ..\data --port 27017
   ```

### 2. 下载便携版PostgreSQL

1. 访问 [PostgreSQL便携版下载页面](https://www.enterprisedb.com/download-postgresql-binaries)
2. 下载Windows ZIP版本
3. 解压到`d:\python-code\content-topic-assistant\database\postgresql`目录
4. 初始化数据库：
   ```bash
   cd d:\python-code\content-topic-assistant\database\postgresql\bin
   initdb -D ..\data
   ```
5. 启动PostgreSQL：
   ```bash
   pg_ctl -D ..\data -l logfile start
   ```

## 环境配置

无论您选择哪种安装方式，都需要更新`.env.local`文件中的数据库连接信息：

```
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/content-topic-assistant
POSTGRES_URL=postgresql://postgres:password@localhost:5432/content-hub
REDIS_URL=redis://localhost:6379
```

## 验证安装

1. 检查MongoDB连接：
   ```bash
   mongo mongodb://localhost:27017/content-topic-assistant
   ```

2. 检查PostgreSQL连接：
   ```bash
   psql -U postgres -h localhost -p 5432 -d content-hub
   ```

3. 检查Redis连接：
   ```bash
   redis-cli -p 6379 ping
   ```

## 故障排除

### MongoDB常见问题

1. **服务无法启动**：检查27017端口是否被占用
2. **连接被拒绝**：确保MongoDB服务正在运行

### PostgreSQL常见问题

1. **认证失败**：检查用户名和密码是否正确
2. **连接被拒绝**：确保PostgreSQL服务正在运行，端口5432未被占用

### Redis常见问题

1. **连接被拒绝**：确保Redis服务正在运行，端口6379未被占用

## 推荐方案

对于开发环境，我们强烈推荐使用Docker Desktop方案，因为：

1. 安装简单，一键启动所有服务
2. 环境隔离，不会影响系统
3. 易于管理和备份
4. 与生产环境一致

如果您已经安装了Docker Desktop，请返回"本地数据库设置指南"文档，按照"快速开始"部分启动数据库服务。