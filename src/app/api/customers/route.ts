import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const houseId = searchParams.get("houseId")

    const customers = await db.customer.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(houseId ? { houseId } : {}),
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(customers)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, houseId, firstName, lastName, phone, email, address, clientAccountId, agentReferentId, orderSource } = body

    if (!tenantId || !houseId || !firstName || !lastName) {
      return NextResponse.json({ error: "tenantId, houseId, firstName, and lastName are required" }, { status: 400 })
    }

    const customer = await db.customer.create({
      data: {
        tenantId,
        houseId,
        firstName,
        lastName,
        phone,
        email,
        address,
        clientAccountId,
        agentReferentId,
        orderSource: orderSource || "manual",
      },
    })
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
