import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export async function GET(request) {
  const session = await auth();
  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await auth();
  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.user.walletAddress) {
    return NextResponse.json({ error: 'Wallet not connected' }, { status: 400 });
  }

  const { name } = await request.json();
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    const clientId = `client_${nanoid(16)}`;
    const clientSecret = `secret_${nanoid(32)}`;
    const apiKey = await prisma.apiKey.create({
      data: {
        userId: session.user.id,
        name,
        key: clientSecret,
        clientId,
        walletAddress: session.user.walletAddress,
      },
    });
    return NextResponse.json({ ...apiKey, clientSecret });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  try {
    await prisma.apiKey.update({
      where: { id, userId: session.user.id },
      data: { revoked: true },
    });
    return NextResponse.json({ message: 'API key revoked' });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
  }
}