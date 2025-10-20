# API 文档

本文档描述了内容选题助手后端API的接口规范。

## 基础信息

- **基础URL**: `http://localhost:5000/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证

大部分API需要在请求头中包含JWT令牌：

```
Authorization: Bearer <your-jwt-token>
```

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": {}, // 具体数据
  "message": "操作成功"
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {} // 详细错误信息（可选）
  }
}
```

### 分页响应

```json
{
  "success": true,
  "data": {
    "items": [], // 数据列表
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## API 接口

### 1. 用户认证

#### 1.1 用户注册

**请求**
```
POST /auth/register
```

**请求体**
```json
{
  "username": "string", // 用户名，3-20字符
  "email": "string",    // 邮箱地址
  "password": "string"  // 密码，6-20字符
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "avatar": "string",
      "role": "user",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  },
  "message": "注册成功"
}
```

#### 1.2 用户登录

**请求**
```
POST /auth/login
```

**请求体**
```json
{
  "username": "string", // 用户名或邮箱
  "password": "string"  // 密码
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "avatar": "string",
      "role": "user"
    },
    "token": "string", // JWT令牌
    "expiresIn": "7d"
  },
  "message": "登录成功"
}
```

#### 1.3 获取当前用户信息

**请求**
```
GET /auth/me
Authorization: Bearer <token>
```

**响应**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "avatar": "string",
      "role": "user",
      "subscription": {
        "plan": "free", // free, basic, premium
        "expiresAt": "2023-12-31T23:59:59.999Z"
      }
    }
  }
}
```

#### 1.4 用户登出

**请求**
```
POST /auth/logout
Authorization: Bearer <token>
```

**响应**
```json
{
  "success": true,
  "message": "登出成功"
}
```

### 2. 话题搜索

#### 2.1 搜索话题

**请求**
```
POST /topics/search
Authorization: Bearer <token>
```

**请求体**
```json
{
  "keyword": "string",    // 搜索关键词
  "platform": "string",   // 平台: all, weibo, douyin, xiaohongshu, bilibili
  "limit": 20,           // 每页数量，默认20，最大100
  "offset": 0            // 偏移量，默认0
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": "string",
        "keyword": "string",
        "platform": "string",
        "title": "string",
        "content": "string",
        "author": "string",
        "publishTime": "2023-01-01T00:00:00.000Z",
        "url": "string",
        "likes": 100,
        "comments": 50,
        "shares": 20,
        "heat": 85.5
      }
    ],
    "total": 100,
    "hasMore": true
  }
}
```

#### 2.2 获取话题详情

**请求**
```
GET /topics/:id
Authorization: Bearer <token>
```

**响应**
```json
{
  "success": true,
  "data": {
    "topic": {
      "id": "string",
      "keyword": "string",
      "platform": "string",
      "title": "string",
      "content": "string",
      "author": "string",
      "publishTime": "2023-01-01T00:00:00.000Z",
      "url": "string",
      "likes": 100,
      "comments": 50,
      "shares": 20,
      "heat": 85.5,
      "tags": ["标签1", "标签2"],
      "relatedTopics": [] // 相关话题
    }
  }
}
```

#### 2.3 获取搜索历史

**请求**
```
GET /topics/history
Authorization: Bearer <token>
```

**响应**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "keyword": "string",
        "searchTime": "2023-01-01T00:00:00.000Z",
        "resultCount": 50
      }
    ]
  }
}
```

#### 2.4 清除搜索历史

**请求**
```
DELETE /topics/history
Authorization: Bearer <token>
```

**响应**
```json
{
  "success": true,
  "message": "搜索历史已清除"
}
```

### 3. 内容分析

#### 3.1 分析话题

**请求**
```
POST /analysis/topic
Authorization: Bearer <token>
```

**请求体**
```json
{
  "topicId": "string",     // 话题ID
  "analysisType": "string" // 分析类型: trend, sentiment, keyword
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "id": "string",
      "topicId": "string",
      "type": "string",
      "result": {
        "trend": {
          "direction": "up", // up, down, stable
          "changePercent": 15.5,
          "timeRange": "7d"
        },
        "sentiment": {
          "positive": 60,
          "negative": 20,
          "neutral": 20
        },
        "keywords": [
          {
            "word": "string",
            "weight": 0.8
          }
        ]
      },
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### 3.2 获取分析历史

**请求**
```
GET /analysis/history
Authorization: Bearer <token>
```

**查询参数**
- `page`: 页码，默认1
- `limit`: 每页数量，默认20

**响应**
```json
{
  "success": true,
  "data": {
    "analyses": [
      {
        "id": "string",
        "topicId": "string",
        "topicTitle": "string",
        "type": "string",
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 4. 内容建议

#### 4.1 获取内容建议

**请求**
```
POST /suggestions/content
Authorization: Bearer <token>
```

**请求体**
```json
{
  "topicId": "string",
  "contentType": "string" // 内容类型: article, video, short
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "title": "string",
        "description": "string",
        "tags": ["标签1", "标签2"],
        "reason": "string", // 建议理由
        "confidence": 0.85  // 置信度
      }
    ]
  }
}
```

#### 4.2 生成内容大纲

**请求**
```
POST /suggestions/outline
Authorization: Bearer <token>
```

**请求体**
```json
{
  "topic": "string",
  "contentType": "string", // 内容类型: article, video, short
  "style": "string"       // 风格: formal, casual, professional
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "outline": {
      "title": "string",
      "introduction": "string",
      "sections": [
        {
          "title": "string",
          "points": ["要点1", "要点2"]
        }
      ],
      "conclusion": "string"
    }
  }
}
```

### 5. 用户订阅

#### 5.1 获取订阅信息

**请求**
```
GET /subscription
Authorization: Bearer <token>
```

**响应**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "plan": "free", // free, basic, premium
      "status": "active", // active, expired, cancelled
      "startDate": "2023-01-01T00:00:00.000Z",
      "endDate": "2023-12-31T23:59:59.999Z",
      "features": [
        "feature1",
        "feature2"
      ],
      "usage": {
        "apiCalls": 100,
        "apiLimit": 1000
      }
    }
  }
}
```

#### 5.2 创建订阅

**请求**
```
POST /subscription
Authorization: Bearer <token>
```

**请求体**
```json
{
  "plan": "basic", // basic, premium
  "paymentMethod": "string" // 支付方式
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "string",
      "plan": "basic",
      "status": "pending",
      "paymentUrl": "string" // 支付链接
    }
  }
}
```

## 错误代码

| 错误代码 | HTTP状态码 | 描述 |
|---------|-----------|------|
| VALIDATION_ERROR | 400 | 请求参数验证失败 |
| UNAUTHORIZED | 401 | 未授权访问 |
| FORBIDDEN | 403 | 禁止访问 |
| NOT_FOUND | 404 | 资源不存在 |
| RATE_LIMIT_EXCEEDED | 429 | 请求频率超限 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| SERVICE_UNAVAILABLE | 503 | 服务不可用 |

## 请求限制

- 认证接口：每分钟最多5次请求
- 搜索接口：每分钟最多30次请求
- 分析接口：每分钟最多10次请求
- 建议接口：每分钟最多20次请求

## 更新日志

### v1.0.0 (2023-XX-XX)
- 初始API版本
- 实现用户认证
- 实现话题搜索
- 实现内容分析
- 实现内容建议
- 实现用户订阅