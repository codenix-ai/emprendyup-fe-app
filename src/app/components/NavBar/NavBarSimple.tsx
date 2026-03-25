'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { FiSearch, FiUser } from '../../assets/icons/vander';
import { FaUser, FaChevronDown } from 'react-icons/fa6';
import { Heart, LogOut, ShoppingCart, User } from 'lucide-react';
import { toast } from 'sonner';
import { cartService } from '@/lib/Cart';

type NavbarSimpleProps = {
  navClass?: string;
  navlight: boolean;
};

export default function NavbarSimple({ navClass, navlight }: NavbarSimpleProps) {
  const [scrolling, setScrolling] = useState<boolean>(false);
  const [isToggle, setToggle] = useState<boolean>(false);
  const [menu, setmenu] = useState<string>('');
  const [submenu, setSubmenu] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for user session
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          if (parsedUser && parsedUser.email && parsedUser.name) {
            setUser(parsedUser);
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }

      const handleScroll = () => {
        const isScrolling = window.scrollY > 50;
        setScrolling(isScrolling);
      };

      const handleOutsideClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (
          !target.closest('#navigation') &&
          !target.closest('.search-dropdown') &&
          !target.closest('.user-dropdown')
        ) {
          setIsOpen(false);
          setUserDropdownOpen(false);
        }
      };

      window.addEventListener('scroll', handleScroll);
      window.addEventListener('click', handleOutsideClick);

      const current = typeof window !== 'undefined' ? window.location.pathname : '';
      setmenu(current);
      setSubmenu(current);

      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('click', handleOutsideClick);
      };
    }
  }, []);
  useEffect(() => {
    setCartItemCount(cartService.getItemCount());

    const handleStorageChange = () => {
      setCartItemCount(cartService.getItemCount());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleMenu = () => {
    setToggle(!isToggle);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  const handleLogout = () => {
    // Show toast notification
    toast.success('Sesión cerrada exitosamente', {
      description: 'Has cerrado sesión correctamente. Redirigiendo...',
      duration: 2000,
    });

    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');

    // Reset user state
    setUser(null);
    setUserDropdownOpen(false);

    // Redirect after a short delay to allow toast to be seen
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  };

  return (
    <nav
      id="topnav"
      className={`${navClass} fixed top-0 left-0 w-full z-50 bg-white dark:bg-slate-900 shadow-md`}
    >
      <div className="hidden md:flex container font-roboto items-center justify-between gap-4">
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

        <div
          id="navigation"
          className={`${isToggle ? 'fixed inset-0 pt-16 z-40 bg-white overflow-auto md:hidden' : 'hidden md:block'}`}
          role={isToggle ? 'dialog' : undefined}
          aria-modal={isToggle ? true : undefined}
          onClick={() => {
            if (isToggle) setToggle(false);
          }}
        >
          {/* inner container stops click propagation so clicks inside don't close the overlay */}
          <div
            className={`${isToggle ? 'max-w-md mx-auto' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button (mobile) */}
            {isToggle && (
              <button
                aria-label="Cerrar menú"
                className="absolute top-4 right-4 z-50 p-2 rounded-md"
                onClick={() => setToggle(false)}
              >
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 18L18 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}

            {/* Mobile-only submenu quick links */}

            <ul
              className={`navigation-menu items-center ${navlight === true ? 'nav-light' : ''} ${isToggle ? 'flex flex-col gap-6 p-6' : 'md:flex'}`}
            >
              <li
                className={`has-submenu parent-menu-item  ${submenu === '/soluciones-item' ? 'active' : ''}`}
              >
                <button
                  type="button"
                  aria-expanded={submenu === '/soluciones-item'}
                  aria-controls="soluciones-item"
                  className="parent-menu-button sub-menu-item flex items-center gap-2"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSubmenu(submenu === '/soluciones-item' ? '' : '/soluciones-item');
                  }}
                >
                  <span>Soluciones</span>
                  <svg
                    className={`w-3 h-3 transition-transform ${submenu === '/soluciones-item' ? 'rotate-180' : 'rotate-0'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Full-width submenu panel (desktop) / inline submenu (mobile overlay) */}
                {submenu === '/soluciones-item' &&
                  (isToggle ? (
                    /* Mobile: render inline inside the overlay so it's visible */
                    <div
                      id="beneficios-item"
                      className="w-full bg-black text-white py-6"
                      role="menu"
                    >
                      <div className="container mx-auto px-6 py-6">
                        <div className="grid grid-cols-1 gap-6">
                          <div className="pr-0">
                            <h3 className="text-xl font-bold mb-2">
                              Soluciones para escalar tu emprendimiento
                            </h3>
                            <p className="text-sm text-white/90 mb-4">
                              Todo para vender en línea — recursos, plantillas y apoyo para
                              emprendedores.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link
                              href="/emprendedores-online"
                              onClick={() => setToggle(false)}
                              className="block bg-white rounded-xl overflow-hidden shadow-md"
                            >
                              <div className="relative h-44 w-full">
                                <Image
                                  src="/images/ab1.jpg"
                                  alt="Para quienes ya venden en línea"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="p-3">
                                <h4 className="font-semibold text-gray-900">
                                  Para quienes ya venden en línea
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Optimiza tu tienda y canales de venta
                                </p>
                              </div>
                            </Link>

                            <Link
                              href="/tienda-fisica"
                              onClick={() => setToggle(false)}
                              className="block bg-white rounded-xl overflow-hidden shadow-md"
                            >
                              <div className="relative h-44 w-full">
                                <Image
                                  src="/images/ab2.jpg"
                                  alt="Para quienes tienen una tienda física"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="p-3">
                                <h4 className="font-semibold text-gray-900">
                                  Para quienes tienen una tienda física
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Integración y recogida en tienda
                                </p>
                              </div>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Desktop: full-width absolute panel */
                    <div
                      id="soluciones-item"
                      className={`submenu fullwidth-submenu open`}
                      role="menu"
                    >
                      <div className="absolute left-1/2 transform -translate-x-[575px] w-screen max-w-none z-50">
                        <div className="bg-black text-white">
                          <div className="container mx-auto px-6 py-12 lg:py-16">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                              {/* Left text column */}
                              <div className="lg:col-span-1 pr-6 border-r border-white/10">
                                <h3 className="text-2xl lg:text-3xl font-bold mb-3">
                                  Soluciones para escalar tu emprendimiento
                                </h3>
                                <p className="text-sm lg:text-base text-white/90">
                                  Todas las herramientas que necesitas para mejorar tu
                                  emprendimiento y hacerlo crecer.
                                </p>
                              </div>

                              {/* Right: two cards */}
                              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Link
                                  href="/por-que-emprendy"
                                  onClick={() => setToggle(false)}
                                  className="block bg-white rounded-xl overflow-hidden shadow-md"
                                >
                                  <div className="relative h-56 w-full">
                                    <Image
                                      src="/images/ab1.jpg"
                                      alt="Para quienes ya venden en línea"
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="p-4">
                                    <h4 className="font-semibold text-gray-900">
                                      Conoce todos los benificios de emprendyup
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      Optimizamos todos tus procesos con tecnologia y AI
                                    </p>
                                  </div>
                                </Link>

                                <Link
                                  href="/crear-tienda"
                                  onClick={() => setToggle(false)}
                                  className="block bg-white rounded-xl overflow-hidden shadow-md"
                                >
                                  <div className="relative h-56 w-full">
                                    <Image
                                      src="/images/ab2.jpg"
                                      alt="Para quienes tienen una tienda física"
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="p-4">
                                    <h4 className="font-semibold text-gray-900">
                                      Crear tu tienda en linea y rapido
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      Utiliza nuestro agente AI para crear tu tienda en minutos
                                    </p>
                                  </div>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </li>

              <li className={`${menu === '/precios' ? 'active' : ''}`}>
                <Link href="/precios" className="sub-menu-item" onClick={() => setToggle(false)}>
                  Precios
                </Link>
              </li>

              <li className={`${menu === '/blog' ? 'active' : ''}`}>
                <Link href="/blog" className="sub-menu-item" onClick={() => setToggle(false)}>
                  Blog
                </Link>
              </li>

              <li className={`${menu === '/contact' ? 'active' : ''}`}>
                <Link href="/contacto" className="sub-menu-item" onClick={() => setToggle(false)}>
                  Contacto
                </Link>
              </li>
              <li className={`${menu === '/contact' ? 'active' : ''}`}>
                <Link
                  href="/marketplace"
                  className="sub-menu-item"
                  onClick={() => setToggle(false)}
                >
                  Marketplace
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          {/* Carrito */}
          <Link href="/carro-compras" className="relative">
            <ShoppingCart className="w-6 h-6" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 text-black bg-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* Favoritos */}
          <Link href="/favoritos" className="relative">
            <Heart className="w-6 h-6" />
          </Link>
        </div>
        <div className="flex gap-2">
          {/* User Dropdown */}
          {user ? (
            <div className="relative user-dropdown">
              <button
                onClick={toggleUserDropdown}
                className="py-2 px-4 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-sm font-medium text-center rounded-full bg-gray-800 hover:bg-gray-700 text-white gap-2"
              >
                <FaUser />
                <span className="hidden md:inline">{user.name?.split(' ')[0] || 'Usuario'}</span>
                <FaChevronDown
                  className={`transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Mi Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              target="_blank"
              className="py-2 px-4 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-sm font-medium text-center rounded-full bg-gray-800 hover:bg-gray-700 text-white"
            >
              <FaUser />
            </Link>
          )}

          <Link
            href="/crear-tienda"
            className="py-2 px-4 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-sm font-medium text-center rounded-md bg-fourth-base hover:bg-fourth-base/90 text-white"
          >
            Crear Mi Tienda
          </Link>
        </div>
      </div>

      <div className="md:hidden relative flex flex-row items-center w-full justify-between">
        <Link className="logo flex items-center px-4" href="/">
          <Image
            src="/images/logo.svg"
            width={48}
            height={48}
            className="h-12 w-12 min-w-[48px] min-h-[48px] object-contain"
            alt="Emprendy.ai Logo"
            priority
          />
        </Link>
        <div className="flex flex-row gap-4 items-center px-4">
          <Link
            href="/crear-tienda"
            className="py-2 px-4 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-sm font-medium text-center rounded-md bg-fourth-base hover:bg-fourth-base/90 text-white"
          >
            Crear Mi Tienda
          </Link>
          {/* Menú móvil toggle */}
          <div className="menu-extras flex flex-row gap-8">
            <div className="menu-item">
              <Link
                href="#"
                className={`navbar-toggle ${isToggle ? 'open' : ''}`}
                id="isToggle"
                onClick={(e) => {
                  e.preventDefault();
                  toggleMenu();
                }}
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
        {isToggle && (
          <div className="md:hidden absolute top-full left-0 right-0 px-6 py-4 border-b bg-black border-gray-100 dark:border-gray-800">
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  href="/por-que-emprendy"
                  onClick={() => setToggle(false)}
                  className="block text-lg font-medium text-gray-800 dark:text-white py-2"
                >
                  Soluciones
                </Link>
              </li>
              <li>
                <Link
                  href="/precios"
                  onClick={() => setToggle(false)}
                  className="block text-lg font-medium text-gray-800 dark:text-white py-2"
                >
                  Precios
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  onClick={() => setToggle(false)}
                  className="block text-lg font-medium text-gray-800 dark:text-white py-2"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/contacto"
                  onClick={() => setToggle(false)}
                  className="block text-lg font-medium text-gray-800 dark:text-white py-2"
                >
                  Contacto
                </Link>
              </li>

              {/* User Menu Items */}
              {user ? (
                <>
                  <li className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <span className="block text-sm text-gray-500 dark:text-gray-400 py-1">
                      Hola, {user.name?.split(' ')[0] || 'Usuario'}
                    </span>
                  </li>
                  <li>
                    <Link
                      href="/dashboard"
                      onClick={() => setToggle(false)}
                      className="block flex items-center gap-4 text-lg font-medium text-gray-800 dark:text-white py-2"
                    >
                      <User className="w-5 h-5" /> Mi Perfil
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setToggle(false);
                        handleLogout();
                      }}
                      className="block flex items-center gap-4 text-lg font-medium text-red-600 py-2 w-full text-left"
                    >
                      <LogOut className="w-5 h-5" /> Cerrar Sesión
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    href="/login"
                    target="_blank"
                    onClick={() => setToggle(false)}
                    className="block flex items-center gap-4 text-lg font-medium text-gray-800 dark:text-white py-2"
                  >
                    <FaUser /> Login
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
