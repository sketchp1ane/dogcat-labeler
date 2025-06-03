const { pool } = require('../config/database');

// 获取待审核的标注
const getPendingReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = `
      SELECT 
        a.id,
        a.label,
        a.confidence,
        a.annotation_time,
        a.created_at,
        t.id as task_id,
        t.original_filename,
        t.image_path,
        annotator.username as annotator_username,
        annotator.id as annotator_id,
        r.id as review_id,
        r.status as review_status,
        r.comment as review_comment,
        r.created_at as review_created_at,
        reviewer.username as reviewer_username
      FROM annotations a
      JOIN annotation_tasks t ON a.task_id = t.id
      JOIN users annotator ON a.annotator_id = annotator.id
      LEFT JOIN reviews r ON a.id = r.annotation_id
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
    `;

    let countQuery = `
      SELECT COUNT(*) as total 
      FROM annotations a
      JOIN annotation_tasks t ON a.task_id = t.id
      LEFT JOIN reviews r ON a.id = r.annotation_id
    `;

    let whereClause = '';
    
    if (status === 'pending') {
      whereClause = 'WHERE t.status = "reviewing" AND r.status IS NULL';
    } else if (status === 'approved') {
      whereClause = 'WHERE r.status = "approved"';
    } else if (status === 'rejected') {
      whereClause = 'WHERE r.status = "rejected"';
    } else {
      // all 或 undefined - 显示所有已审核的和待审核的
      whereClause = 'WHERE (t.status = "reviewing" OR r.status IS NOT NULL)';
    }

    const finalQuery = baseQuery + whereClause + ' ORDER BY COALESCE(r.created_at, a.created_at) DESC LIMIT ? OFFSET ?';
    const finalCountQuery = countQuery + whereClause;

    const [rows] = await pool.execute(finalQuery, [parseInt(limit).toString(), parseInt(offset).toString()]);
    const [countResult] = await pool.execute(finalCountQuery);

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
    console.error('获取待审核标注错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 审核标注（通过或拒绝）
const reviewAnnotation = async (req, res) => {
  try {
    const annotationId = req.params.annotationId;
    const { status, comment = '' } = req.body;
    const reviewerId = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: '无效的审核状态' });
    }

    // 检查标注是否存在且可以审核
    const [annotationRows] = await pool.execute(`
      SELECT 
        a.id,
        a.task_id,
        a.label,
        a.annotator_id,
        a.confidence,
        a.annotation_time,
        t.original_filename,
        t.image_path,
        t.status as task_status
      FROM annotations a
      JOIN annotation_tasks t ON a.task_id = t.id
      WHERE a.id = ? AND t.status = 'reviewing'
    `, [annotationId]);

    if (annotationRows.length === 0) {
      return res.status(404).json({ message: '标注不存在或不在审核状态' });
    }

    const annotation = annotationRows[0];

    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 检查是否已有审核记录
      const [existingReviews] = await connection.execute(
        'SELECT id FROM reviews WHERE annotation_id = ?',
        [annotationId]
      );

      if (existingReviews.length > 0) {
        // 更新现有审核记录
        await connection.execute(
          'UPDATE reviews SET status = ?, comment = ?, reviewer_id = ?, created_at = CURRENT_TIMESTAMP WHERE annotation_id = ?',
          [status, comment, reviewerId, annotationId]
        );
      } else {
        // 创建新的审核记录
        await connection.execute(
          'INSERT INTO reviews (annotation_id, reviewer_id, status, comment) VALUES (?, ?, ?, ?)',
          [annotationId, reviewerId, status, comment]
        );
      }

      if (status === 'approved') {
        // 审核通过：将结果移动到完成表并更新任务状态
        await connection.execute(`
          INSERT INTO completed_annotations 
          (task_id, original_filename, image_path, label, annotator_id, reviewer_id, annotation_time)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          annotation.task_id,
          annotation.original_filename,
          annotation.image_path,
          annotation.label,
          annotation.annotator_id,
          reviewerId,
          annotation.annotation_time
        ]);

        // 更新任务状态为已完成
        await connection.execute(
          'UPDATE annotation_tasks SET status = "completed" WHERE id = ?',
          [annotation.task_id]
        );

      } else {
        // 审核拒绝：将任务状态改为rejected，标注员可以重新标注
        await connection.execute(
          'UPDATE annotation_tasks SET status = "rejected" WHERE id = ?',
          [annotation.task_id]
        );
      }

      await connection.commit();

      res.json({
        message: status === 'approved' ? '标注审核通过' : '标注已打回重做',
        status
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('审核标注错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 获取审核历史
const getReviewHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const reviewerId = req.user.id;
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(`
      SELECT 
        r.id,
        r.status,
        r.comment,
        r.created_at,
        a.label,
        a.confidence,
        t.original_filename,
        annotator.username as annotator_name
      FROM reviews r
      JOIN annotations a ON r.annotation_id = a.id
      JOIN annotation_tasks t ON a.task_id = t.id
      JOIN users annotator ON a.annotator_id = annotator.id
      WHERE r.reviewer_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [reviewerId, parseInt(limit).toString(), parseInt(offset).toString()]);

    // 获取总数
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM reviews WHERE reviewer_id = ?',
      [reviewerId]
    );

    const total = countResult[0].total;

    res.json({
      reviews: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取审核历史错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 获取审核统计
const getReviewStats = async (req, res) => {
  try {
    const reviewerId = req.user.id;

    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_reviews,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
      FROM reviews 
      WHERE reviewer_id = ?
    `, [reviewerId]);

    // 获取待审核数量
    const [pendingCount] = await pool.execute(`
      SELECT COUNT(*) as pending_count
      FROM annotations a
      JOIN annotation_tasks t ON a.task_id = t.id
      WHERE t.status = 'reviewing'
    `);

    res.json({
      stats: {
        ...stats[0],
        pending_count: pendingCount[0].pending_count
      }
    });

  } catch (error) {
    console.error('获取审核统计错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 批量审核
const batchReview = async (req, res) => {
  try {
    const { annotationIds, status, comment = '' } = req.body;
    const reviewerId = req.user.id;

    if (!Array.isArray(annotationIds) || annotationIds.length === 0) {
      return res.status(400).json({ message: '请选择要审核的标注' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: '无效的审核状态' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let successCount = 0;
      
      for (const annotationId of annotationIds) {
        // 检查标注是否可以审核
        const [annotationRows] = await connection.execute(`
          SELECT 
            a.id,
            a.task_id,
            a.label,
            a.annotator_id,
            a.confidence,
            a.annotation_time,
            t.original_filename,
            t.image_path,
            t.status as task_status
          FROM annotations a
          JOIN annotation_tasks t ON a.task_id = t.id
          WHERE a.id = ? AND t.status = 'reviewing'
        `, [annotationId]);

        if (annotationRows.length === 0) continue;

        const annotation = annotationRows[0];

        // 处理审核记录
        const [existingReviews] = await connection.execute(
          'SELECT id FROM reviews WHERE annotation_id = ?',
          [annotationId]
        );

        if (existingReviews.length > 0) {
          await connection.execute(
            'UPDATE reviews SET status = ?, comment = ?, reviewer_id = ?, created_at = CURRENT_TIMESTAMP WHERE annotation_id = ?',
            [status, comment, reviewerId, annotationId]
          );
        } else {
          await connection.execute(
            'INSERT INTO reviews (annotation_id, reviewer_id, status, comment) VALUES (?, ?, ?, ?)',
            [annotationId, reviewerId, status, comment]
          );
        }

        if (status === 'approved') {
          // 审核通过
          await connection.execute(`
            INSERT INTO completed_annotations 
            (task_id, original_filename, image_path, label, annotator_id, reviewer_id, annotation_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            annotation.task_id,
            annotation.original_filename,
            annotation.image_path,
            annotation.label,
            annotation.annotator_id,
            reviewerId,
            annotation.annotation_time
          ]);

          await connection.execute(
            'UPDATE annotation_tasks SET status = "completed" WHERE id = ?',
            [annotation.task_id]
          );
        } else {
          // 审核拒绝
          await connection.execute(
            'UPDATE annotation_tasks SET status = "rejected" WHERE id = ?',
            [annotation.task_id]
          );
        }

        successCount++;
      }

      await connection.commit();

      res.json({
        message: `成功审核 ${successCount} 个标注`,
        processedCount: successCount
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('批量审核错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

module.exports = {
  getPendingReviews,
  reviewAnnotation,
  getReviewHistory,
  getReviewStats,
  batchReview
};