'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { UserPlus, UtensilsCrossed, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', username: '', password: '', studentId: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registrasi gagal')
        setLoading(false)
        return
      }

      router.push('/login?registered=true')
    } catch {
      setError('Terjadi kesalahan jaringan')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #0f2027 0%, #0a0e17 60%)',
      padding: '20px',
    }}>
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass-card-static"
        style={{ width: '100%', maxWidth: '420px', padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              width: '56px', height: '56px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 0 30px rgba(124,58,237,0.3)',
            }}
          >
            <UtensilsCrossed size={28} color="white" />
          </motion.div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>Buat Akun</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Daftar untuk mulai pesan makanan
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label htmlFor="name">Nama Lengkap</label>
            <input id="name" type="text" className="input-field" placeholder="Nama kamu"
              value={form.name} onChange={e => update('name', e.target.value)} required />
          </div>

          <div className="input-group">
            <label htmlFor="reg-username">Username</label>
            <input id="reg-username" type="text" className="input-field" placeholder="Pilih username"
              value={form.username} onChange={e => update('username', e.target.value)} required />
          </div>

          <div className="input-group">
            <label htmlFor="studentId">NIM (opsional)</label>
            <input id="studentId" type="text" className="input-field" placeholder="Nomor Induk Mahasiswa"
              value={form.studentId} onChange={e => update('studentId', e.target.value)} />
          </div>

          <div className="input-group">
            <label htmlFor="reg-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input id="reg-password" type={showPw ? 'text' : 'password'}
                className="input-field" style={{ width: '100%', paddingRight: '44px' }}
                placeholder="Minimal 6 karakter"
                value={form.password} onChange={e => update('password', e.target.value)}
                required minLength={6} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  padding: '4px', display: 'flex',
                }}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                padding: '10px 14px', background: 'var(--danger-bg)',
                borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem',
              }}>
              {error}
            </motion.div>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Memproses...' : <><UserPlus size={18} /> Daftar</>}
          </button>
        </form>

        <p style={{
          textAlign: 'center', marginTop: '24px',
          color: 'var(--text-muted)', fontSize: '0.85rem',
        }}>
          Sudah punya akun?{' '}
          <Link href="/login" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>
            Masuk
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
