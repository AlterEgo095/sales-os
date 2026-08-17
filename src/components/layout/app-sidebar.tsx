'use client'

import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  UserCircle,
  CreditCard,
  Warehouse,
  Target,
  Settings,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { useNavigation, type ViewId } from '@/store/navigation'

const mainNav = [
  { id: 'dashboard' as ViewId, label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'orders' as ViewId, label: 'Commandes', icon: ShoppingCart },
  { id: 'customers' as ViewId, label: 'Clients', icon: Users },
  { id: 'products' as ViewId, label: 'Produits', icon: Package },
]

const secondaryNav = [
  { id: 'agents' as ViewId, label: 'Agents', icon: UserCircle },
  { id: 'payments' as ViewId, label: 'Paiements', icon: CreditCard },
  { id: 'stock' as ViewId, label: 'Stock', icon: Warehouse },
  { id: 'targets' as ViewId, label: 'Objectifs', icon: Target },
]

export function AppSidebar() {
  const { activeView, setActiveView } = useNavigation()

  return (
    <Sidebar className="bg-[#0d1117] border-r border-[#1f2937]">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="text-xl font-black text-white tracking-tight">
            SALES <span className="text-blue-500">OS</span>
          </div>
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded border border-blue-500/30 text-blue-400 bg-blue-500/10">
            V1
          </span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 text-[10px] uppercase tracking-widest">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeView === item.id}
                    onClick={() => setActiveView(item.id)}
                    tooltip={item.label}
                    className={
                      activeView === item.id
                        ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/15 hover:text-blue-300'
                        : 'text-gray-400 hover:bg-[#1f2937]/50 hover:text-white'
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 text-[10px] uppercase tracking-widest">
            Gestion
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeView === item.id}
                    onClick={() => setActiveView(item.id)}
                    tooltip={item.label}
                    className={
                      activeView === item.id
                        ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/15 hover:text-blue-300'
                        : 'text-gray-400 hover:bg-[#1f2937]/50 hover:text-white'
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeView === 'settings'}
              onClick={() => setActiveView('settings')}
              tooltip="Parametres"
              className="text-gray-500 hover:bg-[#1f2937]/50 hover:text-gray-300"
            >
              <Settings className="w-4 h-4" />
              <span>Parametres</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
