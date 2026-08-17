'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Shield, Search, Clock, UserCircle, Filter, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditEvent {
  id: string
  tenantId: string
  userId: string | null
  action: string
  entityType: string
  entityId: string
  changes: string | null
  ipAddress: string | null
  createdAt: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  email?: string
}

interface TenantInfo {
  id: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTION_OPTIONS = [
  { value: 'all', label: 'Toutes les actions' },
  { value: 'create', label: 'Créer' },
  { value: 'update', label: 'Modifier' },
  { value: 'delete', label: 'Supprimer' },
  { value: 'login', label: 'Connexion' },
  { value: 'transition', label: 'Transition' },
] as const

const ENTITY_OPTIONS = [
  { value: 'all', label: 'Tous les types' },
  { value: 'order', label: 'Commande' },
  { value: 'customer', label: 'Client' },
  { value: 'product', label: 'Produit' },
  { value: 'agent', label: 'Agent' },
  { value: 'payment', label: 'Paiement' },
  { value: 'commission', label: 'Commission' },
  { value: 'user', label: 'Utilisateur' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'house', label: 'Maison' },
  { value: 'stock', label: 'Stock' },
] as const

const ACTION_BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  create: { label: 'Créer', className: 'bg-emerald-600 text-emerald-100 hover:bg-emerald-600 border-emerald-700' },
  update: { label: 'Modifier', className: 'bg-blue-600 text-blue-100 hover:bg-blue-600 border-blue-700' },
  delete: { label: 'Supprimer', className: 'bg-red-600 text-red-100 hover:bg-red-600 border-red-700' },
  login: { label: 'Connexion', className: 'bg-purple-600 text-purple-100 hover:bg-purple-600 border-purple-700' },
  transition: { label: 'Transition', className: 'bg-yellow-600 text-yellow-100 hover:bg-yellow-600 border-yellow-700' },
}

const ENTITY_BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  order: { label: 'Commande', className: 'bg-sky-900/60 text-sky-300 border-sky-800' },
  customer: { label: 'Client', className: 'bg-teal-900/60 text-teal-300 border-teal-800' },
  product: { label: 'Produit', className: 'bg-amber-900/60 text-amber-300 border-amber-800' },
  agent: { label: 'Agent', className: 'bg-violet-900/60 text-violet-300 border-violet-800' },
  payment: { label: 'Paiement', className: 'bg-emerald-900/60 text-emerald-300 border-emerald-800' },
  commission: { label: 'Commission', className: 'bg-rose-900/60 text-rose-300 border-rose-800' },
  user: { label: 'Utilisateur', className: 'bg-indigo-900/60 text-indigo-300 border-indigo-800' },
  tenant: { label: 'Tenant', className: 'bg-slate-700/60 text-slate-300 border-slate-600' },
  house: { label: 'Maison', className: 'bg-orange-900/60 text-orange-300 border-orange-800' },
  stock: { label: 'Stock', className: 'bg-cyan-900/60 text-cyan-300 border-cyan-800' },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function resolveUserName(userId: string | null, users: User[]): string {
  if (!userId) return 'System'
  const user = users.find((u) => u.id === userId)
  if (!user) return userId.slice(0, 8) + '…'
  return `${user.firstName} ${user.lastName}`
}

function truncateChanges(changes: string | null): string {
  if (!changes) return '—'
  try {
    const parsed = JSON.parse(changes)
    const str = JSON.stringify(parsed, null, 2)
    return str.length > 50 ? str.slice(0, 50) + '…' : str
  } catch {
    return changes.length > 50 ? changes.slice(0, 50) + '…' : changes
  }
}

