'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Clock, Check, X, RefreshCw } from 'lucide-react'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    const res = await fetch('/api/admin/orders')
    const data = await res.json()
    setOrders(data)
    setLoading(false)
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setProcessing(orderId)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      })
      if (res.ok) {
        loadOrders()
      } else {
        const data = await res.json()
        alert(data.error || 'Gagal update status')
      }
    } catch {
      alert('Terjadi kesalahan saat update status')
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return 'badge-warning'
      case 'PREPARING': return 'badge-info'
      case 'READY': return 'badge-success'
      case 'DONE': return 'badge-neutral'
      case 'CANCELLED': return 'badge-danger'
      default: return 'badge-neutral'
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Kelola Pesanan</h1>
          <p>Update status pesanan yang masuk ke kantin</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => { setLoading(true); loadOrders() }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: '400px' }} />
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={48} />
          <p style={{ marginTop: '12px' }}>Belum ada pesanan</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((order, idx) => (
            <motion.div key={order.id}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="glass-card-static" style={{ padding: '20px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-light)' }}>
                      #{order.queueNumber}
                    </span>
                    <span className={`badge ${getStatusBadge(order.status)}`}>{order.status}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Oleh: <strong>{order.user?.name}</strong> (@{order.user?.username})
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Kantin: {order.canteen?.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Clock size={12} /> {new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    Rp{Number(order.totalAmount).toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {order.isTakeaway ? '📦 Takeaway' : order.seat ? `💺 Kursi ${String.fromCharCode(65 + order.seat.row)}${order.seat.col + 1}` : '-'}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div style={{ padding: '12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Rincian Menu:</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {order.items?.map((item: any) => (
                    <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>{item.quantity}x {item.menuItem?.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>Rp{Number(item.subtotal).toLocaleString('id-ID')}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions based on status */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {order.status === 'PENDING' && (
                  <>
                    <button className="btn btn-info btn-sm" disabled={processing === order.id} onClick={() => handleUpdateStatus(order.id, 'PREPARING')}>
                      Terima & Siapkan
                    </button>
                    <button className="btn btn-ghost btn-sm" disabled={processing === order.id} style={{ color: 'var(--danger)' }} onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}>
                      Tolak
                    </button>
                  </>
                )}
                {order.status === 'PREPARING' && (
                  <button className="btn btn-success btn-sm" disabled={processing === order.id} onClick={() => handleUpdateStatus(order.id, 'READY')}>
                    <Check size={16} /> Pesanan Siap
                  </button>
                )}
                {order.status === 'READY' && (
                  <button className="btn btn-primary btn-sm" disabled={processing === order.id} onClick={() => handleUpdateStatus(order.id, 'DONE')}>
                    <Check size={16} /> Diserahkan (Selesai)
                  </button>
                )}
                {['DONE', 'CANCELLED'].includes(order.status) && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pesanan ditutup.</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
