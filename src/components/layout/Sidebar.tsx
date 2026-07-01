'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Store, Wallet, ShoppingBag, Heart, Settings,
  LogOut, Shield, Menu, X, UtensilsCrossed, ChefHat, Users, Armchair
} from 'lucide-react'
import { useState } from 'react'

const userLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/canteens', label: 'Kantin', icon: Store },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/orders', label: 'Pesanan', icon: ShoppingBag },
  { href: '/recommendations', label: 'Rekomendasi', icon: Heart },
  { href: '/settings', label: 'Pengaturan', icon: Settings },
]

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: Shield },
  { href: '/admin/canteens', label: 'Kantin & Penjual', icon: Store },
  { href: '/admin/menu', label: 'Kelola Menu', icon: ChefHat },
  { href: '/admin/orders', label: 'Kelola Pesanan', icon: ShoppingBag },
  { href: '/admin/seats', label: 'Monitor Kursi', icon: Armchair },
  { href: '/admin/users', label: 'Pengguna', icon: Users },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin = session?.user?.role === 'ADMIN'
  const initials = session?.user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'

  return (
    <>
      {/* mobile header */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UtensilsCrossed size={22} color="var(--primary)" />
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>SCU Canteen</span>
        </div>
        <button className="btn btn-ghost" onClick={() => setMobileOpen(!mobileOpen)}
          style={{ padding: '8px' }}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* mobile overlay */}
      {mobileOpen && <div className="overlay" onClick={() => setMobileOpen(false)} />}

      {/* sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UtensilsCrossed size={24} color="var(--primary)" />
            <div>
              <h2>SCU Canteen</h2>
              <span>Soegijapranata University</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Menu</div>
          {userLinks.map(link => (
            <Link key={link.href} href={link.href}
              className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}>
              <link.icon size={18} />
              {link.label}
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="sidebar-section-title">Admin</div>
              {adminLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}>
                  <link.icon size={18} />
                  {link.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="name">{session?.user?.name || 'User'}</div>
            <div className="role">{isAdmin ? 'Administrator' : 'Mahasiswa'}</div>
          </div>
          <button className="btn btn-ghost" onClick={() => signOut({ callbackUrl: '/login' })}
            style={{ padding: '6px', marginLeft: 'auto' }} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* mobile bottom nav */}
      <nav className="mobile-bottom-nav">
        {userLinks.slice(0, 5).map(link => (
          <Link key={link.href} href={link.href}
            className={`mobile-nav-item ${pathname === link.href ? 'active' : ''}`}>
            <link.icon size={20} />
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
