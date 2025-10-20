# 部署指南

本文档提供了内容选题助手项目的详细部署指南。

## 环境要求

- Node.js 16+
- npm 或 yarn
- MongoDB 6.0+
- Git

## 本地开发部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd content-topic-assistant
```

### 2. 安装依赖

#### 前端依赖
```bash
cd frontend
npm install
```

#### 后端依赖
```bash
cd backend
npm install
```

### 3. 配置环境变量

复制环境变量模板文件并根据实际情况修改：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下变量：
- `MONGODB_URI`: MongoDB连接字符串
- `JWT_SECRET`: JWT密钥（生产环境请使用强密钥）
- `DEEPSEEK_API_KEY`: DeepSeek API密钥（可选）
- `DOUBAO_API_KEY`: 豆包API密钥（可选）

### 4. 启动MongoDB

确保MongoDB服务已启动：

```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
# 或
mongod
```

### 5. 启动应用

#### 方法一：使用启动脚本

**Windows:**
```bash
scripts\start.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/start.sh
./scripts/start.sh
```

#### 方法二：手动启动

**启动后端:**
```bash
cd backend
npm run dev
```

**启动前端:**
```bash
cd frontend
npm start
```

### 6. 访问应用

- 前端应用: http://localhost:3000
- 后端API: http://localhost:5000

## Docker部署

### 1. 构建并启动所有服务

```bash
docker-compose up -d
```

### 2. 查看服务状态

```bash
docker-compose ps
```

### 3. 查看日志

```bash
docker-compose logs -f
```

### 4. 停止服务

```bash
docker-compose down
```

## 生产环境部署

### 1. 构建生产版本

#### 前端构建
```bash
cd frontend
npm run build
```

#### 后端构建
```bash
cd backend
npm run build
```

### 2. 使用PM2管理后端进程

```bash
npm install -g pm2
cd backend
pm2 start ecosystem.config.js
```

### 3. 使用Nginx代理前端

创建Nginx配置文件 `/etc/nginx/sites-available/content-topic-assistant`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用站点：
```bash
sudo ln -s /etc/nginx/sites-available/content-topic-assistant /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. 配置SSL证书（推荐）

使用Let's Encrypt免费SSL证书：
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 监控和日志

### 1. 应用监控

使用PM2监控：
```bash
pm2 monit
```

### 2. 日志管理

查看应用日志：
```bash
# PM2日志
pm2 logs

# 应用日志
tail -f logs/app.log
```

### 3. 数据库备份

创建MongoDB备份脚本：
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb://localhost:27017/content-topic-assistant" --out="/backup/mongodb_$DATE"
```

设置定时备份（crontab）：
```bash
0 2 * * * /path/to/backup-script.sh
```

## 故障排除

### 1. 前端无法访问后端API

- 检查后端服务是否启动
- 检查防火墙设置
- 确认API端点配置正确

### 2. MongoDB连接失败

- 确认MongoDB服务已启动
- 检查连接字符串是否正确
- 确认数据库权限设置

### 3. 构建失败

- 清除node_modules并重新安装依赖
- 检查Node.js版本是否符合要求
- 查看构建日志中的具体错误信息

## 性能优化

### 1. 前端优化

- 启用代码分割
- 使用CDN加速静态资源
- 启用Gzip压缩

### 2. 后端优化

- 使用连接池管理数据库连接
- 实现API缓存
- 使用集群模式提高并发处理能力

### 3. 数据库优化

- 创建适当的索引
- 定期清理过期数据
- 使用MongoDB聚合管道优化查询

## 安全建议

1. 使用强密码和密钥
2. 启用HTTPS
3. 定期更新依赖包
4. 实施API访问限制
5. 定期备份数据
6. 监控异常活动