import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw, TrendingUp, Package, AlertTriangle, Trophy } from 'lucide-react'
import AppLayout from '../../components/AppLayout'
import { Button, Alert, Spinner, StatCard } from '../../components/ui'
import { getFarmerInsights } from '../../api/aiApi'

export default function FarmerInsights() {
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error,      setError]      = useState('')

  const load = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    setError('')
    try { setData(await getFarmerInsights()) }
    catch (err) { setError(err.response?.data?.error || 'Failed to load insights.') }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [])

  const paragraphs = data?.insights
    ? data.insights.split('\n').filter(p => p.trim().length > 0)
    : []

  const PARA_META = [
    { icon: TrendingUp, label: 'Performance Overview', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Trophy,     label: 'What Is Working',       color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Sparkles,   label: 'Your Action Tip',        color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <AppLayout title="AI Insights" subtitle="AI-powered analysis of your last 30 days">
      <div className="flex justify-end mb-6">
        {data && (
          <Button variant="secondary" icon={RefreshCw} loading={refreshing}
            onClick={() => load(true)}>
            Refresh
          </Button>
        )}
      </div>

      {error && <div className="mb-6"><Alert type="error" message={error} /></div>}

      {loading ? (
        <div className="card p-16 text-center">
          <Spinner size="xl" className="text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">AI is analysing your sales data…</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label:'Orders',    value: data.data?.total_orders,  icon: Package,      color:'text-blue-600',    bg:'bg-blue-50' },
              { label:'Revenue',   value: `UGX ${Number(data.data?.total_revenue||0).toLocaleString()}`, icon: TrendingUp, color:'text-emerald-600', bg:'bg-emerald-50' },
              { label:'Delivered', value: data.data?.delivered,     icon: Trophy,       color:'text-teal-600',    bg:'bg-teal-50' },
              { label:'Pending',   value: data.data?.pending,       icon: RefreshCw,    color:'text-amber-600',   bg:'bg-amber-50' },
              { label:'Cancelled', value: data.data?.cancelled,     icon: AlertTriangle,color:'text-red-600',     bg:'bg-red-50' },
              { label:'Listings',  value: data.data?.total_products,icon: Package,      color:'text-purple-600',  bg:'bg-purple-50' },
            ].map(s => <StatCard key={s.label} {...s} />)}
          </div>

          {/* Top products */}
          {data.data?.top_products?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-500" /> Top Selling Products
              </h3>
              <div className="space-y-2">
                {data.data.top_products.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full
                                     flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-700">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low stock */}
          {data.data?.low_stock?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5" /> Running Low on Stock
              </h3>
              <div className="space-y-1">
                {data.data.low_stock.map((item, i) => (
                  <p key={i} className="text-sm text-amber-700">• {item}</p>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-r from-farm-dark to-blue-900 px-6 py-5
                            flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">AI Performance Analysis</p>
                <p className="text-blue-300 text-xs">
                  Powered by Google Gemini ·{' '}
                  {data.generated_at
                    ? new Date(data.generated_at).toLocaleDateString('en-UG', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
                    : 'Just now'}
                </p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {paragraphs.map((para, i) => {
                const meta = PARA_META[i] || PARA_META[0]
                return (
                  <div key={i} className="flex gap-4">
                    <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center
                                     justify-center shrink-0`}>
                      <meta.icon className={`w-4.5 h-4.5 ${meta.color}`} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${meta.color}`}>
                        {meta.label}
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">{para}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Analysis based on your real FarmConnect data. Refresh to regenerate.
          </p>
        </div>
      ) : null}
    </AppLayout>
  )
}
