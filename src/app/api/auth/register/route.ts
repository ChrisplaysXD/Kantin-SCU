import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, password, name, studentId } = body

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'Username, password, dan nama wajib diisi' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Username sudah dipakai' }, { status: 409 })
    }

    if (studentId) {
      const existingStudent = await prisma.user.findUnique({ where: { studentId } })
      if (existingStudent) {
        return NextResponse.json({ error: 'NIM sudah terdaftar' }, { status: 409 })
      }
    }

    const hashed = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashed,
        name,
        studentId: studentId || null,
        wallet: { create: { balance: 0 } },
        healthProfile: { create: {} },
      },
    })

    return NextResponse.json({
      message: 'Registrasi berhasil',
      user: { id: user.id, username: user.username, name: user.name },
    }, { status: 201 })
  } catch (err) {
    console.log('register error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
