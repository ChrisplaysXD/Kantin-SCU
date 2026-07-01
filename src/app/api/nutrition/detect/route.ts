import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { detectNutrition } from '@/lib/nutrition-api'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { foodName } = await req.json()
  if (!foodName) {
    return NextResponse.json({ error: 'Nama makanan wajib diisi' }, { status: 400 })
  }

  const result = await detectNutrition(foodName)
  return NextResponse.json(result)
}
