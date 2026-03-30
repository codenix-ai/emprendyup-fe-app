'use client';

// ─── LandingEditorClient ───────────────────────────────────────────────────────
// Entry point client-side del editor de landing pages.
// Usa user.storeId del session store (siempre disponible vía localStorage)
// para buscar la tienda y cargar el borrador existente.

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { gql, useQuery } from '@apollo/client';
import { useSessionStore } from '@/lib/store/dashboard';
import { getCurrentUser } from '@/lib/utils/rbac';
import { landingGqlClient } from './graphql/client';
import {
  migrateV1toV2,
  type LandingPageJSON,
} from '@/lib/landing-renderer/types/landing-json.schema';
import type { DraftConfig } from '@/app/components/LandingEditor/types';
import type { TenantContext, TenantType } from './context/TenantContext';

// ─── GQL — fetch the store the current user owns ─────────────────────────────

const GET_MY_STORE = gql`
  query GetLandingEditorStore($storeId: String!) {
    store(storeId: $storeId) {
      id
      storeId
      name
      businessType
      description
      logoUrl
      primaryColor
      phone
      email
      address
      facebookUrl
      instagramUrl
      whatsappNumber
    }
  }
`;

interface StoreQueryData {
  store: {
    id: string;
    storeId: string;
    name: string;
    businessType: string | null;
    description: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    facebookUrl: string | null;
    instagramUrl: string | null;
    whatsappNumber: string | null;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapBusinessType(raw: string | null | undefined): TenantType {
  if (!raw) return 'store';
  const lower = raw.toLowerCase();
  if (lower.includes('restaurant')) return 'restaurant';
  if (lower.includes('service')) return 'serviceProvider';
  return 'store';
}

// ─── Dynamic EditorRoot (Craft.js = client-only) ─────────────────────────────

const EditorRoot = dynamic(
  () => import('./core/EditorRoot').then((m) => ({ default: m.EditorRoot })),
  {
    ssr: false,
    loading: () => <LoadingScreen message="Cargando editor…" />,
  }
);

// ─── Shared loading / error screens ──────────────────────────────────────────

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        <span className="text-gray-400 text-sm">{message}</span>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-950">
      <div className="text-center space-y-2">
        <p className="text-red-400 font-medium">{message}</p>
        <p className="text-gray-500 text-sm">
          Recarga la página o contacta soporte si el error persiste.
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LandingEditorClient() {
  // user is set by the dashboard layout via getCurrentUser() → localStorage
  const { user: sessionUser } = useSessionStore();

  // Fallback: read directly from localStorage on first render
  // (Zustand hydrates async; localStorage is synchronous)
  const [storeId] = useState<string | null>(() => {
    const fromStore = useSessionStore.getState().user?.storeId ?? null;
    if (fromStore) return fromStore;
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('user');
      return raw ? ((JSON.parse(raw) as { storeId?: string }).storeId ?? null) : null;
    } catch {
      return null;
    }
  });

  const resolvedStoreId = sessionUser?.storeId ?? storeId;

  // ── Fetch store metadata via Apollo ────────────────────────────────────────
  const {
    data: storeData,
    loading: storeLoading,
    error: storeError,
  } = useQuery<StoreQueryData>(GET_MY_STORE, {
    variables: { storeId: resolvedStoreId ?? '' },
    skip: !resolvedStoreId,
  });

  // ── Load existing draft ────────────────────────────────────────────────────
  const [loadedJSON, setLoadedJSON] = useState<LandingPageJSON | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);

  const store = storeData?.store;

  useEffect(() => {
    if (!store?.id) return;

    setDraftLoading(true);
    landingGqlClient
      .loadPage(store.id, 'home')
      .then(({ page }) => {
        if (!page) return; // no "home" page yet — open with default blocks

        const raw: unknown = page.draftConfig ?? page.publishedConfig;
        if (!raw) return;

        const asObj = raw as Record<string, unknown>;

        if (asObj['version'] === '2.0') {
          setLoadedJSON(raw as LandingPageJSON);
        } else {
          setLoadedJSON(migrateV1toV2(raw as DraftConfig, store.id, store.storeId));
        }
      })
      .catch((err: unknown) => {
        console.warn('[LandingEditorClient] loadPage failed — blank canvas:', err);
      })
      .finally(() => {
        setDraftLoading(false);
      });
  }, [store?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!resolvedStoreId) {
    // Try one more sync read in case Zustand hadn't hydrated during useState init
    const user = getCurrentUser();
    if (!user?.storeId) {
      return <ErrorScreen message="No se encontró una tienda asociada a tu cuenta." />;
    }
    // storeId found — will re-render via Zustand reactive update
  }

  if (storeLoading || draftLoading) {
    return <LoadingScreen message={storeLoading ? 'Cargando tienda…' : 'Cargando borrador…'} />;
  }

  if (storeError || !store) {
    return <ErrorScreen message="No se pudo cargar la información de tu tienda." />;
  }

  const tenant: TenantContext = {
    id: store.id,
    slug: store.storeId,
    name: store.name,
    type: mapBusinessType(store.businessType),
    // Store metadata — used to seed block defaults with real data
    logoUrl: store.logoUrl ?? undefined,
    description: store.description ?? undefined,
    brandColor: store.primaryColor ?? undefined,
    phone: store.phone ?? undefined,
    email: store.email ?? undefined,
    address: store.address ?? undefined,
    facebookUrl: store.facebookUrl ?? undefined,
    instagramUrl: store.instagramUrl ?? undefined,
    whatsappNumber: store.whatsappNumber ?? undefined,
  };

  return <EditorRoot tenant={tenant} initialJSON={loadedJSON ?? undefined} />;
}
