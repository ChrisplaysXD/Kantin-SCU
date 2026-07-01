'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle, RefreshCw, Plus } from 'lucide-react'

const TOPUP_AMOUNTS = [10000, 25000, 50000, 100000, 200000, 500000]

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [topupAmount, setTopupAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const res = await fetch('/api/wallet/balance')
    const data = await res.json()
    setBalance(Number(data.balance))
    setTransactions(data.transactions || [])
    setLoading(false)
  }

  const handleTopup = async () => {
    const amount = topupAmount || Number(customAmount)
    if (!amount || amount < 10000) {
      alert('Minimal top-up Rp10.000')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      const data = await res.json()

      if (data.success) {
        setBalance(Number(data.balance))
        setTopupAmount(null)
        setCustomAmount('')
        loadData()
      } else {
        alert(data.error || 'Gagal top-up')
      }
    } catch (err) {
      alert('Gagal top-up')
    } finally {
      setProcessing(false)
    }
  }

  const formatRp = (n: number) => `Rp${n.toLocaleString('id-ID')}`

  return (
    <div>
      <div className="page-header">
        <h1>Wallet</h1>
        <p>Kelola saldo dan riwayat transaksi</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* balance card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card-static"
          style={{
            padding: '32px',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(124,58,237,0.04))',
            border: '1px solid rgba(124,58,237,0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <WalletIcon size={24} color="var(--primary)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Saldo Anda</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
            {loading ? '...' : formatRp(balance)}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={loadData}>
            <RefreshCw size={14} /> Refresh
          </button>
        </motion.div>

        {/* top up card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card-static" style={{ padding: '24px' }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="var(--primary)" /> Top-up Saldo
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {TOPUP_AMOUNTS.map(amt => (
              <button key={amt}
                className={`btn ${topupAmount === amt ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => { setTopupAmount(amt); setCustomAmount('') }}
              >
                {formatRp(amt)}
              </button>
            ))}
          </div>

          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label>Atau masukkan nominal</label>
            <input
              type="number"
              className="input-field"
              placeholder="Contoh: 75000"
              value={customAmount}
              onChange={e => { setCustomAmount(e.target.value); setTopupAmount(null) }}
              min="10000"
            />
          </div>

          <button className="btn btn-primary btn-full" onClick={handleTopup}
            disabled={processing || (!topupAmount && !customAmount)}>
            {processing ? 'Memproses...' : `Top-up ${topupAmount ? formatRp(topupAmount) : customAmount ? formatRp(Number(customAmount)) : ''}`}
          </button>
        </motion.div>
      </div>

      {/* transaction history */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ marginTop: '32px' }}
      >
        <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Riwayat Transaksi</h3>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <WalletIcon size={48} />
            <p style={{ marginTop: '8px' }}>Belum ada transaksi</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {transactions.map((tx: any) => (
              <div key={tx.id} className="glass-card-static" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {tx.type === 'TOP_UP' ? (
                    <ArrowUpCircle size={20} color="var(--success)" />
                  ) : tx.type === 'REFUND' ? (
                    <RefreshCw size={20} color="var(--info)" />
                  ) : (
                    <ArrowDownCircle size={20} color="var(--danger)" />
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {tx.type === 'TOP_UP' ? 'Top-up' : tx.type === 'REFUND' ? 'Refund' : 'Pembayaran'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {tx.description || '-'} • {new Date(tx.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: tx.type === 'PAYMENT' ? 'var(--danger)' : 'var(--success)' }}>
                    {tx.type === 'PAYMENT' ? '-' : '+'}{formatRp(Number(tx.amount))}
                  </div>
                  <span className={`badge ${tx.status === 'SUCCESS' ? 'badge-success' : tx.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
