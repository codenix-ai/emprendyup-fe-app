'use client';

// ─── useLandingPersistence ─────────────────────────────────────────────────────
// Hook central de persistencia del editor de landing pages.
// Combina Craft.js (serialización) y el cliente GQL nativo (sin TanStack Query).
//
// Uso:
//   const { saveDraft, publish, loadDraft, isSaving, isPublishing, lastSaved, error } =
//     useLandingPersistence({ tenant, seo, theme });

import { useCallback, useState } from 'react';
import { useEditor } from '@craftjs/core';
import { landingGqlClient } from '../graphql/client';
import { buildSavePageInput } from '../context/TenantContext';
import type { TenantContext } from '../context/TenantContext';
import type {
  LandingSEO,
  LandingTheme,
  LandingPageJSON,
  CraftSerializedNodes,
  LandingBlock,
} from '@/lib/landing-renderer/types/landing-json.schema';

// ─── Extract blocks metadata from Craft nodes ─────────────────────────────────

function extractBlocksFromCraftState(craftState: CraftSerializedNodes): LandingBlock[] {
  return Object.entries(craftState)
    .filter(([id, node]) => id !== 'ROOT' && node.type.resolvedName !== 'div')
    .map(([id, node], index) => ({
      id,
      type: node.type.resolvedName as LandingBlock['type'],
      variant: (node.props.variant as string) ?? 'default',
      visible: (node.props.visible as boolean) ?? true,
      order: index,
      props: node.props,
    }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseLandingPersistenceOptions {
  tenant: TenantContext;
  seo: LandingSEO;
  theme: LandingTheme;
}

interface UseLandingPersistenceReturn {
  saveDraft: () => Promise<void>;
  publish: () => Promise<void>;
  loadDraft: (json: LandingPageJSON) => void;
  isSaving: boolean;
  isPublishing: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export function useLandingPersistence({
  tenant,
  seo,
  theme,
}: UseLandingPersistenceOptions): UseLandingPersistenceReturn {
  const { query, actions } = useEditor();

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Shared serializer ──────────────────────────────────────────────────────

  const serializeCurrentState = useCallback(
    (status: 'draft' | 'published') => {
      const craftStateString = query.serialize();
      const craftState: CraftSerializedNodes = JSON.parse(craftStateString);
      const blocks = extractBlocksFromCraftState(craftState);
      return buildSavePageInput(tenant, craftState, blocks, seo, theme, status);
    },
    [query, tenant, seo, theme]
  );

  // ── Save draft ─────────────────────────────────────────────────────────────

  const saveDraft = useCallback(async (): Promise<void> => {
    setIsSaving(true);
    setError(null);
    try {
      const input = serializeCurrentState('draft');
      await landingGqlClient.saveDraft(input);
      setLastSaved(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }, [serializeCurrentState]);

  // ── Publish ────────────────────────────────────────────────────────────────

  const publish = useCallback(async (): Promise<void> => {
    setIsPublishing(true);
    setError(null);
    try {
      const input = serializeCurrentState('published');
      await landingGqlClient.publish(input);
      setLastSaved(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsPublishing(false);
    }
  }, [serializeCurrentState]);

  // ── Load draft (deserializar JSON → Craft.js canvas) ──────────────────────

  const loadDraft = useCallback(
    (json: LandingPageJSON) => {
      const craftStateString = JSON.stringify(json.craftState);
      actions.deserialize(craftStateString);
    },
    [actions]
  );

  return {
    saveDraft,
    publish,
    loadDraft,
    isSaving,
    isPublishing,
    lastSaved,
    error,
  };
}