function getFullChanges(changes: string | null): string {
  if (!changes) return '—'
  try {
    const parsed = JSON.parse(changes)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return changes
  }
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuditView() {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [apiExists, setApiExists] = useState(true)

  // Filters
  const [actionFilter, setActionFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Expanded rows for detail view
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // -------------------------------------------------------------------------
  // Fetch tenant on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function loadTenant() {
      try {
        const res = await fetch('/api/tenants')
        if (!res.ok) throw new Error('Failed to fetch tenants')
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setTenantInfo({ id: data[0].id })
        } else if (data?.id) {
          setTenantInfo({ id: data.id })
        }
      } catch {
        toast({ title: 'Erreur', description: 'Impossible de charger les tenants.', variant: 'destructive' })
      }
    }
    loadTenant()
  }, [])

  // -------------------------------------------------------------------------
  // Fetch audit events
  // -------------------------------------------------------------------------

  const fetchAuditEvents = useCallback(async () => {
    if (!tenantInfo) return
    setLoading(true)
    try {
      const res = await fetch(`/api/audit?tenantId=${tenantInfo.id}`)
      if (res.status === 404) {
        setApiExists(false)
        setAuditEvents([])
        return
      }
      if (!res.ok) throw new Error('Failed to fetch audit events')
      const data = await res.json()
      setAuditEvents(Array.isArray(data) ? data : [])
      setApiExists(true)
    } catch {
      setApiExists(false)
      setAuditEvents([])
      toast({ title: 'Erreur', description: "Impossible de charger le journal d'audit.", variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [tenantInfo])

  // -------------------------------------------------------------------------
  // Fetch users for name resolution
  // -------------------------------------------------------------------------

  const fetchUsers = useCallback(async () => {
    if (!tenantInfo) return
    try {
      const res = await fetch(`/api/users?tenantId=${tenantInfo.id}`)
      if (!res.ok) return
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      // Non-critical: users list is optional for display
    }
  }, [tenantInfo])

  useEffect(() => {
    fetchAuditEvents()
    fetchUsers()
  }, [fetchAuditEvents, fetchUsers])

  // -------------------------------------------------------------------------
  // Toggle expanded row
  // -------------------------------------------------------------------------

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // -------------------------------------------------------------------------
  // Filtered & sorted events
  // -------------------------------------------------------------------------

  const filteredEvents = auditEvents
    .filter((evt) => {
      if (actionFilter !== 'all' && evt.action !== actionFilter) return false
      if (entityFilter !== 'all' && evt.entityType !== entityFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchAction = evt.action.toLowerCase().includes(q)
        const matchEntityId = evt.entityId.toLowerCase().includes(q)
        if (!matchAction && !matchEntityId) return false
      }
      return true
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------

  const totalEvents = auditEvents.length
  const todayEvents = auditEvents.filter((e) => isToday(e.createdAt)).length
  const activeUserIds = new Set(auditEvents.filter((e) => e.userId).map((e) => e.userId))
  const activeUsers = activeUserIds.size

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-[#0d1117] rounded-lg p-6 flex items-center gap-3">
        <Shield className="h-6 w-6 text-emerald-400" />
        <h1 className="text-xl font-bold text-white">Journal d&apos;audit</h1>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Total événements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{totalEvents}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Aujourd&apos;hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{todayEvents}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Utilisateurs actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{activeUsers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Row */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3 text-gray-400">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filtres</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[200px] bg-[#0d1117] border-[#1f2937] text-gray-200">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent className="bg-[#111827] border-[#1f2937]">
              {ACTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-gray-200 focus:bg-[#1f2937] focus:text-white">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-full sm:w-[200px] bg-[#0d1117] border-[#1f2937] text-gray-200">
              <SelectValue placeholder="Type d'entité" />
            </SelectTrigger>
            <SelectContent className="bg-[#111827] border-[#1f2937]">
              {ENTITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-gray-200 focus:bg-[#1f2937] focus:text-white">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Rechercher action, ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#0d1117] border-[#1f2937] text-gray-200 placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Chargement…</span>
            </div>
          ) : !apiExists ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Shield className="h-10 w-10 mb-3 text-gray-600" />
              <p className="text-sm">Aucun événement d&apos;audit disponible</p>
              <p className="text-xs text-gray-600 mt-1">L&apos;API d&apos;audit n&apos;est pas encore configurée</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Shield className="h-10 w-10 mb-3 text-gray-600" />
              <p className="text-sm">Aucun événement d&apos;audit trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#1f2937] hover:bg-transparent">
                    <TableHead className="text-gray-400 font-semibold">Date</TableHead>
                    <TableHead className="text-gray-400 font-semibold">Utilisateur</TableHead>
                    <TableHead className="text-gray-400 font-semibold">Action</TableHead>
                    <TableHead className="text-gray-400 font-semibold">Entité</TableHead>
                    <TableHead className="text-gray-400 font-semibold">ID</TableHead>
                    <TableHead className="text-gray-400 font-semibold">Détails</TableHead>
                    <TableHead className="text-gray-400 font-semibold">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((evt) => {
                    const actionCfg = ACTION_BADGE_CONFIG[evt.action]
                    const entityCfg = ENTITY_BADGE_CONFIG[evt.entityType]
                    const isExpanded = expandedRows.has(evt.id)

                    return (
                      <TableRow key={evt.id} className="border-[#1f2937] hover:bg-[#1f2937]/50">
                        {/* Date */}
                        <TableCell className="text-gray-300 text-xs whitespace-nowrap">
                          {formatDate(evt.createdAt)}
                        </TableCell>

                        {/* Utilisateur */}
                        <TableCell className="text-gray-200 text-sm">
                          {resolveUserName(evt.userId, users)}
                        </TableCell>

                        {/* Action Badge */}
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={actionCfg?.className ?? 'bg-gray-700 text-gray-300 border-gray-600'}
                          >
                            {actionCfg?.label ?? evt.action}
                          </Badge>
                        </TableCell>

                        {/* Entity Badge */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={entityCfg?.className ?? 'bg-gray-800 text-gray-400 border-gray-700'}
                          >
                            {entityCfg?.label ?? evt.entityType}
                          </Badge>
                        </TableCell>

                        {/* Entity ID */}
                        <TableCell className="font-mono text-xs text-gray-400">
                          {evt.entityId.length > 8
                            ? '…' + evt.entityId.slice(-8)
                            : evt.entityId}
                        </TableCell>

                        {/* Détails */}
                        <TableCell className="max-w-[200px]">
                          {evt.changes ? (
                            <div className="flex items-start gap-1">
                              <span className="text-xs text-gray-400 break-all">
                                {isExpanded ? getFullChanges(evt.changes) : truncateChanges(evt.changes)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 shrink-0 text-gray-500 hover:text-gray-300"
                                onClick={() => toggleRow(evt.id)}
                              >
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">—</span>
                          )}
                        </TableCell>

                        {/* IP */}
                        <TableCell className="text-xs text-gray-400 font-mono">
                          {evt.ipAddress ?? '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
