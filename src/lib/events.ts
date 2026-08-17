import Redis from "ioredis"

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
  publisher: Redis | undefined
}

function getRedisUrl(): string {
  return process.env.REDIS_URL || "redis://localhost:6379"
}

export const redis = globalForRedis.redis ?? new Redis(getRedisUrl(), { lazyConnect: true })
export const publisher = globalForRedis.publisher ?? new Redis(getRedisUrl(), { lazyConnect: true })

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis
  globalForRedis.publisher = publisher
}

export interface AppEvent {
  eventId: string
  eventType: string
  aggregateType: string
  aggregateId: string
  tenantId: string
  timestamp: string
  version: number
  payload: Record<string, unknown>
  metadata: {
    triggeredBy?: string
    correlationId?: string
    sourceModule: string
  }
}

export async function publishEvent(event: AppEvent): Promise<void> {
  try {
    await publisher.publish(
      `sales-os:${event.aggregateType}`,
      JSON.stringify(event)
    )
  } catch (error) {
    console.error("[EventBus] Failed to publish event:", error)
  }
}

export async function subscribeToEvents(
  aggregateType: string,
  handler: (event: AppEvent) => Promise<void>
): Promise<void> {
  const channel = `sales-os:${aggregateType}`
  redis.subscribe(channel)
  redis.on("message", async (ch, message) => {
    if (ch === channel) {
      try {
        const event = JSON.parse(message) as AppEvent
        await handler(event)
      } catch (error) {
        console.error("[EventBus] Handler error:", error)
      }
    }
  })
}
