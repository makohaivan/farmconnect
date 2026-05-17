/**
 * FarmConnect — useNotifications Hook
 *
 * Manages the WebSocket connection and notification state.
 * Connects on mount, reconnects if disconnected, handles all messages.
 *
 * Usage:
 *   const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { getNotifications, markRead as apiMarkRead,
         markAllRead as apiMarkAllRead,
         clearNotifications as apiClear } from '../api/notificationsApi'

export function useNotifications() {
  const accessToken = useAuthStore(s => s.accessToken)

  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [connected,     setConnected]     = useState(false)

  const wsRef         = useRef(null)
  const reconnectTimer= useRef(null)

  // ── Load initial notifications via REST ──────────────────────────────────
  const loadNotifications = useCallback(async () => {
    if (!accessToken) return
    try {
      const data = await getNotifications()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch {
      // Silently fail — notifications are not critical
    }
  }, [accessToken])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // ── WebSocket connection ──────────────────────────────────────────────────
  const connectWS = useCallback(() => {
    if (!accessToken || wsRef.current?.readyState === WebSocket.OPEN) return

    // Pass JWT token as query param since WS can't use headers
    const wsUrl = `ws://localhost:8000/ws/notifications/?token=${accessToken}`
    const ws    = new WebSocket(wsUrl)

    ws.onopen = () => {
      setConnected(true)
      // Clear any pending reconnect
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = null
      }
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'new_notification') {
          const notif = data.notification
          setNotifications(prev => [notif, ...prev])
          setUnreadCount(prev => prev + 1)

          // Browser notification (if permission granted)
          if (Notification.permission === 'granted') {
            new Notification(notif.title, {
              body: notif.message,
              icon: '/favicon.ico',
            })
          }
        }

        if (data.type === 'unread_notifications') {
          // Received on connect — merge with existing
          const incoming = data.notifications || []
          setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id))
            const newOnes     = incoming.filter(n => !existingIds.has(n.id))
            return [...newOnes, ...prev]
          })
          setUnreadCount(incoming.filter(n => !n.is_read).length)
        }

      } catch {
        // Ignore malformed messages
      }
    }

    ws.onclose = () => {
      setConnected(false)
      // Auto-reconnect after 3 seconds
      reconnectTimer.current = setTimeout(() => {
        if (accessToken) connectWS()
      }, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }

    wsRef.current = ws
  }, [accessToken])

  useEffect(() => {
    connectWS()
    return () => {
      if (wsRef.current) wsRef.current.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
  }, [connectWS])

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // ── Actions ───────────────────────────────────────────────────────────────

  const markRead = useCallback(async (id) => {
    try {
      await apiMarkRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))

      // Also tell WS server
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'mark_read', notification_id: id }))
      }
    } catch { /* silent */ }
  }, [])

  const markAllRead = useCallback(async () => {
    try {
      await apiMarkAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'mark_all_read' }))
      }
    } catch { /* silent */ }
  }, [])

  const clearAll = useCallback(async () => {
    try {
      await apiClear()
      setNotifications([])
      setUnreadCount(0)
    } catch { /* silent */ }
  }, [])

  return {
    notifications,
    unreadCount,
    connected,
    markRead,
    markAllRead,
    clearAll,
    reload: loadNotifications,
  }
}
