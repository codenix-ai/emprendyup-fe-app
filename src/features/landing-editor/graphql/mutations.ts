// ─── Landing Editor GraphQL Mutations ─────────────────────────────────────────
// Documentos gql para usar con useMutation() de @apollo/client dentro de
// componentes React que ya están bajo <ApolloProvider>.

import { gql } from '@apollo/client';
import type { SavePageInput } from '@/lib/landing-renderer/types/landing-json.schema';

// ─── savePage (draft + publish, same mutation) ────────────────────────────────
// • Para guardar borrador: pasar { slug, storeId?, draftConfig }
// • Para publicar:         pasar { slug, storeId?, publishedConfig }

export interface SavePageVars {
  input: SavePageInput;
}

export interface SavePageData {
  savePage: {
    id: string;
    slug: string;
    updatedAt: string;
  };
}

export const SAVE_PAGE = gql`
  mutation SavePage($input: SavePageInput!) {
    savePage(input: $input) {
      id
      slug
      updatedAt
    }
  }
`;

// ─── Load page (query) ────────────────────────────────────────────────────────

export interface GetLandingPageVars {
  tenantId: string;
}

export interface GetLandingPageData {
  getLandingPage: {
    id: string;
    status: 'draft' | 'published';
    contentJson: string; // JSON string — deserializar con JSON.parse
    updatedAt: string;
    publishedAt?: string;
  } | null;
}

export const GET_LANDING_PAGE = gql`
  query GetLandingPage($tenantId: String!) {
    getLandingPage(tenantId: $tenantId) {
      id
      status
      contentJson
      updatedAt
      publishedAt
    }
  }
`;
