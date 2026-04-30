'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { selectionStore } from '@/lib/selection-store'
import { userProductsStore } from '@/lib/user-products-store'

/**
 * Renders nothing. Mounts once in the layout.
 * — On login: pulls cloud board + products into the local stores.
 * — While logged in: auto-saves any selection change to Supabase (2 s debounce).
 * — On product add/remove: saves immediately via a separate listener.
 */
export default function AccountSync() {
  const { user } = useAuth()
  const syncedUser = useRef<string | null>(null)
  const boardTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // ── Load cloud state when a user logs in (once per session) ──────
  useEffect(() => {
    if (!user || syncedUser.current === user.id) return
    syncedUser.current = user.id
    const supabase = createClient()

    // Board state
    supabase
      .from('user_boards')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        if (data.product_ids?.length > 0) {
          selectionStore.clear()
          ;(data.product_ids as string[]).forEach(id => selectionStore.toggle(id))
        }
        if (data.palette_id) selectionStore.setPaletteId(data.palette_id as string)
        if (data.scene_id) selectionStore.setSceneId(data.scene_id as string)
        if (data.layout) {
          Object.entries(data.layout as Record<string, object>).forEach(([id, override]) =>
            selectionStore.setLayoutFor(id, override as any)
          )
        }
      })

    // Imported products
    supabase
      .from('user_products')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.products?.length) return
        const localIds = new Set(userProductsStore.list().map(p => p.id))
        ;(data.products as any[]).forEach(p => {
          if (!localIds.has(p.id)) userProductsStore.add(p)
        })
      })
  }, [user])

  // Reset on logout
  useEffect(() => {
    if (!user) syncedUser.current = null
  }, [user])

  // ── Auto-save board state (debounced 2 s) ────────────────────────
  useEffect(() => {
    if (!user) return
    const unsub = selectionStore.subscribe(() => {
      clearTimeout(boardTimer.current)
      boardTimer.current = setTimeout(async () => {
        const supabase = createClient()
        await supabase.from('user_boards').upsert(
          {
            user_id: user.id,
            product_ids: selectionStore.list(),
            palette_id: selectionStore.getPaletteId(),
            scene_id: selectionStore.getSceneId(),
            layout: selectionStore.getLayout(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
      }, 2000)
    })
    return () => {
      unsub()
      clearTimeout(boardTimer.current)
    }
  }, [user])

  // ── Save products whenever they change ───────────────────────────
  useEffect(() => {
    if (!user) return
    const unsub = userProductsStore.subscribe(async () => {
      const supabase = createClient()
      await supabase.from('user_products').upsert(
        {
          user_id: user.id,
          products: userProductsStore.list(),
          hidden_ids: Array.from(userProductsStore.hiddenIds()),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    })
    return unsub
  }, [user])

  return null
}
