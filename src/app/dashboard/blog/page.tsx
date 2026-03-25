'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { gql, useQuery, useMutation } from '@apollo/client';
import { Plus, Edit, Trash2, FileText, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useSessionStore } from '@/lib/store/dashboard';
import { getUserFromLocalStorage } from '@/lib/utils/localAuth';
import type { UserProfile } from '@/lib/schemas/dashboard';

// ─── Types ────────────────────────────────────────────────────────────────────

type PostStatus = 'PUBLISHED' | 'DRAFT';
type StatusFilter = PostStatus | undefined;
type TenantType = 'store' | 'restaurant' | 'admin';

interface BlogCategory {
  id?: string;
  name: string;
  slug?: string;
}

interface PostTag {
  id?: string;
  name: string;
  slug?: string;
}

interface PostTagItem {
  tag: PostTag;
}

interface PostCreator {
  id: string;
  name: string;
}

interface PostItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImageUrl?: string;
  publishedAt?: string;
  status?: string;
  blogCategory?: BlogCategory;
  tags?: PostTagItem[];
  creator?: PostCreator;
}

interface PaginatedPosts {
  items: PostItem[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  pageSize?: number;
  hasPrevPage?: boolean;
}

// ─── GraphQL Documents ────────────────────────────────────────────────────────

const LIST_POSTS_BY_STORE = gql`
  query ListPostsByStore($storeId: ID!, $status: PostStatus, $page: Int, $pageSize: Int) {
    listPostsByStore(storeId: $storeId, status: $status, page: $page, pageSize: $pageSize) {
      items {
        id
        title
        slug
        excerpt
        coverImageUrl
        publishedAt
        status
        blogCategory {
          name
        }
        tags {
          tag {
            name
          }
        }
      }
      total
      page
      totalPages
      hasNextPage
    }
  }
`;

const LIST_POSTS_BY_RESTAURANT = gql`
  query ListPostsByRestaurant($restaurantId: ID!, $status: PostStatus, $page: Int, $pageSize: Int) {
    listPostsByRestaurant(
      restaurantId: $restaurantId
      status: $status
      page: $page
      pageSize: $pageSize
    ) {
      items {
        id
        title
        slug
        excerpt
        coverImageUrl
        publishedAt
        status
        blogCategory {
          name
        }
        tags {
          tag {
            name
          }
        }
      }
      total
      page
      totalPages
      hasNextPage
    }
  }
`;

const LIST_POSTS_PAGINATED = gql`
  query ListPostsPaginated($categoryId: String, $page: Int, $pageSize: Int) {
    listPostsPaginated(categoryId: $categoryId, page: $page, pageSize: $pageSize) {
      items {
        id
        title
        slug
        excerpt
        coverImageUrl
        publishedAt
        status
        creator {
          id
          name
        }
        blogCategory {
          id
          name
          slug
        }
        tags {
          tag {
            id
            name
            slug
          }
        }
      }
      total
      page
      pageSize
      totalPages
      hasNextPage
      hasPrevPage
    }
  }
`;

const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      id
      title
      slug
    }
  }
`;

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const S3_BASE = 'https://emprendyup-images.s3.us-east-1.amazonaws.com/';

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'Todos', value: undefined },
  { label: 'Publicados', value: 'PUBLISHED' },
  { label: 'Borradores', value: 'DRAFT' },
];

// ─── Pure Helpers ─────────────────────────────────────────────────────────────

function getCoverImageSrc(url?: string): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${S3_BASE}${url}`;
}

function formatDate(date?: string): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getStatusLabel(status?: string): string {
  if (!status) return '';
  const normalised = status.toUpperCase();
  if (normalised === 'PUBLISHED') return 'Publicado';
  if (normalised === 'DRAFT') return 'Borrador';
  if (normalised === 'ARCHIVED') return 'Archivado';
  return status;
}

