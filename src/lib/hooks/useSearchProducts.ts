'use client';
import { useState, useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Product } from '@/app/utils/types/Product';

const SEARCH_PRODUCTS = gql`
  query SearchProducts($keyword: String!, $page: Int, $pageSize: Int) {
    searchProducts(keyword: $keyword, page: $page, pageSize: $pageSize) {
      items {
        id
        name
        title
        description
        price
        currency
        imageUrl
        images {
          url
        }
        inStock
        stock
        available
        storeId
        createdAt
      }
      page
      pageSize
      total
    }
  }
`;

export interface SearchProductsResult {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
}

export const useSearchProducts = (keyword: string, page: number = 1, pageSize: number = 12) => {
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);

  // Debounce keyword to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword]);

  const { data, loading, error, refetch } = useQuery(SEARCH_PRODUCTS, {
    variables: {
      keyword: debouncedKeyword,
      page,
      pageSize,
    },
    skip: !debouncedKeyword || debouncedKeyword.length < 2,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });

  const result: SearchProductsResult = {
    items: data?.searchProducts?.items || [],
    page: data?.searchProducts?.page || page,
    pageSize: data?.searchProducts?.pageSize || pageSize,
    total: data?.searchProducts?.total || 0,
  };

  const totalPages = Math.ceil(result.total / result.pageSize);
  const hasNextPage = result.page < totalPages;
  const hasPrevPage = result.page > 1;

  return {
    products: result.items,
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    loading,
    error,
    refetch,
  };
};
