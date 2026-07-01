'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Wallet, ShoppingBag, Store, Heart, ArrowUpRight,
  TrendingUp, Clock, Plus,
} from 'lucide-react'
import CalorieRing from '@/components/dashboard/CalorieRing'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [walletData, setWalletData] = useState<any>(null)
  const [canteens, setCanteens] = useState<any[]>([])
  const [recData, setRecData] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/wallet/balance').then(r => r.json()).then(setWalletData)
    fetch('/api/canteens').then(r => r.json()).then(setCanteens)
    fetch('/api/recommendations').then(r => r.json()).then(setRecData)
    fetch('/api/orders?limit=5').then(r => r.json()).then(setOrders)
  }, [])

  const handleResetCalories = async () => {
    if (!confirm('Yakin ingin mereset asupan kalori hari ini ke nol? (Histori pesanan tidak akan hilang)')) return;
    try {
      const res = await fetch('/api/health/reset-calories', { method: 'POST' });
      if (res.ok) {
        fetch('/api/recommendations').then(r => r.json()).then(setRecData);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const balance = walletData?.balance ? Number(walletData.balance).toLocaleString('id-ID') : '...'

  const fadeIn = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5 },
  })

  return (
    <div>
      <div className="page-header">
        <h1>Halo, {session?.user?.name?.split(' ')[0] || 'User'} 👋</h1>
        <p>Selamat datang di SCU Canteen</p>
      </div>

      {/* stat cards */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <motion.div {...fadeIn(0)} className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <Wallet size={20} color="var(--primary)" />
            <Link href="/wallet" className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="stat-card-value">Rp{balance}</div>
          <div className="stat-card-label">Saldo Wallet</div>
        </motion.div>

        <motion.div {...fadeIn(0.1)} className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <ShoppingBag size={20} color="var(--warning)" />
            <Link href="/orders" className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="stat-card-value">{orders.length}</div>
          <div className="stat-card-label">Pesanan Terakhir</div>
        </motion.div>

        <motion.div {...fadeIn(0.2)} className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <Store size={20} color="var(--success)" />
          </div>
          <div className="stat-card-value">{canteens.length}</div>
          <div className="stat-card-label">Kantin Tersedia</div>
        </motion.div>

        <motion.div {...fadeIn(0.3)} className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <Heart size={20} color="var(--danger)" />
            <Link href="/recommendations" className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="stat-card-value">{recData?.recommendations?.length || 0}</div>
          <div className="stat-card-label">Rekomendasi</div>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* calorie tracker */}
        <motion.div {...fadeIn(0.4)} className="glass-card-static" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--primary)" /> Kalori Hari Ini
            </h3>
            <button onClick={handleResetCalories} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }} title="Reset Kalori">
              Reset
            </button>
          </div>
          {recData ? (
            <CalorieRing consumed={recData.todayIntake?.calories || 0} target={recData.targetCalories || 2000} />
          ) : (
            <div className="skeleton" style={{ width: '140px', height: '140px', borderRadius: '50%', margin: '0 auto' }} />
          )}
          {recData && !recData.profileSet && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Isi profil kesehatan untuk target kalori yang lebih akurat
              </p>
              <Link href="/settings" className="btn btn-secondary btn-sm">Atur Profil</Link>
            </div>
          )}
        </motion.div>

        {/* kantin busyness */}
        <motion.div {...fadeIn(0.5)} className="glass-card-static" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={18} color="var(--primary)" /> Status Kantin
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {canteens.map((c: any) => (
              <Link key={c.id} href={`/canteens/${c.id}`} style={{ textDecoration: 'none' }}>
                <div className="glass-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gedung {c.building}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${c.busyness?.level === 'SEPI' ? 'badge-success' : c.busyness?.level === 'RAMAI' ? 'badge-warning' : 'badge-danger'}`}>
                      {c.busyness?.label || 'N/A'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {c.occupiedSeats}/{c.totalSeats} kursi
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* quick actions */}
      <motion.div {...fadeIn(0.6)} style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Aksi Cepat</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/wallet" className="btn btn-primary">
            <Plus size={16} /> Top-up Saldo
          </Link>
          <Link href="/canteens" className="btn btn-secondary">
            <Store size={16} /> Pesan Makanan
          </Link>
          <Link href="/recommendations" className="btn btn-secondary">
            <Heart size={16} /> Lihat Rekomendasi
          </Link>
        </div>
      </motion.div>

      {/* recent orders */}
      {orders.length > 0 && (
        <motion.div {...fadeIn(0.7)} style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Pesanan Terakhir</h3>
            <Link href="/orders" className="btn btn-ghost btn-sm">Lihat Semua</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {orders.slice(0, 3).map((order: any) => (
              <div key={order.id} className="glass-card-static" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Pesanan #{order.queueNumber} — {order.canteen?.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${order.status === 'DONE' ? 'badge-success' : order.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'}`}>
                    {order.status}
                  </span>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '4px' }}>
                    Rp{Number(order.totalAmount).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
