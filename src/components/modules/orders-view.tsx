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
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Plus,
  ShoppingCart,
  ArrowRight,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Trash2,
  Loader2,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

// --- Types ---
interface Customer {
  id: string
  name: string
  email?: string
}

interface Product {
  id: string
  name: string
  price: number
}

interface Agent {
  id: string
  name: string
}

interface OrderItem {
  productId: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

interface Order {
  id: string
  customerId: string
  customer?: Customer
  houseId: string
  source: 'client' | 'agent' | 'digital'
  agentId?: string
  agent?: Agent
  sellerId?: string
  currency?: string
  notes?: string
  items: OrderItem[]
  status: 'draft' | 'formalized' | 'confirmed' | 'completed' | 'cancelled'
  totalAmount?: number
  createdAt: string
  updatedAt: string
}

interface TenantInfo {
  id: string
  houseId: string
}

// --- Status helpers ---
const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }
> = {
  draft: { label: 'Brouillon', variant: 'secondary', className: 'bg-gray-600 text-gray-100 hover:bg-gray-600' },
  formalized: { label: 'Formalisée', variant: 'secondary', className: 'bg-yellow-600 text-yellow-100 hover:bg-yellow-600' },
  confirmed: { label: 'Confirmée', variant: 'secondary', className: 'bg-blue-600 text-blue-100 hover:bg-blue-600' },
  completed: { label: 'Complétée', variant: 'secondary', className: 'bg-green-600 text-green-100 hover:bg-green-600' },
  cancelled: { label: 'Annulée', variant: 'destructive', className: 'bg-red-600 text-red-100 hover:bg-red-600' },
}

const sourceLabels: Record<string, string> = {
  client: 'Client',
  agent: 'Agent',
  digital: 'Digital',
}

const statusTransitions: Record<string, { next: string; label: string } | null> = {
  draft: { next: 'formalized', label: 'Formaliser' },
  formalized: { next: 'confirmed', label: 'Confirmer' },
  confirmed: { next: 'completed', label: 'Completer' },
  completed: null,
  cancelled: null,
}

