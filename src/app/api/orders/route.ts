import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const status = searchParams.get("status")

    const orders = await db.order.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, houseId, customerId, source, agentId, sellerId, currency, notes, items } = body

    if (!tenantId || !houseId || !customerId) {
      return NextResponse.json({ error: "tenantId, houseId, and customerId are required" }, { status: 400 })
    }

    // Create order with items in a transaction
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tenantId,
          houseId,
          customerId,
          source: source || "client",
          agentId,
          sellerId,
          currency: currency || "USD",
          notes,
        },
      })

      // Create order items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        await tx.orderItem.createMany({
          data: items.map((item: { productId: string; quantity: number; unitPrice: number; discount?: number; total: number }) => ({
            tenantId,
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount ?? 0,
            total: item.total,
          })),
        })
      }

      // Log order created event
      await tx.orderEvent.create({
        data: {
          tenantId,
          orderId: newOrder.id,
          eventType: "created",
          payload: JSON.stringify({ status: "draft" }),
        },
      })

      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: { customer: true, items: true },
      })
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
