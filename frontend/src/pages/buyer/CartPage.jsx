import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react'
import AppLayout from '../../components/AppLayout'
import { useCartStore, cartTotal, cartItemCount } from '../../store/cartStore'
import { Button, EmptyState } from '../../components/ui'

function CartItem({ item, onUpdate, onRemove }) {
  const { product, quantity } = item
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="w-18 h-18 rounded-xl bg-gray-100 overflow-hidden shrink-0 w-20 h-20">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-3xl">{product.category_icon || '🌾'}</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">🌾 {product.farm_name || product.farmer_name}</p>
        <p className="text-sm font-bold text-primary-600 mt-1">
          UGX {Number(product.price).toLocaleString()} / {product.unit}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => onUpdate(product.id, quantity - 1)}
          className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center
                     justify-center text-gray-600 transition-colors">
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-8 text-center font-semibold text-sm">{quantity}</span>
        <button onClick={() => onUpdate(product.id, quantity + 1)}
          disabled={quantity >= product.quantity}
          className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center
                     justify-center text-gray-600 transition-colors disabled:opacity-40">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-gray-900 text-sm">
          UGX {(Number(product.price) * quantity).toLocaleString()}
        </p>
        <button onClick={() => onRemove(product.id)}
          className="text-gray-400 hover:text-red-500 mt-1 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore()
  const total      = useCartStore(cartTotal)
  const totalItems = useCartStore(cartItemCount)
  const navigate   = useNavigate()

  return (
    <AppLayout title="Your Cart"
      subtitle={totalItems > 0 ? `${totalItems} item${totalItems !== 1 ? 's' : ''}` : ''}>
      {items.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Your cart is empty"
          description="Browse fresh produce and add items to your cart."
          action={<Link to="/buyer/products"><Button>Browse Products</Button></Link>} />
      ) : (
        <div className="max-w-2xl space-y-4">
          {items.map(item => (
            <CartItem key={item.product.id} item={item}
              onUpdate={updateQuantity} onRemove={removeItem} />
          ))}

          {/* Summary */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 mb-4">
              {items.map(item => (
                <div key={item.product.id} className="flex justify-between text-sm text-gray-600">
                  <span>{item.product.name} × {item.quantity}</span>
                  <span>UGX {(Number(item.product.price) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between
                            font-bold text-gray-900 text-lg">
              <span>Total</span>
              <span className="text-primary-600">UGX {Number(total).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={clearCart}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                         font-semibold border border-gray-200 text-gray-600
                         hover:bg-gray-50 transition-colors">
              <Trash2 className="w-4 h-4" /> Clear Cart
            </button>
            <Button fullWidth size="lg" onClick={() => navigate('/buyer/checkout')}>
              Proceed to Checkout →
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
