'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Flame, Zap, Leaf, Award, AlertCircle } from 'lucide-react'
import CalorieRing from '@/components/dashboard/CalorieRing'
import Link from 'next/link'

export default function RecommendationsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/recommendations').then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1>Rekomendasi</h1></div>
        <div className="skeleton" style={{ height: '300px' }} />
      </div>
    )
  }

  const intake = data?.todayIntake || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  const recommendations = data?.recommendations || []

  return (
    <div>
      <div className="page-header">
        <h1>Rekomendasi Sehat</h1>
        <p>Saran makanan berdasarkan asupan nutrisi hari ini</p>
      </div>

      {!data?.profileSet && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card-static" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(245,158,11,0.3)' }}>
          <AlertCircle size={20} color="var(--warning)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Profil belum lengkap</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Isi profil kesehatan untuk rekomendasi yang lebih akurat
            </div>
          </div>
          <Link href="/settings" className="btn btn-secondary btn-sm">Atur Profil</Link>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
        {/* left: calorie + macro */}
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card-static" style={{ padding: '24px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px', textAlign: 'center' }}>Kalori Hari Ini</h3>
            <CalorieRing consumed={intake.calories} target={data?.targetCalories || 2000} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card-static" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '14px' }}>Nutrisi Hari Ini</h3>
            {[
              { label: 'Protein', value: intake.protein, target: 60, unit: 'g', color: '#3B82F6', icon: Zap },
              { label: 'Karbohidrat', value: intake.carbs, target: 300, unit: 'g', color: '#F59E0B', icon: Flame },
              { label: 'Lemak', value: intake.fat, target: 65, unit: 'g', color: '#EF4444', icon: Award },
              { label: 'Serat', value: intake.fiber, target: 25, unit: 'g', color: '#22C55E', icon: Leaf },
            ].map(macro => {
              const pct = Math.min((macro.value / macro.target) * 100, 100)
              return (
                <div key={macro.label} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                      <macro.icon size={12} color={macro.color} /> {macro.label}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {Math.round(macro.value)}/{macro.target}{macro.unit}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-glass)', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      style={{ height: '100%', background: macro.color, borderRadius: '3px' }}
                    />
                  </div>
                </div>
              )
            })}
          </motion.div>
        </div>

        {/* right: recommendations */}
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={18} color="var(--primary)" /> Rekomendasi Untukmu
          </h3>

          {recommendations.length === 0 ? (
            <div className="empty-state">
              <Heart size={48} />
              <p style={{ marginTop: '8px' }}>Belum ada rekomendasi. Pesan makanan dulu ya!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recommendations.map((rec: any, idx: number) => (
                <motion.div key={rec.menuItem.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card"
                  style={{ padding: '20px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>
                        {rec.menuItem.name}
                      </h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        {rec.menuItem.seller?.name} — {rec.menuItem.seller?.canteen?.name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                        Rp{rec.menuItem.price.toLocaleString('id-ID')}
                      </div>
                      {rec.menuItem.calories && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                          <Flame size={12} /> {rec.menuItem.calories} kcal
                        </div>
                      )}
                    </div>
                  </div>

                  {/* reasons */}
                  {rec.reasons.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                      {rec.reasons.map((reason: string, ri: number) => (
                        <div key={ri} style={{ fontSize: '0.8rem', color: 'var(--text-accent)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ marginTop: '2px' }}>✓</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* nutrition mini bar */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {rec.menuItem.protein != null && <span>P: {rec.menuItem.protein}g</span>}
                    {rec.menuItem.carbs != null && <span>C: {rec.menuItem.carbs}g</span>}
                    {rec.menuItem.fat != null && <span>F: {rec.menuItem.fat}g</span>}
                    {rec.menuItem.fiber != null && <span>Fiber: {rec.menuItem.fiber}g</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
