
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const session = await auth();

  if (!session || session.user.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id, status: 'completed' },
    });
    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const activeCustomers = await prisma.customer.count({
      where: { merchantId: session.user.id },
    });
    const pendingInvoices = await prisma.invoice.count({
      where: { merchantId: session.user.id, status: 'pending' },
    });
    const activePayLinks = await prisma.payLink.count({
      where: { merchantId: session.user.id, active: true },
    });

    return NextResponse.json({
      totalRevenue,
      activeCustomers,
      pendingInvoices,
      activePayLinks,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
