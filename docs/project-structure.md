# 项目结构总览

```
content-topic-assistant/
├── README.md                 # 项目说明文档
├── .env.example             # 环境变量模板
├── .gitignore               # Git忽略文件配置
├── docker-compose.yml       # Docker Compose配置
├── docs/                    # 项目文档
│   ├── deployment.md        # 部署指南
│   └── api.md              # API文档
├── scripts/                 # 脚本文件
│   ├── start.sh            # Linux/Mac启动脚本
│   └── start.bat           # Windows启动脚本
├── frontend/                # 前端应用
│   ├── public/             # 静态资源
│   │   ├── index.html      # HTML模板
│   │   └── favicon.ico     # 网站图标
│   ├── src/                # 源代码
│   │   ├── assets/         # 资源文件
│   │   │   └── index.css   # 全局样式
│   │   ├── components/     # 通用组件
│   │   │   ├── Layout.tsx  # 布局组件
│   │   │   ├── PrivateRoute.tsx # 路由保护组件
│   │   │   └── index.ts    # 组件导出
│   │   ├── pages/          # 页面组件
│   │   │   ├── LoginPage.tsx    # 登录页
│   │   │   ├── RegisterPage.tsx  # 注册页
│   │   │   ├── DashboardPage.tsx # 仪表板页
│   │   │   ├── TopicSearchPage.tsx # 话题搜索页
│   │   │   ├── ContentAnalysisPage.tsx # 内容分析页
│   │   │   └── NotFoundPage.tsx # 404页面
│   │   ├── services/       # API服务
│   │   │   ├── api.ts      # API基础配置
│   │   │   ├── authService.ts # 认证服务
│   │   │   ├── topicService.ts # 话题服务
│   │   │   └── index.ts    # 服务导出
│   │   ├── store/          # Redux状态管理
│   │   │   ├── index.ts    # Store配置
│   │   │   └── slices/     # Redux切片
│   │   │       ├── authSlice.ts # 认证状态
│   │   │       └── topicSlice.ts # 话题状态
│   │   ├── types/          # TypeScript类型定义
│   │   │   └── index.ts    # 类型导出
│   │   ├── utils/          # 工具函数
│   │   │   └── index.ts    # 工具函数导出
│   │   ├── App.tsx         # 应用主组件
│   │   └── index.tsx       # 应用入口
│   ├── package.json        # 项目依赖配置
│   ├── tsconfig.json       # TypeScript配置
│   ├── Dockerfile          # Docker配置
│   ├── nginx.conf          # Nginx配置
│   ├── start.sh            # 启动脚本
│   └── start.bat           # Windows启动脚本
├── backend/                 # 后端应用
│   ├── src/                # 源代码
│   │   ├── controllers/    # 控制器
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由定义
│   │   ├── services/       # 业务逻辑
│   │   ├── utils/          # 工具函数
│   │   └── app.ts          # 应用入口
│   ├── package.json        # 项目依赖配置
│   ├── tsconfig.json       # TypeScript配置
│   └── Dockerfile          # Docker配置
└── database/               # 数据库相关
    ├── init/               # 初始化脚本
    └── migrations/         # 数据库迁移
```

## 主要目录说明

### frontend/
前端React应用，包含所有用户界面和交互逻辑。

### backend/
后端Node.js应用，提供API服务和业务逻辑处理。

### database/
数据库相关文件，包括初始化脚本和迁移文件。

### docs/
项目文档，包括API文档和部署指南。

### scripts/
项目脚本，包括启动脚本和部署脚本。

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
- JWT认证

### 部署
- Docker
- Docker Compose
- Nginx

## 开发流程

1. 前端开发：在`frontend/`目录下进行React应用开发
2. 后端开发：在`backend/`目录下进行Node.js应用开发
3. 数据库设计：在`database/`目录下管理数据库脚本
4. 文档维护：在`docs/`目录下更新项目文档
5. 部署配置：使用`docker-compose.yml`进行容器化部署

## 注意事项

1. 所有环境变量配置请参考`.env.example`文件
2. 前端和后端开发时需要分别启动服务
3. 使用Docker部署时，确保Docker和Docker Compose已安装
4. 生产环境部署前请仔细阅读`docs/deployment.md`文档