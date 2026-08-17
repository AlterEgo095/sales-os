import { db } from "@/lib/db"

/**
 * Order Engine — Façade métier
 * Orchestre Pricing, Allocation et Fulfillment
 */

// Pricing Engine V1: calculate order totals
export async function calculateOrderTotal(orderId: string, tenantId: string) {
  const items = await db.orderItem.findMany({
    where: { orderId, tenantId },
  })

  const total = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitPrice * (1 - item.discount / 100)
    return sum + lineTotal
  }, 0)

  await db.order.update({
    where: { id: orderId },
    data: { totalAmount: Math.round(total * 100) / 100 },
  })

  return total
}

// Allocation Engine V1: house is chosen manually by user
export async function allocateToHouse(orderId: string, houseId: string) {
  return db.order.update({
    where: { id: orderId },
    data: { houseId },
  })
}

// Fulfillment Engine V1: status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["formalized", "cancelled"],
  formalized: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
}

export async function transitionOrderStatus(orderId: string, newStatus: string, tenantId: string) {
  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) throw new Error("Order not found")

  const allowed = VALID_TRANSITIONS[order.status] || []
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid transition: ${order.status} → ${newStatus}`)
  }

  await db.order.update({ where: { id: orderId }, data: { status: newStatus } })

  await db.orderEvent.create({
    data: {
      tenantId,
      orderId,
      eventType: newStatus,
      payload: JSON.stringify({ from: order.status, to: newStatus }),
    },
  })

  return { from: order.status, to: newStatus }
}
