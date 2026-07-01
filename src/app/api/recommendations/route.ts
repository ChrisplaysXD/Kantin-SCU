import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRecommendations, calculateBMR, calculateTDEE, getTargetCalories } from '@/lib/recommendation'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id

  // fetch health profile
  const profile = await prisma.healthProfile.findUnique({ where: { userId } })

  // calculate target calories
  let targetCalories = 2000 // default
  if (profile?.customCalorieTarget) {
    targetCalories = profile.customCalorieTarget
  } else if (profile?.weight && profile?.height && profile?.age && profile?.gender) {
    const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender)
    const tdee = calculateTDEE(bmr, profile.activityLevel)
    targetCalories = getTargetCalories(tdee, profile.goal)
  }

  // fetch today's orders buat hitung current intake
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayOrders = await prisma.order.findMany({
    where: {
      userId,
      createdAt: { gte: today },
      status: { not: 'CANCELLED' },
    },
    include: {
      items: {
        include: {
          menuItem: { select: { calories: true, protein: true, carbs: true, fat: true, fiber: true } },
        },
      },
    },
  })

  // sum nutrition hari ini
  const todayIntake = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  for (const order of todayOrders) {
    for (const item of order.items) {
      const m = item.menuItem
      todayIntake.calories += (m.calories ?? 0) * item.quantity
      todayIntake.protein += (m.protein ?? 0) * item.quantity
      todayIntake.carbs += (m.carbs ?? 0) * item.quantity
      todayIntake.fat += (m.fat ?? 0) * item.quantity
      todayIntake.fiber += (m.fiber ?? 0) * item.quantity
    }
  }

  // fetch available menu items dari semua kantin
  const availableItems = await prisma.menuItem.findMany({
    where: { isAvailable: true },
    include: { seller: { include: { canteen: { select: { name: true } } } } },
  })

  const mapped = availableItems.map(item => ({
    id: item.id,
    name: item.name,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    fiber: item.fiber,
    price: Number(item.price),
    category: item.category,
    isAvailable: item.isAvailable,
    seller: {
      name: item.seller.name,
      canteen: item.seller.canteen,
    },
  }))

  // get recent intake buat variasi check (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  // simplified — just pass empty for now, recommendation algo handles it
  const recentIntake: any[] = []

  const recommendations = getRecommendations(mapped, recentIntake, targetCalories, todayIntake)

  return NextResponse.json({
    targetCalories,
    todayIntake,
    recommendations,
    profileSet: !!(profile?.weight && profile?.height),
  })
}
