const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken, requireReviewer } = require('../middleware/auth');

// 获取待审核的标注
router.get('/pending', 
  authenticateToken, 
  requireReviewer, 
  reviewController.getPendingReviews
);

// 审核标注
router.post('/:annotationId', 
  authenticateToken, 
  requireReviewer, 
  reviewController.reviewAnnotation
);

// 获取审核历史
router.get('/history', 
  authenticateToken, 
  requireReviewer, 
  reviewController.getReviewHistory
);

// 获取审核统计
router.get('/stats', 
  authenticateToken, 
  requireReviewer, 
  reviewController.getReviewStats
);

// 批量审核
router.post('/batch', 
  authenticateToken, 
  requireReviewer, 
  reviewController.batchReview
);

module.exports = router; 