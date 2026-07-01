import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ canteenId: string }> }) {
  const { canteenId } = await params

  const seats = await prisma.seat.findMany({
    where: { canteenId },
    orderBy: [{ row: 'asc' }, { col: 'asc' }],
  })

  // auto-release expired seats
  const now = new Date()
  const expiredIds = seats
    .filter(s => s.isOccupied && s.occupiedUntil && s.occupiedUntil < now)
    .map(s => s.id)

  if (expiredIds.length > 0) {
    await prisma.seat.updateMany({
      where: { id: { in: expiredIds } },
      data: { isOccupied: false, occupiedUntil: null, occupiedByUserId: null },
    })
  }

  // re-fetch after cleanup
  const freshSeats = await prisma.seat.findMany({
    where: { canteenId },
    orderBy: [{ row: 'asc' }, { col: 'asc' }],
    select: { id: true, seatNumber: true, row: true, col: true, isOccupied: true },
  })

  return NextResponse.json({ seats: freshSeats })
}
