const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadMultiple, handleUploadError } = require('../middleware/upload');

// 创建标注任务（上传图片）
router.post('/create', 
  authenticateToken, 
  requireAdmin, 
  uploadMultiple, 
  handleUploadError,
  taskController.createTasks
);

// 获取任务列表
router.get('/', authenticateToken, taskController.getTasks);

// 获取任务详情
router.get('/:id', authenticateToken, taskController.getTaskById);

// 分配任务
router.put('/:id/assign', 
  authenticateToken, 
  requireAdmin, 
  taskController.assignTask
);

// 删除任务
router.delete('/:id', 
  authenticateToken, 
  requireAdmin, 
  taskController.deleteTask
);

// 获取任务统计
router.get('/stats/overview', 
  authenticateToken, 
  requireAdmin, 
  taskController.getTaskStats
);

module.exports = router; 