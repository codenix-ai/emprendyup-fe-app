'use client';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, AlertCircle, X } from 'lucide-react';
import { useSessionStore } from '@/lib/store/dashboard';
import Image from 'next/image';
import FileUpload from '@/app/components/FileUpload';

// GraphQL Queries and Mutations
const GET_RESTAURANT = gql`
  query GetRestaurant($id: ID!) {
    restaurant(id: $id) {
      id
      name
      menuImages {
        id
        imageUrl
        title
        description
      }
    }
  }
`;

const CREATE_MENU_IMAGE = gql`
  mutation CreateMenuImage($restaurantId: ID!, $input: CreateMenuImageInput!) {
    createMenuImage(restaurantId: $restaurantId, input: $input) {
      id
      imageUrl
      title
      description
    }
  }
`;

const DELETE_MENU_IMAGE = gql`
  mutation DeleteMenuImage($id: ID!) {
    deleteMenuImage(id: $id) {
      id
    }
  }
`;

interface MenuImage {
  id: string;
  imageUrl: string;
  title?: string;
  description?: string;
}

export default function MenuImages() {
  const { user } = useSessionStore();
  const restaurantId = user?.restaurantId;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    imageUrl: '',
    title: '',
    description: '',
  });

  // Query for restaurant with menu images
  const { data, loading, error, refetch } = useQuery(GET_RESTAURANT, {
    variables: { id: restaurantId },
    skip: !restaurantId,
  });

  // Mutations
  const [createMenuImage, { loading: creating }] = useMutation(CREATE_MENU_IMAGE, {
    onCompleted: () => {
      setShowCreateModal(false);
      resetForm();
      refetch();
    },
  });

  const [deleteMenuImage, { loading: deleting }] = useMutation(DELETE_MENU_IMAGE, {
    onCompleted: () => {
      refetch();
    },
  });

  const resetForm = () => {
    setFormData({
      imageUrl: '',
      title: '',
      description: '',
    });
  };

  const handleCreateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMenuImage({
        variables: {
          restaurantId,
          input: {
            imageUrl: formData.imageUrl,
            title: formData.title || undefined,
            description: formData.description || undefined,
          },
        },
      });
    } catch (err) {
      console.error('Error creating menu image:', err);
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta imagen del menú?')) {
      return;
    }
    try {
      await deleteMenuImage({
        variables: { id },
      });
    } catch (err) {
      console.error('Error deleting menu image:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resolveImageUrl = (url: string) => {
    if (!url) return '';
    if (
      url.startsWith('http') ||
      url.startsWith('https') ||
      url.startsWith('blob:') ||
      url.startsWith('data:')
    ) {
      return url;
    }
    return `https://emprendyup-images.s3.us-east-1.amazonaws.com/${url}`;
  };

  if (!restaurantId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No se encontró el ID del restaurante</p>
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

  const menuImages = data?.restaurant?.menuImages || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Imágenes del Menú</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona las imágenes del menú de {data?.restaurant?.name}
          </p>
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
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{menuImages.length}</p>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      {menuImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuImages.map((image: MenuImage) => (
            <div
              key={image.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-700">
                <Image
                  src={resolveImageUrl(image.imageUrl)}
                  alt={image.title || 'Menu image'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="p-4">
                {image.title && (
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {image.title}
                  </h3>
                )}
                {image.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {image.description}
                  </p>
                )}
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
              No hay imágenes del menú
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Comienza agregando las primeras imágenes de tu menú
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
                Agregar Imagen del Menú
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
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
                {formData.imageUrl ? (
                  <div className="relative">
                    <Image
                      src={resolveImageUrl(formData.imageUrl)}
                      alt="Preview"
                      width={400}
                      height={200}
                      className="w-full h-48 object-cover rounded-lg"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <FileUpload
                    onFile={(url: string) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
                    accept="image/*"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título (Opcional)
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                  placeholder="Menu Principal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                  placeholder="Nuestros platos principales"
                />
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-gray-800 pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !formData.imageUrl}
                  className="flex-1 px-4 py-2 bg-fourth-base text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Agregando...' : 'Agregar Imagen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
