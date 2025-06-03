const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 用户登录
router.post('/login', authController.login);

// 用户注册（仅管理员）
router.post('/register', authenticateToken, requireAdmin, authController.register);

// 获取当前用户信息
router.get('/me', authenticateToken, authController.getCurrentUser);

// 修改密码
router.put('/change-password', authenticateToken, authController.changePassword);

module.exports = router; 