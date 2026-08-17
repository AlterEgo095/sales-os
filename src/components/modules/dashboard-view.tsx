'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DollarSign, ShoppingCart, Users, Building2,
  Package, TrendingUp, Plus, ArrowRight,
  BarChart3, Target, Layers
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RecentOrder {
  id: string
  customer: { firstName: string; lastName: string }
  totalAmount: number
  status: string
}

interface DashboardStats {
  totalOrders: number
  totalSales: number
  totalRevenue: number
  totalCustomers: number
  totalAgents: number
  totalProducts: number
  recentOrders: RecentOrder[]
  topProducts: unknown[]
}

interface DashboardViewProps {
  onNavigate: (view: string) => void
}

/* ------------------------------------------------------------------ */
/*  Status color map                                                   */
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
  completed: 'Terminée',
  cancelled: 'Annulée',
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
/*  Module shortcuts config                                            */
/* ------------------------------------------------------------------ */

const MODULE_SHORTCUTS = [
  { name: 'Commandes', icon: ShoppingCart, key: 'totalOrders' as const },
  { name: 'Clients', icon: Users, key: 'totalCustomers' as const },
  { name: 'Produits', icon: Package, key: 'totalProducts' as const },
  { name: 'Objectifs', icon: Target, key: null },
  { name: 'Analytics', icon: BarChart3, key: null },
] as const

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data: DashboardStats) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  /* Resolve stat value from stats object */
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

  const getModuleCount = (key: string | null): number => {
    if (!key || !stats) return 0
    const map: Record<string, number> = {
      totalOrders: stats.totalOrders,
      totalCustomers: stats.totalCustomers,
      totalProducts: stats.totalProducts,
    }
    return map[key] ?? 0
  }

  return (
    <div className="space-y-6">
      {/* ---- Stat Cards ---- */}
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

      {/* ---- Main grid: Recent Orders + Sidebar ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2">
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
                <div className="space-y-1 max-h-96 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#1f2937] scrollbar-track-transparent">
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
        </div>

        {/* Sidebar: Quick Actions + Module Shortcuts */}
        <div className="space-y-4">
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
          </Card>

          {/* Module Shortcuts */}
          <Card className="bg-[#111827] border-[#1f2937]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Modules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {MODULE_SHORTCUTS.map((mod) => {
                const Icon = mod.icon
                return (
                  <div
                    key={mod.name}
                    className="flex items-center justify-between py-2 px-1 rounded-md hover:bg-[#1f2937]/50 transition-colors cursor-pointer"
                    onClick={() => {
                      const viewMap: Record<string, string> = {
                        Commandes: 'orders',
                        Clients: 'customers',
                        Produits: 'products',
                        Objectifs: 'targets',
                        Analytics: 'analytics',
                      }
                      onNavigate(viewMap[mod.name] ?? mod.name.toLowerCase())
                    }}
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Icon className="w-3.5 h-3.5 text-gray-500" />
                      {mod.name}
                    </div>
                    {loading ? (
                      <Skeleton className="h-3 w-6 bg-[#1f2937]" />
                    ) : (
                      <span className="text-xs font-mono text-gray-500">
                        {getModuleCount(mod.key)}
                      </span>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
