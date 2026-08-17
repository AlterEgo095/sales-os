import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const action = searchParams.get("action")
    const entityType = searchParams.get("entityType")
    const limit = parseInt(searchParams.get("limit") || "100")

    const auditEvents = await db.auditEvent.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(action ? { action } : {}),
        ...(entityType ? { entityType } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json(auditEvents)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
