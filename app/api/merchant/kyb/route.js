import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const session = await auth();

  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const kyb = await prisma.kyb.findUnique({
      where: { merchantId: session.user.id },
    });
    return NextResponse.json(kyb || { status: 'not_submitted', documents: [] });
  } catch (error) {
    console.error('Error fetching KYB status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KYB status' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await auth();

  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const document = formData.get('document');
    if (!document) {
      return NextResponse.json(
        { error: 'Document is required' },
        { status: 400 }
      );
    }

    // Simulate document storage (in production, use a file storage service like S3)
    const documentName = `${Date.now()}-${document.name}`;

    const kyb = await prisma.kyb.upsert({
      where: { merchantId: session.user.id },
      update: {
        documents: {
          push: documentName,
        },
        status: 'pending',
        submittedAt: new Date(),
      },
      create: {
        merchantId: session.user.id,
        status: 'pending',
        submittedAt: new Date(),
        documents: [documentName],
      },
    });

    return NextResponse.json({ document: documentName, status: kyb.status });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}