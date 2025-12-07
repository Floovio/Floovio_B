// test-prisma.js
require('dotenv').config();
const { PrismaClient } = require('./generated/prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const campaigns = await prisma.campaigns.findMany({
      take: 10,
      orderBy: { created_at: 'desc' } // use your actual column names from schema if different
    });
    console.log('campaigns:', campaigns);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
})();
