'use client';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, AlertCircle, X } from 'lucide-react';
import { useSessionStore } from '@/lib/store/dashboard';
import Image from 'next/image';

// GraphQL Queries and Mutations
const GET_SERVICE_PROVIDER = gql`
  query GetServiceProvider($id: String!) {
    serviceProvider(id: $id) {
      id
      businessName
      images {
        id
        url
        key
      }
    }
  }
`;

// Deletion is executed via REST DELETE to `/store-images/:id`

const DELETE_SERVICE_PROVIDER_IMAGE = gql`
  mutation DeleteServiceProviderImage($id: String!) {
    deleteServiceProviderImage(id: $id)
  }
`;

const UPLOAD_SERVICE_PROVIDER_IMAGE = gql`
  mutation UploadServiceProviderImage($serviceProviderId: String!, $slug: String!, $file: Upload!) {
    uploadServiceProviderImage(serviceProviderId: $serviceProviderId, slug: $slug, file: $file) {
      id
      url
      key
    }
  }
`;

interface ServiceProviderImage {
  id: string;
  url: string;
  key: string;
}

export default function ServiceProviderImages() {
  const { user } = useSessionStore();
  const serviceProviderId = user?.serviceProviderId;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [localImages, setLocalImages] = useState<ServiceProviderImage[]>([]);

  // Query for service provider with images
  const { data, loading, error, refetch } = useQuery(GET_SERVICE_PROVIDER, {
    variables: { id: serviceProviderId },
    skip: !serviceProviderId,
  });

  // Sync local images with query result
  useEffect(() => {
    setLocalImages(data?.serviceProvider?.images || []);
  }, [data]);

  const [deleting, setDeleting] = useState(false);
  // GraphQL delete mutation (preferred)
  const [deleteServiceImageGQL] = useMutation(DELETE_SERVICE_PROVIDER_IMAGE, {
    onCompleted: () => refetch(),
  });

  const [uploading, setUploading] = useState(false);

  const handleCreateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile && !imageUrl) return;

    try {
      setUploading(true);

      const businessName =
        data?.serviceProvider?.businessName?.toLowerCase().replace(/\s+/g, '_') || 'business';
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      // REST endpoint: POST /service-provider-images/:serviceProviderId/gallery/upload
      const uploadUrl = `${apiBase}/service-provider-images/${serviceProviderId}/gallery/upload`;

      const formData = new FormData();
      if (imageFile) {
        formData.append('file', imageFile);
      } else if (imageUrl) {
        throw new Error('Por favor selecciona un archivo de imagen');
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al subir la imagen');
      }

      // Try to read returned image data and update localImages for immediate visibility
      const uploaded = await response.json().catch(() => null);
      if (uploaded && (uploaded.id || uploaded.url || uploaded.key)) {
        const newImg: ServiceProviderImage = {
          id: uploaded.id || uploaded.image?.id || Date.now().toString(),
          key: uploaded.key || uploaded.image?.key || uploaded.key || '',
          url:
            // prefer explicit url if it's a direct S3 URL
            uploaded.url && !uploaded.url.includes('cloudfront')
              ? uploaded.url
              : uploaded.key || uploaded.image?.key
                ? `https://emprendyup-images.s3.us-east-1.amazonaws.com/${uploaded.key || uploaded.image?.key}`
                : uploaded.url || '',
        };
        setLocalImages((prev) => [newImg, ...prev]);
      } else {
        // fallback: refresh from server
        refetch();
      }

      setShowCreateModal(false);
      setImageUrl('');
      setImageFile(null);
    } catch (err) {
      console.error('Error creating service image:', err);
      alert(
        err instanceof Error ? err.message : 'Error al subir la imagen. Por favor intenta de nuevo.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta imagen?')) return;

    try {
      setDeleting(true);

      // Try GraphQL deletion first
      try {
        await deleteServiceImageGQL({ variables: { id: imageId } });
        return;
      } catch (gqlErr: any) {
        // If GraphQL field not found or other error, fall back to REST candidates
        console.debug(
          'GraphQL delete failed, falling back to REST delete. Error:',
          gqlErr?.message || gqlErr
        );
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

      const build = (path: string) => (apiBase ? `${apiBase}${path}` : path);

      const candidates = [
        `/service-provider-images/${serviceProviderId}/gallery/${imageId}`,
        `/service-provider-images/gallery/${imageId}`,
        `/service-provider-images/${imageId}`,
        `/store-images/${imageId}`,
        `/service-provider-images/${serviceProviderId}/${imageId}`,
      ].map((p) => build(p));

      console.debug('Attempting DELETE on candidate URLs:', candidates);

      let lastError: any = null;
      let deleted = false;

      for (const url of candidates) {
        try {
          const res = await fetch(url, {
            method: 'DELETE',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });

          const body = await res.json().catch(() => ({}));

          if (res.ok) {
            deleted = true;
            break;
          }

          if (res.status === 404) {
            lastError = { status: res.status, body };
            continue;
          } else {
            throw new Error(body.message || `Error deleting image (status ${res.status})`);
          }
        } catch (err) {
          lastError = err;
          continue;
        }
      }

      if (!deleted) {
        const msg = lastError?.body?.message || lastError?.message || 'Image not found';
        throw new Error(msg);
      }

      refetch();
    } catch (err) {
      console.error('Error deleting service image:', err);
      alert(
        err instanceof Error
          ? `Error al eliminar la imagen: ${err.message}`
          : 'Error al eliminar la imagen.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const resolveImageUrl = (url: string, key?: string) => {
    // If we have an explicit key (S3 path), prefer constructing S3 URL.
    if (key) {
      return `https://emprendyup-images.s3.us-east-1.amazonaws.com/${key}`;
    }

    if (!url) return '';

    // If backend returns a CloudFront URL but we have no key, try to fall back to url.
    if (
      url.startsWith('http') ||
      url.startsWith('https') ||
      url.startsWith('blob:') ||
      url.startsWith('data:')
    ) {
      // Prefer S3 domain when CloudFront is present and we can extract a key-like path
      try {
        const parsed = new URL(url);
        if (parsed.hostname.includes('cloudfront') && parsed.pathname) {
          const possibleKey = parsed.pathname.replace(/^\//, '');
          return `https://emprendyup-images.s3.us-east-1.amazonaws.com/${possibleKey}`;
        }
      } catch (e) {
        // ignore
      }
      return url;
    }

    // Otherwise assume url is a key/path
    return `https://emprendyup-images.s3.us-east-1.amazonaws.com/${url}`;
  };

  if (!serviceProviderId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No se encontró el ID del proveedor de servicios
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fourth-base"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  const images = data?.serviceProvider?.images || [];
  const displayedImages = localImages.length ? localImages : images;
  const needsMoreImages = displayedImages.length < 3;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Imágenes de Servicios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona las imágenes de {data?.serviceProvider?.businessName}
          </p>
          {needsMoreImages && (
            <p className="text-orange-600 dark:text-orange-400 mt-2 font-medium">
              ⚠️ Se requieren al menos 3 imágenes de tus servicios
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-fourth-base text-white rounded-lg hover:opacity-90 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Imagen
        </button>
      </div>

      {/* Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <ImageIcon className="h-8 w-8 text-fourth-base" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total de Imágenes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {displayedImages.length}
              {needsMoreImages && <span className="text-orange-500"> / 3 mínimo</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      {displayedImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedImages.map((image: ServiceProviderImage) => (
            <div
              key={image.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-700">
                <Image
                  src={resolveImageUrl(image.url)}
                  alt="Service image"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="p-4">
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  disabled={deleting}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12">
          <div className="text-center">
            <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay imágenes de servicios
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Agrega al menos 3 imágenes para mostrar tus servicios
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Las imágenes ayudan a tus clientes a conocer mejor lo que ofreces
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-fourth-base text-white rounded-lg hover:opacity-90 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primera Imagen
            </button>
          </div>
        </div>
      )}

      {/* Create Image Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Agregar Imagen de Servicio
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setImageUrl('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateImage} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagen *
                </label>
                {imageUrl || imageFile ? (
                  <div className="relative">
                    <Image
                      src={imageFile ? URL.createObjectURL(imageFile) : resolveImageUrl(imageUrl)}
                      alt="Preview"
                      width={400}
                      height={200}
                      className="w-full h-48 object-cover rounded-lg"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setImageFile(null);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageFile(file);
                        }
                      }}
                      className="block w-full text-sm text-gray-500 dark:text-gray-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-fourth-base file:text-white
                        hover:file:opacity-90
                        file:cursor-pointer cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-gray-800 pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setImageUrl('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading || (!imageUrl && !imageFile)}
                  className="flex-1 px-4 py-2 bg-fourth-base text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Agregando...' : 'Agregar Imagen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
