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
    return NextResponse.json({ error: 'Failed to fetch KYB status' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await auth();
  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return NextResponse.json({ error: 'KYB feature is upcoming' }, { status: 400 });
  } catch (error) {
    console.error('Error processing KYB:', error);
    return NextResponse.json({ error: 'Failed to process KYB' }, { status: 500 });
  }
}