function getStatusBadgeClass(status?: string): string {
  const s = status?.toUpperCase();
  if (s === 'PUBLISHED')
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  if (s === 'DRAFT')
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700/60 dark:text-gray-300';
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function BlogListSkeleton() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <div className="h-8 w-56 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      {/* Tabs */}
      <div className="flex gap-3 mb-6 border-b border-gray-200 dark:border-gray-700 pb-0">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-t-lg" />
        ))}
      </div>
      {/* Cards */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
          >
            <div className="flex gap-5">
              <div className="w-36 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BlogListPage() {
  const router = useRouter();

  // ── Session / User ──
  const { user: storeUser } = useSessionStore();
  const user = storeUser ?? (getUserFromLocalStorage() as UserProfile | null);

  // ── Local State ──
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Tracks ids removed optimistically while mutation is in-flight
  const [optimisticRemovedIds, setOptimisticRemovedIds] = useState<Set<string>>(new Set());

  // ── Tenant Detection ──
  const tenantType: TenantType = useMemo(() => {
    if (user?.storeId) return 'store';
    if (user?.restaurantId) return 'restaurant';
    return 'admin';
  }, [user?.storeId, user?.restaurantId]);

  const isStore = tenantType === 'store';
  const isRestaurant = tenantType === 'restaurant';
  const isAdmin = tenantType === 'admin';

  // ── Queries (all three called unconditionally; skip governs execution) ──

  const {
    data: storeData,
    loading: storeLoading,
    error: storeError,
    refetch: refetchStore,
  } = useQuery<{ listPostsByStore: PaginatedPosts }>(LIST_POSTS_BY_STORE, {
    skip: !isStore,
    variables: {
      storeId: user?.storeId ?? '',
      status: statusFilter,
      page: currentPage,
      pageSize: PAGE_SIZE,
    },
    fetchPolicy: 'network-only',
  });

  const {
    data: restaurantData,
    loading: restaurantLoading,
    error: restaurantError,
    refetch: refetchRestaurant,
  } = useQuery<{ listPostsByRestaurant: PaginatedPosts }>(LIST_POSTS_BY_RESTAURANT, {
    skip: !isRestaurant,
    variables: {
      restaurantId: user?.restaurantId ?? '',
      status: statusFilter,
      page: currentPage,
      pageSize: PAGE_SIZE,
    },
    fetchPolicy: 'network-only',
  });

  const {
    data: adminData,
    loading: adminLoading,
    error: adminError,
    refetch: refetchAdmin,
  } = useQuery<{ listPostsPaginated: PaginatedPosts }>(LIST_POSTS_PAGINATED, {
    skip: !isAdmin,
    variables: {
      categoryId: null,
      page: currentPage,
      pageSize: PAGE_SIZE,
    },
    fetchPolicy: 'network-only',
  });

  // ── Delete Mutation ──
  const [deletePostMutation] = useMutation(DELETE_POST);

  // ── Derived Data ──
  const isLoading = storeLoading || restaurantLoading || adminLoading;
  const queryError = storeError ?? restaurantError ?? adminError;

  const paginatedResult: PaginatedPosts | undefined = isStore
    ? storeData?.listPostsByStore
    : isRestaurant
      ? restaurantData?.listPostsByRestaurant
      : adminData?.listPostsPaginated;

  const allItems: PostItem[] = paginatedResult?.items ?? [];
  const visibleItems = allItems.filter((p) => !optimisticRemovedIds.has(p.id));
  const total = paginatedResult?.total ?? 0;
  const totalPages = paginatedResult?.totalPages ?? 1;
  const hasNextPage = paginatedResult?.hasNextPage ?? false;
  const hasPrevPage = currentPage > 1;

  // ── Event Handlers ──

  const handleStatusChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (hasPrevPage) setCurrentPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (hasNextPage) setCurrentPage((p) => p + 1);
  };

  const handleDelete = async (post: PostItem) => {
    const confirmed = window.confirm(
      `¿Seguro que quieres borrar "${post.title}"? Esta acción es irreversible.`
    );
    if (!confirmed) return;

    // Optimistic removal
    setOptimisticRemovedIds((prev) => new Set(prev).add(post.id));
    setDeletingId(post.id);

    try {
      const result = await deletePostMutation({ variables: { id: post.id } });
      if (result.errors?.length) {
        throw new Error(result.errors.map((e) => e.message).join(', '));
      }
      // After confirmed server deletion, refetch the active tenant query
      if (isStore) void refetchStore();
      else if (isRestaurant) void refetchRestaurant();
      else void refetchAdmin();
    } catch (err: unknown) {
      // Rollback optimistic removal on error
      setOptimisticRemovedIds((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Error borrando el artículo: ${msg}`);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render: Loading ──
  if (isLoading && visibleItems.length === 0) {
    return <BlogListSkeleton />;
  }

  // ── Render: Full Page ──
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Artículos del blog</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {paginatedResult ? `${total} artículo${total !== 1 ? 's' : ''} en total` : 'Cargando…'}
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/blog/new')}
          className="inline-flex items-center gap-2 bg-fourth-base hover:bg-fourth-500 text-white font-medium px-4 py-2.5 rounded-lg transition-colors duration-200 shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Crear artículo
        </button>
      </div>

      {/* ── Status Filter Tabs ── */}
      <div
        className="flex items-center gap-1 mb-6 border-b border-gray-200 dark:border-gray-700"
        role="tablist"
        aria-label="Filtrar por estado"
      >
        <Filter
          className="w-4 h-4 text-gray-400 dark:text-gray-500 mb-2 mr-1 flex-shrink-0"
          aria-hidden="true"
        />
        {STATUS_TABS.map((tab) => {
          const isActive = tab.value === statusFilter;
          return (
            <button
              key={tab.label}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleStatusChange(tab.value)}
              className={[
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fourth-base focus-visible:ring-offset-2',
                isActive
                  ? 'border-fourth-base text-fourth-base'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600',
              ].join(' ')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Error Banner ── */}
      {queryError && (
        <div
          role="alert"
          className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400"
        >
          <span className="font-medium">Error al cargar artículos:</span> {queryError.message}
        </div>
      )}

      {/* ── Post List ── */}
      {visibleItems.length > 0 ? (
        <>
          <div className="grid gap-4" role="list" aria-label="Lista de artículos">
            {visibleItems.map((post) => {
              const coverSrc = getCoverImageSrc(post.coverImageUrl);
              return (
                <article
                  key={post.id}
                  role="listitem"
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-fourth-300 dark:hover:border-fourth-500 hover:shadow-md transition-all duration-200"
                >
                  <div className="p-5">
                    <div className="flex flex-col lg:flex-row gap-5">
                      {/* Cover Image */}
                      <div className="flex-shrink-0">
                        <div className="relative w-full lg:w-36 h-28 lg:h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                          {coverSrc ? (
                            <Image
                              src={coverSrc}
                              alt={post.title}
                              fill
                              sizes="(max-width: 1024px) 100vw, 144px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText
                                className="w-8 h-8 text-gray-300 dark:text-gray-600"
                                aria-hidden="true"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          {/* Text Content */}
                          <div className="flex-1 min-w-0">
                            {/* Title + Status badge */}
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug">
                                {post.title}
                              </h3>
                              {post.status && (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeClass(post.status)}`}
                                >
                                  {getStatusLabel(post.status)}
                                </span>
                              )}
                            </div>

                            {/* Excerpt */}
                            {post.excerpt && (
                              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2.5 line-clamp-2 leading-relaxed">
                                {post.excerpt}
                              </p>
                            )}

                            {/* Meta row */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
                              <time dateTime={post.publishedAt}>
                                {formatDate(post.publishedAt)}
                              </time>
                              {post.creator && (
                                <span className="hidden sm:inline">
                                  Por{' '}
                                  <span className="text-gray-600 dark:text-gray-300">
                                    {post.creator.name}
                                  </span>
                                </span>
                              )}
                              {post.blogCategory && (
                                <span className="text-fourth-base font-medium">
                                  {post.blogCategory.name}
                                </span>
                              )}
                            </div>

                            {/* Tags */}
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2.5" aria-label="Etiquetas">
                                {post.tags.slice(0, 4).map((tagItem, idx) => (
                                  <span
                                    key={tagItem.tag.id ?? `${post.id}-tag-${idx}`}
                                    className="px-2 py-0.5 text-xs bg-fourth-base/10 text-fourth-500 dark:text-fourth-300 rounded-md"
                                  >
                                    {tagItem.tag.name}
                                  </span>
                                ))}
                                {post.tags.length > 4 && (
                                  <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md">
                                    +{post.tags.length - 4} más
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center sm:flex-col sm:items-end gap-1 sm:gap-2 flex-shrink-0">
                            <button
                              onClick={() => router.push(`/dashboard/blog/edit/${post.slug}`)}
                              className="inline-flex items-center gap-1.5 text-fourth-base hover:text-fourth-500 font-medium text-sm transition-colors duration-150 px-2 py-1 rounded-md hover:bg-fourth-base/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fourth-base"
                              aria-label={`Editar "${post.title}"`}
                            >
                              <Edit className="w-4 h-4" aria-hidden="true" />
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                            <button
                              onClick={() => handleDelete(post)}
                              disabled={deletingId === post.id}
                              className="inline-flex items-center gap-1.5 text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium text-sm transition-colors duration-150 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                              aria-label={`Borrar "${post.title}"`}
                              aria-busy={deletingId === post.id}
                            >
                              {deletingId === post.id ? (
                                <span
                                  className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              )}
                              <span className="hidden sm:inline">Borrar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <nav
              className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-700"
              aria-label="Paginación"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Página{' '}
                <span className="font-medium text-gray-700 dark:text-gray-200">{currentPage}</span>{' '}
                de{' '}
                <span className="font-medium text-gray-700 dark:text-gray-200">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={!hasPrevPage || isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fourth-base"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  Anterior
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={!hasNextPage || isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fourth-base"
                  aria-label="Página siguiente"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </nav>
          )}
        </>
      ) : !isLoading ? (
        /* ── Empty State ── */
        <div className="text-center py-20 px-4">
          <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-5 ring-1 ring-gray-200 dark:ring-gray-700">
            <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {statusFilter === 'PUBLISHED'
              ? 'No hay artículos publicados'
              : statusFilter === 'DRAFT'
                ? 'No hay borradores'
                : 'No hay artículos aún'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto text-sm">
            {statusFilter
              ? 'Prueba cambiando el filtro de estado.'
              : 'Comienza creando tu primer artículo de blog.'}
          </p>
          {!statusFilter && (
            <button
              onClick={() => router.push('/dashboard/blog/new')}
              className="inline-flex items-center gap-2 bg-fourth-base hover:bg-fourth-500 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 shadow-sm"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              Crear primer artículo
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
