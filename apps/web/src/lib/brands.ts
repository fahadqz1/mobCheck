import prisma from './prisma';

export const loadBrandOptions = () =>
  prisma.brand.findMany({
    select: { id: true, name: true, models: { select: { id: true, name: true }, orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  });
