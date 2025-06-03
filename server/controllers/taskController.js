const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs');

// 创建标注任务（上传图片）
const createTasks = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '请选择要上传的图片' });
    }

    const createdBy = req.user.id;
    const tasks = [];

    // 为每个上传的文件创建任务
    for (const file of req.files) {
      const [result] = await pool.execute(
        'INSERT INTO annotation_tasks (image_path, original_filename, created_by, status) VALUES (?, ?, ?, ?)',
        [file.path, file.originalname, createdBy, 'pending']
      );

      tasks.push({
        id: result.insertId,
        image_path: file.path,
        original_filename: file.originalname,
        status: 'pending'
      });
    }

    res.status(201).json({
      message: `成功创建 ${tasks.length} 个标注任务`,
      tasks
    });

  } catch (error) {
    console.error('创建任务错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 获取任务列表
const getTasks = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userRole = req.user.role;
    const userId = req.user.id;

    let query = `
      SELECT 
        t.id,
        t.image_path,
        t.original_filename,
        t.status,
        t.created_at,
        t.updated_at,
        creator.username as created_by_name,
        assignee.username as assigned_to_name
      FROM annotation_tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
    `;
    
    const params = [];

    // 根据用户角色和状态过滤任务
    const conditions = [];
    
    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }

    // 标注员只能看到分配给自己的或未分配的待标注任务
    if (userRole === 'annotator') {
      conditions.push('(t.assigned_to = ? OR (t.status = "pending" AND t.assigned_to IS NULL))');
      params.push(userId);
    }
    // 审核员可以看到待审核的任务
    else if (userRole === 'reviewer') {
      if (!status) {
        conditions.push('t.status IN ("reviewing", "completed", "rejected")');
      }
    }
    // 管理员可以看到所有任务

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY t.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [rows] = await pool.execute(query, params.slice(0, -2));

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM annotation_tasks t';
    const countParams = [];
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.slice(0, -2).join(' AND ');
      countParams.push(...params.slice(0, -2));
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      tasks: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取任务列表错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 获取任务详情
const getTaskById = async (req, res) => {
  try {
    const taskId = req.params.id;

    const [rows] = await pool.execute(`
      SELECT 
        t.*,
        creator.username as created_by_name,
        assignee.username as assigned_to_name,
        a.label as annotation_label,
        a.confidence as annotation_confidence,
        a.annotation_time,
        annotator.username as annotator_name
      FROM annotation_tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN annotations a ON t.id = a.task_id
      LEFT JOIN users annotator ON a.annotator_id = annotator.id
      WHERE t.id = ?
    `, [taskId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: '任务不存在' });
    }

    const task = rows[0];

    // 检查权限
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole === 'annotator') {
      // 标注员只能查看分配给自己的或未分配的任务
      if (task.assigned_to && task.assigned_to !== userId) {
        return res.status(403).json({ message: '无权查看此任务' });
      }
    }

    res.json({ task });

  } catch (error) {
    console.error('获取任务详情错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 分配任务给标注员
const assignTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { annotatorId } = req.body;

    // 检查任务是否存在且状态为pending
    const [taskRows] = await pool.execute(
      'SELECT id, status FROM annotation_tasks WHERE id = ?',
      [taskId]
    );

    if (taskRows.length === 0) {
      return res.status(404).json({ message: '任务不存在' });
    }

    if (taskRows[0].status !== 'pending') {
      return res.status(400).json({ message: '只能分配待处理的任务' });
    }

    // 检查标注员是否存在且角色正确
    const [userRows] = await pool.execute(
      'SELECT id, role FROM users WHERE id = ? AND role IN ("annotator", "reviewer", "admin")',
      [annotatorId]
    );

    if (userRows.length === 0) {
      return res.status(400).json({ message: '指定的用户不存在或角色不正确' });
    }

    // 分配任务
    await pool.execute(
      'UPDATE annotation_tasks SET assigned_to = ?, status = "annotating" WHERE id = ?',
      [annotatorId, taskId]
    );

    res.json({ message: '任务分配成功' });

  } catch (error) {
    console.error('分配任务错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 删除任务
const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    // 获取任务信息
    const [taskRows] = await pool.execute(
      'SELECT image_path FROM annotation_tasks WHERE id = ?',
      [taskId]
    );

    if (taskRows.length === 0) {
      return res.status(404).json({ message: '任务不存在' });
    }

    const imagePath = taskRows[0].image_path;

    // 删除数据库记录
    await pool.execute('DELETE FROM annotation_tasks WHERE id = ?', [taskId]);

    // 删除图片文件
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    res.json({ message: '任务删除成功' });

  } catch (error) {
    console.error('删除任务错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 获取任务统计信息
const getTaskStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'annotating' THEN 1 ELSE 0 END) as annotating,
        SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM annotation_tasks
    `);

    const [labelStats] = await pool.execute(`
      SELECT 
        label,
        COUNT(*) as count
      FROM completed_annotations
      GROUP BY label
    `);

    res.json({
      taskStats: stats[0],
      labelStats: labelStats
    });

  } catch (error) {
    console.error('获取统计信息错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

module.exports = {
  createTasks,
  getTasks,
  getTaskById,
  assignTask,
  deleteTask,
  getTaskStats
}; 