import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface FairCartStatePerFair {
  quantities: Record<string, number>; // productId -> qty
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
}

const defaultPerFair: FairCartStatePerFair = {
  quantities: {},
  paymentMethod: 'CASH',
  customerName: '',
  customerContact: '',
};

function clampQty(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
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
      }),
      { name: 'fair-cart' }
    )
  )
);
