'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DollarSign, CheckCircle, Clock, Percent } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

// ── Types ────────────────────────────────────────────────────────────────────

interface Commission {
  id: string
  tenantId: string
  saleId: string
  agentId: string
  type: 'percentage' | 'fixed'
  rate: number
  amount: number
  status: 'calculated' | 'validated' | 'paid'
  calculatedAt: string
  paidAt: string | null
}

interface Agent {
  id: string
  user?: {
    firstName: string
    lastName: string
  }
  firstName?: string
  lastName?: string
}

interface Tenant {
  id: string
  name: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function getAgentName(agentId: string, agents: Agent[]): string {
  const agent = agents.find((a) => a.id === agentId)
  if (!agent) return agentId.slice(-6)
  if (agent.user) return `${agent.user.firstName} ${agent.user.lastName}`
  if (agent.firstName && agent.lastName) return `${agent.firstName} ${agent.lastName}`
  return agentId.slice(-6)
}

function statusLabel(status: Commission['status']): string {
  switch (status) {
    case 'calculated':
      return 'Calculée'
    case 'validated':
      return 'Validée'
    case 'paid':
      return 'Payée'
  }
}

function statusVariant(
  status: Commission['status']
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'calculated':
      return 'outline'
    case 'validated':
      return 'secondary'
    case 'paid':
      return 'default'
  }
}

