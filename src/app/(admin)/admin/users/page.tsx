'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Shield, User, RefreshCw, AlertCircle } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (err) {
      console.log('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!confirm(`Yakin ingin mengubah role menjadi ${newRole}?`)) return
    
    setProcessing(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      if (res.ok) {
        loadUsers()
      } else {
        alert('Gagal mengubah role user')
      }
    } catch {
      alert('Terjadi kesalahan')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Kelola Pengguna</h1>
          <p>Daftar semua pengguna terdaftar dan pengaturan role</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadUsers}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: '300px' }} />
      ) : users.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <p style={{ marginTop: '12px' }}>Belum ada pengguna</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {users.map((user, idx) => (
            <motion.div key={user.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="glass-card-static" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '50%', 
                  background: user.role === 'ADMIN' ? 'var(--primary-light)' : 'var(--bg-glass)',
                  color: user.role === 'ADMIN' ? '#fff' : 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  {user.role === 'ADMIN' ? <Shield size={24} /> : <User size={24} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{user.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                    <span>@{user.username}</span>
                    {user.studentId && (
                      <>
                        <span>•</span>
                        <span>NIM: {user.studentId}</span>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Bergabung: {new Date(user.createdAt).toLocaleDateString('id-ID')}
                    {user.wallet && ` • Saldo: Rp${Number(user.wallet.balance).toLocaleString('id-ID')}`}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className={`badge ${user.role === 'ADMIN' ? 'badge-primary' : 'badge-neutral'}`}>
                  {user.role}
                </span>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {user.role === 'USER' ? (
                    <button 
                      className="btn btn-secondary btn-sm" 
                      disabled={processing === user.id}
                      onClick={() => handleUpdateRole(user.id, 'ADMIN')}
                    >
                      Jadikan Admin
                    </button>
                  ) : (
                    <button 
                      className="btn btn-ghost btn-sm" 
                      style={{ color: 'var(--danger)' }}
                      disabled={processing === user.id}
                      onClick={() => handleUpdateRole(user.id, 'USER')}
                    >
                      Cabut Admin
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
