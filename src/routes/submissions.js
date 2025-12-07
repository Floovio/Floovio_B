const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { verifySupabaseToken } = require('../middleware/supabaseAuth');
const { generateUploadSignature } = require('../services/mediaService');

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

// GET /api/submissions/presign - Get upload signature
router.get('/presign', verifySupabaseToken, (req, res) => {
    const signature = generateUploadSignature();
    res.json(signature);
});

// POST /api/submissions - Create submission (Creator only)
router.post('/', verifySupabaseToken, [
    body('application_id').isUUID(),
    body('file_url').isURL(),
    body('description').optional().trim(),
    validate([])
], async (req, res) => {
    const prisma = getPrisma(req);
    const { application_id, file_url, description } = req.body;

    try {
        // Check if user is creator
        const creator = await prisma.creators.findFirst({
            where: { user_id: req.user.id }
        });

        if (!creator) return res.status(403).json({ msg: 'Only creators can submit' });

        // Check application ownership and status
        const application = await prisma.applications.findUnique({
            where: { id: application_id }
        });

        if (!application) return res.status(404).json({ msg: 'Application not found' });
        if (application.creator_id !== creator.id) return res.status(403).json({ msg: 'Not your application' });
        if (application.status !== 'accepted') return res.status(400).json({ msg: 'Application must be accepted first' });

        const submission = await prisma.submissions.create({
            data: {
                application_id,
                file_url,
                description: description || '',
                status: 'submitted'
            }
        });

        res.status(201).json(submission);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/submissions - List submissions (Context aware)
router.get('/', verifySupabaseToken, async (req, res) => {
    const prisma = getPrisma(req);
    try {
        // If Brand, list submissions for their campaigns
        const brand = await prisma.brands.findFirst({ where: { user_id: req.user.id } });
        if (brand) {
            const submissions = await prisma.submissions.findMany({
                where: {
                    applications: {
                        campaigns: {
                            brand_id: brand.id
                        }
                    }
                },
                include: {
                    applications: {
                        include: {
                            campaigns: { select: { title: true } },
                            creators: { select: { name: true } }
                        }
                    }
                }
            });
            return res.json(submissions);
        }

        // If Creator, list their submissions
        const creator = await prisma.creators.findFirst({ where: { user_id: req.user.id } });
        if (creator) {
            const submissions = await prisma.submissions.findMany({
                where: {
                    applications: {
                        creator_id: creator.id
                    }
                },
                include: {
                    applications: {
                        include: {
                            campaigns: { select: { title: true } }
                        }
                    }
                }
            });
            return res.json(submissions);
        }

        res.json([]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
