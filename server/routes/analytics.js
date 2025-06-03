const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 获取标注进度分析
router.get('/annotation-progress', 
  authenticateToken, 
  requireAdmin, 
  analyticsController.getAnnotationProgress
);

// 获取标注质量分析
router.get('/annotation-quality', 
  authenticateToken, 
  requireAdmin, 
  analyticsController.getAnnotationQuality
);

// 获取时间效率分析
router.get('/time-analysis', 
  authenticateToken, 
  requireAdmin, 
  analyticsController.getTimeAnalysis
);

// 获取综合仪表板数据
router.get('/dashboard', 
  authenticateToken, 
  requireAdmin, 
  analyticsController.getDashboardData
);

module.exports = router; 