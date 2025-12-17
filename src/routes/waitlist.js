const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

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

// POST /api/waitlist - Submit waitlist form
router.post('/', [
    body('email').isEmail().withMessage('Invalid email address'),
    body('name').notEmpty().withMessage('Name is required'),
    body('form_type').isIn(['creator', 'brand']).withMessage('Invalid form type'),
    validate([])
], async (req, res) => {
    const prisma = getPrisma(req);
    const { email, name, form_type, extra } = req.body;

    try {
        const submission = await prisma.form_submissions.create({
            data: {
                email,
                name,
                form_type,
                extra: extra || {},
                status: 'pending'
            }
        });

        res.status(201).json(submission);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
