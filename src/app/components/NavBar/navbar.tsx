'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import {
  FiSearch,
  FiShoppingCart,
  FiHeart,
  FiDollarSign,
  FiUser,
  FiHelpCircle,
  FiSettings,
  FiLogOut,
} from '../../assets/icons/vander';

type NavbarProps = {
  navClass?: string;
  navlight: boolean;
};

export default function Navbar({ navClass, navlight }: NavbarProps) {
  const [scrolling, setScrolling] = useState<boolean>(false);
  const [isToggle, setToggle] = useState<boolean>(false);
  const [menu, setmenu] = useState<string>('');
  const [submenu, setSubmenu] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [cartmenu, setCartmenu] = useState<boolean>(false);
  const [usermenu, setUsermenu] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLLIElement | null>(null);
  const cartRef = useRef<HTMLLIElement | null>(null);
  const userRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleScroll = () => {
        const isScrolling = window.scrollY > 50;
        setScrolling(isScrolling);
      };
      const handleOutsideClick = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      const cartOutsideClick = (event: MouseEvent) => {
        if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
          setCartmenu(false);
        }
      };
      const userOutsideClick = (e: MouseEvent) => {
        if (userRef.current && !userRef.current.contains(e.target as Node)) {
          setUsermenu(false);
        }
      };
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('click', handleOutsideClick);
      window.addEventListener('click', cartOutsideClick);
      window.addEventListener('click', userOutsideClick);

      let current = window.location.pathname;
      setmenu(current);
      setSubmenu(current);
      window.scrollTo(0, 0);

      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('click', handleOutsideClick);
        window.removeEventListener('click', cartOutsideClick);
        window.removeEventListener('click', userOutsideClick);
      };
    }
  }, []);

  const toggleMenu = () => {
    setToggle(!isToggle);
  };

  return (
    <nav id="topnav" className={`${navClass}  nav-sticky`}>
      <div className="container relative flex items-center justify-between gap-4 flex-">
        <Link className="logo flex items-center" href="/">
          <Image
            src="/images/logo.svg"
            width={48}
            height={48}
            className="h-12 w-12 min-w-[48px] min-h-[48px] object-contain"
            alt="Emprendy.ai Logo"
            priority
          />
        </Link>
        <div className="flex items-center gap-4">
          <div id="navigation" style={{ display: isToggle === true ? 'block' : 'none' }}>
            <ul className={`navigation-menu ${navlight === true ? 'nav-light' : ''}`}>
              <li
                className={`has-submenu parent-menu-item ${['/', '/index-fashion-two', '/index-fashion-three', '/index-fashion-four', '/index-item'].includes(menu) ? 'active' : ''}`}
              >
                <Link
                  href="#"
                  onClick={() => setSubmenu(menu === '/index-item' ? '' : '/index-item')}
                >
                  Inicio
                </Link>
                <span className="menu-arrow"></span>
                <ul
                  className={`submenu ${['/', '/index-fashion-two', '/index-fashion-three', '/index-fashion-four', '/index-item'].includes(submenu) ? 'open' : ''}`}
                >
                  <li className={`ms-0 ${menu === '/' ? 'active' : ''}`}>
                    <Link href="/" className="sub-menu-item">
                      Moda Uno
                    </Link>
                  </li>
                  <li className={`ms-0 ${menu === '/index-fashion-two' ? 'active' : ''}`}>
                    <Link href="/index-fashion-two" className="sub-menu-item">
                      Moda Dos
                    </Link>
                  </li>
                  <li className={`ms-0 ${menu === '/index-fashion-three' ? 'active' : ''}`}>
                    <Link href="/index-fashion-three" className="sub-menu-item">
                      Moda Tres
                    </Link>
                  </li>
                  <li className={`ms-0 ${menu === '/index-fashion-four' ? 'active' : ''}`}>
                    <Link href="/index-fashion-four" className="sub-menu-item">
                      Moda Cuatro
                    </Link>
                  </li>
                </ul>
              </li>

              <li
                className={`has-submenu parent-parent-menu-item ${['/product-item'].includes(menu) ? 'active' : ''}`}
              >
                <Link
                  href="#"
                  onClick={() => setSubmenu(menu === '/product-item' ? '' : '/product-item')}
                >
                  Productos
                </Link>
                <span className="menu-arrow"></span>

                <ul
                  className={`submenu megamenu ${['/product-item'].includes(submenu) ? 'open' : ''}`}
                >
                  <li className="ms-0">
                    <ul>
                      <li className="megamenu-head ms-0">Product Features</li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Bundle - Upsell
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Hot Stock
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Sticky Añadir al carrito
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Notify Me (Out Of Stock)
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Ask An Expert
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Variant Image Grouped
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Wishlist
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Trust Badge
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Delivery Information
                        </Link>
                      </li>
                    </ul>
                  </li>

                  <li className="ms-0">
                    <ul>
                      <li className="megamenu-head ms-0">Product Features</li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Sold In Last
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Color Comparison
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Product Swatches
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Product Select Options
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Pre-Order
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Product 3D, AR Models
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Terms And Conditions Checkbox
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Variant Metafield Description
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Variant Metafield Property
                        </Link>
                      </li>
                    </ul>
                  </li>

                  <li className="ms-0">
                    <ul>
                      <li className="megamenu-head ms-0">Product Features</li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Product Video
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Size Chart
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Dynamic Checkout
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Product Countdown
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Custom Content
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Custom Options
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Product Combo
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Product Complementary
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Auto Discount
                        </Link>
                      </li>
                    </ul>
                  </li>

                  <li className="ms-0">
                    <ul>
                      <li className="megamenu-head ms-0">Product Features</li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Custom Product Tabs
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Vertical Product Tab
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Horizontal Product Tab
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Social Share
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Related Products
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Recently Viewed Products
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Custom Label
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="#!" className="sub-menu-item">
                          Local Pick Up
                        </Link>
                      </li>
                    </ul>
                  </li>

                  <li className="ms-0">
                    <ul>
                      <li className="megamenu-head">
                        <Image
                          src="/images/cta.png"
                          width={0}
                          height={0}
                          sizes="100vw"
                          style={{ width: '100%', height: 'auto' }}
                          alt=""
                        />
                      </li>

                      <li className="text-center">
                        <Link
                          href="#!"
                          className="py-2 px-5 inline-block font-medium tracking-wide align-middle duration-500 text-base text-center bg-fourth-base/10 text-fourth-baserounded-md me-2 mt-2"
                        >
                          <i className="mdi mdi-cart-outline"></i> Shop Now
                        </Link>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>

              <li
                className={`has-submenu parent-parent-menu-item ${['/tienda-cuadricula', '/tienda-cuadricula-sidebar-izquierdo', '/tienda-cuadricula-sidebar-derecho', '/tienda-lista', '/tienda-lista-sidebar-izquierdo', '/tienda-lista-sidebar-derecho', '/product-detail-one', '/product-detail-two', '/product-detail-three', '/shop-cart', '/shop-checkout', '/our-store', '/brands', '/compare-product', '/recently-viewed-product', '/shop-item', '/list-item', '/detail-item', '/grid-item'].includes(menu) ? 'active' : ''}`}
              >
                <Link
                  href="#"
                  onClick={() => setSubmenu(submenu === '/shop-item' ? '' : '/shop-item')}
                >
                  {' '}
                  Tienda{' '}
                </Link>
                <span className="menu-arrow"></span>
                <ul
                  className={`submenu ${['/tienda-cuadricula', '/tienda-cuadricula-sidebar-izquierdo', '/tienda-cuadricula-sidebar-derecho', '/tienda-lista', '/tienda-lista-sidebar-izquierdo', '/tienda-lista-sidebar-derecho', '/product-detail-one', '/product-detail-two', '/product-detail-three', '/shop-cart', '/shop-checkout', '/our-store', '/brands', '/compare-product', '/recently-viewed-product', '/shop-item', '/list-item', '/detail-item', '/grid-item'].includes(submenu) ? 'open' : ''}`}
                >
                  <li
                    className={`has-submenu parent-menu-item ms-0 ${['/tienda-cuadricula', '/tienda-cuadricula-sidebar-izquierdo', '/tienda-cuadricula-sidebar-derecho', '/grid-item'].includes(menu) ? 'active' : ''}`}
                  >
                    <Link
                      href="#"
                      onClick={() => setSubmenu(menu === '/grid-item' ? '' : '/grid-item')}
                    >
                      {' '}
                      Cuadrícula de Tienda{' '}
                    </Link>
                    <span className="submenu-arrow"></span>
                    <ul
                      className={`submenu ${['/tienda-cuadricula', '/tienda-cuadricula-sidebar-izquierdo', '/tienda-cuadricula-sidebar-derecho', '/grid-item'].includes(submenu) ? 'open' : ''}`}
                    >
                      <li className={`ms-0 ${menu === '/tienda-cuadricula' ? 'active' : ''}`}>
                        <Link href="/tienda-cuadricula" className="sub-menu-item">
                          Cuadrícula de Tienda
                        </Link>
                      </li>
                      {/* <li className={`ms-0 ${menu === '/tienda-cuadricula-sidebar-izquierdo' ? 'active' : ''}`}>
                        <Link href="/shop-grid-left-sidebar" className="sub-menu-item">
                          Cuadrícula Izquierda
                        </Link>
                      </li>
                      <li className={`ms-0 ${menu === '/tienda-cuadricula-sidebar-derecho' ? 'active' : ''}`}>
                        <Link href="/shop-grid-right-sidebar" className="sub-menu-item">
                          Cuadrícula Derecha
                        </Link>
                      </li> */}
                    </ul>
                  </li>

                  <li
                    className={`has-submenu parent-menu-item ms-0 ${['/tienda-lista', '/tienda-lista-sidebar-izquierdo', '/tienda-lista-sidebar-derecho', '/list-item'].includes(menu) ? 'active' : ''}`}
                  >
                    <Link
                      href="#"
                      onClick={() => setSubmenu(menu === '/list-item' ? '' : '/list-item')}
                    >
                      {' '}
                      Lista de Tienda{' '}
                    </Link>
                    <span className="submenu-arrow"></span>
                    <ul
                      className={`submenu ${['/tienda-lista', '/tienda-lista-sidebar-izquierdo', '/tienda-lista-sidebar-derecho', '/list-item'].includes(submenu) ? 'open' : ''}`}
                    >
                      <li className={`ms-0 ${menu === '/tienda-lista' ? 'active' : ''}`}>
                        <Link href="/tienda-lista" className="sub-menu-item">
                          Lista de Tienda
                        </Link>
                      </li>
                      <li
                        className={`ms-0 ${menu === '/tienda-lista-sidebar-izquierdo' ? 'active' : ''}`}
                      >
                        <Link href="/tienda-lista-sidebar-izquierdo" className="sub-menu-item">
                          Productos
                        </Link>
                      </li>
                      {/* <li className={`ms-0 ${menu === '/tienda-lista-sidebar-derecho' ? 'active' : ''}`}>
                        <Link href="/tienda-lista-sidebar-derecho" className="sub-menu-item">
                          Lista Derecha
                        </Link>
                      </li> */}
                    </ul>
                  </li>

                  {/* <li
                    className={`has-submenu parent-menu-item ms-0 ${['/product-detail-one', '/product-detail-two', '/product-detail-three', '/detail-item'].includes(menu) ? 'active' : ''}`}
                  >
                    <Link href="#" onClick={() => setSubmenu(menu === '/detail-item' ? '' : '/detail-item')}>
                      {' '}
                      Detalle de Tienda{' '}
                    </Link>
                    <span className="submenu-arrow"></span>
                    <ul
                      className={`submenu ${['/product-detail-one', '/product-detail-two', '/product-detail-three', '/detail-item'].includes(submenu) ? 'open' : ''}`}
                    >
                      <li className={`ms-0 ${menu === '/product-detail-one' ? 'active' : ''}`}>
                        <Link href="/product-detail-one" className="sub-menu-item">
                          Detalle Producto Uno
                        </Link>
                      </li>
                      <li className={`ms-0 ${menu === '/product-detail-two' ? 'active' : ''}`}>
                        <Link href="/product-detail-two" className="sub-menu-item">
                          Detalle Producto Dos
                        </Link>
                      </li>
                      <li className={`ms-0 ${menu === '/product-detail-three' ? 'active' : ''}`}>
                        <Link href="/product-detail-three" className="sub-menu-item">
                          Detalle Producto Tres
                        </Link>
                      </li>
                    </ul>
                  </li> */}
                  {/* <li className={`ms-0 ${menu === '/shop-cart' ? 'active' : ''}`}>
                    <Link href="/shop-cart" className="sub-menu-item">
                      Carrito
                    </Link>
                  </li>
                  <li className={`ms-0 ${menu === '/shop-checkout' ? 'active' : ''}`}>
                    <Link href="/shop-checkout" className="sub-menu-item">
                      Pagar
                    </Link>
                  </li>
                  <li className={`ms-0 ${menu === '/our-store' ? 'active' : ''}`}>
                    <Link href="/our-store" className="sub-menu-item">
                      Nuestra Tienda
                    </Link>
                  </li>
                  <li className={`ms-0 ${menu === '/brands' ? 'active' : ''}`}>
                    <Link href="/brands" className="sub-menu-item">
                      Marcas
                    </Link>
                  </li>
                  <li className={`ms-0 ${menu === '/compare-product' ? 'active' : ''}`}>
                    <Link href="/compare-product" className="sub-menu-item">
                      Comparar Producto
                    </Link>
                  </li>
                  <li className={`ms-0 ${menu === '/recently-viewed-product' ? 'active' : ''}`}>
                    <Link href="/recently-viewed-product" className="sub-menu-item">
                      Vistos Recientemente
                    </Link>
                  </li> */}
                </ul>
              </li>

              {/* <li
                className={`has-submenu parent-parent-menu-item ${['/aboutus', '/user-account', '/user-billing', '/user-payment', '/user-invoice', '/user-social', '/user-notification', '/user-setting', '/page-item', '/user-item', '/email-item', '/email-confirmation', '/email-cart', '/email-offers', '/email-order-success', '/email-gift-voucher', '/email-reset-password', '/email-item-review', '/blog-item', '/blogs', '/blog-detail', '/help-item', '/helpcenter', '/helpcenter-faqs', '/helpcenter-guides', '/helpcenter-support', '/auth-item', '/login', '/signup', '/forgot-password', '/lock-screen', '/utility-item', '/terms', '/privacy', '/comingsoon', '/maintenance', '/error', '/special-item', '/multi-item', '/multi-item2', '/multi-item3', '/career'].includes(menu) ? 'active' : ''}`}
              >
                <Link
                  href="#"
                  onClick={() => setSubmenu(menu === '/page-item' ? '' : '/page-item')}
                >
                  Paginas
                </Link>
                <span className="menu-arrow"></span>
                <ul
                  className={`submenu ${['/aboutus', '/user-account', '/user-billing', '/user-payment', '/user-invoice', '/user-social', '/user-notification', '/user-setting', '/page-item', '/user-item', '/email-item', '/email-confirmation', '/email-cart', '/email-offers', '/email-order-success', '/email-gift-voucher', '/email-reset-password', '/email-item-review', '/blog-item', '/blogs', '/blog-detail', '/help-item', '/helpcenter', '/helpcenter-faqs', '/helpcenter-guides', '/helpcenter-support', '/auth-item', '/login', '/signup', '/forgot-password', '/lock-screen', '/utility-item', '/terms', '/privacy', '/comingsoon', '/maintenance', '/error', '/special-item', '/multi-item', '/multi-item2', '/multi-item3', '/career'].includes(submenu) ? 'open' : ''}`}
                >
                  <li className={`ms-0 ${menu === '/aboutus' ? 'active' : ''}`}>
                    <Link href="/aboutus" className="sub-menu-item">
                      About Us
                    </Link>
                  </li>

                  <li
                    className={`has-submenu parent-menu-item ms-0 ${['/user-account', '/user-billing', '/user-payment', '/user-invoice', '/user-social', '/user-notification', '/user-setting', '/user-item'].includes(menu) ? 'active' : ''}`}
                  >
                    <Link
                      href="#"
                      onClick={() => setSubmenu(menu === '/user-item' ? '' : '/user-item')}
                    >
                      {' '}
                      My Account
                    </Link>
                    <span className="submenu-arrow"></span>
                    <ul
                      className={`submenu ${['/user-account', '/user-billing', '/user-payment', '/user-invoice', '/user-social', '/user-notification', '/user-setting', '/user-item'].includes(submenu) ? 'open' : ''}`}
                    >
                      <li className={`ms-0 ${menu === '/user-account' ? 'active' : ''}`}>
                        <Link href="/user-account" className="sub-menu-item">
                          User Account
                        </Link>
                      </li>
                      <li className={`ms-0 ${menu === '/user-billing' ? 'active' : ''}`}>
                        <Link href="/user-billing" className="sub-menu-item">
                          Billing
                        </Link>
                      </li>
                      <li className={`ms-0 ${menu === '/user-payment' ? 'active' : ''}`}>
                        <Link href="/user-payment" className="sub-menu-item">
                          Payment
                        </Link>
                      </li>
                      <li className={`ms-0 ${menu === '/user-invoice' ? 'active' : ''}`}>
                        <Link href="/user-invoice" className="sub-menu-item">
                          Invoice
                        </Link>
                      </li>
                      <li className={`ms-0 ${menu === '/user-social' ? 'active' : ''}`}>
                        <Link href="/user-social" className="sub-menu-item">
                          Social
                        </Link>
                      </li>
                      <li className={`ms-0 ${menu === '/user-notification' ? 'active' : ''}`}>
                        <Link href="/user-notification" className="sub-menu-item">
                          Notification
                        </Link>
                      </li>
                      <li className={`ms-0 ${menu === '/user-setting' ? 'active' : ''}`}>
                        <Link href="/user-setting" className="sub-menu-item">
                          Setting
                        </Link>
                      </li>
                    </ul>
                  </li>

                  <li
                    className={`has-submenu parent-menu-item ms-0 ${['/email-confirmation', '/email-cart', '/email-offers', '/email-order-success', '/email-gift-voucher', '/email-reset-password', '/email-item-review', '/email-item'].includes(menu) ? 'active' : ''}`}
                  >
                    <Link
                      href="#"
                      onClick={() => setSubmenu(menu === '/email-item' ? '' : '/email-item')}
                    >
                      {' '}
                      Email Template{' '}
                    </Link>
                    <span className="submenu-arrow"></span>
                    <ul
                      className={`submenu ${['/email-confirmation', '/email-cart', '/email-offers', '/email-order-success', '/email-gift-voucher', '/email-reset-password', '/email-item-review', '/email-item'].includes(submenu) ? 'open' : ''}`}
                    >
                      <li className="ms-0">
                        <Link href="/email-confirmation" className="sub-menu-item">
                          {' '}
                          Confirmation
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="/email-cart" className="sub-menu-item">
                          {' '}
                          Cart
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="/email-offers" className="sub-menu-item">
                          {' '}
                          Offers
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="/email-order-success" className="sub-menu-item">
                          {' '}
                          Order Success
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="/email-gift-voucher" className="sub-menu-item">
                          {' '}
                          Gift Voucher
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="/email-reset-password" className="sub-menu-item">
                          {' '}
                          Reset Password
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="/email-item-review" className="sub-menu-item">
                          {' '}
                          Item Review
                        </Link>
                      </li>
                    </ul>
                  </li>

                  <li
                    className={`has-submenu parent-menu-item ms-0 ${['/blogs', '/blog-detail', '/blog-item'].includes(menu) ? 'active' : ''}`}
                  >
                    <Link
                      href="#"
                      onClick={() => setSubmenu(menu === '/blog-item' ? '' : '/blog-item')}
                    >
                      {' '}
                      Blog{' '}
                    </Link>
                    <span className="submenu-arrow"></span>
                    <ul
                      className={`submenu ${['/blogs', '/blog-detail', '/blog-item'].includes(submenu) ? 'open' : ''}`}
                    >
                      <li className={`ms-0 ${menu === '/blogs' ? 'active' : ''}`}>
                        <Link href="/blogs" className="sub-menu-item">
                          {' '}
                          Blogs
                        </Link>
                      </li>
                      <li className={`ms-0 ${menu === '/blog-detail' ? 'active' : ''}`}>
                        <Link href="/blog-detail" className="sub-menu-item">
                          {' '}
                          Blog Detail
                        </Link>
                      </li>
                    </ul>
                  </li>

                  <li className={`ms-0 ${menu === '/career' ? 'active' : ''}`}>
                    <Link href="/career" className="sub-menu-item">
                      Career{' '}
                    </Link>
                  </li>

                  <li
                    className={`has-submenu parent-menu-item ms-0 ${['/helpcenter', '/helpcenter-faqs', '/helpcenter-guides', '/helpcenter-support', '/help-item'].includes(menu) ? 'active' : ''}`}
                  >
                    <Link
                      href="#"
                      onClick={() => setSubmenu(menu === '/help-item' ? '' : '/help-item')}
                    >
                      {' '}
                      Helpcenter{' '}
                    </Link>
                    <span className="submenu-arrow"></span>
                    <ul
                      className={`submenu ${['/helpcenter', '/helpcenter-faqs', '/helpcenter-guides', '/helpcenter-support', '/help-item'].includes(submenu) ? 'open' : ''}`}
                    >
                      <li className={`ms-0 ${menu === '/helpcenter' ? 'active' : ''}`}>
                        <Link href="/helpcenter" className="sub-menu-item">
                          Overview
                        </Link>
                      </li>
                      <li className={`ms-0 ${menu === '/helpcenter-faqs' ? 'active' : ''}`}>
                        <Link href="/helpcenter-faqs" className="sub-menu-item">
                          FAQs
                        </Link>
                      </li>
                      <li className={`ms-0 ${menu === '/helpcenter-guides' ? 'active' : ''}`}>
                        <Link href="/helpcenter-guides" className="sub-menu-item">
                          Guides
                        </Link>
                      </li>
                      <li className={`ms-0 ${menu === '/helpcenter-support' ? 'active' : ''}`}>
                        <Link href="/helpcenter-support" className="sub-menu-item">
                          Support
                        </Link>
                      </li>
                    </ul>
                  </li>

                  <li
                    className={`has-submenu parent-menu-item ms-0 ${['/login', '/signup', '/forgot-password', '/lock-screen', '/auth-item'].includes(menu) ? 'active' : ''}`}
                  >
                    <Link
                      href="#"
                      onClick={() => setSubmenu(menu === '/auth-item' ? '' : '/auth-item')}
                    >
                      {' '}
                      Auth Pages{' '}
                    </Link>
                    <span className="submenu-arrow"></span>
                    <ul
                      className={`submenu ${['/login', '/signup', '/forgot-password', '/lock-screen', '/auth-item'].includes(submenu) ? 'open' : ''}`}
                    >
                      <li className="ms-0">
                        <Link href="/login" className="sub-menu-item">
                          {' '}
                          Login
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="/signup" className="sub-menu-item">
                          {' '}
                          Signup
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="/forgot-password" className="sub-menu-item">
                          {' '}
                          Forgot Password
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="/lock-screen" className="sub-menu-item">
                          {' '}
                          Lock Screen
                        </Link>
                      </li>
                    </ul>
                  </li>

                  <li
                    className={`has-submenu parent-menu-item ms-0 ${['/terms', '/privacy', '/utility-item'].includes(menu) ? 'active' : ''}`}
                  >
                    <Link
                      href="#"
                      onClick={() => setSubmenu(menu === '/utility-item' ? '' : '/utility-item')}
                    >
                      {' '}
                      Utility{' '}
                    </Link>
                    <span className="submenu-arrow"></span>
                    <ul
                      className={`submenu ${['/terms', '/privacy', '/utility-item'].includes(submenu) ? 'open' : ''}`}
                    >
                      <li className={`ms-0 ${menu === '/terms' ? 'active' : ''}`}>
                        <Link href="/terms" className="sub-menu-item">
                          Terms of Services
                        </Link>
                      </li>
                      <li className={`ms-0 ${menu === '/privacy' ? 'active' : ''}`}>
                        <Link href="/privacy" className="sub-menu-item">
                          Privacy Policy
                        </Link>
                      </li>
                    </ul>
                  </li>

                  <li
                    className={`has-submenu parent-menu-item ms-0 ${['/comingsoon', '/maintenance', '/error', '/special-item'].includes(menu) ? 'active' : ''}`}
                  >
                    <Link
                      href="#"
                      onClick={() => setSubmenu(menu === '/special-item' ? '' : '/special-item')}
                    >
                      {' '}
                      Special{' '}
                    </Link>
                    <span className="submenu-arrow"></span>
                    <ul
                      className={`submenu ${['/comingsoon', '/maintenance', '/error', '/special-item'].includes(submenu) ? 'open' : ''}`}
                    >
                      <li className="ms-0">
                        <Link href="/comingsoon" className="sub-menu-item">
                          {' '}
                          Coming Soon
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="/maintenance" className="sub-menu-item">
                          {' '}
                          Maintenance
                        </Link>
                      </li>
                      <li className="ms-0">
                        <Link href="/error" className="sub-menu-item">
                          {' '}
                          404!
                        </Link>
                      </li>
                    </ul>
                  </li>

                  <li
                    className={`has-submenu parent-menu-item ms-0 ${['/multi-item', '/multi-item2', '/multi-item3'].includes(menu) ? 'active' : ''}`}
                  >
                    <Link
                      href="#"
                      onClick={() => setSubmenu(menu === '/multi-item' ? '' : '/multi-item')}
                    >
                      {' '}
                      Multi Level Menu
                    </Link>
                    <span className="submenu-arrow"></span>
                    <ul
                      className={`submenu ${['/multi-item', '/multi-item2', '/multi-item3'].includes(submenu) ? 'open' : ''}`}
                    >
                      <li className="ms-0">
                        <Link
                          href="#"
                          onClick={() => setSubmenu(menu === '/multi-item2' ? '' : '/multi-item2')}
                          className="sub-menu-item"
                        >
                          Level 1.0
                        </Link>
                      </li>
                      <li
                        className={`has-submenu child-menu-item ms-0 ${['/multi-item3'].includes(menu) ? 'active' : ''}`}
                      >
                        <Link
                          href="#"
                          onClick={() => setSubmenu(menu === '/multi-item3' ? '' : '/multi-item3')}
                        >
                          {' '}
                          Level 2.0{' '}
                        </Link>
                        <span className="submenu-arrow"></span>
                        <ul
                          className={`submenu ${['/multi-item3'].includes(submenu) ? 'open' : ''}`}
                        >
                          <li className="ms-0">
                            <Link href="#" className="sub-menu-item">
                              Level 2.1
                            </Link>
                          </li>
                          <li className="ms-0">
                            <Link href="#" className="sub-menu-item">
                              Level 2.2
                            </Link>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>  */}

              <li className={`${menu === '/sale' ? 'active' : ''}`}>
                <Link href="/sale" className="sub-menu-item">
                  Descuentos
                </Link>
              </li>

              <li className={`${menu === '/contact' ? 'active' : ''}`}>
                <Link href="/contact" className="sub-menu-item">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <ul className="buy-button list-none mb-0">
            <li className="dropdown inline-block relative pe-1" ref={dropdownRef}>
              <button
                data-dropdown-toggle="dropdown"
                className="dropdown-toggle align-middle inline-flex search-dropdown"
                type="button"
                onClick={() => setIsOpen(!isOpen)}
              >
                {navlight === true ? (
                  <>
                    <FiSearch className="size-5  text-white"></FiSearch>
                  </>
                ) : (
                  <FiSearch className="size-5 "></FiSearch>
                )}
              </button>
              {isOpen && (
                <div
                  className={`dropdown-menu absolute overflow-hidden end-0 m-0 mt-5 z-10 md:w-52 w-48 rounded-md bg-white dark:bg-slate-900 shadow dark:shadow-gray-800`}
                >
                  <div className="relative">
                    <FiSearch className="absolute size-4 top-[9px] end-3"></FiSearch>
                    <input
                      type="text"
                      className="h-9 px-3 pe-10 w-full border-gray-100 dark:border-gray-800 focus:ring-0 outline-none bg-white dark:bg-slate-900"
                      name="s"
                      id="searchItem"
                      placeholder="Search..."
                    />
                  </div>
                </div>
              )}
            </li>

            <li className="dropdown inline-block relative ps-0.5" ref={cartRef}>
              <button
                data-dropdown-toggle="dropdown"
                className="dropdown-toggle size-9 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center rounded-full bg-fourth-base border border-fourth-base text-black"
                type="button"
                onClick={() => setCartmenu(!cartmenu)}
              >
                <FiShoppingCart className="h-4 w-4"></FiShoppingCart>
              </button>
              {cartmenu && (
                <div className="dropdown-menu absolute end-0 m-0 mt-4 z-10 w-64 rounded-md bg-white dark:bg-slate-900 shadow dark:shadow-gray-800">
                  <ul className="py-3 text-start" aria-labelledby="dropdownDefault">
                    <li className="ms-0">
                      <Link href="#" className="flex items-center justify-between py-1.5 px-4">
                        <span className="flex items-center">
                          <Image
                            src="/images/shop/trendy-shirt.jpg"
                            width={36}
                            height={46}
                            className="rounded shadow dark:shadow-gray-800 w-9"
                            alt=""
                          />
                          <span className="ms-3">
                            <span className="block font-semibold">T-shirt (M)</span>
                            <span className="block text-sm text-slate-400">$320 X 2</span>
                          </span>
                        </span>

                        <span className="font-semibold">$640</span>
                      </Link>
                    </li>

                    <li className="ms-0">
                      <Link href="#" className="flex items-center justify-between py-1.5 px-4">
                        <span className="flex items-center">
                          <Image
                            src="/images/shop/luxurious-bag2.jpg"
                            width={36}
                            height={46}
                            className="rounded shadow dark:shadow-gray-800 w-9"
                            alt=""
                          />
                          <span className="ms-3">
                            <span className="block font-semibold">Bag</span>
                            <span className="block text-sm text-slate-400">$50 X 5</span>
                          </span>
                        </span>

                        <span className="font-semibold">$250</span>
                      </Link>
                    </li>

                    <li className="ms-0">
                      <Link href="#" className="flex items-center justify-between py-1.5 px-4">
                        <span className="flex items-center">
                          <Image
                            src="/images/shop/apple-smart-watch.jpg"
                            width={36}
                            height={46}
                            className="rounded shadow dark:shadow-gray-800 w-9"
                            alt=""
                          />
                          <span className="ms-3">
                            <span className="block font-semibold">Watch (Men)</span>
                            <span className="block text-sm text-slate-400">$800 X 1</span>
                          </span>
                        </span>

                        <span className="font-semibold">$800</span>
                      </Link>
                    </li>

                    <li className="border-t border-gray-100 dark:border-gray-800 my-2 ms-0"></li>

                    <li className="flex items-center justify-between py-1.5 px-4 ms-0">
                      <h6 className="font-semibold mb-0">Total($):</h6>
                      <h6 className="font-semibold mb-0">$1690</h6>
                    </li>

                    <li className="py-1.5 px-4 ms-0">
                      <span className="text-center block">
                        <Link
                          href="#"
                          className="py-[5px] px-4 inline-block font-semibold tracking-wide align-middle duration-500 text-sm text-center rounded-md bg-fourth-base border border-fourth-base text-white me-1"
                        >
                          View Cart
                        </Link>
                        <Link
                          href="#"
                          className="py-[5px] px-4 inline-block font-semibold tracking-wide align-middle duration-500 text-sm text-center rounded-md bg-fourth-base border border-fourth-base text-white"
                        >
                          Checkout
                        </Link>
                      </span>
                      <p className="text-sm text-slate-400 mt-1">*T&C Apply</p>
                    </li>
                  </ul>
                </div>
              )}
            </li>

            <li className="inline-block ps-0.5">
              <Link
                href="/favoritos"
                className="size-9 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center rounded-full bg-fourth-base text-black"
              >
                <FiHeart data-feather="heart" className="h-4 w-4"></FiHeart>
              </Link>
            </li>

            <li className="dropdown inline-block relative ps-0.5" ref={userRef}>
              <button
                data-dropdown-toggle="dropdown"
                className="dropdown-toggle items-center"
                type="button"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  setUsermenu((prev) => !prev);
                }}
              >
                <span className="size-9 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center rounded-full border border-fourth-basebg-fourth-basetext-black">
                  <Image
                    src="/images/client/16.jpg"
                    width={34}
                    height={34}
                    className="rounded-full"
                    alt="User avatar"
                  />
                </span>
              </button>
              {usermenu && (
                <div className="dropdown-menu absolute end-0 m-0 mt-4 z-10 w-48 rounded-md overflow-hidden bg-white dark:bg-slate-900 shadow dark:shadow-gray-700">
                  <ul className="py-2 text-start">
                    <li className="ms-0">
                      <p className="text-slate-400 pt-2 px-4">Welcome Jesus!</p>
                    </li>
                    <li className="ms-0">
                      <p className="flex items-center font-medium py-2 px-4">
                        <FiDollarSign className="h-4 w-4 me-2" /> Balance:{' '}
                        <span className="text-fourth-basems-2">$ 245.10</span>
                      </p>
                    </li>
                    <li className="ms-0">
                      <Link
                        href="/user-account"
                        className="flex items-center font-medium py-2 px-4 dark:text-white/70 hover:text-fourth-basedark:hover:text-white"
                      >
                        <FiUser className="h-4 w-4 me-2" />
                        Account
                      </Link>
                    </li>
                    <li className="ms-0">
                      <Link
                        href="/helpcenter"
                        className="flex items-center font-medium py-2 px-4 dark:text-white/70 hover:text-fourth-basedark:hover:text-white"
                      >
                        <FiHelpCircle className="h-4 w-4 me-2" />
                        Helpcenter
                      </Link>
                    </li>
                    <li className="ms-0">
                      <Link
                        href="/user-setting"
                        className="flex items-center font-medium py-2 px-4 dark:text-white/70 hover:text-fourth-basedark:hover:text-white"
                      >
                        <FiSettings className="h-4 w-4 me-2" />
                        Settings
                      </Link>
                    </li>
                    <li className="border-t border-gray-100 dark:border-gray-800 my-2"></li>
                    <li className="ms-0">
                      <Link
                        href="/login"
                        className="flex items-center font-medium py-2 px-4 dark:text-white/70 hover:text-fourth-basedark:hover:text-white"
                      >
                        <FiLogOut className="h-4 w-4 me-2" />
                        Logout
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </li>
          </ul>
          <div className="menu-extras">
            <div className="menu-item">
              <Link
                href="#"
                className={`navbar-toggle ${isToggle ? 'open' : ''}`}
                id="isToggle"
                onClick={() => toggleMenu()}
              >
                <div className="lines">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
