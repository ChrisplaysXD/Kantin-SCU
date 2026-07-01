import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const canteens = await prisma.canteen.findMany({
    include: {
      sellers: { select: { id: true, name: true } },
      _count: { select: { seats: true } },
    },
  })

  // busyness per canteen
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const result = await Promise.all(
    canteens.map(async (c) => {
      const [ordersToday, ordersLastHour, occupiedSeats] = await Promise.all([
        prisma.order.count({ where: { canteenId: c.id, createdAt: { gte: today } } }),
        prisma.order.count({ where: { canteenId: c.id, createdAt: { gte: oneHourAgo } } }),
        prisma.seat.count({ where: { canteenId: c.id, isOccupied: true } }),
      ])

      let level: string, label: string, color: string
      if (ordersToday <= 10) {
        level = 'SEPI'; label = 'Sepi'; color = '#22C55E'
      } else if (ordersToday <= 25) {
        level = 'RAMAI'; label = 'Ramai'; color = '#F59E0B'
      } else {
        level = 'SANGAT_RAMAI'; label = 'Sangat Ramai'; color = '#EF4444'
      }

      return {
        ...c,
        busyness: { level, label, color, ordersToday, ordersLastHour },
        occupiedSeats,
        totalSeats: c._count.seats,
      }
    })
  )

  return NextResponse.json(result)
}
