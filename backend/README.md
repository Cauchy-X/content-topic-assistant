# 内容选题助手后端 API

这是一个基于 Node.js 和 Express 的后端服务，为内容选题助手提供 API 支持。

## 功能特性

- 用户认证和授权
- 多平台内容搜索（微博、抖音、小红书、知乎）
- AI 内容分析（使用 DeepSeek 和 Doubao 模型）
- 搜索和分析历史记录
- RESTful API 设计

## 技术栈

- Node.js
- Express.js
- TypeScript
- MongoDB
- JWT 认证
- Winston 日志

## 安装和运行

### 环境要求

- Node.js >= 14.0.0
- MongoDB >= 4.4
- npm >= 6.0.0

### 安装依赖

```bash
npm install
```

### 环境配置

复制 `.env.example` 文件为 `.env` 并配置以下环境变量：

```env
NODE_ENV=development
PORT=3001

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/content-topic-assistant

# JWT 配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Redis 配置（可选）
REDIS_URL=redis://localhost:6379

# AI 模型配置
DEEPSEEK_API_KEY=your_deepseek_api_key
DOUBAO_API_KEY=your_doubao_api_key

# 平台 API 配置
WEIBO_APP_KEY=your_weibo_app_key
WEIBO_APP_SECRET=your_weibo_app_secret
DOUYIN_APP_KEY=your_douyin_app_key
DOUYIN_APP_SECRET=your_douyin_app_secret
XIAOHONGSHU_APP_KEY=your_xiaohongshu_app_key
XIAOHONGSHU_APP_SECRET=your_xiaohongshu_app_secret
ZHIHU_APP_KEY=your_zhihu_app_key
ZHIHU_APP_SECRET=your_zhihu_app_secret
```

### 启动服务

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm run build
npm start
```

## API 文档

### 认证相关

#### 用户注册

- **URL**: `/api/auth/register`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "用户注册成功",
    "data": {
      "user": {
        "_id": "string",
        "username": "string",
        "email": "string",
        "createdAt": "string"
      },
      "token": "string"
    }
  }
  ```

#### 用户登录

- **URL**: `/api/auth/login`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "登录成功",
    "data": {
      "user": {
        "_id": "string",
        "username": "string",
        "email": "string"
      },
      "token": "string"
    }
  }
  ```

#### 获取用户信息

- **URL**: `/api/auth/me`
- **方法**: `GET`
- **请求头**: `Authorization: Bearer <token>`
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "string",
        "username": "string",
        "email": "string",
        "createdAt": "string"
      }
    }
  }
  ```

#### 更新用户信息

- **URL**: `/api/auth/me`
- **方法**: `PUT`
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:
  ```json
  {
    "username": "string",
    "email": "string"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "用户信息更新成功",
    "data": {
      "user": {
        "_id": "string",
        "username": "string",
        "email": "string",
        "updatedAt": "string"
      }
    }
  }
  ```

### 搜索相关

#### 搜索内容

- **URL**: `/api/search/content`
- **方法**: `POST`
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:
  ```json
  {
    "keyword": "string",
    "platforms": ["weibo", "douyin", "xiaohongshu", "zhihu"],
    "limit": 20
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "搜索任务已启动",
    "data": {
      "searchId": "string",
      "status": "processing"
    }
  }
  ```

#### 获取搜索历史

- **URL**: `/api/search/history`
- **方法**: `GET`
- **请求头**: `Authorization: Bearer <token>`
- **查询参数**:
  - `page`: 页码（默认: 1）
  - `limit`: 每页数量（默认: 10）
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "searches": [
        {
          "_id": "string",
          "keyword": "string",
          "platforms": ["string"],
          "status": "completed",
          "createdAt": "string"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 100,
        "pages": 10
      }
    }
  }
  ```

#### 获取搜索结果

- **URL**: `/api/search/result/:searchId`
- **方法**: `GET`
- **请求头**: `Authorization: Bearer <token>`
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "search": {
        "_id": "string",
        "keyword": "string",
        "platforms": ["string"],
        "status": "completed",
        "results": [
          {
            "id": "string",
            "title": "string",
            "content": "string",
            "author": "string",
            "platform": "string",
            "publishTime": "string",
            "url": "string",
            "metrics": {
              "likes": 0,
              "comments": 0,
              "shares": 0
            }
          }
        ],
        "createdAt": "string"
      }
    }
  }
  ```

### 分析相关

#### 分析内容

- **URL**: `/api/analysis/content`
- **方法**: `POST`
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:
  ```json
  {
    "searchId": "string",
    "contentItems": [
      {
        "id": "string",
        "title": "string",
        "content": "string",
        "platform": "string"
      }
    ]
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "分析任务已启动",
    "data": {
      "analysisId": "string",
      "status": "processing"
    }
  }
  ```

#### 获取分析历史

- **URL**: `/api/analysis/history`
- **方法**: `GET`
- **请求头**: `Authorization: Bearer <token>`
- **查询参数**:
  - `page`: 页码（默认: 1）
  - `limit`: 每页数量（默认: 10）
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "analyses": [
        {
          "_id": "string",
          "searchId": "string",
          "status": "completed",
          "createdAt": "string"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 100,
        "pages": 10
      }
    }
  }
  ```

#### 获取分析结果

- **URL**: `/api/analysis/result/:analysisId`
- **方法**: `GET`
- **请求头**: `Authorization: Bearer <token>`
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "analysis": {
        "_id": "string",
        "searchId": "string",
        "topicDirections": [
          {
            "direction": "string",
            "weight": 0.8,
            "examples": ["string"]
          }
        ],
        "userConcerns": [
          {
            "concern": "string",
            "frequency": 0.7,
            "sentiment": "positive"
          }
        ],
        "sentimentAnalysis": {
          "overall": "positive",
          "positiveRatio": 0.6,
          "negativeRatio": 0.2,
          "neutralRatio": 0.2,
          "keyEmotions": ["string"]
        },
        "topicSuggestions": [
          {
            "topic": "string",
            "potential": 0.8,
            "reason": "string"
          }
        ],
        "status": "completed",
        "createdAt": "string"
      }
    }
  }
  ```

## 项目结构

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # 数据库配置
│   ├── controllers/
│   │   ├── auth.controller.ts   # 认证控制器
│   │   ├── search.controller.ts # 搜索控制器
│   │   └── analysis.controller.ts # 分析控制器
│   ├── middleware/
│   │   ├── auth.middleware.ts   # 认证中间件
│   │   ├── error.middleware.ts  # 错误处理中间件
│   │   └── notFound.middleware.ts # 404处理中间件
│   ├── models/
│   │   ├── user.model.ts        # 用户模型
│   │   ├── search.model.ts      # 搜索模型
│   │   └── analysis.model.ts    # 分析模型
│   ├── routes/
│   │   ├── auth.routes.ts       # 认证路由
│   │   ├── search.routes.ts     # 搜索路由
│   │   └── analysis.routes.ts   # 分析路由
│   ├── services/
│   │   ├── auth.service.ts      # 认证服务
│   │   ├── search.service.ts    # 搜索服务
│   │   └── analysis.service.ts  # 分析服务
│   ├── utils/
│   │   ├── helpers.ts           # 工具函数
│   │   ├── logger.ts            # 日志配置
│   │   └── validation.ts        # 请求验证规则
│   └── app.ts                   # 应用入口
├── .env.example                 # 环境变量示例
├── package.json                 # 项目配置
├── tsconfig.json               # TypeScript 配置
└── README.md                   # 项目文档
```

## 许可证

MIT