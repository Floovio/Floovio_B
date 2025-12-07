const express = require('express');
const router = express.Router();
const { verifySupabaseToken } = require('../middleware/supabaseAuth');

const getPrisma = (req) => req.app.locals.prisma;

// POST /api/applications/:id/accept - Accept application (Brand only)
router.post('/:id/accept', verifySupabaseToken, async (req, res) => {
  const prisma = getPrisma(req);
  const applicationId = req.params.id;

  try {
    // Fetch application with campaign and brand info
    const application = await prisma.applications.findUnique({
      where: { id: applicationId },
      include: {
        campaigns: {
          include: { brands: true }
        }
      }
    });

    if (!application) return res.status(404).json({ msg: 'Application not found' });

    // Check ownership
    if (application.campaigns.brands.user_id !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to accept this application' });
    }

    // Check if campaign is active
    if (application.campaigns.status !== 'active') {
      return res.status(400).json({ msg: 'Campaign is not active' });
    }

    // Update application status
    const updatedApplication = await prisma.applications.update({
      where: { id: applicationId },
      data: { status: 'accepted' }
    });

    // TODO: Trigger notification to creator
    // TODO: Prepare for submission/payout

    res.json(updatedApplication);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
