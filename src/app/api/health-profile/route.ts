import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateBMR, calculateTDEE, getTargetCalories } from '@/lib/recommendation'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await prisma.healthProfile.findUnique({
    where: { userId: (session.user as any).id },
  })

  return NextResponse.json(profile || {})
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const body = await req.json()

  let bmr: number | null = null
  let tdee: number | null = null

  if (body.weight && body.height && body.age && body.gender) {
    bmr = calculateBMR(body.weight, body.height, body.age, body.gender)
    tdee = calculateTDEE(bmr, body.activityLevel || 'MODERATE')
  }

  const profile = await prisma.healthProfile.upsert({
    where: { userId },
    update: {
      weight: body.weight || null,
      height: body.height || null,
      age: body.age || null,
      gender: body.gender || null,
      activityLevel: body.activityLevel || 'MODERATE',
      goal: body.goal || 'MAINTAIN',
      customCalorieTarget: body.customCalorieTarget || null,
      bmr,
      tdee,
    },
    create: {
      userId,
      weight: body.weight || null,
      height: body.height || null,
      age: body.age || null,
      gender: body.gender || null,
      activityLevel: body.activityLevel || 'MODERATE',
      goal: body.goal || 'MAINTAIN',
      customCalorieTarget: body.customCalorieTarget || null,
      bmr,
      tdee,
    },
  })

  const targetCalories = profile.customCalorieTarget || (tdee ? getTargetCalories(tdee, profile.goal) : 2000)

  return NextResponse.json({ ...profile, targetCalories })
}
