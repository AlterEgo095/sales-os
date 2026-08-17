'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, ShoppingCart, Users, Building2, 
  Package, TrendingUp, Plus, ArrowRight,
  BarChart3, Target, Layers
} from 'lucide-react'

interface DashboardStats {
  totalOrders: number
  totalSales: number
  totalRevenue: number
  totalCustomers: number
  totalAgents: number
  totalProducts: number
  recentOrders: any[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const statCards = [
    { title: 'Revenus totaux', value: `${(stats?.totalRevenue || 0).toLocaleString()} $`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
    { title: 'Commandes', value: stats?.totalOrders || 0, icon: ShoppingCart, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Clients', value: stats?.totalCustomers || 0, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Agents actifs', value: stats?.totalAgents || 0, icon: Building2, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ]

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/20 text-gray-300',
    formalized: 'bg-yellow-500/20 text-yellow-300',
    confirmed: 'bg-blue-500/20 text-blue-300',
    completed: 'bg-green-500/20 text-green-300',
    cancelled: 'bg-red-500/20 text-red-300',
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Header */}
      <header className="border-b border-[#1f2937] bg-[#111827]/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-black text-white tracking-tight">SALES <span className="text-blue-500">OS</span></div>
            <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">MVP V1</Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Building2 className="w-4 h-4" />
              <span>Tableau de bord</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.title} className="bg-[#111827] border-[#1f2937]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">{stat.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-xl`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card className="bg-[#111827] border-[#1f2937]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-blue-400" />
                    Commandes récentes
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                    Voir tout <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-12 bg-[#1f2937] rounded animate-pulse" />)}
                  </div>
                ) : stats?.recentOrders?.length ? (
                  <div className="space-y-2">
                    {stats.recentOrders.map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#1f2937]/50">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-gray-400">#{order.id.slice(-6)}</span>
                          <span className="text-sm text-white">{order.customer?.firstName} {order.customer?.lastName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-white">{order.totalAmount} $</span>
                          <Badge className={`text-[10px] ${statusColors[order.status] || 'bg-gray-500/20 text-gray-300'}`}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune commande pour le moment</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions + Module Cards */}
          <div className="space-y-4">
            <Card className="bg-[#111827] border-[#1f2937]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-400" />
                  Actions rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-gray-300 border-[#374151] hover:bg-[#1f2937] hover:text-white">
                  <ShoppingCart className="w-4 h-4 mr-2" /> Nouvelle commande
                </Button>
                <Button variant="outline" className="w-full justify-start text-gray-300 border-[#374151] hover:bg-[#1f2937] hover:text-white">
                  <Users className="w-4 h-4 mr-2" /> Nouveau client
                </Button>
                <Button variant="outline" className="w-full justify-start text-gray-300 border-[#374151] hover:bg-[#1f2937] hover:text-white">
                  <Package className="w-4 h-4 mr-2" /> Nouveau produit
                </Button>
                <Button variant="outline" className="w-full justify-start text-gray-300 border-[#374151] hover:bg-[#1f2937] hover:text-white">
                  <DollarSign className="w-4 h-4 mr-2" /> Enregistrer paiement
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#111827] border-[#1f2937]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Modules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { name: 'Commandes', icon: ShoppingCart, count: stats?.totalOrders || 0 },
                  { name: 'Clients', icon: Users, count: stats?.totalCustomers || 0 },
                  { name: 'Produits', icon: Package, count: stats?.totalProducts || 0 },
                  { name: 'Objectifs', icon: Target, count: 0 },
                  { name: 'Analytics', icon: BarChart3, count: 0 },
                ].map(m => (
                  <div key={m.name} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <m.icon className="w-3.5 h-3.5 text-gray-500" />
                      {m.name}
                    </div>
                    <span className="text-xs font-mono text-gray-500">{m.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1f2937] mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-xs text-gray-600">
          SALES OS — MVP V1 — Architecture Implementation-Ready
        </div>
      </footer>
    </div>
  )
}
