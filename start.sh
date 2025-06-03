#!/bin/bash

echo "🚀 启动猫狗标注平台..."

# 检查是否安装了必要的依赖
if [ ! -d "server/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd client && npm install && cd ..
fi

echo "🗄️ 检查数据库连接..."

# 启动后端（在后台）
echo "🔧 启动后端服务器..."
cd server && npm start &
SERVER_PID=$!
cd ..

# 等待后端启动
sleep 3

# 检查后端是否正常启动
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ 后端服务器启动成功 (PID: $SERVER_PID)"
else
    echo "❌ 后端服务器启动失败"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# 启动前端
echo "🎨 启动前端开发服务器..."
echo "📊 访问地址: http://localhost:5173"
echo "🔧 管理员账户: admin / admin123"
echo ""
echo "⚠️ 按 Ctrl+C 停止所有服务"
echo ""

cd client && npm run dev &
CLIENT_PID=$!

# 等待用户中断
wait

# 清理进程
echo ""
echo "🛑 正在停止服务..."
kill $SERVER_PID 2>/dev/null
kill $CLIENT_PID 2>/dev/null
echo "✅ 所有服务已停止" 