// --- Component ---
export function OrdersView() {
  // Core data
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null)

  // Loading states
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [transitioning, setTransitioning] = useState<string | null>(null)

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Create form state
  const [formCustomerId, setFormCustomerId] = useState('')
  const [formSource, setFormSource] = useState<'client' | 'agent' | 'digital'>('client')
  const [formAgentId, setFormAgentId] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formItems, setFormItems] = useState<
    { productId: string; quantity: number; unitPrice: number; discount: number }[]
  >([{ productId: '', quantity: 1, unitPrice: 0, discount: 0 }])

  // --- Fetch tenant ---
  const fetchTenant = useCallback(async () => {
    try {
      const res = await fetch('/api/tenants')
      if (!res.ok) throw new Error('Failed to fetch tenants')
      const data = await res.json()
      if (data && data.length > 0) {
        setTenantInfo({ id: data[0].id, houseId: data[0].houseId || data[0].id })
      } else if (data?.id) {
        setTenantInfo({ id: data.id, houseId: data.houseId || data.id })
      }
    } catch {
      // Tenant fetch failed silently
    }
  }, [])

  // --- Fetch orders ---
  const fetchOrders = useCallback(async () => {
    if (!tenantInfo) return
    setLoading(true)
    try {
      const res = await fetch(`/api/orders?tenantId=${tenantInfo.id}`)
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les commandes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [tenantInfo])

  // --- Fetch customers ---
  const fetchCustomers = useCallback(async () => {
    if (!tenantInfo) return
    try {
      const res = await fetch(`/api/customers?tenantId=${tenantInfo.id}`)
      if (!res.ok) return
      const data = await res.json()
      setCustomers(Array.isArray(data) ? data : [])
    } catch {
      // silent
    }
  }, [tenantInfo])

  // --- Fetch products ---
  const fetchProducts = useCallback(async () => {
    if (!tenantInfo) return
    try {
      const res = await fetch(`/api/products?tenantId=${tenantInfo.id}`)
      if (!res.ok) return
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch {
      // silent
    }
  }, [tenantInfo])

  // --- Fetch agents ---
  const fetchAgents = useCallback(async () => {
    if (!tenantInfo) return
    try {
      const res = await fetch(`/api/agents?tenantId=${tenantInfo.id}`)
      if (!res.ok) return
      const data = await res.json()
      setAgents(Array.isArray(data) ? data : [])
    } catch {
      // silent
    }
  }, [tenantInfo])

  // --- Init ---
  useEffect(() => {
    fetchTenant()
  }, [fetchTenant])

  useEffect(() => {
    if (tenantInfo) {
      fetchOrders()
      fetchCustomers()
      fetchProducts()
      fetchAgents()
    }
  }, [tenantInfo, fetchOrders, fetchCustomers, fetchProducts, fetchAgents])

  // --- Create order ---
  const handleCreate = async () => {
    if (!tenantInfo || !formCustomerId) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un client', variant: 'destructive' })
      return
    }

    const validItems = formItems.filter((i) => i.productId && i.quantity > 0)
    if (validItems.length === 0) {
      toast({ title: 'Erreur', description: 'Ajoutez au moins un article', variant: 'destructive' })
      return
    }

    setCreating(true)
    try {
      const body: Record<string, unknown> = {
        tenantId: tenantInfo.id,
        houseId: tenantInfo.houseId,
        customerId: formCustomerId,
        source: formSource,
        currency: 'EUR',
        notes: formNotes || undefined,
        items: validItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount,
          total: i.quantity * i.unitPrice * (1 - i.discount / 100),
        })),
      }
      if (formAgentId) body.agentId = formAgentId

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to create order')

      toast({ title: 'Commande créée', description: 'La commande a été créée avec succès' })
      setCreateOpen(false)
      resetForm()
      fetchOrders()
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer la commande', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  // --- Status transition ---
  const handleTransition = async (order: Order, newStatus: string) => {
    if (!tenantInfo) return
    setTransitioning(order.id)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, tenantId: tenantInfo.id }),
      })
      if (!res.ok) throw new Error('Failed to update order')

      toast({ title: 'Statut mis à jour', description: `Commande passée à "${statusConfig[newStatus]?.label || newStatus}"` })
      fetchOrders()
      // Also refresh detail if open
      if (selectedOrder?.id === order.id) {
        setSelectedOrder({ ...order, status: newStatus as Order['status'] })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le statut', variant: 'destructive' })
    } finally {
      setTransitioning(null)
    }
  }

  // --- Reset form ---
  const resetForm = () => {
    setFormCustomerId('')
    setFormSource('client')
    setFormAgentId('')
    setFormNotes('')
    setFormItems([{ productId: '', quantity: 1, unitPrice: 0, discount: 0 }])
  }

  // --- Add form item ---
  const addFormItem = () => {
    setFormItems((prev) => [...prev, { productId: '', quantity: 1, unitPrice: 0, discount: 0 }])
  }

  // --- Remove form item ---
  const removeFormItem = (index: number) => {
    setFormItems((prev) => prev.filter((_, i) => i !== index))
  }

  // --- Update form item ---
  const updateFormItem = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setFormItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }
        // Auto-fill unitPrice from product
        if (field === 'productId' && typeof value === 'string') {
          const prod = products.find((p) => p.id === value)
          if (prod) updated.unitPrice = prod.price
        }
        return updated
      })
    )
  }

  // --- Compute form total ---
  const computeFormTotal = () => {
    return formItems.reduce((sum, item) => {
      if (!item.productId) return sum
      return sum + item.quantity * item.unitPrice * (1 - item.discount / 100)
    }, 0)
  }

  // --- Compute order total ---
  const computeOrderTotal = (order: Order) => {
    if (order.totalAmount != null) return order.totalAmount
    return (order.items || []).reduce((sum, item) => sum + (item.total || 0), 0)
  }

  // --- Helpers ---
  const getCustomerName = (order: Order) => {
    if (order.customer?.name) return order.customer.name
    const c = customers.find((c) => c.id === order.customerId)
    return c?.name || order.customerId?.slice(-6) || '—'
  }

  const getProductName = (productId: string) => {
    const p = products.find((p) => p.id === productId)
    return p?.name || productId.slice(-6)
  }

  const getAgentName = (agentId: string) => {
    const a = agents.find((a) => a.id === agentId)
    return a?.name || agentId.slice(-6)
  }

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('fr-FR')
    } catch {
      return '—'
    }
  }

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f2937]">
            <ShoppingCart className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Commandes</h1>
            <p className="text-sm text-gray-400">Gestion des commandes et suivi des statuts</p>
          </div>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvelle commande
        </Button>
      </div>

      {/* Orders Table */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-400" />
            Liste des commandes
            <Badge variant="secondary" className="ml-2 bg-[#1f2937] text-gray-400">
              {orders.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Chargement...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ShoppingCart className="h-12 w-12 mb-3 opacity-50" />
              <p>Aucune commande trouvée</p>
              <p className="text-sm">Créez votre première commande pour commencer</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#1f2937] hover:bg-transparent">
                    <TableHead className="text-gray-400 font-semibold">ID</TableHead>
                    <TableHead className="text-gray-400 font-semibold">Client</TableHead>
                    <TableHead className="text-gray-400 font-semibold text-right">Montant</TableHead>
                    <TableHead className="text-gray-400 font-semibold">Source</TableHead>
                    <TableHead className="text-gray-400 font-semibold">Statut</TableHead>
                    <TableHead className="text-gray-400 font-semibold">Date</TableHead>
                    <TableHead className="text-gray-400 font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const sc = statusConfig[order.status] || statusConfig.draft
                    const transition = statusTransitions[order.status]
                    return (
                      <TableRow key={order.id} className="border-[#1f2937] hover:bg-[#1f2937]/50">
                        <TableCell className="text-gray-300 font-mono text-sm">
                          {order.id.slice(-6).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          {getCustomerName(order)}
                        </TableCell>
                        <TableCell className="text-gray-300 text-right font-mono">
                          {computeOrderTotal(order).toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: order.currency || 'EUR',
                          })}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {sourceLabels[order.source] || order.source}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sc.variant} className={sc.className}>
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View detail */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order)
                                setDetailOpen(true)
                              }}
                              className="text-gray-400 hover:text-white hover:bg-[#1f2937] h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* Status transition */}
                            {transition && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={transitioning === order.id}
                                onClick={() => handleTransition(order, transition.next)}
                                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 h-8 gap-1 text-xs"
                              >
                                {transitioning === order.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <ArrowRight className="h-3 w-3" />
                                )}
                                {transition.label}
                              </Button>
                            )}

                            {/* Cancel (from any non-cancelled, non-completed state) */}
                            {order.status !== 'cancelled' && order.status !== 'completed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={transitioning === order.id}
                                onClick={() => handleTransition(order, 'cancelled')}
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/30 h-8 gap-1 text-xs"
                              >
                                <XCircle className="h-3 w-3" />
                                Annuler
                              </Button>
                            )}
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

      {/* ========= CREATE DIALOG ========= */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm() }}>
        <DialogContent className="bg-[#111827] border-[#1f2937] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-emerald-400" />
              Nouvelle commande
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Customer */}
            <div className="space-y-2">
              <Label className="text-gray-300">Client *</Label>
              <Select value={formCustomerId} onValueChange={setFormCustomerId}>
                <SelectTrigger className="bg-[#1f2937] border-[#374151] text-white">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent className="bg-[#1f2937] border-[#374151]">
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-white focus:bg-[#374151] focus:text-white">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source + Agent row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Source</Label>
                <Select value={formSource} onValueChange={(v) => setFormSource(v as typeof formSource)}>
                  <SelectTrigger className="bg-[#1f2937] border-[#374151] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1f2937] border-[#374151]">
                    <SelectItem value="client" className="text-white focus:bg-[#374151] focus:text-white">Client</SelectItem>
                    <SelectItem value="agent" className="text-white focus:bg-[#374151] focus:text-white">Agent</SelectItem>
                    <SelectItem value="digital" className="text-white focus:bg-[#374151] focus:text-white">Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Apporteur (optionnel)</Label>
                <Select value={formAgentId} onValueChange={setFormAgentId}>
                  <SelectTrigger className="bg-[#1f2937] border-[#374151] text-white">
                    <SelectValue placeholder="Aucun" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1f2937] border-[#374151]">
                    <SelectItem value="__none__" className="text-white focus:bg-[#374151] focus:text-white">Aucun</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="text-white focus:bg-[#374151] focus:text-white">
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="bg-[#374151]" />

            {/* Order Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300 font-semibold">Articles</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addFormItem}
                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 gap-1 h-8"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter
                </Button>
              </div>

              {formItems.map((item, index) => (
                <div key={index} className="bg-[#1f2937] rounded-lg p-3 space-y-3">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    {/* Product */}
                    <div className="col-span-4 space-y-1">
                      <Label className="text-gray-400 text-xs">Produit</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(v) => updateFormItem(index, 'productId', v)}
                      >
                        <SelectTrigger className="bg-[#111827] border-[#374151] text-white h-9 text-sm">
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1f2937] border-[#374151]">
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id} className="text-white focus:bg-[#374151] focus:text-white">
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2 space-y-1">
                      <Label className="text-gray-400 text-xs">Qté</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateFormItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="bg-[#111827] border-[#374151] text-white h-9 text-sm"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-2 space-y-1">
                      <Label className="text-gray-400 text-xs">P.U. (€)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice}
                        onChange={(e) => updateFormItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="bg-[#111827] border-[#374151] text-white h-9 text-sm"
                      />
                    </div>

                    {/* Discount */}
                    <div className="col-span-2 space-y-1">
                      <Label className="text-gray-400 text-xs">Remise %</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={item.discount}
                        onChange={(e) => updateFormItem(index, 'discount', parseFloat(e.target.value) || 0)}
                        className="bg-[#111827] border-[#374151] text-white h-9 text-sm"
                      />
                    </div>

                    {/* Line total + Remove */}
                    <div className="col-span-2 flex items-end justify-between gap-1">
                      <div className="space-y-1">
                        <Label className="text-gray-400 text-xs">Total</Label>
                        <div className="text-white text-sm font-mono h-9 flex items-center">
                          {(item.quantity * item.unitPrice * (1 - item.discount / 100)).toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}€
                        </div>
                      </div>
                      {formItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFormItem(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/30 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <span className="text-gray-400 text-sm">Total :</span>
                <span className="text-white text-lg font-bold font-mono">
                  {computeFormTotal().toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}€
                </span>
              </div>
            </div>

            <Separator className="bg-[#374151]" />

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-gray-300">Notes</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Notes internes sur la commande..."
                className="bg-[#1f2937] border-[#374151] text-white min-h-[80px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => { setCreateOpen(false); resetForm() }}
              className="text-gray-400 hover:text-white hover:bg-[#1f2937]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !formCustomerId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Créer la commande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========= DETAIL DIALOG ========= */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-[#111827] border-[#1f2937] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Commande #{selectedOrder.id.slice(-6).toUpperCase()}
                  <Badge
                    variant={statusConfig[selectedOrder.status]?.variant || 'secondary'}
                    className={statusConfig[selectedOrder.status]?.className || ''}
                  >
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 py-4">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Client</span>
                    <p className="text-white font-medium">{getCustomerName(selectedOrder)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Source</span>
                    <p className="text-white">{sourceLabels[selectedOrder.source] || selectedOrder.source}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Apporteur</span>
                    <p className="text-white">
                      {selectedOrder.agentId ? (selectedOrder.agent?.name || getAgentName(selectedOrder.agentId)) : '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Date</span>
                    <p className="text-white">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>

                <Separator className="bg-[#374151]" />

                {/* Items */}
                <div className="space-y-2">
                  <h4 className="text-gray-300 font-semibold text-sm">Articles</h4>
                  {(selectedOrder.items || []).length === 0 ? (
                    <p className="text-gray-500 text-sm">Aucun article</p>
                  ) : (
                    <div className="space-y-2">
                      {(selectedOrder.items || []).map((item, i) => (
                        <div key={i} className="bg-[#1f2937] rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm font-medium">{getProductName(item.productId)}</p>
                            <p className="text-gray-400 text-xs">
                              Qté: {item.quantity} × {item.unitPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                              {item.discount > 0 && ` − ${item.discount}%`}
                            </p>
                          </div>
                          <p className="text-white font-mono text-sm">
                            {(item.total || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Order total */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <span className="text-gray-400 text-sm">Total :</span>
                    <span className="text-white text-lg font-bold font-mono">
                      {computeOrderTotal(selectedOrder).toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}€
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <>
                    <Separator className="bg-[#374151]" />
                    <div className="space-y-1">
                      <h4 className="text-gray-300 font-semibold text-sm">Notes</h4>
                      <p className="text-gray-400 text-sm whitespace-pre-wrap">{selectedOrder.notes}</p>
                    </div>
                  </>
                )}

                <Separator className="bg-[#374151]" />

                {/* Status actions */}
                <div className="space-y-2">
                  <h4 className="text-gray-300 font-semibold text-sm">Actions</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {statusTransitions[selectedOrder.status] && (
                      <Button
                        size="sm"
                        disabled={transitioning === selectedOrder.id}
                        onClick={() =>
                          handleTransition(selectedOrder, statusTransitions[selectedOrder.status]!.next)
                        }
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                      >
                        {transitioning === selectedOrder.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5" />
                        )}
                        {statusTransitions[selectedOrder.status]!.label}
                      </Button>
                    )}
                    {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={transitioning === selectedOrder.id}
                        onClick={() => handleTransition(selectedOrder, 'cancelled')}
                        className="border-red-600 text-red-400 hover:bg-red-900/30 hover:text-red-300 gap-1.5"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Annuler
                      </Button>
                    )}
                    {(selectedOrder.status === 'completed' || selectedOrder.status === 'cancelled') && (
                      <p className="text-gray-500 text-sm">Aucune action disponible</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
