// ─── Tenant Context ────────────────────────────────────────────────────────────
// Contiene la información del tenant activo en el editor.
// Se pasa como prop desde page.tsx (Server Component) hacia EditorRoot (Client).
// No usa hooks ni estado del browser → sin "use client".

import type {
  LandingPageJSON,
  LandingSEO,
  LandingTheme,
  SavePageInput,
  CraftSerializedNodes,
  LandingBlock,
} from '@/lib/landing-renderer/types/landing-json.schema';

// ─── Internal helper ──────────────────────────────────────────────────────────

function tenantIdField(
  tenant: TenantContext
): Pick<SavePageInput, 'storeId' | 'restaurantId' | 'serviceProviderId'> {
  if (tenant.type === 'restaurant') return { restaurantId: tenant.id };
  if (tenant.type === 'serviceProvider') return { serviceProviderId: tenant.id };
  return { storeId: tenant.id };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type TenantType = 'store' | 'restaurant' | 'serviceProvider';

export interface TenantContext {
  /** ID interno del tenant en la base de datos */
  id: string;
  /** Slug público, ej: "mi-tienda" → mi-tienda.emprendyup.com */
  slug: string;
  /** Tipo de negocio — controla qué bloques se muestran en el Toolbox */
  type: TenantType;
  /** Nombre visible del tenant */
  name: string;
  // ── Optional store metadata — used to seed block defaults ──────────────────
  logoUrl?: string;
  description?: string;
  brandColor?: string;
  phone?: string;
  email?: string;
  address?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  whatsappNumber?: string;
  /** Custom domain configured for this tenant, e.g. "mitienda.com" */
  customDomain?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds the `SavePageInput` for the `savePage` GraphQL mutation.
 * Pass `status: "draft"` → populates `draftConfig`.
 * Pass `status: "published"` → populates `publishedConfig`.
 */
export function buildSavePageInput(
  tenant: TenantContext,
  craftState: CraftSerializedNodes,
  blocks: LandingBlock[],
  seo: LandingSEO,
  theme: LandingTheme,
  status: 'draft' | 'published'
): SavePageInput {
  const now = new Date().toISOString();

  const pageJson: LandingPageJSON = {
    version: '2.0',
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    status,
    updatedAt: now,
    ...(status === 'published' ? { publishedAt: now } : {}),
    seo,
    theme,
    craftState,
    blocks,
  };

  return {
    slug: 'home',
    ...tenantIdField(tenant),
    draftConfig: pageJson,
    ...(status === 'published' ? { publishedConfig: pageJson } : {}),
  };
}

/**
 * Determina si un bloque debe mostrarse en el Toolbox según el tipo de negocio.
 * Algunos bloques son exclusivos de ciertos tipos (ej: BookingForm solo para restaurant/service).
 */
export function isBlockAllowedForTenant(blockType: string, tenantType: TenantType): boolean {
  const exclusiveBlocks: Record<string, TenantType[]> = {
    BookingForm: ['restaurant', 'serviceProvider'],
    ProductGrid: ['store', 'restaurant'],
  };

  const allowed = exclusiveBlocks[blockType];
  if (!allowed) return true; // bloques sin restricción → disponibles para todos
  return allowed.includes(tenantType);
}

// ─── Store-aware block defaults ───────────────────────────────────────────────
// Returns overrides that seed blocks with the real store data.
// Merged on top of static *_DEFAULTS so unchanged fields keep their defaults.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export function getStoreAwareDefaults(blockType: string, tenant: TenantContext): AnyRecord {
  const name = tenant.name || 'Mi Negocio';

  switch (blockType) {
    case 'HeroBanner':
      return {
        title: `Bienvenido a ${name}`,
        subtitle: tenant.description ?? 'Descubre todo lo que tenemos para ti',
      };

    case 'NavigationBar':
      return {
        logoText: name,
        logoUrl: tenant.logoUrl ?? '',
      };

    case 'FooterSection':
      return {
        companyName: name,
        tagline: tenant.description ?? '',
        phone: tenant.phone ?? '',
        email: tenant.email ?? '',
        address: tenant.address ?? '',
        socialFacebook: tenant.facebookUrl ?? '',
        socialInstagram: tenant.instagramUrl ?? '',
        socialWhatsapp: tenant.whatsappNumber ?? '',
      };

    case 'ContactSection':
      return {
        email: tenant.email ?? '',
        phone: tenant.phone ?? '',
        address: tenant.address ?? '',
        whatsapp: tenant.whatsappNumber ?? '',
      };

    case 'AboutSection':
      return {
        title: `Sobre ${name}`,
        description:
          tenant.description ??
          'Somos una empresa comprometida con la calidad y la satisfacción de nuestros clientes.',
        image: tenant.logoUrl ?? '',
      };

    case 'BrandSection':
      return {
        name,
        logoUrl: tenant.logoUrl ?? '',
        description: tenant.description ?? '',
        socialFacebook: tenant.facebookUrl ?? '',
        socialInstagram: tenant.instagramUrl ?? '',
      };

    case 'CTABanner':
      return {
        title: `¿Listo para conocer ${name}?`,
        subtitle: tenant.description ?? '',
      };

    default:
      return {};
  }
}
