'use client'

import { useState, useEffect } from 'react'
import { can, type Role, type Action } from '@/lib/rbac'
import { useToast } from '@/hooks/use-toast'
import { Shield, CheckCircle, XCircle, Users, Crown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ROLES: Role[] = [
  'super_admin',
  'admin',
  'manager',
  'agent',
  'cashier',
  'viewer',
]

const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrateur',
  manager: 'Manager',
  agent: 'Agent',
  cashier: 'Caissier',
  viewer: 'Observateur',
}

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  super_admin: <Crown className="h-4 w-4 text-amber-400" />,
  admin: <Shield className="h-4 w-4 text-emerald-400" />,
  manager: <Shield className="h-4 w-4 text-sky-400" />,
  agent: <Shield className="h-4 w-4 text-violet-400" />,
  cashier: <Shield className="h-4 w-4 text-orange-400" />,
  viewer: <Shield className="h-4 w-4 text-slate-400" />,
}

const ACTION_LABELS: Record<Action, string> = {
  manage_tenants: 'Tenants',
  manage_users: 'Utilisateurs',
  manage_houses: 'Maisons',
  view_all_houses: 'Voir maisons',
  manage_agents: 'Agents',
  create_orders: 'Créer cmd',
  view_orders: 'Voir cmd',
  validate_orders: 'Valider cmd',
  record_sales: 'Ventes',
  record_payments: 'Paiements',
  view_payments: 'Voir paiements',
  manage_products: 'Produits',
  manage_stock: 'Stock',
  view_commissions: 'Voir comm.',
  validate_commissions: 'Valider comm.',
  manage_targets: 'Objectifs',
  view_dashboard: 'Dashboard',
  view_analytics: 'Analytics',
  access_audit: 'Audit',
}

const ACTION_GROUPS: { label: string; actions: Action[] }[] = [
  {
    label: 'Plateforme',
    actions: [
      'manage_tenants',
      'manage_users',
      'manage_houses',
      'view_all_houses',
      'access_audit',
    ],
  },
  {
    label: 'Business',
    actions: [
      'create_orders',
      'view_orders',
      'validate_orders',
      'record_sales',
      'record_payments',
      'view_payments',
      'manage_agents',
      'manage_products',
      'manage_stock',
      'view_commissions',
      'validate_commissions',
      'manage_targets',
    ],
  },
  {
    label: 'Intelligence',
    actions: ['view_dashboard', 'view_analytics'],
  },
]

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  status: string
}

interface Tenant {
  id: string
  name: string
  status: string
}

