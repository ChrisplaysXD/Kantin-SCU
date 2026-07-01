import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const orderId = params.id

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'PENDING' && order.status !== 'PREPARING') {
      return NextResponse.json({ error: 'Hanya pesanan yang belum selesai yang bisa dibatalkan' }, { status: 400 })
    }

    // Gunakan transaction agar refund dan pembatalan aman
    await prisma.$transaction(async (tx) => {
      // 1. Ubah status pesanan
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' }
      })

      // 2. Jika memesan kursi, kosongkan kursi
      if (order.seatId) {
        await tx.seat.update({
          where: { id: order.seatId },
          data: { isOccupied: false, occupiedByUserId: null, occupiedUntil: null }
        })
      }

      // 3. Refund saldo ke wallet
      const wallet = await tx.wallet.findUnique({ where: { userId } })
      if (wallet) {
        await tx.wallet.update({
          where: { userId },
          data: { balance: { increment: order.totalAmount } }
        })

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'REFUND',
            amount: order.totalAmount,
            description: `Refund pembatalan pesanan #${order.queueNumber}`,
            status: 'SUCCESS'
          }
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("error cancelling order:", error)
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
  }
}
