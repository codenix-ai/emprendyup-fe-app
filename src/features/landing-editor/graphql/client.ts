// ─── Landing Editor GraphQL Client ────────────────────────────────────────────
// Cliente fetch liviano para usar en contextos fuera de ApolloProvider
// (ej: callbacks de guardado que se ejecutan en event handlers).
// Para hooks React, usar useMutation de @apollo/client con los documentos de mutations.ts.

import type { SavePageInput } from '@/lib/landing-renderer/types/landing-json.schema';

const GQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? 'http://localhost:4000/graphql';

interface GQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

function getAuthHeader(): string {
  if (typeof window === 'undefined') return '';
  const token = localStorage.getItem('accessToken') ?? localStorage.getItem('token') ?? '';
  return token ? `Bearer ${token}` : '';
}

async function gqlFetch<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(GQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`GraphQL network error: ${res.status} ${res.statusText}`);
  }

  const json: GQLResponse<T> = await res.json();

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(' | '));
  }

  if (json.data === undefined) {
    throw new Error('GraphQL response missing data field');
  }

  return json.data;
}

// ─── Typed callers ────────────────────────────────────────────────────────────

const SAVE_PAGE_MUTATION = /* GraphQL */ `
  mutation SavePage($input: SavePageInput!) {
    savePage(input: $input) {
      id
      slug
      updatedAt
    }
  }
`;

const GET_PAGE_QUERY = /* GraphQL */ `
  query GetPages($storeId: String) {
    pages(storeId: $storeId) {
      id
      slug
      draftConfig
      publishedConfig
      createdAt
      updatedAt
    }
  }
`;

export interface SavePageResult {
  savePage: { id: string; slug: string; updatedAt: string };
}

export interface LoadPageResult {
  pages: Array<{
    id: string;
    slug: string;
    draftConfig?: unknown;
    publishedConfig?: unknown;
    createdAt: string;
    updatedAt: string;
  }>;
}

export const landingGqlClient = {
  /** Save as draft: passes { slug, storeId?, draftConfig } */
  saveDraft: (input: SavePageInput) => gqlFetch<SavePageResult>(SAVE_PAGE_MUTATION, { input }),

  /** Publish: passes { slug, storeId?, publishedConfig } */
  publish: (input: SavePageInput) => gqlFetch<SavePageResult>(SAVE_PAGE_MUTATION, { input }),

  /** Load pages by storeId, then find the "home" slug */
  loadPage: (storeId: string, slug = 'home') =>
    gqlFetch<LoadPageResult>(GET_PAGE_QUERY, { storeId }).then((res) => ({
      page: res.pages.find((p) => p.slug === slug) ?? null,
    })),
};
