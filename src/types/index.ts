import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      role: 'USER' | 'ADMIN'
      studentId: string | null
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: 'USER' | 'ADMIN'
    studentId: string | null
  }
}


export interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  sellerId: string
  sellerName: string
  calories: number | null
}

export interface BusynessData {
  level: 'SEPI' | 'RAMAI' | 'SANGAT_RAMAI'
  ordersToday: number
  ordersLastHour: number
  label: string
  color: string
}
