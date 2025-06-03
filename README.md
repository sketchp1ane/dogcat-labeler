# 猫狗图片标注平台

一个基于React + Express + MySQL的图片标注平台，用于猫狗图片的分类标注。

## 功能特性

### 用户权限系统
- **标注人员**: 对图片进行猫/狗分类标注
- **审核人员**: 审核标注结果，可通过或打回重做
- **管理员**: 发布标注任务、管理用户、查看标注统计

### 标注流程
1. 管理员上传图片，创建标注任务
2. 标注人员进行分类标注（猫/狗）
3. 审核人员审核标注结果
4. 通过审核的标注存入结果数据库
5. 管理员查看标注统计和可视化结果

## 技术栈

- **前端**: React 18 + Vite + Tailwind CSS
- **后端**: Express.js + Node.js
- **数据库**: MySQL
- **认证**: JWT
- **文件上传**: Multer
- **图片处理**: Sharp

## 安装和运行

### 1. 安装依赖
```bash
npm run install:all
```

### 2. 配置数据库
1. 创建MySQL数据库 `dogcat_labeler`
2. 修改 `server/config/database.js` 中的数据库连接信息
3. 运行数据库初始化脚本：
```bash
cd server && npm run init-db
```

### 3. 启动开发服务器
```bash
npm run dev
```

- 前端地址: http://localhost:5173
- 后端地址: http://localhost:3001

### 4. 默认管理员账号
- 用户名: admin
- 密码: admin123

## 项目结构

```
dogcat-labeler/
├── client/          # React前端应用
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/        # 页面
│   │   ├── hooks/        # 自定义Hook
│   │   ├── services/     # API服务
│   │   └── utils/        # 工具函数
│   └── public/
├── server/          # Express后端应用
│   ├── controllers/  # 控制器
│   ├── middleware/   # 中间件
│   ├── models/       # 数据模型
│   ├── routes/       # 路由
│   ├── uploads/      # 上传文件目录
│   └── config/       # 配置文件
└── docs/            # 文档
```

## 数据库设计

### 用户表 (users)
- id, username, password, email, role, created_at

### 标注任务表 (annotation_tasks)
- id, image_path, status, created_by, created_at

### 标注结果表 (annotations)
- id, task_id, annotator_id, label, confidence, created_at

### 审核记录表 (reviews)
- id, annotation_id, reviewer_id, status, comment, created_at

## 开发指南

### 添加新功能
1. 在 `client/src/pages/` 添加新页面
2. 在 `server/controllers/` 添加新的控制器
3. 在 `server/routes/` 添加路由
4. 更新数据库模型（如需要）

### 样式指南
- 使用Tailwind CSS进行样式开发
- 遵循简洁、现代的设计风格
- 保持组件的一致性和可重用性

## 部署

### 生产环境部署
```bash
npm run build
npm start
```

### 环境变量
在 `server/.env` 文件中配置：
```
NODE_ENV=production
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=dogcat_labeler
JWT_SECRET=your_jwt_secret
```

## 许可证

MIT License 