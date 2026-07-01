import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { amount } = await req.json()
    const numAmount = Number(amount)

    if (!numAmount || numAmount < 10000) {
      return NextResponse.json({ error: 'Minimal top-up Rp10.000' }, { status: 400 })
    }

    const userId = (session.user as any).id

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet tidak ditemukan' }, { status: 404 })
    }

    // langsung update balance + bikin transaction record sekaligus
    const [updatedWallet, transaction] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: numAmount } },
      }),
      prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'TOP_UP',
          amount: numAmount,
          description: `Top-up saldo Rp${numAmount.toLocaleString('id-ID')}`,
          status: 'SUCCESS',
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      balance: updatedWallet.balance,
      transactionId: transaction.id,
    })
  } catch (err) {
    console.log('topup error:', err)
    return NextResponse.json({ error: 'Gagal top-up' }, { status: 500 })
  }
}
