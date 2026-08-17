import { db } from "@/lib/db"

/**
 * Ensures all queries are scoped to a specific tenant.
 * This is the application-level tenant isolation.
 * With PostgreSQL RLS, this would be enforced at DB level too.
 */
export function tenantScope(tenantId: string) {
  return {
    tenants: { findMany: () => db.tenant.findMany({ where: { id: tenantId } }) },
    users: { findMany: () => db.user.findMany({ where: { tenantId } }) },
    houses: { findMany: () => db.house.findMany({ where: { tenantId } }) },
    agents: { findMany: () => db.agent.findMany({ where: { tenantId } }) },
    customers: { findMany: () => db.customer.findMany({ where: { tenantId } }) },
    products: { findMany: () => db.product.findMany({ where: { tenantId } }) },
    orders: { findMany: () => db.order.findMany({ where: { tenantId } }) },
    sales: { findMany: () => db.sale.findMany({ where: { tenantId } }) },
    payments: { findMany: () => db.payment.findMany({ where: { tenantId } }) },
    stock: { findMany: () => db.stock.findMany({ where: { tenantId } }) },
    commissions: { findMany: () => db.commission.findMany({ where: { tenantId } }) },
    targets: { findMany: () => db.target.findMany({ where: { tenantId } }) },
  }
}
