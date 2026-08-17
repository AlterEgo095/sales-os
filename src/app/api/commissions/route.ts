import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { calculateCommission } from "@/lib/engines/commission-engine"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const agentId = searchParams.get("agentId")

    const commissions = await db.commission.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(agentId ? { agentId } : {}),
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(commissions)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { saleId, tenantId } = body

    if (!saleId || !tenantId) {
      return NextResponse.json({ error: "saleId and tenantId are required" }, { status: 400 })
    }

    // Calculate commission using the commission engine
    const commission = await calculateCommission(saleId, tenantId)
    if (!commission) {
      return NextResponse.json({ error: "Could not calculate commission (sale not found or no agent)" }, { status: 400 })
    }

    return NextResponse.json(commission, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
