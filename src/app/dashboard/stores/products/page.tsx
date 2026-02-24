'use client';

import React, { useState, useMemo } from 'react';
import { gql } from '@apollo/client';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Copy,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  DollarSign,
} from 'lucide-react';
import Image from 'next/image';
import KPICard from '../../components/KPICard';

// Types
interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  comparePrice?: number;
  cost: number;
  category: string;
  subcategory?: string;
  tags: string[];
  images: string[];
  status: 'active' | 'draft' | 'archived';
  inventory: {
    tracked: boolean;
    quantity: number;
    lowStockThreshold: number;
  };
  seo: {
    title: string;
    description: string;
    handle: string;
  };
  createdAt: string;
  updatedAt: string;
  sales: {
    totalSold: number;
    revenue: number;
    averageRating: number;
    reviewCount: number;
  };
}

const categories = [
  'All Categories',
  'Clothing',
  'Accessories',
  'Electronics',
  'Home & Garden',
  'Sports & Fitness',
  'Beauty',
];

// GraphQL queries & mutations
const GET_PRODUCTS_BY_STORE = gql`
  query GetProductsByStore($storeId: String!, $page: Int, $pageSize: Int) {
    productsByStore(storeId: $storeId, page: $page, pageSize: $pageSize) {
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

export default function ProductsPage() {
  // start with an empty list — replace with real data via GraphQL/useQuery when ready
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.status === 'active').length;
    const lowStockProducts = products.filter(
      (p) => p.inventory.tracked && p.inventory.quantity <= p.inventory.lowStockThreshold
    ).length;
    const totalRevenue = products.reduce((sum, p) => sum + p.sales.revenue, 0);
    const averageRating =
      products.length > 0
        ? products.reduce((sum, p) => sum + p.sales.averageRating, 0) / products.length
        : 0;

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalRevenue,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === 'All Categories' || product.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Get stock status
  const getStockStatus = (product: Product) => {
    if (!product.inventory.tracked)
      return { status: 'unlimited', color: 'text-blue-600', icon: CheckCircle };

    const { quantity, lowStockThreshold } = product.inventory;
    if (quantity === 0) return { status: 'out of stock', color: 'text-red-600', icon: XCircle };
    if (quantity <= lowStockThreshold)
      return { status: 'low stock', color: 'text-orange-600', icon: AlertTriangle };
    return { status: 'in stock', color: 'text-green-600', icon: CheckCircle };
  };

  // Handle delete product
  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
  };

  // Handle duplicate product
  const handleDuplicate = (product: Product) => {
    const newProduct: Product = {
      ...product,
      id: `${Date.now()}`,
      name: `${product.name} (Copy)`,
      sku: `${product.sku}-COPY`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sales: {
        totalSold: 0,
        revenue: 0,
        averageRating: 0,
        reviewCount: 0,
      },
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your product catalog and inventory
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Grid
            </button>
          </div>
          <Link
            href="/dashboard/store/products/new"
            className="inline-flex items-center px-4 py-2 bg-fourth-base text-white rounded-lg hover:bg-fourth-base/90 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard
          title="Total Products"
          value={kpis.totalProducts}
          icon={Package}
          description="Products in catalog"
        />
        <KPICard
          title="Active Products"
          value={kpis.activeProducts}
          icon={CheckCircle}
          description="Currently active"
        />
        <KPICard
          title="Low Stock"
          value={kpis.lowStockProducts}
          icon={AlertTriangle}
          description="Need restocking"
        />
        <KPICard
          title="Total Revenue"
          value={`$${kpis.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          description="From all products"
        />
        <KPICard
          title="Avg Rating"
          value={kpis.averageRating}
          icon={Star}
          description="Customer rating"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Products Display */}
      {viewMode === 'list' ? (
        /* List View */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Inventory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sales
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {product.images.length > 0 ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={64}
                                height={64}
                                className="h-full w-full object-cover"
                                unoptimized
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              SKU: {product.sku}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {product.category} / {product.subcategory}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <stockStatus.icon className={`h-4 w-4 ${stockStatus.color}`} />
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {product.inventory.tracked ? product.inventory.quantity : '∞'} units
                            </div>
                            <div className={`text-xs ${stockStatus.color}`}>
                              {stockStatus.status}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            ${product.price}
                          </div>
                          {product.comparePrice && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 line-through">
                              ${product.comparePrice}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Cost: ${product.cost}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {product.sales.totalSold} sold
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ${product.sales.revenue.toLocaleString()}
                          </div>
                          {product.sales.averageRating > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              {product.sales.averageRating} ({product.sales.reviewCount})
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/store/products/${product.id}`}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="Edit product"
                          >
                            <Edit className="h-4 w-4 text-gray-400" />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(product)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="Duplicate product"
                          >
                            <Copy className="h-4 w-4 text-gray-400" />
                          </button>
                          <button
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="View product"
                          >
                            <Eye className="h-4 w-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="Delete product"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product);
            return (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  {product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={600}
                      height={600}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <ImageIcon className="h-16 w-16 text-gray-400" />
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {product.name}
                    </h3>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}
                    >
                      {product.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        ${product.price}
                      </span>
                      {product.comparePrice && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                          ${product.comparePrice}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <stockStatus.icon className={`h-4 w-4 ${stockStatus.color}`} />
                        <span className={`text-xs ${stockStatus.color}`}>
                          {product.inventory.tracked ? product.inventory.quantity : '∞'} units
                        </span>
                      </div>
                      {product.sales.averageRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {product.sales.averageRating}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {product.sales.totalSold} sold • ${product.sales.revenue.toLocaleString()}{' '}
                      revenue
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/store/products/${product.id}`}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Edit product"
                      >
                        <Edit className="h-4 w-4 text-gray-400" />
                      </Link>
                      <button
                        onClick={() => handleDuplicate(product)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Duplicate product"
                      >
                        <Copy className="h-4 w-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Delete product"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      SKU: {product.sku}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No products found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm || categoryFilter !== 'All Categories' || statusFilter !== 'all'
              ? 'Try adjusting your filters to see more products.'
              : 'Get started by adding your first product to the store.'}
          </p>
          {!searchTerm && categoryFilter === 'All Categories' && statusFilter === 'all' && (
            <Link
              href="/dashboard/store/products/new"
              className="inline-flex items-center px-4 py-2 bg-fourth-base text-white rounded-lg hover:bg-fourth-base/90 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
