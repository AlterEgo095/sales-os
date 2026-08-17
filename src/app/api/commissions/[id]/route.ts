import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const commission = await db.commission.findUnique({ where: { id } })
    if (!commission) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(commission)
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
    const { status } = body

    // Status workflow: calculated → validated → paid
    const commission = await db.commission.findUnique({ where: { id } })
    if (!commission) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const validTransitions: Record<string, string[]> = {
      calculated: ["validated"],
      validated: ["paid"],
      paid: [],
    }

    const allowed = validTransitions[commission.status] || []
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Invalid transition: ${commission.status} → ${status}` },
        { status: 409 }
      )
    }

    const updateData: Record<string, any> = { status }
    if (status === "paid") {
      updateData.paidAt = new Date()
    }

    const updated = await db.commission.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