/* ------------------------------------------------------------------ */
/*  Status Badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    inactive: 'secondary',
    suspended: 'destructive',
  }
  const labelMap: Record<string, string> = {
    active: 'Actif',
    inactive: 'Inactif',
    suspended: 'Suspendu',
  }
  return (
    <Badge variant={variantMap[status] ?? 'outline'} className="text-xs">
      {labelMap[status] ?? status}
    </Badge>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function RbacView() {
  const { toast } = useToast()

  const [tenantId, setTenantId] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  /* ---------------------------------------------------------------- */
  /*  Fetch tenant on mount                                            */
  /* ---------------------------------------------------------------- */

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
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les tenants.',
          variant: 'destructive',
        })
      }
    }
    loadTenant()
  }, [toast])

  /* ---------------------------------------------------------------- */
  /*  Fetch users when tenantId is available                           */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!tenantId) return

    async function loadUsers() {
      setLoading(true)
      try {
        const res = await fetch(`/api/users?tenantId=${tenantId}`)
        if (!res.ok) throw new Error('Failed to fetch users')
        const data: User[] = await res.json()
        setUsers(data)
      } catch {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les utilisateurs.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [tenantId, toast])

  /* ---------------------------------------------------------------- */
  /*  Group users by role                                              */
  /* ---------------------------------------------------------------- */

  const usersByRole = ROLES.reduce<Record<Role, User[]>>((acc, role) => {
    acc[role] = users.filter((u) => u.role === role)
    return acc
  }, {} as Record<Role, User[]>)

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-8">
      {/* ── Section 1: Permission Matrix ── */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardHeader className="bg-[#0d1117] rounded-t-lg">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-white text-lg">
              Matrice des permissions
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1f2937] hover:bg-transparent">
                  {/* Role column header */}
                  <TableHead className="bg-[#0d1117] text-slate-300 font-semibold min-w-[140px] sticky left-0 z-10">
                    Rôle
                  </TableHead>
                  {/* Action group headers with sub-headers */}
                  {ACTION_GROUPS.map((group) => (
                    <TableHead
                      key={group.label}
                      colSpan={group.actions.length}
                      className="bg-[#0d1117] text-emerald-400 font-semibold text-center border-l border-[#1f2937]"
                    >
                      {group.label}
                    </TableHead>
                  ))}
                </TableRow>
                {/* Sub-header row with action labels */}
                <TableRow className="border-[#1f2937] hover:bg-transparent">
                  <TableHead className="bg-[#0d1117] text-slate-400 text-xs sticky left-0 z-10">
                    &nbsp;
                  </TableHead>
                  {ACTION_GROUPS.map((group) =>
                    group.actions.map((action) => (
                      <TableHead
                        key={action}
                        className="bg-[#0d1117] text-slate-400 text-xs text-center font-medium border-l border-[#1f2937]/50 whitespace-nowrap"
                      >
                        {ACTION_LABELS[action]}
                      </TableHead>
                    ))
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROLES.map((role) => (
                  <TableRow
                    key={role}
                    className="border-[#1f2937] hover:bg-[#1f2937]/30"
                  >
                    {/* Role label cell */}
                    <TableCell className="font-medium text-slate-200 bg-[#111827] sticky left-0 z-10">
                      <div className="flex items-center gap-2">
                        {ROLE_ICONS[role]}
                        <span>{ROLE_LABELS[role]}</span>
                      </div>
                    </TableCell>
                    {/* Permission cells */}
                    {ACTION_GROUPS.map((group) =>
                      group.actions.map((action) => {
                        const permitted = can(role, action)
                        return (
                          <TableCell
                            key={action}
                            className="text-center border-l border-[#1f2937]/50"
                          >
                            {permitted ? (
                              <CheckCircle className="h-4 w-4 text-emerald-400 mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400/50 mx-auto" />
                            )}
                          </TableCell>
                        )
                      })
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 px-4 py-3 border-t border-[#1f2937]">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>Autorisé</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <XCircle className="h-3.5 w-3.5 text-red-400/50" />
              <span>Interdit</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Users by Role ── */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardHeader className="bg-[#0d1117] rounded-t-lg">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-white text-lg">
              Utilisateurs par rôle
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                <span className="text-sm text-slate-400">
                  Chargement des utilisateurs…
                </span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Aucun utilisateur trouvé
            </div>
          ) : (
            <div className="space-y-6">
              {ROLES.map((role, idx) => {
                const roleUsers = usersByRole[role]
                return (
                  <div key={role}>
                    {idx > 0 && (
                      <Separator className="bg-[#1f2937] mb-6" />
                    )}
                    <div className="flex items-center gap-2 mb-4">
                      {ROLE_ICONS[role]}
                      <h3 className="text-white font-semibold text-sm">
                        {ROLE_LABELS[role]}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="bg-[#1f2937] text-slate-300 text-xs"
                      >
                        {roleUsers.length}
                      </Badge>
                    </div>

                    {roleUsers.length === 0 ? (
                      <p className="text-slate-500 text-xs pl-6">
                        Aucun utilisateur avec ce rôle
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-2">
                        {roleUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-[#1f2937] bg-[#0d1117] px-4 py-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-200 truncate">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {user.email}
                              </p>
                            </div>
                            <StatusBadge status={user.status} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
