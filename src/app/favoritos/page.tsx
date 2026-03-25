import React from 'react';
import FavoritesGridClient from '../components/FavoritesGridClient';
import Link from 'next/link';
import Navbar from '../components/NavBar/navbar';
import Footer from '../components/footer';
import Switcher from '../components/switcher';
import ScrollToTop from '../components/scroll-to-top';

export default function FavoritosPage() {
  return (
    <>
      <section className="relative table w-full py-20 lg:py-24 md:pt-28 bg-gray-50 dark:bg-slate-800">
        <div className="container relative">
          <div className="grid grid-cols-1 mt-14">
            <h3 className="text-3xl leading-normal font-semibold">Carrito de Compras</h3>
          </div>

          <div className="relative mt-3">
            <ul className="tracking-[0.5px] mb-0 inline-block">
              <li className="inline-block uppercase text-[13px] font-bold duration-500 ease-in-out hover:text-fourth-base">
                <Link href="/">Emprendy.ai</Link>
              </li>
              <li className="inline-block text-base text-slate-950 dark:text-white mx-0.5 ltr:rotate-0 rtl:rotate-180">
                <i className="mdi mdi-chevron-right"></i>
              </li>
              <li
                className="inline-block uppercase text-[13px] font-bold text-fourth-base"
                aria-current="page"
              >
                Favoritos
              </li>
            </ul>
          </div>
        </div>
      </section>
      <div className="container mx-auto py-16">
        <FavoritesGridClient />
      </div>
      <Switcher />
      <ScrollToTop />
    </>
  );
}
