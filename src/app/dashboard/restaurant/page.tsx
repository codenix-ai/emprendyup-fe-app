'use client';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Save,
  CheckCircle,
  AlertCircle,
  Info,
  MapPin,
  ImageIcon,
  Building,
  Globe,
} from 'lucide-react';
import AdressAutocomplete from '@/app/components/AdressAutocomplete';
import { useSessionStore } from '@/lib/store/dashboard';
import Image from 'next/image';
import FileUpload from '@/app/components/FileUpload';

const GET_RESTAURANT = gql`
  query GetRestaurant($id: ID!) {
    restaurant(id: $id) {
      id
      name
      description
      cuisineType
      city
      address
      phone
      coverImage
      customDomain
      googleLocation
      lat
      lng
      address
      menu {
        id
        name
      }
      brandingId
      businessConfigId
      createdAt
      updatedAt
      menuImages {
        id
        imageUrl
        title
        description
      }
    }
  }
`;

const GET_MENU_ITEMS = gql`
  query GetMenuItems($restaurantId: ID, $category: String, $isAvailable: Boolean) {
    menuItems(restaurantId: $restaurantId, category: $category, isAvailable: $isAvailable) {
      id
      name
      description
      category
      price
      currency
      imageUrl
      isAvailable
      order
      menuId
      createdAt
      updatedAt
    }
  }
`;

const GET_MENU = gql`
  query GetMenu($restaurantId: ID!) {
    menu(restaurantId: $restaurantId) {
      id
      name
      items {
        id
        name
        price
      }
    }
  }
`;

const UPDATE_RESTAURANT = gql`
  mutation UpdateRestaurant($id: ID!, $input: UpdateRestaurantInput!) {
    updateRestaurant(id: $id, input: $input) {
      id
      name
      description
      cuisineType
      city
      lat
      lng
      address
      coverImage
      phone
      googleLocation
    }
  }
`;
const CREATE_MENU_ITEM = gql`
  mutation CreateMenuItem($input: CreateMenuItemInput!) {
    createMenuItem(input: $input) {
      id
      name
      price
      menuId
      description
      imageUrl
      isAvailable
    }
  }
`;

const UPDATE_MENU_ITEM = gql`
  mutation UpdateMenuItem($id: ID!, $input: UpdateMenuItemInput!) {
    updateMenuItem(id: $id, input: $input) {
      id
      name
      description
      category
      price
      currency
      imageUrl
      isAvailable
      order
      updatedAt
    }
  }
`;

const DELETE_MENU_ITEM = gql`
  mutation DeleteMenuItem($id: ID!) {
    deleteMenuItem(id: $id) {
      id
      name
      menuId
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
      restaurantId
      createdAt
    }
  }
`;

const DELETE_MENU_IMAGE = gql`
  mutation DeleteMenuImage($id: ID!) {
    deleteMenuImage(id: $id) {
      id
      imageUrl
    }
  }
`;

