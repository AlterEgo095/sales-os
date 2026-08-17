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
import { SettingsView } from '@/components/modules/settings-view'
import { Separator } from '@/components/ui/separator'

const viewLabels: Record<ViewId, string> = {
  dashboard: 'Tableau de bord',
  customers: 'Clients',
  products: 'Produits',
  orders: 'Commandes',
  agents: 'Agents',
  payments: 'Paiements',
  stock: 'Stock',
  targets: 'Objectifs',
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
      case 'stock':
        return <StockView />
      case 'settings':
        return <SettingsView />
      case 'targets':
        return (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <TargetIcon />
            <p className="mt-4 text-lg font-medium">Objectifs</p>
            <p className="text-sm text-gray-600">Disponible en V2 — Intelligence</p>
          </div>
        )
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
              SALES OS — MVP V1 — Architecture Implementation-Ready
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

function TargetIcon() {
  return (
    <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 13a1 1 0 100-2 1 1 0 000 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 13a1 1 0 100-2 1 1 0 000 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.83a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14" />
    </svg>
  )
}
