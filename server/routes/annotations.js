const express = require('express');
const router = express.Router();
const annotationController = require('../controllers/annotationController');
const { authenticateToken, requireAnnotator } = require('../middleware/auth');

// 提交标注
router.post('/tasks/:taskId/submit', 
  authenticateToken, 
  requireAnnotator, 
  annotationController.submitAnnotation
);

// 获取标注历史
router.get('/history', 
  authenticateToken, 
  requireAnnotator, 
  annotationController.getAnnotationHistory
);

// 获取待标注任务
router.get('/pending', 
  authenticateToken, 
  requireAnnotator, 
  annotationController.getPendingTasks
);

// 领取任务
router.post('/tasks/:taskId/claim', 
  authenticateToken, 
  requireAnnotator, 
  annotationController.claimTask
);

// 获取标注统计
router.get('/stats', 
  authenticateToken, 
  requireAnnotator, 
  annotationController.getAnnotationStats
);

module.exports = router; 