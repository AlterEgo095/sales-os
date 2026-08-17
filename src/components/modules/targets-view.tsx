'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Progress } from '@/components/ui/progress'
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

// --- Types ---
interface Agent {
  id: string
  name: string
}

interface House {
  id: string
  name: string
}

interface TargetItem {
  id: string
  tenantId: string
  agentId?: string
  agent?: Agent
  houseId?: string
  house?: House
  period: string
  type: 'revenue' | 'orders' | 'units'
  value: number
  achieved: number
  createdAt: string
  updatedAt: string
}

interface TenantInfo {
  id: string
  houses?: House[]
}

// --- Helpers ---
const typeLabels: Record<string, string> = {
  revenue: 'Revenu',
  orders: 'Commandes',
  units: 'Unités',
}

const typeBadgeClasses: Record<string, string> = {
  revenue: 'bg-green-600 text-green-100 hover:bg-green-600',
  orders: 'bg-blue-600 text-blue-100 hover:bg-blue-600',
  units: 'bg-purple-600 text-purple-100 hover:bg-purple-600',
}

function getProgressColor(pct: number): string {
  if (pct >= 100) return 'bg-green-500'
  if (pct >= 50) return 'bg-blue-500'
  if (pct >= 1) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getProgressTrack(pct: number): string {
  if (pct >= 100) return '[&>div]:bg-green-500'
  if (pct >= 50) return '[&>div]:bg-blue-500'
  if (pct >= 1) return '[&>div]:bg-yellow-500'
  return '[&>div]:bg-red-500'
}

// --- Component ---
export function TargetsView() {
  const [tenantId, setTenantId] = useState<string>('')
  const [targets, setTargets] = useState<TargetItem[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState<TargetItem | null>(null)
  const [formPeriod, setFormPeriod] = useState('')
  const [formType, setFormType] = useState<'revenue' | 'orders' | 'units'>('revenue')
  const [formValue, setFormValue] = useState('')
  const [formAchieved, setFormAchieved] = useState('0')
  const [formAgentId, setFormAgentId] = useState('')
  const [formHouseId, setFormHouseId] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TargetItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // --- Fetch tenantId on mount ---
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/tenants')
        if (res.ok) {
          const data = await res.json()
          const tenant = Array.isArray(data) ? data[0] : data
          if (tenant?.id) {
            setTenantId(tenant.id)
            if (tenant.houses?.length) {
              setHouses(tenant.houses)
            }
          }
        }
      } catch {
        // silent
      }
    }
    init()
  }, [])

  // --- Fetch agents ---
  useEffect(() => {
    if (!tenantId) return
    async function fetchAgents() {
      try {
        const res = await fetch(`/api/agents?tenantId=${tenantId}`)
        if (res.ok) {
          const data = await res.json()
          setAgents(Array.isArray(data) ? data : [])
        }
      } catch {
        // silent
      }
    }
    fetchAgents()
  }, [tenantId])

  // --- Fetch houses if not already loaded ---
  useEffect(() => {
    if (!tenantId || houses.length > 0) return
    async function fetchHouses() {
      try {
        const res = await fetch(`/api/tenants?includeHouses=true`)
        if (res.ok) {
          const data = await res.json()
          const tenant = Array.isArray(data) ? data[0] : data
          if (tenant?.houses?.length) {
            setHouses(tenant.houses)
          }
        }
      } catch {
        // silent
      }
    }
    fetchHouses()
  }, [tenantId, houses.length])

  // --- Fetch targets ---
  const fetchTargets = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/targets?tenantId=${tenantId}`)
      if (res.ok) {
        const data = await res.json()
        setTargets(Array.isArray(data) ? data : [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchTargets()
  }, [fetchTargets])

  // --- Stats ---
  const totalTargets = targets.length
  const avgRate =
    totalTargets > 0
      ? targets.reduce((sum, t) => {
          const pct = t.value > 0 ? (t.achieved / t.value) * 100 : 0
          return sum + Math.min(pct, 100)
        }, 0) / totalTargets
      : 0
  const achievedCount = targets.filter((t) => t.achieved >= t.value && t.value > 0).length
  const inProgressCount = targets.filter((t) => t.achieved < t.value).length

  // --- Form helpers ---
  const resetForm = useCallback(() => {
    setFormPeriod('')
    setFormType('revenue')
    setFormValue('')
    setFormAchieved('0')
    setFormAgentId('')
    setFormHouseId('')
    setEditingTarget(null)
  }, [])

  const openCreate = useCallback(() => {
    resetForm()
    setDialogOpen(true)
  }, [resetForm])

  const openEdit = useCallback((t: TargetItem) => {
    setEditingTarget(t)
    setFormPeriod(t.period)
    setFormType(t.type)
    setFormValue(String(t.value))
    setFormAchieved(String(t.achieved))
    setFormAgentId(t.agentId || '')
    setFormHouseId(t.houseId || '')
    setDialogOpen(true)
  }, [])

  const openDelete = useCallback((t: TargetItem) => {
    setDeleteTarget(t)
    setDeleteOpen(true)
  }, [])

  // --- Save ---
  const handleSave = useCallback(async () => {
    if (!formPeriod.trim()) {
      toast({ title: 'Erreur', description: 'La période est requise.', variant: 'destructive' })
      return
    }
    const numericValue = parseFloat(formValue)
    if (isNaN(numericValue) || numericValue <= 0) {
      toast({ title: 'Erreur', description: 'La valeur cible doit être supérieure à 0.', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        tenantId,
        period: formPeriod.trim(),
        type: formType,
        value: numericValue,
        achieved: parseFloat(formAchieved) || 0,
      }
      if (formAgentId) body.agentId = formAgentId
      if (formHouseId) body.houseId = formHouseId

      let res: Response
      if (editingTarget) {
        res = await fetch(`/api/targets/${editingTarget.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/targets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (res.ok) {
        toast({
          title: editingTarget ? 'Objectif modifié' : 'Objectif créé',
          description: editingTarget
            ? "L'objectif a été mis à jour avec succès."
            : 'Le nouvel objectif a été créé avec succès.',
        })
        setDialogOpen(false)
        resetForm()
        fetchTargets()
      } else {
        const err = await res.json().catch(() => ({}))
        toast({
          title: 'Erreur',
          description: err.error || 'Une erreur est survenue.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Erreur réseau.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }, [tenantId, formPeriod, formType, formValue, formAchieved, formAgentId, formHouseId, editingTarget, resetForm, fetchTargets])

  // --- Delete ---
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/targets/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Objectif supprimé', description: "L'objectif a été supprimé avec succès." })
        setDeleteOpen(false)
        setDeleteTarget(null)
        fetchTargets()
      } else {
        toast({ title: 'Erreur', description: 'Impossible de supprimer.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Erreur réseau.', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }, [deleteTarget, fetchTargets])

  // --- Render ---
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-[#0d1117] rounded-lg border border-[#1f2937] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-emerald-400" />
          <h1 className="text-xl font-semibold text-white">Objectifs</h1>
        </div>
        <Button
          onClick={openCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvel objectif
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Total objectifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-400" />
              <span className="text-2xl font-bold text-white">{totalTargets}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Taux moyen de réalisation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <span className="text-2xl font-bold text-white">{avgRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Objectifs atteints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-2xl font-bold text-white">{achievedCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{inProgressCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-emerald-400 animate-spin" />
              <span className="ml-2 text-gray-400">Chargement...</span>
            </div>
          ) : targets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Target className="h-10 w-10 mb-2 opacity-50" />
              <p>Aucun objectif défini</p>
              <p className="text-sm mt-1">Cliquez sur &quot;Nouvel objectif&quot; pour commencer</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#1f2937] hover:bg-transparent">
                    <TableHead className="text-gray-400">Période</TableHead>
                    <TableHead className="text-gray-400">Type</TableHead>
                    <TableHead className="text-gray-400">Cible</TableHead>
                    <TableHead className="text-gray-400">Réalisé</TableHead>
                    <TableHead className="text-gray-400">Progression</TableHead>
                    <TableHead className="text-gray-400">Assigné</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targets.map((t) => {
                    const pct = t.value > 0 ? Math.round((t.achieved / t.value) * 100) : 0
                    const clampedPct = Math.min(pct, 100)
                    const progressClass = getProgressTrack(pct)

                    return (
                      <TableRow
                        key={t.id}
                        className="border-[#1f2937] hover:bg-[#1f2937]/50"
                      >
                        <TableCell className="text-white font-medium">{t.period}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={typeBadgeClasses[t.type] || ''}
                          >
                            {typeLabels[t.type] || t.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {t.type === 'revenue'
                            ? `${t.value.toLocaleString('fr-FR')} €`
                            : t.value.toLocaleString('fr-FR')}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {t.type === 'revenue'
                            ? `${t.achieved.toLocaleString('fr-FR')} €`
                            : t.achieved.toLocaleString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[140px]">
                            <Progress
                              value={clampedPct}
                              className={`h-2 flex-1 bg-[#1f2937] ${progressClass}`}
                            />
                            <span
                              className={`text-xs font-medium min-w-[36px] text-right ${
                                pct >= 100
                                  ? 'text-green-400'
                                  : pct >= 50
                                    ? 'text-blue-400'
                                    : pct >= 1
                                      ? 'text-yellow-400'
                                      : 'text-red-400'
                              }`}
                            >
                              {pct}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {t.agent?.name || (t.agentId ? 'Agent' : '—')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(t)}
                              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#1f2937]"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDelete(t)}
                              className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-[#1f2937]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { resetForm() } setDialogOpen(open) }}>
        <DialogContent className="bg-[#111827] border-[#1f2937] text-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingTarget ? 'Modifier l\'objectif' : 'Nouvel objectif'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Period */}
            <div className="grid gap-2">
              <Label htmlFor="period" className="text-gray-300">Période</Label>
              <Input
                id="period"
                placeholder="2026-Q1"
                value={formPeriod}
                onChange={(e) => setFormPeriod(e.target.value)}
                className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-500"
              />
            </div>

            {/* Type */}
            <div className="grid gap-2">
              <Label className="text-gray-300">Type</Label>
              <Select
                value={formType}
                onValueChange={(v) => setFormType(v as 'revenue' | 'orders' | 'units')}
              >
                <SelectTrigger className="bg-[#0d1117] border-[#1f2937] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-[#1f2937] text-white">
                  <SelectItem value="revenue">Revenu</SelectItem>
                  <SelectItem value="orders">Commandes</SelectItem>
                  <SelectItem value="units">Unités</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Value */}
            <div className="grid gap-2">
              <Label htmlFor="value" className="text-gray-300">Valeur cible</Label>
              <Input
                id="value"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-500"
              />
            </div>

            {/* Achieved */}
            <div className="grid gap-2">
              <Label htmlFor="achieved" className="text-gray-300">Réalisé</Label>
              <Input
                id="achieved"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={formAchieved}
                onChange={(e) => setFormAchieved(e.target.value)}
                className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-500"
              />
            </div>

            {/* Agent */}
            <div className="grid gap-2">
              <Label className="text-gray-300">Agent (optionnel)</Label>
              <Select
                value={formAgentId}
                onValueChange={(v) => setFormAgentId(v === '__none__' ? '' : v)}
              >
                <SelectTrigger className="bg-[#0d1117] border-[#1f2937] text-white">
                  <SelectValue placeholder="Aucun agent" />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-[#1f2937] text-white">
                  <SelectItem value="__none__">Aucun agent</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* House */}
            <div className="grid gap-2">
              <Label className="text-gray-300">Maison (optionnel)</Label>
              <Select
                value={formHouseId}
                onValueChange={(v) => setFormHouseId(v === '__none__' ? '' : v)}
              >
                <SelectTrigger className="bg-[#0d1117] border-[#1f2937] text-white">
                  <SelectValue placeholder="Aucune maison" />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-[#1f2937] text-white">
                  <SelectItem value="__none__">Aucune maison</SelectItem>
                  {houses.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDialogOpen(false); resetForm() }}
              className="border-[#1f2937] text-gray-300 hover:text-white hover:bg-[#1f2937]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingTarget ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-[#111827] border-[#1f2937] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Supprimer l&apos;objectif</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Êtes-vous sûr de vouloir supprimer cet objectif pour la période{' '}
              <span className="text-white font-medium">{deleteTarget?.period}</span> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1f2937] text-gray-300 hover:text-white hover:bg-[#1f2937]">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
