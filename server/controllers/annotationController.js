const { pool } = require('../config/database');

// 提交标注
const submitAnnotation = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { label, confidence = 1.0, annotationTime = 0 } = req.body;
    const annotatorId = req.user.id;

    if (!label || !['cat', 'dog'].includes(label)) {
      return res.status(400).json({ message: '请选择有效的标签（cat 或 dog）' });
    }

    // 检查任务是否存在且可以标注
    const [taskRows] = await pool.execute(`
      SELECT id, status, assigned_to FROM annotation_tasks 
      WHERE id = ? AND (status = 'pending' OR status = 'annotating' OR status = 'rejected')
    `, [taskId]);

    if (taskRows.length === 0) {
      return res.status(404).json({ message: '任务不存在或已完成' });
    }

    const task = taskRows[0];
    
    // 检查权限：任务必须分配给当前用户或未分配
    if (task.assigned_to && task.assigned_to !== annotatorId) {
      return res.status(403).json({ message: '此任务未分配给您' });
    }

    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 检查是否已有标注记录
      const [existingAnnotations] = await connection.execute(
        'SELECT id FROM annotations WHERE task_id = ?',
        [taskId]
      );

      if (existingAnnotations.length > 0) {
        // 更新现有标注
        await connection.execute(
          'UPDATE annotations SET label = ?, confidence = ?, annotation_time = ?, updated_at = CURRENT_TIMESTAMP WHERE task_id = ?',
          [label, confidence, annotationTime, taskId]
        );
      } else {
        // 创建新标注
        await connection.execute(
          'INSERT INTO annotations (task_id, annotator_id, label, confidence, annotation_time) VALUES (?, ?, ?, ?, ?)',
          [taskId, annotatorId, label, confidence, annotationTime]
        );
      }

      // 更新任务状态为待审核
      await connection.execute(
        'UPDATE annotation_tasks SET status = "reviewing", assigned_to = ? WHERE id = ?',
        [annotatorId, taskId]
      );

      await connection.commit();

      res.json({ message: '标注提交成功，等待审核' });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('提交标注错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 获取用户的标注历史
const getAnnotationHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const annotatorId = req.user.id;
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(`
      SELECT 
        a.id,
        a.label,
        a.confidence,
        a.annotation_time,
        a.created_at,
        t.original_filename,
        t.status as task_status,
        r.status as review_status,
        r.comment as review_comment
      FROM annotations a
      JOIN annotation_tasks t ON a.task_id = t.id
      LEFT JOIN reviews r ON a.id = r.annotation_id
      WHERE a.annotator_id = ?
      ORDER BY a.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `, [annotatorId]);

    // 获取总数
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM annotations WHERE annotator_id = ?',
      [annotatorId]
    );

    const total = countResult[0].total;

    res.json({
      annotations: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取标注历史错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 获取待标注任务
const getPendingTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { limit = 10 } = req.query;

    let query;
    let params;

    if (userRole === 'admin') {
      // 管理员可以查看所有待标注任务
      query = `
        SELECT 
          t.id,
          t.image_path,
          t.original_filename,
          t.created_at
        FROM annotation_tasks t
        WHERE t.status IN ('pending', 'annotating', 'rejected')
        ORDER BY t.created_at ASC
        LIMIT ?
      `;
      params = [parseInt(limit).toString()];
    } else {
      // 普通标注员只能查看分配给自己的或未分配的任务
      query = `
        SELECT 
          t.id,
          t.image_path,
          t.original_filename,
          t.created_at
        FROM annotation_tasks t
        WHERE (t.assigned_to = ? OR (t.status = 'pending' AND t.assigned_to IS NULL))
        AND t.status IN ('pending', 'annotating', 'rejected')
        ORDER BY t.created_at ASC
        LIMIT ?
      `;
      params = [userId, parseInt(limit).toString()];
    }

    const [rows] = await pool.execute(query, params);

    res.json({ tasks: rows });

  } catch (error) {
    console.error('获取待标注任务错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 领取任务（自动分配）
const claimTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const annotatorId = req.user.id;

    // 检查任务是否可以领取
    const [taskRows] = await pool.execute(
      'SELECT id, status, assigned_to FROM annotation_tasks WHERE id = ? AND status = "pending" AND assigned_to IS NULL',
      [taskId]
    );

    if (taskRows.length === 0) {
      return res.status(404).json({ message: '任务不存在或已被分配' });
    }

    // 分配任务给当前用户
    await pool.execute(
      'UPDATE annotation_tasks SET assigned_to = ?, status = "annotating" WHERE id = ?',
      [annotatorId, taskId]
    );

    res.json({ message: '任务领取成功' });

  } catch (error) {
    console.error('领取任务错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 获取标注统计
const getAnnotationStats = async (req, res) => {
  try {
    const annotatorId = req.user.id;

    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_annotations,
        SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN r.status IS NULL THEN 1 ELSE 0 END) as pending_review,
        AVG(a.annotation_time) as avg_time,
        SUM(CASE WHEN a.label = 'cat' THEN 1 ELSE 0 END) as cat_labels,
        SUM(CASE WHEN a.label = 'dog' THEN 1 ELSE 0 END) as dog_labels
      FROM annotations a
      LEFT JOIN reviews r ON a.id = r.annotation_id
      WHERE a.annotator_id = ?
    `, [annotatorId]);

    res.json({ stats: stats[0] });

  } catch (error) {
    console.error('获取标注统计错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

module.exports = {
  submitAnnotation,
  getAnnotationHistory,
  getPendingTasks,
  claimTask,
  getAnnotationStats
}; 