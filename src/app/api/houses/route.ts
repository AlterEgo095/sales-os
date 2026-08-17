import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")

    const houses = await db.house.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(houses)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, name, code, address, city, country } = body

    if (!tenantId || !name || !code) {
      return NextResponse.json({ error: "tenantId, name, and code are required" }, { status: 400 })
    }

    const house = await db.house.create({
      data: { tenantId, name, code, address, city, country },
    })
    return NextResponse.json(house, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
