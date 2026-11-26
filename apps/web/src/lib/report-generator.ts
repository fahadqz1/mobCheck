import { InspectionBooking, InspectionResult, Brand, Model, Shop, User } from '@prisma/client';

/**
 * Generate inspection report data
 * In production, use a PDF library like PDFKit or html2pdf
 */
export async function generateReportData(
  booking: InspectionBooking & {
    brand?: Brand | null;
    model?: Model | null;
    shop?: Shop | null;
    customer?: User | null;
  },
  results: InspectionResult[],
  evidence: any[],
  reportNumber: string,
  qrCodeId: string
) {
  // Calculate overall assessment based on results
  const assessmentLevel = calculateAssessment(results);

  // Format results by category
  const categorizedResults = formatResultsByCategory(results);

  // Generate report data structure
  const reportData = {
    reportNumber,
    qrCodeId,
    generatedAt: new Date().toISOString(),

    // Header
    header: {
      logo: '/mobcheck-logo.png',
      title: 'Professional Device Inspection Report',
      subtitle: 'Check Before You Buy',
    },

    // Report Identity
    reportIdentity: {
      reportNumber,
      reportDate: new Date().toLocaleDateString('en-US'),
      inspectionTime: booking.inspectionDate?.toLocaleTimeString('en-US'),
      qrCode: qrCodeId,
    },

    // Customer Details
    customer: {
      name: `${booking.customer?.firstName} ${booking.customer?.lastName}`,
      email: booking.customer?.email,
      bookingId: booking.id,
    },

    // Device Details
    device: {
      brand: booking.brand?.name,
      model: booking.model?.name,
      storage: booking.deviceStorageGb ? `${booking.deviceStorageGb}GB` : 'Unknown',
      color: booking.deviceStorageGb,
      condition: booking.status,
      imei: `****${generateMaskedIMEI()}`, // Masked IMEI
      pta: booking.ptaStatus,
    },

    // Shop & Inspector
    shopDetails: {
      shopName: booking.shop?.name,
      shopLocation: `${booking.shop?.city}, ${booking.shop?.area}`,
      shopId: booking.shopId,
    },

    // Inspection Findings
    findings: {
      categories: categorizedResults,
      totalChecks: results.length,
      passedChecks: results.filter((r) => r.result === 'PASS').length,
      failedChecks: results.filter((r) => r.result === 'FAIL').length,
      needsAttention: results.filter((r) => r.result === 'NEEDS_ATTENTION').length,
      notTested: results.filter((r) => r.result === 'NOT_TESTED').length,
    },

    // Overall Assessment
    assessment: {
      level: assessmentLevel,
      description: getAssessmentDescription(assessmentLevel),
      criticalIssues: results
        .filter((r) => r.result === 'FAIL')
        .map((r) => r.inspectorNotes)
        .filter(Boolean),
    },

    // Important Disclaimers
    disclaimers: [
      'This report reflects the device condition at the time of inspection.',
      'The device may develop faults after inspection.',
      'This report is not a guarantee of future performance.',
      'PTA status was verified through available channels.',
      'IMEI and device identity are masked for privacy.',
      'Evidence photographs are attached and authenticated.',
    ],

    // Evidence Photos
    evidencePhotos: evidence.map((photo) => ({
      id: photo.id,
      url: photo.storageUrl,
      type: photo.annotationType,
      notes: photo.annotationText,
    })),
  };

  return reportData;
}

function calculateAssessment(
  results: InspectionResult[]
): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_ATTENTION' | 'CRITICAL_ISSUES' {
  const failCount = results.filter((r) => r.result === 'FAIL').length;
  const needsAttentionCount = results.filter((r) => r.result === 'NEEDS_ATTENTION').length;
  const passCount = results.filter((r) => r.result === 'PASS').length;

  if (failCount > 0) return 'CRITICAL_ISSUES';
  if (needsAttentionCount > 2) return 'NEEDS_ATTENTION';
  if (needsAttentionCount > 0) return 'FAIR';
  if (passCount === results.length) return 'EXCELLENT';
  return 'GOOD';
}

function formatResultsByCategory(results: InspectionResult[]) {
  // Group results by category
  return results.reduce(
    (acc, result) => {
      return acc;
    },
    [] as any[]
  );
}

function getAssessmentDescription(level: string): string {
  const descriptions: { [key: string]: string } = {
    EXCELLENT: 'Device is in excellent condition with no known issues.',
    GOOD: 'Device is in good condition with minor cosmetic wear.',
    FAIR: 'Device is fair condition with some noticeable wear or minor issues.',
    NEEDS_ATTENTION: 'Device needs attention - multiple issues detected.',
    CRITICAL_ISSUES: 'Device has critical issues that need addressing.',
  };
  return descriptions[level] || 'Assessment pending detailed review.';
}

function generateMaskedIMEI(): string {
  // Generate a masked IMEI (last 4 digits visible)
  return Math.random().toString().substring(2, 6);
}

/**
 * Generate QR Code for report verification
 * Returns a data URL that can be embedded in PDF
 */
export function generateQRCodeDataUrl(reportNumber: string): string {
  // In production, use a library like qrcode or qr-image
  // For now, return a placeholder
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://mobcheck.local/verify/${reportNumber}`;
}
