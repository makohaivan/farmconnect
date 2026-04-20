/**
 * FarmConnect — AI Chat Widget
 *
 * A floating chat bubble visible on all authenticated pages.
 * Uses the Gemini-powered chatbot endpoint.
 * Context-aware: knows if user is farmer or buyer.
 *
 * How to use: just import and render <ChatWidget /> anywhere.
 * It positions itself fixed at the bottom-right of the screen.
 */
import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { sendChatMessage } from '../api/aiApi'

// ── Single message bubble ─────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center
                        justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">
          AI
        </div>
      )}
      <div className={`
        max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
        ${isUser
          ? 'bg-primary-600 text-white rounded-br-sm'
          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }
      `}>
        {msg.content}
      </div>
    </div>
  )
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex justify-start mb-2">
      <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center
                      justify-center text-white text-xs font-bold mr-2 shrink-0">
        AI
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
        {[0,1,2].map(i => (
          <div key={i}
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main Widget ───────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const user = useAuthStore(s => s.user)

  const [open,     setOpen]     = useState(false)
  const [input,    setInput]    = useState('')
  const [messages, setMessages] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  // Greet the user when they first open the chat
  useEffect(() => {
    if (open && messages.length === 0 && user) {
      const greeting = user.role === 'farmer'
        ? `Hi ${user.first_name}! 👋 I'm your FarmConnect assistant. I can help you write product descriptions, suggest prices, explain your orders, or answer any farming questions. What do you need?`
        : `Hi ${user.first_name}! 👋 I'm your FarmConnect assistant. I can help you find fresh produce, understand what's in season, or answer any questions about your orders. How can I help?`

      setMessages([{ role: 'assistant', content: greeting }])
    }
  }, [open, user])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError('')

    try {
      // Send history in the format the backend expects
      // Exclude the greeting (index 0) from history to save tokens
      const history = newMessages.slice(1, -1).map(m => ({
        role:    m.role === 'assistant' ? 'model' : 'user',
        content: m.content,
      }))

      const data = await sendChatMessage(text, history)
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Sorry, something went wrong. Please try again.'
      setError(errMsg)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ ' + errMsg
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setError('')
    // Re-trigger greeting
    if (user) {
      const greeting = user.role === 'farmer'
        ? `Hi ${user.first_name}! 👋 How can I help you today?`
        : `Hi ${user.first_name}! 👋 What can I help you find today?`
      setMessages([{ role: 'assistant', content: greeting }])
    }
  }

  // Quick suggestion chips shown when chat is empty
  const suggestions = user?.role === 'farmer' ? [
    'Help me write a product description',
    'What price should I set for tomatoes?',
    'How do I manage my orders?',
    'What should I grow this season?',
  ] : [
    "What's in season right now?",
    'How does ordering work?',
    'How do I track my order?',
    'Find me fresh vegetables',
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* ── Chat Window ────────────────────────────────────────────────────── */}
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96
                        border border-gray-200 flex flex-col overflow-hidden
                        fade-in"
          style={{ height: '480px' }}>

          {/* Header */}
          <div className="bg-farm-dark px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center
                              justify-center text-white font-bold text-sm">
                AI
              </div>
              <div>
                <p className="text-white font-semibold text-sm">FarmConnect AI</p>
                <p className="text-green-300 text-xs">
                  {user?.role === 'farmer' ? 'Farmer Assistant' : 'Buyer Assistant'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="text-gray-400 hover:text-white transition-colors text-xs"
                title="Clear chat"
              >
                🗑
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white transition-colors text-lg
                           leading-none font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && <TypingIndicator />}

            {/* Suggestion chips — shown when only greeting exists */}
            {messages.length <= 1 && !loading && (
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(s); inputRef.current?.focus() }}
                    className="text-xs bg-primary-50 text-primary-700 border
                               border-primary-200 rounded-full px-3 py-1.5
                               hover:bg-primary-100 transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2
                           text-sm outline-none focus:border-primary-400
                           resize-none leading-snug max-h-24 overflow-y-auto"
                style={{ minHeight: '38px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-9 h-9 bg-primary-600 text-white rounded-xl
                           flex items-center justify-center
                           hover:bg-primary-700 transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent
                                  rounded-full animate-spin" />
                ) : (
                  <span className="text-sm">➤</span>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-center">
              Powered by Gemini AI · Press Enter to send
            </p>
          </div>
        </div>
      )}

      {/* ── Toggle Button ───────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(!open)}
        className={`
          w-14 h-14 rounded-full shadow-lg flex items-center justify-center
          text-2xl transition-all duration-200 hover:scale-110 active:scale-95
          ${open
            ? 'bg-gray-600 text-white rotate-0'
            : 'bg-primary-600 text-white'
          }
        `}
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  )
}
