'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, HeartPulse, Store, Wallet, Calendar } from 'lucide-react'

export default function Home() {
  const fadeIn = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.6 }
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-light)', letterSpacing: '-0.5px' }}>
          SCU<span style={{ color: 'var(--text-primary)' }}>Canteen</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/login" className="btn btn-ghost">Login</Link>
          <Link href="/register" className="btn btn-primary">Daftar</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center', marginTop: '-40px' }}>
        <motion.div {...fadeIn(0)} style={{ marginBottom: '24px' }}>
          <span className="badge badge-info" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
            Beta Release 1.0
          </span>
        </motion.div>

        <motion.h1 {...fadeIn(0.1)} style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px', maxWidth: '800px' }}>
          Makan Lebih Baik, <br />
          <span style={{ background: 'linear-gradient(90deg, var(--primary-light), var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Hidup Lebih Sehat
          </span>
        </motion.h1>

        <motion.p {...fadeIn(0.2)} style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '40px', maxWidth: '600px', lineHeight: 1.6 }}>
          Platform kantin digital untuk mahasiswa SCU. Pesan makan, pantau kalori, 
          dan bayar dengan dompet digital dalam satu aplikasi.
        </motion.p>

        <motion.div {...fadeIn(0.3)} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/register" className="btn btn-primary btn-lg" style={{ fontSize: '1.1rem', padding: '14px 28px' }}>
            Mulai Sekarang <ArrowRight size={20} style={{ marginLeft: '8px' }} />
          </Link>
          <Link href="/canteens" className="btn btn-secondary btn-lg" style={{ fontSize: '1.1rem', padding: '14px 28px' }}>
            Lihat Menu
          </Link>
        </motion.div>
      </main>

      {/* Features Grid */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-glass)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>Fitur Unggulan</h2>
            <p style={{ color: 'var(--text-muted)' }}>Semua yang kamu butuhkan untuk pengalaman bersantap yang lebih baik</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {[
              { icon: Store, color: '#3B82F6', title: 'Pesan Tanpa Antri', desc: 'Pilih kantin, pesan makanan, dan dapatkan kursi secara digital.' },
              { icon: HeartPulse, color: '#EF4444', title: 'Rekomendasi Sehat', desc: 'Saran makanan berdasarkan asupan kalori dan profil kesehatanmu.' },
              { icon: Wallet, color: '#10B981', title: 'Dompet Digital', desc: 'Top-up saldo dengan Midtrans dan bayar pesanan dengan mudah.' },
              { icon: Calendar, color: '#F59E0B', title: 'Riwayat Pesanan', desc: 'Pantau pengeluaran dan kebiasaan makanmu setiap hari.' }
            ].map((f, i) => (
              <motion.div key={i} {...fadeIn(0.4 + (i * 0.1))} className="glass-card" style={{ padding: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <f.icon size={24} color={f.color} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 24px', textAlign: 'center', borderTop: '1px solid var(--border-glass)' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '16px', opacity: 0.5 }}>
          SCUCanteen
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          &copy; {new Date().getFullYear()} Soegijapranata Catholic University. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
