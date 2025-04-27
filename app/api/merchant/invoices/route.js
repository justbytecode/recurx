import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const session = await auth();

  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const invoices = await prisma.invoice.findMany({
      where: { merchantId: session.user.id },
      include: { customer: true },
    });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await auth();

  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { customerId, amount, currency, invoiceNo, status } = await request.json();

  if (!customerId || !amount || isNaN(amount) || amount <= 0 || !invoiceNo) {
    return NextResponse.json(
      { error: 'Customer, valid amount, and invoice number are required' },
      { status: 400 }
    );
  }

  try {
    const invoice = await prisma.invoice.create({
      data: {
        merchantId: session.user.id,
        customerId,
        amount: parseFloat(amount),
        currency,
        invoiceNo,
        status,
      },
    });
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}