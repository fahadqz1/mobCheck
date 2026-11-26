import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get iPhone checklists organized by category
    const checklists = await prisma.inspectionChecklist.findMany({
      where: { deviceType: 'IPHONE' },
      orderBy: [{ categorySequence: 'asc' }, { checkSequence: 'asc' }],
    });

    // Group by category
    const grouped = checklists.reduce(
      (acc, item) => {
        const existing = acc.find((c) => c.category === item.category);
        if (existing) {
          existing.checks.push(item);
        } else {
          acc.push({
            category: item.category,
            categorySequence: item.categorySequence,
            checks: [item],
          });
        }
        return acc;
      },
      [] as any[]
    );

    return NextResponse.json(
      {
        message: 'iPhone inspection checklist retrieved',
        data: grouped,
        totalChecks: checklists.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get iPhone checklist error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve checklist' },
      { status: 500 }
    );
  }
}
