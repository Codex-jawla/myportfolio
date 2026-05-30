const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Simple secret key middleware for admin routes
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'portfolio-admin-2025';
const adminAuth = (req, res, next) => {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (key !== ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

// ============ USERS ============
router.get('/users', adminAuth, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM users ORDER BY created_at DESC');
  res.json(rows);
});

router.post('/users', adminAuth, async (req, res) => {
  const { slug, name, title, bio, email, phone, location, avatar_url, github_url, linkedin_url, twitter_url, resume_url, years_of_experience } = req.body;
  const [result] = await db.query(
    'INSERT INTO users (slug,name,title,bio,email,phone,location,avatar_url,github_url,linkedin_url,twitter_url,resume_url,years_of_experience) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [slug, name, title, bio, email, phone, location, avatar_url, github_url, linkedin_url, twitter_url, resume_url, years_of_experience || 0]
  );
  res.json({ id: result.insertId, message: 'User created' });
});

router.put('/users/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  await db.query(`UPDATE users SET ${keys} WHERE id = ?`, [...Object.values(fields), id]);
  res.json({ message: 'User updated' });
});

router.delete('/users/:id', adminAuth, async (req, res) => {
  await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ message: 'User deleted' });
});

// ============ PROJECTS ============
router.get('/projects', adminAuth, async (req, res) => {
  const { user_id } = req.query;
  const q = user_id ? 'SELECT * FROM projects WHERE user_id = ?' : 'SELECT p.*, u.name as user_name FROM projects p JOIN users u ON p.user_id = u.id';
  const [rows] = user_id ? await db.query(q, [user_id]) : await db.query(q);
  res.json(rows.map(r => ({ ...r, tech_stack: typeof r.tech_stack === 'string' ? JSON.parse(r.tech_stack) : r.tech_stack })));
});

router.post('/projects', adminAuth, async (req, res) => {
  const { user_id, title, description, long_description, thumbnail_url, tech_stack, github_url, live_url, category, featured, display_order } = req.body;
  const [result] = await db.query(
    'INSERT INTO projects (user_id,title,description,long_description,thumbnail_url,tech_stack,github_url,live_url,category,featured,display_order) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [user_id, title, description, long_description, thumbnail_url, JSON.stringify(tech_stack), github_url, live_url, category, featured || false, display_order || 0]
  );
  res.json({ id: result.insertId, message: 'Project created' });
});

router.put('/projects/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const f = req.body;
  if (f.tech_stack) f.tech_stack = JSON.stringify(f.tech_stack);
  const keys = Object.keys(f).map(k => `${k} = ?`).join(', ');
  await db.query(`UPDATE projects SET ${keys} WHERE id = ?`, [...Object.values(f), id]);
  res.json({ message: 'Project updated' });
});

router.delete('/projects/:id', adminAuth, async (req, res) => {
  await db.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
  res.json({ message: 'Project deleted' });
});

// ============ EXPERIENCE ============
router.get('/experience', adminAuth, async (req, res) => {
  const { user_id } = req.query;
  const [rows] = user_id
    ? await db.query('SELECT * FROM experience WHERE user_id = ?', [user_id])
    : await db.query('SELECT e.*, u.name as user_name FROM experience e JOIN users u ON e.user_id = u.id');
  res.json(rows.map(r => ({ ...r, technologies: typeof r.technologies === 'string' ? JSON.parse(r.technologies) : r.technologies })));
});

router.post('/experience', adminAuth, async (req, res) => {
  const { user_id, company, role, location, start_date, end_date, is_current, description, technologies, company_logo_url } = req.body;
  const [result] = await db.query(
    'INSERT INTO experience (user_id,company,role,location,start_date,end_date,is_current,description,technologies,company_logo_url) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [user_id, company, role, location, start_date, end_date || null, is_current || false, description, JSON.stringify(technologies), company_logo_url]
  );
  res.json({ id: result.insertId, message: 'Experience created' });
});

router.put('/experience/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const f = req.body;
  if (f.technologies) f.technologies = JSON.stringify(f.technologies);
  const keys = Object.keys(f).map(k => `${k} = ?`).join(', ');
  await db.query(`UPDATE experience SET ${keys} WHERE id = ?`, [...Object.values(f), id]);
  res.json({ message: 'Experience updated' });
});

router.delete('/experience/:id', adminAuth, async (req, res) => {
  await db.query('DELETE FROM experience WHERE id = ?', [req.params.id]);
  res.json({ message: 'Experience deleted' });
});

// ============ SKILLS ============
router.post('/skills', adminAuth, async (req, res) => {
  const { user_id, category, name, proficiency, icon_key } = req.body;
  const [result] = await db.query(
    'INSERT INTO skills (user_id,category,name,proficiency,icon_key) VALUES (?,?,?,?,?)',
    [user_id, category, name, proficiency || 80, icon_key]
  );
  res.json({ id: result.insertId, message: 'Skill created' });
});

router.put('/skills/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const f = req.body;
  const keys = Object.keys(f).map(k => `${k} = ?`).join(', ');
  await db.query(`UPDATE skills SET ${keys} WHERE id = ?`, [...Object.values(f), id]);
  res.json({ message: 'Skill updated' });
});

router.delete('/skills/:id', adminAuth, async (req, res) => {
  await db.query('DELETE FROM skills WHERE id = ?', [req.params.id]);
  res.json({ message: 'Skill deleted' });
});

// ============ HOSTED URLS ============
router.post('/hosted-urls', adminAuth, async (req, res) => {
  const { user_id, project_id, title, description, url, category, thumbnail_url } = req.body;
  const [result] = await db.query(
    'INSERT INTO hosted_urls (user_id,project_id,title,description,url,category,thumbnail_url) VALUES (?,?,?,?,?,?,?)',
    [user_id, project_id || null, title, description, url, category, thumbnail_url]
  );
  res.json({ id: result.insertId, message: 'URL created' });
});

router.delete('/hosted-urls/:id', adminAuth, async (req, res) => {
  await db.query('DELETE FROM hosted_urls WHERE id = ?', [req.params.id]);
  res.json({ message: 'URL deleted' });
});

module.exports = router;
