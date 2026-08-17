'use client'

import * as React from 'react'
import { Warehouse, Package, Pencil, AlertTriangle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockItem {
  id: string
  productId: string
  product: {
    name: string
    sku: string
    unitPrice: number
  }
  houseId: string
  house: {
    name: string
    code: string
  }
  quantity: number
  reserved: number
}

// ─── Availability Color Helpers ───────────────────────────────────────────────

function getAvailabilityColor(available: number): string {
  if (available < 0) return 'text-red-400'
  if (available === 0) return 'text-red-400'
  if (available <= 10) return 'text-yellow-400'
  return 'text-emerald-400'
}

function getAvailabilityBadgeClass(available: number): string {
  if (available < 0) return 'bg-red-500/20 text-red-400 border-red-500/30'
  if (available === 0) return 'bg-red-500/20 text-red-400 border-red-500/30'
  if (available <= 10) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
}

function getAvailabilityLabel(available: number): string {
  if (available < 0) return 'Critique'
  if (available === 0) return 'Rupture'
  if (available <= 10) return 'Faible'
  return 'En stock'
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StockView() {
  // State
  const [stock, setStock] = React.useState<StockItem[]>([])
  const [loading, setLoading] = React.useState(true)

  // Tenant context
  const [tenantId, setTenantId] = React.useState<string | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingStock, setEditingStock] = React.useState<StockItem | null>(null)
  const [newQuantity, setNewQuantity] = React.useState('')
  const [newReserved, setNewReserved] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  // ─── Fetch tenant context ────────────────────────────────────────────────

  React.useEffect(() => {
    async function fetchTenant() {
      try {
        const res = await fetch('/api/tenants')
        if (!res.ok) throw new Error('Failed to fetch tenants')
        const data = await res.json()
        if (data && data.length > 0) {
          setTenantId(data[0].id)
        }
      } catch {
        toast({ title: 'Erreur', description: 'Impossible de charger les tenants', variant: 'destructive' })
      }
    }
    fetchTenant()
  }, [])

  // ─── Fetch stock ────────────────────────────────────────────────────────

  const fetchStock = React.useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/stock?tenantId=${tenantId}`)
      if (!res.ok) throw new Error('Failed to fetch stock')
      const data = await res.json()
      setStock(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger le stock', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  React.useEffect(() => {
    fetchStock()
  }, [fetchStock])

  // ─── Open adjust dialog ─────────────────────────────────────────────────

  function openAdjust(item: StockItem) {
    setEditingStock(item)
    setNewQuantity(String(item.quantity))
    setNewReserved(String(item.reserved))
    setDialogOpen(true)
  }

  // ─── Save stock adjustment ──────────────────────────────────────────────

  async function handleSave() {
    if (!editingStock || !tenantId) return

    const qty = parseInt(newQuantity, 10)
    const rsv = parseInt(newReserved, 10)

    if (isNaN(qty)) {
      toast({ title: 'Validation', description: 'La quantité doit être un nombre entier', variant: 'destructive' })
      return
    }
    if (isNaN(rsv)) {
      toast({ title: 'Validation', description: 'La quantité réservée doit être un nombre entier', variant: 'destructive' })
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          houseId: editingStock.houseId,
          productId: editingStock.productId,
          quantity: qty,
          reserved: rsv,
        }),
      })
      if (!res.ok) throw new Error('Upsert failed')
      toast({ title: 'Stock ajusté', description: `"${editingStock.product.name}" mis à jour` })
      setDialogOpen(false)
      setEditingStock(null)
      fetchStock()
    } catch {
      toast({ title: 'Erreur', description: "Impossible d'ajuster le stock", variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ─── Summary calculations ───────────────────────────────────────────────

  const summary = React.useMemo(() => {
    const totalItems = stock.length
    const totalQuantity = stock.reduce((sum, s) => sum + s.quantity, 0)
    const totalReserved = stock.reduce((sum, s) => sum + s.reserved, 0)
    const totalAvailable = totalQuantity - totalReserved
    const lowStock = stock.filter((s) => {
      const avail = s.quantity - s.reserved
      return avail >= 0 && avail <= 10
    }).length
    const outOfStock = stock.filter((s) => s.quantity - s.reserved <= 0).length
    return { totalItems, totalQuantity, totalReserved, totalAvailable, lowStock, outOfStock }
  }, [stock])

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/20">
            <Warehouse className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Stock</h1>
            <p className="text-sm text-gray-400">
              {summary.totalItems} article{summary.totalItems !== 1 ? 's' : ''} en inventaire
            </p>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Total quantité</span>
            </div>
            <p className="text-2xl font-bold text-white">{summary.totalQuantity}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Warehouse className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Réservé</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{summary.totalReserved}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Disponible</span>
            </div>
            <p className={`text-2xl font-bold ${getAvailabilityColor(summary.totalAvailable)}`}>
              {summary.totalAvailable}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Alertes</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{summary.outOfStock}</p>
            {summary.lowStock > 0 && (
              <p className="text-xs text-yellow-400 mt-0.5">{summary.lowStock} stock faible</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Table Card ─────────────────────────────────────────────────── */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-emerald-400" />
            Inventaire
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#0d1117] hover:bg-[#0d1117] border-[#1f2937]">
                <TableHead className="text-gray-400 font-medium">Produit</TableHead>
                <TableHead className="text-gray-400 font-medium">SKU</TableHead>
                <TableHead className="text-gray-400 font-medium">Maison</TableHead>
                <TableHead className="text-gray-400 font-medium text-right">Quantité</TableHead>
                <TableHead className="text-gray-400 font-medium text-right">Réservé</TableHead>
                <TableHead className="text-gray-400 font-medium text-right">Disponible</TableHead>
                <TableHead className="text-gray-400 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton rows
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-[#1f2937] hover:bg-[#1f2937]/50">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j} className="py-3">
                        <div className="h-4 bg-[#1f2937] rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : stock.length === 0 ? (
                <TableRow className="border-[#1f2937]">
                  <TableCell colSpan={7} className="h-24 text-center text-gray-400">
                    Aucun stock disponible pour le moment
                  </TableCell>
                </TableRow>
              ) : (
                stock.map((item) => {
                  const available = item.quantity - item.reserved
                  return (
                    <TableRow
                      key={item.id}
                      className="border-[#1f2937] hover:bg-[#1f2937]/50"
                    >
                      {/* Product name */}
                      <TableCell className="py-3">
                        <span className="text-white font-medium text-sm">{item.product.name}</span>
                      </TableCell>

                      {/* SKU */}
                      <TableCell className="py-3">
                        <code className="text-xs bg-[#1f2937] text-gray-300 px-2 py-0.5 rounded font-mono">
                          {item.product.sku}
                        </code>
                      </TableCell>

                      {/* House */}
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="text-white text-sm">{item.house.name}</span>
                          <span className="text-gray-500 text-xs">{item.house.code}</span>
                        </div>
                      </TableCell>

                      {/* Quantity */}
                      <TableCell className="py-3 text-right">
                        <span className="text-white text-sm font-medium">{item.quantity}</span>
                      </TableCell>

                      {/* Reserved */}
                      <TableCell className="py-3 text-right">
                        <span className="text-yellow-400 text-sm font-medium">{item.reserved}</span>
                      </TableCell>

                      {/* Available */}
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-sm font-bold ${getAvailabilityColor(available)}`}>
                            {available}
                          </span>
                          {available < 0 && (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          )}
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getAvailabilityBadgeClass(available)}`}>
                            {getAvailabilityLabel(available)}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAdjust(item)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#1f2937]"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Adjust Stock Dialog ────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingStock(null)
          setNewQuantity('')
          setNewReserved('')
        }
        setDialogOpen(open)
      }}>
        <DialogContent className="bg-[#111827] border-[#1f2937] text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Pencil className="w-4 h-4 text-emerald-400" />
              Ajuster stock
            </DialogTitle>
          </DialogHeader>

          {editingStock && (
            <div className="grid gap-4 py-2">
              {/* Product info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0d1117] border border-[#1f2937]">
                <Package className="w-5 h-5 text-emerald-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{editingStock.product.name}</p>
                  <p className="text-xs text-gray-400">
                    SKU: {editingStock.product.sku} · {editingStock.house.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Actuel</p>
                  <p className="text-sm font-medium text-white">{editingStock.quantity - editingStock.reserved} dispo</p>
                </div>
              </div>

              {/* New quantity */}
              <div className="grid gap-2">
                <Label htmlFor="stock-quantity" className="text-gray-400">
                  Nouvelle quantité
                </Label>
                <Input
                  id="stock-quantity"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-500/50"
                />
              </div>

              {/* New reserved */}
              <div className="grid gap-2">
                <Label htmlFor="stock-reserved" className="text-gray-400">
                  Nouvelle quantité réservée
                </Label>
                <Input
                  id="stock-reserved"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={newReserved}
                  onChange={(e) => setNewReserved(e.target.value)}
                  className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-500/50"
                />
              </div>

              {/* Preview available */}
              {newQuantity !== '' && newReserved !== '' && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0d1117] border border-[#1f2937]">
                  <span className="text-sm text-gray-400">Disponible après ajustement</span>
                  <span className={`text-sm font-bold ${getAvailabilityColor(parseInt(newQuantity, 10) - parseInt(newReserved, 10))}`}>
                    {parseInt(newQuantity, 10) - parseInt(newReserved, 10)}
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false)
                setEditingStock(null)
                setNewQuantity('')
                setNewReserved('')
              }}
              className="border-[#1f2937] text-gray-400 hover:text-white hover:bg-[#1f2937]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {saving && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Ajuster
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StockView
