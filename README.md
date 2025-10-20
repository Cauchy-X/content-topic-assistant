# 内容选题助手

一个基于React和Node.js的内容选题和分析平台，帮助用户发现热门话题、分析内容趋势并提供创作建议。

## 功能特点

- 🔍 **多平台话题搜索** - 支持从知乎、B站、微博等社交媒体平台搜索热门话题
- 📊 **内容分析** - 深度分析话题热度、参与度、情感倾向和趋势
- 💡 **智能选题建议** - 基于AI模型(DeepSeek/豆包)生成高质量选题建议
- 📝 **内容大纲生成** - 自动生成内容创作大纲和详细指导
- 🕷️ **网页内容爬取** - 支持单URL和批量URL内容爬取
- 🤖 **多模型支持** - 集成DeepSeek和豆包等多种AI模型
- 🎨 **现代UI** - 基于Ant Design的响应式界面设计

## 技术栈

### 前端
- React 18
- TypeScript
- Redux Toolkit
- Ant Design
- React Router
- Axios

### 后端
- Node.js
- Express
- TypeScript
- MongoDB
- PostgreSQL
- Redis

### AI集成
- DeepSeek API
- 豆包API

### 数据采集
- Python爬虫
- Puppeteer
- Cheerio

## 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn
- MongoDB
- PostgreSQL
- Redis

### 环境变量配置

在项目根目录创建 `.env` 文件，配置以下环境变量：

```bash
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/content-topic-assistant
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=content_topic_assistant
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# AI API配置
DEEPSEEK_API_KEY=your_deepseek_api_key
DOUBAO_API_KEY=your_doubao_api_key
DOUBAO_MODEL_ID=doubao-pro-4k

# 服务器配置
PORT=5001
NODE_ENV=development
```

### 安装依赖

#### 前端
```bash
cd frontend
npm install
```

#### 后端
```bash
cd backend
npm install
```

### 启动应用

#### 前端开发服务器
```bash
cd frontend
npm start
```
前端应用将在 http://localhost:3000 启动

#### 后端开发服务器
```bash
cd backend
npm start
```
后端API将在 http://localhost:5001 启动

### 使用Docker

#### 构建并启动所有服务
```bash
docker-compose up
```

## 项目结构

```
content-topic-assistant/
├── frontend/                    # React前端应用
│   ├── public/                 # 静态资源
│   ├── src/
│   │   ├── components/         # 可复用组件
│   │   ├── pages/              # 页面组件
│   │   │   ├── TopicSearchPage.tsx      # 话题搜索页面
│   │   │   ├── TopicSuggestionsPage.tsx # 选题建议页面
│   │   │   ├── ContentAnalysisPage.tsx  # 内容分析页面
│   │   │   └── ContentOutlinePage.tsx   # 内容大纲页面
│   │   ├── store/              # Redux状态管理
│   │   ├── services/           # API服务
│   │   ├── utils/              # 工具函数
│   │   └── types/              # TypeScript类型定义
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                     # Node.js后端API
│   ├── src/
│   │   ├── controllers/        # 控制器
│   │   │   ├── analysis.controller.ts   # 分析控制器
│   │   │   └── topic.controller.ts      # 话题控制器
│   │   ├── models/             # 数据模型
│   │   │   ├── Topic.ts        # 话题模型
│   │   │   └── Analysis.ts     # 分析模型
│   │   ├── routes/             # API路由
│   │   ├── services/           # 业务逻辑服务
│   │   │   ├── analysis.service.ts     # 分析服务
│   │   │   └── topic.service.ts        # 话题服务
│   │   ├── middleware/         # 中间件
│   │   ├── utils/              # 工具函数
│   │   ├── config/             # 配置文件
│   │   └── database/           # 数据库连接
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                        # 项目文档
│   ├── 技术方案.md             # 技术方案文档
│   ├── MVP开发计划.md          # MVP开发计划
│   ├── PRD.md                  # 产品需求文档
│   └── 项目总结.md             # 项目总结
│
├── docker-compose.yml           # Docker配置
├── .env.example                # 环境变量示例
└── README.md                   # 项目说明
```

## API文档

详细的API文档请参考 [API文档](./docs/api.md)

## 贡献指南

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件至 [your-email@example.com]

## 更新日志

### v1.0.0 (2025-10-20)
- 新增智能选题建议功能，支持DeepSeek和豆包AI模型
- 实现网页内容爬取功能，支持单URL和批量URL爬取
- 添加内容大纲生成功能，提供详细创作指导
- 集成PostgreSQL和Redis数据库支持
- 优化后端API架构，提升系统性能
- 完善话题搜索功能，支持多平台数据源
- 增强内容分析能力，添加情感倾向分析
- 改进前端界面响应式设计
- 修复前端UI显示问题，改善用户体验