const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET full portfolio by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const [users] = await db.query('SELECT * FROM users WHERE slug = ?', [slug]);
    if (!users.length) return res.status(404).json({ error: 'User not found' });
    const user = users[0];
    const uid = user.id;

    const [skills] = await db.query('SELECT * FROM skills WHERE user_id = ? ORDER BY category, proficiency DESC', [uid]);
    const [experience] = await db.query('SELECT * FROM experience WHERE user_id = ? ORDER BY start_date DESC', [uid]);
    const [projects] = await db.query('SELECT * FROM projects WHERE user_id = ? ORDER BY display_order ASC', [uid]);
    const [hostedUrls] = await db.query('SELECT * FROM hosted_urls WHERE user_id = ? AND is_active = TRUE', [uid]);
    const [education] = await db.query('SELECT * FROM education WHERE user_id = ? ORDER BY end_year DESC', [uid]);
    const [certifications] = await db.query('SELECT * FROM certifications WHERE user_id = ? ORDER BY issue_date DESC', [uid]);

    // Group skills by category
    const skillsByCategory = skills.reduce((acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    }, {});

    // Parse JSON fields
    const parsedProjects = projects.map(p => ({
      ...p,
      tech_stack: typeof p.tech_stack === 'string' ? JSON.parse(p.tech_stack) : p.tech_stack
    }));
    const parsedExperience = experience.map(e => ({
      ...e,
      technologies: typeof e.technologies === 'string' ? JSON.parse(e.technologies) : e.technologies
    }));

    res.json({
      user,
      skills: skillsByCategory,
      experience: parsedExperience,
      projects: parsedProjects,
      hostedUrls,
      education,
      certifications
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
