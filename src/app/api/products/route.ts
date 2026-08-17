import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const houseId = searchParams.get("houseId")

    const products = await db.product.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(houseId ? { houseId } : {}),
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, houseId, name, sku, unitPrice, currency, category } = body

    if (!tenantId || !houseId || !name || !sku || unitPrice === undefined) {
      return NextResponse.json({ error: "tenantId, houseId, name, sku, and unitPrice are required" }, { status: 400 })
    }

    const product = await db.product.create({
      data: {
        tenantId,
        houseId,
        name,
        sku,
        unitPrice,
        currency: currency || "USD",
        category,
      },
    })
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
