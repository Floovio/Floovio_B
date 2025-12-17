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
    // Check if user has a profile in user_profiles table
    const userProfile = await prisma.user_profiles.findFirst({
      where: { user_id: req.user.id }
    });

    if (userProfile) {
      // User has a profile, return role
      return res.json({
        authenticated: true,
        hasProfile: true,
        role: userProfile.role === 'brand' ? 'brand' : 'creator'
      });
    }

    // No profile found - first login
    return res.json({
      authenticated: true,
      hasProfile: false
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/auth/onboarding - Create profile and brand/creator record (first-time only)
router.post('/onboarding', verifySupabaseToken, validate([
  body('role').isIn(['brand', 'creator']),
  body('name').notEmpty().trim(),
]), async (req, res) => {
  const prisma = getPrisma(req);
  const { role, name, industry, username, niche_tags } = req.body;

  try {
    // Check if user already has a profile (prevent duplicate onboarding)
    const existingProfile = await prisma.user_profiles.findFirst({
      where: { user_id: req.user.id }
    });

    if (existingProfile) {
      return res.status(400).json({ msg: 'User already has a profile. Onboarding can only be done once.' });
    }

    // Start transaction to create user_profiles and brand/creator
    const result = await prisma.$transaction(async (tx) => {
      // Create user_profiles record
      const userProfile = await tx.user_profiles.create({
        data: {
          user_id: req.user.id,
          email: req.user.email || '',
          role: role === 'brand' ? 'brand' : 'creator'
        }
      });

      // Create brand or creator record based on role
      if (role === 'brand') {
        const brand = await tx.brands.create({
          data: {
            user_id: req.user.id,
            name,
            industry: industry || null
          }
        });
        return { userProfile, profile: brand, role: 'brand' };
      } else {
        const creator = await tx.creators.create({
          data: {
            user_id: req.user.id,
            name,
            username: username || null,
            niche_tags: niche_tags || []
          }
        });
        return { userProfile, profile: creator, role: 'creator' };
      }
    });

    return res.json({
      authenticated: true,
      hasProfile: true,
      role: result.role,
      profile: result.profile
    });
  } catch (err) {
    console.error('Onboarding error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/auth/profile - Create/Update Profile (kept for backward compatibility)
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
