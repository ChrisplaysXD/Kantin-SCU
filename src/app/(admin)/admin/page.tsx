'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, ShoppingBag, Wallet, Store, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/canteens').then(r => r.json()),
      fetch('/api/admin/orders').then(r => r.json()),
    ]).then(([canteens, orders]) => {
      const todayOrders = Array.isArray(orders) ? orders.filter((o: any) => {
        const d = new Date(o.createdAt)
        const today = new Date()
        return d.toDateString() === today.toDateString()
      }) : []

      const totalRevenue = todayOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0)

      setStats({
        canteens: canteens.length,
        ordersToday: todayOrders.length,
        totalRevenue,
        totalOrders: Array.isArray(orders) ? orders.length : 0,
      })
    })
  }, [])

  const fadeIn = (d: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: d } })

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Ringkasan operasional kantin</p>
      </div>

      <div className="grid-4" style={{ marginBottom: '32px' }}>
        {[
          { icon: ShoppingBag, color: 'var(--primary)', label: 'Pesanan Hari Ini', value: stats?.ordersToday ?? '...' },
          { icon: Wallet, color: 'var(--success)', label: 'Revenue Hari Ini', value: stats ? `Rp${stats.totalRevenue.toLocaleString('id-ID')}` : '...' },
          { icon: Store, color: 'var(--warning)', label: 'Kantin Aktif', value: stats?.canteens ?? '...' },
          { icon: TrendingUp, color: 'var(--info)', label: 'Total Pesanan', value: stats?.totalOrders ?? '...' },
        ].map((card, idx) => (
          <motion.div key={idx} {...fadeIn(idx * 0.1)} className="glass-card" style={{ padding: '20px' }}>
            <card.icon size={22} color={card.color} style={{ marginBottom: '12px' }} />
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-label">{card.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
