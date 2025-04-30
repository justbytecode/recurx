import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { payLinkId } = params;

  try {
    const payLink = await prisma.payLink.findUnique({
      where: { url: `pay/${payLinkId}` },
      include: { merchant: true },
    });
    if (!payLink || !payLink.active) {
      return NextResponse.json({ error: 'Pay link not found or inactive' }, { status: 404 });
    }
    return NextResponse.json(payLink);
  } catch (error) {
    console.error('Error fetching pay link:', error);
    return NextResponse.json({ error: 'Failed to fetch pay link' }, { status: 500 });
  }
}