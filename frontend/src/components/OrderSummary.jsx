/**
 * FarmConnect — Order Summary
 *
 * A printable/downloadable order summary used in two places:
 *  1. Buyer — shown after checkout as order confirmation
 *  2. Farmer — shown on the orders page per order
 *
 * Uses window.print() with a dedicated print stylesheet injected
 * via a <style> tag so ONLY the summary is printed, not the page UI.
 *
 * The component renders in the page normally AND as a clean
 * receipt-style document when printed.
 */
import { useRef } from 'react'

// ── Print styles injected into <head> when printing ─────────────────────────
const PRINT_STYLES = `
  @media print {
    body * { visibility: hidden !important; }
    #order-summary-print, #order-summary-print * { visibility: visible !important; }
    #order-summary-print {
      position: fixed !important;
      top: 0 !important; left: 0 !important;
      width: 100% !important;
      padding: 24px !important;
      background: white !important;
    }
    .no-print { display: none !important; }
  }
`

export default function OrderSummary({ order, mode = 'buyer' }) {
  const printRef = useRef()

  if (!order) return null

  const handlePrint = () => {
    // Inject print styles once
    if (!document.getElementById('farmconnect-print-styles')) {
      const style = document.createElement('style')
      style.id    = 'farmconnect-print-styles'
      style.innerHTML = PRINT_STYLES
      document.head.appendChild(style)
    }
    window.print()
  }

  const orderDate = new Date(order.created_at).toLocaleDateString('en-UG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const STATUS_LABELS = {
    pending:    { label: 'Pending',    color: '#D97706' },
    confirmed:  { label: 'Confirmed',  color: '#2563EB' },
    packed:     { label: 'Packed',     color: '#7C3AED' },
    dispatched: { label: 'Dispatched', color: '#EA580C' },
    delivered:  { label: 'Delivered',  color: '#16A34A' },
    cancelled:  { label: 'Cancelled',  color: '#DC2626' },
  }
  const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.pending

  return (
    <div>
      {/* ── Printable Summary ─────────────────────────────────────────────── */}
      <div id="order-summary-print" ref={printRef}
        style={{ fontFamily: 'Arial, sans-serif', maxWidth: '680px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          background: '#0D2B4E', color: 'white',
          padding: '20px 24px', borderRadius: '12px 12px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>🌾 FarmConnect</p>
            <p style={{ fontSize: '12px', color: '#93C5FD', margin: '4px 0 0' }}>
              Farmers-to-Buyers Marketplace
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '13px', fontWeight: 'bold', margin: 0 }}>
              {mode === 'buyer' ? 'ORDER CONFIRMATION' : 'ORDER RECEIVED'}
            </p>
            <p style={{ fontSize: '11px', color: '#93C5FD', margin: '4px 0 0' }}>
              Order #{order.id}
            </p>
          </div>
        </div>

        {/* Status Banner */}
        <div style={{
          background: '#F0FDF4', borderLeft: `4px solid ${statusInfo.color}`,
          padding: '12px 24px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>
            <strong>Order Status:</strong>
          </p>
          <span style={{
            background: statusInfo.color, color: 'white',
            padding: '3px 12px', borderRadius: '20px',
            fontSize: '12px', fontWeight: 'bold'
          }}>
            {statusInfo.label}
          </span>
        </div>

        {/* Order Info Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '0', border: '1px solid #E5E7EB',
          borderTop: 'none'
        }}>
          {[
            { label: 'Order Date',     value: orderDate },
            { label: 'Order Number',   value: `#${order.id}` },
            { label: mode === 'buyer' ? 'Farmer' : 'Buyer',
              value: mode === 'buyer'
                ? (order.farm_name || order.farmer_name || '—')
                : (order.buyer_name || '—') },
            { label: 'Delivery Address', value: order.delivery_address || '—' },
          ].map((row, i) => (
            <div key={i} style={{
              padding: '12px 20px',
              background: i % 2 === 0 ? '#F9FAFB' : 'white',
              borderBottom: '1px solid #E5E7EB',
              borderRight: i % 2 === 0 ? '1px solid #E5E7EB' : 'none'
            }}>
              <p style={{ margin: '0 0 2px', fontSize: '10px',
                color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {row.label}
              </p>
              <p style={{ margin: 0, fontSize: '13px',
                fontWeight: '600', color: '#111827' }}>
                {row.value}
              </p>
            </div>
          ))}
        </div>

        {/* Notes */}
        {order.notes && (
          <div style={{
            border: '1px solid #E5E7EB', borderTop: 'none',
            padding: '12px 20px', background: '#FFFBEB'
          }}>
            <p style={{ margin: '0 0 2px', fontSize: '10px',
              color: '#92400E', textTransform: 'uppercase' }}>
              Order Notes
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#78350F' }}>
              {order.notes}
            </p>
          </div>
        )}

        {/* Items Table */}
        <div style={{ border: '1px solid #E5E7EB', borderTop: 'none' }}>
          {/* Table Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr',
            background: '#1F4E79', padding: '10px 20px'
          }}>
            {['Product', 'Qty / Unit', 'Unit Price', 'Subtotal'].map(h => (
              <p key={h} style={{
                margin: 0, fontSize: '11px', fontWeight: 'bold',
                color: 'white', textTransform: 'uppercase'
              }}>
                {h}
              </p>
            ))}
          </div>

          {/* Rows */}
          {(order.items || []).map((item, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr',
              padding: '12px 20px',
              background: i % 2 === 0 ? 'white' : '#F9FAFB',
              borderTop: '1px solid #F3F4F6'
            }}>
              <p style={{ margin: 0, fontSize: '13px',
                fontWeight: '600', color: '#111827' }}>
                {item.product_name}
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>
                {item.quantity} {item.unit}
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>
                UGX {Number(item.unit_price).toLocaleString()}
              </p>
              <p style={{ margin: 0, fontSize: '13px',
                fontWeight: '600', color: '#111827' }}>
                UGX {Number(item.subtotal).toLocaleString()}
              </p>
            </div>
          ))}

          {/* Total Row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr',
            padding: '14px 20px', background: '#0D2B4E',
            borderTop: '2px solid #16A34A'
          }}>
            <p style={{ margin: 0, gridColumn: '1/4',
              fontSize: '14px', fontWeight: 'bold', color: 'white' }}>
              TOTAL AMOUNT
            </p>
            <p style={{ margin: 0, fontSize: '16px',
              fontWeight: 'bold', color: '#4ADE80' }}>
              UGX {Number(order.total_amount).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Payment Method */}
        <div style={{
          border: '1px solid #E5E7EB', borderTop: 'none',
          padding: '12px 20px', background: '#FFF7ED',
          borderRadius: '0 0 12px 12px'
        }}>
          <p style={{ margin: '0 0 2px', fontSize: '10px',
            color: '#92400E', textTransform: 'uppercase' }}>
            Payment Method
          </p>
          <p style={{ margin: 0, fontSize: '13px',
            fontWeight: '600', color: '#78350F' }}>
            💵 Cash on Delivery — Pay the farmer upon receiving your order
          </p>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '20px', padding: '16px 20px',
          background: '#F9FAFB', borderRadius: '12px',
          border: '1px solid #E5E7EB', textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px',
            color: '#374151', fontWeight: '600' }}>
            Thank you for using FarmConnect!
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF' }}>
            This is an automatically generated order summary.
            Keep this for your records. · farmconnect.app
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '10px', color: '#D1D5DB' }}>
            Printed on: {new Date().toLocaleDateString('en-UG', {
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* ── Print / Download Buttons (hidden when printing) ────────────────── */}
      <div className="no-print flex gap-3 mt-4 justify-end">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600
                     text-white rounded-xl text-sm font-medium
                     hover:bg-primary-700 transition-colors shadow-sm"
        >
          🖨️ Print Order Summary
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-farm-dark
                     text-white rounded-xl text-sm font-medium
                     hover:bg-blue-900 transition-colors shadow-sm"
        >
          💾 Save as PDF
        </button>
      </div>

      <p className="no-print text-xs text-gray-400 text-right mt-2">
        Tip: To save as PDF, choose "Save as PDF" in your browser's print dialog
      </p>
    </div>
  )
}
