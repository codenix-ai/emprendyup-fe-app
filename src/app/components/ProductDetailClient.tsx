'use client';
import { gql, useQuery } from '@apollo/client';
import { useSearchParams } from 'next/navigation';
import { SectionLoader } from '@/app/components/Loader';

const GET_PRODUCT_QUERY = gql`
  query GetProduct($id: String!) {
    product(id: $id) {
      id
      title
      description
      price
      currency
      imageUrl
      available
      externalId
      createdAt
      updatedAt
      store {
        id
        name
      }
      categories {
        category {
          id
          name
        }
      }
      cartItems {
        id
        quantity
      }
      colors {
        color
      }
      sizes {
        size
      }
      images {
        url
      }
    }
  }
`;

export default function ProductDetailClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { data, loading, error } = useQuery(GET_PRODUCT_QUERY, { variables: { id } });

  if (loading) return <SectionLoader text="Cargando producto..." />;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error.message}</div>;
  if (!data?.product) return <div className="text-center py-10">Producto no encontrado</div>;

  const product = data.product;

  return (
    <div className="grid md:grid-cols-2 grid-cols-1 gap-6 items-center">
      <div>
        {/* Product images */}
        <img
          src={product.imageUrl || product.images?.[0]?.url || ''}
          alt={product.title}
          className="w-full h-auto rounded-md shadow"
        />
        {/* Additional images */}
        {product.images?.length > 1 && (
          <div className="flex gap-2 mt-2">
            {product.images.slice(1).map((img: { url: string }, idx: number) => (
              <img
                key={idx}
                src={img.url}
                alt={product.title}
                className="w-20 h-20 object-cover rounded"
              />
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2">{product.title}</h2>
        <p className="mb-2 text-slate-500">{product.description}</p>
        <p className="mb-2 font-semibold">
          {product.price} {product.currency}
        </p>
        <p className="mb-2">Disponible: {product.available ? 'Sí' : 'No'}</p>
        <div className="mb-2">
          <span className="font-semibold">Colores:</span>
          {product.colors?.map((c: { color: string }, idx: number) => (
            <span key={idx} className="inline-block ml-2 px-2 py-1 bg-gray-200 rounded">
              {c.color}
            </span>
          ))}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Tallas:</span>
          {product.sizes?.map((s: { size: string }, idx: number) => (
            <span key={idx} className="inline-block ml-2 px-2 py-1 bg-gray-200 rounded">
              {s.size}
            </span>
          ))}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Categorías:</span>
          {product.categories?.map((cat: { category: { name: string } }, idx: number) => (
            <span key={idx} className="inline-block ml-2 px-2 py-1 bg-gray-200 rounded">
              {cat.category.name}
            </span>
          ))}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Tienda:</span> {product.store?.name}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Creado:</span>{' '}
          {new Date(product.createdAt).toLocaleDateString()}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Actualizado:</span>{' '}
          {new Date(product.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
