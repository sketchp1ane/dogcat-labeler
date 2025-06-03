const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '访问令牌缺失' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // 从数据库获取用户信息
    const [rows] = await pool.execute(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: '用户不存在' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ message: '无效的访问令牌' });
  }
};

// 权限检查中间件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '请先登录' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: '权限不足' });
    }

    next();
  };
};

// 管理员权限
const requireAdmin = requireRole('admin');

// 审核员权限（包括管理员）
const requireReviewer = requireRole(['reviewer', 'admin']);

// 标注员权限（包括审核员和管理员）
const requireAnnotator = requireRole(['annotator', 'reviewer', 'admin']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireReviewer,
  requireAnnotator
}; 