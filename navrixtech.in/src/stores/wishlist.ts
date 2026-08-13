import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  items: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (id) => {
        const exists = get().items.includes(id);
        set({
          items: exists
            ? get().items.filter((i) => i !== id)
            : [...get().items, id],
        });
      },

      has: (id) => get().items.includes(id),

      clear: () => set({ items: [] }),
    }),
    { name: "navrix-wishlist" }
  )
);

export const useWishlistCount = () => useWishlistStore((s) => s.items.length);
