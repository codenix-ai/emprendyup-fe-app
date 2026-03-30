// ─── AI Integration Types ─────────────────────────────────────────────────────
// Contratos de datos para los 3 endpoints de IA del landing editor.

import type {
  LandingPageJSON,
  ThemePreset,
} from '@/lib/landing-renderer/types/landing-json.schema';
import type { TenantType } from '../context/TenantContext';

// ─── Generate Landing ─────────────────────────────────────────────────────────

export interface GenerateLandingRequest {
  businessDescription: string; // "Vendo tortas artesanales en Buenos Aires"
  tenantType: TenantType;
  tenantId: string;
  tenantSlug: string;
  businessName?: string;
  tone?: 'professional' | 'friendly' | 'bold' | 'elegant' | 'minimal';
  language?: 'es' | 'en' | 'pt';
}

export interface GenerateLandingResponse {
  landing: LandingPageJSON;
  suggestedPreset: ThemePreset;
  generationId: string; // UUID para auditoría
}

// ─── Improve Copy ─────────────────────────────────────────────────────────────

export interface ImproveCopyRequest {
  text: string; // Texto original a mejorar
  context: string; // "headline del hero banner de una panadería"
  tone?: 'professional' | 'friendly' | 'bold' | 'elegant' | 'minimal';
  tenantType?: TenantType;
  maxLength?: number; // Límite de caracteres (opcional)
}

export interface ImproveCopyResponse {
  improvedText: string;
  alternatives: string[]; // 2 variantes adicionales
}

// ─── Suggest Palette ──────────────────────────────────────────────────────────

export interface SuggestPaletteRequest {
  businessDescription: string;
  tenantType?: TenantType;
  mood?: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'dark' | 'light';
}

export interface SuggestPaletteResponse {
  preset: ThemePreset;
  reasoning: string; // "Elegí 'natural-earth' porque tu negocio evoca calidez…"
}

// ─── Generic API error ────────────────────────────────────────────────────────

export interface AIErrorResponse {
  error: string;
  code: 'rate_limit' | 'invalid_request' | 'generation_failed' | 'server_error';
}
