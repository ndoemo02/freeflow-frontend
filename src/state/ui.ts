import { create } from 'zustand'

type UIState = {
  drawerOpen: boolean;
  authOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  openAuth: () => void;
  closeAuth: () => void;
}

export const useUI = create<UIState>((set) => ({
  drawerOpen: false,
  authOpen: false,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  openAuth: () => set({ authOpen: true }),
  closeAuth: () => set({ authOpen: false }),
}))


