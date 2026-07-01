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

    const canteens = await prisma.canteen.findMany({
      include: {
        _count: {
          select: { sellers: true, seats: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(canteens)
  } catch (error) {
    console.log('Error fetching canteens:', error)
    return NextResponse.json({ error: 'Failed to fetch canteens' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET })
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, building, description, seatRows, seatCols } = body

    if (!name || !building) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const canteen = await prisma.canteen.create({
      data: {
        name,
        building,
        description,
        seatRows: seatRows || 4,
        seatCols: seatCols || 5
      }
    })

    // Auto-generate seats for the new canteen
    const seats = []
    const rows = seatRows || 4
    const cols = seatCols || 5
    let seatCounter = 1
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        seats.push({
          canteenId: canteen.id,
          seatNumber: seatCounter++,
          row,
          col
        })
      }
    }
    
    await prisma.seat.createMany({ data: seats })

    return NextResponse.json(canteen, { status: 201 })
  } catch (error) {
    console.log('Error creating canteen:', error)
    return NextResponse.json({ error: 'Failed to create canteen' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET })
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    await prisma.canteen.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.log('Error deleting canteen:', error)
    return NextResponse.json({ error: 'Failed to delete canteen' }, { status: 500 })
  }
}
