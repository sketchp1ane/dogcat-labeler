const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 获取所有用户列表
router.get('/', 
  authenticateToken, 
  requireAdmin, 
  userController.getAllUsers
);

// 创建新用户 (使用注册功能)
router.post('/', 
  authenticateToken, 
  requireAdmin, 
  authController.register
);

// 获取用户详情
router.get('/:id', 
  authenticateToken, 
  requireAdmin, 
  userController.getUserById
);

// 更新用户信息
router.put('/:id', 
  authenticateToken, 
  requireAdmin, 
  userController.updateUser
);

// 删除用户
router.delete('/:id', 
  authenticateToken, 
  requireAdmin, 
  userController.deleteUser
);

// 重置用户密码
router.put('/:id/reset-password', 
  authenticateToken, 
  requireAdmin, 
  userController.resetPassword
);

// 获取用户统计
router.get('/stats/overview', 
  authenticateToken, 
  requireAdmin, 
  userController.getUserStats
);

module.exports = router; 