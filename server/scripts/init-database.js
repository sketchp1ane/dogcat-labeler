const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { dbConfig } = require('../config/database');

async function initDatabase() {
  let connection;

  try {
    // 第一次连接（创建数据库）
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    console.log('📡 连接到MySQL服务器');

    await tempConnection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ 数据库 ${dbConfig.database} 创建成功`);

    await tempConnection.end();

    // 第二次连接（连接到数据库）
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database
    });

    console.log(`📡 已连接到数据库 ${dbConfig.database}`);

    // 🧹 清理旧表
    console.log('🧹 正在清理旧表...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    const tables = [
      'completed_annotations',
      'reviews',
      'annotations',
      'annotation_tasks',
      'users'
    ];

    for (const table of tables) {
      try {
        await connection.execute(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`✅ 表 ${table} 已删除`);
      } catch (err) {
        console.error(`⚠️ 删除表 ${table} 失败:`, err);
      }
    }

    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🧹 清理完成，开始重新创建数据表...');

    // 创建用户表
    await connection.execute(`
      CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE,
        role ENUM('annotator', 'reviewer', 'admin') NOT NULL DEFAULT 'annotator',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 创建任务表
    await connection.execute(`
      CREATE TABLE annotation_tasks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        image_path VARCHAR(500) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        status ENUM('pending', 'annotating', 'reviewing', 'completed', 'rejected') NOT NULL DEFAULT 'pending',
        created_by INT NOT NULL,
        assigned_to INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 创建标注表
    await connection.execute(`
      CREATE TABLE annotations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        task_id INT NOT NULL,
        annotator_id INT NOT NULL,
        label ENUM('cat', 'dog') NOT NULL,
        confidence DECIMAL(3,2) DEFAULT 1.00,
        annotation_time INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES annotation_tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (annotator_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 创建审核记录表
    await connection.execute(`
      CREATE TABLE reviews (
        id INT PRIMARY KEY AUTO_INCREMENT,
        annotation_id INT NOT NULL,
        reviewer_id INT NOT NULL,
        status ENUM('approved', 'rejected') NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (annotation_id) REFERENCES annotations(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 创建已完成标注表
    await connection.execute(`
      CREATE TABLE completed_annotations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        task_id INT NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        image_path VARCHAR(500) NOT NULL,
        label ENUM('cat', 'dog') NOT NULL,
        annotator_id INT NOT NULL,
        reviewer_id INT NOT NULL,
        annotation_time INT DEFAULT 0,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (annotator_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ 数据表创建成功');

    // 创建完整的默认用户（与项目文档保持一致）
    console.log('👥 创建默认测试用户...');
    
    const defaultUsers = [
      // 管理员账户
      { username: 'admin', password: 'admin123', email: 'admin@example.com', role: 'admin', description: '管理员账户' },
      
      // 审核员账户
      { username: 'reviewer1', password: 'pass123', email: 'reviewer1@example.com', role: 'reviewer', description: '基础审核员' },
      { username: 'reviewer_senior', password: 'pass123', email: 'reviewer_senior@example.com', role: 'reviewer', description: '资深审核员' },
      { username: 'reviewer_lead', password: 'pass123', email: 'reviewer_lead@example.com', role: 'reviewer', description: '主管审核员' },
      
      // 专家级标注员
      { username: 'annotator_expert', password: 'pass123', email: 'annotator_expert@example.com', role: 'annotator', description: '专家级标注员' },
      
      // 高级标注员
      { username: 'annotator_senior', password: 'pass123', email: 'annotator_senior@example.com', role: 'annotator', description: '高级标注员' },
      { username: 'annotator_pro', password: 'pass123', email: 'annotator_pro@example.com', role: 'annotator', description: '专业标注员' },
      
      // 中级标注员
      { username: 'annotator1', password: 'pass123', email: 'annotator1@example.com', role: 'annotator', description: '默认标注员' },
      { username: 'annotator_medium1', password: 'pass123', email: 'annotator_medium1@example.com', role: 'annotator', description: '中级标注员1' },
      { username: 'annotator_medium2', password: 'pass123', email: 'annotator_medium2@example.com', role: 'annotator', description: '中级标注员2' },
      { username: 'annotator_regular', password: 'pass123', email: 'annotator_regular@example.com', role: 'annotator', description: '普通标注员' },
      
      // 新手标注员
      { username: 'annotator_junior1', password: 'pass123', email: 'annotator_junior1@example.com', role: 'annotator', description: '新手标注员1' },
      { username: 'annotator_junior2', password: 'pass123', email: 'annotator_junior2@example.com', role: 'annotator', description: '新手标注员2' },
      { username: 'annotator_newbie', password: 'pass123', email: 'annotator_newbie@example.com', role: 'annotator', description: '初学者' }
    ];

    let createdCount = 0;
    for (const user of defaultUsers) {
      try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await connection.execute(
          'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
          [user.username, hashedPassword, user.email, user.role]
        );
        console.log(`✅ ${user.description} (${user.username}) 创建成功`);
        createdCount++;
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`ℹ️ 用户 ${user.username} 已存在`);
        } else {
          console.error(`❌ 创建用户 ${user.username} 失败:`, error.message);
        }
      }
    }

    console.log(`\n📊 用户创建统计:`);
    console.log(`   成功创建: ${createdCount} 个用户`);
    console.log(`   管理员: 1 个 (admin)`);
    console.log(`   审核员: 3 个 (reviewer1, reviewer_senior, reviewer_lead)`);
    console.log(`   标注员: 10 个 (不同技能等级)`);

    console.log(`\n🔐 默认登录信息:`);
    console.log(`   管理员: admin / admin123`);
    console.log(`   审核员: reviewer1 / pass123`);
    console.log(`   标注员: annotator1 / pass123`);
    console.log(`   所有密码统一为: pass123 (管理员除外)`);

    console.log('\n🎉 数据库初始化完成！');
    console.log('💡 提示: 现在可以运行 generate-complex-data.js 来生成测试数据');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
