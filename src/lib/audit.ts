import { db } from "@/lib/db"

export async function logAudit(params: {
  tenantId: string
  userId?: string
  action: string
  entityType: string
  entityId: string
  changes?: Record<string, unknown>
  ipAddress?: string
}) {
  return db.auditEvent.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      changes: JSON.stringify(params.changes || {}),
      ipAddress: params.ipAddress,
    },
  })
}
