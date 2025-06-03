#!/bin/bash

echo "🚀 开始设置猫狗图片标注平台..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js (https://nodejs.org/)"
    exit 1
fi

# 检查MySQL是否安装
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL 未安装，请确保已安装并启动 MySQL 服务"
    echo "   macOS: brew install mysql"
    echo "   Ubuntu: sudo apt-get install mysql-server"
    echo "   Windows: 下载并安装 MySQL Community Server"
fi

echo "📦 安装项目依赖..."

# 安装根目录依赖
npm install

# 安装后端依赖
echo "📦 安装后端依赖..."
cd server && npm install

# 安装前端依赖
echo "📦 安装前端依赖..."
cd ../client && npm install

cd ..

echo "⚙️  配置环境变量..."

# 创建后端环境变量文件
if [ ! -f "server/.env" ]; then
    cat > server/.env << EOF
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=dogcat_labeler

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here_$(date +%s)

# Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
EOF
    echo "✅ 创建了 server/.env 文件"
    echo "⚠️  请根据你的MySQL配置修改 server/.env 中的数据库连接信息"
else
    echo "ℹ️  server/.env 文件已存在"
fi

echo ""
echo "🎉 安装完成！"
echo ""
echo "📋 下一步操作："
echo "1. 确保MySQL服务正在运行"
echo "2. 修改 server/.env 中的数据库连接信息（如需要）"
echo "3. 初始化数据库: cd server && npm run init-db"
echo "4. 启动开发服务器: npm run dev"
echo ""
echo "🌐 访问地址："
echo "   前端: http://localhost:5173"
echo "   后端: http://localhost:3001"
echo ""
echo "👤 默认管理员账号："
echo "   用户名: admin"
echo "   密码: admin123" 