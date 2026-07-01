'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Search, ChefHat, Zap, Save, X } from 'lucide-react'

export default function AdminMenuPage() {
  const [items, setItems] = useState<any[]>([])
  const [sellers, setSellers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [form, setForm] = useState({
    sellerId: '', name: '', price: '', category: '',
    calories: '', protein: '', carbs: '', fat: '', fiber: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [menuRes, canteenRes] = await Promise.all([
      fetch('/api/admin/menu').then(r => r.json()),
      fetch('/api/canteens').then(r => r.json()),
    ])
    setItems(menuRes)

    // flatten sellers dari semua canteen
    const allSellers: any[] = []
    if (Array.isArray(canteenRes)) {
      canteenRes.forEach((c: any) => {
        c.sellers?.forEach((s: any) => {
          allSellers.push({ ...s, canteenName: c.name })
        })
      })
    }
    setSellers(allSellers)
    setLoading(false)
  }

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleDetectNutrition = async () => {
    if (!form.name) return
    setDetecting(true)
    try {
      const res = await fetch('/api/nutrition/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodName: form.name }),
      })
      const data = await res.json()
      if (data.found) {
        setForm(prev => ({
          ...prev,
          calories: String(data.calories || ''),
          protein: String(data.protein || ''),
          carbs: String(data.carbs || ''),
          fat: String(data.fat || ''),
          fiber: String(data.fiber || ''),
        }))
      } else {
        alert('Nutrisi tidak ditemukan otomatis. Silakan isi manual.')
      }
    } catch {
      alert('Gagal mendeteksi nutrisi')
    } finally {
      setDetecting(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.sellerId || !form.name || !form.price || !form.category) {
      alert('Lengkapi data menu')
      return
    }

    const res = await fetch('/api/admin/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerId: form.sellerId,
        name: form.name,
        price: Number(form.price),
        category: form.category,
        calories: form.calories ? Number(form.calories) : null,
        protein: form.protein ? Number(form.protein) : null,
        carbs: form.carbs ? Number(form.carbs) : null,
        fat: form.fat ? Number(form.fat) : null,
        fiber: form.fiber ? Number(form.fiber) : null,
      }),
    })

    if (res.ok) {
      setShowForm(false)
      setForm({ sellerId: '', name: '', price: '', category: '', calories: '', protein: '', carbs: '', fat: '', fiber: '' })
      loadData()
    }
  }

  const handleToggle = async (item: any) => {
    await fetch('/api/admin/menu', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, isAvailable: !item.isAvailable }),
    })
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus menu ini?')) return
    await fetch(`/api/admin/menu?id=${id}`, { method: 'DELETE' })
    loadData()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Kelola Menu</h1>
          <p>Tambah, edit, dan hapus menu makanan</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X size={16} /> Tutup</> : <><Plus size={16} /> Tambah Menu</>}
        </button>
      </div>

      {/* add form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="glass-card-static" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Tambah Menu Baru</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label>Penjual</label>
              <select className="input-field" value={form.sellerId} onChange={e => updateForm('sellerId', e.target.value)}>
                <option value="">Pilih penjual...</option>
                {sellers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.canteenName})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Kategori</label>
              <select className="input-field" value={form.category} onChange={e => updateForm('category', e.target.value)}>
                <option value="">Pilih kategori...</option>
                <option value="Makanan Berat">Makanan Berat</option>
                <option value="Snack">Snack</option>
                <option value="Minuman">Minuman</option>
                <option value="Dessert">Dessert</option>
                <option value="Sayuran">Sayuran</option>
              </select>
            </div>

            <div className="input-group">
              <label>Nama Menu</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" className="input-field" style={{ flex: 1 }} placeholder="Contoh: Nasi Goreng Ayam"
                  value={form.name} onChange={e => updateForm('name', e.target.value)} />
                <button className="btn btn-secondary btn-sm" onClick={handleDetectNutrition}
                  disabled={detecting || !form.name} title="Auto-detect nutrisi">
                  <Zap size={14} /> {detecting ? '...' : 'Detect'}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label>Harga (Rp)</label>
              <input type="number" className="input-field" placeholder="15000"
                value={form.price} onChange={e => updateForm('price', e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              Nutrisi (otomatis atau manual)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {['calories', 'protein', 'carbs', 'fat', 'fiber'].map(f => (
                <div key={f} className="input-group">
                  <label style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{f === 'calories' ? 'Kalori (kcal)' : `${f} (g)`}</label>
                  <input type="number" className="input-field" placeholder="0"
                    value={(form as any)[f]} onChange={e => updateForm(f, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={handleSubmit}>
              <Save size={16} /> Simpan
            </button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
          </div>
        </motion.div>
      )}

      {/* menu list */}
      {loading ? (
        <div className="skeleton" style={{ height: '300px' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item: any) => (
            <div key={item.id} className="glass-card-static"
              style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{item.category}</span>
                  {!item.isAvailable && <span className="badge badge-danger">Habis</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {item.seller?.name} — {item.seller?.canteen?.name}
                  {item.calories && ` • ${item.calories} kcal`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary-light)', minWidth: '80px', textAlign: 'right' }}>
                  Rp{Number(item.price).toLocaleString('id-ID')}
                </span>
                <button className={`btn btn-sm ${item.isAvailable ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => handleToggle(item)}>
                  {item.isAvailable ? 'Nonaktif' : 'Aktifkan'}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                  onClick={() => handleDelete(item.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
