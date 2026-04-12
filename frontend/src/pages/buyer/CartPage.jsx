/**
 * FarmConnect — Cart Page
 * Review cart items, adjust quantities, proceed to checkout.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { useAuth }      from '../../hooks/useAuth'
import { Button, Logo } from '../../components/ui'

function CartItem({ item, onUpdate, onRemove }) {
  const { product, quantity } = item

  return (
    <div className="card p-4 flex items-center gap-4">
      {/* Image */}
      <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            {product.category_icon || '🌾'}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-farm-dark text-sm">{product.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {product.farm_name || product.farmer_name} · {product.location}
        </p>
        <p className="text-sm font-bold text-primary-600 mt-1">
          UGX {Number(product.price).toLocaleString()} / {product.unit}
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onUpdate(product.id, quantity - 1)}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200
                     flex items-center justify-center font-bold text-gray-600
                     transition-colors"
        >
          −
        </button>
        <span className="w-8 text-center font-semibold text-sm">{quantity}</span>
        <button
          onClick={() => onUpdate(product.id, quantity + 1)}
          disabled={quantity >= product.quantity}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200
                     flex items-center justify-center font-bold text-gray-600
                     transition-colors disabled:opacity-40"
        >
          +
        </button>
      </div>

      {/* Subtotal */}
      <div className="text-right shrink-0">
        <p className="font-bold text-farm-dark text-sm">
          UGX {(Number(product.price) * quantity).toLocaleString()}
        </p>
        <button
          onClick={() => onRemove(product.id)}
          className="text-xs text-red-400 hover:text-red-600 mt-1 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  )
}

export default function CartPage() {
  const { user, logout }               = useAuth()
  const { items, updateQuantity,
          removeItem, clearCart,
          totalAmount }                = useCartStore()
  const navigate                       = useNavigate()

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4
                         flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <Link to="/buyer/products"
            className="text-sm text-gray-500 hover:text-primary-600">
            ← Continue Shopping
          </Link>
          <Button variant="secondary" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 fade-in">
        <h1 className="text-2xl font-bold text-farm-dark mb-6">
          🛒 Your Cart
          {totalItems > 0 && (
            <span className="ml-2 text-base font-normal text-gray-500">
              ({totalItems} item{totalItems !== 1 ? 's' : ''})
            </span>
          )}
        </h1>

        {items.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="text-6xl mb-4">🛒</p>
            <h2 className="text-lg font-semibold text-farm-dark">Your cart is empty</h2>
            <p className="text-gray-500 text-sm mt-2 mb-6">
              Browse fresh produce from local farmers and add items to your cart.
            </p>
            <Link to="/buyer/products">
              <Button>Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            {items.map(item => (
              <CartItem
                key={item.product.id}
                item={item}
                onUpdate={updateQuantity}
                onRemove={removeItem}
              />
            ))}

            {/* Order Summary */}
            <div className="card p-5 mt-4">
              <h3 className="font-semibold text-farm-dark mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                {items.map(item => (
                  <div key={item.product.id}
                    className="flex justify-between text-sm text-gray-600">
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>
                    <span>
                      UGX {(Number(item.product.price) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between
                              font-bold text-farm-dark text-lg">
                <span>Total</span>
                <span className="text-primary-600">
                  UGX {Number(totalAmount).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={clearCart}
                className="btn btn-secondary text-sm"
              >
                🗑 Clear Cart
              </button>
              <Button
                fullWidth
                size="lg"
                onClick={() => navigate('/buyer/checkout')}
              >
                Proceed to Checkout →
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
