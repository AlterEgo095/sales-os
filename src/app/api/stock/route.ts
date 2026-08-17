import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const houseId = searchParams.get("houseId")

    const stock = await db.stock.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(houseId ? { houseId } : {}),
      },
      include: {
        product: true,
        house: true,
      },
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json(stock)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, houseId, productId, quantity, reserved } = body

    if (!tenantId || !houseId || !productId) {
      return NextResponse.json({ error: "tenantId, houseId, and productId are required" }, { status: 400 })
    }

    // Upsert: create or update stock entry
    const stock = await db.stock.upsert({
      where: {
        tenantId_houseId_productId: { tenantId, houseId, productId },
      },
      create: {
        tenantId,
        houseId,
        productId,
        quantity: quantity ?? 0,
        reserved: reserved ?? 0,
      },
      update: {
        ...(quantity !== undefined ? { quantity } : {}),
        ...(reserved !== undefined ? { reserved } : {}),
      },
    })

    return NextResponse.json(stock, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
