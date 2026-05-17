/**
 * FarmConnect — Notification Bell
 *
 * Sits in the AppLayout header. Shows a badge with unread count.
 * Clicking opens a dropdown with all notifications.
 * Uses the useNotifications hook for WebSocket + REST.
 */
import { useState, useRef, useEffect } from 'react'
import { Bell, BellOff, Check, CheckCheck, Trash2, Package,
         ShoppingCart, Truck, CheckCircle2, XCircle, X } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'

// ── Icon per notification type ────────────────────────────────────────────────
function NotifIcon({ type }) {
  const map = {
    order_placed:     { icon: ShoppingCart, color: 'text-blue-600',   bg: 'bg-blue-100' },
    order_confirmed:  { icon: CheckCircle2, color: 'text-emerald-600',bg: 'bg-emerald-100' },
    order_packed:     { icon: Package,      color: 'text-purple-600', bg: 'bg-purple-100' },
    order_dispatched: { icon: Truck,        color: 'text-orange-600', bg: 'bg-orange-100' },
    order_delivered:  { icon: CheckCircle2, color: 'text-emerald-600',bg: 'bg-emerald-100' },
    order_cancelled:  { icon: XCircle,      color: 'text-red-600',    bg: 'bg-red-100' },
  }
  const cfg = map[type] || { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100' }
  const Icon = cfg.icon

  return (
    <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center
                     justify-center shrink-0`}>
      <Icon className={`w-4.5 h-4.5 ${cfg.color}`} />
    </div>
  )
}

// ── Time display ──────────────────────────────────────────────────────────────
function TimeAgo({ dateStr }) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)

  let label = 'just now'
  if (mins  >= 1  && mins  < 60) label = `${mins}m ago`
  if (hours >= 1  && hours < 24) label = `${hours}h ago`
  if (days  >= 1)                label = `${days}d ago`

  return <span className="text-xs text-gray-400">{label}</span>
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function NotificationBell() {
  const { notifications, unreadCount, connected,
          markRead, markAllRead, clearAll } = useNotifications()

  const [open, setOpen] = useState(false)
  const ref             = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen(!open)
  }

  const handleMarkRead = (id, e) => {
    e.stopPropagation()
    markRead(id)
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className={`relative w-10 h-10 flex items-center justify-center
                    rounded-xl transition-colors ${
          open ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
        }`}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500
                           text-white text-xs rounded-full flex items-center
                           justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Connection dot */}
        <span className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full
                          border border-white ${
          connected ? 'bg-emerald-500' : 'bg-gray-400'
        }`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl
                        shadow-2xl border border-gray-100 z-50 overflow-hidden
                        animate-fade-up">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5
                          border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="badge badge-red text-xs">{unreadCount} new</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-primary-600
                             hover:text-primary-700 font-medium px-2 py-1
                             rounded-lg hover:bg-primary-50"
                  title="Mark all read">
                  <CheckCheck className="w-3.5 h-3.5" /> All read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll}
                  className="w-7 h-7 flex items-center justify-center rounded-lg
                             text-gray-400 hover:text-red-500 hover:bg-red-50"
                  title="Clear all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg
                           text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center
                                justify-center mb-3">
                  <BellOff className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">No notifications yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  You'll see order updates and alerts here
                </p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3.5 hover:bg-gray-50
                              transition-colors cursor-pointer border-b
                              border-gray-50 last:border-0 ${
                    !n.is_read ? 'bg-blue-50/40' : ''
                  }`}
                  onClick={() => !n.is_read && markRead(n.id)}
                >
                  <NotifIcon type={n.type} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${
                        !n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'
                      }`}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <div className="w-2 h-2 bg-primary-600 rounded-full
                                        shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      {n.message}
                    </p>
                    <TimeAgo dateStr={n.created_at} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer status */}
          <div className={`px-4 py-2 border-t border-gray-100 flex items-center
                          gap-1.5 text-xs ${
            connected ? 'text-emerald-600' : 'text-gray-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              connected ? 'bg-emerald-500' : 'bg-gray-400'
            }`} />
            {connected ? 'Live updates active' : 'Connecting…'}
          </div>
        </div>
      )}
    </div>
  )
}
