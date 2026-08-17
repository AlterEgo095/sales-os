'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Settings,
  Building2,
  Users,
  Shield,
  Plus,
  Pencil,
  Globe,
  Database,
  Palette,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Separator } from '@/components/ui/separator'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Tenant {
  id: string
  name: string
  slug: string
  status: string
  settings: string
  createdAt: string
  updatedAt: string
  houses?: HouseBasic[]
}

interface HouseBasic {
  id: string
  name: string
}

interface House {
  id: string
  tenantId: string
  name: string
  code: string
  address?: string | null
  city?: string | null
  country?: string | null
  managerId?: string | null
  status: string
  createdAt: string
  updatedAt: string
  manager?: {
    id: string
    firstName: string
    lastName: string
  } | null
}

interface User {
  id: string
  tenantId: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  lastLogin?: string | null
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrateur',
  manager: 'Manager',
  agent: 'Agent',
  cashier: 'Caissier',
  viewer: 'Observateur',
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
  admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30',
  manager: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
  agent: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
  cashier: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30',
  viewer: 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  suspended: 'Suspendu',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30',
  inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30',
  suspended: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
}

const IMPL_STATUS_COLORS: Record<string, string> = {
  IMPLEMENTE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  PREPARE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  DIFFERE: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const PLATFORM_ITEMS = [
  { label: 'Auth', desc: 'NextAuth v4 avec credentials', status: 'IMPLEMENTE' },
  { label: 'RBAC', desc: '6 roles, 18 permissions', status: 'IMPLEMENTE' },
  { label: 'Multi-tenant', desc: 'Isolation par tenantId', status: 'IMPLEMENTE' },
  { label: 'Audit Log', desc: 'Trail complet des actions', status: 'IMPLEMENTE' },
  { label: 'Commission Engine', desc: 'Moteur de calcul des commissions', status: 'IMPLEMENTE' },
  { label: 'Order Engine', desc: "Moteur de gestion des commandes", status: 'IMPLEMENTE' },
  { label: 'Event System', desc: 'Redis pub/sub pour événements', status: 'PREPARE' },
  { label: 'i18n', desc: 'Français (défaut), English (préparé)', status: 'PREPARE' },
  { label: 'CI/CD', desc: 'Pipeline de déploiement continu', status: 'DIFFERE' },
]

// ---------------------------------------------------------------------------
// House form
// ---------------------------------------------------------------------------

interface HouseForm {
  name: string
  code: string
  city: string
  country: string
  status: string
}

const emptyHouseForm: HouseForm = {
  name: '',
  code: '',
  city: '',
  country: '',
  status: 'active',
}

// ---------------------------------------------------------------------------
// User edit form
// ---------------------------------------------------------------------------

interface UserEditForm {
  role: string
  status: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SettingsView() {
  const { toast } = useToast()

  // Tenant
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [tenantLoading, setTenantLoading] = useState(true)

  // Tenant edit
  const [tenantEditOpen, setTenantEditOpen] = useState(false)
  const [tenantEditForm, setTenantEditForm] = useState({ name: '', status: 'active' })
  const [tenantSaving, setTenantSaving] = useState(false)

  // Houses
  const [houses, setHouses] = useState<House[]>([])
  const [housesLoading, setHousesLoading] = useState(true)

  // House dialog
  const [houseDialogOpen, setHouseDialogOpen] = useState(false)
  const [editingHouse, setEditingHouse] = useState<House | null>(null)
  const [houseForm, setHouseForm] = useState<HouseForm>(emptyHouseForm)
  const [houseSaving, setHouseSaving] = useState(false)

  // Users
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)

  // User edit dialog
  const [userEditOpen, setUserEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userEditForm, setUserEditForm] = useState<UserEditForm>({ role: 'viewer', status: 'active' })
  const [userSaving, setUserSaving] = useState(false)

  // -------------------------------------------------------------------------
  // Fetch tenant on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function loadTenant() {
      setTenantLoading(true)
      try {
        const res = await fetch('/api/tenants')
        if (!res.ok) throw new Error('Failed')
        const tenants: Tenant[] = await res.json()
        const active = tenants.find((t) => t.status === 'active') ?? tenants[0]
        if (active) {
          setTenant(active)
          setTenantId(active.id)
        }
      } catch {
        toast({ title: 'Erreur', description: 'Impossible de charger les tenants.', variant: 'destructive' })
      } finally {
        setTenantLoading(false)
      }
    }
    loadTenant()
  }, [toast])

  // -------------------------------------------------------------------------
  // Fetch houses
  // -------------------------------------------------------------------------

  const fetchHouses = useCallback(async () => {
    if (!tenantId) return
    setHousesLoading(true)
    try {
      const res = await fetch(`/api/houses?tenantId=${tenantId}`)
      if (!res.ok) throw new Error('Failed')
      const data: House[] = await res.json()
      setHouses(data)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les maisons.', variant: 'destructive' })
    } finally {
      setHousesLoading(false)
    }
  }, [tenantId, toast])

  useEffect(() => {
    fetchHouses()
  }, [fetchHouses])

  // -------------------------------------------------------------------------
  // Fetch users
  // -------------------------------------------------------------------------

  const fetchUsers = useCallback(async () => {
    if (!tenantId) return
    setUsersLoading(true)
    try {
      const res = await fetch(`/api/users?tenantId=${tenantId}`)
      if (!res.ok) throw new Error('Failed')
      const data: User[] = await res.json()
      setUsers(data)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les utilisateurs.', variant: 'destructive' })
    } finally {
      setUsersLoading(false)
    }
  }, [tenantId, toast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // -------------------------------------------------------------------------
  // Tenant edit
  // -------------------------------------------------------------------------

  function openTenantEdit() {
    if (!tenant) return
    setTenantEditForm({ name: tenant.name, status: tenant.status })
    setTenantEditOpen(true)
  }

  async function handleTenantSave() {
    if (!tenant) return
    if (!tenantEditForm.name.trim()) {
      toast({ title: 'Validation', description: 'Le nom est requis.', variant: 'destructive' })
      return
    }
    setTenantSaving(true)
    try {
      const res = await fetch(`/api/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tenantEditForm.name.trim(),
          status: tenantEditForm.status,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const updated: Tenant = await res.json()
      setTenant(updated)
      setTenantEditOpen(false)
      toast({ title: 'Tenant modifié', description: `${updated.name} a été mis à jour.` })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le tenant.', variant: 'destructive' })
    } finally {
      setTenantSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // House create / edit
  // -------------------------------------------------------------------------

  function openHouseCreate() {
    setEditingHouse(null)
    setHouseForm(emptyHouseForm)
    setHouseDialogOpen(true)
  }

  function openHouseEdit(house: House) {
    setEditingHouse(house)
    setHouseForm({
      name: house.name,
      code: house.code,
      city: house.city ?? '',
      country: house.country ?? '',
      status: house.status,
    })
    setHouseDialogOpen(true)
  }

  async function handleHouseSave() {
    if (!houseForm.name.trim()) {
      toast({ title: 'Validation', description: 'Le nom est requis.', variant: 'destructive' })
      return
    }
    if (!houseForm.code.trim()) {
      toast({ title: 'Validation', description: 'Le code est requis.', variant: 'destructive' })
      return
    }

    setHouseSaving(true)
    try {
      if (editingHouse) {
        // Update
        const res = await fetch(`/api/houses/${editingHouse.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: houseForm.name.trim(),
            code: houseForm.code.trim(),
            city: houseForm.city.trim() || null,
            country: houseForm.country.trim() || null,
            status: houseForm.status,
          }),
        })
        if (!res.ok) throw new Error('Failed')
        toast({ title: 'Maison modifiée', description: `${houseForm.name} a été mise à jour.` })
      } else {
        // Create
        if (!tenantId) return
        const res = await fetch('/api/houses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId,
            name: houseForm.name.trim(),
            code: houseForm.code.trim(),
            city: houseForm.city.trim() || null,
            country: houseForm.country.trim() || null,
          }),
        })
        if (!res.ok) throw new Error('Failed')
        toast({ title: 'Maison créée', description: `${houseForm.name} a été ajoutée.` })
      }
      setHouseDialogOpen(false)
      setEditingHouse(null)
      setHouseForm(emptyHouseForm)
      fetchHouses()
    } catch {
      toast({ title: 'Erreur', description: "Impossible d'enregistrer la maison.", variant: 'destructive' })
    } finally {
      setHouseSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // User edit
  // -------------------------------------------------------------------------

  function openUserEdit(user: User) {
    setEditingUser(user)
    setUserEditForm({ role: user.role, status: user.status })
    setUserEditOpen(true)
  }

  async function handleUserSave() {
    if (!editingUser) return
    setUserSaving(true)
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: userEditForm.role,
          status: userEditForm.status,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({
        title: 'Utilisateur modifié',
        description: `${editingUser.firstName} ${editingUser.lastName} a été mis à jour.`,
      })
      setUserEditOpen(false)
      setEditingUser(null)
      fetchUsers()
    } catch {
      toast({ title: 'Erreur', description: "Impossible de modifier l'utilisateur.", variant: 'destructive' })
    } finally {
      setUserSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Format date
  // -------------------------------------------------------------------------

  function formatDate(dateStr?: string | null): string {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f2937]">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Paramètres</h1>
          <p className="text-sm text-gray-400">Configuration de la plateforme SALES OS</p>
        </div>
      </div>

      {/* ── Section 1: Tenant Info ──────────────────────────────────────── */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-400" />
              Informations du tenant
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-[#1f2937] gap-1.5"
              onClick={openTenantEdit}
              disabled={!tenant}
            >
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tenantLoading ? (
            <p className="text-sm text-gray-400">Chargement...</p>
          ) : tenant ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Nom</p>
                <p className="text-sm font-medium text-white">{tenant.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Slug</p>
                <p className="text-sm font-mono text-gray-300">{tenant.slug}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Statut</p>
                <Badge variant="outline" className={STATUS_COLORS[tenant.status] ?? STATUS_COLORS.inactive}>
                  {STATUS_LABELS[tenant.status] ?? tenant.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Créé le</p>
                <p className="text-sm text-gray-300">{formatDate(tenant.createdAt)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucun tenant trouvé.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Section 2: Maisons (Houses) ─────────────────────────────────── */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-400" />
              Maisons
              <span className="text-gray-500 font-normal">({houses.length})</span>
            </CardTitle>
            <Button
              onClick={openHouseCreate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Nouvelle maison
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#0d1117] hover:bg-[#0d1117] border-[#1f2937]">
                  <TableHead className="text-gray-400 font-semibold">Nom</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Code</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Ville</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Pays</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Manager</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Statut</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {housesLoading ? (
                  <TableRow className="border-[#1f2937]">
                    <TableCell colSpan={7} className="text-center text-gray-400 py-12">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : houses.length === 0 ? (
                  <TableRow className="border-[#1f2937]">
                    <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                      Aucune maison enregistrée.
                    </TableCell>
                  </TableRow>
                ) : (
                  houses.map((house) => (
                    <TableRow key={house.id} className="border-[#1f2937] hover:bg-[#1f2937]/50">
                      <TableCell className="text-white font-medium">{house.name}</TableCell>
                      <TableCell className="text-gray-300 font-mono">{house.code}</TableCell>
                      <TableCell className="text-gray-300">{house.city ?? '—'}</TableCell>
                      <TableCell className="text-gray-300">{house.country ?? '—'}</TableCell>
                      <TableCell className="text-gray-300">
                        {house.manager
                          ? `${house.manager.firstName} ${house.manager.lastName}`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[house.status] ?? STATUS_COLORS.inactive}>
                          {STATUS_LABELS[house.status] ?? house.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#1f2937]"
                          onClick={() => openHouseEdit(house)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Utilisateurs (Users) ─────────────────────────────── */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-400" />
            Utilisateurs
            <span className="text-gray-500 font-normal">({users.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#0d1117] hover:bg-[#0d1117] border-[#1f2937]">
                  <TableHead className="text-gray-400 font-semibold">Nom</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Email</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Rôle</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Statut</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Dernière connexion</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow className="border-[#1f2937]">
                    <TableCell colSpan={6} className="text-center text-gray-400 py-12">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow className="border-[#1f2937]">
                    <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                      Aucun utilisateur enregistré.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="border-[#1f2937] hover:bg-[#1f2937]/50">
                      <TableCell className="text-white font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell className="text-gray-300">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ROLE_COLORS[user.role] ?? ROLE_COLORS.viewer}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[user.status] ?? STATUS_COLORS.inactive}>
                          {STATUS_LABELS[user.status] ?? user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {formatDate(user.lastLogin)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#1f2937]"
                          onClick={() => openUserEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 4: Plateforme Status ────────────────────────────────── */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-400" />
            Statut de la plateforme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {PLATFORM_ITEMS.map((item, idx) => (
            <div key={item.label}>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[#0d1117]/50">
                <div className="flex items-center gap-3">
                  {idx < 6 ? (
                    <Database className="h-4 w-4 text-gray-500" />
                  ) : idx < 8 ? (
                    <Palette className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Globe className="h-4 w-4 text-gray-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] ${IMPL_STATUS_COLORS[item.status]}`}>
                  {item.status}
                </Badge>
              </div>
              {idx < PLATFORM_ITEMS.length - 1 && (
                <Separator className="bg-[#1f2937]/50 my-0.5" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Tenant Edit Dialog ──────────────────────────────────────────── */}
      <Dialog
        open={tenantEditOpen}
        onOpenChange={(open) => {
          setTenantEditOpen(open)
          if (!open) setTenantEditForm({ name: '', status: 'active' })
        }}
      >
        <DialogContent className="bg-[#111827] border-[#1f2937] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Modifier le tenant</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-gray-400">Nom *</Label>
              <Input
                value={tenantEditForm.name}
                onChange={(e) => setTenantEditForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-600/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Statut</Label>
              <Select
                value={tenantEditForm.status}
                onValueChange={(v) => setTenantEditForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger className="bg-[#0d1117] border-[#1f2937] text-white w-full focus:ring-emerald-600/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-[#1f2937] text-white">
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-[#1f2937] text-gray-400 hover:text-white hover:bg-[#1f2937]"
              onClick={() => setTenantEditOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleTenantSave}
              disabled={tenantSaving}
            >
              {tenantSaving ? 'Enregistrement...' : 'Modifier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── House Create / Edit Dialog ──────────────────────────────────── */}
      <Dialog
        open={houseDialogOpen}
        onOpenChange={(open) => {
          setHouseDialogOpen(open)
          if (!open) {
            setEditingHouse(null)
            setHouseForm(emptyHouseForm)
          }
        }}
      >
        <DialogContent className="bg-[#111827] border-[#1f2937] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingHouse ? 'Modifier la maison' : 'Nouvelle maison'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Nom *</Label>
                <Input
                  value={houseForm.name}
                  onChange={(e) => setHouseForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Maison Dakar"
                  className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-600/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Code *</Label>
                <Input
                  value={houseForm.code}
                  onChange={(e) => setHouseForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="DKR"
                  className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-600/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Ville</Label>
                <Input
                  value={houseForm.city}
                  onChange={(e) => setHouseForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Dakar"
                  className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-600/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Pays</Label>
                <Input
                  value={houseForm.country}
                  onChange={(e) => setHouseForm((f) => ({ ...f, country: e.target.value }))}
                  placeholder="Sénégal"
                  className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-600/50"
                />
              </div>
            </div>
            {editingHouse && (
              <div className="space-y-2">
                <Label className="text-gray-400">Statut</Label>
                <Select
                  value={houseForm.status}
                  onValueChange={(v) => setHouseForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger className="bg-[#0d1117] border-[#1f2937] text-white w-full focus:ring-emerald-600/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1f2937] text-white">
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="suspended">Suspendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-[#1f2937] text-gray-400 hover:text-white hover:bg-[#1f2937]"
              onClick={() => {
                setHouseDialogOpen(false)
                setEditingHouse(null)
                setHouseForm(emptyHouseForm)
              }}
            >
              Annuler
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleHouseSave}
              disabled={houseSaving}
            >
              {houseSaving ? 'Enregistrement...' : editingHouse ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── User Edit Dialog ────────────────────────────────────────────── */}
      <Dialog
        open={userEditOpen}
        onOpenChange={(open) => {
          setUserEditOpen(open)
          if (!open) setEditingUser(null)
        }}
      >
        <DialogContent className="bg-[#111827] border-[#1f2937] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              Modifier l&apos;utilisateur
            </DialogTitle>
          </DialogHeader>

          {editingUser && (
            <div className="grid gap-4 py-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">
                  {editingUser.firstName} {editingUser.lastName}
                </p>
                <p className="text-xs text-gray-500">{editingUser.email}</p>
              </div>

              <Separator className="bg-[#1f2937]" />

              <div className="space-y-2">
                <Label className="text-gray-400">Rôle</Label>
                <Select
                  value={userEditForm.role}
                  onValueChange={(v) => setUserEditForm((f) => ({ ...f, role: v }))}
                >
                  <SelectTrigger className="bg-[#0d1117] border-[#1f2937] text-white w-full focus:ring-emerald-600/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1f2937] text-white">
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="cashier">Caissier</SelectItem>
                    <SelectItem value="viewer">Observateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Statut</Label>
                <Select
                  value={userEditForm.status}
                  onValueChange={(v) => setUserEditForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger className="bg-[#0d1117] border-[#1f2937] text-white w-full focus:ring-emerald-600/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1f2937] text-white">
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="suspended">Suspendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="border-[#1f2937] text-gray-400 hover:text-white hover:bg-[#1f2937]"
              onClick={() => setUserEditOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleUserSave}
              disabled={userSaving}
            >
              {userSaving ? 'Enregistrement...' : 'Modifier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
