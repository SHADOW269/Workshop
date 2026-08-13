import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  image: string;
  variant?: { id: string; name: string; value: string };
  quantity: number;
};

export type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id"> & { id?: string }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  subtotal: () => number;
  itemCount: () => number;
  appliedCoupon: { code: string; discount: number } | null;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  shipping: number;
  setShipping: (s: number) => void;
};

function getItemId(
  productId: string,
  variant?: { id: string; name: string; value: string }
): string {
  return variant ? `${productId}-${variant.id}` : productId;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      shipping: 0,

      addItem: (item) => {
        const id = item.id ?? getItemId(item.productId, item.variant);
        const existing = get().items.find((i) => i.id === id);

        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === id ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, id, quantity: item.quantity ?? 1 }] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) });
          return;
        }
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        });
      },

      clearCart: () => set({ items: [], appliedCoupon: null }),

      subtotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      total: () => {
        const state = get();
        const sub = state.subtotal();
        const discount = state.appliedCoupon?.discount ?? 0;
        return Math.max(0, sub - discount + state.shipping);
      },

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      applyCoupon: (code, discount) =>
        set({ appliedCoupon: { code, discount } }),

      removeCoupon: () => set({ appliedCoupon: null }),

      setShipping: (s) => set({ shipping: s }),
    }),
    { name: "navrix-cart" }
  )
);

export const useCartItems = () => useCartStore((s) => s.items);
export const useCartTotal = () => useCartStore((s) => s.total());
export const useCartSubtotal = () => useCartStore((s) => s.subtotal());
export const useCartItemCount = () => useCartStore((s) => s.itemCount());
export const useCartCoupon = () => useCartStore((s) => s.appliedCoupon);
export const useCartShipping = () => useCartStore((s) => s.shipping);
