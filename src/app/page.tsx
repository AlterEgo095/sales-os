'use client'

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { useNavigation, type ViewId } from '@/store/navigation'
import { DashboardView } from '@/components/modules/dashboard-view'
import { CustomersView } from '@/components/modules/customers-view'
import { ProductsView } from '@/components/modules/products-view'
import { OrdersView } from '@/components/modules/orders-view'
import { AgentsView } from '@/components/modules/agents-view'
import { PaymentsView } from '@/components/modules/payments-view'
import { StockView } from '@/components/modules/stock-view'
import { TargetsView } from '@/components/modules/targets-view'
import { CommissionsView } from '@/components/modules/commissions-view'
import { AuditView } from '@/components/modules/audit-view'
import { RbacView } from '@/components/modules/rbac-view'
import { SettingsView } from '@/components/modules/settings-view'
import { Separator } from '@/components/ui/separator'

const viewLabels: Record<ViewId, string> = {
  dashboard: 'Tableau de bord',
  customers: 'Clients',
  products: 'Produits',
  orders: 'Commandes',
  agents: 'Agents',
  payments: 'Paiements',
  commissions: 'Commissions',
  stock: 'Stock',
  targets: 'Objectifs',
  audit: 'Journal d\'audit',
  rbac: 'Permissions (RBAC)',
  settings: 'Parametres',
}

export default function SalesOSApp() {
  const { activeView, setActiveView } = useNavigation()

  const handleNavigate = (view: string) => {
    setActiveView(view as ViewId)
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />
      case 'customers':
        return <CustomersView />
      case 'products':
        return <ProductsView />
      case 'orders':
        return <OrdersView />
      case 'agents':
        return <AgentsView />
      case 'payments':
        return <PaymentsView />
      case 'commissions':
        return <CommissionsView />
      case 'stock':
        return <StockView />
      case 'targets':
        return <TargetsView />
      case 'audit':
        return <AuditView />
      case 'rbac':
        return <RbacView />
      case 'settings':
        return <SettingsView />
      default:
        return <DashboardView onNavigate={handleNavigate} />
    }
  }

  return (
    <SidebarProvider
      style={{
        '--sidebar-width': '16rem',
        '--sidebar-width-icon': '3rem',
      } as React.CSSProperties}
    >
      <div className="min-h-screen flex w-full bg-[#0a0f1a]">
        <AppSidebar />
        <SidebarInset className="bg-[#0a0f1a]">
          {/* Top Header */}
          <header className="flex h-12 items-center gap-3 px-4 border-b border-[#1f2937] bg-[#0a0f1a]/80 backdrop-blur-sm sticky top-0 z-40">
            <SidebarTrigger className="text-gray-400 hover:text-white hover:bg-[#1f2937]/50" />
            <Separator orientation="vertical" className="h-4 bg-[#1f2937]" />
            <span className="text-sm font-medium text-gray-300">
              {viewLabels[activeView]}
            </span>
          </header>

          {/* Main Content */}
          <div className="flex-1 p-4 md:p-6 overflow-auto">
            {renderView()}
          </div>

          {/* Footer */}
          <footer className="border-t border-[#1f2937] px-6 py-3 mt-auto">
            <div className="text-center text-xs text-gray-600">
              SALES OS — V3 — Production Ready
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
