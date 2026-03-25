import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface CustomCartItem {
  id: string; // client-generated uuid for list key
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface FairCartStatePerFair {
  quantities: Record<string, number>; // productId -> qty
  customItems: CustomCartItem[];
  paymentMethod: string;
  customerName: string;
  customerContact: string;
}

interface FairCartState {
  byFairId: Record<string, FairCartStatePerFair>;

  ensureFair: (fairId: string) => void;

  setQuantity: (fairId: string, productId: string, quantity: number) => void;
  increment: (fairId: string, productId: string) => void;
  decrement: (fairId: string, productId: string) => void;
  clearFair: (fairId: string) => void;

  setPaymentMethod: (fairId: string, method: string) => void;
  setCustomerName: (fairId: string, name: string) => void;
  setCustomerContact: (fairId: string, contact: string) => void;

  addCustomItem: (fairId: string, item: Omit<CustomCartItem, 'id'>) => void;
  removeCustomItem: (fairId: string, itemId: string) => void;
  updateCustomItemQty: (fairId: string, itemId: string, quantity: number) => void;
}

const defaultPerFair: FairCartStatePerFair = {
  quantities: {},
  customItems: [],
  paymentMethod: 'CASH',
  customerName: '',
  customerContact: '',
};

function clampQty(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const useFairCartStore = create<FairCartState>()(
  devtools(
    persist(
      (set, get) => ({
        byFairId: {},

        ensureFair: (fairId) => {
          const current = get().byFairId[fairId];
          if (current) return;
          set((state) => ({
            byFairId: { ...state.byFairId, [fairId]: { ...defaultPerFair } },
          }));
        },

        setQuantity: (fairId, productId, quantity) => {
          const q = clampQty(quantity);
          set((state) => {
            const per = state.byFairId[fairId] || { ...defaultPerFair };
            const nextQuantities = { ...per.quantities, [productId]: q };
            if (q === 0) delete nextQuantities[productId];
            return {
              byFairId: {
                ...state.byFairId,
                [fairId]: { ...per, quantities: nextQuantities },
              },
            };
          });
        },

        increment: (fairId, productId) => {
          const per = get().byFairId[fairId] || { ...defaultPerFair };
          const current = per.quantities[productId] || 0;
          get().setQuantity(fairId, productId, current + 1);
        },

        decrement: (fairId, productId) => {
          const per = get().byFairId[fairId] || { ...defaultPerFair };
          const current = per.quantities[productId] || 0;
          get().setQuantity(fairId, productId, current - 1);
        },

        clearFair: (fairId) => {
          set((state) => ({
            byFairId: {
              ...state.byFairId,
              [fairId]: { ...defaultPerFair },
            },
          }));
        },

        setPaymentMethod: (fairId, method) => {
          set((state) => {
            const per = state.byFairId[fairId] || { ...defaultPerFair };
            return { byFairId: { ...state.byFairId, [fairId]: { ...per, paymentMethod: method } } };
          });
        },

        setCustomerName: (fairId, name) => {
          set((state) => {
            const per = state.byFairId[fairId] || { ...defaultPerFair };
            return { byFairId: { ...state.byFairId, [fairId]: { ...per, customerName: name } } };
          });
        },

        setCustomerContact: (fairId, contact) => {
          set((state) => {
            const per = state.byFairId[fairId] || { ...defaultPerFair };
            return {
              byFairId: { ...state.byFairId, [fairId]: { ...per, customerContact: contact } },
            };
          });
        },

        addCustomItem: (fairId, item) => {
          set((state) => {
            const per = state.byFairId[fairId] || { ...defaultPerFair };
            const newItem: CustomCartItem = { id: nanoid(), ...item };
            return {
              byFairId: {
                ...state.byFairId,
                [fairId]: { ...per, customItems: [...(per.customItems ?? []), newItem] },
              },
            };
          });
        },

        removeCustomItem: (fairId, itemId) => {
          set((state) => {
            const per = state.byFairId[fairId] || { ...defaultPerFair };
            return {
              byFairId: {
                ...state.byFairId,
                [fairId]: {
                  ...per,
                  customItems: (per.customItems ?? []).filter((i) => i.id !== itemId),
                },
              },
            };
          });
        },

        updateCustomItemQty: (fairId, itemId, quantity) => {
          const q = clampQty(quantity);
          set((state) => {
            const per = state.byFairId[fairId] || { ...defaultPerFair };
            return {
              byFairId: {
                ...state.byFairId,
                [fairId]: {
                  ...per,
                  customItems: (per.customItems ?? []).map((i) =>
                    i.id === itemId ? { ...i, quantity: q } : i
                  ),
                },
              },
            };
          });
        },
      }),
      { name: 'fair-cart' }
    )
  )
);
