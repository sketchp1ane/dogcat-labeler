const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const { dbConfig } = require('../config/database');

async function generateSampleData() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database
    });

    console.log('📡 已连接到数据库');

    // 创建示例任务
    console.log('📋 创建示例任务...');
    const sampleImages = [
      'cat1.jpg', 'cat2.jpg', 'cat3.jpg', 'dog1.jpg', 'dog2.jpg', 
      'dog3.jpg', 'cat4.jpg', 'dog4.jpg', 'cat5.jpg', 'dog5.jpg'
    ];

    const taskIds = [];
    for (let i = 0; i < sampleImages.length; i++) {
      const [result] = await connection.execute(
        'INSERT INTO annotation_tasks (image_path, original_filename, created_by, status, created_at) VALUES (?, ?, ?, ?, ?)',
        [
          `uploads/sample/${sampleImages[i]}`, 
          sampleImages[i], 
          1, // admin创建
          'pending',
          new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // 过去7天内随机时间
        ]
      );
      taskIds.push(result.insertId);
    }

    // 创建示例标注（模拟不同时间的标注）
    console.log('✏️ 创建示例标注...');
    const annotators = [2, 3]; // annotator1 和 reviewer1（reviewer1也可以标注）
    const labels = ['cat', 'dog'];
    
    for (let i = 0; i < taskIds.length * 0.8; i++) { // 80%的任务被标注
      const taskId = taskIds[i];
      const annotatorId = annotators[Math.floor(Math.random() * annotators.length)];
      const label = labels[Math.floor(Math.random() * labels.length)];
      const confidence = 0.7 + Math.random() * 0.3; // 0.7-1.0之间
      const annotationTime = 5 + Math.random() * 120; // 5-125秒
      const createdAt = new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000); // 过去5天内

      const [result] = await connection.execute(
        'INSERT INTO annotations (task_id, annotator_id, label, confidence, annotation_time, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [taskId, annotatorId, label, confidence, annotationTime, createdAt]
      );

      // 更新任务状态为reviewing
      await connection.execute(
        'UPDATE annotation_tasks SET status = "reviewing", assigned_to = ? WHERE id = ?',
        [annotatorId, taskId]
      );

      // 80%的标注会被审核
      if (Math.random() < 0.8) {
        const reviewStatus = Math.random() < 0.85 ? 'approved' : 'rejected'; // 85%通过率
        const comment = reviewStatus === 'approved' ? '标注正确' : '需要重新标注';
        const reviewTime = new Date(createdAt.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000); // 标注后1-2天内审核

        await connection.execute(
          'INSERT INTO reviews (annotation_id, reviewer_id, status, comment, created_at) VALUES (?, ?, ?, ?, ?)',
          [result.insertId, 3, reviewStatus, comment, reviewTime] // reviewer1审核
        );

        if (reviewStatus === 'approved') {
          // 添加到完成表
          await connection.execute(
            'INSERT INTO completed_annotations (task_id, original_filename, image_path, label, annotator_id, reviewer_id, annotation_time, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [taskId, sampleImages[taskId - taskIds[0]], `uploads/sample/${sampleImages[taskId - taskIds[0]]}`, label, annotatorId, 3, annotationTime, reviewTime]
          );

          // 更新任务状态为completed
          await connection.execute(
            'UPDATE annotation_tasks SET status = "completed" WHERE id = ?',
            [taskId]
          );
        } else {
          // 更新任务状态为rejected
          await connection.execute(
            'UPDATE annotation_tasks SET status = "rejected" WHERE id = ?',
            [taskId]
          );
        }
      }
    }

    // 创建一些历史数据（模拟过去30天的活动）
    console.log('📊 创建历史数据...');
    for (let day = 30; day > 0; day--) {
      const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
      const annotationCount = Math.floor(Math.random() * 5) + 1; // 每天1-5个标注
      
      for (let j = 0; j < annotationCount; j++) {
        // 创建临时任务
        const [taskResult] = await connection.execute(
          'INSERT INTO annotation_tasks (image_path, original_filename, created_by, status, created_at) VALUES (?, ?, ?, ?, ?)',
          [`uploads/sample/temp_${date.getTime()}_${j}.jpg`, `temp_${date.getTime()}_${j}.jpg`, 1, 'completed', date]
        );

        // 创建标注
        const annotatorId = annotators[Math.floor(Math.random() * annotators.length)];
        const label = labels[Math.floor(Math.random() * labels.length)];
        const annotationDateTime = new Date(date.getTime() + Math.random() * 12 * 60 * 60 * 1000); // 当天内随机时间

        const [annotationResult] = await connection.execute(
          'INSERT INTO annotations (task_id, annotator_id, label, confidence, annotation_time, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [taskResult.insertId, annotatorId, label, 0.8 + Math.random() * 0.2, 10 + Math.random() * 60, annotationDateTime]
        );

        // 创建审核
        const reviewDateTime = new Date(annotationDateTime.getTime() + Math.random() * 6 * 60 * 60 * 1000); // 6小时内审核
        const reviewStatus = Math.random() < 0.85 ? 'approved' : 'rejected';

        await connection.execute(
          'INSERT INTO reviews (annotation_id, reviewer_id, status, comment, created_at) VALUES (?, ?, ?, ?, ?)',
          [annotationResult.insertId, 3, reviewStatus, reviewStatus === 'approved' ? '标注正确' : '需要改进', reviewDateTime]
        );

        if (reviewStatus === 'approved') {
          await connection.execute(
            'INSERT INTO completed_annotations (task_id, original_filename, image_path, label, annotator_id, reviewer_id, annotation_time, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [taskResult.insertId, `temp_${date.getTime()}_${j}.jpg`, `uploads/sample/temp_${date.getTime()}_${j}.jpg`, label, annotatorId, 3, 10 + Math.random() * 60, reviewDateTime]
          );
        }
      }
    }

    console.log('🎉 示例数据生成完成！');
    console.log('📊 生成的数据包括：');
    console.log('   - 10个示例任务');
    console.log('   - 多个标注记录');
    console.log('   - 审核记录');
    console.log('   - 30天的历史数据');

  } catch (error) {
    console.error('❌ 生成示例数据失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  generateSampleData();
}

module.exports = generateSampleData; 