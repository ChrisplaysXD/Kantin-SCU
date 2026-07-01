import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// admin: list or create menu items
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const items = await prisma.menuItem.findMany({
    include: { seller: { include: { canteen: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { sellerId, name, price, category, calories, protein, carbs, fat, fiber, imageUrl } = body

    if (!sellerId || !name || !price || !category) {
      return NextResponse.json({ error: 'Data menu tidak lengkap' }, { status: 400 })
    }

    const item = await prisma.menuItem.create({
      data: {
        sellerId,
        name,
        price,
        category,
        calories: calories || null,
        protein: protein || null,
        carbs: carbs || null,
        fat: fat || null,
        fiber: fiber || null,
        imageUrl: imageUrl || null,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    console.log('create menu error:', err)
    return NextResponse.json({ error: 'Gagal menambah menu' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'ID menu diperlukan' }, { status: 400 })
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data,
    })

    return NextResponse.json(item)
  } catch (err) {
    console.log('update menu error:', err)
    return NextResponse.json({ error: 'Gagal mengupdate menu' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })
  }

  await prisma.menuItem.delete({ where: { id } })
  return NextResponse.json({ message: 'Menu dihapus' })
}
