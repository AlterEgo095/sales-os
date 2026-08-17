import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { transitionOrderStatus } from "@/lib/engines/order-engine"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const order = await db.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        events: true,
      },
    })
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, tenantId, ...rest } = body

    // If status is changing, use the order engine to transition
    if (status && tenantId) {
      const result = await transitionOrderStatus(id, status, tenantId)
      // Update remaining fields if any
      const hasOtherFields = Object.keys(rest).length > 0
      if (hasOtherFields) {
        await db.order.update({ where: { id }, data: rest })
      }
      const updated = await db.order.findUnique({
        where: { id },
        include: { customer: true, items: true, events: true },
      })
      return NextResponse.json(updated)
    }

    const order = await db.order.update({
      where: { id },
      data: rest,
      include: { customer: true, items: true, events: true },
    })
    return NextResponse.json(order)
  } catch (error: any) {
    if (error?.message?.startsWith("Invalid transition")) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Cancel order: set status to "cancelled"
    const order = await db.order.findUnique({ where: { id } })
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await transitionOrderStatus(id, "cancelled", order.tenantId)
    return NextResponse.json({ success: true, status: "cancelled" })
  } catch (error: any) {
    if (error?.message?.startsWith("Invalid transition")) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
