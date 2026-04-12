/**
 * FarmConnect — Auth Store (Zustand)
 *
 * This is the global authentication state for the entire frontend.
 * Any component can read from or write to this store without prop drilling.
 *
 * What it stores:
 * - user:        the current user object (null if logged out)
 * - accessToken: the JWT access token (null if logged out)
 * - isLoading:   true while we check if the user is already logged in on app load
 *
 * Why Zustand instead of React Context?
 * - No Provider wrapper needed — just import and use anywhere
 * - No re-render of the entire tree when state changes
 * - Works outside React components (e.g. in the Axios interceptor)
 * - Less boilerplate than Redux
 */
import { create } from 'zustand'

export const useAuthStore = create((set, get) => ({
  // ── State ───────────────────────────────────────────────────
  user:        null,
  accessToken: null,
  isLoading:   true,   // true on first load until we verify auth status

  // ── Computed (derived values) ────────────────────────────────
  get isLoggedIn()  { return !!get().accessToken },
  get isFarmer()    { return get().user?.role === 'farmer' },
  get isBuyer()     { return get().user?.role === 'buyer' },

  // ── Actions ──────────────────────────────────────────────────

  /**
   * Called after successful login or registration.
   * Stores the user and access token.
   */
  setAuth: (user, accessToken) => set({
    user,
    accessToken,
    isLoading: false,
  }),

  /**
   * Called on logout or when the session expires.
   * Clears all auth state.
   */
  clearAuth: () => set({
    user:        null,
    accessToken: null,
    isLoading:   false,
  }),

  /**
   * Called when we finish the initial auth check on app load.
   * Sets isLoading to false regardless of result.
   */
  setLoading: (isLoading) => set({ isLoading }),

  /**
   * Update the stored user object (e.g. after profile update).
   */
  updateUser: (updatedUser) => set({ user: updatedUser }),
}))
