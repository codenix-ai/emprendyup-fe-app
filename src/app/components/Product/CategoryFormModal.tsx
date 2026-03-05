'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import toast from 'react-hot-toast';
import { X, Tag, Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  parent?: {
    id: string;
    name: string;
  };
}

interface Store {
  id: string;
  storeId: string;
  name: string;
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  onSuccess: (newCategory: Category) => void;
  availableCategories?: Category[];
  preselectedParent?: Category | null;
}

const GET_ALL_STORES = gql`
  query GetAllStoresForAdmin {
    getAllStoresForAdmin {
      id
      storeId
      name
    }
  }
`;

const CREATE_STORE_CATEGORY = gql`
  mutation CreateStoreCategory($storeId: String!, $input: CreateStoreCategoryInput!) {
    createStoreCategory(storeId: $storeId, input: $input) {
      id
      name
      slug
      description
      parentId
      storeId
      isActive
      order
      createdAt
      updatedAt
      store {
        id
        name
      }
      parent {
        id
        name
        slug
      }
    }
  }
`;

const CREATE_SUBCATEGORY = gql`
  mutation CreateSubcategory($storeId: String!, $input: CreateStoreCategoryInput!) {
    createStoreCategory(storeId: $storeId, input: $input) {
      id
      name
      slug
      description
      parentId
      storeId
      isActive
      order
      createdAt
      store {
        id
        name
      }
      parent {
        id
        name
        slug
      }
    }
  }
`;

