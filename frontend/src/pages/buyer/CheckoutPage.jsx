/**
 * FarmConnect — Checkout Page
 * Buyer confirms delivery address and places the order.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import { useAuth }      from '../../hooks/useAuth'
import { placeOrder }   from '../../api/ordersApi'
import { Button, Logo, Input, Alert } from '../../components/ui'

export default function CheckoutPage() {
  const { user, logout }           = useAuth()
  const { items, totalAmount,
          clearCart }              = useCartStore()
  const navigate                   = useNavigate()

  const savedAddress = user?.buyerprofile?.delivery_address || ''

  const [address, setAddress] = useState(savedAddress)
  const [notes,   setNotes]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

  // Group items by farmer so buyer can see which farmer each item comes from
  const byFarmer = items.reduce((acc, item) => {
    const key = item.product.farmer?.id || 'unknown'
    if (!acc[key]) {
      acc[key] = {
        farmer: item.product.farmer,
        items:  [],
        subtotal: 0,
      }
    }
    acc[key].items.push(item)
    acc[key].subtotal += Number(item.product.price) * item.quantity
    return acc
  }, {})

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      setError('Please enter a delivery address.')
      return
    }
    if (items.length === 0) {
      setError('Your cart is empty.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const orderData = {
        delivery_address: address,
        notes,
        items: items.map(i => ({
          product_id: i.product.id,
          quantity:   i.quantity,
          unit_price: i.product.price,
        }))
      }

      const order = await placeOrder(orderData)
      clearCart()
      navigate('/buyer/orders', {
        state: { success: true, orderId: order.id }
      })
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to place order. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">🛒</p>
          <h2 className="text-lg font-semibold text-farm-dark">Your cart is empty</h2>
          <Link to="/buyer/products" className="mt-4 inline-block">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4
                         flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <Link to="/buyer/cart"
            className="text-sm text-gray-500 hover:text-primary-600">
            ← Back to Cart
          </Link>
          <Button variant="secondary" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 fade-in">
        <h1 className="text-2xl font-bold text-farm-dark mb-6">Checkout</h1>

        {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

        {/* Order Items Summary */}
        <div className="card p-5 mb-5">
          <h2 className="font-semibold text-farm-dark mb-4">
            Order Summary ({totalItems} items)
          </h2>
          {Object.values(byFarmer).map((group, idx) => (
            <div key={idx} className="mb-4 last:mb-0">
              <p className="text-xs font-semibold text-gray-500 uppercase
                            tracking-wide mb-2">
                🌾 {group.farmer?.farm_name || group.farmer?.first_name || 'Farmer'}
                {group.farmer?.location && ` · ${group.farmer.location}`}
              </p>
              {group.items.map(item => (
                <div key={item.product.id}
                  className="flex justify-between items-center py-2
                             border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {item.product.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name}
                          className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">
                          {item.product.category_icon || '🌾'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.product.name}</p>
                      <p className="text-xs text-gray-400">
                        {item.quantity} {item.product.unit} ×
                        UGX {Number(item.product.price).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-gray-700">
                    UGX {(Number(item.product.price) * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
              <div className="flex justify-between text-sm font-medium
                              text-gray-600 pt-2">
                <span>Subtotal from {group.farmer?.farm_name || 'this farmer'}</span>
                <span>UGX {group.subtotal.toLocaleString()}</span>
              </div>
            </div>
          ))}

          {/* Grand Total */}
          <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between
                          text-lg font-bold text-farm-dark">
            <span>Grand Total</span>
            <span className="text-primary-600">
              UGX {Number(totalAmount).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="card p-5 mb-5">
          <h2 className="font-semibold text-farm-dark mb-4">Delivery Details</h2>

          <div className="space-y-1 mb-4">
            <label className="label">
              Delivery Address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="input h-24 resize-none"
              placeholder="Enter your full delivery address e.g. Plot 23, Kampala Road, Wakiso"
            />
            {savedAddress && (
              <p className="text-xs text-gray-400">
                Using your saved address. You can change it above.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="label">Order Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input h-16 resize-none"
              placeholder="Any special instructions for the farmer e.g. Call on arrival"
            />
          </div>
        </div>

        {/* Payment note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5">
          <p className="text-sm text-yellow-800">
            <strong>💳 Payment:</strong> Cash on delivery. Pay the farmer when you
            receive your order. Payment gateway coming soon.
          </p>
        </div>

        {/* Place Order */}
        <Button
          fullWidth
          size="lg"
          loading={loading}
          onClick={handlePlaceOrder}
        >
          {loading ? 'Placing Order...' : `Place Order · UGX ${Number(totalAmount).toLocaleString()}`}
        </Button>
      </main>
    </div>
  )
}
