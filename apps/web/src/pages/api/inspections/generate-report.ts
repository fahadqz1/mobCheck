import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT, getAuthToken } from '@/lib/auth';
import { generateReportData, generateQRCodeDataUrl } from '@/lib/report-generator';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !['SUPER_ADMIN', 'OPS_ADMIN'].includes(payload.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { bookingId } = await request.json();

    // Get booking with all details
    const booking = await prisma.inspectionBooking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        shop: true,
        brand: true,
        model: true,
        inspectionResults: true,
        inspectionEvidence: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'INSPECTION_SUBMITTED') {
      return NextResponse.json(
        { error: 'Inspection not ready for report generation' },
        { status: 400 }
      );
    }

    // Generate report identifiers
    const reportNumber = `MBC-${new Date().getFullYear()}-${String(crypto.randomBytes(2).readUInt16BE(0)).padStart(5, '0')}`;
    const qrCodeId = crypto.randomUUID();

    // Generate report data
    const reportData = await generateReportData(
      booking as any,
      booking.inspectionResults,
      booking.inspectionEvidence,
      reportNumber,
      qrCodeId
    );

    // Generate QR code
    const qrCodeUrl = generateQRCodeDataUrl(reportNumber);

    // Create report record
    const report = await prisma.inspectionReport.create({
      data: {
        bookingId,
        reportNumber,
        qrCodeId,
        overallAssessment: reportData.assessment.level,
        assessmentSummary: reportData.assessment.description,
        pdfStorageKey: `reports/${bookingId}/${reportNumber}.pdf`,
        pdfStorageUrl: `https://storage.example.com/reports/${bookingId}/${reportNumber}.pdf`,
        isVerified: true,
        version: 1,
      },
    });

    // Update booking status
    await prisma.inspectionBooking.update({
      where: { id: bookingId },
      data: {
        status: 'REPORT_DELIVERED',
        reportDeliveredAt: new Date(),
        reviewWindowExpiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
      },
    });

    // TODO: In production:
    // 1. Generate actual PDF using PDFKit or similar
    // 2. Upload to storage (S3, etc.)
    // 3. Send email to customer with report
    // 4. Create payout ledger entry

    return NextResponse.json(
      {
        message: 'Report generated successfully',
        data: {
          report: {
            id: report.id,
            reportNumber: report.reportNumber,
            qrCodeId: report.qrCodeId,
            assessment: reportData.assessment.level,
            verificationUrl: `https://mobcheck.local/verify/${reportNumber}`,
          },
          reportData, // For testing/preview
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
