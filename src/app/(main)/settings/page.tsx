'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Save, Calculator, User } from 'lucide-react'

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/health-profile').then(r => r.json()).then(data => {
      setProfile(data)
      setLoading(false)
    })
  }, [])

  const update = (field: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/health-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      setProfile(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      alert('Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="skeleton" style={{ height: '400px' }} />

  return (
    <div>
      <div className="page-header">
        <h1>Pengaturan</h1>
        <p>Atur profil kesehatan untuk rekomendasi yang lebih akurat</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* profil fisik */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card-static" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="var(--primary)" /> Profil Fisik
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label>Berat Badan (kg)</label>
              <input type="number" className="input-field" placeholder="Contoh: 65"
                value={profile.weight || ''} onChange={e => update('weight', Number(e.target.value) || null)} />
            </div>

            <div className="input-group">
              <label>Tinggi Badan (cm)</label>
              <input type="number" className="input-field" placeholder="Contoh: 170"
                value={profile.height || ''} onChange={e => update('height', Number(e.target.value) || null)} />
            </div>

            <div className="input-group">
              <label>Umur</label>
              <input type="number" className="input-field" placeholder="Contoh: 21"
                value={profile.age || ''} onChange={e => update('age', Number(e.target.value) || null)} />
            </div>

            <div className="input-group">
              <label>Jenis Kelamin</label>
              <select className="input-field" value={profile.gender || ''} onChange={e => update('gender', e.target.value || null)}>
                <option value="">Pilih...</option>
                <option value="MALE">Laki-laki</option>
                <option value="FEMALE">Perempuan</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* target & goal */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card-static" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={18} color="var(--primary)" /> Target & Aktivitas
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label>Tingkat Aktivitas</label>
              <select className="input-field" value={profile.activityLevel || 'MODERATE'}
                onChange={e => update('activityLevel', e.target.value)}>
                <option value="SEDENTARY">Sedentary (jarang olahraga)</option>
                <option value="LIGHT">Light (olahraga ringan 1-3x/minggu)</option>
                <option value="MODERATE">Moderate (olahraga 3-5x/minggu)</option>
                <option value="ACTIVE">Active (olahraga intens 6-7x/minggu)</option>
                <option value="VERY_ACTIVE">Very Active (atlet / fisik berat)</option>
              </select>
            </div>

            <div className="input-group">
              <label>Goal</label>
              <select className="input-field" value={profile.goal || 'MAINTAIN'}
                onChange={e => update('goal', e.target.value)}>
                <option value="MAINTAIN">Maintain (jaga berat badan)</option>
                <option value="LOSE">Lose Weight (turunkan berat, -500 kcal)</option>
                <option value="GAIN">Gain Weight (naikkan berat, +500 kcal)</option>
              </select>
            </div>

            <div className="divider" />

            <div className="input-group">
              <label>Custom Target Kalori Harian (opsional)</label>
              <input type="number" className="input-field" placeholder="Kosongkan untuk auto-calculate dari profil"
                value={profile.customCalorieTarget || ''}
                onChange={e => update('customCalorieTarget', Number(e.target.value) || null)} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Kalau diisi, ini akan override perhitungan otomatis dari BMR/TDEE
              </span>
            </div>

            {profile.bmr && profile.tdee && (
              <div style={{ padding: '12px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>BMR (Basal Metabolic Rate)</span>
                  <span style={{ fontWeight: 600 }}>{Math.round(profile.bmr)} kcal</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>TDEE (Total Daily Energy)</span>
                  <span style={{ fontWeight: 600 }}>{Math.round(profile.tdee)} kcal</span>
                </div>
                {profile.targetCalories && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Target Harian</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{profile.targetCalories} kcal</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* save button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}
      >
        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
          <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Profil'}
        </button>
        {saved && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.85rem' }}>
            ✓ Tersimpan!
          </motion.span>
        )}
      </motion.div>
    </div>
  )
}
