const mysql = require('mysql2/promise');
require('dotenv').config();

const { dbConfig } = require('../config/database');

async function checkDatabase() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database
    });

    console.log('📡 已连接到数据库');

    // 检查各表的数据数量
    const tables = ['users', 'annotation_tasks', 'annotations', 'reviews', 'completed_annotations'];
    
    console.log('\n📊 数据库表统计:');
    console.log('='.repeat(50));
    
    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`${table.padEnd(20)}: ${rows[0].count} 条记录`);
      } catch (error) {
        console.log(`${table.padEnd(20)}: 表不存在或查询失败`);
      }
    }

    // 检查用户详情
    console.log('\n👥 用户列表:');
    console.log('='.repeat(50));
    try {
      const [users] = await connection.execute('SELECT id, username, role, created_at FROM users ORDER BY id');
      if (users.length > 0) {
        users.forEach(user => {
          console.log(`ID: ${user.id}, 用户名: ${user.username}, 角色: ${user.role}, 创建时间: ${user.created_at}`);
        });
      } else {
        console.log('暂无用户数据');
      }
    } catch (error) {
      console.log('无法获取用户信息');
    }

    // 检查任务状态
    console.log('\n📋 任务状态统计:');
    console.log('='.repeat(50));
    try {
      const [tasks] = await connection.execute(`
        SELECT 
          status,
          COUNT(*) as count
        FROM annotation_tasks 
        GROUP BY status
        ORDER BY status
      `);
      if (tasks.length > 0) {
        tasks.forEach(task => {
          console.log(`${task.status}: ${task.count} 个任务`);
        });
      } else {
        console.log('暂无任务数据');
      }
    } catch (error) {
      console.log('无法获取任务状态');
    }

    // 检查审核状态
    console.log('\n✅ 审核状态统计:');
    console.log('='.repeat(50));
    try {
      const [reviews] = await connection.execute(`
        SELECT 
          status,
          COUNT(*) as count
        FROM reviews 
        GROUP BY status
        ORDER BY status
      `);
      if (reviews.length > 0) {
        reviews.forEach(review => {
          console.log(`${review.status}: ${review.count} 个审核记录`);
        });
      } else {
        console.log('暂无审核数据');
      }
    } catch (error) {
      console.log('无法获取审核状态');
    }

    // 检查是否有问题数据（审核状态与任务状态不匹配）
    console.log('\n🔍 数据一致性检查:');
    console.log('='.repeat(50));
    try {
      const [inconsistent] = await connection.execute(`
        SELECT 
          t.id as task_id,
          t.status as task_status,
          a.id as annotation_id,
          r.status as review_status
        FROM annotation_tasks t
        LEFT JOIN annotations a ON t.id = a.task_id
        LEFT JOIN reviews r ON a.id = r.annotation_id
        WHERE (t.status = 'reviewing' AND r.status IS NOT NULL)
           OR (t.status = 'rejected' AND r.status != 'rejected')
           OR (t.status = 'completed' AND r.status != 'approved')
      `);
      
      if (inconsistent.length > 0) {
        console.log('发现数据不一致的记录:');
        inconsistent.forEach(record => {
          console.log(`任务ID: ${record.task_id}, 任务状态: ${record.task_status}, 审核状态: ${record.review_status || 'NULL'}`);
        });
      } else {
        console.log('✅ 数据状态一致，无异常');
      }
    } catch (error) {
      console.log('无法进行一致性检查');
    }

  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  checkDatabase();
}

module.exports = checkDatabase; 