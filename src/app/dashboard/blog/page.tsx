'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getUserFromLocalStorage } from '@/lib/utils/localAuth';
import { gql, useMutation } from '@apollo/client';
const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      id
      title
      slug
    }
  }
`;
export default function BlogListPage() {
  const [posts, setPosts] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [deletePostMutation] = useMutation(DELETE_POST);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const user = getUserFromLocalStorage();
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const query = `query ListPostsPaginated($categoryId: String, $page: Int, $pageSize: Int) { 
          listPostsPaginated(categoryId: $categoryId, page: $page, pageSize: $pageSize) { 
            items { 
              id title slug excerpt content status createdAt updatedAt publishedAt 
              creator { id name email } 
              blogCategory { id name slug } 
              tags { tag { id name slug } } 
              relatedPosts { id title slug } 
              coverImageUrl 
            } 
            total page pageSize totalPages hasNextPage hasPrevPage 
          } 
        }`;
        const endpoint =
          process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            variables: { categoryId: null, page: 1, pageSize: 10 },
          }),
        });
        const json = await resp.json();
        const data = json?.data?.listPostsPaginated;
        const items = data?.items || [];
        if (mounted) setPosts(items);
      } catch (e) {
        if (mounted) setPosts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  const userId = user.id;

  const handleDelete = async (id: string) => {
    const ok = window.confirm(
      '¿Seguro que quieres borrar este artículo? Esta acción es irreversible.'
    );
    if (!ok) return;

    const prev = posts;
    // optimistic remove
    setPosts((curr) => (curr ? curr.filter((p) => p.id !== id) : curr));
    setDeletingId(id);

    try {
      const result = await deletePostMutation({ variables: { id, userId } });
      if (result?.errors && result.errors.length) {
        throw new Error(result.errors.map((e: any) => e.message).join(', '));
      }
      setDeletingId(null);
    } catch (err: any) {
      setPosts(prev);
      setDeletingId(null);
      alert('Error borrando el artículo: ' + (err?.message || err));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-16 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Artículos del blog</h1>
          <p className="text-gray-600 mt-1">
            {posts ? `${posts.length} artículo${posts.length !== 1 ? 's' : ''}` : 'Cargando...'}
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/blog/new')}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors duration-200 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Crear nuevo artículo
        </button>
      </div>

      {posts && posts.length > 0 ? (
        <div className="grid gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <div className="relative w-full lg:w-32 h-32 lg:h-24 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={
                          post.coverImageUrl?.startsWith('http')
                            ? post.coverImageUrl
                            : `https://emprendyup-images.s3.us-east-1.amazonaws.com/${post.coverImageUrl}`
                        }
                        alt={post.title || ''}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-200 line-clamp-2">
                            {post.title}
                          </h3>
                          {post.status && (
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(post.status)}`}
                            >
                              {post.status === 'published'
                                ? 'Publicado'
                                : post.status === 'draft'
                                  ? 'Borrador'
                                  : post.status === 'archived'
                                    ? 'Archivado'
                                    : post.status}
                            </span>
                          )}
                        </div>

                        {post.excerpt && (
                          <p className="text-gray-200 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            {post.creator?.name || 'Autor desconocido'}
                          </div>

                          <div className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            {formatDate(post.publishedAt || post.createdAt)}
                          </div>

                          {post.blogCategory && (
                            <div className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                />
                              </svg>
                              {post.blogCategory.name}
                            </div>
                          )}
                        </div>

                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {post.tags.slice(0, 3).map((tagItem: any) => (
                              <span
                                key={tagItem.tag.id}
                                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md"
                              >
                                {tagItem.tag.name}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded-md">
                                +{post.tags.length - 3} más
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/blog/edit/${post.slug}`)}
                          className="inline-flex items-center gap-2 text-fourth-base hover:text-blue-800 font-medium text-sm transition-colors duration-200"
                          aria-label={`Editar ${post.title}`}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={deletingId === post.id}
                          className="inline-flex items-center gap-2 text-red-500 hover:text-red-700 font-medium text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={`Borrar ${post.title}`}
                        >
                          {deletingId === post.id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
                              />
                            </svg>
                          )}
                          Borrar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay artículos aún</h3>
          <p className="text-gray-600 mb-6">Comienza creando tu primer artículo de blog</p>
          <button
            onClick={() => router.push('/dashboard/blog/new')}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Crear primer artículo
          </button>
        </div>
      )}
    </div>
  );
}
