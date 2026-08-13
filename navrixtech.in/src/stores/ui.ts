import { create } from "zustand";

type UIState = {
  searchOpen: boolean;
  cartOpen: boolean;
  mobileMenuOpen: boolean;
  toggleSearch: () => void;
  toggleCart: () => void;
  toggleMobileMenu: () => void;
  closeAll: () => void;
};

export const useUIStore = create<UIState>()((set) => ({
  searchOpen: false,
  cartOpen: false,
  mobileMenuOpen: false,

  toggleSearch: () =>
    set((s) => ({
      searchOpen: !s.searchOpen,
      cartOpen: false,
      mobileMenuOpen: false,
    })),

  toggleCart: () =>
    set((s) => ({
      cartOpen: !s.cartOpen,
      searchOpen: false,
      mobileMenuOpen: false,
    })),

  toggleMobileMenu: () =>
    set((s) => ({
      mobileMenuOpen: !s.mobileMenuOpen,
      searchOpen: false,
      cartOpen: false,
    })),

  closeAll: () =>
    set({ searchOpen: false, cartOpen: false, mobileMenuOpen: false }),
}));
