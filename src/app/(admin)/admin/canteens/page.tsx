'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Store, Plus, Trash2, MapPin } from 'lucide-react'

export default function AdminCanteensPage() {
  const [canteens, setCanteens] = useState<any[]>([])
  const [sellers, setSellers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'canteens' | 'sellers'>('canteens')

  // Modals state
  const [showCanteenModal, setShowCanteenModal] = useState(false)
  const [showSellerModal, setShowSellerModal] = useState(false)

  // Form states
  const [canteenForm, setCanteenForm] = useState({ name: '', building: '', description: '', seatRows: 4, seatCols: 5 })
  const [sellerForm, setSellerForm] = useState({ name: '', canteenId: '', description: '' })
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [resC, resS] = await Promise.all([
        fetch('/api/admin/canteens'),
        fetch('/api/admin/sellers')
      ])
      if (resC.ok && resS.ok) {
        setCanteens(await resC.json())
        setSellers(await resS.json())
      }
    } catch (err) {
      console.log('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Canteen Actions
  const handleCreateCanteen = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/canteens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(canteenForm),
      })
      if (res.ok) {
        setShowCanteenModal(false)
        setCanteenForm({ name: '', building: '', description: '', seatRows: 4, seatCols: 5 })
        loadData()
      } else {
        alert('Gagal menambah kantin')
      }
    } catch {
      alert('Terjadi kesalahan')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteCanteen = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kantin ini? Semua penjual dan kursi akan terhapus.')) return
    try {
      await fetch(`/api/admin/canteens?id=${id}`, { method: 'DELETE' })
      loadData()
    } catch {
      alert('Gagal menghapus')
    }
  }

  // Seller Actions
  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sellerForm),
      })
      if (res.ok) {
        setShowSellerModal(false)
        setSellerForm({ name: '', canteenId: '', description: '' })
        loadData()
      } else {
        alert('Gagal menambah penjual')
      }
    } catch {
      alert('Terjadi kesalahan')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteSeller = async (id: string) => {
    if (!confirm('Yakin ingin menghapus penjual ini? Semua menu akan terhapus.')) return
    try {
      await fetch(`/api/admin/sellers?id=${id}`, { method: 'DELETE' })
      loadData()
    } catch {
      alert('Gagal menghapus')
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Kantin & Penjual</h1>
          <p>Kelola data kantin dan daftar penjual yang tersedia</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowCanteenModal(true)}>
            <Plus size={16} /> Kantin
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowSellerModal(true)}>
            <Plus size={16} /> Penjual
          </button>
        </div>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)' }}>
        <button 
          className={`tab ${activeTab === 'canteens' ? 'active' : ''}`}
          style={{ padding: '12px 24px', fontWeight: 600, background: 'none', border: 'none', color: activeTab === 'canteens' ? 'var(--primary-light)' : 'var(--text-muted)', borderBottom: activeTab === 'canteens' ? '2px solid var(--primary-light)' : '2px solid transparent', cursor: 'pointer' }}
          onClick={() => setActiveTab('canteens')}
        >
          Kantin ({canteens.length})
        </button>
        <button 
          className={`tab ${activeTab === 'sellers' ? 'active' : ''}`}
          style={{ padding: '12px 24px', fontWeight: 600, background: 'none', border: 'none', color: activeTab === 'sellers' ? 'var(--primary-light)' : 'var(--text-muted)', borderBottom: activeTab === 'sellers' ? '2px solid var(--primary-light)' : '2px solid transparent', cursor: 'pointer' }}
          onClick={() => setActiveTab('sellers')}
        >
          Penjual ({sellers.length})
        </button>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: '300px' }} />
      ) : activeTab === 'canteens' ? (
        // CANTEENS VIEW
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {canteens.length === 0 ? <p>Belum ada kantin.</p> : canteens.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card-static" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{c.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <MapPin size={14} /> Gedung {c.building}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: '6px' }} onClick={() => handleDeleteCanteen(c.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div style={{ marginTop: '16px', display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
                <div style={{ background: 'var(--bg-glass)', padding: '8px 12px', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 600 }}>{c._count?.sellers || 0}</span> Penjual
                </div>
                <div style={{ background: 'var(--bg-glass)', padding: '8px 12px', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 600 }}>{c._count?.seats || 0}</span> Kursi
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        // SELLERS VIEW
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {sellers.length === 0 ? <p>Belum ada penjual.</p> : sellers.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card-static" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{s.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <Store size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                    {s.canteen?.name}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: '6px' }} onClick={() => handleDeleteSeller(s.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div style={{ marginTop: '16px', fontSize: '0.85rem' }}>
                <strong>{s._count?.menuItems || 0}</strong> Menu Terdaftar
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Canteen Modal */}
      {showCanteenModal && (
        <div className="modal-overlay" onClick={() => setShowCanteenModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Kantin</h2>
              <button className="btn btn-ghost" onClick={() => setShowCanteenModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateCanteen} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Nama Kantin</label>
                  <input type="text" className="input" required value={canteenForm.name} onChange={e => setCanteenForm({...canteenForm, name: e.target.value})} placeholder="Cth: Kantin Thomas Aquinas" />
                </div>
                <div className="form-group">
                  <label>Gedung</label>
                  <input type="text" className="input" required value={canteenForm.building} onChange={e => setCanteenForm({...canteenForm, building: e.target.value})} placeholder="Cth: TA" />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Baris Kursi</label>
                    <input type="number" className="input" min="1" required value={canteenForm.seatRows} onChange={e => setCanteenForm({...canteenForm, seatRows: parseInt(e.target.value)})} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Kolom Kursi</label>
                    <input type="number" className="input" min="1" required value={canteenForm.seatCols} onChange={e => setCanteenForm({...canteenForm, seatCols: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Deskripsi (Opsional)</label>
                  <textarea className="input" rows={2} value={canteenForm.description} onChange={e => setCanteenForm({...canteenForm, description: e.target.value})} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCanteenModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary" disabled={processing}>{processing ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Seller Modal */}
      {showSellerModal && (
        <div className="modal-overlay" onClick={() => setShowSellerModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Penjual</h2>
              <button className="btn btn-ghost" onClick={() => setShowSellerModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateSeller} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Nama Penjual / Stand</label>
                  <input type="text" className="input" required value={sellerForm.name} onChange={e => setSellerForm({...sellerForm, name: e.target.value})} placeholder="Cth: Nasi Goreng Pak Min" />
                </div>
                <div className="form-group">
                  <label>Pilih Kantin</label>
                  <select className="input" required value={sellerForm.canteenId} onChange={e => setSellerForm({...sellerForm, canteenId: e.target.value})}>
                    <option value="" disabled>-- Pilih Kantin --</option>
                    {canteens.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Deskripsi (Opsional)</label>
                  <textarea className="input" rows={2} value={sellerForm.description} onChange={e => setSellerForm({...sellerForm, description: e.target.value})} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowSellerModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary" disabled={processing}>{processing ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
