const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { verifySupabaseToken } = require('../middleware/supabaseAuth');

const getPrisma = (req) => req.app.locals.prisma;

// Validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  };
};

// GET /api/auth/me - Get current user profile
router.get('/me', verifySupabaseToken, async (req, res) => {
  const prisma = getPrisma(req);
  try {
    // Check if user is a brand
    const brand = await prisma.brands.findFirst({
      where: { user_id: req.user.id }
    });

    if (brand) {
      return res.json({ user: req.user, profile: brand, role: 'BRAND' });
    }

    // Check if user is a creator
    const creator = await prisma.creators.findFirst({
      where: { user_id: req.user.id }
    });

    if (creator) {
      return res.json({ user: req.user, profile: creator, role: 'CREATOR' });
    }

    // No profile found
    res.json({ user: req.user, profile: null, role: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/auth/profile - Create/Update Profile
router.post('/profile', verifySupabaseToken, [
  body('role').isIn(['BRAND', 'CREATOR']),
  body('name').notEmpty().trim(),
  validate([])
], async (req, res) => {
  const prisma = getPrisma(req);
  const { role, name, bio, website, logo_url, profile_pic_url, industry, niche_tags } = req.body;

  try {
    if (role === 'BRAND') {
      // Check if brand exists
      const existing = await prisma.brands.findFirst({ where: { user_id: req.user.id } });
      if (existing) {
        // Update
        const updated = await prisma.brands.update({
          where: { id: existing.id },
          data: { name, bio, industry, logo_url }
        });
        return res.json({ profile: updated, role: 'BRAND' });
      } else {
        // Create
        const created = await prisma.brands.create({
          data: {
            user_id: req.user.id,
            name,
            bio,
            industry,
            logo_url
          }
        });
        return res.json({ profile: created, role: 'BRAND' });
      }
    } else if (role === 'CREATOR') {
      // Check if creator exists
      const existing = await prisma.creators.findFirst({ where: { user_id: req.user.id } });
      if (existing) {
        // Update
        const updated = await prisma.creators.update({
          where: { id: existing.id },
          data: { name, bio, profile_pic_url, niche_tags: niche_tags || [] }
        });
        return res.json({ profile: updated, role: 'CREATOR' });
      } else {
        // Create
        const created = await prisma.creators.create({
          data: {
            user_id: req.user.id,
            name,
            bio,
            profile_pic_url,
            niche_tags: niche_tags || []
          }
        });
        return res.json({ profile: created, role: 'CREATOR' });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
