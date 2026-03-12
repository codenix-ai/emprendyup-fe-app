'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Características', href: '#features' },
  { label: 'Cómo funciona', href: '#how-it-works' },
  { label: 'Testimonios', href: '#testimonials' },
  { label: 'Contacto', href: '#lead-capture' },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#')) return;
    e.preventDefault();
    setMobileOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-900/95 backdrop-blur-md shadow-lg border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <nav
        className="mx-auto max-w-7xl px-6 lg:px-8 h-16 flex items-center justify-between"
        aria-label="Navegación principal"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Inicio EmprendyUp">
          <Image
            src="/images/logo.svg"
            width={36}
            height={36}
            alt="EmprendyUp logo"
            className="h-9 w-auto"
          />
          <span className="text-white font-bold text-lg hidden xs:inline">EmprendyUp</span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-6 text-sm font-medium text-white/80">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="hover:text-fourth-base transition-colors duration-200"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-white/80 hover:text-white transition-colors px-3 py-1.5"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registrarse"
            className="text-sm font-semibold bg-fourth-base text-black rounded-xl px-4 py-2 hover:bg-fourth-300 transition-colors shadow-md"
          >
            Registrarse gratis
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="md:hidden bg-slate-900/98 backdrop-blur-md border-t border-white/10 px-6 pb-6 pt-4 space-y-4"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="block text-base font-medium text-white/80 hover:text-fourth-base py-1 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <hr className="border-white/10" />
            <Link
              href="/login"
              className="block text-center text-sm font-semibold text-white border border-white/20 rounded-xl py-2.5 hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registrarse"
              className="block text-center text-sm font-semibold bg-fourth-base text-black rounded-xl py-2.5 hover:bg-fourth-300 transition-colors shadow-md"
              onClick={() => setMobileOpen(false)}
            >
              Registrarse gratis
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
