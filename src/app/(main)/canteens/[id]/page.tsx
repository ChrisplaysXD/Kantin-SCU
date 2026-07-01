'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/hooks/useCart'
import SeatMap from '@/components/seats/SeatMap'
import {
  ArrowLeft, ShoppingCart, Plus, Minus, Trash2, Flame,
  X, Package, ChefHat, Armchair,
} from 'lucide-react'
import Link from 'next/link'

export default function CanteenDetailPage() {
  const params = useParams()
  const router = useRouter()
  const canteenId = params.id as string

  const [canteen, setCanteen] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'menu' | 'seats'>('menu')
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null)
  const [isTakeaway, setIsTakeaway] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const [orderResult, setOrderResult] = useState<any>(null)

  const cart = useCart()

  useEffect(() => {
    fetch(`/api/canteens/${canteenId}`)
      .then(r => r.json())
      .then(data => {
        setCanteen(data)
        if (data.sellers?.length > 0) setSelectedSeller(data.sellers[0].id)
        setLoading(false)
      })
  }, [canteenId])

  const handleOrder = async () => {
    if (cart.items.length === 0) return
    if (!isTakeaway && !selectedSeat) {
      setActiveTab('seats')
      return
    }

    setOrdering(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canteenId,
          items: cart.items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
          seatId: isTakeaway ? null : selectedSeat,
          isTakeaway,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Gagal order')
        setOrdering(false)
        return
      }

      setOrderResult(data)
      cart.clearCart()
      setCartOpen(false)
    } catch {
      alert('Terjadi kesalahan')
    } finally {
      setOrdering(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}><div className="skeleton" style={{ width: '100%', height: '400px' }} /></div>
  }

  if (!canteen) {
    return <div className="empty-state"><p>Kantin tidak ditemukan</p></div>
  }

  const currentSeller = canteen.sellers?.find((s: any) => s.id === selectedSeller)
  const menuItems = currentSeller?.menuItems || []

  return (
    <div>
      {/* order success modal */}
      <AnimatePresence>
        {orderResult && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="glass-card-static" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>Pesanan Berhasil!</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Nomor antrian kamu</p>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)', margin: '12px 0' }}>
                #{orderResult.order?.queueNumber}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
                Total: Rp{Number(orderResult.order?.totalAmount).toLocaleString('id-ID')}
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => router.push('/orders')}>Lihat Pesanan</button>
                <button className="btn btn-secondary" onClick={() => setOrderResult(null)}>Tutup</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link href="/canteens" className="btn btn-ghost" style={{ padding: '8px' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{canteen.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gedung {canteen.building}</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge ${canteen.busyness?.level === 'SEPI' ? 'badge-success' : canteen.busyness?.level === 'RAMAI' ? 'badge-warning' : 'badge-danger'}`}>
            {canteen.busyness?.label}
          </span>
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
        <button
          className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ flex: 1 }}
          onClick={() => setActiveTab('menu')}
        >
          <ChefHat size={16} /> Menu
        </button>
        <button
          className={`btn ${activeTab === 'seats' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ flex: 1 }}
          onClick={() => setActiveTab('seats')}
        >
          <Armchair size={16} /> Kursi
        </button>
      </div>

      {activeTab === 'menu' && (
        <>
          {/* seller tabs */}
          {canteen.sellers?.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
              {canteen.sellers.map((s: any) => (
                <button key={s.id}
                  className={`btn btn-sm ${selectedSeller === s.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedSeller(s.id)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {/* menu grid */}
          <div className="grid-3">
            {menuItems.map((item: any, idx: number) => (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card-static"
                style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>{item.name}</h4>
                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{item.category}</span>
                  </div>
                  {!item.isAvailable && <span className="badge badge-danger">Habis</span>}
                </div>

                {item.calories && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <Flame size={12} /> {item.calories} kcal
                  </div>
                )}

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                    Rp{Number(item.price).toLocaleString('id-ID')}
                  </span>
                  {item.isAvailable && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => cart.addItem({
                        menuItemId: item.id,
                        name: item.name,
                        price: Number(item.price),
                        sellerId: currentSeller.id,
                        sellerName: currentSeller.name,
                        calories: item.calories,
                      })}
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {menuItems.length === 0 && (
            <div className="empty-state">
              <Package size={48} />
              <p style={{ marginTop: '8px' }}>Belum ada menu dari penjual ini</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'seats' && (
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontWeight: 700 }}>Pilih Kursi</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={isTakeaway} onChange={e => { setIsTakeaway(e.target.checked); if (e.target.checked) setSelectedSeat(null) }}
                style={{ accentColor: 'var(--primary)' }} />
              Takeaway (bawa pulang)
            </label>
          </div>
          <SeatMap
            canteenId={canteenId}
            rows={canteen.seatRows || 4}
            cols={canteen.seatCols || 5}
            selectedSeatId={selectedSeat}
            onSelectSeat={setSelectedSeat}
            isTakeaway={isTakeaway}
          />
        </div>
      )}

      {/* floating cart button */}
      {cart.itemCount > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="btn btn-primary btn-xl"
          onClick={() => setCartOpen(true)}
          style={{
            position: 'fixed', bottom: '90px', right: '24px', zIndex: 50,
            boxShadow: '0 4px 24px rgba(124,58,237,0.4)',
            borderRadius: 'var(--radius-full)',
          }}
        >
          <ShoppingCart size={20} />
          {cart.itemCount} item — Rp{cart.total.toLocaleString('id-ID')}
        </motion.button>
      )}

      {/* cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="overlay" onClick={() => setCartOpen(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: '380px', maxWidth: '100vw',
                background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-glass)',
                zIndex: 60, display: 'flex', flexDirection: 'column',
              }}
            >
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 700 }}>Keranjang ({cart.itemCount})</h3>
                <button className="btn btn-ghost" onClick={() => setCartOpen(false)} style={{ padding: '6px' }}><X size={20} /></button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {cart.items.map(item => (
                  <div key={item.menuItemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-glass)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.sellerName} • Rp{item.price.toLocaleString('id-ID')}
                      </div>
                      {item.calories && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <Flame size={10} style={{ display: 'inline' }} /> {item.calories * item.quantity} kcal
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }}
                        onClick={() => cart.updateQuantity(item.menuItemId, item.quantity - 1)}>
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }}
                        onClick={() => cart.updateQuantity(item.menuItemId, item.quantity + 1)}>
                        <Plus size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px', color: 'var(--danger)' }}
                        onClick={() => cart.removeItem(item.menuItemId)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '16px', borderTop: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Kalori</span>
                  <span style={{ fontWeight: 600 }}>{cart.totalCalories} kcal</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Total</span>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-light)' }}>
                    Rp{cart.total.toLocaleString('id-ID')}
                  </span>
                </div>

                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <Armchair size={16} color="var(--text-muted)" />
                  {isTakeaway ? 'Takeaway' : selectedSeat ? 'Kursi dipilih ✓' : (
                    <span style={{ color: 'var(--warning)' }}>Pilih kursi dulu atau centang Takeaway</span>
                  )}
                </div>

                <button
                  className="btn btn-primary btn-full btn-lg"
                  onClick={handleOrder}
                  disabled={ordering || (!isTakeaway && !selectedSeat)}
                >
                  {ordering ? 'Memproses...' : 'Pesan Sekarang'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