function statusClass(status: Commission['status']): string {
  switch (status) {
    case 'calculated':
      return 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
    case 'validated':
      return 'border-blue-500/50 text-blue-400 bg-blue-500/10'
    case 'paid':
      return 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function CommissionsView() {
  const [tenantId, setTenantId] = useState<string>('')
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── Fetch tenantId ──────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchTenant() {
      try {
        const res = await fetch('/api/tenants')
        if (!res.ok) throw new Error('Failed to fetch tenants')
        const data: Tenant[] = await res.json()
        if (data.length > 0) {
          setTenantId(data[0].id)
        }
      } catch {
        toast({ title: 'Erreur', description: 'Impossible de charger les tenants', variant: 'destructive' })
      }
    }
    fetchTenant()
  }, [])

  // ── Fetch commissions & agents once tenantId is available ──────────────

  const fetchCommissions = useCallback(async () => {
    if (!tenantId) return
    try {
      const res = await fetch(`/api/commissions?tenantId=${tenantId}`)
      if (!res.ok) throw new Error('Failed to fetch commissions')
      const data: Commission[] = await res.json()
      setCommissions(data)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les commissions', variant: 'destructive' })
    }
  }, [tenantId])

  const fetchAgents = useCallback(async () => {
    if (!tenantId) return
    try {
      const res = await fetch(`/api/agents?tenantId=${tenantId}`)
      if (!res.ok) throw new Error('Failed to fetch agents')
      const data: Agent[] = await res.json()
      setAgents(data)
    } catch {
      // Non-critical – agent names will fall back to ID
    }
  }, [tenantId])

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    Promise.all([fetchCommissions(), fetchAgents()]).finally(() => setLoading(false))
  }, [tenantId, fetchCommissions, fetchAgents])

  // ── Actions ─────────────────────────────────────────────────────────────

  async function handleValidate(commission: Commission) {
    setActionLoading(commission.id)
    try {
      const res = await fetch(`/api/commissions/${commission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'validated' }),
      })
      if (!res.ok) throw new Error('Validation failed')
      toast({ title: 'Commission validée', description: `La commission ${commission.id.slice(-6)} a été validée.` })
      await fetchCommissions()
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de valider la commission', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleMarkPaid(commission: Commission) {
    setActionLoading(commission.id)
    try {
      const res = await fetch(`/api/commissions/${commission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid', paidAt: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error('Mark paid failed')
      toast({ title: 'Commission payée', description: `La commission ${commission.id.slice(-6)} a été marquée payée.` })
      await fetchCommissions()
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de marquer la commission comme payée', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  // ── Computed stats ─────────────────────────────────────────────────────

  const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0)
  const pendingCommissions = commissions.filter((c) => c.status === 'calculated')
  const paidCommissions = commissions.filter((c) => c.status === 'paid')
  const pendingAmount = pendingCommissions.reduce((sum, c) => sum + c.amount, 0)
  const paidAmount = paidCommissions.reduce((sum, c) => sum + c.amount, 0)

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-[#0d1117] rounded-lg px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white tracking-tight">
          Commissions
        </h1>
        <span className="text-sm text-gray-400">
          {commissions.length} commission{commissions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Stats Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total */}
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Commissions
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {commissions.length} commission{commissions.length !== 1 ? 's' : ''} au total
            </p>
          </CardContent>
        </Card>

        {/* En attente */}
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              En attente
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(pendingAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {pendingCommissions.length} en attente de validation
            </p>
          </CardContent>
        </Card>

        {/* Payées */}
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Payées
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(paidAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {paidCommissions.length} commission{paidCommissions.length !== 1 ? 's' : ''} payée{paidCommissions.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────── */}
      <Card className="bg-[#111827] border-[#1f2937] overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
                <span className="text-sm text-gray-400">Chargement des commissions…</span>
              </div>
            </div>
          ) : commissions.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <span className="text-sm text-gray-400">Aucune commission trouvée</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#1f2937] hover:bg-transparent">
                    <TableHead className="text-gray-400 font-semibold">ID</TableHead>
                    <TableHead className="text-gray-400 font-semibold">Vente</TableHead>
                    <TableHead className="text-gray-400 font-semibold">Agent</TableHead>
                    <TableHead className="text-gray-400 font-semibold">Type</TableHead>
                    <TableHead className="text-gray-400 font-semibold">Taux</TableHead>
                    <TableHead className="text-gray-400 font-semibold">Montant</TableHead>
                    <TableHead className="text-gray-400 font-semibold">Statut</TableHead>
                    <TableHead className="text-gray-400 font-semibold">Date</TableHead>
                    <TableHead className="text-gray-400 font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((c) => (
                    <TableRow
                      key={c.id}
                      className="border-[#1f2937] hover:bg-[#1f2937]/50"
                    >
                      {/* ID */}
                      <TableCell className="font-mono text-sm text-gray-300">
                        {c.id.slice(-6)}
                      </TableCell>

                      {/* Vente */}
                      <TableCell className="font-mono text-sm text-gray-300">
                        {c.saleId.slice(-6)}
                      </TableCell>

                      {/* Agent */}
                      <TableCell className="text-sm text-gray-300">
                        {getAgentName(c.agentId, agents)}
                      </TableCell>

                      {/* Type */}
                      <TableCell className="text-sm text-gray-300">
                        <div className="flex items-center gap-1">
                          {c.type === 'percentage' ? (
                            <>
                              <Percent className="h-3 w-3 text-gray-400" />
                              <span>%</span>
                            </>
                          ) : (
                            <span>Fixe</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Taux */}
                      <TableCell className="text-sm text-gray-300">
                        {c.type === 'percentage'
                          ? `${c.rate}%`
                          : formatCurrency(c.rate)}
                      </TableCell>

                      {/* Montant */}
                      <TableCell className="text-sm font-semibold text-white">
                        {formatCurrency(c.amount)}
                      </TableCell>

                      {/* Statut */}
                      <TableCell>
                        <Badge
                          variant={statusVariant(c.status)}
                          className={`${statusClass(c.status)} text-xs font-medium`}
                        >
                          {statusLabel(c.status)}
                        </Badge>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-sm text-gray-400">
                        {formatDate(c.calculatedAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.status === 'calculated' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                              disabled={actionLoading === c.id}
                              onClick={() => handleValidate(c)}
                            >
                              {actionLoading === c.id ? (
                                <span className="flex items-center gap-1">
                                  <span className="h-3 w-3 animate-spin rounded-full border border-blue-400 border-t-transparent" />
                                  Validation…
                                </span>
                              ) : (
                                'Valider'
                              )}
                            </Button>
                          )}
                          {c.status === 'validated' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                              disabled={actionLoading === c.id}
                              onClick={() => handleMarkPaid(c)}
                            >
                              {actionLoading === c.id ? (
                                <span className="flex items-center gap-1">
                                  <span className="h-3 w-3 animate-spin rounded-full border border-emerald-400 border-t-transparent" />
                                  Paiement…
                                </span>
                              ) : (
                                'Marquer payée'
                              )}
                            </Button>
                          )}
                          {c.status === 'paid' && (
                            <span className="text-xs text-gray-500 italic">Terminée</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
