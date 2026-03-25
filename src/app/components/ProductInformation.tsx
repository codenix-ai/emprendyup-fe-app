'use client';

import { gql, useQuery } from '@apollo/client';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import { FiMail, FiMessageCircle, FiUser } from 'react-icons/fi';
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
      createdAt
      updatedAt
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
  }
`;
export default function ProductInformation() {
  const [activeTab, setActiveTab] = useState(1);
  const params = useParams();
  const id = params?.slug;
  const { data, loading, error } = useQuery(GET_PRODUCT_QUERY, { variables: { id } });
  if (loading) return <SectionLoader text="Cargando..." />;
  if (error) return <div>Error: {error.message}</div>;
  const product = data?.product;
  return (
    <div className="grid md:grid-cols-12 grid-cols-1 mt-6 gap-6">
      {/* Pestañas */}
      <div className="lg:col-span-3 md:col-span-5">
        <div className="sticky top-20">
          <ul
            className="flex-column p-6 bg-white dark:bg-slate-900 shadow dark:shadow-gray-800 rounded-md"
            id="myTab"
            data-tabs-toggle="#myTabContent"
            role="tablist"
          >
            <li className="ms-0">
              <button
                className={`px-4 py-2 text-start text-base font-semibold rounded-md w-full hover:text-fourth-base duration-500 ${
                  activeTab === 1 ? 'text-white bg-fourth-base hover:text-white' : ''
                }`}
                onClick={() => setActiveTab(1)}
              >
                Descripción
              </button>
            </li>
            <li className="ms-0">
              <button
                className={`px-4 py-2 text-start text-base font-semibold rounded-md w-full hover:text-fourth-base duration-500 ${
                  activeTab === 2 ? 'text-white bg-fourth-base hover:text-white' : ''
                }`}
                onClick={() => setActiveTab(2)}
              >
                Información Adicional
              </button>
            </li>
            <li className="ms-0">
              <button
                className={`px-4 py-2 text-start text-base font-semibold rounded-md w-full hover:text-fourth-base duration-500 ${
                  activeTab === 3 ? 'text-white bg-fourth-base hover:text-white' : ''
                }`}
                onClick={() => setActiveTab(3)}
              >
                Reseñas
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Contenido de las pestañas */}
      <div className="lg:col-span-9 md:col-span-7">
        <div
          id="myTabContent"
          className="p-6 bg-white dark:bg-slate-900 shadow dark:shadow-gray-800 rounded-md"
        >
          {activeTab === 1 && (
            <div>
              <p className="text-slate-400">
                {product.description || 'No hay descripción disponible.'}
              </p>
            </div>
          )}
          {activeTab === 2 && (
            <div>
              <table className="w-full text-start">
                <tbody>
                  <tr className="bg-white dark:bg-slate-900">
                    <td className="font-semibold pb-4" style={{ width: '100px' }}>
                      Precio
                    </td>
                    <td className="text-slate-400 pb-4">
                      {product.price} {product.currency}
                    </td>
                  </tr>
                  <tr className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-gray-700">
                    <td className="font-semibold py-4">Disponibilidad </td>
                    <td className="text-slate-400 py-4">{product.available ? ' Sí' : ' No'}</td>
                  </tr>
                  <tr className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-gray-700">
                    <td className="font-semibold pt-4">Tallas</td>
                    <td className="text-slate-400 pt-4">
                      {product.sizes?.map((size: { size: string }) => size.size).join(', ') ||
                        'N/A'}
                    </td>
                  </tr>
                  <tr className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-gray-700">
                    <td className="font-semibold pt-4">Colores</td>
                    <td className="text-slate-400 pt-4">
                      {product.colors?.map((color: { color: string }) => color.color).join(', ') ||
                        'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 3 && (
            <div>
              <h5 className="text-lg font-semibold">Comentarios:</h5>
              {product.comments.length > 0 ? (
                product.comments.map(
                  (comment: { id: string; rating: number; comment: string; createdAt: string }) => (
                    <div key={comment.id} className="mt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <ul className="flex text-orange-400">
                            {Array.from({ length: comment.rating }).map((_, idx) => (
                              <li key={idx}>
                                <i className="mdi mdi-star text-lg"></i>
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-slate-400">
                            Fecha: {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-slate-400 italic mt-2">{comment.comment}</p>
                    </div>
                  )
                )
              ) : (
                <p className="text-slate-400">No hay comentarios disponibles.</p>
              )}

              {/* Formulario para agregar un comentario */}
              <div className="p-6 rounded-md shadow dark:shadow-gray-800 mt-8">
                <h5 className="text-lg font-semibold">Deja un comentario:</h5>
                <form className="mt-8">
                  <div className="grid lg:grid-cols-12 lg:gap-6">
                    <div className="lg:col-span-6 mb-5">
                      <label htmlFor="name" className="font-semibold">
                        Nombre:
                      </label>
                      <div className="relative mt-2">
                        <FiUser className="absolute top-3 left-4 text-gray-400" />
                        <input
                          name="name"
                          id="name"
                          type="text"
                          className="pl-10 w-full py-2 px-3 h-10 bg-transparent dark:bg-slate-900 dark:text-slate-200 rounded border border-gray-100 dark:border-gray-800 focus:ring-0"
                          placeholder="Nombre"
                        />
                      </div>
                    </div>
                    <div className="lg:col-span-6 mb-5">
                      <label htmlFor="email" className="font-semibold">
                        Correo Electrónico:
                      </label>
                      <div className="relative mt-2">
                        <FiMail className="absolute top-3 left-4 text-gray-400" />
                        <input
                          name="email"
                          id="email"
                          type="email"
                          className="pl-10 w-full py-2 px-3 h-10 bg-transparent dark:bg-slate-900 dark:text-slate-200 rounded border border-gray-100 dark:border-gray-800 focus:ring-0"
                          placeholder="nombre@gmail.com"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-5">
                    <label htmlFor="comments" className="font-semibold">
                      Tu Comentario:
                    </label>
                    <div className="relative mt-2">
                      <FiMessageCircle className="absolute top-3 left-4 text-gray-400" />
                      <textarea
                        name="comments"
                        id="comments"
                        className="pl-10 w-full py-2 px-3 h-28 bg-transparent dark:bg-slate-900 dark:text-slate-200 rounded border border-gray-100 dark:border-gray-800 focus:ring-0"
                        placeholder="Escribe tu mensaje aquí..."
                      ></textarea>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-fourth-base text-black rounded-md w-full font-semibold"
                  >
                    Enviar Comentario
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
