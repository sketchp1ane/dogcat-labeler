const Router  = require('express').Router;
const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');
const db      = require('../db');
const { requireRole } = require('../middleware/auth');

// ✅ 自定义存储规则：保持扩展名
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    // 取原始扩展名（.jpg / .jpeg / .png …）
    const ext = path.extname(file.originalname).toLowerCase();
    // 随机文件名 + 原扩展
    const name = crypto.randomBytes(16).toString('hex') + ext;
    cb(null, name);
  }
});

const upload = multer({ storage });
const router = Router();

/* ---------- 管理员上传图片 ---------- */
router.post(
  '/upload',
  requireRole('admin'),
  upload.single('file'),
  async (req, res) => {
    await db.query('INSERT INTO images(file) VALUES(?)', [req.file.filename]);
    res.json({ ok: true });
  }
);

/* ---------- 标注员拉 1 张待标注图 ---------- */
router.get('/pending', requireRole('annotator'), async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM images WHERE status='pending' LIMIT 1"
  );
  res.json(rows[0] || null);
});

module.exports = router;
