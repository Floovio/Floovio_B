const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
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

// GET /api/campaigns/my - List brand's own campaigns
router.get('/my', verifySupabaseToken, async (req, res) => {
  const prisma = getPrisma(req);
  try {
    const brand = await prisma.brands.findFirst({
      where: { user_id: req.user.id }
    });

    if (!brand) return res.status(404).json({ msg: 'Brand profile not found' });

    const campaigns = await prisma.campaigns.findMany({
      where: { brand_id: brand.id },
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });

    res.json(campaigns);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/campaigns - List campaigns (Public)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['draft', 'active', 'completed', 'cancelled']),
  query('content_type').optional().isIn(['video', 'image', 'both']),
  validate([])
], async (req, res) => {
  const prisma = getPrisma(req);
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const skip = (page - 1) * limit;
  const { status, content_type } = req.query;

  const where = {};
  if (status) where.status = status;
  if (content_type) where.content_type = content_type;

  try {
    const campaigns = await prisma.campaigns.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        brands: {
          select: {
            id: true,
            name: true,
            logo_url: true,
            industry: true
          }
        },
        _count: {
          select: { applications: true }
        }
      }
    });

    const total = await prisma.campaigns.count({ where });

    res.json({
      data: campaigns,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/campaigns/:id - Get campaign details (Public)
router.get('/:id', async (req, res) => {
  const prisma = getPrisma(req);
  try {
    const campaign = await prisma.campaigns.findUnique({
      where: { id: req.params.id },
      include: {
        brands: {
          select: {
            id: true,
            name: true,
            logo_url: true,
            industry: true,
            bio: true
          }
        },
        _count: {
          select: { applications: true }
        }
      }
    });

    if (!campaign) return res.status(404).json({ msg: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/campaigns - Create campaign (Brand only)
router.post('/', verifySupabaseToken, [
  body('title').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('budget').isFloat({ min: 0 }),
  body('deadline').isISO8601().toDate(),
  body('content_type').isIn(['video', 'image', 'both']),
  body('num_creators').optional().isInt({ min: 1 }),
  body('niche_tags').optional().isArray(),
  validate([]) // Trigger validation
], async (req, res) => {
  const prisma = getPrisma(req);
  try {
    // Check if user is a brand
    const brand = await prisma.brands.findFirst({
      where: { user_id: req.user.id }
    });

    if (!brand) {
      return res.status(403).json({ msg: 'Only brands can create campaigns' });
    }

    const { title, description, budget, deadline, content_type, num_creators, niche_tags } = req.body;

    const campaign = await prisma.campaigns.create({
      data: {
        title,
        description,
        budget,
        deadline,
        content_type,
        num_creators: num_creators || 1,
        niche_tags: niche_tags || [],
        status: 'active', // Default to active for now, or draft
        brand_id: brand.id
      }
    });

    res.status(201).json(campaign);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PATCH /api/campaigns/:id - Update campaign (Brand only)
router.patch('/:id', verifySupabaseToken, [
  body('title').optional().notEmpty().trim(),
  body('description').optional().notEmpty().trim(),
  body('budget').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['draft', 'active', 'completed', 'cancelled']),
  validate([])
], async (req, res) => {
  const prisma = getPrisma(req);
  const { id } = req.params;

  try {
    const campaign = await prisma.campaigns.findUnique({
      where: { id },
      include: { brands: true }
    });

    if (!campaign) return res.status(404).json({ msg: 'Campaign not found' });

    // Check ownership
    if (campaign.brands.user_id !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this campaign' });
    }

    const updatedCampaign = await prisma.campaigns.update({
      where: { id },
      data: req.body
    });

    res.json(updatedCampaign);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/campaigns/:id/apply - Apply to campaign (Creator only)
router.post('/:id/apply', verifySupabaseToken, [
  body('pitch').optional().trim(),
  validate([])
], async (req, res) => {
  const prisma = getPrisma(req);
  const campaignId = req.params.id;

  try {
    // Check if user is a creator
    const creator = await prisma.creators.findFirst({
      where: { user_id: req.user.id }
    });

    if (!creator) {
      return res.status(403).json({ msg: 'Only creators can apply to campaigns' });
    }

    // Check if campaign exists and is active
    const campaign = await prisma.campaigns.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) return res.status(404).json({ msg: 'Campaign not found' });
    if (campaign.status !== 'active') return res.status(400).json({ msg: 'Campaign is not active' });

    // Check if already applied
    const existingApp = await prisma.applications.findUnique({
      where: {
        campaign_id_creator_id: {
          campaign_id: campaignId,
          creator_id: creator.id
        }
      }
    });

    if (existingApp) {
      return res.status(400).json({ msg: 'Already applied to this campaign' });
    }

    const application = await prisma.applications.create({
      data: {
        campaign_id: campaignId,
        creator_id: creator.id,
        pitch: req.body.pitch || '',
        status: 'applied'
      }
    });

    res.status(201).json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/campaigns/:id/applications - List applications (Brand only)
router.get('/:id/applications', verifySupabaseToken, async (req, res) => {
  const prisma = getPrisma(req);
  const campaignId = req.params.id;

  try {
    const campaign = await prisma.campaigns.findUnique({
      where: { id: campaignId },
      include: { brands: true }
    });

    if (!campaign) return res.status(404).json({ msg: 'Campaign not found' });

    // Check ownership
    if (campaign.brands.user_id !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to view applications for this campaign' });
    }

    const applications = await prisma.applications.findMany({
      where: { campaign_id: campaignId },
      include: {
        creators: {
          select: {
            id: true,
            name: true,
            username: true,
            profile_pic_url: true,
            rating: true,
            portfolio_url: true
          }
        }
      }
    });

    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
