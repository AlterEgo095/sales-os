import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const houseId = searchParams.get("houseId")

    const agents = await db.agent.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(houseId ? { houseId } : {}),
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(agents)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, userId, houseId, code, commissionRate } = body

    if (!tenantId || !userId || !houseId || !code) {
      return NextResponse.json({ error: "tenantId, userId, houseId, and code are required" }, { status: 400 })
    }

    const agent = await db.agent.create({
      data: {
        tenantId,
        userId,
        houseId,
        code,
        commissionRate: commissionRate ?? 0,
      },
    })
    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
