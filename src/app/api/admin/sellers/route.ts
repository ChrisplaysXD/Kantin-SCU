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

    const sellers = await prisma.seller.findMany({
      include: {
        canteen: { select: { name: true } },
        _count: { select: { menuItems: true } }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(sellers)
  } catch (error) {
    console.log('Error fetching sellers:', error)
    return NextResponse.json({ error: 'Failed to fetch sellers' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET })
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, canteenId, description } = body

    if (!name || !canteenId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const seller = await prisma.seller.create({
      data: { name, canteenId, description }
    })

    return NextResponse.json(seller, { status: 201 })
  } catch (error) {
    console.log('Error creating seller:', error)
    return NextResponse.json({ error: 'Failed to create seller' }, { status: 500 })
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

    await prisma.seller.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.log('Error deleting seller:', error)
    return NextResponse.json({ error: 'Failed to delete seller' }, { status: 500 })
  }
}
