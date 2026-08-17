import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const tenants = await db.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: { houses: true },
    })
    return NextResponse.json(tenants)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug are required" }, { status: 400 })
    }

    const tenant = await db.tenant.create({
      data: { name, slug },
    })
    return NextResponse.json(tenant, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
