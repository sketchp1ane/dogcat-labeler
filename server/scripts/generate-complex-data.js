const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { dbConfig } = require('../config/database');

async function generateComplexData() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database
    });

    console.log('📡 已连接到数据库');

    // 创建更多用户
    console.log('👥 创建更多用户...');
    const newUsers = [
      // 高质量标注员
      { username: 'annotator_expert', password: 'pass123', email: 'expert@example.com', role: 'annotator', skill: 'expert' },
      { username: 'annotator_senior', password: 'pass123', email: 'senior@example.com', role: 'annotator', skill: 'senior' },
      { username: 'annotator_pro', password: 'pass123', email: 'pro@example.com', role: 'annotator', skill: 'senior' },
      
      // 中等质量标注员
      { username: 'annotator_medium1', password: 'pass123', email: 'medium1@example.com', role: 'annotator', skill: 'medium' },
      { username: 'annotator_medium2', password: 'pass123', email: 'medium2@example.com', role: 'annotator', skill: 'medium' },
      { username: 'annotator_regular', password: 'pass123', email: 'regular@example.com', role: 'annotator', skill: 'medium' },
      
      // 新手标注员
      { username: 'annotator_junior1', password: 'pass123', email: 'junior1@example.com', role: 'annotator', skill: 'junior' },
      { username: 'annotator_junior2', password: 'pass123', email: 'junior2@example.com', role: 'annotator', skill: 'junior' },
      { username: 'annotator_newbie', password: 'pass123', email: 'newbie@example.com', role: 'annotator', skill: 'junior' },
      
      // 更多审核员
      { username: 'reviewer_senior', password: 'pass123', email: 'reviewer_senior@example.com', role: 'reviewer', skill: 'expert' },
      { username: 'reviewer_lead', password: 'pass123', email: 'reviewer_lead@example.com', role: 'reviewer', skill: 'expert' },
    ];

    const userIds = {};
    for (const user of newUsers) {
      try {
        const hashedPass = await bcrypt.hash(user.password, 10);
        const [result] = await connection.execute(
          'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
          [user.username, hashedPass, user.email, user.role]
        );
        userIds[user.username] = { id: result.insertId, skill: user.skill };
        console.log(`✅ 用户 ${user.username} (${user.skill} ${user.role}) 创建成功`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          const [existing] = await connection.execute('SELECT id FROM users WHERE username = ?', [user.username]);
          userIds[user.username] = { id: existing[0].id, skill: user.skill };
          console.log(`ℹ️ 用户 ${user.username} 已存在`);
        } else {
          throw error;
        }
      }
    }

    // 获取所有标注员和审核员ID
    const [allAnnotators] = await connection.execute(
      'SELECT id, username FROM users WHERE role = "annotator"'
    );
    const [allReviewers] = await connection.execute(
      'SELECT id, username FROM users WHERE role IN ("reviewer", "admin")'
    );

    console.log(`📊 当前有 ${allAnnotators.length} 个标注员, ${allReviewers.length} 个审核员`);

    // 创建更多复杂任务
    console.log('📋 创建更多复杂任务...');
    const imageCategories = [
      { prefix: 'cat', label: 'cat', count: 50 },
      { prefix: 'dog', label: 'dog', count: 50 },
      { prefix: 'mixed', label: null, count: 20 } // 一些难以分类的图片
    ];

    const taskIds = [];
    let taskCounter = 1;

    for (const category of imageCategories) {
      for (let i = 1; i <= category.count; i++) {
        const filename = `${category.prefix}_${String(i).padStart(3, '0')}.jpg`;
        const createdAt = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000); // 过去14天内
        
        const [result] = await connection.execute(
          'INSERT INTO annotation_tasks (image_path, original_filename, created_by, status, created_at) VALUES (?, ?, ?, ?, ?)',
          [`uploads/complex/${filename}`, filename, 1, 'pending', createdAt]
        );
        taskIds.push({ 
          id: result.insertId, 
          filename, 
          correctLabel: category.label,
          createdAt 
        });
        taskCounter++;
      }
    }

    console.log(`✅ 创建了 ${taskIds.length} 个新任务`);

    // 创建复杂的标注数据
    console.log('✏️ 创建复杂标注数据...');
    
    const skillLevels = {
      'expert': { accuracy: 0.95, speedMin: 10, speedMax: 30, confidenceMin: 0.85, confidenceMax: 1.0 },
      'senior': { accuracy: 0.85, speedMin: 15, speedMax: 45, confidenceMin: 0.75, confidenceMax: 0.95 },
      'medium': { accuracy: 0.75, speedMin: 20, speedMax: 60, confidenceMin: 0.65, confidenceMax: 0.85 },
      'junior': { accuracy: 0.60, speedMin: 30, speedMax: 120, confidenceMin: 0.50, confidenceMax: 0.75 }
    };

    // 为每个任务分配标注员并创建标注
    for (let i = 0; i < taskIds.length * 0.9; i++) { // 90%的任务被标注
      const task = taskIds[i];
      const annotator = allAnnotators[Math.floor(Math.random() * allAnnotators.length)];
      
      // 获取标注员技能等级
      const annotatorSkill = userIds[annotator.username]?.skill || 'medium';
      const skillConfig = skillLevels[annotatorSkill];
      
      // 决定标注是否正确
      const isCorrect = Math.random() < skillConfig.accuracy;
      let label;
      
      if (task.correctLabel === null) {
        // 对于混合类别，随机选择
        label = Math.random() < 0.5 ? 'cat' : 'dog';
      } else if (isCorrect) {
        label = task.correctLabel;
      } else {
        // 错误标注
        label = task.correctLabel === 'cat' ? 'dog' : 'cat';
      }
      
      const confidence = skillConfig.confidenceMin + Math.random() * (skillConfig.confidenceMax - skillConfig.confidenceMin);
      const annotationTime = skillConfig.speedMin + Math.random() * (skillConfig.speedMax - skillConfig.speedMin);
      
      // 标注时间在任务创建后的1-3天内
      const annotationDate = new Date(task.createdAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);
      
      const [annotationResult] = await connection.execute(
        'INSERT INTO annotations (task_id, annotator_id, label, confidence, annotation_time, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [task.id, annotator.id, label, confidence, annotationTime, annotationDate]
      );

      // 更新任务状态
      await connection.execute(
        'UPDATE annotation_tasks SET status = "reviewing", assigned_to = ? WHERE id = ?',
        [annotator.id, task.id]
      );

      // 85%的标注会被审核
      if (Math.random() < 0.85) {
        const reviewer = allReviewers[Math.floor(Math.random() * allReviewers.length)];
        
        // 审核判断：如果是正确标注，95%通过；如果是错误标注，20%通过
        let reviewStatus;
        if (task.correctLabel === null) {
          // 对于混合类别，80%通过
          reviewStatus = Math.random() < 0.8 ? 'approved' : 'rejected';
        } else {
          const shouldApprove = isCorrect ? Math.random() < 0.95 : Math.random() < 0.2;
          reviewStatus = shouldApprove ? 'approved' : 'rejected';
        }
        
        const comments = [
          '标注准确，质量很好',
          '标注正确，继续保持',
          '良好的标注质量',
          '需要更仔细观察图片细节',
          '标注错误，请重新学习标准',
          '置信度偏低，建议提高判断准确性',
          '标注速度可以适当提高',
          '很好的标注，准确且快速'
        ];
        
        const comment = reviewStatus === 'approved' 
          ? comments[Math.floor(Math.random() * 4)]
          : comments[4 + Math.floor(Math.random() * 4)];
        
        // 审核时间在标注后的1-24小时内
        const reviewDate = new Date(annotationDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);
        
        await connection.execute(
          'INSERT INTO reviews (annotation_id, reviewer_id, status, comment, created_at) VALUES (?, ?, ?, ?, ?)',
          [annotationResult.insertId, reviewer.id, reviewStatus, comment, reviewDate]
        );

        if (reviewStatus === 'approved') {
          // 添加到完成表
          await connection.execute(
            'INSERT INTO completed_annotations (task_id, original_filename, image_path, label, annotator_id, reviewer_id, annotation_time, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [task.id, task.filename, `uploads/complex/${task.filename}`, label, annotator.id, reviewer.id, annotationTime, reviewDate]
          );

          // 更新任务状态为completed
          await connection.execute(
            'UPDATE annotation_tasks SET status = "completed" WHERE id = ?',
            [task.id]
          );
        } else {
          // 更新任务状态为rejected
          await connection.execute(
            'UPDATE annotation_tasks SET status = "rejected" WHERE id = ?',
            [task.id]
          );
        }
      }
    }

    // 创建更丰富的历史数据（过去60天）
    console.log('📊 创建60天历史数据...');
    
    for (let day = 60; day > 0; day--) {
      const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
      
      // 工作日和周末的活动量不同
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const baseActivity = isWeekend ? 2 : 8;
      const annotationCount = Math.floor(Math.random() * baseActivity) + 1;
      
      for (let j = 0; j < annotationCount; j++) {
        // 随机选择标注员，但更有经验的标注员活跃度更高
        let selectedAnnotator;
        const rand = Math.random();
        if (rand < 0.4) {
          // 40%概率选择经验丰富的标注员
          selectedAnnotator = allAnnotators.filter(a => 
            ['expert', 'senior'].includes(userIds[a.username]?.skill)
          )[0] || allAnnotators[0];
        } else {
          selectedAnnotator = allAnnotators[Math.floor(Math.random() * allAnnotators.length)];
        }
        
        const annotatorSkill = userIds[selectedAnnotator.username]?.skill || 'medium';
        const skillConfig = skillLevels[annotatorSkill];
        
        // 一天中的不同时间段活跃度不同
        const hour = Math.random() < 0.7 ? 
          9 + Math.floor(Math.random() * 9) : // 70%在工作时间(9-18)
          Math.floor(Math.random() * 24); // 30%在其他时间
          
        const annotationDateTime = new Date(date);
        annotationDateTime.setHours(hour, Math.floor(Math.random() * 60));
        
        // 创建历史任务
        const histFilename = `hist_${date.toISOString().split('T')[0]}_${j}.jpg`;
        const [taskResult] = await connection.execute(
          'INSERT INTO annotation_tasks (image_path, original_filename, created_by, status, created_at) VALUES (?, ?, ?, ?, ?)',
          [`uploads/history/${histFilename}`, histFilename, 1, 'completed', annotationDateTime]
        );

        // 创建历史标注
        const label = Math.random() < 0.5 ? 'cat' : 'dog';
        const confidence = skillConfig.confidenceMin + Math.random() * (skillConfig.confidenceMax - skillConfig.confidenceMin);
        const annotationTime = skillConfig.speedMin + Math.random() * (skillConfig.speedMax - skillConfig.speedMin);

        const [annotationResult] = await connection.execute(
          'INSERT INTO annotations (task_id, annotator_id, label, confidence, annotation_time, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [taskResult.insertId, selectedAnnotator.id, label, confidence, annotationTime, annotationDateTime]
        );

        // 创建历史审核
        const reviewer = allReviewers[Math.floor(Math.random() * allReviewers.length)];
        const reviewDateTime = new Date(annotationDateTime.getTime() + Math.random() * 6 * 60 * 60 * 1000);
        const reviewStatus = Math.random() < (skillConfig.accuracy * 0.9) ? 'approved' : 'rejected';

        await connection.execute(
          'INSERT INTO reviews (annotation_id, reviewer_id, status, comment, created_at) VALUES (?, ?, ?, ?, ?)',
          [annotationResult.insertId, reviewer.id, reviewStatus, '历史审核记录', reviewDateTime]
        );

        if (reviewStatus === 'approved') {
          await connection.execute(
            'INSERT INTO completed_annotations (task_id, original_filename, image_path, label, annotator_id, reviewer_id, annotation_time, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [taskResult.insertId, histFilename, `uploads/history/${histFilename}`, label, selectedAnnotator.id, reviewer.id, annotationTime, reviewDateTime]
          );
        }
      }
    }

    console.log('🎉 复杂测试数据生成完成！');
    console.log('📊 生成的数据包括：');
    console.log(`   - ${newUsers.length} 个新用户（不同技能等级的标注员和审核员）`);
    console.log(`   - ${taskIds.length} 个新的复杂任务`);
    console.log('   - 多样化的标注质量（专家级、高级、中等、新手）');
    console.log('   - 真实的时间分布（工作日vs周末，工作时间vs其他时间）');
    console.log('   - 60天的详细历史数据');
    console.log('   - 不同准确率的标注员表现');

  } catch (error) {
    console.error('❌ 生成复杂数据失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  generateComplexData();
}

module.exports = generateComplexData; 