import { db } from "@/lib/db"

/**
 * Commission Engine — Bounded Context isolé
 * V1: commission simple par pourcentage
 */

export async function calculateCommission(saleId: string, tenantId: string) {
  const sale = await db.sale.findUnique({
    where: { id: saleId },
    include: { agent: true },
  })

  if (!sale || !sale.agentId) return null

  const agent = sale.agent
  const commissionAmount = (sale.totalAmount * agent.commissionRate) / 100

  return db.commission.create({
    data: {
      tenantId,
      saleId,
      agentId: agent.id,
      type: "percentage",
      rate: agent.commissionRate,
      amount: Math.round(commissionAmount * 100) / 100,
      status: "calculated",
      calculatedAt: new Date(),
    },
  })
}

export async function validateCommission(commissionId: string) {
  return db.commission.update({
    where: { id: commissionId },
    data: { status: "validated" },
  })
}

export async function payCommission(commissionId: string) {
  return db.commission.update({
    where: { id: commissionId },
    data: { status: "paid", paidAt: new Date() },
  })
}
