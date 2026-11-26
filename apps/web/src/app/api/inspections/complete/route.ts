import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT, getAuthToken } from '@/lib/auth';

interface ChecklistResult {
  checklistId: string;
  result: 'PASS' | 'FAIL' | 'NEEDS_ATTENTION' | 'NOT_TESTED' | 'NOT_VERIFIABLE' | 'NOT_APPLICABLE';
  inspectorNotes?: string;
  evidencePhotoId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'INSPECTOR') {
      return NextResponse.json(
        { error: 'Only inspectors can complete inspections' },
        { status: 403 }
      );
    }

    const { bookingId, results } = await request.json();

    // Verify booking exists and inspector is assigned
    const booking = await prisma.inspectionBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.inspectorId !== payload.userId) {
      return NextResponse.json(
        { error: 'Booking not found or not assigned to you' },
        { status: 404 }
      );
    }

    if (booking.status !== 'INSPECTION_IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Inspection not in progress' },
        { status: 400 }
      );
    }

    // Save inspection results
    const checklistResults = [];
    for (const result of results as ChecklistResult[]) {
      const inspectionResult = await prisma.inspectionResult.create({
        data: {
          bookingId,
          checklistId: result.checklistId,
          result: result.result,
          inspectorNotes: result.inspectorNotes,
          evidenceId: result.evidencePhotoId,
          testedAt: new Date(),
        },
      });
      checklistResults.push(inspectionResult);
    }

    // Update booking status
    const updatedBooking = await prisma.inspectionBooking.update({
      where: { id: bookingId },
      data: {
        status: 'INSPECTION_SUBMITTED',
      },
    });

    return NextResponse.json(
      {
        message: 'Inspection submitted successfully',
        data: {
          booking: updatedBooking,
          resultsCount: checklistResults.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Complete inspection error:', error);
    return NextResponse.json(
      { error: 'Failed to complete inspection' },
      { status: 500 }
    );
  }
}