export default function RestaurantDetailPage() {
  const router = useRouter();
  const { user } = useSessionStore();
  const restaurantId = user?.restaurantId;

  const { data, loading, error } = useQuery(GET_RESTAURANT, {
    variables: { id: restaurantId },
    skip: !restaurantId,
  });

  const { data: menuData } = useQuery(GET_MENU_ITEMS, {
    variables: { restaurantId: restaurantId },
    skip: !restaurantId,
  });
  const { data: menuInfoData } = useQuery(GET_MENU, {
    variables: { restaurantId: restaurantId },
    skip: !restaurantId,
  });
  console.log('menuData:', data);

  const [updateRestaurant] = useMutation(UPDATE_RESTAURANT);
  const [formData, setFormData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('details');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [newMenuItem, setNewMenuItem] = useState<any>({
    name: '',
    description: '',
    category: '',
    menuId: '',
    price: 0,
    currency: 'COP',
    imageUrl: '',
    isAvailable: true,
    order: 0,
  });
  const [editingMenuItemId, setEditingMenuItemId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createMenuItem] = useMutation(CREATE_MENU_ITEM);
  const [updateMenuItemMutation] = useMutation(UPDATE_MENU_ITEM);
  const [deleteMenuItemMutation] = useMutation(DELETE_MENU_ITEM);
  const [createMenuImage] = useMutation(CREATE_MENU_IMAGE);
  const [deleteMenuImage] = useMutation(DELETE_MENU_IMAGE);
  const [isMenuImageModalOpen, setIsMenuImageModalOpen] = useState(false);
  const [newMenuImage, setNewMenuImage] = useState<any>({
    imageUrl: '',
    title: '',
    description: '',
  });
  const handleAddOrUpdateMenuItem = async () => {
    if (!newMenuItem.name) return;
    const menuId = newMenuItem.menuId || formData.menuId;
    if (!menuId) {
      console.error('menuId is required to create a menu item');
      return;
    }
    // If editing existing persisted item
    if (editingMenuItemId) {
      const isTmp = editingMenuItemId.startsWith?.('tmp-');
      if (isTmp) {
        // create on server
        try {
          const { data } = await createMenuItem({
            variables: {
              input: {
                menuId: menuId,
                name: newMenuItem.name,
                description: newMenuItem.description,
                price: parseFloat(String(newMenuItem.price)) || 0,
                currency: newMenuItem.currency || 'COP',
                imageUrl: newMenuItem.imageUrl || null,
                order: parseFloat(String(newMenuItem.order)) || 0,
              },
            },
            refetchQueries: [{ query: GET_MENU_ITEMS, variables: { restaurantId } }],
            awaitRefetchQueries: true,
          });
          const created = data?.createMenuItem;
          if (created) {
            setFormData((prev: any) => ({
              ...prev,
              menuItems: (prev.menuItems || []).map((it: any) =>
                it.id === editingMenuItemId ? created : it
              ),
            }));
          }
        } catch (err) {
          console.error('createMenuItem error', err);
        }
        setEditingMenuItemId(null);
      } else {
        // update on server
        try {
          const { data } = await updateMenuItemMutation({
            variables: {
              id: editingMenuItemId,
              input: {
                name: newMenuItem.name,
                description: newMenuItem.description,
                category: newMenuItem.category,
                price: parseFloat(newMenuItem.price) || 0,
                currency: newMenuItem.currency || 'COP',
                imageUrl: newMenuItem.imageUrl || null,
                isAvailable: newMenuItem.isAvailable,
                order: parseFloat(newMenuItem.order) || 0,
              },
            },
            refetchQueries: [{ query: GET_MENU_ITEMS, variables: { restaurantId } }],
            awaitRefetchQueries: true,
          });
          const updated = data?.updateMenuItem;
          if (updated) {
            setFormData((prev: any) => ({
              ...prev,
              menuItems: (prev.menuItems || []).map((it: any) =>
                it.id === updated.id ? { ...it, ...updated } : it
              ),
            }));
          }
        } catch (err) {
          console.error('updateMenuItem error', err);
        }
        setEditingMenuItemId(null);
      }
    } else {
      // create new
      try {
        const { data } = await createMenuItem({
          variables: {
            input: {
              menuId: menuId,
              name: newMenuItem.name,
              description: newMenuItem.description,
              price: parseFloat(String(newMenuItem.price)) || 0,
              currency: newMenuItem.currency,
              imageUrl: newMenuItem.imageUrl || null,
              order: parseFloat(String(newMenuItem.order)) || 0,
            },
          },
        });
        const created = data?.createMenuItem;
        if (created) {
          setFormData((prev: any) => ({
            ...prev,
            menuItems: [...(prev.menuItems || []), created],
          }));
        }
      } catch (err) {
        console.error('createMenuItem error', err);
      }
    }

    setNewMenuItem({
      name: '',
      description: '',
      category: '',
      price: 0,
      currency: 'COP',
      imageUrl: '',
      isAvailable: true,
      order: 0,
    });
  };
  useEffect(() => {
    if (data?.restaurant) {
      const rest = data.restaurant;
      setFormData((prev: any) => ({ ...prev, ...rest, menuId: rest.menu?.id || prev.menuId }));
    }

    if (menuInfoData?.menu) {
      const m = menuInfoData.menu;
      setFormData((prev: any) => ({
        ...prev,
        menuId: m.id || prev.menuId,
        menu: { id: m.id, name: m.name },
      }));
    }
  }, [data, menuInfoData]);

  useEffect(() => {
    if (menuData?.menuItems) {
      setFormData((prev: any) => ({ ...prev, menuItems: menuData.menuItems }));
    }
  }, [menuData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const resolveImageUrl = (value?: string) => {
    if (!value) return '';
    if (
      value.startsWith('http') ||
      value.startsWith('https') ||
      value.startsWith('blob:') ||
      value.startsWith('data:')
    ) {
      return value;
    }
    return `https://emprendyup-images.s3.us-east-1.amazonaws.com/${value}`;
  };

  const resolveDomainUrl = (value?: string) => {
    if (!value) return '';
    if (value.startsWith('http') || value.startsWith('https')) return value;
    return `https://${value}`;
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const {
        id: _id,
        brandingId: _brandingId,
        businessConfigId: _businessConfigId,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        menuImages: _menuImages,
        customDomain: _customDomain,
        slug: _slug,
        menu: _menu,
        menuId: _menuId,
        menuItems: _menuItems,
        __typename,
        ...inputData
      } = formData;

      await updateRestaurant({
        variables: {
          id: restaurantId,
          input: inputData,
        },
      });

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleRemoveImage = (field: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: '' }));
  };

  const handleCreateMenuImage = async (url: string) => {
    // Open modal to allow user to add title/description before creating
    if (!url) return;
    setNewMenuImage({ imageUrl: url, title: '', description: '' });
    setIsMenuImageModalOpen(true);
  };

  const handleDeleteMenuImage = async (id: string) => {
    try {
      const { data } = await deleteMenuImage({
        variables: { id },
        refetchQueries: [{ query: GET_RESTAURANT, variables: { id: restaurantId } }],
        awaitRefetchQueries: true,
      });
      const deleted = data?.deleteMenuImage;
      if (deleted) {
        setFormData((prev: any) => ({
          ...prev,
          menuImages: (prev.menuImages || []).filter((m: any) => m.id !== deleted.id),
        }));
      }
    } catch (err) {
      console.error('deleteMenuImage error', err);
    }
  };

  const handleEditMenuItem = (item: any) => {
    setEditingMenuItemId(item.id);
    setNewMenuItem({ ...item });
    setIsModalOpen(true);
  };

  const handleDeleteMenuItem = (id: string) => {
    (async () => {
      try {
        const { data } = await deleteMenuItemMutation({
          variables: { id },
          refetchQueries: [{ query: GET_MENU_ITEMS, variables: { restaurantId } }],
          awaitRefetchQueries: true,
        });
        const deleted = data?.deleteMenuItem;
        if (deleted) {
          setFormData((prev: any) => ({
            ...prev,
            menuItems: (prev.menuItems || []).filter((it: any) => it.id !== id),
          }));
        }
      } catch (err) {
        console.error('deleteMenuItem error', err);
      }
      if (editingMenuItemId === id) {
        setEditingMenuItemId(null);
        setNewMenuItem({
          name: '',
          description: '',
          category: '',
          price: 0,
          currency: 'COP',
          imageUrl: '',
          isAvailable: true,
          order: 0,
        });
      }
    })();
  };

  const tabs = [
    { id: 'details', label: 'Detalles', icon: Info },
    { id: 'location', label: 'Ubicación', icon: MapPin },
    { id: 'menu', label: 'Menú', icon: Building },
  ];

  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No se encontró el ID del restaurante</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--fourth-base)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  const inputClassName =
    'w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent';
  console.log('formData:', formData);
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-6">
          <div className="flex justify-between items-start">
            <div>
              <button
                onClick={() => router.back()}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
              >
                ← Volver
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Configuración de Restaurante
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{formData.name}</p>
              {(formData.customDomain || formData.subdomain || formData.slug) && (
                <a
                  href={`https://${formData.customDomain || `${formData.subdomain || formData.slug}.emprendyup.com`}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--fourth-base)] hover:underline mt-1 flex items-center gap-1"
                >
                  <Globe className="h-4 w-4" />
                  {formData.customDomain || `${formData.subdomain || formData.slug}.emprendyup.com`}
                </a>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="inline-flex items-center px-4 py-2 bg-[var(--fourth-base)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saveStatus === 'saving' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : saveStatus === 'success' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saveStatus === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <nav className="container mx-auto px-6">
            <div className="flex gap-2 overflow-x-auto py-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-[var(--fourth-base)] text-white shadow'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <div className="flex-1 p-6 mt-6">
            <div className="w-full">
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Información General
                    </h2>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nombre del Restaurante
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleInputChange}
                            className={inputClassName}
                            placeholder="Nombre del restaurante"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipo de Cocina
                          </label>
                          <input
                            type="text"
                            name="cuisineType"
                            value={formData.cuisineType || ''}
                            onChange={handleInputChange}
                            className={inputClassName}
                            placeholder="Ej: Italiana, Mexicana, etc."
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Descripción
                        </label>
                        <textarea
                          name="description"
                          value={formData.description || ''}
                          onChange={handleInputChange}
                          rows={4}
                          className={inputClassName}
                          placeholder="Describe tu restaurante..."
                        />
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone || ''}
                          onChange={handleInputChange}
                          className={inputClassName}
                          placeholder="+57 300 123 4567"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Tab */}
              {activeTab === 'location' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Ubicación
                    </h2>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Ciudad
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city || ''}
                            onChange={handleInputChange}
                            className={inputClassName}
                            placeholder="Bogotá"
                          />
                        </div>

                        {/* <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Dirección Completa
                          </label>
                          <textarea
                            name="address"
                            value={formData.address || ''}
                            onChange={handleInputChange}
                            rows={3}
                            className={inputClassName}
                            placeholder="Calle 72 #10-15, Bogotá, Colombia"
                          />
                        </div> */}

                        {/* <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Google Maps URL
                          </label>
                          <input
                            type="url"
                            name="googleLocation"
                            value={formData.googleLocation || ''}
                            onChange={handleInputChange}
                            className={inputClassName}
                            placeholder="https://maps.google.com/..."
                          />
                        </div> */}
                        <div className="mt-4">
                          <AdressAutocomplete
                            value={formData.address}
                            onPlaceSelected={async (place) => {
                              if (!place) return;
                              const lat = place.geometry?.location?.lat?.() as number | undefined;
                              const lng = place.geometry?.location?.lng?.() as number | undefined;
                              setFormData((prev: any) => ({
                                ...prev,
                                address: place.formatted_address || prev.address,
                                lat: typeof lat === 'number' ? lat : prev.lat,
                                lng: typeof lng === 'number' ? lng : prev.lng,
                                googleLocation: (place as any).url || prev.googleLocation,
                              }));
                            }}
                          />

                          {(typeof formData.lat === 'number' && typeof formData.lng === 'number') ||
                          formData.googleLocation ? (
                            <div className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 mt-3">
                              <iframe
                                src={
                                  formData.googleLocation
                                    ? `https://www.google.com/maps?q=${encodeURIComponent(
                                        formData.googleLocation
                                      )}&output=embed`
                                    : `https://www.google.com/maps?q=${formData.lat},${formData.lng}&z=15&output=embed`
                                }
                                width="100%"
                                height={300}
                                className="w-full h-72"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                              />
                            </div>
                          ) : (
                            <div className="text-gray-600 dark:text-gray-400 py-6 text-center">
                              Introduce una dirección o coordenadas para ver el mapa
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Tab */}
              {activeTab === 'menu' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Menú del Restaurante
                    </h2>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="space-y-4">
                        <div className="mb-4">
                          <button
                            onClick={() => {
                              setEditingMenuItemId(null);
                              setNewMenuItem({
                                name: '',
                                description: '',
                                category: '',
                                price: 0,
                                currency: 'COP',
                                imageUrl: '',
                                isAvailable: true,
                                order: 0,
                              });
                              setIsModalOpen(true);
                            }}
                            className="px-4 py-2 bg-fourth-base text-white rounded-lg"
                          >
                            Crear item
                          </button>
                        </div>

                        {/* List of menu items */}
                        {formData.menuItems && formData.menuItems.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {formData.menuItems.map((item: any) => (
                              <div
                                key={item.id}
                                className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden p-3"
                              >
                                {item.imageUrl && (
                                  <img
                                    src={resolveImageUrl(item.imageUrl)}
                                    alt={item.name}
                                    className="w-full h-36 object-cover rounded mb-2"
                                  />
                                )}
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                      {item.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {item.category}
                                    </p>
                                    {item.description && (
                                      <p className="text-xs text-gray-500 mt-2">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">
                                      {item.price} {item.currency}
                                    </p>
                                    <p className="text-xs text-gray-500">Orden: {item.order}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={() => handleEditMenuItem(item)}
                                    className="px-3 py-1 bg-fourth-base/40 rounded text-sm"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMenuItem(item.id)}
                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No hay items en el menú
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Status Toast */}
      {saveStatus === 'success' && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          Cambios guardados correctamente
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          Error al guardar los cambios
        </div>
      )}
      {/* Modal para crear/editar item de menú */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black opacity-40"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 w-full max-w-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <span>{editingMenuItemId ? 'Editar item' : 'Crear item'}</span>
              {formData.menu?.name && (
                <span className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                  Menú: {formData.menu.name}
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* menuId se obtiene desde la consulta `restaurant.menu` y no es editable */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newMenuItem.name}
                  onChange={(e) => setNewMenuItem((p: any) => ({ ...p, name: e.target.value }))}
                  className={inputClassName}
                  placeholder="Nombre del item"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría
                </label>
                <input
                  type="text"
                  value={newMenuItem.category}
                  onChange={(e) => setNewMenuItem((p: any) => ({ ...p, category: e.target.value }))}
                  className={inputClassName}
                  placeholder="Ej: Entradas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Precio
                </label>
                <input
                  type="number"
                  value={newMenuItem.price}
                  onChange={(e) =>
                    setNewMenuItem((p: any) => ({ ...p, price: parseFloat(e.target.value || '0') }))
                  }
                  className={inputClassName}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Moneda
                </label>
                <input
                  type="text"
                  value={newMenuItem.currency}
                  onChange={(e) => setNewMenuItem((p: any) => ({ ...p, currency: e.target.value }))}
                  className={inputClassName}
                  placeholder="COP"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={newMenuItem.description}
                  onChange={(e) =>
                    setNewMenuItem((p: any) => ({ ...p, description: e.target.value }))
                  }
                  className={inputClassName}
                  rows={2}
                  placeholder="Descripción (opcional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagen
                </label>
                {newMenuItem.imageUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={resolveImageUrl(newMenuItem.imageUrl)}
                      alt="menu"
                      className="w-20 h-20 object-cover rounded"
                    />
                    <button
                      onClick={() => setNewMenuItem((p: any) => ({ ...p, imageUrl: '' }))}
                      className="px-3 py-1 bg-red-600 text-white rounded"
                    >
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <FileUpload
                    onFile={(url) => setNewMenuItem((p: any) => ({ ...p, imageUrl: url }))}
                    accept="image/*"
                  />
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(newMenuItem.isAvailable)}
                    onChange={(e) =>
                      setNewMenuItem((p: any) => ({ ...p, isAvailable: e.target.checked }))
                    }
                    className="w-4 h-4 text-fourth-base focus:ring-fourth-base border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                  <span className="ml-2 text-sm">Disponible</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orden
                </label>
                <input
                  type="number"
                  value={newMenuItem.order}
                  onChange={(e) =>
                    setNewMenuItem((p: any) => ({ ...p, order: parseFloat(e.target.value || '0') }))
                  }
                  className={inputClassName}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={async () => {
                  await handleAddOrUpdateMenuItem();
                  setIsModalOpen(false);
                }}
                className="px-4 py-2 bg-[var(--fourth-base)] text-white rounded-lg"
              >
                {editingMenuItemId ? 'Guardar' : 'Crear'}
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingMenuItemId(null);
                  setNewMenuItem({
                    name: '',
                    description: '',
                    category: '',
                    price: 0,
                    currency: 'COP',
                    imageUrl: '',
                    isAvailable: true,
                    order: 0,
                  });
                }}
                className="px-4 py-2 bg-gray-300 text-black rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