export function CategoryFormModal({
  isOpen,
  onClose,
  storeId,
  onSuccess,
  availableCategories = [],
  preselectedParent = null,
}: CategoryFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    parentId: preselectedParent?.id || '',
  });
  const [selectedStoreId, setSelectedStoreId] = useState<string>(storeId);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Get user data
  const userData = JSON.parse(
    typeof window !== 'undefined' ? localStorage.getItem('user') || '{}' : '{}'
  );

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('CategoryFormModal opened:', {
        storeId,
        selectedStoreId,
        userData,
        isAdmin: userData?.role === 'ADMIN' || userData?.isAdmin,
        userHasNoStore: !storeId || storeId.trim() === '',
      });
    }
  }, [isOpen, storeId]);

  const isAdmin = userData?.role === 'ADMIN' || userData?.isAdmin;
  const userHasNoStore = !storeId || storeId.trim() === '';
  const shouldShowStoreSelector = isAdmin && userHasNoStore;

  // Query para obtener todas las tiendas si es admin sin storeId
  const { data: storesData, loading: storesLoading } = useQuery(GET_ALL_STORES, {
    skip: !shouldShowStoreSelector || !isOpen,
  });

  const availableStores = storesData?.getAllStoresForAdmin || [];

  // Log when stores data updates
  useEffect(() => {
    if (availableStores && availableStores.length > 0) {
      console.log('Available stores updated:', availableStores);
    }
  }, [availableStores]);

  // Function to generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const [createCategory] = useMutation(CREATE_STORE_CATEGORY);
  const [createSubcategory] = useMutation(CREATE_SUBCATEGORY);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        slug: '',
        parentId: preselectedParent?.id || '',
      });
      setSelectedStoreId(storeId);
      setErrors({});
      setIsLoading(false);
    }
  }, [isOpen, preselectedParent, storeId]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.name.length > 80) {
      newErrors.name = 'El nombre no puede exceder 80 caracteres';
    }

    // Validar que seleccionó una tienda si es admin
    if (shouldShowStoreSelector && !selectedStoreId) {
      newErrors.store = 'Debes seleccionar una tienda';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Usar selectedStoreId si es admin, sino usar el storeId prop
    const finalStoreId = shouldShowStoreSelector ? selectedStoreId : storeId;

    // Logging detallado para debug
    console.log('=== CATEGORY FORM SUBMIT DEBUG ===', {
      shouldShowStoreSelector,
      selectedStoreId,
      storeId,
      finalStoreId,
      isAdmin,
      userHasNoStore,
    });

    // Validar que storeId existe
    if (!finalStoreId || finalStoreId.trim() === '') {
      console.error('Invalid storeId:', {
        shouldShowStoreSelector,
        selectedStoreId,
        storeId,
        isAdmin,
        userHasNoStore,
      });

      if (shouldShowStoreSelector) {
        toast.error('Por favor selecciona una tienda antes de crear la categoría.');
      } else {
        toast.error(
          'No se pudo identificar tu tienda. Por favor recarga la página y asegúrate de estar conectado.'
        );
      }
      return;
    }

    setIsLoading(true);
    try {
      const inputPayload: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        slug: formData.slug.trim(),
      };

      if (formData.parentId && formData.parentId.trim()) {
        inputPayload.parentId = formData.parentId;
      }

      const mutation = formData.parentId ? createSubcategory : createCategory;

      console.log('=== SENDING MUTATION ===', {
        storeId: finalStoreId,
        input: inputPayload,
        timestamp: new Date().toISOString(),
      });

      const result = await mutation({
        variables: {
          storeId: finalStoreId,
          input: inputPayload,
        },
      });

      const newCategory = result.data?.createStoreCategory || result.data?.createSubcategory;

      console.log('Category created successfully:', newCategory);

      toast.success(
        formData.parentId ? 'Subcategoría creada exitosamente' : 'Categoría creada exitosamente'
      );

      // Reset form
      setFormData({
        name: '',
        description: '',
        slug: '',
        parentId: preselectedParent?.id || '',
      });
      setSelectedStoreId(storeId);

      onSuccess(newCategory);
      onClose();
    } catch (error: any) {
      console.error('Error creating category:', error);
      const errorMessage =
        error?.graphQLErrors?.[0]?.message || error?.message || 'Error al guardar la categoría';

      console.log('Full error details:', {
        code: error?.code,
        message: errorMessage,
        graphQLErrors: error?.graphQLErrors,
        networkError: error?.networkError,
        status: error?.networkError?.statusCode,
      });

      if (
        errorMessage.toLowerCase().includes('duplicate') ||
        errorMessage.toLowerCase().includes('unique') ||
        errorMessage.toLowerCase().includes('already exists')
      ) {
        toast.error(
          `Ya existe una categoría con el nombre "${formData.name}". Por favor usa un nombre diferente.`
        );
      } else if (errorMessage.toLowerCase().includes('slug')) {
        toast.error('El slug de la categoría ya está en uso. Por favor usa uno diferente.');
      } else if (
        errorMessage.toLowerCase().includes('foreign key') ||
        errorMessage.toLowerCase().includes('store')
      ) {
        toast.error('No se encontró la tienda. Por favor recarga la página e intenta de nuevo.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />

        <div className="relative bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-800">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-fourth-base" />
              <h3 className="text-lg font-semibold text-white">
                {preselectedParent
                  ? `Nueva Subcategoría de "${preselectedParent.name}"`
                  : 'Nueva Categoría'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Store Selector para Admin sin storeId */}
            {shouldShowStoreSelector && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Selecciona una Tienda *
                </label>
                {storesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-fourth-base mr-2" />
                    <span className="text-sm text-gray-400">Cargando tiendas...</span>
                  </div>
                ) : availableStores.length > 0 ? (
                  <select
                    value={selectedStoreId}
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log('Store selected:', {
                        selectedValue: value,
                        selectedStore: availableStores.find((s: Store) => s.id === value),
                        allStores: availableStores,
                      });
                      setSelectedStoreId(value);
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fourth-base bg-gray-800 text-white ${
                      errors.store ? 'border-red-500' : 'border-gray-600'
                    }`}
                    disabled={isLoading}
                  >
                    <option value="">Selecciona una tienda</option>
                    {availableStores.map((store: Store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                    <p className="text-sm text-red-400">
                      No hay tiendas disponibles. Contacta al administrador.
                    </p>
                  </div>
                )}
                {errors.store && <p className="text-red-400 text-sm mt-1">{errors.store}</p>}
              </div>
            )}

            {/* Información de la tienda seleccionada */}
            {!shouldShowStoreSelector && storeId && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Creando categoría para tu tienda
                </p>
              </div>
            )}

            {preselectedParent && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Creando subcategoría
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Esta será una subcategoría de &quot;{preselectedParent.name}&quot;
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setFormData({
                    ...formData,
                    name: newName,
                    slug: generateSlug(newName),
                  });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fourth-base bg-gray-800 text-white placeholder-gray-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Nombre de la categoría"
                disabled={isLoading}
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            {formData.slug && !errors.name && (
              <div className="text-sm">
                <label className="block text-gray-400 mb-1">Slug</label>
                <div className="px-3 py-2 bg-gray-800 rounded-lg text-gray-400 border border-gray-700">
                  /{formData.slug}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Este slug se genera automáticamente desde el nombre
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-fourth-base bg-gray-800 text-white placeholder-gray-500"
                placeholder="Descripción opcional"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-fourth-base text-white rounded-lg hover:bg-fourth-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || (shouldShowStoreSelector && storesLoading)}
              >
                {isLoading ? 'Guardando...' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
