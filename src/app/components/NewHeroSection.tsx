'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb, Rocket, Search } from 'lucide-react';
import { motion } from 'framer-motion';

import ChatWidget from './ChatWidget/ChatWidget';

const NewHeroSection = () => {
  const [chatOpen, setChatOpen] = useState(false);

  const bgImage =
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1920&auto=format&fit=crop';

  // Background image URLb
  const bgStyle = useMemo(
    () => ({
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
    [bgImage]
  );

  const onPrimaryClick = () => {
    // Handle primary button click scroll to #lead-capture section smoothly
    window.scrollTo({
      top: document.getElementById('lead-capture')?.offsetTop,
      behavior: 'smooth',
    });
  };

  const onSecondaryClick = () => {
    // Handle secondary button click
    window.scrollTo({
      top: document.getElementById('features')?.offsetTop,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <section
        className="relative isolate text-white"
        style={{ minHeight: '70vh' }}
        aria-label="Sección principal de Emprendy.ai"
      >
        {/* Background */}
        <div
          className="absolute inset-0 -z-10"
          style={bgStyle}
          role="img"
          aria-label="Emprendedores usando tecnología"
        />

        {/* Overlay for readability */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/70 via-slate-900/60 to-slate-900/80" />

        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(60%_40%_at_30%_20%,_rgba(56,189,248,0.25),_transparent_60%),_radial-gradient(40%_30%_at_70%_30%,_rgba(139,92,246,0.25),_transparent_60%)]" />

        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-2xl lg:max-w-3xl"
          >
            {/* Eyebrow / value props */}
            <div className="mb-4 flex flex-wrap gap-2 justify-center sm:justify-start">
              {['IA aplicada', 'Tecnología real', 'Comunidad que impulsa'].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur md:text-sm"
                >
                  {chip}
                </span>
              ))}
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-center md:text-left sm:text-5xl lg:text-6xl">
              <span className="block">Impulsa tu negocio</span>
              <span className="block">con IA, tecnología y comunidad</span>
            </h1>

            {/* Subhead */}
            <p className="mt-5 max-w-2xl text-base text-white/90 text-center md:text-left sm:text-lg">
              Herramientas digitales diseñadas para emprendedores que quieren escalar y crecer de
              forma inteligente.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-3 items-center sm:flex-row sm:items-center md:items-start">
              <button
                onClick={onPrimaryClick}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-base font-semibold shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 active:scale-[.99] bg-gradient-to-r from-cyan-400 to-violet-500 hover:from-cyan-300 hover:to-violet-400"
                aria-label="Quiero crecer"
              >
                <Rocket
                  className="h-5 w-5 transition-transform group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
                Quiero crecer
              </button>

              <button
                onClick={onSecondaryClick}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold backdrop-blur transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label="Descubrir cómo"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
                Beneficios
              </button>

              <a
                href="https://www.emprendy.ai/analizar-idea"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-400/60 bg-amber-400/10 px-6 py-3 text-base font-semibold text-amber-300 backdrop-blur transition hover:bg-amber-400/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                aria-label="Analiza tu idea de emprendimiento"
                data-testid="analyze-idea-button"
              >
                <Lightbulb className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
                Analiza tu idea
              </a>
            </div>

            {/* Social proof / quick stats */}
            <div className="mt-10 grid max-w-xl grid-cols-2 gap-6 text-sm text-white/80 sm:grid-cols-3">
              <div className="text-center sm:text-left">
                <p className="text-2xl font-bold text-white">+120</p>
                <p>emprendedores impactados</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-2xl font-bold text-white">+8%</p>
                <p>mejora en conversión</p>
              </div>
              <div className="col-span-2 sm:col-span-1 text-center sm:text-left">
                <p className="text-2xl font-bold text-white">99%</p>
                <p>satisfacción del cliente</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Floating AI Chat Button */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
        aria-label="Pregunta a AI Alex"
      >
        <svg
          className="w-5 h-5 transition-transform group-hover:scale-110"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 9h8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 13h6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="hidden sm:inline">Ask AI Alex</span>
        <span className="sm:hidden">AI</span>
      </button>

      {chatOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-[92%] max-w-md">
          <div className="bg-transparent">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setChatOpen(false)}
                className="p-1 bg-white/10 rounded-full text-white"
                aria-label="Cerrar chat"
              >
                ✕
              </button>
            </div>
            <ChatWidget />
          </div>
        </div>
      )}
    </>
  );
};

export default NewHeroSection;
