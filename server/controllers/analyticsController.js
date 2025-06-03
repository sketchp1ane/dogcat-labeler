const { pool } = require('../config/database');

// 获取标注进度分析
const getAnnotationProgress = async (req, res) => {
  try {
    // 获取任务流转状态统计
    const taskFlowQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM annotation_tasks)), 1) as percentage
      FROM annotation_tasks 
      GROUP BY status
    `;
    const [taskFlow] = await pool.execute(taskFlowQuery);

    // 获取最近30天的标注趋势
    const dailyAnnotationsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as annotations,
        COUNT(DISTINCT annotator_id) as active_annotators
      FROM annotations 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;
    const [dailyAnnotations] = await pool.execute(dailyAnnotationsQuery);

    // 获取最近30天的审核趋势
    const dailyReviewsQuery = `
      SELECT 
        DATE(r.created_at) as date,
        SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM reviews r
      WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(r.created_at)
      ORDER BY date DESC
      LIMIT 30
    `;
    const [dailyReviews] = await pool.execute(dailyReviewsQuery);

    res.json({
      taskFlow,
      dailyAnnotations: dailyAnnotations.reverse(),
      dailyReviews: dailyReviews.reverse()
    });

  } catch (error) {
    console.error('获取标注进度分析失败:', error);
    res.status(500).json({ message: '获取标注进度分析失败' });
  }
};

// 获取标注质量分析
const getAnnotationQuality = async (req, res) => {
  try {
    // 获取标注员质量统计
    const annotatorQualityQuery = `
      SELECT 
        u.id as annotator_id,
        u.username,
        COUNT(a.id) as total_annotations,
        COUNT(r.id) as reviewed_annotations,
        ROUND(
          (SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) * 100.0 / 
           NULLIF(COUNT(r.id), 0)), 1
        ) as approval_rate,
        ROUND(AVG(a.annotation_time), 1) as avg_time,
        ROUND(AVG(a.confidence), 3) as avg_confidence
      FROM users u
      LEFT JOIN annotations a ON u.id = a.annotator_id
      LEFT JOIN reviews r ON a.id = r.annotation_id
      WHERE u.role = 'annotator'
      GROUP BY u.id, u.username
      HAVING total_annotations > 0
      ORDER BY total_annotations DESC
    `;
    const [annotatorQuality] = await pool.execute(annotatorQualityQuery);

    // 获取标签分布统计
    const labelDistributionQuery = `
      SELECT 
        a.label,
        COUNT(*) as count,
        ROUND(AVG(a.confidence), 3) as avg_confidence,
        SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
      FROM annotations a
      LEFT JOIN reviews r ON a.id = r.annotation_id
      GROUP BY a.label
      ORDER BY count DESC
    `;
    const [labelDistribution] = await pool.execute(labelDistributionQuery);

    // 获取审核员工作量统计
    const reviewerWorkloadQuery = `
      SELECT 
        u.username,
        SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        COUNT(r.id) as total_reviews
      FROM users u
      LEFT JOIN reviews r ON u.id = r.reviewer_id
      WHERE u.role IN ('reviewer', 'admin')
      GROUP BY u.id, u.username
      HAVING total_reviews > 0
      ORDER BY total_reviews DESC
    `;
    const [reviewerWorkload] = await pool.execute(reviewerWorkloadQuery);

    res.json({
      annotatorQuality,
      labelDistribution,
      reviewerWorkload
    });

  } catch (error) {
    console.error('获取标注质量分析失败:', error);
    res.status(500).json({ message: '获取标注质量分析失败' });
  }
};

// 获取时间效率分析
const getTimeAnalysis = async (req, res) => {
  try {
    // 获取标注时间分布
    const timeDistributionQuery = `
      SELECT 
        CASE 
          WHEN annotation_time < 10 THEN '0-10秒'
          WHEN annotation_time < 30 THEN '10-30秒'
          WHEN annotation_time < 60 THEN '30-60秒'
          WHEN annotation_time < 120 THEN '1-2分钟'
          ELSE '2分钟以上'
        END as time_range,
        COUNT(*) as count
      FROM annotations
      WHERE annotation_time IS NOT NULL
      GROUP BY 
        CASE 
          WHEN annotation_time < 10 THEN '0-10秒'
          WHEN annotation_time < 30 THEN '10-30秒'
          WHEN annotation_time < 60 THEN '30-60秒'
          WHEN annotation_time < 120 THEN '1-2分钟'
          ELSE '2分钟以上'
        END
      ORDER BY MIN(annotation_time)
    `;
    const [timeDistribution] = await pool.execute(timeDistributionQuery);

    // 获取24小时活跃度分析
    const hourlyActivityQuery = `
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as annotations
      FROM annotations
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY HOUR(created_at)
      ORDER BY hour
    `;
    const [hourlyActivity] = await pool.execute(hourlyActivityQuery);

    // 获取平均标注时间趋势
    const timeProgressQuery = `
      SELECT 
        DATE(created_at) as date,
        ROUND(AVG(annotation_time), 1) as avg_time
      FROM annotations
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND annotation_time IS NOT NULL
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;
    const [timeProgress] = await pool.execute(timeProgressQuery);

    res.json({
      timeDistribution,
      hourlyActivity,
      timeProgress: timeProgress.reverse()
    });

  } catch (error) {
    console.error('获取时间效率分析失败:', error);
    res.status(500).json({ message: '获取时间效率分析失败' });
  }
};

