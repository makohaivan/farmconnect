/**
 * FarmConnect — Checkout Page
 *
 * Two states:
 *  1. CHECKOUT FORM — buyer reviews order and enters delivery address
 *  2. ORDER CONFIRMED — order placed, shows printable order summary
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore, cartTotal, cartItemCount } from '../../store/cartStore'
import { useAuth }      from '../../hooks/useAuth'
import { placeOrder }   from '../../api/ordersApi'
import { Button, Logo, Alert } from '../../components/ui'
import OrderSummary from '../../components/OrderSummary'

export default function CheckoutPage() {
  const { user, logout }  = useAuth()
  const { items, clearCart } = useCartStore()
  const total             = useCartStore(cartTotal)
  const totalItems        = useCartStore(cartItemCount)
  const navigate          = useNavigate()

  const [address,   setAddress]   = useState(user?.buyerprofile?.delivery_address || '')
  const [notes,     setNotes]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [confirmedOrder, setConfirmedOrder] = useState(null)  // set after order placed

  // Group items by farmer for the summary
  const byFarmer = items.reduce((acc, item) => {
    const fid = item.product.farmer?.id || 'unknown'
    if (!acc[fid]) acc[fid] = { farmer: item.product.farmer, items: [], subtotal: 0 }
    acc[fid].items.push(item)
    acc[fid].subtotal += Number(item.product.price) * item.quantity
    return acc
  }, {})

  const handlePlaceOrder = async () => {
    if (!address.trim()) { setError('Please enter a delivery address.'); return }
    if (items.length === 0) { setError('Your cart is empty.'); return }

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
      setConfirmedOrder(order)   // switch to confirmation view
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

  // ── STATE 2: Order confirmed — show printable summary ─────────────────────
  if (confirmedOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4
                           flex items-center justify-between no-print">
          <Logo />
          <div className="flex items-center gap-3">
            <Link to="/buyer/orders"
              className="text-sm text-primary-600 hover:underline font-medium">
              View All Orders
            </Link>
            <Button variant="secondary" size="sm" onClick={logout}>Sign out</Button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-8 fade-in">
          {/* Success banner */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5
                          flex items-center gap-4 mb-6 no-print">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center
                            justify-center text-2xl shrink-0">
              🎉
            </div>
            <div>
              <h1 className="font-bold text-green-800 text-lg">Order Placed Successfully!</h1>
              <p className="text-green-700 text-sm mt-0.5">
                Your order has been sent to the farmer. Print or save the summary below
                for your records.
              </p>
            </div>
          </div>

          {/* Printable order summary */}
          <OrderSummary order={confirmedOrder} mode="buyer" />

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6 no-print">
            <Link to="/buyer/products" className="flex-1">
              <Button variant="secondary" fullWidth>Continue Shopping</Button>
            </Link>
            <Link to="/buyer/orders" className="flex-1">
              <Button fullWidth>View My Orders</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // ── STATE 1: Checkout form ────────────────────────────────────────────────
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

        {/* Order Items */}
        <div className="card p-5 mb-5">
          <h2 className="font-semibold text-farm-dark mb-4">
            Order Summary
            <span className="font-normal text-gray-500 text-sm ml-2">
              ({totalItems} item{totalItems !== 1 ? 's' : ''})
            </span>
          </h2>

          {Object.values(byFarmer).map((group, idx) => (
            <div key={idx} className="mb-5 last:mb-0">
              {/* Farmer header */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <span className="text-lg">🌾</span>
                <div>
                  <p className="text-sm font-semibold text-farm-dark">
                    {group.farmer?.farm_name || group.farmer?.first_name || 'Farmer'}
                  </p>
                  {group.farmer?.location && (
                    <p className="text-xs text-gray-400">📍 {group.farmer.location}</p>
                  )}
                </div>
              </div>

              {/* Items */}
              {group.items.map(item => (
                <div key={item.product.id}
                  className="flex items-center gap-3 py-2.5 border-b
                             border-gray-50 last:border-0">
                  {/* Image */}
                  <div className="w-12 h-12 rounded-lg bg-gray-100
                                  overflow-hidden shrink-0">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.name}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center
                                      justify-center text-xl">
                        {item.product.category_icon || '🌾'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.quantity} {item.product.unit} ×
                      UGX {Number(item.product.price).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 shrink-0">
                    UGX {(Number(item.product.price) * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}

              {/* Farmer subtotal */}
              <div className="flex justify-between text-sm text-gray-500
                              pt-2 mt-1">
                <span>Subtotal</span>
                <span className="font-medium">
                  UGX {group.subtotal.toLocaleString()}
                </span>
              </div>
            </div>
          ))}

          {/* Grand Total */}
          <div className="border-t-2 border-gray-200 mt-4 pt-4
                          flex justify-between">
            <span className="font-bold text-farm-dark text-lg">Grand Total</span>
            <span className="font-bold text-primary-600 text-xl">
              UGX {Number(total).toLocaleString()}
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
              placeholder="Enter your full delivery address
e.g. Plot 23, Kampala Road, Wakiso District"
            />
          </div>

          <div className="space-y-1">
            <label className="label">Order Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input h-16 resize-none"
              placeholder="Any special instructions e.g. Call on arrival, morning delivery preferred"
            />
          </div>
        </div>

        {/* Payment note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl
                        p-4 mb-5 flex items-start gap-3">
          <span className="text-2xl shrink-0">💵</span>
          <div>
            <p className="text-sm font-semibold text-yellow-800">
              Cash on Delivery
            </p>
            <p className="text-xs text-yellow-700 mt-0.5">
              Pay the farmer directly when you receive your order.
              An order summary will be generated for both you and the farmer.
            </p>
          </div>
        </div>

        {/* Place Order */}
        <Button
          fullWidth
          size="lg"
          loading={loading}
          onClick={handlePlaceOrder}
        >
          {loading
            ? 'Placing Order...'
            : `Place Order · UGX ${Number(total).toLocaleString()}`}
        </Button>
      </main>
    </div>
  )
}
