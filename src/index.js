require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { PrismaClient } = require('../generated/prisma/client');

const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const applicationRoutes = require('./routes/applications');
const submissionRoutes = require('./routes/submissions');
const waitlistRoutes = require('./routes/waitlist');

const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

app.get('/', (req, res) => {
    res.json({ msg: 'Mini Billo API is running 🚀' });
});

app.locals.prisma = new PrismaClient();

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/waitlist', waitlistRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
