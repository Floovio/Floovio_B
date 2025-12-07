require('dotenv').config();
const { PrismaClient } = require('../generated/prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Clean up existing data (optional, be careful in prod)
    // await prisma.applications.deleteMany();
    // await prisma.campaigns.deleteMany();
    // await prisma.brands.deleteMany();
    // await prisma.creators.deleteMany();

    // Create dummy auth users
    const user1 = await prisma.users.create({
        data: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'brand1@example.com',
            created_at: new Date(),
            updated_at: new Date()
        }
    });

    const user2 = await prisma.users.create({
        data: {
            id: '00000000-0000-0000-0000-000000000002',
            email: 'brand2@example.com',
            created_at: new Date(),
            updated_at: new Date()
        }
    });

    const user3 = await prisma.users.create({
        data: {
            id: '00000000-0000-0000-0000-000000000003',
            email: 'creator1@example.com',
            created_at: new Date(),
            updated_at: new Date()
        }
    });

    const user4 = await prisma.users.create({
        data: {
            id: '00000000-0000-0000-0000-000000000004',
            email: 'creator2@example.com',
            created_at: new Date(),
            updated_at: new Date()
        }
    });

    console.log('Created dummy users');

    // Create Brands
    const brand1 = await prisma.brands.create({
        data: {
            user_id: user1.id,
            name: 'Acme Corp',
            industry: 'Technology',
            bio: 'We make everything.',
            logo_url: 'https://placehold.co/200x200?text=Acme'
        }
    });

    const brand2 = await prisma.brands.create({
        data: {
            user_id: user2.id,
            name: 'Globex',
            industry: 'Retail',
            bio: 'We sell everything.',
            logo_url: 'https://placehold.co/200x200?text=Globex'
        }
    });

    console.log('Created brands:', brand1.name, brand2.name);

    // Create Creators
    const creator1 = await prisma.creators.create({
        data: {
            user_id: user3.id,
            name: 'Alice Creator',
            username: 'alice_creates',
            bio: 'I create awesome videos.',
            profile_pic_url: 'https://placehold.co/200x200?text=Alice',
            niche_tags: ['tech', 'lifestyle']
        }
    });

    const creator2 = await prisma.creators.create({
        data: {
            user_id: user4.id,
            name: 'Bob Influencer',
            username: 'bob_influencer',
            bio: 'Lifestyle and travel content.',
            profile_pic_url: 'https://placehold.co/200x200?text=Bob',
            niche_tags: ['travel', 'food']
        }
    });

    console.log('Created creators:', creator1.name, creator2.name);

    // Create Campaigns
    const campaign1 = await prisma.campaigns.create({
        data: {
            brand_id: brand1.id,
            title: 'Summer Tech Review',
            description: 'Review our new gadget for the summer.',
            budget: 500.00,
            deadline: new Date('2025-08-01'),
            content_type: 'video',
            status: 'active',
            num_creators: 5,
            niche_tags: ['tech', 'gadgets']
        }
    });

    const campaign2 = await prisma.campaigns.create({
        data: {
            brand_id: brand2.id,
            title: 'Holiday Sale Promo',
            description: 'Promote our holiday sale event.',
            budget: 1000.00,
            deadline: new Date('2025-12-20'),
            content_type: 'both',
            status: 'draft',
            num_creators: 10,
            niche_tags: ['shopping', 'holiday']
        }
    });

    console.log('Created campaigns:', campaign1.title, campaign2.title);

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
