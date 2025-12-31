const express = require('express');
const router = express.Router();
const { verifySupabaseToken } = require('../middleware/supabaseAuth');

const getPrisma = (req) => req.app.locals.prisma;

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    // TODO: Implement proper admin check. 
    // For now, we'll check if the email matches a specific admin email or a flag in user_profiles
    // This is a placeholder. You should implement a proper role check.
    const prisma = getPrisma(req);
    try {
        const profile = await prisma.user_profiles.findFirst({
            where: { user_id: req.user.id }
        });

        // Check if role is admin (assuming 'admin' is added to enum or handled as string)
        // Since user_role enum might not have 'admin', we might need to check specific email
        // or if we updated the enum.
        // For this demo, let's assume if email contains 'admin' it's an admin
        if (req.user.email.includes('admin') || profile?.role === 'admin') {
            return next();
        }

        return res.status(403).json({ msg: 'Access denied. Admin only.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error checking admin status' });
    }
};

// GET /api/admin/stats
router.get('/stats', verifySupabaseToken, isAdmin, async (req, res) => {
    const prisma = getPrisma(req);
    try {
        const [users, campaigns, applications] = await Promise.all([
            prisma.user_profiles.count(),
            prisma.campaigns.count({ where: { status: 'active' } }),
            prisma.applications.count()
        ]);

        res.json({
            users,
            campaigns,
            applications
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/admin/users
router.get('/users', verifySupabaseToken, isAdmin, async (req, res) => {
    const prisma = getPrisma(req);
    try {
        const users = await prisma.user_profiles.findMany({
            orderBy: { created_at: 'desc' },
            take: 50,
            include: {
                users: {
                    select: {
                        email: true,
                        banned_until: true,
                        last_sign_in_at: true
                    }
                }
            }
        });

        // Flatten the structure for the frontend
        res.json(users.map(profile => ({
            ...profile,
            email: profile.users?.email || profile.email,
            banned_until: profile.users?.banned_until,
            last_sign_in_at: profile.users?.last_sign_in_at
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/admin/campaigns
router.get('/campaigns', verifySupabaseToken, isAdmin, async (req, res) => {
    const prisma = getPrisma(req);
    try {
        const campaigns = await prisma.campaigns.findMany({
            orderBy: { created_at: 'desc' },
            take: 50,
            include: { brands: true }
        });
        res.json(campaigns);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
