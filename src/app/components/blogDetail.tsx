'use client';
import Link from 'next/link';
import { social } from '../data/data';
import ScrollToTop from './scroll-to-top';
import Switcher from './switcher';
import Image from 'next/image';

import { FiCalendar, FiClock } from 'react-icons/fi';
import { BlogPost } from '../utils/types/BlogPost';

type BlogDetailClientProps = {
  blogPosts: BlogPost[];
  blogData: any;
  structuredData: any;
};

export default function BlogDetailClient({
  blogPosts,
  blogData,
  structuredData,
}: BlogDetailClientProps) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="relative table w-full items-center py-36 bg-[url('/images/hero/pages.jpg')] bg-top bg-no-repeat bg-cover">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/80 to-slate-900"></div>
        <div className="container relative">
          <div className="grid grid-cols-1 pb-8 text-center mt-10">
            <h3 className="text-4xl leading-normal tracking-wider font-semibold text-white">
              {blogData.title || 'Blog Title Here'}
            </h3>

            <ul className="list-none mt-6">
              <li className="inline-block text-white/50 mx-5">
                {' '}
                <span className="text-white block">Autor :</span>{' '}
                <span className="block">{blogData.author || 'Autor Desconocido'}</span>
              </li>
              <li className="inline-block text-white/50 mx-5">
                {' '}
                <span className="text-white block">Fecha :</span>{' '}
                <span className="block">{blogData.date || 'Fecha Desconocida'}</span>
              </li>
              <li className="inline-block text-white/50 mx-5">
                {' '}
                <span className="text-white block">Hora :</span>{' '}
                <span className="block">{blogData.readTime || '8 Min Read'}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center absolute text-center z-10 bottom-5 start-0 end-0 mx-3 px-16">
          <ul className="tracking-[0.5px] mb-0 inline-block">
            <li className="inline-block uppercase text-[13px] font-bold duration-500 ease-in-out text-white/50 hover:text-white">
              <Link href="/">Emprendy.ai</Link>
            </li>
            <li className="inline-block text-base text-white/50 mx-0.5 ltr:rotate-0 rtl:rotate-180">
              <i className="mdi mdi-chevron-right"></i>
            </li>
            <li className="inline-block uppercase text-[13px] font-bold duration-500 ease-in-out text-white/50 hover:text-white">
              <Link href="/blog">Blog</Link>
            </li>
            <li className="inline-block text-base text-white/50 mx-0.5 ltr:rotate-0 rtl:rotate-180">
              <i className="mdi mdi-chevron-right"></i>
            </li>
            <li
              className="inline-block uppercase text-[13px] font-bold duration-500 ease-in-out text-white max-w-[300px] whitespace-nowrap mt-8"
              aria-current="page"
            >
              {blogData.title}
            </li>
          </ul>
        </div>
      </section>

      <section className="relative md:py-24 py-16">
        <div className="container">
          <div className="grid md:grid-cols-12 grid-cols-1 gap-6">
            <div className="lg:col-span-8 md:col-span-6">
              <div className="relative overflow-hidden rounded-md shadow dark:shadow-gray-800">
                <Image
                  src={blogData.image}
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: '100%', height: 'auto' }}
                  alt={blogData.imageAlt}
                  priority
                />

                <article className="p-6 text-gray-700 dark:text-gray-300">
                  {/* Tags del artículo */}
                  {blogData.tags && blogData.tags.length > 0 && (
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        {blogData.tags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 text-xs font-medium bg-fourth-base/10 text-fourth-base rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className="prose prose-lg max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: blogData.content }}
                  />
                </article>
              </div>

              <div className="p-6 rounded-md shadow dark:shadow-gray-800 mt-8">
                <h5 className="text-lg font-semibold">Deja un Comentario:</h5>

                <form className="mt-8">
                  <div className="grid lg:grid-cols-12 lg:gap-6">
                    <div className="lg:col-span-6 mb-5">
                      <div className="text-left">
                        <label htmlFor="name" className="font-semibold">
                          Tu Nombre:
                        </label>
                        <input
                          name="name"
                          id="name"
                          type="text"
                          className="mt-3 w-full py-2 px-3 h-10 bg-transparent dark:bg-slate-900 dark:text-slate-200 rounded outline-none border border-gray-100 dark:border-gray-800 focus:ring-0"
                          placeholder="Nombre"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-6 mb-5">
                      <div className="text-left">
                        <label htmlFor="email" className="font-semibold">
                          Tu Correo Electrónico:
                        </label>
                        <input
                          name="email"
                          id="email"
                          type="email"
                          className="mt-3 w-full py-2 px-3 h-10 bg-transparent dark:bg-slate-900 dark:text-slate-200 rounded outline-none border border-gray-100 dark:border-gray-800 focus:ring-0"
                          placeholder="Correo Electrónico"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1">
                    <div className="mb-5">
                      <div className="text-left">
                        <label htmlFor="comments" className="font-semibold">
                          Tu Comentario:
                        </label>
                        <textarea
                          name="comments"
                          id="comments"
                          className="mt-3 w-full py-2 px-3 bg-transparent dark:bg-slate-900 dark:text-slate-200 rounded outline-none border border-gray-100 dark:border-gray-800 focus:ring-0 h-28"
                          placeholder="Mensaje"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    id="submit"
                    name="send"
                    className="py-2 px-5 inline-block tracking-wide align-middle duration-500 text-base text-center bg-fourth-base text-black rounded-md w-full"
                  >
                    Enviar Mensaje
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-4 md:col-span-6">
              <div className="sticky top-20">
                <h5 className="text-lg font-medium bg-gray-50 dark:bg-slate-800 shadow dark:shadow-gray-800 rounded-md p-2 text-center">
                  Autor
                </h5>
                <div className="text-center mt-8">
                  <Image
                    src="/images/client/01.jpg"
                    width={80}
                    height={80}
                    className="h-20 w-20 mx-auto rounded-full shadow mb-4"
                    alt={`Foto de ${blogData.author}`}
                  />

                  <Link
                    href=""
                    className="text-lg font-medium hover:text-fourth-base transition-all duration-500 ease-in-out h5"
                  >
                    {blogData.author}
                  </Link>
                  <p className="text-slate-400">Experto en Emprendimiento</p>
                </div>

                <h5 className="text-lg font-medium bg-gray-50 dark:bg-slate-800 shadow dark:shadow-gray-800 rounded-md p-2 text-center mt-8">
                  Redes Sociales
                </h5>
                <ul className="list-none text-center mt-8 space-x-0.5">
                  {social.map((item, index) => {
                    let Icon = item;
                    return (
                      <li className="inline" key={index}>
                        <Link
                          href=""
                          className="size-8 inline-flex items-center justify-center tracking-wide align-middle text-base border border-gray-100 dark:border-gray-800 rounded-md text-slate-400 hover:border-fourth-base hover:text-black hover:bg-fourth-base"
                        >
                          <Icon className="h-4 w-4"></Icon>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="container lg:mt-24 mt-16">
          <div className="grid grid-cols-1 mb-6 text-center">
            <h3 className="font-semibold text-3xl leading-normal">Blogs Relacionados</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-6 pt-6">
            {blogPosts
              .filter((item) => item.id !== blogData.id) // Excluir el post actual
              .slice(0, 3)
              .map((item, index) => {
                return (
                  <div className="group relative overflow-hidden" key={index}>
                    <div className="relative overflow-hidden rounded-md shadow dark:shadow-gray-800">
                      <Image
                        src={item.image}
                        width={0}
                        height={0}
                        sizes="100vw"
                        style={{ width: '100%', height: 'auto' }}
                        className="group-hover:scale-110 duration-500"
                        alt={item.imageAlt || item.title}
                      />
                    </div>

                    <div className="mt-6">
                      <div className="flex mb-4">
                        <span className="flex items-center text-slate-400 text-sm">
                          <FiCalendar className="size-4 text-slate-900 dark:text-white me-1.5"></FiCalendar>
                          {item.date}
                        </span>
                        <span className="flex items-center text-slate-400 text-sm ms-3">
                          <FiClock className="size-4 text-slate-900 dark:text-white me-1.5"></FiClock>
                          {item.readTime || '5 min'} lectura
                        </span>
                      </div>

                      <Link
                        href={`/blog-detalle/${item.id}`}
                        className="title text-lg font-semibold hover:text-fourth-base duration-500 ease-in-out"
                      >
                        {item.title}
                      </Link>
                      <p className="text-slate-400 mt-2">{item.desc}</p>

                      <div className="mt-3">
                        <span className="text-slate-400">
                          por{' '}
                          <Link
                            href=""
                            className="text-slate-900 dark:text-white hover:text-fourth-base dark:hover:text-fourth-base font-medium"
                          >
                            {item.author || 'Emprendy.ai'}
                          </Link>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>
      <Switcher />
      <ScrollToTop />
    </>
  );
}
