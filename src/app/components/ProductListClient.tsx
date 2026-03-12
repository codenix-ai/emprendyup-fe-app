'use client';
import { gql, useQuery } from '@apollo/client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiHeart, FiEye, FiBookmark, FiChevronLeft, FiChevronRight } from '../assets/icons/vander';
import { Product } from '../utils/types';

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

export default function ProductListClient({
  page = 1,
  pageSize = 50,
  gridClass = 'grid grid-cols-1 md:grid-cols-2 gap-6',
}) {
  const [currentPage, setCurrentPage] = useState(page);
  const { data, loading, error } = useQuery(PAGINATED_PRODUCTS_QUERY, {
    variables: { page: currentPage, pageSize },
    // Use pageSize from props or default value
  });

  if (loading) return <div className="text-center py-10">Cargando productos...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error.message}</div>;

  const products = data?.paginatedProducts?.items || [];
  const total = data?.paginatedProducts?.total || 0;
  // const currentPage = data?.paginatedProducts?.page || 1;
  const pageSizeVal = data?.paginatedProducts?.pageSize || pageSize;
  const totalPages = Math.ceil(total / pageSizeVal);

  const handleAddToFavorites = (item: Product) => {
    // Save to localStorage
    try {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      // Avoid duplicates by id
      if (!favorites.some((fav: Product) => fav.id === item.id)) {
        favorites.push(item);
        localStorage.setItem('favorites', JSON.stringify(favorites));
      }
    } catch (e) {
      console.error('Error saving to favorites:', e);
    }
  };

  // Function to get the image URL
  const getImageUrl = (item: Product) => {
    const imageKey = item?.images?.[0]?.url;
    const imageUrl = imageKey
      ? `https://emprendyup-images.s3.us-east-1.amazonaws.com/${imageKey}`
      : '/assets/default-product.jpg';
    return imageUrl;
  };

  return (
    <>
      <div className={gridClass}>
        {products.map((item: Product) => (
          <div className="group relative duration-500 w-full mx-auto" key={item.id}>
            <div className="flex flex-col items-center">
              <div
                className="relative overflow-hidden w-full shadow dark:shadow-gray-800 group-hover:shadow-lg group-hover:dark:shadow-gray-800 rounded-md duration-500"
                style={{ height: '320px' }}
              >
                <Image
                  className="w-full h-full object-cover rounded-md group-hover:scale-110 duration-500"
                  src={getImageUrl(item)}
                  width={320}
                  height={320}
                  alt={item.title || 'Placeholder Image'}
                  loading="lazy"
                />
                <ul className="list-none absolute top-[10px] end-4 opacity-0 group-hover:opacity-100 duration-500 space-y-1">
                  <li>
                    <button
                      className="size-10 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-center rounded-full bg-white text-slate-900 hover:bg-slate-900 hover:text-white shadow"
                      onClick={() => handleAddToFavorites(item)}
                    >
                      <FiHeart className="size-4" />
                    </button>
                  </li>
                  <li className="mt-1 ms-0">
                    <Link
                      href={`/producto/${item.id}`}
                      className="size-10 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-center rounded-full bg-white text-slate-900 hover:bg-slate-900 hover:text-white shadow"
                    >
                      <FiEye className="size-4" />
                    </Link>
                  </li>
                  <li className="mt-1 ms-0">
                    <Link
                      href="#"
                      className="size-10 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-center rounded-full bg-white text-slate-900 hover:bg-slate-900 hover:text-white shadow"
                    >
                      <FiBookmark className="size-4" />
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="w-full mt-4 text-center">
                <Link
                  href={`/producto/${item.id}`}
                  className="hover:text-fourth-base text-lg font-medium block"
                >
                  {item.title}
                </Link>
                <p className="text-slate-400 mt-2">{item.description}</p>
                <p className="mt-2 font-semibold">
                  {item.price} {item.currency}
                </p>
                <div className="mt-4">
                  <Link
                    href="/shop-cart"
                    className="py-2 px-5 inline-block font-semibold tracking-wide align-middle duration-500 text-base text-center bg-slate-900 dark:bg-slate-800 text-white rounded-md shadow dark:shadow-gray-700"
                  >
                    Añadir al carrito
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Pagination outside grid */}
      <div className="grid md:grid-cols-12 grid-cols-1 mt-6">
        <div className="md:col-span-12 text-center">
          <nav aria-label="Page navigation example">
            <ul className="inline-flex items-center -space-x-px">
              <li>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="size-[40px] inline-flex justify-center items-center text-slate-400 bg-white dark:bg-slate-900 rounded-s-3xl hover:text-white border border-gray-100 dark:border-gray-800 hover:border-fourth-base dark:hover:border-fourth-base hover:bg-fourth-base dark:hover:bg-fourth-base"
                >
                  <FiChevronLeft className="size-5 rtl:rotate-180 rtl:-mt-1" />
                </button>
              </li>
              {[...Array(totalPages)].map((_, i) => (
                <li key={i}>
                  <button
                    onClick={() => setCurrentPage(i + 1)}
                    className={`size-[40px] inline-flex justify-center items-center border border-gray-100 dark:border-gray-800 ${currentPage === i + 1 ? 'bg-fourth-base text-white z-10 border-fourth-base' : 'text-slate-400 bg-white dark:bg-slate-900 hover:text-white hover:border-fourth-base hover:bg-fourth-base dark:hover:border-fourth-base dark:hover:bg-fourth-base'}`}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
              <li>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="size-[40px] inline-flex justify-center items-center text-slate-400 bg-white dark:bg-slate-900 rounded-e-3xl hover:text-white border border-gray-100 dark:border-gray-800 hover:border-fourth-base dark:hover:border-fourth-base hover:bg-fourth-base dark:hover:bg-fourth-base"
                >
                  <FiChevronRight className="size-5 rtl:rotate-180 rtl:-mt-1" />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
