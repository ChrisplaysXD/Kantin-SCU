import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Midtrans notification webhook
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { order_id, status_code, gross_amount, signature_key, transaction_status } = body

    // verify signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY || ''
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex')

    if (signature_key !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { midtransId: order_id },
      include: { wallet: true },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // handle status
    if (['capture', 'settlement'].includes(transaction_status)) {
      // payment sukses — update wallet balance
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'SUCCESS' },
        }),
        prisma.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { increment: transaction.amount } },
        }),
      ])
    } else if (['deny', 'cancel', 'expire'].includes(transaction_status)) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      })
    }

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.log('midtrans callback error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