// 获取综合仪表板数据
const getDashboardData = async (req, res) => {
  try {
    // 获取总体统计
    const overallQuery = `
      SELECT 
        (SELECT COUNT(*) FROM annotation_tasks) as total_tasks,
        (SELECT COUNT(*) FROM annotation_tasks WHERE status = 'completed') as completed_tasks,
        (SELECT COUNT(DISTINCT annotator_id) FROM annotations WHERE DATE(created_at) >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as annotator_count,
        (SELECT ROUND(AVG(annotation_time), 1) FROM annotations WHERE annotation_time IS NOT NULL) as avg_annotation_time
    `;
    const [overallResult] = await pool.execute(overallQuery);
    const overall = overallResult[0];

    // 获取今日统计
    const todayQuery = `
      SELECT 
        (SELECT COUNT(*) FROM annotations WHERE DATE(created_at) = CURDATE()) as today_annotations,
        (SELECT COUNT(*) FROM reviews WHERE DATE(created_at) = CURDATE()) as today_reviews,
        (SELECT COUNT(*) FROM annotation_tasks WHERE DATE(created_at) = CURDATE()) as today_tasks,
        (SELECT COUNT(DISTINCT annotator_id) FROM annotations WHERE DATE(created_at) = CURDATE()) as active_annotators_today
    `;
    const [todayResult] = await pool.execute(todayQuery);
    const today = todayResult[0];

    // 获取最近活动
    const recentActivityQuery = `
      (
        SELECT 
          'annotation' as type,
          u.username,
          t.original_filename as item_name,
          a.label as action,
          a.created_at
        FROM annotations a
        JOIN users u ON a.annotator_id = u.id
        JOIN annotation_tasks t ON a.task_id = t.id
        ORDER BY a.created_at DESC
        LIMIT 5
      )
      UNION ALL
      (
        SELECT 
          'review' as type,
          u.username,
          t.original_filename as item_name,
          r.status as action,
          r.created_at
        FROM reviews r
        JOIN users u ON r.reviewer_id = u.id
        JOIN annotations a ON r.annotation_id = a.id
        JOIN annotation_tasks t ON a.task_id = t.id
        ORDER BY r.created_at DESC
        LIMIT 5
      )
      ORDER BY created_at DESC
      LIMIT 10
    `;
    const [recentActivity] = await pool.execute(recentActivityQuery);

    res.json({
      overall,
      today,
      recentActivity
    });

  } catch (error) {
    console.error('获取综合仪表板数据失败:', error);
    res.status(500).json({ message: '获取综合仪表板数据失败' });
  }
};

module.exports = {
  getAnnotationProgress,
  getAnnotationQuality,
  getTimeAnalysis,
  getDashboardData
}; 