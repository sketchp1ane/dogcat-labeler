# 快速启动指南

## 🚀 一键安装

```bash
# 克隆项目（如果还没有）
git clone <your-repo-url>
cd dogcat-labeler

# 运行安装脚本
./setup.sh
```

## 📋 手动安装步骤

### 1. 环境要求
- Node.js 16+ 
- MySQL 5.7+ 或 8.0+
- npm 或 yarn

### 2. 安装依赖
```bash
# 安装所有依赖
npm run install:all
```

### 3. 配置数据库
1. 启动MySQL服务
2. 创建数据库（可选，脚本会自动创建）
```sql
CREATE DATABASE dogcat_labeler CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. 修改 `server/.env` 文件中的数据库配置：
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dogcat_labeler
```

### 4. 初始化数据库
```bash
cd server
npm run init-db
```

### 5. 启动开发服务器
```bash
# 回到根目录
cd ..
# 同时启动前后端
npm run dev
```

## 🌐 访问应用

- **前端**: http://localhost:5173
- **后端API**: http://localhost:3001
- **健康检查**: http://localhost:3001/api/health

## 👤 默认账户

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 管理员 | admin | admin123 | 全部功能 |
| 标注员 | annotator1 | pass123 | 图片标注 |
| 审核员 | reviewer1 | pass123 | 审核标注 |

## 🔧 功能测试流程

### 1. 管理员操作
1. 使用 `admin/admin123` 登录
2. 上传猫狗图片创建标注任务
3. 分配任务给标注员（可选）
4. 管理用户账户

### 2. 标注员操作
1. 使用 `annotator1/pass123` 登录
2. 查看待标注任务
3. 对图片进行猫/狗分类标注
4. 提交标注结果

### 3. 审核员操作
1. 使用 `reviewer1/pass123` 登录
2. 查看待审核的标注
3. 审核通过或拒绝标注
4. 查看审核统计

## 📁 项目结构

```
dogcat-labeler/
├── client/                 # React前端
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── pages/         # 页面组件
│   │   ├── contexts/      # React Context
│   │   └── services/      # API服务
├── server/                # Express后端
│   ├── controllers/       # 控制器
│   ├── middleware/        # 中间件
│   ├── routes/           # 路由
│   ├── config/           # 配置文件
│   └── scripts/          # 脚本文件
└── uploads/              # 上传文件目录
```

## 🐛 常见问题

### 数据库连接失败
- 确保MySQL服务正在运行
- 检查 `server/.env` 中的数据库配置
- 确保数据库用户有足够权限

### 端口冲突
- 前端默认端口：5173
- 后端默认端口：3001
- 可在配置文件中修改端口

### 文件上传失败
- 检查 `server/uploads` 目录权限
- 确保文件大小不超过5MB
- 只支持图片格式文件

## 📚 API文档

### 认证接口
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/register` - 注册用户（管理员）

### 任务接口
- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks/create` - 创建任务（上传图片）
- `PUT /api/tasks/:id/assign` - 分配任务

### 标注接口
- `POST /api/annotations/tasks/:taskId/submit` - 提交标注
- `GET /api/annotations/pending` - 获取待标注任务
- `GET /api/annotations/history` - 获取标注历史

### 审核接口
- `GET /api/reviews/pending` - 获取待审核标注
- `POST /api/reviews/:annotationId` - 审核标注
- `POST /api/reviews/batch` - 批量审核

## 🔒 安全说明

- JWT Token 有效期：24小时
- 密码使用 bcrypt 加密
- 文件上传限制：5MB，仅图片格式
- API 限流：每15分钟100次请求

## 🚀 部署

### 生产环境部署
```bash
# 构建前端
npm run build

# 启动生产服务器
npm start
```

### 环境变量配置
```env
NODE_ENV=production
JWT_SECRET=your_production_secret
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

## 📞 技术支持

如果遇到问题，请检查：
1. Node.js 和 MySQL 版本
2. 网络连接和端口占用
3. 文件权限设置
4. 日志输出信息 