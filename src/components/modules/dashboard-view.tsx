'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  DollarSign, ShoppingCart, Users, Building2,
  Package, TrendingUp, Plus, ArrowRight,
  BarChart3, Target, Layers,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RecentOrder {
  id: string
  customer: { firstName: string; lastName: string }
  totalAmount: number
  status: string
  createdAt: string
}

interface TopProduct {
  productId: string
  name: string
  sku: string
  orderCount: number
}

interface DashboardStats {
  totalOrders: number
  totalSales: number
  totalRevenue: number
  totalCustomers: number
  totalAgents: number
  totalProducts: number
  recentOrders: RecentOrder[]
  topProducts: TopProduct[]
}

interface TargetItem {
  id: string
  period: string
  type: string
  value: number
  achieved: number
}

interface DashboardViewProps {
  onNavigate: (view: string) => void
}

/* ------------------------------------------------------------------ */
/*  Status maps                                                        */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-300',
  formalized: 'bg-yellow-500/20 text-yellow-300',
  confirmed: 'bg-blue-500/20 text-blue-300',
  completed: 'bg-green-500/20 text-green-300',
  cancelled: 'bg-red-500/20 text-red-300',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  formalized: 'Formalisée',
  confirmed: 'Confirmée',
  completed: 'Complétée',
  cancelled: 'Annulée',
}

const PIE_COLORS: Record<string, string> = {
  draft: '#6b7280',
  formalized: '#eab308',
  confirmed: '#3b82f6',
  completed: '#22c55e',
  cancelled: '#ef4444',
}

/* ------------------------------------------------------------------ */
/*  Stat card config                                                   */
/* ------------------------------------------------------------------ */

const STAT_CARDS = [
  {
    title: 'Revenus',
    key: 'revenue' as const,
    icon: DollarSign,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    format: (v: number) => `${v.toLocaleString('fr-FR')} $`,
  },
  {
    title: 'Commandes',
    key: 'orders' as const,
    icon: ShoppingCart,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    format: (v: number) => v.toLocaleString('fr-FR'),
  },
  {
    title: 'Clients',
    key: 'customers' as const,
    icon: Users,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    format: (v: number) => v.toLocaleString('fr-FR'),
  },
  {
    title: 'Agents actifs',
    key: 'agents' as const,
    icon: Building2,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    format: (v: number) => v.toLocaleString('fr-FR'),
  },
]

/* ------------------------------------------------------------------ */
/*  Quick actions config                                               */
/* ------------------------------------------------------------------ */

const QUICK_ACTIONS = [
  { label: 'Nouvelle commande', icon: ShoppingCart, view: 'orders' },
  { label: 'Nouveau client', icon: Users, view: 'customers' },
  { label: 'Nouveau produit', icon: Package, view: 'products' },
  { label: 'Enregistrer paiement', icon: DollarSign, view: 'payments' },
] as const

/* ------------------------------------------------------------------ */
/*  Target type labels                                                 */
/* ------------------------------------------------------------------ */

const TARGET_TYPE_LABELS: Record<string, string> = {
  revenue: 'Revenus',
  orders: 'Commandes',
  units: 'Unités',
}

/* ------------------------------------------------------------------ */
/*  Custom tooltip for bar chart                                       */
/* ------------------------------------------------------------------ */

function BarTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-white">
        {payload[0].value.toLocaleString('fr-FR')} $
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Custom tooltip for pie chart                                       */
/* ------------------------------------------------------------------ */

