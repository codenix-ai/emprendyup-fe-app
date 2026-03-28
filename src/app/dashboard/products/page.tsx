'use client';

import { useState } from 'react';
import {
  Plus,
  Package,
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Copy,
  Download,
  Upload,
  Layout,
  Loader,
} from 'lucide-react';
import { gql, useMutation, useQuery, useApolloClient } from '@apollo/client';
import { CreateProductInput, Product } from '@/app/utils/types/Product';
import { useSearchProducts } from '@/lib/hooks/useSearchProducts';
import toast from 'react-hot-toast';
import { ProductFormWizard } from '@/app/components/Product/ProductFromWizard';
import Image from 'next/image';
import { SectionLoader } from '@/app/components/Loader';

// GraphQL Queries and Mutations
const GET_PRODUCTS_BY_STORE = gql`
  query GetProductsByStore(
    $storeId: String!
    $internal: String!
    $available: String!
    $page: Int
    $pageSize: Int
  ) {
    productsByStore(
      storeId: $storeId
      internal: $internal
      available: $available
      page: $page
      pageSize: $pageSize
    ) {
      items {
        id
        name
        title
        description
        price
        currency
        available
        inStock
        stock
        landing
        externalSKU
        images {
          id
          url
          order
        }
        colors {
          id
          color
          colorHex
        }

        categories {
          category {
            id
            name
            slug
          }
        }
      }
      total
      page
      pageSize
    }
  }
`;

const PAGINATED_PRODUCTS_QUERY = gql`
  query GetPaginatedProducts($page: Int, $pageSize: Int) {
    paginatedProducts(pagination: { page: $page, pageSize: $pageSize }) {
      items {
        id
        name
        title
        description
        price
        currency
        storeId
        available
        createdAt
        updatedAt
        landing
        images {
          id
          url
          order
        }
        colors {
          id
          color
          colorHex
        }
        sizes {
          id
          size
        }
        comments {
          id
          rating
          comment
          createdAt
        }
      }
      total
      page
      pageSize
    }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: String!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      title
      description
      price
      currency
      available
      inStock
      stock
      storeId
      images {
        id
        url
        order
      }
      colors {
        id
        name
        hex
      }
      sizes {
        id
        name
        value
      }
      categories {
        id
        name
        slug
      }
      createdAt
      updatedAt
    }
  }
`;

const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      title
      description
      price
      currency
      available
      inStock
      stock
      storeId
      externalId
      images {
        id
        url
        order
      }
      colors {
        id
        color
        colorHex
      }
      variants {
        id
        typeVariant
        nameVariant
        jsonData
      }
      stocks {
        id
        price
      }
      categories {
        id
        name
        slug
      }
      createdAt
      updatedAt
    }
  }
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: String!) {
    deleteProduct(id: $id) {
      id
      name
    }
  }
`;

const DELETE_PRODUCTS = gql`
  mutation DeleteProducts($ids: [String!]!) {
    deleteProducts(ids: $ids) {
      count
    }
  }
