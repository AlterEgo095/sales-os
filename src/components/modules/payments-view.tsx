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
  DialogTrigger,
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
import {
  Plus,
  CreditCard,
  CheckCircle,
  DollarSign,
  Loader2,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

// --- Types ---
interface Sale {
  id: string
  customerId?: string
  customer?: { id: string; name: string }
  totalAmount?: number
  createdAt: string
}

interface Payment {
  id: string
  saleId: string
  sale?: Sale
  amount: number
  method: 'cash' | 'mobile_money' | 'bank_transfer' | 'card'
  reference?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paidAt?: string
  createdAt: string
}

interface TenantInfo {
  id: string
  houseId: string
}

// --- Label & Badge Configs ---
const methodLabels: Record<string, string> = {
  cash: 'Espèces',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Virement',
  card: 'Carte',
}

const methodBadgeClass: Record<string, string> = {
  cash: 'bg-green-600 text-green-100 hover:bg-green-600',
  mobile_money: 'bg-blue-600 text-blue-100 hover:bg-blue-600',
  bank_transfer: 'bg-purple-600 text-purple-100 hover:bg-purple-600',
  card: 'bg-orange-600 text-orange-100 hover:bg-orange-600',
}

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  completed: 'Complété',
  failed: 'Échoué',
  refunded: 'Remboursé',
}

const statusBadgeClass: Record<string, string> = {
  pending: 'bg-yellow-600 text-yellow-100 hover:bg-yellow-600',
  completed: 'bg-green-600 text-green-100 hover:bg-green-600',
  failed: 'bg-red-600 text-red-100 hover:bg-red-600',
  refunded: 'bg-gray-600 text-gray-100 hover:bg-gray-600',
}

