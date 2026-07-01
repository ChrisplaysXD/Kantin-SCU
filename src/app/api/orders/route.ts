import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = (session.user as any).id
    const { canteenId, items, seatId, isTakeaway } = await req.json()

    if (!canteenId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Data pesanan tidak lengkap' }, { status: 400 })
    }

    // fetch menu items buat validasi harga
    const menuItemIds = items.map((i: any) => i.menuItemId)
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, isAvailable: true },
    })

    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json({ error: 'Beberapa menu tidak tersedia' }, { status: 400 })
    }

    // hitung total
    let totalAmount = 0
    const orderItems = items.map((i: any) => {
      const menuItem = menuItems.find(m => m.id === i.menuItemId)!
      const subtotal = Number(menuItem.price) * i.quantity
      totalAmount += subtotal
      return {
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        subtotal,
      }
    })

    // cek saldo
    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet || Number(wallet.balance) < totalAmount) {
      return NextResponse.json({ error: 'Saldo tidak cukup' }, { status: 400 })
    }

    // generate queue number (reset per hari per kantin)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastOrder = await prisma.order.findFirst({
      where: { canteenId, createdAt: { gte: today } },
      orderBy: { queueNumber: 'desc' },
    })
    const queueNumber = (lastOrder?.queueNumber || 0) + 1

    // transaction: create order, deduct wallet, reserve seat
    const order = await prisma.$transaction(async (tx) => {
      // create order
      const newOrder = await tx.order.create({
        data: {
          userId,
          canteenId,
          seatId: isTakeaway ? null : seatId,
          totalAmount,
          queueNumber,
          isTakeaway: !!isTakeaway,
          items: { create: orderItems },
        },
        include: { items: { include: { menuItem: true } } },
      })

      // deduct wallet
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: totalAmount } },
      })

      // log payment transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'PAYMENT',
          amount: totalAmount,
          description: `Pesanan #${queueNumber} di kantin`,
          status: 'SUCCESS',
        },
      })

      // reserve seat kalo ga takeaway
      if (!isTakeaway && seatId) {
        await tx.seat.update({
          where: { id: seatId },
          data: {
            isOccupied: true,
            occupiedByUserId: userId,
            occupiedUntil: new Date(Date.now() + 60 * 60 * 1000), // 1 jam
          },
        })
      }

      return newOrder
    })

    return NextResponse.json({
      message: 'Pesanan berhasil',
      order: {
        id: order.id,
        queueNumber: order.queueNumber,
        totalAmount: order.totalAmount,
        status: order.status,
      },
    }, { status: 201 })
  } catch (err) {
    console.log('order error:', err)
    return NextResponse.json({ error: 'Gagal membuat pesanan' }, { status: 500 })
  }
}


export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit')) || 20

  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      canteen: { select: { name: true, building: true } },
      items: { include: { menuItem: { select: { name: true, price: true, calories: true } } } },
      seat: { select: { seatNumber: true, row: true, col: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json(orders)
}