function PieTooltipContent({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-white">
        {STATUS_LABELS[payload[0].name] ?? payload[0].name}: {payload[0].value}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Custom legend for pie chart                                        */
/* ------------------------------------------------------------------ */

function PieLegendContent({ payload }: { payload?: Array<{ value: string; color: string; payload: { value: number } }> }) {
  if (!payload?.length) return null
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-gray-400">
            {STATUS_LABELS[entry.value] ?? entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [targets, setTargets] = useState<TargetItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then((r) => r.json()),
      fetch('/api/orders').then((r) => r.json()),
      fetch('/api/targets').then((r) => r.json()),
    ])
      .then(([statsData, ordersData, targetsData]) => {
        setStats(statsData)
        setOrders(Array.isArray(ordersData) ? ordersData : [])
        setTargets(Array.isArray(targetsData) ? targetsData : [])
        setLoading(false)
      })
      .catch(() => {
        toast({ title: 'Erreur', description: 'Impossible de charger les données du tableau de bord', variant: 'destructive' })
        setLoading(false)
      })
  }, [toast])

  /* ---- Chart data: Revenue by month ---- */
  const revenueByMonth = useMemo(() => {
    const monthMap = new Map<string, number>()
    // Initialize last 6 months
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(key, 0)
    }
    // Aggregate orders
    for (const order of orders) {
      const date = new Date(order.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) ?? 0) + order.totalAmount)
      }
    }
    // Format for Recharts
    const MONTH_LABELS: Record<string, string> = {
      '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr',
      '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Aoû',
      '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
    }
    return Array.from(monthMap.entries()).map(([key, revenue]) => {
      const month = key.split('-')[1]
      return { name: MONTH_LABELS[month] ?? month, revenue: Math.round(revenue) }
    })
  }, [orders])

  /* ---- Chart data: Orders by status ---- */
  const ordersByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {
      draft: 0, formalized: 0, confirmed: 0, completed: 0, cancelled: 0,
    }
    for (const order of orders) {
      if (order.status in statusCounts) {
        statusCounts[order.status]++
      }
    }
    return Object.entries(statusCounts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({ name: status, value: count }))
  }, [orders])

  /* ---- Resolve stat value ---- */
  const getStatValue = (key: string): number => {
    if (!stats) return 0
    const map: Record<string, number> = {
      revenue: stats.totalRevenue,
      orders: stats.totalOrders,
      customers: stats.totalCustomers,
      agents: stats.totalAgents,
    }
    return map[key] ?? 0
  }

  /* ---- Top 3 active targets ---- */
  const activeTargets = useMemo(() => {
    return targets
      .filter((t) => t.achieved < t.value)
      .slice(0, 3)
  }, [targets])

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/*  1. KPI Stats Row                                                 */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.key} className="bg-[#111827] border-[#1f2937]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">
                      {stat.title}
                    </p>
                    {loading ? (
                      <Skeleton className="h-7 w-24 mt-1.5 bg-[#1f2937]" />
                    ) : (
                      <p className="text-2xl font-bold text-white mt-1">
                        {stat.format(getStatValue(stat.key))}
                      </p>
                    )}
                  </div>
                  <div className={`${stat.bg} p-3 rounded-xl`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ================================================================ */}
      {/*  2. Charts Row                                                    */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue par mois — BarChart */}
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Revenue par mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full bg-[#1f2937] rounded-lg" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByMonth} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: '#374151' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: '#374151' }}
                      tickLine={false}
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<BarTooltipContent />} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commandes par statut — PieChart */}
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Commandes par statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full bg-[#1f2937] rounded-lg" />
            ) : ordersByStatus.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune commande</p>
                </div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ordersByStatus}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      stroke="none"
                    >
                      {ordersByStatus.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={PIE_COLORS[entry.name] ?? '#6b7280'}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltipContent />} />
                    <Legend content={<PieLegendContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ================================================================ */}
      {/*  3. Middle Row: Recent Orders + Top Products                       */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commandes récentes */}
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-400" />
                Commandes récentes
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300"
                onClick={() => onNavigate('orders')}
              >
                Voir tout <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-16 bg-[#1f2937]" />
                      <Skeleton className="h-4 w-28 bg-[#1f2937]" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-16 bg-[#1f2937]" />
                      <Skeleton className="h-5 w-20 rounded-full bg-[#1f2937]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats?.recentOrders?.length ? (
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#1f2937] scrollbar-track-transparent">
                {stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[#1f2937]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-mono text-gray-400 shrink-0">
                        #{order.id.slice(-6)}
                      </span>
                      <span className="text-sm text-white truncate">
                        {order.customer?.firstName} {order.customer?.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-white">
                        {order.totalAmount.toLocaleString('fr-FR')} $
                      </span>
                      <Badge
                        className={`text-[10px] ${STATUS_COLORS[order.status] ?? 'bg-gray-500/20 text-gray-300'}`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune commande pour le moment</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Produits */}
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-400" />
                Top Produits
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300"
                onClick={() => onNavigate('products')}
              >
                Voir tout <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded bg-[#1f2937]" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-28 bg-[#1f2937]" />
                        <Skeleton className="h-3 w-16 bg-[#1f2937]" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-8 bg-[#1f2937]" />
                  </div>
                ))}
              </div>
            ) : stats?.topProducts?.length ? (
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#1f2937] scrollbar-track-transparent">
                {stats.topProducts.map((product, idx) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[#1f2937]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-purple-400">{idx + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{product.name}</p>
                        {product.sku && (
                          <p className="text-xs text-gray-500 font-mono truncate">{product.sku}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold text-white">{product.orderCount}</span>
                      <span className="text-xs text-gray-500">commandes</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun produit pour le moment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ================================================================ */}
      {/*  4. Bottom Row: Targets + Quick Actions                            */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Objectifs en cours */}
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-400" />
                Objectifs en cours
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300"
                onClick={() => onNavigate('targets')}
              >
                Voir tout <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32 bg-[#1f2937]" />
                      <Skeleton className="h-4 w-16 bg-[#1f2937]" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full bg-[#1f2937]" />
                  </div>
                ))}
              </div>
            ) : activeTargets.length > 0 ? (
              <div className="space-y-5">
                {activeTargets.map((target) => {
                  const pct = target.value > 0
                    ? Math.min(Math.round((target.achieved / target.value) * 100), 100)
                    : 0
                  const typeLabel = TARGET_TYPE_LABELS[target.type] ?? target.type
                  return (
                    <div key={target.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] border-[#374151] text-gray-400"
                          >
                            {target.period}
                          </Badge>
                          <span className="text-sm text-white">{typeLabel}</span>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">
                          {target.achieved.toLocaleString('fr-FR')} / {target.value.toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <div className="relative">
                        <Progress
                          value={pct}
                          className="h-2 bg-[#1f2937] [&>div]:bg-blue-500"
                        />
                        <span className="absolute right-0 -top-5 text-[10px] text-gray-500 font-mono">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun objectif en cours</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.view}
                  variant="outline"
                  className="w-full justify-start text-gray-300 border-[#374151] hover:bg-[#1f2937] hover:text-white transition-colors"
                  onClick={() => onNavigate(action.view)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              )
            })}
          </CardContent>

          {/* Module shortcuts */}
          <div className="border-t border-[#1f2937] mt-2 pt-4 px-6 pb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="w-3 h-3" />
              Raccourcis
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Commandes', icon: ShoppingCart, view: 'orders', count: stats?.totalOrders },
                { name: 'Clients', icon: Users, view: 'customers', count: stats?.totalCustomers },
                { name: 'Produits', icon: Package, view: 'products', count: stats?.totalProducts },
                { name: 'Agents', icon: Building2, view: 'agents', count: stats?.totalAgents },
              ].map((mod) => {
                const Icon = mod.icon
                return (
                  <button
                    key={mod.view}
                    className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-[#1f2937]/50 transition-colors text-left"
                    onClick={() => onNavigate(mod.view)}
                  >
                    <Icon className="w-4 h-4 text-gray-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-300 truncate">{mod.name}</p>
                      {loading ? (
                        <Skeleton className="h-2.5 w-6 mt-0.5 bg-[#1f2937]" />
                      ) : (
                        <p className="text-[10px] text-gray-600 font-mono">{mod.count ?? 0}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
