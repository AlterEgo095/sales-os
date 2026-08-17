'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Users, Phone, Mail, Search } from 'lucide-react'
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

type OrderSource = 'manual' | 'digital' | 'referral'
type CustomerStatus = 'active' | 'inactive'

interface Customer {
  id: string
  tenantId: string
  houseId: string
  firstName: string
  lastName: string
  phone: string | null
  email: string | null
  address: string | null
  orderSource: OrderSource
  status: CustomerStatus
  createdAt: string
  updatedAt: string
}

interface Tenant {
  id: string
  name: string
  status: string
  houses?: { id: string }[]
}

interface FormData {
  firstName: string
  lastName: string
  phone: string
  email: string
  address: string
  orderSource: OrderSource
  status: CustomerStatus
}

const emptyForm: FormData = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  address: '',
  orderSource: 'manual',
  status: 'active',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomersView() {
  const { toast } = useToast()

  // Tenant context
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [houseId, setHouseId] = useState<string | null>(null)

  // Customers data
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  // Search
  const [search, setSearch] = useState('')

  // Create / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
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
          const firstHouse = active.houses?.[0]
          if (firstHouse) setHouseId(firstHouse.id)
        }
      } catch {
        toast({ title: 'Erreur', description: 'Impossible de charger les tenants.', variant: 'destructive' })
      }
    }
    loadTenant()
  }, [toast])

  // -------------------------------------------------------------------------
  // Fetch customers
  // -------------------------------------------------------------------------

  const fetchCustomers = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/customers?tenantId=${tenantId}`)
      if (!res.ok) throw new Error('Failed to fetch customers')
      const data: Customer[] = await res.json()
      setCustomers(data)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les clients.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [tenantId, toast])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // -------------------------------------------------------------------------
  // Create / Update
  // -------------------------------------------------------------------------

  async function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast({ title: 'Validation', description: 'Le prénom et le nom sont requis.', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      if (editingCustomer) {
        // Update
        const res = await fetch(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            phone: form.phone.trim() || null,
            email: form.email.trim() || null,
            address: form.address.trim() || null,
            orderSource: form.orderSource,
            status: form.status,
          }),
        })
        if (!res.ok) throw new Error('Update failed')
        toast({ title: 'Client modifié', description: `${form.firstName} ${form.lastName} a été mis à jour.` })
      } else {
        // Create
        if (!tenantId || !houseId) {
          toast({ title: 'Erreur', description: 'Impossible de résoudre le contexte tenant/maison.', variant: 'destructive' })
          return
        }
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId,
            houseId,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            phone: form.phone.trim() || undefined,
            email: form.email.trim() || undefined,
            address: form.address.trim() || undefined,
            orderSource: form.orderSource,
          }),
        })
        if (!res.ok) throw new Error('Create failed')
        toast({ title: 'Client créé', description: `${form.firstName} ${form.lastName} a été ajouté.` })
      }
      setDialogOpen(false)
      setEditingCustomer(null)
      setForm(emptyForm)
      fetchCustomers()
    } catch {
      toast({ title: 'Erreur', description: "Impossible d'enregistrer le client.", variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  async function handleDelete() {
    if (!deletingCustomer) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/customers/${deletingCustomer.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast({ title: 'Client supprimé', description: `${deletingCustomer.firstName} ${deletingCustomer.lastName} a été supprimé.` })
      setDeleteOpen(false)
      setDeletingCustomer(null)
      fetchCustomers()
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer le client.', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  // -------------------------------------------------------------------------
  // Dialog helpers
  // -------------------------------------------------------------------------

  function openCreate() {
    setEditingCustomer(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(customer: Customer) {
    setEditingCustomer(customer)
    setForm({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      address: customer.address ?? '',
      orderSource: customer.orderSource,
      status: customer.status,
    })
    setDialogOpen(true)
  }

  function openDelete(customer: Customer) {
    setDeletingCustomer(customer)
    setDeleteOpen(true)
  }

  // -------------------------------------------------------------------------
  // Filtering
  // -------------------------------------------------------------------------

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      (c.phone ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    )
  })

  // -------------------------------------------------------------------------
  // Badge helpers
  // -------------------------------------------------------------------------

  function statusBadge(status: CustomerStatus) {
    if (status === 'active') {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">Actif</Badge>
    }
    return <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30">Inactif</Badge>
  }

  function sourceBadge(source: OrderSource) {
    switch (source) {
      case 'digital':
        return <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 hover:bg-sky-500/30">Digital</Badge>
      case 'referral':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30">Referral</Badge>
      default:
        return <Badge variant="secondary" className="bg-gray-500/20 text-gray-300 border-gray-500/30 hover:bg-gray-500/30">Manuel</Badge>
    }
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
            <Users className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <span className="text-sm text-gray-400">({customers.length})</span>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          Nouveau client
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-[#111827] border-[#1f2937] text-white placeholder:text-gray-500 focus-visible:ring-emerald-600/50"
        />
      </div>

      {/* Table */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">Liste des clients</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#0d1117] hover:bg-[#0d1117] border-[#1f2937]">
                  <TableHead className="text-gray-400 font-semibold">Nom</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Téléphone</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Email</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Source</TableHead>
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
                ) : filtered.length === 0 ? (
                  <TableRow className="border-[#1f2937]">
                    <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                      {search ? 'Aucun client trouvé.' : 'Aucun client enregistré.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((customer) => (
                    <TableRow key={customer.id} className="border-[#1f2937] hover:bg-[#1f2937]/50">
                      <TableCell className="text-white font-medium">
                        {customer.firstName} {customer.lastName}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {customer.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-gray-500" />
                            {customer.phone}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {customer.email ? (
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-gray-500" />
                            {customer.email}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </TableCell>
                      <TableCell>{sourceBadge(customer.orderSource)}</TableCell>
                      <TableCell>{statusBadge(customer.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#1f2937]"
                            onClick={() => openEdit(customer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => openDelete(customer)}
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
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingCustomer(null); setForm(emptyForm) } }}>
        <DialogContent className="bg-[#111827] border-[#1f2937] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingCustomer ? 'Modifier le client' : 'Nouveau client'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Prénom *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="Prénom"
                  className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-600/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Nom *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="Nom"
                  className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-600/50"
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Téléphone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+33 6 00 00 00 00"
                  className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-600/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                  className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-600/50"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label className="text-gray-400">Adresse</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Adresse complète"
                className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-600/50"
              />
            </div>

            {/* Order Source & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Source</Label>
                <Select
                  value={form.orderSource}
                  onValueChange={(v) => setForm((f) => ({ ...f, orderSource: v as OrderSource }))}
                >
                  <SelectTrigger className="bg-[#0d1117] border-[#1f2937] text-white w-full focus:ring-emerald-600/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1f2937] text-white">
                    <SelectItem value="manual">Manuel</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Statut</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as CustomerStatus }))}
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-[#1f2937] text-gray-400 hover:text-white hover:bg-[#1f2937]"
              onClick={() => { setDialogOpen(false); setEditingCustomer(null); setForm(emptyForm) }}
            >
              Annuler
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : editingCustomer ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeletingCustomer(null) }}>
        <AlertDialogContent className="bg-[#111827] border-[#1f2937] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Supprimer le client</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Êtes-vous sûr de vouloir supprimer{' '}
              <span className="font-semibold text-white">
                {deletingCustomer?.firstName} {deletingCustomer?.lastName}
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
