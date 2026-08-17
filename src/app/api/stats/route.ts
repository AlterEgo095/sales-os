import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let tenantId = searchParams.get("tenantId")

    // Default to first tenant if not specified
    if (!tenantId) {
      const firstTenant = await db.tenant.findFirst({ where: { status: "active" } })
      if (!firstTenant) {
        return NextResponse.json({ totalOrders: 0, totalSales: 0, totalRevenue: 0, totalCustomers: 0, totalAgents: 0, totalProducts: 0, recentOrders: [], topProducts: [] })
      }
      tenantId = firstTenant.id
    }

    // Run all count queries in parallel for performance
    const [
      totalOrders,
      totalSales,
      totalRevenueResult,
      totalCustomers,
      totalAgents,
      totalProducts,
      recentOrders,
      topProductsResult,
    ] = await Promise.all([
      db.order.count({ where: { tenantId } }),
      db.sale.count({ where: { tenantId } }),
      db.sale.aggregate({
        where: { tenantId },
        _sum: { totalAmount: true },
      }),
      db.customer.count({ where: { tenantId } }),
      db.agent.count({ where: { tenantId } }),
      db.product.count({ where: { tenantId } }),
      db.order.findMany({
        where: { tenantId },
        include: { customer: true, items: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Top 5 products by order count
      db.orderItem.groupBy({
        by: ["productId"],
        where: { tenantId },
        _count: { productId: true },
        orderBy: { _count: { productId: "desc" } },
        take: 5,
      }),
    ])

    // Resolve product names for top products
    const topProductIds = topProductsResult.map((r) => r.productId)
    const productDetails = topProductIds.length > 0
      ? await db.product.findMany({
          where: { id: { in: topProductIds } },
          select: { id: true, name: true, sku: true },
        })
      : []

    const topProducts = topProductsResult.map((r) => {
      const detail = productDetails.find((p) => p.id === r.productId)
      return {
        productId: r.productId,
        name: detail?.name || "Unknown",
        sku: detail?.sku || "",
        orderCount: r._count.productId,
      }
    })

    const stats = {
      totalOrders,
      totalSales,
      totalRevenue: totalRevenueResult._sum.totalAmount || 0,
      totalCustomers,
      totalAgents,
      totalProducts,
      recentOrders,
      topProducts,
    }

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