// --- Main Component ---
export function PaymentsView() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)

  // Form state
  const [formSaleId, setFormSaleId] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formMethod, setFormMethod] = useState<'cash' | 'mobile_money' | 'bank_transfer' | 'card'>('cash')
  const [formReference, setFormReference] = useState('')

  // --- Fetch tenantId ---
  const fetchTenant = useCallback(async () => {
    try {
      const res = await fetch('/api/tenants')
      if (!res.ok) throw new Error('Failed to fetch tenants')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setTenantId(data[0].id)
      } else if (data?.id) {
        setTenantId(data.id)
      }
    } catch (err) {
      console.error('Error fetching tenant:', err)
      toast({ title: 'Erreur', description: 'Impossible de charger le tenant', variant: 'destructive' })
    }
  }, [])

  // --- Fetch payments ---
  const fetchPayments = useCallback(async (tId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/payments?tenantId=${tId}`)
      if (!res.ok) throw new Error('Failed to fetch payments')
      const data = await res.json()
      setPayments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching payments:', err)
      toast({ title: 'Erreur', description: 'Impossible de charger les paiements', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  // --- Fetch sales ---
  const fetchSales = useCallback(async (tId: string) => {
    try {
      const res = await fetch(`/api/sales?tenantId=${tId}`)
      if (!res.ok) throw new Error('Failed to fetch sales')
      const data = await res.json()
      setSales(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching sales:', err)
    }
  }, [])

  // --- Init ---
  useEffect(() => {
    fetchTenant()
  }, [fetchTenant])

  useEffect(() => {
    if (tenantId) {
      fetchPayments(tenantId)
      fetchSales(tenantId)
    }
  }, [tenantId, fetchPayments, fetchSales])

  // --- Create payment ---
  const handleCreate = async () => {
    if (!tenantId || !formSaleId || !formAmount) {
      toast({ title: 'Erreur', description: 'Vente et montant sont requis', variant: 'destructive' })
      return
    }

    const amount = parseFloat(formAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Erreur', description: 'Le montant doit être un nombre positif', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        tenantId,
        saleId: formSaleId,
        amount,
        method: formMethod,
      }
      if (formReference.trim()) {
        body.reference = formReference.trim()
      }

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to create payment')
      }

      toast({ title: 'Succès', description: 'Paiement enregistré avec succès' })
      setDialogOpen(false)
      resetForm()
      fetchPayments(tenantId)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // --- Mark as completed ---
  const handleMarkCompleted = async (paymentId: string) => {
    if (!tenantId) return
    setMarkingId(paymentId)
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to update payment')
      }

      toast({ title: 'Succès', description: 'Paiement marqué comme complété' })
      fetchPayments(tenantId)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setMarkingId(null)
    }
  }

  // --- Reset form ---
  const resetForm = () => {
    setFormSaleId('')
    setFormAmount('')
    setFormMethod('cash')
    setFormReference('')
  }

  // --- Helpers ---
  const getSaleLabel = (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId)
    if (sale) {
      const customerName = sale.customer?.name || '—'
      return `${sale.id.slice(-6)} (${customerName})`
    }
    return saleId.slice(-6)
  }

  const formatDate = (dateStr?: string) => {
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
      return '—'
    }
  }

  // --- Stats ---
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const completedCount = payments.filter((p) => p.status === 'completed').length
  const pendingCount = payments.filter((p) => p.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-emerald-400" />
          <h1 className="text-2xl font-bold text-white">Paiements</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="h-4 w-4" />
              Enregistrer paiement
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#111827] border-[#1f2937] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Enregistrer un paiement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Sale select */}
              <div className="space-y-2">
                <Label className="text-gray-300">Vente *</Label>
                <Select value={formSaleId} onValueChange={setFormSaleId}>
                  <SelectTrigger className="bg-[#0d1117] border-[#1f2937] text-white">
                    <SelectValue placeholder="Sélectionner une vente" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1f2937] text-white">
                    {sales.length === 0 ? (
                      <SelectItem value="__none" disabled>Aucune vente disponible</SelectItem>
                    ) : (
                      sales.map((sale) => (
                        <SelectItem key={sale.id} value={sale.id}>
                          {sale.id.slice(-6)} — {sale.customer?.name || 'Client inconnu'} — {sale.totalAmount != null ? `${sale.totalAmount} FCFA` : '—'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label className="text-gray-300">Montant (FCFA) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-500"
                />
              </div>

              {/* Method */}
              <div className="space-y-2">
                <Label className="text-gray-300">Méthode</Label>
                <Select value={formMethod} onValueChange={(v) => setFormMethod(v as typeof formMethod)}>
                  <SelectTrigger className="bg-[#0d1117] border-[#1f2937] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1f2937] text-white">
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank_transfer">Virement</SelectItem>
                    <SelectItem value="card">Carte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reference */}
              <div className="space-y-2">
                <Label className="text-gray-300">Référence (optionnel)</Label>
                <Input
                  placeholder="Numéro de référence"
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                  className="bg-[#0d1117] border-[#1f2937] text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { setDialogOpen(false); resetForm() }}
                className="border-[#1f2937] text-gray-300 hover:bg-[#1f2937]"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreate}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Total paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{totalAmount.toLocaleString('fr-FR')} FCFA</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Complétés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">{completedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-yellow-400" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Data table */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardHeader className="bg-[#0d1117] rounded-t-lg">
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            Liste des paiements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Chargement...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <CreditCard className="h-10 w-10 mb-2 opacity-50" />
              <p>Aucun paiement enregistré</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#1f2937] hover:bg-transparent">
                    <TableHead className="text-gray-400">ID</TableHead>
                    <TableHead className="text-gray-400">Vente</TableHead>
                    <TableHead className="text-gray-400">Montant</TableHead>
                    <TableHead className="text-gray-400">Méthode</TableHead>
                    <TableHead className="text-gray-400">Référence</TableHead>
                    <TableHead className="text-gray-400">Statut</TableHead>
                    <TableHead className="text-gray-400">Date</TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} className="border-[#1f2937] hover:bg-[#1f2937]/50">
                      <TableCell className="text-white font-mono text-sm">
                        {payment.id.slice(-6)}
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {getSaleLabel(payment.saleId)}
                      </TableCell>
                      <TableCell className="text-white font-semibold">
                        {payment.amount?.toLocaleString('fr-FR')} FCFA
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={methodBadgeClass[payment.method] || 'bg-gray-600 text-gray-100 hover:bg-gray-600'}
                        >
                          {methodLabels[payment.method] || payment.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {payment.reference || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusBadgeClass[payment.status] || 'bg-gray-600 text-gray-100 hover:bg-gray-600'}
                        >
                          {statusLabels[payment.status] || payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </TableCell>
                      <TableCell>
                        {payment.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkCompleted(payment.id)}
                            disabled={markingId === payment.id}
                            className="border-green-700 text-green-400 hover:bg-green-900/30 hover:text-green-300 gap-1 h-8"
                          >
                            {markingId === payment.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            Marquer complété
                          </Button>
                        )}
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

export default PaymentsView
