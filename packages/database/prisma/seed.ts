import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed phone brands
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { slug: 'apple' },
      update: {},
      create: {
        name: 'Apple',
        slug: 'apple',
        countryOfOrigin: 'USA',
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'samsung' },
      update: {},
      create: {
        name: 'Samsung',
        slug: 'samsung',
        countryOfOrigin: 'South Korea',
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'google-pixel' },
      update: {},
      create: {
        name: 'Google Pixel',
        slug: 'google-pixel',
        countryOfOrigin: 'USA',
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'oneplus' },
      update: {},
      create: {
        name: 'OnePlus',
        slug: 'oneplus',
        countryOfOrigin: 'China',
      },
    }),
  ]);

  console.log(`Seeded ${brands.length} brands`);

  // Seed phone models
  const models = await Promise.all([
    prisma.model.upsert({
      where: {
        brandId_slug: {
          brandId: brands[0].id, // Apple
          slug: 'iphone-15-pro',
        },
      },
      update: {},
      create: {
        brandId: brands[0].id,
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        releaseYear: 2023,
        baseStorageGb: 128,
        baseRamGb: 8,
        storageOptions: ['128', '256', '512', '1000'],
        colors: ['Midnight', 'Starlight', 'Space Black', 'Gold', 'Silver'],
        category: 'FLAGSHIP',
        os: 'IOS',
      },
    }),
    prisma.model.upsert({
      where: {
        brandId_slug: {
          brandId: brands[1].id, // Samsung
          slug: 'galaxy-s24-ultra',
        },
      },
      update: {},
      create: {
        brandId: brands[1].id,
        name: 'Galaxy S24 Ultra',
        slug: 'galaxy-s24-ultra',
        releaseYear: 2024,
        baseStorageGb: 256,
        baseRamGb: 12,
        storageOptions: ['256', '512'],
        colors: ['Titanium Black', 'Titanium Gray', 'Titanium Gold'],
        category: 'FLAGSHIP',
        os: 'ANDROID',
      },
    }),
    prisma.model.upsert({
      where: {
        brandId_slug: {
          brandId: brands[2].id, // Google Pixel
          slug: 'pixel-8-pro',
        },
      },
      update: {},
      create: {
        brandId: brands[2].id,
        name: 'Pixel 8 Pro',
        slug: 'pixel-8-pro',
        releaseYear: 2023,
        baseStorageGb: 128,
        baseRamGb: 12,
        storageOptions: ['128', '256', '512'],
        colors: ['Obsidian', 'Porcelain', 'Sky'],
        category: 'FLAGSHIP',
        os: 'ANDROID',
      },
    }),
  ]);

  console.log(`Seeded ${models.length} models`);

  // Seed platform settings
  await Promise.all([
    prisma.platformSetting.upsert({
      where: { settingKey: 'inspection_fee_pkr' },
      update: { settingValue: '1000' },
      create: {
        settingKey: 'inspection_fee_pkr',
        settingValue: '1000',
        settingType: 'INTEGER',
        description: 'Default inspection fee in PKR',
      },
    }),
    prisma.platformSetting.upsert({
      where: { settingKey: 'shop_subscription_price_pkr' },
      update: { settingValue: '1200' },
      create: {
        settingKey: 'shop_subscription_price_pkr',
        settingValue: '1200',
        settingType: 'INTEGER',
        description: 'Monthly shop subscription price in PKR',
      },
    }),
    prisma.platformSetting.upsert({
      where: { settingKey: 'shop_trial_days' },
      update: { settingValue: '30' },
      create: {
        settingKey: 'shop_trial_days',
        settingValue: '30',
        settingType: 'INTEGER',
        description: 'Free trial period in days',
      },
    }),
    prisma.platformSetting.upsert({
      where: { settingKey: 'inspection_review_window_hours' },
      update: { settingValue: '3' },
      create: {
        settingKey: 'inspection_review_window_hours',
        settingValue: '3',
        settingType: 'INTEGER',
        description: '3-hour customer review window after report delivery',
      },
    }),
    prisma.platformSetting.upsert({
      where: { settingKey: 'mobcheck_commission_percentage' },
      update: { settingValue: '20' },
      create: {
        settingKey: 'mobcheck_commission_percentage',
        settingValue: '20',
        settingType: 'INTEGER',
        description: 'MobCheck commission percentage (shop gets remainder)',
      },
    }),
  ]);

  console.log('Seeded platform settings');

  // Seed inspection checklists for iPhone
  const iphoneChecklist = [
    {
      deviceType: 'IPHONE',
      category: 'Physical Condition',
      categorySequence: 1,
      checks: [
        { name: 'Front Glass', sequence: 1 },
        { name: 'Back Glass', sequence: 2 },
        { name: 'Frame', sequence: 3 },
        { name: 'SIM Tray', sequence: 4 },
        { name: 'Buttons & Switches', sequence: 5 },
        { name: 'Charging Port', sequence: 6 },
      ],
    },
    {
      deviceType: 'IPHONE',
      category: 'Display',
      categorySequence: 2,
      checks: [
        { name: 'Display Functionality', sequence: 1 },
        { name: 'Touch Responsiveness', sequence: 2 },
        { name: 'Dead Pixels', sequence: 3 },
        { name: 'Brightness', sequence: 4 },
        { name: 'OLED Burn-in', sequence: 5 },
      ],
    },
  ];

  for (const categoryData of iphoneChecklist) {
    for (const check of categoryData.checks) {
      await prisma.inspectionChecklist.upsert({
        where: {
          deviceType_category_checkSequence: {
            deviceType: categoryData.deviceType as any,
            category: categoryData.category,
            checkSequence: check.sequence,
          },
        },
        update: {},
        create: {
          deviceType: categoryData.deviceType as any,
          category: categoryData.category,
          categorySequence: categoryData.categorySequence,
          checkName: check.name,
          checkSequence: check.sequence,
          description: `Check ${check.name} for damage or defects`,
          testInstructions: `Inspect ${check.name.toLowerCase()} thoroughly`,
        },
      });
    }
  }

  console.log('Seeded inspection checklists');

  const passwordHash = await bcrypt.hash('Password123', 10);
  const demoUser = (email: string, firstName: string, lastName: string, role: any) =>
    prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash, firstName, lastName, role, status: 'ACTIVE', emailVerified: true },
    });

  const admin = await demoUser('admin@mobcheck.pk', 'Admin', 'MobCheck', 'SUPER_ADMIN');
  const owner = await demoUser('shop@mobcheck.pk', 'Ali', 'Raza', 'SHOP_OWNER');
  const seller = await demoUser('customer@mobcheck.pk', 'Sara', 'Khan', 'CUSTOMER');
  await prisma.shopOwnerProfile.upsert({ where: { userId: owner.id }, update: {}, create: { userId: owner.id } });
  await prisma.customerProfile.upsert({
    where: { userId: seller.id },
    update: {},
    create: { userId: seller.id, displayName: 'Sara Khan', city: 'Lahore' },
  });

  const shops = [
    { name: 'Hafeez Mobile Hub', slug: 'hafeez-mobile-hub', city: 'Lahore', area: 'Hafeez Centre', rating: 4.8, reviews: 126 },
    { name: 'Liberty Phone Clinic', slug: 'liberty-phone-clinic', city: 'Lahore', area: 'Liberty Market', rating: 4.6, reviews: 84 },
    { name: 'DHA Smart Devices', slug: 'dha-smart-devices', city: 'Lahore', area: 'DHA Phase 5', rating: 4.4, reviews: 47 },
    { name: 'Saddar Mobile Point', slug: 'saddar-mobile-point', city: 'Karachi', area: 'Saddar', rating: 4.5, reviews: 63 },
    { name: 'Blue Area Phone Lab', slug: 'blue-area-phone-lab', city: 'Islamabad', area: 'Blue Area', rating: 4.7, reviews: 91 },
  ];
  for (const s of shops) {
    await prisma.shop.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        ownerId: owner.id,
        name: s.name,
        slug: s.slug,
        city: s.city,
        area: s.area,
        addressLine1: `Shop 12, ${s.area}`,
        phone: '+92 300 1234567',
        email: `${s.slug}@example.com`,
        openingHour: '11:00',
        closingHour: '21:00',
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedById: admin.id,
        averageRating: s.rating,
        totalReviews: s.reviews,
      },
    });
  }
  console.log(`Seeded ${shops.length} shops`);

  if ((await prisma.phoneListing.count()) === 0) {
    const listings = [
      { m: 0, title: 'iPhone 15 Pro 256GB Natural', price: 365000, condition: 'LIKE_NEW', pta: 'APPROVED', city: 'Lahore', area: 'Gulberg', storage: 256 },
      { m: 0, title: 'iPhone 15 Pro 128GB Black', price: 310000, condition: 'EXCELLENT', pta: 'NON_PTA', city: 'Lahore', area: 'Johar Town', storage: 128 },
      { m: 1, title: 'Galaxy S24 Ultra 512GB', price: 395000, condition: 'BRAND_NEW', pta: 'APPROVED', city: 'Lahore', area: 'DHA', storage: 512 },
      { m: 1, title: 'Galaxy S24 Ultra 256GB Gray', price: 335000, condition: 'GOOD', pta: 'APPROVED', city: 'Karachi', area: 'Clifton', storage: 256 },
      { m: 2, title: 'Pixel 8 Pro 128GB Obsidian', price: 175000, condition: 'EXCELLENT', pta: 'NON_PTA', city: 'Lahore', area: 'Model Town', storage: 128 },
      { m: 2, title: 'Pixel 8 Pro 256GB Bay', price: 198000, condition: 'LIKE_NEW', pta: 'APPROVED', city: 'Islamabad', area: 'F-7', storage: 256 },
    ];
    for (const l of listings) {
      const model = models[l.m];
      await prisma.phoneListing.create({
        data: {
          userId: seller.id,
          brandId: model.brandId,
          modelId: model.id,
          storageGb: l.storage,
          condition: l.condition as any,
          pricePkr: l.price,
          ptaStatus: l.pta as any,
          hasBox: true,
          hasCharger: true,
          title: l.title,
          description: 'Well kept, no repairs. Inspection welcome.',
          locationCity: l.city,
          locationArea: l.area,
          sellerContactPreference: 'PLATFORM',
        },
      });
    }
    console.log(`Seeded ${listings.length} listings`);
  }

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
