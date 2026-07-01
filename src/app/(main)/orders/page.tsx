'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Clock, ChefHat, Package } from 'lucide-react'

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  PENDING: { label: 'Menunggu', badge: 'badge-warning' },
  PREPARING: { label: 'Diproses', badge: 'badge-info' },
  READY: { label: 'Siap', badge: 'badge-success' },
  DONE: { label: 'Selesai', badge: 'badge-success' },
  CANCELLED: { label: 'Dibatalkan', badge: 'badge-danger' },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders').then(r => r.json()).then(data => {
      setOrders(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1>Pesanan</h1></div>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '100px', marginBottom: '12px' }} />)}
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Pesanan Saya</h1>
        <p>Riwayat dan status pesanan</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={56} />
          <p style={{ marginTop: '12px' }}>Belum ada pesanan</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map((order, idx) => {
            const status = STATUS_MAP[order.status] || { label: order.status, badge: 'badge-neutral' }
            const rowLabel = order.seat ? `${String.fromCharCode(65 + order.seat.row)}${order.seat.col + 1}` : null

            return (
              <motion.div key={order.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card-static"
                style={{ padding: '20px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-light)' }}>
                        #{order.queueNumber}
                      </span>
                      <span className={`badge ${status.badge}`}>{status.label}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {order.canteen?.name} — Gedung {order.canteen?.building}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>
                      Rp{Number(order.totalAmount).toLocaleString('id-ID')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      <Clock size={12} />
                      {new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                </div>

                {/* items */}
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '10px' }}>
                  {order.items?.map((item: any) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {item.quantity}x {item.menuItem?.name}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Rp{Number(item.subtotal).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* seat / takeaway info */}
                <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {order.isTakeaway ? (
                    <span>📦 Takeaway</span>
                  ) : rowLabel ? (
                    <span>💺 Kursi {rowLabel}</span>
                  ) : null}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
