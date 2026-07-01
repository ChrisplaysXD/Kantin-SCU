import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, username: true } },
      canteen: { select: { name: true } },
      items: { include: { menuItem: { select: { name: true, price: true } } } },
      seat: { select: { seatNumber: true, row: true, col: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(orders)
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderId, status } = await req.json()
  const validStatuses = ['PENDING', 'PREPARING', 'READY', 'DONE', 'CANCELLED']

  if (!orderId || !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  })

  // kalo DONE atau CANCELLED, free up seat
  if (['DONE', 'CANCELLED'].includes(status) && order.seatId) {
    await prisma.seat.update({
      where: { id: order.seatId },
      data: { isOccupied: false, occupiedUntil: null, occupiedByUserId: null },
    })
  }

  // kalo CANCELLED, refund
  if (status === 'CANCELLED') {
    const wallet = await prisma.wallet.findUnique({ where: { userId: order.userId } })
    if (wallet) {
      await prisma.$transaction([
        prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: order.totalAmount } },
        }),
        prisma.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'REFUND',
            amount: order.totalAmount,
            description: `Refund pesanan #${order.queueNumber}`,
            status: 'SUCCESS',
          },
        }),
      ])
    }
  }

  return NextResponse.json(order)
}
