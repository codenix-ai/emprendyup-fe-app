import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { CreateStore, Store, UserProfile } from '@/lib/schemas/dashboard';

// Store Draft State
interface StoreDraftState {
  draft: Partial<CreateStore>;
  setDraft: (draft: Partial<CreateStore>) => void;
  updateDraft: (updates: Partial<CreateStore>) => void;
  clearDraft: () => void;
  isValid: () => boolean;
}

export const useStoreDraftStore = create<StoreDraftState>()(
  devtools(
    persist(
      (set, get) => ({
        draft: {},
        setDraft: (draft) => set({ draft }),
        updateDraft: (updates) => set((state) => ({ draft: { ...state.draft, ...updates } })),
        clearDraft: () => set({ draft: {} }),
        isValid: () => {
          const { draft } = get();
          return !!(
            draft.name &&
            draft.industry &&
            draft.country &&
            draft.currency &&
            draft.brandColor &&
            draft.subdomain
          );
        },
      }),
      {
        name: 'store-draft',
      }
    )
  )
);

// Dashboard Filters State
interface DashboardFiltersState {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  orderStatus: string[];
  customerStatus: string[];
  searchQuery: string;
  setDateRange: (from: Date | null, to: Date | null) => void;
  setOrderStatus: (status: string[]) => void;
  setCustomerStatus: (status: string[]) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
}

export const useDashboardFiltersStore = create<DashboardFiltersState>()(
  devtools((set) => ({
    dateRange: { from: null, to: null },
    orderStatus: [],
    customerStatus: [],
    searchQuery: '',
    setDateRange: (from, to) => set({ dateRange: { from, to } }),
    setOrderStatus: (status) => set({ orderStatus: status }),
    setCustomerStatus: (status) => set({ customerStatus: status }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    clearFilters: () =>
      set({
        dateRange: { from: null, to: null },
        orderStatus: [],
        customerStatus: [],
        searchQuery: '',
      }),
  }))
);

// Session State
interface SessionState {
  user: UserProfile | null;
  currentStore: Store | null;
  stores: Store[];

  setUser: (user: UserProfile | null) => void;
  setCurrentStore: (store: Store | null) => void;
  setStores: (stores: Store[]) => void;
  addStore: (store: Store) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        currentStore: null,
        currentServiceId: null,
        stores: [],
        setUser: (user) => set({ user }),
        setCurrentStore: (store) => set({ currentStore: store }),
        setStores: (stores) => set({ stores }),
        addStore: (store) => set((state) => ({ stores: [...state.stores, store] })),
        logout: () => set({ user: null, currentStore: null, stores: [] }),
      }),
      {
        name: 'session',
      }
    )
  )
);

// Dashboard UI State
interface DashboardUIState {
  sidebarOpen: boolean;
  selectedOrderId: string | null;
  orderDrawerOpen: boolean;
  inviteModalOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setSelectedOrderId: (id: string | null) => void;
  setOrderDrawerOpen: (open: boolean) => void;
  setInviteModalOpen: (open: boolean) => void;
}

export const useDashboardUIStore = create<DashboardUIState>()(
  devtools((set) => ({
    sidebarOpen: false,
    selectedOrderId: null,
    orderDrawerOpen: false,
    inviteModalOpen: false,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setSelectedOrderId: (id) => set({ selectedOrderId: id }),
    setOrderDrawerOpen: (open) => set({ orderDrawerOpen: open }),
    setInviteModalOpen: (open) => set({ inviteModalOpen: open }),
  }))
);
