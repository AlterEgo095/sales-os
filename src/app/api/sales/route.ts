import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")

    const sales = await db.sale.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(sales)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, orderId, houseId, agentId, sellerId } = body

    if (!tenantId || !houseId) {
      return NextResponse.json({ error: "tenantId and houseId are required" }, { status: 400 })
    }

    const sale = await db.sale.create({
      data: {
        tenantId,
        orderId,
        houseId,
        agentId,
        sellerId,
      },
    })
    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
