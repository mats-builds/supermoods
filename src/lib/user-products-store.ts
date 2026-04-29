'use client'

import { useEffect, useState } from 'react'
import type { Product } from './types'

const PRODUCTS_KEY = 'supermoods.user-products.v1'
export const HIDDEN_KEY = 'supermoods.catalog.hidden.v1'

type Listener = () => void
const listeners = new Set<Listener>()

let products: Product[] = []
let hiddenIds: Set<string> = new Set()
let hydrated = false

function load() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(PRODUCTS_KEY)
    if (raw) products = JSON.parse(raw) as Product[]
    const h = window.localStorage.getItem(HIDDEN_KEY)
    if (h) hiddenIds = new Set(JSON.parse(h) as string[])
  } catch { /* ignore */ }
}

function hydrate() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true
  load()
}

function persist() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
  window.localStorage.setItem(HIDDEN_KEY, JSON.stringify(Array.from(hiddenIds)))
}

function emit() { listeners.forEach(l => l()) }

export const userProductsStore = {
  hydrate,
  list: () => { hydrate(); return products },
  hiddenIds: () => { hydrate(); return hiddenIds },
  isHidden: (id: string) => { hydrate(); return hiddenIds.has(id) },
  add(p: Product) {
    hydrate()
    if (products.some(x => x.id === p.id)) return false
    products = [p, ...products]
    persist(); emit(); return true
  },
  remove(id: string) {
    hydrate()
    products = products.filter(p => p.id !== id)
    persist(); emit()
  },
  update(id: string, patch: Partial<Product>) {
    hydrate()
    products = products.map(p => p.id === id ? { ...p, ...patch } : p)
    persist(); emit()
  },
  toggleHidden(id: string) {
    hydrate()
    if (hiddenIds.has(id)) hiddenIds.delete(id); else hiddenIds.add(id)
    persist(); emit()
  },
  subscribe(l: Listener) { listeners.add(l); return () => { listeners.delete(l) } },
}

export function useUserProducts() {
  const [, force] = useState(0)
  useEffect(() => {
    userProductsStore.hydrate()
    force(n => n + 1)
    const unsub = userProductsStore.subscribe(() => force(n => n + 1))
    return unsub
  }, [])
  return {
    products: userProductsStore.list(),
    hiddenIds: userProductsStore.hiddenIds(),
    add: (p: Product) => userProductsStore.add(p),
    remove: (id: string) => userProductsStore.remove(id),
    update: (id: string, patch: Partial<Product>) => userProductsStore.update(id, patch),
    toggleHidden: (id: string) => userProductsStore.toggleHidden(id),
  }
}
