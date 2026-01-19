'use client';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Save,
  CheckCircle,
  AlertCircle,
  Info,
  MapPin,
  Phone,
  Mail,
  Globe,
  ImageIcon,
} from 'lucide-react';
import AdminGuard from '@/app/components/AdminGuard';
import FileUpload from '@/app/components/FileUpload';
import Image from 'next/image';

const GET_SERVICE_PROVIDER = gql`
  query GetServiceProvider($id: String!) {
    serviceProvider(id: $id) {
      id
      businessName
      type
      phone
      email
      description
      location
      address
      whatsappNumber
      coverImage
      slug
      brandingId
      businessConfigId
      customDomain
      slug
      isActive
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_SERVICE_PROVIDER = gql`
  mutation UpdateServiceProvider($id: String!, $data: UpdateServiceProviderInput!) {
    updateServiceProvider(id: $id, data: $data) {
      id
      businessName
      type
      phone
      email
      coverImage
      description
      location
      address
      whatsappNumber
      isActive
    }
  }
`;

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params?.id as string;

  const { data, loading, error } = useQuery(GET_SERVICE_PROVIDER, {
    variables: { id: serviceId },
    skip: !serviceId,
  });

  const [updateService] = useMutation(UPDATE_SERVICE_PROVIDER);
  const [formData, setFormData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('details');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (data?.serviceProvider) {
      setFormData(data.serviceProvider);
    }
  }, [data]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const {
        id,
        brandingId,
        businessConfigId,
        createdAt,
        updatedAt,
        slug,
        __typename,
        ...inputData
      } = formData;

      await updateService({
        variables: {
          id: serviceId,
          data: inputData,
        },
      });

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const tabs = [
    { id: 'details', label: 'Detalles', icon: Info },
    { id: 'location', label: 'Ubicación', icon: MapPin },
    { id: 'images', label: 'Imágenes', icon: ImageIcon },
    { id: 'contact', label: 'Contacto', icon: Phone },
  ];

  if (!serviceId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No se encontró el ID del servicio</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fourth-base"></div>
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
    'w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent';
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
  const handleRemoveImage = (field: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: '' }));
  };
  return (
    <AdminGuard>
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
                  Configuración de Servicio
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{formData.businessName}</p>
                {(formData.customDomain || formData.subdomain) && (
                  <a
                    href={`https://${formData.customDomain || `${formData.subdomain}.emprendyup.com`}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-fourth-base hover:underline mt-1 flex items-center gap-1"
                  >
                    <Globe className="h-4 w-4" />
                    {formData.customDomain || `${formData.subdomain}.emprendyup.com`}
                  </a>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="inline-flex items-center px-4 py-2 bg-fourth-base text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                          ? 'bg-fourth-base text-white shadow'
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
                              Nombre del Negocio
                            </label>
                            <input
                              type="text"
                              name="businessName"
                              value={formData.businessName || ''}
                              onChange={handleInputChange}
                              className={inputClassName}
                              placeholder="Nombre del negocio"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Tipo de Servicio
                            </label>
                            <input
                              type="text"
                              name="type"
                              value={formData.type || ''}
                              onChange={handleInputChange}
                              className={inputClassName}
                              placeholder="Ej: Plomería, Electricidad, etc."
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
                            placeholder="Describe tu servicio..."
                          />
                        </div>

                        <div className="mt-6">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="isActive"
                              checked={formData.isActive || false}
                              onChange={(e) =>
                                setFormData((prev: any) => ({
                                  ...prev,
                                  isActive: e.target.checked,
                                }))
                              }
                              className="w-4 h-4 text-fourth-base focus:ring-fourth-base border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Servicio activo
                            </span>
                          </label>
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
                              Ciudad/Ubicación
                            </label>
                            <input
                              type="text"
                              name="location"
                              value={formData.location || ''}
                              onChange={handleInputChange}
                              className={inputClassName}
                              placeholder="Bogotá"
                            />
                          </div>

                          <div>
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
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Images Tab */}
                {activeTab === 'images' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Imágenen de portada
                      </h2>

                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Imagen de servicio
                          </label>
                          <div className="border-gray-300 dark:border-gray-600 rounded-lg p-4">
                            {formData.coverImage ? (
                              <div className="space-y-2">
                                <div className="relative inline-block">
                                  <Image
                                    src={resolveImageUrl(formData.coverImage)}
                                    alt="Cover"
                                    width={400}
                                    height={200}
                                    className="w-full h-48 rounded object-cover"
                                    unoptimized={Boolean(
                                      formData.coverImage?.startsWith('blob:') ||
                                        formData.coverImage?.startsWith('data:')
                                    )}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage('coverImage')}
                                    className="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm flex items-center justify-center transition-colors"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <FileUpload
                                  onFile={(url) =>
                                    setFormData((prev: any) => ({ ...prev, coverImage: url }))
                                  }
                                  storeId={serviceId}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Tab */}
                {activeTab === 'contact' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Información de Contacto
                      </h2>

                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Phone className="w-4 h-4 inline mr-2" />
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

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Globe className="w-4 h-4 inline mr-2" />
                                WhatsApp
                              </label>
                              <input
                                type="tel"
                                name="whatsappNumber"
                                value={formData.whatsappNumber || ''}
                                onChange={handleInputChange}
                                className={inputClassName}
                                placeholder="+57 300 123 4567"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              <Mail className="w-4 h-4 inline mr-2" />
                              Email
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email || ''}
                              onChange={handleInputChange}
                              className={inputClassName}
                              placeholder="contacto@servicio.com"
                            />
                          </div>
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
      </div>
    </AdminGuard>
  );
}
