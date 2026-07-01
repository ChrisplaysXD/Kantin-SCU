import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const canteen = await prisma.canteen.findUnique({
    where: { id },
    include: {
      sellers: {
        include: {
          menuItems: {
            orderBy: { name: 'asc' },
          },
        },
      },
      seats: { orderBy: [{ row: 'asc' }, { col: 'asc' }] },
    },
  })

  if (!canteen) {
    return NextResponse.json({ error: 'Kantin tidak ditemukan' }, { status: 404 })
  }

  // busyness
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const [ordersToday, ordersLastHour] = await Promise.all([
    prisma.order.count({ where: { canteenId: id, createdAt: { gte: today } } }),
    prisma.order.count({ where: { canteenId: id, createdAt: { gte: oneHourAgo } } }),
  ])

  let level: string, label: string, color: string
  if (ordersToday <= 10) {
    level = 'SEPI'; label = 'Sepi'; color = '#22C55E'
  } else if (ordersToday <= 25) {
    level = 'RAMAI'; label = 'Ramai'; color = '#F59E0B'
  } else {
    level = 'SANGAT_RAMAI'; label = 'Sangat Ramai'; color = '#EF4444'
  }

  return NextResponse.json({
    ...canteen,
    busyness: { level, label, color, ordersToday, ordersLastHour },
  })
}
