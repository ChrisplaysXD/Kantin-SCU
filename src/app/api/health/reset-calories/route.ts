import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const updatedProfile = await prisma.healthProfile.update({
      where: { userId },
      data: {
        calorieResetAt: new Date(),
      }
    })

    return NextResponse.json({ success: true, profile: updatedProfile })
  } catch (error) {
    console.error("error resetting calories:", error)
    return NextResponse.json({ error: 'Failed to reset calories' }, { status: 500 })
  }
}
