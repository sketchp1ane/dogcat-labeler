const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// 获取所有用户列表
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, 
        username, 
        email, 
        role, 
        created_at, 
        updated_at
      FROM users
    `;
    const params = [];

    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }

    query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [rows] = await pool.execute(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    const countParams = [];
    
    if (role) {
      countQuery += ' WHERE role = ?';
      countParams.push(role);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      users: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 获取用户详情
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const [rows] = await pool.execute(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ user: rows[0] });

  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 更新用户信息
const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email, role, password } = req.body;

    // 检查用户是否存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 检查用户名和邮箱是否被其他用户使用
    if (username || email) {
      const [conflicts] = await pool.execute(
        'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
        [username, email, userId]
      );

      if (conflicts.length > 0) {
        return res.status(409).json({ message: '用户名或邮箱已被使用' });
      }
    }

    // 构建更新字段
    const updateFields = [];
    const updateValues = [];

    if (username) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (role && ['annotator', 'reviewer', 'admin'].includes(role)) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return res.status(400).json({ message: '密码长度至少6位' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: '没有要更新的字段' });
    }

    updateValues.push(userId);

    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // 获取更新后的用户信息
    const [updatedUser] = await pool.execute(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      message: '用户信息更新成功',
      user: updatedUser[0]
    });

  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 删除用户
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user.id;

    // 不能删除自己
    if (parseInt(userId) === currentUserId) {
      return res.status(400).json({ message: '不能删除自己的账户' });
    }

    // 检查用户是否存在
    const [existingUsers] = await pool.execute(
      'SELECT id, username FROM users WHERE id = ?',
      [userId]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 删除用户（外键约束会自动处理相关数据）
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: '用户删除成功' });

  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 重置用户密码
const resetPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: '新密码长度至少6位' });
    }

    // 检查用户是否存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({ message: '密码重置成功' });

  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 获取用户统计信息
const getUserStats = async (req, res) => {
  try {
    const [roleStats] = await pool.execute(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      GROUP BY role
    `);

    const [userActivity] = await pool.execute(`
      SELECT 
        u.id,
        u.username,
        u.role,
        COUNT(DISTINCT a.id) as annotation_count,
        COUNT(DISTINCT r.id) as review_count
      FROM users u
      LEFT JOIN annotations a ON u.id = a.annotator_id
      LEFT JOIN reviews r ON u.id = r.reviewer_id
      GROUP BY u.id, u.username, u.role
      ORDER BY annotation_count DESC, review_count DESC
      LIMIT 10
    `);

    res.json({
      roleStats,
      topUsers: userActivity
    });

  } catch (error) {
    console.error('获取用户统计错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  resetPassword,
  getUserStats
}; 