'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Armchair, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react'

export default function AdminSeatsPage() {
  const [seats, setSeats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadSeats()
  }, [])

  const loadSeats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/seats')
      if (res.ok) {
        const data = await res.json()
        setSeats(data)
      }
    } catch (err) {
      console.log('Error loading seats:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFreeSeat = async (seatId: string, seatLabel: string) => {
    if (!confirm(`Yakin ingin mengosongkan kursi ${seatLabel} secara paksa?`)) return
    
    setProcessing(seatId)
    try {
      const res = await fetch('/api/admin/seats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatId, action: 'FREE' }),
      })
      if (res.ok) {
        loadSeats()
      } else {
        alert('Gagal mengosongkan kursi')
      }
    } catch {
      alert('Terjadi kesalahan')
    } finally {
      setProcessing(null)
    }
  }

  // Group seats by canteen
  const canteensMap = seats.reduce((acc: any, seat: any) => {
    if (!acc[seat.canteenId]) {
      acc[seat.canteenId] = {
        info: seat.canteen,
        seats: []
      }
    }
    acc[seat.canteenId].seats.push(seat)
    return acc
  }, {})

  const canteens = Object.values(canteensMap)

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Monitor Kursi</h1>
          <p>Pantau status kursi dan kosongkan secara paksa jika diperlukan</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadSeats}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: '300px' }} />
      ) : canteens.length === 0 ? (
        <div className="empty-state">
          <Armchair size={48} />
          <p style={{ marginTop: '12px' }}>Belum ada data kursi</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {canteens.map((canteenData: any, cIdx) => (
            <motion.div key={canteenData.info.id}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: cIdx * 0.1 }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--primary-light)' }}>{canteenData.info.name}</span>
                <span className="badge badge-neutral">{canteenData.info.building}</span>
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {canteenData.seats.map((seat: any) => {
                  const seatLabel = `${String.fromCharCode(65 + seat.row)}${seat.col + 1}`
                  
                  return (
                    <div key={seat.id} className="glass-card-static" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: seat.isOccupied ? '1px solid rgba(239, 68, 68, 0.3)' : undefined }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ 
                          width: '40px', height: '40px', borderRadius: '10px', 
                          background: seat.isOccupied ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                          color: seat.isOccupied ? 'var(--danger)' : 'var(--success)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}>
                          <Armchair size={20} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{seatLabel}</h3>
                          <div style={{ fontSize: '0.8rem', color: seat.isOccupied ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                            {seat.isOccupied ? 'Terisi' : 'Tersedia'}
                          </div>
                          {seat.isOccupied && seat.occupiedUntil && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Sampai: {new Date(seat.occupiedUntil).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>

                      {seat.isOccupied && (
                        <button 
                          className="btn btn-ghost btn-sm" 
                          style={{ color: 'var(--danger)', padding: '6px' }}
                          title="Kosongkan Paksa"
                          disabled={processing === seat.id}
                          onClick={() => handleFreeSeat(seat.id, seatLabel)}
                        >
                          <ShieldAlert size={18} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
