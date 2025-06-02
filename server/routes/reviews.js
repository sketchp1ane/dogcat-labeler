const Router        = require('express').Router;
const db            = require('../db');
const { requireRole } = require('../middleware/auth');

const router = Router();

// 审核员拉任务
router.get('/', requireRole('reviewer'), async (req, res) => {
  const [rows] = await db.query(`
    SELECT a.id annotationId, i.file, a.label
    FROM annotations a
    JOIN images i ON a.image_id=i.id
    WHERE i.status='review'
    LIMIT 1
  `);
  res.json(rows[0] || null);
});

// 审核提交
router.post('/', requireRole('reviewer'), async (req, res) => {
  const { annotationId, pass } = req.body;
  const status = pass ? 'approved' : 'rejected';
  await db.query(
    'INSERT INTO reviews(annotation_id,reviewer_id,status) VALUES(?,?,?)',
    [annotationId, req.session.user.id, status]
  );

  const [[{ image_id }]] = await db.query(
    'SELECT image_id FROM annotations WHERE id=?',
    [annotationId]
  );
  await db.query(
    'UPDATE images SET status=? WHERE id=?',
    [pass ? 'completed' : 'pending', image_id]
  );
  res.json({ ok: true });
});

module.exports = router;
