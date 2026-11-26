import { PrismaClient } from '@prisma/client';

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
