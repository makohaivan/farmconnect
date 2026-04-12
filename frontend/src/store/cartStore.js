/**
 * FarmConnect — Cart Store (Zustand)
 *
 * Manages the shopping cart entirely on the frontend.
 * Cart items are stored in memory (and localStorage for persistence).
 * When the buyer checks out, the cart is sent to the backend as one order.
 *
 * Each cart item has:
 *   { product, quantity }
 *
 * We store the full product object so we can show name, price, image
 * without extra API calls.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],   // Array of { product, quantity }

      // ── Add to cart ───────────────────────────────────────────────────────
      // If product already in cart, increase quantity
      addItem: (product, quantity = 1) => {
        const items    = get().items
        const existing = items.find(i => i.product.id === product.id)

        if (existing) {
          set({
            items: items.map(i =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            )
          })
        } else {
          set({ items: [...items, { product, quantity }] })
        }
      },

      // ── Update quantity of a specific item ────────────────────────────────
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map(i =>
            i.product.id === productId ? { ...i, quantity } : i
          )
        })
      },

      // ── Remove one item ───────────────────────────────────────────────────
      removeItem: (productId) => {
        set({ items: get().items.filter(i => i.product.id !== productId) })
      },

      // ── Clear entire cart ─────────────────────────────────────────────────
      clearCart: () => set({ items: [] }),

      // ── Computed values ───────────────────────────────────────────────────
      get totalItems() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      get totalAmount() {
        return get().items.reduce(
          (sum, i) => sum + Number(i.product.price) * i.quantity, 0
        )
      },
    }),
    {
      name: 'farmconnect-cart',   // localStorage key
    }
  )
)
