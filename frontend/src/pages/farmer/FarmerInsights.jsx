/**
 * FarmConnect — Farmer AI Insights Page
 * AI-generated plain-English analysis of sales performance.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getFarmerInsights } from '../../api/aiApi'
import { Button, Logo, Spinner, Alert } from '../../components/ui'

export default function FarmerInsights() {
  const { user, logout } = useAuth()

  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)
  const [error,     setError]     = useState('')

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const res = await getFarmerInsights()
      setData(res)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load insights.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  // Split insights into paragraphs for better display
  const paragraphs = data?.insights
    ? data.insights.split('\n').filter(p => p.trim().length > 0)
    : []

  const paragraphLabels = [
    { icon: '📊', label: 'Performance Overview' },
    { icon: '✅', label: 'What Is Working' },
    { icon: '💡', label: 'Your Action Tip' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4
                         flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <Link to="/farmer/dashboard"
            className="text-sm text-gray-500 hover:text-primary-600">
            ← Dashboard
          </Link>
          <Button variant="secondary" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 fade-in">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-farm-dark flex items-center gap-2">
              ✨ AI Insights
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              AI-powered analysis of your sales performance — last 30 days
            </p>
          </div>
          {data && (
            <Button
              variant="secondary"
              size="sm"
              loading={refreshing}
              onClick={() => load(true)}
            >
              {refreshing ? 'Refreshing...' : '🔄 Refresh'}
            </Button>
          )}
        </div>

        {error && <div className="mb-6"><Alert type="error" message={error} /></div>}

        {loading ? (
          <div className="card p-16 text-center">
            <div className="flex justify-center mb-4">
              <Spinner size="lg" color="green" />
            </div>
            <p className="text-gray-500 text-sm">
              AI is analysing your sales data...
            </p>
          </div>
        ) : data ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Orders',  value: data.data?.total_orders,   icon: '📋', color: 'bg-blue-50 text-blue-700' },
                { label: 'Revenue',       value: `UGX ${Number(data.data?.total_revenue || 0).toLocaleString()}`, icon: '💰', color: 'bg-green-50 text-green-700' },
                { label: 'Delivered',     value: data.data?.delivered,      icon: '🎉', color: 'bg-emerald-50 text-emerald-700' },
                { label: 'Pending',       value: data.data?.pending,        icon: '🕐', color: 'bg-yellow-50 text-yellow-700' },
                { label: 'Cancelled',     value: data.data?.cancelled,      icon: '❌', color: 'bg-red-50 text-red-700' },
                { label: 'Active Listings',value: data.data?.total_products, icon: '📦', color: 'bg-purple-50 text-purple-700' },
              ].map(s => (
                <div key={s.label} className="card p-4">
                  <div className={`w-9 h-9 rounded-lg ${s.color}
                                   flex items-center justify-center text-lg mb-2`}>
                    {s.icon}
                  </div>
                  <p className="text-xl font-bold text-farm-dark">{s.value ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Top Products */}
            {data.data?.top_products?.length > 0 && (
              <div className="card p-5 mb-6">
                <h3 className="font-semibold text-farm-dark mb-3 flex items-center gap-2">
                  🏆 Top Selling Products
                </h3>
                <div className="space-y-2">
                  {data.data.top_products.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-primary-100 text-primary-700
                                       rounded-full flex items-center justify-center
                                       text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-700">{p}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Low Stock Warning */}
            {data.data?.low_stock?.length > 0 && (
              <div className="bg-orange-50 border border-orange-200
                              rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                  ⚠️ Running Low on Stock
                </h3>
                <div className="space-y-1">
                  {data.data.low_stock.map((item, i) => (
                    <p key={i} className="text-sm text-orange-700">• {item}</p>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights Paragraphs */}
            <div className="card overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-farm-dark to-blue-900
                              px-5 py-4 flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="text-white font-semibold">AI Performance Analysis</p>
                  <p className="text-blue-300 text-xs">
                    Powered by Google Gemini — Generated{' '}
                    {data.generated_at
                      ? new Date(data.generated_at).toLocaleDateString('en-UG', {
                          day: 'numeric', month: 'short',
                          hour: '2-digit', minute: '2-digit'
                        })
                      : 'just now'}
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {paragraphs.map((para, i) => {
                  const labelInfo = paragraphLabels[i] || { icon: '📝', label: '' }
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center
                                      justify-center text-base shrink-0 mt-0.5">
                        {labelInfo.icon}
                      </div>
                      <div>
                        {labelInfo.label && (
                          <p className="text-xs font-semibold text-primary-600
                                        uppercase tracking-wide mb-1">
                            {labelInfo.label}
                          </p>
                        )}
                        <p className="text-sm text-gray-700 leading-relaxed">{para}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Generated at footer */}
            <p className="text-xs text-gray-400 text-center">
              This analysis is based on real data from your FarmConnect account.
              Refresh to generate a new analysis.
            </p>
          </>
        ) : null}
      </main>
    </div>
  )
}
