import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SCU Canteen — Digital Canteen Platform',
  description: 'Platform kantin digital Soegijapranata Catholic University. Pesan makanan, top-up saldo, dan dapatkan rekomendasi makanan sehat.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
