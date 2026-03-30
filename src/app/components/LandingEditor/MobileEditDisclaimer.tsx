'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Copy, X, ExternalLink, Laptop } from 'lucide-react';

/**
 * MobileEditDisclaimer
 *
 * Shown when the landing page preview is opened on a mobile device
 * or inside an iframe (modal/embedded context).
 * It informs the user that editing requires a desktop browser.
 */
export function MobileEditDisclaimer() {
  const [visible, setVisible] = useState(false);
  const [pageUrl, setPageUrl] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const checkVisibility = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    const isInIframe = window.self !== window.top;
    setVisible(isMobile || isInIframe);
  }, []);

  useEffect(() => {
    checkVisibility();
    setPageUrl(window.location.href);

    window.addEventListener('resize', checkVisibility);
    return () => window.removeEventListener('resize', checkVisibility);
  }, [checkVisibility]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 2500);
    }
  };

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderTop: '1px solid rgba(99,102,241,0.35)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.45)',
        padding: '20px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        fontFamily: "'Jost', system-ui, sans-serif",
      }}
    >
      {/* Close button */}
      <button
        onClick={() => setVisible(false)}
        aria-label="Cerrar aviso"
        style={{
          position: 'absolute',
          top: '12px',
          right: '14px',
          background: 'rgba(255,255,255,0.08)',
          border: 'none',
          borderRadius: '6px',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.6)',
          padding: 0,
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>

      {/* Icon + headline */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Laptop size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 600,
              color: '#f1f5f9',
              lineHeight: 1.3,
              paddingRight: '32px',
            }}
          >
            Edita tu sitio en tu computadora
          </p>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '12px',
              color: 'rgba(203,213,225,0.75)',
              lineHeight: 1.5,
            }}
          >
            El editor de landing page está optimizado para escritorio. Abre esta página en tu
            computadora para acceder a todas las herramientas de edición.
          </p>
        </div>
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {/* Copy link button */}
        <button
          onClick={handleCopy}
          style={{
            flex: 1,
            minWidth: '130px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background:
              copyState === 'copied'
                ? 'rgba(34,197,94,0.18)'
                : copyState === 'error'
                  ? 'rgba(239,68,68,0.18)'
                  : 'rgba(99,102,241,0.18)',
            border: `1px solid ${
              copyState === 'copied'
                ? 'rgba(34,197,94,0.4)'
                : copyState === 'error'
                  ? 'rgba(239,68,68,0.4)'
                  : 'rgba(99,102,241,0.4)'
            }`,
            borderRadius: '8px',
            color:
              copyState === 'copied' ? '#86efac' : copyState === 'error' ? '#fca5a5' : '#a5b4fc',
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.03em',
            padding: '9px 14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
          }}
        >
          <Copy size={13} />
          {copyState === 'copied'
            ? '¡Copiado!'
            : copyState === 'error'
              ? 'No se pudo copiar'
              : 'Copiar enlace'}
        </button>

        {/* Open in new tab button */}
        <a
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            minWidth: '130px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            color: 'rgba(203,213,225,0.8)',
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.03em',
            padding: '9px 14px',
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
          }}
        >
          <ExternalLink size={13} />
          Abrir enlace
        </a>
      </div>
    </div>
  );
}
