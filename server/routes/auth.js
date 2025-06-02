const Router = require('express').Router;
const bcrypt = require('bcrypt');
const db     = require('../db');

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const [[user]] = await db.query(
    'SELECT * FROM users WHERE username=?',
    [username]
  );
  if (!user) return res.status(400).json({ msg: 'user not found' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ msg: 'wrong password' });

  req.session.user = { id: user.id, role: user.role };
  res.json(req.session.user);
});

router.get('/me', (req, res) => res.json(req.session.user || null));

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

module.exports = router;
