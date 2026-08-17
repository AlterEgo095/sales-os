import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding SALES OS...')

  // Create tenant
  const tenant = await prisma.tenant.create({
    data: { name: 'SALES OS Demo', slug: 'demo', status: 'active' },
  })
  console.log('✅ Tenant created:', tenant.slug)

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@salesos.com',
      passwordHash: 'admin123',
      firstName: 'Admin',
      lastName: 'SALES OS',
      role: 'admin',
      status: 'active',
    },
  })
  console.log('✅ Admin user created')

  // Create manager user
  const manager = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'manager@salesos.com',
      passwordHash: 'manager123',
      firstName: 'Marie',
      lastName: 'Tshala',
      role: 'manager',
      status: 'active',
    },
  })

  // Create agent user
  const agentUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'agent@salesos.com',
      passwordHash: 'agent123',
      firstName: 'Patrick',
      lastName: 'Lukaku',
      role: 'agent',
      status: 'active',
    },
  })

  // Create house
  const house = await prisma.house.create({
    data: {
      tenantId: tenant.id,
      name: 'Maison Kinshasa',
      code: 'KIN-001',
      city: 'Kinshasa',
      country: 'CD',
      managerId: manager.id,
      status: 'active',
    },
  })
  console.log('✅ House created:', house.code)

  // Create agent
  const agent = await prisma.agent.create({
    data: {
      tenantId: tenant.id,
      userId: agentUser.id,
      houseId: house.id,
      code: 'AG-001',
      commissionRate: 5.0,
      status: 'active',
    },
  })
  console.log('✅ Agent created')

  // Create customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: { tenantId: tenant.id, houseId: house.id, firstName: 'Jean', lastName: 'Kabongo', phone: '+243820000001', orderSource: 'manual', status: 'active' },
    }),
    prisma.customer.create({
      data: { tenantId: tenant.id, houseId: house.id, firstName: 'Grace', lastName: 'Mbuyi', phone: '+243820000002', orderSource: 'referral', status: 'active' },
    }),
    prisma.customer.create({
      data: { tenantId: tenant.id, houseId: house.id, firstName: 'David', lastName: 'Nsimba', phone: '+243820000003', orderSource: 'manual', status: 'active' },
    }),
  ])
  console.log('✅ Customers created:', customers.length)

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: { tenantId: tenant.id, houseId: house.id, name: 'Pack Starter', sku: 'PK-001', unitPrice: 50, currency: 'USD', category: 'pack', status: 'active' },
    }),
    prisma.product.create({
      data: { tenantId: tenant.id, houseId: house.id, name: 'Pack Premium', sku: 'PK-002', unitPrice: 120, currency: 'USD', category: 'pack', status: 'active' },
    }),
    prisma.product.create({
      data: { tenantId: tenant.id, houseId: house.id, name: 'Service Consulting', sku: 'SVC-001', unitPrice: 200, currency: 'USD', category: 'service', status: 'active' },
    }),
  ])
  console.log('✅ Products created:', products.length)

  // Create stock
  await Promise.all(products.map(p =>
    prisma.stock.create({
      data: { tenantId: tenant.id, houseId: house.id, productId: p.id, quantity: 100, reserved: 0 },
    })
  ))
  console.log('✅ Stock initialized')

  // Create sample orders
  const order1 = await prisma.order.create({
    data: {
      tenantId: tenant.id, houseId: house.id, customerId: customers[0].id,
      source: 'client', agentId: agent.id, sellerId: manager.id,
      status: 'confirmed', totalAmount: 170, currency: 'USD',
    },
  })
  await prisma.orderItem.createMany({
    data: [
      { tenantId: tenant.id, orderId: order1.id, productId: products[0].id, quantity: 1, unitPrice: 50, discount: 0, total: 50 },
      { tenantId: tenant.id, orderId: order1.id, productId: products[1].id, quantity: 1, unitPrice: 120, discount: 0, total: 120 },
    ],
  })

  const order2 = await prisma.order.create({
    data: {
      tenantId: tenant.id, houseId: house.id, customerId: customers[1].id,
      source: 'agent', agentId: agent.id,
      status: 'draft', totalAmount: 200, currency: 'USD',
    },
  })
  await prisma.orderItem.create({
    data: { tenantId: tenant.id, orderId: order2.id, productId: products[2].id, quantity: 1, unitPrice: 200, discount: 0, total: 200 },
  })
  console.log('✅ Sample orders created')

  // Create a target
  await prisma.target.create({
    data: { tenantId: tenant.id, houseId: house.id, period: '2026-Q1', type: 'revenue', value: 10000, achieved: 370 },
  })
  console.log('✅ Target created')

  console.log('\n🎉 Seeding complete!')
  console.log('\n📧 Login credentials:')
  console.log('   Admin:    admin@salesos.com / admin123')
  console.log('   Manager:  manager@salesos.com / manager123')
  console.log('   Agent:    agent@salesos.com / agent123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
