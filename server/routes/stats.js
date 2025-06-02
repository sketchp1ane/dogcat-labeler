const Router = require('express').Router;
const db     = require('../db');
const { requireRole } = require('../middleware/auth');

const router = Router();

router.get('/', requireRole('admin'), async (req, res) => {
  const [rows] = await db.query(`
    SELECT status, COUNT(*) count
    FROM images
    GROUP BY status
  `);
  res.json(rows);         // [{status:'pending',count:5}, ...]
});

module.exports = router;
