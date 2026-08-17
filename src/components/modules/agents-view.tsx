'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, UserCircle, Percent } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AgentStatus = 'active' | 'inactive'

interface Agent {
  id: string
  tenantId: string
  userId: string
  houseId: string
  code: string
  commissionRate: number
  status: AgentStatus
  createdAt: string
  updatedAt: string
  user?: User
  house?: House
}

interface User {
  id: string
  firstName: string
  lastName: string
}

interface House {
  id: string
  name: string
}

interface Tenant {
  id: string
  name: string
  status: string
  houses?: { id: string }[]
}

interface FormData {
  userId: string
  houseId: string
  code: string
  commissionRate: string
  status: AgentStatus
}

const emptyForm: FormData = {
  userId: '',
  houseId: '',
  code: '',
  commissionRate: '0',
  status: 'active',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentsView() {
  const { toast } = useToast()

  // Tenant context
  const [tenantId, setTenantId] = useState<string | null>(null)

  // Agents data
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  // Dropdown data
  const [users, setUsers] = useState<User[]>([])
  const [houses, setHouses] = useState<House[]>([])

  // Create / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null)
  const [deleting, setDeleting] = useState(false)

  // -------------------------------------------------------------------------
  // Fetch tenant on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function loadTenant() {
      try {
        const res = await fetch('/api/tenants')
        if (!res.ok) throw new Error('Failed to fetch tenants')
        const tenants: Tenant[] = await res.json()
        const active = tenants.find((t) => t.status === 'active') ?? tenants[0]
        if (active) {
          setTenantId(active.id)
        }
      } catch {
        toast({ title: 'Erreur', description: 'Impossible de charger les tenants.', variant: 'destructive' })
      }
    }
    loadTenant()
  }, [toast])

  // -------------------------------------------------------------------------
  // Fetch agents
  // -------------------------------------------------------------------------

  const fetchAgents = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/agents?tenantId=${tenantId}`)
      if (!res.ok) throw new Error('Failed to fetch agents')
      const data: Agent[] = await res.json()
      setAgents(data)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les agents.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [tenantId, toast])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  // -------------------------------------------------------------------------
  // Fetch users & houses for dropdowns
  // -------------------------------------------------------------------------

  const fetchDropdownData = useCallback(async () => {
    if (!tenantId) return
    try {
      const [usersRes, housesRes] = await Promise.all([
        fetch(`/api/users?tenantId=${tenantId}`),
        fetch(`/api/houses?tenantId=${tenantId}`),
      ])
      if (usersRes.ok) {
        const usersData: User[] = await usersRes.json()
        setUsers(usersData)
      }
      if (housesRes.ok) {
        const housesData: House[] = await housesRes.json()
        setHouses(housesData)
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les données de référence.', variant: 'destructive' })
    }
  }, [tenantId, toast])

  useEffect(() => {
    fetchDropdownData()
  }, [fetchDropdownData])

  // -------------------------------------------------------------------------
  // Lookup helpers
  // -------------------------------------------------------------------------

  function getUserName(userId: string): string {
    const user = users.find((u) => u.id === userId)
    if (user) return `${user.firstName} ${user.lastName}`
    // Fallback: the agent may have a populated user object
    const agent = agents.find((a) => a.userId === userId && a.user)
    if (agent?.user) return `${agent.user.firstName} ${agent.user.lastName}`
    return userId
  }

  function getHouseName(houseId: string): string {
    const house = houses.find((h) => h.id === houseId)
    if (house) return house.name
    // Fallback: the agent may have a populated house object
    const agent = agents.find((a) => a.houseId === houseId && a.house)
    if (agent?.house) return agent.house.name
    return houseId
  }

  // -------------------------------------------------------------------------
  // Create / Update
  // -------------------------------------------------------------------------

  async function handleSave() {
    if (!form.userId) {
      toast({ title: 'Validation', description: "L'utilisateur est requis.", variant: 'destructive' })
      return
    }
    if (!form.houseId) {
      toast({ title: 'Validation', description: 'La maison est requise.', variant: 'destructive' })
      return
    }
    if (!form.code.trim()) {
      toast({ title: 'Validation', description: "Le code agent est requis.", variant: 'destructive' })
      return
    }

    const commissionRate = parseFloat(form.commissionRate) || 0

    setSaving(true)
    try {
      if (editingAgent) {
        // Update
        const res = await fetch(`/api/agents/${editingAgent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: form.userId,
            houseId: form.houseId,
            code: form.code.trim(),
            commissionRate,
            status: form.status,
          }),
        })
        if (!res.ok) throw new Error('Update failed')
        toast({ title: 'Agent modifié', description: `${form.code} a été mis à jour.` })
      } else {
        // Create
        if (!tenantId) return
        const res = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId,
            userId: form.userId,
            houseId: form.houseId,
            code: form.code.trim(),
            commissionRate,
          }),
        })
        if (!res.ok) throw new Error('Create failed')
        toast({ title: 'Agent créé', description: `${form.code} a été ajouté.` })
      }
      setDialogOpen(false)
      setEditingAgent(null)
      setForm(emptyForm)
      fetchAgents()
    } catch {
      toast({ title: 'Erreur', description: "Impossible d'enregistrer l'agent.", variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  async function handleDelete() {
    if (!deletingAgent) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/agents/${deletingAgent.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast({ title: 'Agent supprimé', description: `${deletingAgent.code} a été supprimé.` })
      setDeleteOpen(false)
      setDeletingAgent(null)
      fetchAgents()
    } catch {
      toast({ title: 'Erreur', description: "Impossible de supprimer l'agent.", variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  // -------------------------------------------------------------------------
  // Dialog helpers
  // -------------------------------------------------------------------------

  function openCreate() {
    setEditingAgent(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(agent: Agent) {
    setEditingAgent(agent)
    setForm({
      userId: agent.userId,
      houseId: agent.houseId,
      code: agent.code,
      commissionRate: String(agent.commissionRate),
      status: agent.status,
    })
    setDialogOpen(true)
  }

  function openDelete(agent: Agent) {
    setDeletingAgent(agent)
    setDeleteOpen(true)
  }

  // -------------------------------------------------------------------------
  // Badge helpers
  // -------------------------------------------------------------------------

  function statusBadge(status: AgentStatus) {
    if (status === 'active') {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">Actif</Badge>
    }
    return <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30">Inactif</Badge>
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f2937]">
            <UserCircle className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <span className="text-sm text-gray-400">({agents.length})</span>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          Nouvel agent
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">Liste des agents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#0d1117] hover:bg-[#0d1117] border-[#1f2937]">
                  <TableHead className="text-gray-400 font-semibold">Code</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Utilisateur</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Maison</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Commission</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Statut</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="border-[#1f2937]">
                    <TableCell colSpan={6} className="text-center text-gray-400 py-12">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : agents.length === 0 ? (
                  <TableRow className="border-[#1f2937]">
                    <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                      Aucun agent enregistré.
                    </TableCell>
                  </TableRow>
                ) : (
                  agents.map((agent) => (
                    <TableRow key={agent.id} className="border-[#1f2937] hover:bg-[#1f2937]/50">
                      <TableCell className="text-white font-medium">
                        {agent.code}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {getUserName(agent.userId)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {getHouseName(agent.houseId)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <span className="flex items-center gap-1.5">
                          <Percent className="h-3.5 w-3.5 text-gray-500" />
                          {agent.commissionRate}%
                        </span>
                      </TableCell>
                      <TableCell>{statusBadge(agent.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#1f2937]"
                            onClick={() => openEdit(agent)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => openDelete(agent)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingAgent(null); setForm(emptyForm) } }}>
        <DialogContent className="bg-[#111827] border-[#1f2937] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingAgent ? "Modifier l'agent" : 'Nouvel agent'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* User Select */}
            <div className="space-y-2">
              <Label className="text-gray-400">Utilisateur *</Label>
              <Select
                value={form.userId}
                onValueChange={(v) => setForm((f) => ({ ...f, userId: v }))}
              >
                <SelectTrigger className="bg-[#0d1117] border-[#1f2937] text-white w-full focus:ring-emerald-600/50">
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-[#1f2937] text-white">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* House Select */}
            <div className="space-y-2">
              <Label className="text-gray-400">Maison *</Label>
              <Select
                value={form.houseId}
                onValueChange={(v) => setForm((f) => ({ ...f, houseId: v }))}
              >
                <SelectTrigger className="bg-[#0d1117] border-[#1f2937] text-white w-full focus:ring-emerald-600/50">
                  <SelectValue placeholder="Sélectionner une maison" />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-[#1f2937] text-white">
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      {house.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Code & Commission Rate */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Code agent *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="AG-001"
                  className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-600/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Commission (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.commissionRate}
                    onChange={(e) => setForm((f) => ({ ...f, commissionRate: e.target.value }))}
                    placeholder="0"
                    className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-600/50 pr-8"
                  />
                  <Percent className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-gray-400">Statut</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as AgentStatus }))}
              >
                <SelectTrigger className="bg-[#0d1117] border-[#1f2937] text-white w-full focus:ring-emerald-600/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-[#1f2937] text-white">
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-[#1f2937] text-gray-400 hover:text-white hover:bg-[#1f2937]"
              onClick={() => { setDialogOpen(false); setEditingAgent(null); setForm(emptyForm) }}
            >
              Annuler
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : editingAgent ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeletingAgent(null) }}>
        <AlertDialogContent className="bg-[#111827] border-[#1f2937] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Supprimer l&apos;agent</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Êtes-vous sûr de vouloir supprimer l&apos;agent{' '}
              <span className="font-semibold text-white">
                {deletingAgent?.code}
              </span>
              {' '}? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1f2937] text-gray-400 hover:text-white hover:bg-[#1f2937]">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
