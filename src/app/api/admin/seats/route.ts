import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getToken } from 'next-auth/jwt'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET })
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all seats and group them by canteen
    const seats = await prisma.seat.findMany({
      include: {
        canteen: {
          select: { id: true, name: true, building: true }
        }
      },
      orderBy: [
        { canteenId: 'asc' },
        { row: 'asc' },
        { col: 'asc' }
      ]
    })

    return NextResponse.json(seats)
  } catch (error) {
    console.log('Error fetching admin seats:', error)
    return NextResponse.json({ error: 'Failed to fetch seats' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET })
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { seatId, action } = body

    if (!seatId || action !== 'FREE') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const updated = await prisma.seat.update({
      where: { id: seatId },
      data: {
        isOccupied: false,
        occupiedUntil: null,
        occupiedByUserId: null
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.log('Error updating seat:', error)
    return NextResponse.json({ error: 'Failed to update seat' }, { status: 500 })
  }
}
