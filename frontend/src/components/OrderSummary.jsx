/**
 * FarmConnect — Order Summary (Printable)
 *
 * Two uses:
 *  1. Inline on checkout confirmation page (buyer) — renders on page + print button
 *  2. Per-order print button on farmer/buyer orders pages — opens print window
 *
 * The core fix: instead of using CSS visibility tricks with a hidden div,
 * we build the HTML as a string and open it in a NEW window for printing.
 * This is 100% reliable across all browsers — the new window contains ONLY
 * the order summary, so window.print() always prints exactly the right thing.
 */

// ── Build the print HTML string ───────────────────────────────────────────────
// This is a standalone HTML document that gets opened in a new window.
export function buildOrderHTML(order, mode = 'buyer') {
  const STATUS_LABELS = {
    pending:    { label: 'Pending',    color: '#D97706' },
    confirmed:  { label: 'Confirmed',  color: '#2563EB' },
    packed:     { label: 'Packed',     color: '#7C3AED' },
    dispatched: { label: 'Dispatched', color: '#EA580C' },
    delivered:  { label: 'Delivered',  color: '#16A34A' },
    cancelled:  { label: 'Cancelled',  color: '#DC2626' },
  }

  const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.pending

  const orderDate = new Date(order.created_at).toLocaleDateString('en-UG', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const printedAt = new Date().toLocaleDateString('en-UG', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const itemRows = (order.items || []).map((item, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'}">
      <td style="padding:12px 16px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6">
        ${item.product_name}
      </td>
      <td style="padding:12px 16px;color:#374151;border-bottom:1px solid #f3f4f6">
        ${item.quantity} ${item.unit}
      </td>
      <td style="padding:12px 16px;color:#374151;border-bottom:1px solid #f3f4f6">
        UGX ${Number(item.unit_price).toLocaleString()}
      </td>
      <td style="padding:12px 16px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6">
        UGX ${Number(item.subtotal).toLocaleString()}
      </td>
    </tr>
  `).join('')

  const counterpartyLabel = mode === 'buyer' ? 'Farmer' : 'Buyer'
  const counterpartyValue = mode === 'buyer'
    ? (order.farm_name || order.farmer_name || '—')
    : (order.buyer_name || '—')

  const notesRow = order.notes ? `
    <div style="border:1px solid #e5e7eb;border-top:none;padding:12px 20px;background:#fffbeb">
      <p style="margin:0 0 2px;font-size:10px;color:#92400e;text-transform:uppercase;
                letter-spacing:0.5px">Order Notes</p>
      <p style="margin:0;font-size:13px;color:#78350f">${order.notes}</p>
    </div>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order #${order.id} — FarmConnect</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      background: #f3f4f6;
      padding: 32px 16px;
      color: #111827;
    }
    .wrapper {
      max-width: 700px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    table { border-collapse: collapse; width: 100%; }
    @media print {
      body { background: white; padding: 0; }
      .wrapper { box-shadow: none; border-radius: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
<div class="wrapper">

  <!-- Header -->
  <div style="background:#0d2b4e;color:white;padding:20px 24px;
              display:flex;justify-content:space-between;align-items:center">
    <div>
      <p style="font-size:22px;font-weight:bold">&#127807; FarmConnect</p>
      <p style="font-size:12px;color:#93c5fd;margin-top:4px">
        Farmers-to-Buyers Marketplace
      </p>
    </div>
    <div style="text-align:right">
      <p style="font-size:13px;font-weight:bold">
        ${mode === 'buyer' ? 'ORDER CONFIRMATION' : 'ORDER RECEIVED'}
      </p>
      <p style="font-size:11px;color:#93c5fd;margin-top:4px">Order #${order.id}</p>
    </div>
  </div>

  <!-- Status Banner -->
  <div style="background:#f0fdf4;border-left:4px solid ${statusInfo.color};
              padding:12px 24px;display:flex;justify-content:space-between;
              align-items:center">
    <p style="font-size:13px;color:#374151"><strong>Order Status:</strong></p>
    <span style="background:${statusInfo.color};color:white;padding:3px 14px;
                 border-radius:20px;font-size:12px;font-weight:bold">
      ${statusInfo.label}
    </span>
  </div>

  <!-- Info Grid -->
  <table style="border:1px solid #e5e7eb;border-top:none">
    <tr>
      <td style="padding:12px 20px;background:#f9fafb;border-bottom:1px solid #e5e7eb;
                 border-right:1px solid #e5e7eb;width:50%">
        <p style="font-size:10px;color:#6b7280;text-transform:uppercase;
                  letter-spacing:0.5px;margin-bottom:2px">Order Date</p>
        <p style="font-size:13px;font-weight:600">${orderDate}</p>
      </td>
      <td style="padding:12px 20px;background:white;border-bottom:1px solid #e5e7eb;
                 width:50%">
        <p style="font-size:10px;color:#6b7280;text-transform:uppercase;
                  letter-spacing:0.5px;margin-bottom:2px">Order Number</p>
        <p style="font-size:13px;font-weight:600">#${order.id}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 20px;background:#f9fafb;border-bottom:1px solid #e5e7eb;
                 border-right:1px solid #e5e7eb">
        <p style="font-size:10px;color:#6b7280;text-transform:uppercase;
                  letter-spacing:0.5px;margin-bottom:2px">${counterpartyLabel}</p>
        <p style="font-size:13px;font-weight:600">${counterpartyValue}</p>
      </td>
      <td style="padding:12px 20px;background:white;border-bottom:1px solid #e5e7eb">
        <p style="font-size:10px;color:#6b7280;text-transform:uppercase;
                  letter-spacing:0.5px;margin-bottom:2px">Delivery Address</p>
        <p style="font-size:13px;font-weight:600">${order.delivery_address || '—'}</p>
      </td>
    </tr>
  </table>

  ${notesRow}

  <!-- Items Table -->
  <table style="border:1px solid #e5e7eb;border-top:none">
    <thead>
      <tr style="background:#1f4e79">
        <th style="padding:10px 16px;color:white;font-size:11px;
                   text-transform:uppercase;text-align:left">Product</th>
        <th style="padding:10px 16px;color:white;font-size:11px;
                   text-transform:uppercase;text-align:left">Qty / Unit</th>
        <th style="padding:10px 16px;color:white;font-size:11px;
                   text-transform:uppercase;text-align:left">Unit Price</th>
        <th style="padding:10px 16px;color:white;font-size:11px;
                   text-transform:uppercase;text-align:left">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows || '<tr><td colspan="4" style="padding:16px;text-align:center;color:#9ca3af">No items</td></tr>'}
    </tbody>
    <tfoot>
      <tr style="background:#0d2b4e;border-top:2px solid #16a34a">
        <td colspan="3" style="padding:14px 16px;font-size:14px;
                                font-weight:bold;color:white">
          TOTAL AMOUNT
        </td>
        <td style="padding:14px 16px;font-size:16px;
                   font-weight:bold;color:#4ade80">
          UGX ${Number(order.total_amount).toLocaleString()}
        </td>
      </tr>
    </tfoot>
  </table>

  <!-- Payment Method -->
  <div style="border:1px solid #e5e7eb;border-top:none;padding:12px 20px;
              background:#fff7ed">
    <p style="font-size:10px;color:#92400e;text-transform:uppercase;
              letter-spacing:0.5px;margin-bottom:2px">Payment Method</p>
    <p style="font-size:13px;font-weight:600;color:#78350f">
      &#128181; Cash on Delivery — Pay the farmer upon receiving your order
    </p>
  </div>

  <!-- Footer -->
  <div style="padding:16px 20px;background:#f9fafb;text-align:center;
              border-top:1px solid #e5e7eb">
    <p style="font-size:13px;font-weight:600;color:#374151">
      Thank you for using FarmConnect!
    </p>
    <p style="font-size:11px;color:#9ca3af;margin-top:4px">
      This is an automatically generated order summary. Keep for your records.
    </p>
    <p style="font-size:10px;color:#d1d5db;margin-top:8px">
      Printed on: ${printedAt}
    </p>
  </div>

  <!-- Print Button (hidden when printing) -->
  <div class="no-print" style="padding:16px 20px;background:white;
              border-top:1px solid #e5e7eb;display:flex;gap:12px;
              justify-content:flex-end">
    <button onclick="window.print()"
      style="padding:10px 24px;background:#16a34a;color:white;border:none;
             border-radius:10px;font-size:13px;font-weight:600;cursor:pointer">
      🖨️ Print
    </button>
    <button onclick="window.print()"
      style="padding:10px 24px;background:#0d2b4e;color:white;border:none;
             border-radius:10px;font-size:13px;font-weight:600;cursor:pointer">
      💾 Save as PDF
    </button>
  </div>

</div>
</body>
</html>`
}


// ── Helper: open print window ─────────────────────────────────────────────────
export function printOrder(order, mode = 'buyer') {
  const html       = buildOrderHTML(order, mode)
  const printWin   = window.open('', '_blank', 'width=800,height=700')

  if (!printWin) {
    alert('Please allow popups for this site to print order summaries.')
    return
  }

  printWin.document.write(html)
  printWin.document.close()

  // Auto-trigger print dialog after the page loads
  printWin.onload = () => {
    printWin.focus()
    printWin.print()
  }
}


// ── Inline component (used on checkout confirmation page) ─────────────────────
export default function OrderSummary({ order, mode = 'buyer' }) {
  if (!order) return null

  const STATUS_LABELS = {
    pending:    { label: 'Pending',    color: '#D97706' },
    confirmed:  { label: 'Confirmed',  color: '#2563EB' },
    packed:     { label: 'Packed',     color: '#7C3AED' },
    dispatched: { label: 'Dispatched', color: '#EA580C' },
    delivered:  { label: 'Delivered',  color: '#16A34A' },
    cancelled:  { label: 'Cancelled',  color: '#DC2626' },
  }

  const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.pending

  const orderDate = new Date(order.created_at).toLocaleDateString('en-UG', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const counterpartyLabel = mode === 'buyer' ? 'Farmer' : 'Buyer'
  const counterpartyValue = mode === 'buyer'
    ? (order.farm_name || order.farmer_name || '—')
    : (order.buyer_name || '—')

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '680px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        background: '#0D2B4E', color: 'white',
        padding: '20px 24px', borderRadius: '12px 12px 0 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>
            🌾 FarmConnect
          </p>
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

      {/* Status */}
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

      {/* Info Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        border: '1px solid #E5E7EB', borderTop: 'none'
      }}>
        {[
          { label: 'Order Date',        value: orderDate },
          { label: 'Order Number',      value: `#${order.id}` },
          { label: counterpartyLabel,   value: counterpartyValue },
          { label: 'Delivery Address',  value: order.delivery_address || '—' },
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
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#111827' }}>
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
            color: '#92400E', textTransform: 'uppercase' }}>Order Notes</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#78350F' }}>
            {order.notes}
          </p>
        </div>
      )}

      {/* Items Table */}
      <div style={{ border: '1px solid #E5E7EB', borderTop: 'none' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr',
          background: '#1F4E79', padding: '10px 20px'
        }}>
          {['Product', 'Qty / Unit', 'Unit Price', 'Subtotal'].map(h => (
            <p key={h} style={{ margin: 0, fontSize: '11px',
              fontWeight: 'bold', color: 'white', textTransform: 'uppercase' }}>
              {h}
            </p>
          ))}
        </div>

        {(order.items || []).map((item, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr',
            padding: '12px 20px',
            background: i % 2 === 0 ? 'white' : '#F9FAFB',
            borderTop: '1px solid #F3F4F6'
          }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#111827' }}>
              {item.product_name}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>
              {item.quantity} {item.unit}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>
              UGX {Number(item.unit_price).toLocaleString()}
            </p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#111827' }}>
              UGX {Number(item.subtotal).toLocaleString()}
            </p>
          </div>
        ))}

        {/* Total */}
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

      {/* Payment */}
      <div style={{
        border: '1px solid #E5E7EB', borderTop: 'none',
        padding: '12px 20px', background: '#FFF7ED',
        borderRadius: '0 0 12px 12px'
      }}>
        <p style={{ margin: '0 0 2px', fontSize: '10px',
          color: '#92400E', textTransform: 'uppercase' }}>Payment Method</p>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#78350F' }}>
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
          Automatically generated order summary · farmconnect.app
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '10px', color: '#D1D5DB' }}>
          Printed on: {new Date().toLocaleDateString('en-UG', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })}
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-4 justify-end">
        <button
          onClick={() => printOrder(order, mode)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600
                     text-white rounded-xl text-sm font-medium
                     hover:bg-primary-700 transition-colors shadow-sm"
        >
          🖨️ Print Order Summary
        </button>
        <button
          onClick={() => printOrder(order, mode)}
          className="flex items-center gap-2 px-5 py-2.5 bg-farm-dark
                     text-white rounded-xl text-sm font-medium
                     hover:bg-blue-900 transition-colors shadow-sm"
        >
          💾 Save as PDF
        </button>
      </div>
      <p className="text-xs text-gray-400 text-right mt-2">
        Tip: In the print dialog, choose "Save as PDF" to download
      </p>
    </div>
  )
}
