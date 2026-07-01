'use client'

import { useState, useCallback } from 'react'
import type { CartItem } from '@/types'

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.menuItemId === item.menuItemId)
      if (existing) {
        return prev.map(i =>
          i.menuItemId === item.menuItemId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((menuItemId: string) => {
    setItems(prev => prev.filter(i => i.menuItemId !== menuItemId))
  }, [])

  const updateQuantity = useCallback((menuItemId: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.menuItemId !== menuItemId))
      return
    }
    setItems(prev => prev.map(i =>
      i.menuItemId === menuItemId ? { ...i, quantity: qty } : i
    ))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const totalCalories = items.reduce((sum, i) => sum + (i.calories ?? 0) * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return { items, addItem, removeItem, updateQuantity, clearCart, total, totalCalories, itemCount }
}
