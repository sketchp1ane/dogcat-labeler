# 🚀 猫狗图片标注平台

一个功能完整的图片标注平台，支持猫狗分类标注、多角色权限管理、审核流程和数据分析可视化。

## ✨ 功能特性

### 👥 多角色用户权限系统
- **标注员**: 对图片进行猫/狗分类标注，支持置信度设置
- **审核员**: 审核标注结果，可通过或拒绝并添加评论
- **管理员**: 发布标注任务、管理用户、查看完整数据分析

### 📊 完整的标注流程
1. 管理员批量上传图片，创建标注任务
2. 标注员认领任务并进行分类标注（猫/狗）
3. 审核员审核标注结果，给出反馈
4. 通过审核的标注存入完成数据库
5. 管理员查看详细的标注统计和数据分析

### 📈 数据分析与可视化
- **进度分析**: 任务状态分布、30天标注和审核趋势图
- **质量分析**: 标注员质量排行、标签分布、审核员工作量
- **效率分析**: 标注时间分布、24小时活跃度、时间趋势
- **综合仪表板**: 关键指标、今日统计、最近活动

### 🔧 高级功能
- JWT认证和权限控制
- 文件批量上传和处理
- 实时数据统计
- 响应式设计
- 安全中间件和限流

## 🛠️ 技术栈

- **前端**: React 18 + Vite + Tailwind CSS + Recharts
- **后端**: Express.js + Node.js + MySQL2
- **数据库**: MySQL 8.0+
- **认证**: JWT + bcryptjs
- **文件处理**: Multer + Sharp
- **安全**: Helmet + Rate Limiting + CORS

## 🚀 快速开始

### 方式一：一键启动（推荐）
```bash
# 克隆项目
git clone <your-repo-url>
cd dogcat-labeler

# 一键启动（自动安装依赖、检查数据库、启动前后端）
./start.sh
```

### 方式二：手动启动
```bash
# 1. 安装依赖
npm run install:all

# 2. 配置数据库并初始化
cd server
cp .env.example .env  # 配置数据库连接
npm run init-db      # 初始化数据库和默认数据

# 3. 启动开发服务器
npm run dev
```

## 🌐 访问地址

- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:3001
- **健康检查**: http://localhost:3001/api/health

## 👤 测试账户

### 🔧 管理员账户
- **用户名**: `admin`
- **密码**: `admin123`
- **权限**: 完整管理权限，可访问所有功能

### ✏️ 标注员账户（不同技能等级）
| 用户名 | 密码 | 技能等级 | 特点 |
|--------|------|----------|------|
| `annotator_expert` | `pass123` | 专家级 | 95%准确率，速度最快 |
| `annotator_senior` | `pass123` | 高级 | 85%准确率，速度良好 |
| `annotator1` | `pass123` | 默认 | 原始测试账户 |
| `annotator_medium1` | `pass123` | 中级 | 75%准确率，中等速度 |
| `annotator_junior1` | `pass123` | 新手 | 60%准确率，需要训练 |

### 👨‍⚖️ 审核员账户
| 用户名 | 密码 | 特点 |
|--------|------|------|
| `reviewer1` | `pass123` | 基础审核员 |
| `reviewer_senior` | `pass123` | 资深审核员 |

> 💡 **提示**: 更多完整的账户信息请查看 [USER_ACCOUNTS.md](./USER_ACCOUNTS.md)

## 📊 预置测试数据

系统包含丰富的测试数据：
- **14个不同角色用户**
- **453个标注任务**
- **437条标注记录**
- **417条审核记录**
- **327条完成标注**
- **60天历史数据**（真实的工作日/周末分布）

## 📁 项目结构

```
dogcat-labeler/
├── client/                 # React前端应用
│   ├── src/
│   │   ├── components/    # 可复用组件
│   │   ├── pages/        # 页面组件
│   │   ├── contexts/     # React上下文
│   │   ├── services/     # API服务
│   │   └── utils/        # 工具函数
│   └── public/
├── server/                # Express后端应用
│   ├── controllers/      # 业务逻辑控制器
│   ├── middleware/       # 中间件
│   ├── routes/          # API路由
│   ├── config/          # 配置文件
│   ├── scripts/         # 数据库脚本
│   └── uploads/         # 文件上传目录
├── start.sh             # 一键启动脚本
├── USER_ACCOUNTS.md     # 用户账户说明
└── README.md
```

## 🗄️ 数据库设计

### 核心表结构
- **users**: 用户信息和角色权限
- **annotation_tasks**: 标注任务和状态
- **annotations**: 标注结果和置信度
- **reviews**: 审核记录和评论
- **completed_annotations**: 完成的标注记录

## 🔨 开发指南

### 数据库管理脚本
```bash
cd server

# 初始化数据库（清空并重建）
node scripts/init-database.js

# 生成示例数据
node scripts/generate-sample-data.js

# 生成复杂测试数据
node scripts/generate-complex-data.js

# 检查数据库状态
node scripts/check-database.js

# 分析标注员表现
node scripts/analyze-annotator-performance.js
```

### 添加新功能
1. **前端**: 在 `client/src/pages/` 添加页面，在 `client/src/services/api.js` 添加API调用
2. **后端**: 在 `server/controllers/` 添加控制器，在 `server/routes/` 配置路由
3. **权限**: 在 `server/middleware/auth.js` 配置权限检查
4. **数据库**: 根据需要修改表结构和初始化脚本

### 样式指南
- 使用 Tailwind CSS 进行样式开发
- 遵循响应式设计原则
- 保持组件一致性和可重用性
- 使用语义化的图标和颜色

## 🚀 部署

### 生产环境部署
```bash
# 构建前端
cd client && npm run build

# 启动生产服务器
cd server && npm start
```

### 环境变量配置
在 `server/.env` 中配置：
```env
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=dogcat_labeler
JWT_SECRET=your_jwt_secret_key
```

## 📸 功能截图

系统包含以下主要页面：
- 🏠 **概览页面**: 关键指标和统计信息
- ✏️ **标注页面**: 图片标注界面
- 📤 **上传页面**: 批量图片上传
- 👨‍⚖️ **审核页面**: 标注结果审核
- 👥 **用户管理**: 用户角色管理
- 📊 **数据分析**: 详细的可视化分析

## 🤝 贡献

欢迎提交Issue和Pull Request来帮助改进项目！

## 📄 许可证

MIT License

---

*最后更新: 2025年6月3日* 