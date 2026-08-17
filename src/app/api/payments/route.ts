import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const saleId = searchParams.get("saleId")

    const payments = await db.payment.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(saleId ? { saleId } : {}),
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, saleId, amount, method, reference } = body

    if (!tenantId || !saleId || amount === undefined || !method) {
      return NextResponse.json({ error: "tenantId, saleId, amount, and method are required" }, { status: 400 })
    }

    const payment = await db.payment.create({
      data: {
        tenantId,
        saleId,
        amount,
        method,
        reference,
      },
    })
    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
