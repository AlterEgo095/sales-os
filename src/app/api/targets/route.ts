import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")

    const targets = await db.target.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(targets)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, agentId, houseId, period, type, value } = body

    if (!tenantId || !period || !type || value === undefined) {
      return NextResponse.json({ error: "tenantId, period, type, and value are required" }, { status: 400 })
    }

    const target = await db.target.create({
      data: {
        tenantId,
        agentId,
        houseId,
        period,
        type,
        value,
      },
    })
    return NextResponse.json(target, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
