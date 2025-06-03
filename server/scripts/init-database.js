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

    // 插入默认管理员
    const hashedPassword = await bcrypt.hash('admin123', 10);
    try {
      await connection.execute(
        'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
        ['admin', hashedPassword, 'admin@example.com', 'admin']
      );
      console.log('✅ 默认管理员账户创建成功 (admin/admin123)');
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('ℹ️ 管理员账户已存在');
      } else {
        throw error;
      }
    }

    // 插入示例用户
    const sampleUsers = [
      { username: 'annotator1', password: 'pass123', email: 'annotator1@example.com', role: 'annotator' },
      { username: 'reviewer1', password: 'pass123', email: 'reviewer1@example.com', role: 'reviewer' }
    ];

    for (const user of sampleUsers) {
      try {
        const hashedPass = await bcrypt.hash(user.password, 10);
        await connection.execute(
          'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
          [user.username, hashedPass, user.email, user.role]
        );
        console.log(`✅ 示例用户 ${user.username} 创建成功`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`ℹ️ 用户 ${user.username} 已存在`);
        } else {
          throw error;
        }
      }
    }

    console.log('🎉 数据库初始化完成！');

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
