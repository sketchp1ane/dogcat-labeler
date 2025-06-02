// server/index.js
const express = require('express');
const session = require('express-session');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ✅ 允许前端访问（请确认你的 Vite 是跑在 5174）
app.use(cors({
  origin: 'http://localhost:5174', // ← 修改成你当前 Vite 运行端口
  credentials: true
}));

// ✅ 支持 JSON 请求体
app.use(express.json());

// ✅ 使用 session 持久化登录状态
app.use(session({
  secret: 'dogcat-secret',
  resave: false,
  saveUninitialized: false
}));

// ✅ 允许访问上传的图片文件夹，如：/uploads/abcd123.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ 路由挂载
app.use('/api',             require('./routes/auth'));
app.use('/api/images',      require('./routes/images'));
app.use('/api/annotations', require('./routes/annotations'));
app.use('/api/reviews',     require('./routes/reviews'));
app.use('/api/stats',       require('./routes/stats'));

// ✅ 启动服务器
app.listen(3000, () => {
  console.log('🚀 backend listening on http://localhost:3000');
});
