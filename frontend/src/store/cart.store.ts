/**
 * Client-side cart for spare parts retail checkout.
 * Persisted locally; stock/price revalidated on checkout against API.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  sparePartId: string;
  slug: string;
  partNumber: string;
  nameFa: string;
  imageUrl: string | null;
  unitPrice: number;
  currency: string;
  quantity: number;
  maxStock: number;
};

type CartStore = {
  lines: CartLine[];
  addItem: (item: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  setQuantity: (sparePartId: string, quantity: number) => void;
  removeItem: (sparePartId: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      lines: [],

      addItem: (item) => {
        const qty = Math.max(1, item.quantity ?? 1);
        set((state) => {
          const existing = state.lines.find(
            (line) => line.sparePartId === item.sparePartId,
          );
          if (existing) {
            return {
              lines: state.lines.map((line) =>
                line.sparePartId === item.sparePartId
                  ? {
                      ...line,
                      ...item,
                      quantity: Math.min(
                        line.maxStock || item.maxStock,
                        line.quantity + qty,
                      ),
                    }
                  : line,
              ),
            };
          }
          return {
            lines: [
              ...state.lines,
              {
                ...item,
                quantity: Math.min(item.maxStock, qty),
              },
            ],
          };
        });
      },

      setQuantity: (sparePartId, quantity) => {
        set((state) => ({
          lines: state.lines
            .map((line) => {
              if (line.sparePartId !== sparePartId) return line;
              const next = Math.max(
                0,
                Math.min(line.maxStock, Math.floor(quantity)),
              );
              return { ...line, quantity: next };
            })
            .filter((line) => line.quantity > 0),
        }));
      },

      removeItem: (sparePartId) => {
        set((state) => ({
          lines: state.lines.filter((line) => line.sparePartId !== sparePartId),
        }));
      },

      clear: () => set({ lines: [] }),

      count: () => get().lines.reduce((sum, line) => sum + line.quantity, 0),

      subtotal: () =>
        get().lines.reduce(
          (sum, line) => sum + line.unitPrice * line.quantity,
          0,
        ),
    }),
    {
      name: "spare-parts-cart",
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);
