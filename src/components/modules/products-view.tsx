'use client'

import * as React from 'react'
import { Plus, Pencil, Trash2, Package, DollarSign, Search } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductStatus = 'active' | 'inactive' | 'discontinued'
type ProductCategory = 'pack' | 'service' | 'accessory'

interface Product {
  id: string
  tenantId: string
  houseId: string
  name: string
  sku: string
  unitPrice: number
  currency: string
  category?: ProductCategory | null
  description?: string | null
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

interface ProductFormData {
  name: string
  sku: string
  unitPrice: string
  currency: string
  category: string
  description: string
  status: ProductStatus
}

const emptyForm: ProductFormData = {
  name: '',
  sku: '',
  unitPrice: '',
  currency: 'USD',
  category: '',
  description: '',
  status: 'active',
}

// ─── Badge Helpers ────────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category?: ProductCategory | null }) {
  if (!category) return <span className="text-gray-400">—</span>

  const config: Record<ProductCategory, { label: string; className: string }> = {
    pack: {
      label: 'Pack',
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    service: {
      label: 'Service',
      className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
    accessory: {
      label: 'Accessoire',
      className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    },
  }

  const c = config[category]
  return (
    <Badge variant="outline" className={c.className}>
      {c.label}
    </Badge>
  )
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const config: Record<ProductStatus, { label: string; className: string }> = {
    active: {
      label: 'Actif',
      className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    inactive: {
      label: 'Inactif',
      className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    },
    discontinued: {
      label: 'Abandonné',
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
  }

  const c = config[status]
  return (
    <Badge variant="outline" className={c.className}>
      {c.label}
    </Badge>
  )
}

// ─── Price Formatter ──────────────────────────────────────────────────────────

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProductsView() {
  // State
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')

  // Tenant context
  const [tenantId, setTenantId] = React.useState<string | null>(null)
  const [houseId, setHouseId] = React.useState<string | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null)
  const [formData, setFormData] = React.useState<ProductFormData>(emptyForm)
  const [saving, setSaving] = React.useState(false)

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  // ─── Fetch tenant context ────────────────────────────────────────────────

  React.useEffect(() => {
    async function fetchTenant() {
      try {
        const res = await fetch('/api/tenants')
        if (!res.ok) throw new Error('Failed to fetch tenants')
        const data = await res.json()
        if (data && data.length > 0) {
          setTenantId(data[0].id)
          setHouseId(data[0].houseId || data[0].houses?.[0]?.id || null)
        }
      } catch {
        toast({ title: 'Erreur', description: 'Impossible de charger les tenants', variant: 'destructive' })
      }
    }
    fetchTenant()
  }, [])

  // ─── Fetch products ─────────────────────────────────────────────────────

  const fetchProducts = React.useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/products?tenantId=${tenantId}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les produits', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  React.useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // ─── Create / Update ────────────────────────────────────────────────────

  async function handleSave() {
    if (!formData.name.trim() || !formData.sku.trim() || !formData.unitPrice) {
      toast({ title: 'Validation', description: 'Nom, SKU et prix sont requis', variant: 'destructive' })
      return
    }

    const price = parseFloat(formData.unitPrice)
    if (isNaN(price) || price < 0) {
      toast({ title: 'Validation', description: 'Le prix doit être un nombre positif', variant: 'destructive' })
      return
    }

    setSaving(true)

    const body: Record<string, unknown> = {
      tenantId,
      houseId,
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      unitPrice: price,
      currency: formData.currency || 'USD',
      category: formData.category || null,
      description: formData.description.trim() || null,
      status: formData.status,
    }

    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Update failed')
        toast({ title: 'Produit mis à jour', description: `"${formData.name}" a été modifié` })
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Create failed')
        toast({ title: 'Produit créé', description: `"${formData.name}" a été ajouté` })
      }

      setDialogOpen(false)
      setEditingProduct(null)
      setFormData(emptyForm)
      fetchProducts()
    } catch {
      toast({ title: 'Erreur', description: "Impossible de sauvegarder le produit", variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete ─────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deletingProduct) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast({ title: 'Produit supprimé', description: `"${deletingProduct.name}" a été supprimé` })
      setDeleteOpen(false)
      setDeletingProduct(null)
      fetchProducts()
    } catch {
      toast({ title: 'Erreur', description: "Impossible de supprimer le produit", variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  // ─── Open dialogs ───────────────────────────────────────────────────────

  function openCreate() {
    setEditingProduct(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(product: Product) {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku,
      unitPrice: String(product.unitPrice),
      currency: product.currency || 'USD',
      category: product.category || '',
      description: product.description || '',
      status: product.status,
    })
    setDialogOpen(true)
  }

  function openDelete(product: Product) {
    setDeletingProduct(product)
    setDeleteOpen(true)
  }

  // ─── Filtered products ──────────────────────────────────────────────────

  const filtered = React.useMemo(() => {
    if (!searchQuery.trim()) return products
    const q = searchQuery.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    )
  }, [products, searchQuery])

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/20">
            <Package className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Produits</h1>
            <p className="text-sm text-gray-400">
              {products.length} produit{products.length !== 1 ? 's' : ''} au total
            </p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau produit
        </Button>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-[#111827] border-[#1f2937] text-white placeholder:text-gray-500 focus-visible:ring-emerald-500/50"
        />
      </div>

      {/* ── Table Card ─────────────────────────────────────────────────── */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Catalogue de produits
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#0d1117] hover:bg-[#0d1117] border-[#1f2937]">
                <TableHead className="text-gray-400 font-medium">Produit</TableHead>
                <TableHead className="text-gray-400 font-medium">SKU</TableHead>
                <TableHead className="text-gray-400 font-medium">Prix</TableHead>
                <TableHead className="text-gray-400 font-medium">Catégorie</TableHead>
                <TableHead className="text-gray-400 font-medium">Statut</TableHead>
                <TableHead className="text-gray-400 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton rows
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-[#1f2937] hover:bg-[#1f2937]/50">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j} className="py-3">
                        <div className="h-4 bg-[#1f2937] rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow className="border-[#1f2937]">
                  <TableCell colSpan={6} className="h-24 text-center text-gray-400">
                    {searchQuery
                      ? 'Aucun produit trouvé pour cette recherche'
                      : 'Aucun produit créé pour le moment'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((product) => (
                  <TableRow
                    key={product.id}
                    className="border-[#1f2937] hover:bg-[#1f2937]/50"
                  >
                    {/* Product name */}
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">{product.name}</span>
                        {product.description && (
                          <span className="text-gray-500 text-xs truncate max-w-[200px]">
                            {product.description}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* SKU */}
                    <TableCell className="py-3">
                      <code className="text-xs bg-[#1f2937] text-gray-300 px-2 py-0.5 rounded font-mono">
                        {product.sku}
                      </code>
                    </TableCell>

                    {/* Price */}
                    <TableCell className="py-3">
                      <span className="text-white text-sm font-medium">
                        {formatPrice(product.unitPrice, product.currency)}
                      </span>
                    </TableCell>

                    {/* Category */}
                    <TableCell className="py-3">
                      <CategoryBadge category={product.category} />
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3">
                      <StatusBadge status={product.status} />
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(product)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#1f2937]"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDelete(product)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Create / Edit Dialog ───────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingProduct(null)
          setFormData(emptyForm)
        }
        setDialogOpen(open)
      }}>
        <DialogContent className="bg-[#111827] border-[#1f2937] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="product-name" className="text-gray-400">
                Nom <span className="text-red-400">*</span>
              </Label>
              <Input
                id="product-name"
                placeholder="Nom du produit"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-500/50"
              />
            </div>

            {/* SKU */}
            <div className="grid gap-2">
              <Label htmlFor="product-sku" className="text-gray-400">
                SKU <span className="text-red-400">*</span>
              </Label>
              <Input
                id="product-sku"
                placeholder="ex: PKG-001"
                value={formData.sku}
                onChange={(e) => setFormData((f) => ({ ...f, sku: e.target.value }))}
                className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-500/50"
              />
            </div>

            {/* Unit Price + Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="product-price" className="text-gray-400">
                  Prix unitaire <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData((f) => ({ ...f, unitPrice: e.target.value }))}
                  className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-500/50"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-gray-400">Devise</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v) => setFormData((f) => ({ ...f, currency: v }))}
                >
                  <SelectTrigger className="bg-[#0d1117] border-[#1f2937] text-white focus:ring-emerald-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1f2937]">
                    <SelectItem value="USD" className="text-white focus:bg-[#1f2937] focus:text-white">USD</SelectItem>
                    <SelectItem value="EUR" className="text-white focus:bg-[#1f2937] focus:text-white">EUR</SelectItem>
                    <SelectItem value="GBP" className="text-white focus:bg-[#1f2937] focus:text-white">GBP</SelectItem>
                    <SelectItem value="CAD" className="text-white focus:bg-[#1f2937] focus:text-white">CAD</SelectItem>
                    <SelectItem value="MAD" className="text-white focus:bg-[#1f2937] focus:text-white">MAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category */}
            <div className="grid gap-2">
              <Label className="text-gray-400">Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger className="bg-[#0d1117] border-[#1f2937] text-white focus:ring-emerald-500/50">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-[#1f2937]">
                  <SelectItem value="pack" className="text-white focus:bg-[#1f2937] focus:text-white">Pack</SelectItem>
                  <SelectItem value="service" className="text-white focus:bg-[#1f2937] focus:text-white">Service</SelectItem>
                  <SelectItem value="accessory" className="text-white focus:bg-[#1f2937] focus:text-white">Accessoire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label className="text-gray-400">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData((f) => ({ ...f, status: v as ProductStatus }))}
              >
                <SelectTrigger className="bg-[#0d1117] border-[#1f2937] text-white focus:ring-emerald-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-[#1f2937]">
                  <SelectItem value="active" className="text-white focus:bg-[#1f2937] focus:text-white">Actif</SelectItem>
                  <SelectItem value="inactive" className="text-white focus:bg-[#1f2937] focus:text-white">Inactif</SelectItem>
                  <SelectItem value="discontinued" className="text-white focus:bg-[#1f2937] focus:text-white">Abandonné</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="product-desc" className="text-gray-400">
                Description
              </Label>
              <Textarea
                id="product-desc"
                placeholder="Description du produit (optionnel)"
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-600 focus-visible:ring-emerald-500/50 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false)
                setEditingProduct(null)
                setFormData(emptyForm)
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
              {editingProduct ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete AlertDialog ──────────────────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={(open) => {
        if (!open) setDeletingProduct(null)
        setDeleteOpen(open)
      }}>
        <AlertDialogContent className="bg-[#111827] border-[#1f2937] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Supprimer le produit
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Êtes-vous sûr de vouloir supprimer{' '}
              <span className="text-white font-medium">
                {deletingProduct?.name}
              </span>
              ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1f2937] text-gray-400 hover:text-white hover:bg-[#1f2937]">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {deleting && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ProductsView
