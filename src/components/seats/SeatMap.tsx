'use client'

import { useState, useEffect, Fragment } from 'react'
import { motion } from 'framer-motion'
import { Armchair } from 'lucide-react'

interface SeatData {
  id: string
  seatNumber: number
  row: number
  col: number
  isOccupied: boolean
}

interface SeatMapProps {
  canteenId: string
  rows: number
  cols: number
  selectedSeatId: string | null
  onSelectSeat: (seatId: string | null) => void
  isTakeaway: boolean
}

export default function SeatMap({ canteenId, rows, cols, selectedSeatId, onSelectSeat, isTakeaway }: SeatMapProps) {
  const [seats, setSeats] = useState<SeatData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSeats()
  }, [canteenId])

  const fetchSeats = async () => {
    try {
      const res = await fetch(`/api/seats/${canteenId}`)
      const data = await res.json()
      setSeats(data.seats || [])
    } catch (err) {
      console.log('error fetch seats:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = (seat: SeatData) => {
    if (seat.isOccupied || isTakeaway) return
    if (selectedSeatId === seat.id) {
      onSelectSeat(null)
    } else {
      onSelectSeat(seat.id)
    }
  }

  // generate row labels (A, B, C, D)
  const rowLabel = (r: number) => String.fromCharCode(65 + r)

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div className="skeleton" style={{ width: '200px', height: '200px', margin: '0 auto' }} />
      </div>
    )
  }

  return (
    <div style={{ opacity: isTakeaway ? 0.4 : 1, transition: 'opacity 0.3s', pointerEvents: isTakeaway ? 'none' : 'auto' }}>
      <div className="seat-grid" style={{ gridTemplateColumns: `auto repeat(${cols}, 48px)` }}>
        {/* header row — column numbers */}
        <div />
        {Array.from({ length: cols }, (_, c) => (
          <div key={`header-${c}`} style={{
            textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600,
          }}>
            {c + 1}
          </div>
        ))}

        {/* seat rows */}
        {Array.from({ length: rows }, (_, r) => (
          <Fragment key={`row-${r}`}>
            <div key={`label-${r}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, width: '24px',
            }}>
              {rowLabel(r)}
            </div>
            {Array.from({ length: cols }, (_, c) => {
              const seat = seats.find(s => s.row === r && s.col === c)
              if (!seat) return <div key={`empty-${r}-${c}`} />

              const isSelected = selectedSeatId === seat.id
              const statusClass = isSelected ? 'seat-selected' : seat.isOccupied ? 'seat-occupied' : 'seat-available'

              return (
                <motion.button
                  key={seat.id}
                  whileHover={!seat.isOccupied ? { scale: 1.1 } : {}}
                  whileTap={!seat.isOccupied ? { scale: 0.95 } : {}}
                  className={`seat ${statusClass}`}
                  onClick={() => handleClick(seat)}
                  title={`${rowLabel(r)}${c + 1} — ${seat.isOccupied ? 'Terisi' : isSelected ? 'Dipilih' : 'Tersedia'}`}
                >
                  <Armchair size={18} />
                </motion.button>
              )
            })}
          </Fragment>
        ))}
      </div>

      {/* legend */}
      <div className="seat-legend">
        <div className="seat-legend-item">
          <div className="seat-legend-dot" style={{ background: 'rgba(34, 197, 94, 0.4)' }} />
          Tersedia
        </div>
        <div className="seat-legend-item">
          <div className="seat-legend-dot" style={{ background: 'rgba(239, 68, 68, 0.4)' }} />
          Terisi
        </div>
        <div className="seat-legend-item">
          <div className="seat-legend-dot" style={{ background: 'rgba(59, 130, 246, 0.4)' }} />
          Dipilih
        </div>
      </div>
    </div>
  )
}
