'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Store, Users, Armchair, TrendingUp } from 'lucide-react'

export default function CanteensPage() {
  const [canteens, setCanteens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/canteens')
      .then(r => r.json())
      .then(data => { setCanteens(data); setLoading(false) })
  }, [])

  return (
    <div>
      <div className="page-header">
        <h1>Kantin</h1>
        <p>Pilih kantin untuk melihat menu dan pesan makanan</p>
      </div>

      {loading ? (
        <div className="grid-2">
          {[1, 2].map(i => (
            <div key={i} className="skeleton" style={{ height: '240px' }} />
          ))}
        </div>
      ) : (
        <div className="grid-2">
          {canteens.map((c, idx) => (
            <motion.div key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
            >
              <Link href={`/canteens/${c.id}`} style={{ textDecoration: 'none' }}>
                <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                  {/* header gradient */}
                  <div style={{
                    height: '120px',
                    background: idx === 0
                      ? 'linear-gradient(135deg, #7C3AED, #6D28D9)'
                      : 'linear-gradient(135deg, #8B1A1A, #4C0519)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}>
                    <Store size={48} color="rgba(255,255,255,0.3)" />
                    <div style={{
                      position: 'absolute', top: '12px', right: '12px',
                    }}>
                      <span className={`badge ${c.busyness?.level === 'SEPI' ? 'badge-success' : c.busyness?.level === 'RAMAI' ? 'badge-warning' : 'badge-danger'}`}>
                        {c.busyness?.label}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>{c.name}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                      Gedung {c.building}
                    </p>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Users size={14} /> {c.sellers?.length || 0} penjual
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Armchair size={14} /> {c.occupiedSeats}/{c.totalSeats} kursi terisi
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <TrendingUp size={14} /> {c.busyness?.ordersToday} pesanan hari ini
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
