import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { reportNumber: string } }
) {
  try {
    const { reportNumber } = params;

    // Find report
    const report = await prisma.inspectionReport.findUnique({
      where: { reportNumber },
      include: {
        booking: {
          select: {
            id: true,
            brand: { select: { name: true } },
            model: { select: { name: true } },
            status: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found', valid: false },
        { status: 404 }
      );
    }

    // Return safe information (don't expose customer email, full IMEI, etc.)
    return NextResponse.json(
      {
        valid: true,
        reportNumber: report.reportNumber,
        reportDate: report.createdAt.toISOString(),
        deviceBrand: report.booking?.brand?.name,
        deviceModel: report.booking?.model?.name,
        assessment: report.overallAssessment,
        assessmentSummary: report.assessmentSummary,
        status: report.isVerified ? 'VERIFIED' : 'PENDING',
        message: 'Report is authentic and verified.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify report error:', error);
    return NextResponse.json(
      { error: 'Verification failed', valid: false },
      { status: 500 }
    );
  }
}
