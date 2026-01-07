import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, ProductUnit } from '@/types';
import { APP_CONFIG } from '@/config/features';

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.productId === item.productId
          );

          if (existingIndex >= 0) {
            // Update quantity if item exists
            const newItems = [...state.items];
            newItems[existingIndex].qty += item.qty || 1;
            return { items: newItems };
          }

          // Add new item
          return {
            items: [
              ...state.items,
              {
                productId: item.productId,
                productName: item.productName,
                price: item.price,
                qty: item.qty || 1,
                unit: item.unit,
                imageUrl: item.imageUrl,
              },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      updateQuantity: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, qty } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.qty, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.qty,
          0
        );
      },

      getTax: () => {
        return get().getSubtotal() * APP_CONFIG.TAX_RATE;
      },

      getTotal: () => {
        return get().getSubtotal() + get().getTax();
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
