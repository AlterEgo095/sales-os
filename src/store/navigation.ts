import { create } from 'zustand'

export type ViewId = 
  | 'dashboard'
  | 'customers'
  | 'products'
  | 'orders'
  | 'agents'
  | 'payments'
  | 'stock'
  | 'targets'
  | 'commissions'
  | 'settings'

interface NavigationState {
  activeView: ViewId
  setActiveView: (view: ViewId) => void
}

export const useNavigation = create<NavigationState>((set) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
}))
