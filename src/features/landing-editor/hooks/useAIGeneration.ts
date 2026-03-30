'use client';

import { useState } from 'react';
import type { TenantContext } from '../context/TenantContext';
import type {
  GenerateLandingRequest,
  GenerateLandingResponse,
  ImproveCopyRequest,
  ImproveCopyResponse,
  SuggestPaletteRequest,
  SuggestPaletteResponse,
  AIErrorResponse,
} from '../ai/ai.types';

// ─── useAIGeneration ──────────────────────────────────────────────────────────

export function useAIGeneration(tenant: TenantContext) {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isImproving, setIsImproving] = useState<boolean>(false);
  const [isSuggestingPalette, setIsSuggestingPalette] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = (): void => setError(null);

  // ─── generateLanding ───────────────────────────────────────────────────────

  const generateLanding = async (
    req: Omit<GenerateLandingRequest, 'tenantId' | 'tenantSlug' | 'tenantType'>
  ): Promise<GenerateLandingResponse | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const payload: GenerateLandingRequest = {
        ...req,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        tenantType: tenant.type,
      };

      const response = await fetch('/api/ai/generate-landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: AIErrorResponse = (await response.json()) as AIErrorResponse;
        setError(errorData.error);
        return null;
      }

      return (await response.json()) as GenerateLandingResponse;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── improveCopy ───────────────────────────────────────────────────────────

  const improveCopy = async (req: ImproveCopyRequest): Promise<ImproveCopyResponse | null> => {
    setIsImproving(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/improve-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...req,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          tenantType: tenant.type,
        }),
      });

      if (!response.ok) {
        const errorData: AIErrorResponse = (await response.json()) as AIErrorResponse;
        setError(errorData.error);
        return null;
      }

      return (await response.json()) as ImproveCopyResponse;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setIsImproving(false);
    }
  };

  // ─── suggestPalette ────────────────────────────────────────────────────────

  const suggestPalette = async (
    req: SuggestPaletteRequest
  ): Promise<SuggestPaletteResponse | null> => {
    setIsSuggestingPalette(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/suggest-palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...req,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          tenantType: tenant.type,
        }),
      });

      if (!response.ok) {
        const errorData: AIErrorResponse = (await response.json()) as AIErrorResponse;
        setError(errorData.error);
        return null;
      }

      return (await response.json()) as SuggestPaletteResponse;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setIsSuggestingPalette(false);
    }
  };

  // ─── Public API ────────────────────────────────────────────────────────────

  return {
    generateLanding,
    improveCopy,
    suggestPalette,
    isGenerating,
    isImproving,
    isSuggestingPalette,
    error,
    clearError,
  };
}
