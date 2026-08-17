export type Role = "super_admin" | "admin" | "manager" | "agent" | "cashier" | "viewer"
export type Action =
  | "manage_tenants" | "manage_users" | "manage_houses" | "view_all_houses"
  | "manage_agents" | "create_orders" | "view_orders" | "validate_orders"
  | "record_sales" | "record_payments" | "view_payments"
  | "manage_products" | "manage_stock" | "view_commissions" | "validate_commissions"
  | "manage_targets" | "view_dashboard" | "view_analytics" | "access_audit"

const PERMISSIONS: Record<Role, Record<Action, boolean>> = {
  super_admin: {
    manage_tenants: true, manage_users: true, manage_houses: true, view_all_houses: true,
    manage_agents: true, create_orders: true, view_orders: true, validate_orders: true,
    record_sales: true, record_payments: true, view_payments: true,
    manage_products: true, manage_stock: true, view_commissions: true, validate_commissions: true,
    manage_targets: true, view_dashboard: true, view_analytics: true, access_audit: true,
  },
  admin: {
    manage_tenants: false, manage_users: true, manage_houses: true, view_all_houses: true,
    manage_agents: true, create_orders: true, view_orders: true, validate_orders: true,
    record_sales: true, record_payments: true, view_payments: true,
    manage_products: true, manage_stock: true, view_commissions: true, validate_commissions: true,
    manage_targets: true, view_dashboard: true, view_analytics: true, access_audit: true,
  },
  manager: {
    manage_tenants: false, manage_users: false, manage_houses: false, view_all_houses: true,
    manage_agents: true, create_orders: true, view_orders: true, validate_orders: true,
    record_sales: true, record_payments: true, view_payments: true,
    manage_products: true, manage_stock: true, view_commissions: true, validate_commissions: true,
    manage_targets: true, view_dashboard: true, view_analytics: true, access_audit: false,
  },
  agent: {
    manage_tenants: false, manage_users: false, manage_houses: false, view_all_houses: false,
    manage_agents: false, create_orders: true, view_orders: true, validate_orders: false,
    record_sales: true, record_payments: false, view_payments: true,
    manage_products: false, manage_stock: false, view_commissions: true, validate_commissions: false,
    manage_targets: false, view_dashboard: true, view_analytics: false, access_audit: false,
  },
  cashier: {
    manage_tenants: false, manage_users: false, manage_houses: false, view_all_houses: false,
    manage_agents: false, create_orders: false, view_orders: true, validate_orders: false,
    record_sales: false, record_payments: true, view_payments: true,
    manage_products: false, manage_stock: false, view_commissions: false, validate_commissions: false,
    manage_targets: false, view_dashboard: true, view_analytics: false, access_audit: false,
  },
  viewer: {
    manage_tenants: false, manage_users: false, manage_houses: false, view_all_houses: false,
    manage_agents: false, create_orders: false, view_orders: true, validate_orders: false,
    record_sales: false, record_payments: false, view_payments: true,
    manage_products: false, manage_stock: false, view_commissions: true, validate_commissions: false,
    manage_targets: false, view_dashboard: true, view_analytics: true, access_audit: false,
  },
}

export function can(role: Role, action: Action): boolean {
  return PERMISSIONS[role]?.[action] ?? false
}

export function cannot(role: Role, action: Action): boolean {
  return !can(role, action)
}
