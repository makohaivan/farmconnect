/**
 * FarmConnect — Cart Store (Zustand)
 *
 * Uses Zustand persist middleware so the cart survives page refreshes.
 * Items are saved to localStorage automatically.
 *
 * NOTE: Zustand does not support getters on the state object.
 * Computed values (totalItems, totalAmount) are derived inside
 * each component using useCartStore(state => ...) selectors.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],  // Array of { product, quantity }

      // ── Add item (or increase qty if already exists) ──────────────────────
      addItem: (product, quantity = 1) => {
        const existing = get().items.find(i => i.product.id === product.id)
        if (existing) {
          set({
            items: get().items.map(i =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            )
          })
        } else {
          set({ items: [...get().items, { product, quantity }] })
        }
      },

      // ── Update quantity (removes item if qty goes to 0) ───────────────────
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter(i => i.product.id !== productId) })
          return
        }
        set({
          items: get().items.map(i =>
            i.product.id === productId ? { ...i, quantity } : i
          )
        })
      },

      // ── Remove a single item ──────────────────────────────────────────────
      removeItem: (productId) => {
        set({ items: get().items.filter(i => i.product.id !== productId) })
      },

      // ── Clear everything ──────────────────────────────────────────────────
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'farmconnect-cart',  // localStorage key
    }
  )
)

// ── Selector helpers — use these in components ────────────────────────────
// Usage: const total = useCartStore(cartTotal)
export const cartTotal      = s => s.items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0)
export const cartItemCount  = s => s.items.reduce((sum, i) => sum + i.quantity, 0)
