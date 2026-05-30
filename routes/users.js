const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT id, slug, name, title, avatar_url FROM users');
  res.json(rows);
});

router.get('/:slug', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM users WHERE slug = ?', [req.params.slug]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

module.exports = router;