`;

const DUPLICATE_PRODUCT = gql`
  mutation DuplicateProduct($id: String!) {
    duplicateProduct(id: $id) {
      id
      name
      title
      storeId
      price
      currency
      imageUrl
      images {
        id
        url
        order
      }
      colors {
        id
        color
        colorHex
      }
      sizes {
        id
        size
      }
      categories {
        category {
          id
          name
          slug
        }
      }
      comments {
        id
        comment
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

const GET_STORE = gql`
  query GetStore($storeId: String!) {
    store(storeId: $storeId) {
      id
      storeId
      name
      customDomain
    }
  }
`;

export default function ProductsPage() {
  const apolloClient = useApolloClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [generatingLanding, setGeneratingLanding] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15; // Fixed page size

  const isAdmin =
    userData?.role === 'ADMIN' ||
    (Array.isArray(userData?.roles) && userData.roles.includes('ADMIN'));

  // Fetch store data for domain information
  const { data: storeInfo } = useQuery(GET_STORE, {
    variables: { storeId: userData?.storeId || '' },
    skip: !userData?.storeId,
  });

  const {
    data: storeData,
    loading: storeLoading,
    refetch: refetchStoreProducts,
  } = useQuery(GET_PRODUCTS_BY_STORE, {
    variables: {
      storeId: userData?.storeId || '',
      page: currentPage,
      pageSize,
      internal: 'true',
      available: 'true',
    },
    skip: isAdmin || !userData?.storeId,
    fetchPolicy: 'network-only',
  });

  const {
    data: adminData,
    loading: adminLoading,
    refetch: refetchAdminProducts,
  } = useQuery(PAGINATED_PRODUCTS_QUERY, {
    variables: { page: currentPage, pageSize },
    skip: !isAdmin,
    fetchPolicy: 'network-only',
  });

  const productsData = isAdmin ? adminData : storeData;
  const loadingProducts = storeLoading || adminLoading;

  const refetchProducts = async (vars?: any) => {
    if (isAdmin) {
      return (
        refetchAdminProducts &&
        refetchAdminProducts({
          page: vars?.page || currentPage,
          pageSize: vars?.pageSize || pageSize,
        })
      );
    }
    return (
      refetchStoreProducts &&
      refetchStoreProducts({
        storeId: userData?.storeId || '',
        page: vars?.page || currentPage,
        pageSize: vars?.pageSize || pageSize,
      })
    );
  };
  const [createProduct, { loading: creating }] = useMutation(CREATE_PRODUCT);
  const [updateProduct, { loading: updating }] = useMutation(UPDATE_PRODUCT);
  const [deleteProduct, { loading: deleting }] = useMutation(DELETE_PRODUCT);
  const [deleteProducts, { loading: deletingMultiple }] = useMutation(DELETE_PRODUCTS);
  const [duplicateProduct, { loading: duplicating }] = useMutation(DUPLICATE_PRODUCT);

  // Use server-side search hook when the search term has 2+ characters
  const {
    products: searchedProducts,
    total: searchTotal,
    totalPages: searchTotalPages,
    loading: searchLoading,
  } = useSearchProducts(searchTerm, currentPage, pageSize);

  if (!productsData) {
    return null;
  }

  // Use data from GraphQL
  const products: Product[] = isAdmin
    ? productsData?.paginatedProducts?.items || []
    : productsData?.productsByStore?.items || [];
  const totalProducts = isAdmin
    ? productsData?.paginatedProducts?.total || 0
    : productsData?.productsByStore?.total || 0;
  const totalPages = Math.ceil(totalProducts / pageSize) || 1;

  const searchActive = (searchTerm || '').trim().length >= 2;

  const displayedProducts = searchActive ? searchedProducts : products;
  const displayedTotal = searchActive ? searchTotal : totalProducts;
  const displayedTotalPages = searchActive ? searchTotalPages : totalPages;
  const displayedLoading = searchActive ? searchLoading : loadingProducts;

  const filteredProducts = displayedProducts.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Colors from store - usando slate-900 como color principal
  const primaryColor = '#0F172A'; // slate-900

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedProducts([]);
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
    setOpenDropdown(null);
  };

  const handleSaveProduct = async (productData: CreateProductInput) => {
    try {
      if (editingProduct) {
        const storeId = userData?.storeId || 'default-store';
        const { data } = await updateProduct({
          variables: {
            id: editingProduct.id,
            input: {
              name: productData.name,
              title: productData.title,
              description: productData.description,
              price: productData.price,
              currency: productData.currency,
              available: productData.available,
              inStock: productData.inStock,
              stock: productData.stock,
              categories: productData.categoryIds || [],
              images: productData.images.map((img: any) => ({
                url: img.url,
                order: img.order,
              })),
              variants: [
                // Convert colors to variants
                ...productData.colors.map((color: any) => ({
                  typeVariant: 'COLOR',
                  nameVariant: color.name,
                  jsonData: {
                    hex: color.hex,
                    name: color.name,
                  },
                })),
                // Add size variants if available
                ...(productData.sizes || []).map((size: any) => ({
                  typeVariant: 'SIZE',
                  nameVariant: size.name || size,
                  jsonData: {
                    name: size.name || size,
                    value: size.name || size,
                  },
                })),
              ],
              stocks: [
                {
                  price: productData.price,
                  stock: productData.stock,
                },
              ],
            },
          },
        });

        if (data?.updateProduct) {
          await refetchProducts({
            storeId,
            page: currentPage,
            pageSize,
          });
          toast.success('Producto actualizado exitosamente');
        }
      } else {
        const { data } = await createProduct({
          variables: {
            input: {
              name: productData.name,
              title: productData.title,
              description: productData.description,
              price: productData.price,
              currency: productData.currency,
              available: productData.available,
              inStock: productData.inStock,
              stock: productData.stock,
              storeId: userData.storeId || 'default-store',
              categories: productData.categoryIds || [],
              images: productData.images.map((img: any) => ({
                url: img.url,
                order: img.order,
              })),
              variants: [
                // Convert colors to variants
                ...productData.colors.map((color: any) => ({
                  typeVariant: 'COLOR',
                  nameVariant: color.name,
                  jsonData: {
                    hex: color.hex,
                    name: color.name,
                  },
                })),
                // Add size variants if available
                ...(productData.sizes || []).map((size: any) => ({
                  typeVariant: 'SIZE',
                  nameVariant: size.name || size,
                  jsonData: {
                    name: size.name || size,
                    value: size.name || size,
                  },
                })),
              ],
              stocks: [
                {
                  price: productData.price,
                  stock: productData.stock,
                },
              ],
            },
          },
        });
        const storeId = userData?.storeId || 'default-store';
        if (data?.createProduct) {
          await refetchProducts({
            storeId,
            page: currentPage,
            pageSize,
          });
          toast.success('Producto creado exitosamente');
        }
      }
      setShowForm(false);
      setEditingProduct(null);
    } catch (error: any) {
      console.error('Error saving product:', error);
      const errorMessage = error.message || 'Error al guardar el producto';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (
      !confirm(
        '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    try {
      const { data } = await deleteProduct({
        variables: { id: productId },
      });
      const storeId = userData?.storeId || 'default-store';
      if (data?.deleteProduct) {
        setSelectedProducts((prev) => prev.filter((id) => id !== productId));
        await refetchProducts({
          storeId,
          page: currentPage,
          pageSize,
        });
        toast.success('Producto eliminado exitosamente');
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      const errorMessage = error.message || 'Error al eliminar el producto';
      toast.error(errorMessage);
    }
    setOpenDropdown(null);
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) {
      toast.error('No hay productos seleccionados para eliminar');
      return;
    }

    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar ${selectedProducts.length} producto(s)? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      const { data } = await deleteProducts({
        variables: { ids: selectedProducts },
      });
      const storeId = userData?.storeId || 'default-store';
      if (data?.deleteProducts) {
        setSelectedProducts([]);
        await refetchProducts({
          storeId,
          page: currentPage,
          pageSize,
        });
        toast.success(`${data.deleteProducts.count} producto(s) eliminado(s) exitosamente`);
      }
    } catch (error: any) {
      console.error('Error deleting products:', error);
      const errorMessage = error.message || 'Error al eliminar los productos';
      toast.error(errorMessage);
    }
  };

  const handleDuplicateProduct = async (productId: string) => {
    try {
      const { data } = await duplicateProduct({ variables: { id: productId } });
      // Debug log to inspect server response when errors occur
      // eslint-disable-next-line no-console

      if (data?.duplicateProduct) {
        // Refetch list to show duplicated product
        await refetchProducts({ page: currentPage, pageSize });
        toast.success('Producto duplicado exitosamente');
      } else {
        console.warn('duplicateProduct returned no product', data);
      }
    } catch (error: any) {
      console.error('Error duplicando producto:', error);
      toast.error(error.message || 'Error al duplicar el producto');
    }
    setOpenDropdown(null);
  };

  const handleViewLanding = (product: Product) => {
    // Construct the landing page URL using store domain
    const store = storeInfo?.store;
    if (store) {
      const domain = store.customDomain || `${store.storeId}.emprendyup.com`;
      const url = `https://${domain}/products/landing/${product.externalSKU}`;
      window.open(url, '_blank');
    } else {
      // Fallback to relative URL if store data is not available
      window.open(`/products/landing/${product.externalSKU}`, '_blank');
    }
  };

  const handleGenerateLanding = async (product: Product) => {
    setGeneratingLanding((prev) => new Set(prev).add(product.id));
    try {
      // Extract features from description or other fields
      const features: string[] = [];

      // Prepare the payload for the landing page configuration
      const payload = {
        brand: '',
        features,
        specifications: {},
      };

      // Make the API call to generate the landing page
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/product/${product.id}/generate-landing`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Error al generar la landing page');
      }

      await response.json();

      // Update the Apollo cache to reflect the change
      apolloClient.cache.modify({
        id: apolloClient.cache.identify({ __typename: 'Product', id: product.id }),
        fields: {
          landing() {
            return true;
          },
        },
      });

      toast.success('Landing page generada exitosamente');

      // Optionally redirect to the landing page or show a preview
      // window.open(`/landing/${product.id}`, '_blank');
    } catch (error: any) {
      console.error('Error generando landing page:', error);
      toast.error(error.message || 'Error al generar la landing page');
    } finally {
      setGeneratingLanding((prev) => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
      setOpenDropdown(null);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedProducts((prev) =>
      prev.length === filteredProducts.length
        ? []
        : (filteredProducts as Product[]).map((p) => p.id)
    );
  };

  const handleExportProducts = () => {
    if (!filteredProducts || filteredProducts.length === 0) {
      toast.error('No hay productos para exportar');
      return;
    }

    try {
      setExporting(true);

      const headers = [
        'id',
        'name',
        'title',
        'price',
        'currency',
        'stock',
        'available',
        'inStock',
        'externalSKU',
        'categories',
      ];

      const rows = (filteredProducts as Product[]).map((p) => {
        const categories = (p as any).categories || [];
        const categoryNames = categories
          .map((c: any) => c?.category?.name || c?.name || '')
          .filter(Boolean)
          .join('|');

        return [
          p.id || '',
          p.name || '',
          p.title || '',
          p.price ?? '',
          p.currency || '',
          p.stock ?? '',
          p.available ? 'true' : 'false',
          p.inStock ? 'true' : 'false',
          (p as any).externalSKU || '',
          categoryNames,
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `productos_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success('Exportación iniciada');
    } catch (err: any) {
      console.error('Error exporting products:', err);
      toast.error(err?.message || 'Error al exportar productos');
    } finally {
      setExporting(false);
    }
  };

  if (showForm) {
    return (
      <ProductFormWizard
        product={editingProduct || undefined}
        onSave={handleSaveProduct}
        onCancel={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
        onSaved={async () => {
          const storeId = userData?.storeId || '';
          await refetchProducts({ storeId, page: currentPage, pageSize });
        }}
        loading={creating || updating}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gestión de Productos
          </h3>
          <p className="text-sm text-gray-400">Administra el catálogo de productos de tu tienda</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => (window.location.href = '/dashboard/products/import')}
            className="text-white px-4 py-2 rounded-lg flex items-center justify-center font-medium shadow-sm hover:shadow-md transition-all duration-200 bg-purple-700 hover:bg-purple-600"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar CSV
          </button>
          <button
            onClick={handleExportProducts}
            disabled={exporting}
            className="text-white px-4 py-2 rounded-lg flex items-center justify-center font-medium shadow-sm hover:shadow-md transition-all duration-200 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
          <button
            onClick={handleCreateProduct}
            className="text-gray-900 dark:text-white px-4 py-2 rounded-lg flex items-center justify-center font-medium shadow-sm hover:shadow-md transition-all duration-200 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all placeholder-gray-400"
          />
        </div>

        {selectedProducts.length > 0 && (
          <button
            onClick={handleDeleteSelected}
            disabled={deletingMultiple}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deletingMultiple ? 'Eliminando...' : `Eliminar (${selectedProducts.length})`}
          </button>
        )}
      </div>

      {/* Mobile Select All */}
      {filteredProducts.length > 0 && (
        <div className="md:hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={
                selectedProducts.length === filteredProducts.length && filteredProducts.length > 0
              }
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
              style={
                {
                  accentColor: primaryColor,
                  '--tw-ring-color': primaryColor,
                } as React.CSSProperties
              }
            />
            <span className="text-sm text-gray-900 dark:text-white font-medium">
              {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0
                ? 'Deseleccionar todos'
                : 'Seleccionar todos'}
            </span>
            {selectedProducts.length > 0 && (
              <span className="text-xs text-gray-400">
                ({selectedProducts.length} seleccionados)
              </span>
            )}
          </label>
        </div>
      )}

      {/* Products Table/Cards */}
      {displayedLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-slate-400 rounded-full animate-spin mx-auto mb-4" />
          <SectionLoader text="Cargando productos..." />
        </div>
      ) : filteredProducts.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedProducts.length === filteredProducts.length &&
                          filteredProducts.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-slate-500 focus:ring-slate-500 bg-gray-100 dark:bg-gray-700"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProducts.map((product: Product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-100 dark:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-slate-500 focus:ring-slate-500 bg-gray-100 dark:bg-gray-700"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleEditProduct(product)}
                          className="flex items-center gap-0 text-left group"
                          title="Editar producto"
                        >
                          <div className="flex-shrink-0 w-12 h-12">
                            {product.images && product.images.length > 0 ? (
                              <Image
                                src={`https://emprendyup-images.s3.us-east-1.amazonaws.com/${product?.images[0].url}`}
                                alt={product.name}
                                width={32}
                                height={32}
                                className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:ring-2 group-hover:ring-slate-400 transition-all"
                                style={{
                                  border: `2px solid ${primaryColor}40`,
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center group-hover:border-slate-400 transition-colors">
                                <Package className="w-6 h-6 text-gray-500 dark:text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-400 truncate max-w-xs">
                              {product.title}
                            </div>
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          ${product.price.toLocaleString()} {product.currency}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.stock}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                              product.available
                                ? 'bg-green-900 text-green-300'
                                : 'bg-red-900 text-red-300'
                            }`}
                          >
                            {product.available ? 'Disponible' : 'No disponible'}
                          </span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold bg-fourth-base text-gray-900 dark:text-white rounded-full w-fit`}
                          >
                            {product.inStock ? 'En stock' : 'Sin stock'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:bg-gray-700 hover:text-gray-900 dark:text-white rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={
                              product.landing
                                ? () => handleViewLanding(product)
                                : () => handleGenerateLanding(product)
                            }
                            disabled={generatingLanding.has(product.id)}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:bg-gray-700 hover:text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={product.landing ? 'Ver landing' : 'Generar landing'}
                          >
                            {product.landing ? (
                              <Eye className="w-4 h-4" />
                            ) : generatingLanding.has(product.id) ? (
                              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Layout className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDuplicateProduct(product.id)}
                            disabled={duplicating}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:bg-gray-700 hover:text-gray-900 dark:text-white rounded-lg transition-colors"
                            title="Duplicar producto"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={deleting}
                            className="p-2 text-red-400 hover:bg-red-900 hover:text-red-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm"
                style={{
                  borderColor: selectedProducts.includes(product.id) ? primaryColor : '#374151',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex-shrink-0"
                      style={
                        {
                          accentColor: primaryColor,
                          '--tw-ring-color': primaryColor,
                        } as React.CSSProperties
                      }
                    />

                    {/* Image — click to edit */}
                    <button
                      type="button"
                      onClick={() => handleEditProduct(product)}
                      className="flex-shrink-0 focus:outline-none"
                      title="Editar producto"
                    >
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={`https://emprendyup-images.s3.us-east-1.amazonaws.com/${product.images[0].url}`}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-lg object-cover shadow-sm hover:ring-2 hover:ring-slate-400 transition-all"
                          style={{ border: `2px solid ${primaryColor}40` }}
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-lg flex items-center justify-center hover:ring-2 hover:ring-slate-400 transition-all"
                          style={{
                            backgroundColor: `${primaryColor}20`,
                            border: `2px solid ${primaryColor}40`,
                          }}
                        >
                          <Package className="w-8 h-8" style={{ color: primaryColor }} />
                        </div>
                      )}
                    </button>

                    {/* Product Info — title click to edit */}
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleEditProduct(product)}
                        className="text-left w-full"
                        title="Editar producto"
                      >
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-xs text-gray-400 truncate">{product.title}</p>
                      </button>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          ${product.price.toLocaleString()} {product.currency}
                        </span>
                        <span className="text-xs text-gray-400">• Stock: {product.stock}</span>
                      </div>
                      <div className="flex space-x-1 mt-2">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            product.available
                              ? 'bg-green-900 text-green-300'
                              : 'bg-red-900 text-red-300'
                          }`}
                        >
                          {product.available ? 'Disponible' : 'No disponible'}
                        </span>
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-fourth-base text-gray-900 dark:text-white rounded-full">
                          {product.inStock ? 'En stock' : 'Sin stock'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() =>
                        setOpenDropdown(openDropdown === product.id ? null : product.id)
                      }
                      className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>

                    {openDropdown === product.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-100 dark:bg-gray-700"
                          >
                            <Edit className="w-4 h-4 mr-2" style={{ color: primaryColor }} />
                            Editar
                          </button>
                          <button
                            onClick={() => handleGenerateLanding(product)}
                            disabled={generatingLanding.has(product.id)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-100 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {generatingLanding.has(product.id) ? (
                              <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Layout className="w-4 h-4 mr-2" />
                            )}
                            {generatingLanding.has(product.id) ? <Loader /> : 'Generar Landing'}
                          </button>
                          <button
                            onClick={() => handleDuplicateProduct(product.id)}
                            disabled={duplicating}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-100 dark:bg-gray-700"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicar
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={deleting}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Package className="w-8 h-8" style={{ color: primaryColor }} />
          </div>
          <p className="text-gray-900 dark:text-white text-lg font-medium mb-2">
            {searchTerm ? 'No se encontraron productos' : 'No tienes productos todavía'}
          </p>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
            {searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : 'Crea tu primer producto para empezar a vender'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreateProduct}
              className="text-gray-900 dark:text-white px-6 py-3 rounded-lg hover:shadow-md flex items-center mx-auto font-medium transition-all duration-200"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Producto
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {!displayedLoading && displayedTotal > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 sm:px-6 shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-100 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-300 flex items-center">
              Página {currentPage} de {displayedTotalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === displayedTotalPages}
              className="relative inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-100 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>

          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-300">
                Mostrando{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, displayedTotal)}
                </span>{' '}
                de <span className="font-medium">{displayedTotal}</span> productos
              </p>
            </div>

            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-lg shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-lg px-2 py-2 text-gray-500 ring-1 ring-inset ring-gray-600 hover:bg-gray-100 dark:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {(() => {
                  const maxVisiblePages = 3;
                  let startPage = 1;
                  let endPage = displayedTotalPages;

                  if (displayedTotalPages > maxVisiblePages) {
                    // Calcular el rango de páginas a mostrar
                    if (currentPage <= 2) {
                      // Si estamos en las primeras páginas, mostrar 1, 2, 3
                      startPage = 1;
                      endPage = maxVisiblePages;
                    } else if (currentPage >= displayedTotalPages - 1) {
                      // Si estamos en las últimas páginas, mostrar las últimas 3
                      startPage = displayedTotalPages - maxVisiblePages + 1;
                      endPage = displayedTotalPages;
                    } else {
                      // Si estamos en el medio, mostrar página actual y vecinas
                      startPage = currentPage - 1;
                      endPage = currentPage + 1;
                    }
                  }

                  const pages = [];
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold transition-colors ${
                          currentPage === i
                            ? 'z-10 text-gray-900 dark:text-white focus:z-20'
                            : 'text-gray-300 ring-1 ring-inset ring-gray-600 hover:bg-gray-100 dark:bg-gray-700 focus:z-20 focus:outline-offset-0'
                        }`}
                        style={currentPage === i ? { backgroundColor: primaryColor } : {}}
                      >
                        {i}
                      </button>
                    );
                  }

                  return pages;
                })()}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === displayedTotalPages}
                  className="relative inline-flex items-center rounded-r-lg px-2 py-2 text-gray-500 ring-1 ring-inset ring-gray-600 hover:bg-gray-100 dark:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
