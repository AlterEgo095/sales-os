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
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) throw new Error("Order not found")

  const allowed = VALID_TRANSITIONS[order.status] || []
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid transition: ${order.status} → ${newStatus}`)
  }

  // Perform the status transition
  await db.order.update({ where: { id: orderId }, data: { status: newStatus } })

  // Log the event
  await db.orderEvent.create({
    data: {
      tenantId,
      orderId,
      eventType: newStatus,
      payload: JSON.stringify({ from: order.status, to: newStatus }),
    },
  })

  // ── Side effect: Order → Sale conversion ──
  // When an order is completed, auto-create a Sale record
  if (newStatus === "completed") {
    const existingSale = await db.sale.findUnique({
      where: { orderId },
    })

    if (!existingSale) {
      const sale = await db.sale.create({
        data: {
          tenantId,
          orderId,
          houseId: order.houseId,
          agentId: order.agentId,
          sellerId: order.sellerId,
          status: "completed",
          totalAmount: order.totalAmount,
        },
      })

      // ── Side effect: Commission auto-calculation ──
      // If the order has an agent with a commission rate, create a commission
      if (order.agentId) {
        const agent = await db.agent.findUnique({
          where: { id: order.agentId },
        })

        if (agent && agent.commissionRate > 0) {
          const commissionAmount = (order.totalAmount * agent.commissionRate) / 100

          await db.commission.create({
            data: {
              tenantId,
              saleId: sale.id,
              agentId: agent.id,
              type: "percentage",
              rate: agent.commissionRate,
              amount: Math.round(commissionAmount * 100) / 100,
              status: "calculated",
              calculatedAt: new Date(),
            },
          })
        }
      }
    }
  }

  return { from: order.status, to: newStatus }
}
