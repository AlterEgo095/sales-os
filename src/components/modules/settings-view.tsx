'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Shield, Database, Bell, Palette, Globe } from 'lucide-react'

export function SettingsView() {
  const settingsGroups = [
    {
      title: 'Plateforme',
      icon: Shield,
      items: [
        { label: 'Authentification', desc: 'NextAuth v4 avec credentials', status: 'IMPLEMENTE' },
        { label: 'RBAC', desc: '6 roles, 18 permissions', status: 'IMPLEMENTE' },
        { label: 'Multi-tenant', desc: 'Isolation par tenantId', status: 'PREPARE' },
        { label: 'Audit Log', desc: 'Trail complet des actions', status: 'PREPARE' },
      ],
    },
    {
      title: 'Donnees',
      icon: Database,
      items: [
        { label: 'Base de donnees', desc: 'SQLite (dev) / PostgreSQL (prod)', status: 'IMPLEMENTE' },
        { label: '16 Modeles', desc: 'Tenant, User, House, Agent, Customer, Product, Order...', status: 'IMPLEMENTE' },
        { label: 'Event System', desc: 'Redis pub/sub pour evenements', status: 'DIFFERE' },
      ],
    },
    {
      title: 'Interface',
      icon: Palette,
      items: [
        { label: 'Theme sombre', desc: 'Dark navy theme actif', status: 'IMPLEMENTE' },
        { label: 'Responsive', desc: 'Mobile-first design', status: 'IMPLEMENTE' },
        { label: 'i18n', desc: 'Francais (defaut), English (prepare)', status: 'PREPARE' },
      ],
    },
  ]

  const statusColors: Record<string, string> = {
    IMPLEMENTE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    PREPARE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    DIFFERE: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-blue-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Parametres</h1>
          <p className="text-sm text-gray-400">Configuration de la plateforme SALES OS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingsGroups.map((group) => (
          <Card key={group.title} className="bg-[#111827] border-[#1f2937]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <group.icon className="w-4 h-4 text-blue-400" />
                {group.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#0d1117]/50">
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${statusColors[item.status]}`}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#111827] border-[#1f2937]">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-400">SALES OS MVP V1</p>
            <p className="text-xs text-gray-600">Architecture Implementation-Ready — Phase 1</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
