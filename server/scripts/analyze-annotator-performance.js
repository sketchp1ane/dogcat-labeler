const mysql = require('mysql2/promise');
require('dotenv').config();

const { dbConfig } = require('../config/database');

async function analyzeAnnotatorPerformance() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database
    });

    console.log('📊 标注员表现分析报告');
    console.log('='.repeat(60));

    // 分析标注员表现
    const [annotatorStats] = await connection.execute(`
      SELECT 
        u.username,
        u.role,
        COUNT(a.id) as total_annotations,
        COUNT(r.id) as reviewed_annotations,
        ROUND(
          (SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) * 100.0 / 
           NULLIF(COUNT(r.id), 0)), 1
        ) as approval_rate,
        ROUND(AVG(a.annotation_time), 1) as avg_time,
        ROUND(AVG(a.confidence), 3) as avg_confidence,
        MIN(a.created_at) as first_annotation,
        MAX(a.created_at) as last_annotation
      FROM users u
      LEFT JOIN annotations a ON u.id = a.annotator_id
      LEFT JOIN reviews r ON a.id = r.annotation_id
      WHERE u.role = 'annotator'
      GROUP BY u.id, u.username, u.role
      HAVING total_annotations > 0
      ORDER BY total_annotations DESC
    `);

    console.log('\n📈 标注员表现排行榜:');
    console.log('用户名'.padEnd(20) + '总标注'.padEnd(8) + '已审核'.padEnd(8) + '通过率'.padEnd(8) + '平均时间'.padEnd(10) + '平均置信度'.padEnd(12) + '最近活动');
    console.log('-'.repeat(80));

    annotatorStats.forEach(stat => {
      const username = stat.username.padEnd(20);
      const total = String(stat.total_annotations).padEnd(8);
      const reviewed = String(stat.reviewed_annotations).padEnd(8);
      const approvalRate = (stat.approval_rate ? `${stat.approval_rate}%` : 'N/A').padEnd(8);
      const avgTime = (stat.avg_time ? `${stat.avg_time}秒` : 'N/A').padEnd(10);
      const avgConfidence = (stat.avg_confidence ? `${(stat.avg_confidence * 100).toFixed(1)}%` : 'N/A').padEnd(12);
      const lastActivity = stat.last_annotation ? new Date(stat.last_annotation).toLocaleDateString() : 'N/A';
      
      console.log(`${username}${total}${reviewed}${approvalRate}${avgTime}${avgConfidence}${lastActivity}`);
    });

    // 分析不同时间段的活跃度
    console.log('\n🕐 24小时活跃度分析:');
    const [hourlyStats] = await connection.execute(`
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as annotations,
        COUNT(DISTINCT annotator_id) as active_annotators
      FROM annotations
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY HOUR(created_at)
      ORDER BY hour
    `);

    hourlyStats.forEach(stat => {
      const hour = `${stat.hour}:00`.padEnd(6);
      const bars = '█'.repeat(Math.ceil(stat.annotations / 10)) || '▪';
      console.log(`${hour} ${bars} (${stat.annotations}条标注, ${stat.active_annotators}人)`);
    });

    // 分析标注时间分布
    console.log('\n⏱️ 标注时间分布:');
    const [timeDistribution] = await connection.execute(`
      SELECT 
        CASE 
          WHEN annotation_time < 10 THEN '0-10秒'
          WHEN annotation_time < 30 THEN '10-30秒'
          WHEN annotation_time < 60 THEN '30-60秒'
          WHEN annotation_time < 120 THEN '1-2分钟'
          ELSE '2分钟以上'
        END as time_range,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM annotations WHERE annotation_time IS NOT NULL), 1) as percentage
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
    `);

    timeDistribution.forEach(dist => {
      const range = dist.time_range.padEnd(12);
      const count = String(dist.count).padEnd(8);
      const percentage = `${dist.percentage}%`;
      const bars = '█'.repeat(Math.ceil(dist.percentage / 5)) || '▪';
      console.log(`${range} ${count} ${percentage.padEnd(8)} ${bars}`);
    });

    // 分析标签分布和准确性
    console.log('\n🏷️ 标签分布与质量:');
    const [labelStats] = await connection.execute(`
      SELECT 
        a.label,
        COUNT(*) as count,
        ROUND(AVG(a.confidence), 3) as avg_confidence,
        SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        ROUND(
          (SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) * 100.0 / 
           NULLIF(COUNT(r.id), 0)), 1
        ) as approval_rate
      FROM annotations a
      LEFT JOIN reviews r ON a.id = r.annotation_id
      GROUP BY a.label
      ORDER BY count DESC
    `);

    labelStats.forEach(stat => {
      console.log(`${stat.label.toUpperCase()}: ${stat.count}条标注, 平均置信度${(stat.avg_confidence * 100).toFixed(1)}%, 通过率${stat.approval_rate || 'N/A'}%`);
      console.log(`     通过: ${stat.approved_count}, 拒绝: ${stat.rejected_count}`);
    });

    // 最近7天的活动趋势
    console.log('\n📅 最近7天活动趋势:');
    const [recentTrend] = await connection.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as annotations,
        COUNT(DISTINCT annotator_id) as active_annotators,
        ROUND(AVG(annotation_time), 1) as avg_time
      FROM annotations
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    recentTrend.forEach(trend => {
      const date = new Date(trend.date).toLocaleDateString();
      console.log(`${date}: ${trend.annotations}条标注, ${trend.active_annotators}位标注员, 平均${trend.avg_time}秒`);
    });

    // 审核员工作量
    console.log('\n👨‍⚖️ 审核员工作量:');
    const [reviewerStats] = await connection.execute(`
      SELECT 
        u.username,
        COUNT(r.id) as total_reviews,
        SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        ROUND(
          (SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) * 100.0 / 
           NULLIF(COUNT(r.id), 0)), 1
        ) as approval_rate
      FROM users u
      LEFT JOIN reviews r ON u.id = r.reviewer_id
      WHERE u.role IN ('reviewer', 'admin')
      GROUP BY u.id, u.username
      HAVING total_reviews > 0
      ORDER BY total_reviews DESC
    `);

    reviewerStats.forEach(stat => {
      console.log(`${stat.username}: ${stat.total_reviews}次审核, 通过${stat.approved}, 拒绝${stat.rejected} (通过率${stat.approval_rate}%)`);
    });

    console.log('\n✅ 分析完成！');

  } catch (error) {
    console.error('❌ 分析失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  analyzeAnnotatorPerformance();
}

module.exports = analyzeAnnotatorPerformance; 