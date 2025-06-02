const Router        = require('express').Router;
const db            = require('../db');
const { requireRole } = require('../middleware/auth');

const router = Router();

// 标注提交
router.post('/', requireRole('annotator'), async (req, res) => {
  const { imageId, label } = req.body;
  await db.query(
    'INSERT INTO annotations(image_id,user_id,label) VALUES(?,?,?)',
    [imageId, req.session.user.id, label]
  );
  await db.query("UPDATE images SET status='review' WHERE id=?", [imageId]);
  res.json({ ok: true });
});

module.exports = router;
