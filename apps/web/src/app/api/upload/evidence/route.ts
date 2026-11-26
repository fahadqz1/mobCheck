import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT, getAuthToken } from '@/lib/auth';

/**
 * Upload inspection evidence photos
 * In production, integrate with AWS S3, Google Cloud Storage, or Cloudinary
 */

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'INSPECTOR') {
      return NextResponse.json(
        { error: 'Only inspectors can upload evidence' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const bookingId = formData.get('bookingId') as string;
    const photoSequence = parseInt(formData.get('photoSequence') as string);
    const file = formData.get('file') as File;
    const annotationType = formData.get('annotationType') as string;

    if (!bookingId || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP allowed' },
        { status: 400 }
      );
    }

    // In production: Upload to S3/Cloud storage and get URL
    // For now, generate mock storage key
    const storageKey = `evidence/${bookingId}/photo-${photoSequence}-${Date.now()}.jpg`;
    const storageUrl = `https://storage.example.com/${storageKey}`;

    // Save evidence record
    const evidence = await prisma.inspectionEvidence.create({
      data: {
        bookingId,
        storageKey,
        storageUrl,
        mimeType: file.type,
        fileSizeBytes: file.size,
        photoSequence,
        annotationType: annotationType || undefined,
        takenAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: 'Photo uploaded successfully',
        data: {
          id: evidence.id,
          storageKey: evidence.storageKey,
          storageUrl: evidence.storageUrl,
          sequence: evidence.photoSequence,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload evidence error:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
