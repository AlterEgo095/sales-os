import { create } from 'zustand'

export type ViewId = 
  | 'dashboard'
  | 'customers'
  | 'products'
  | 'orders'
  | 'agents'
  | 'payments'
  | 'commissions'
  | 'stock'
  | 'targets'
  | 'audit'
  | 'rbac'
  | 'settings'

interface NavigationState {
  activeView: ViewId
  setActiveView: (view: ViewId) => void
}

export const useNavigation = create<NavigationState>((set) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
}))
