'use client';
import React, { useEffect, useRef } from 'react';
import type {
  LandingPageConfig,
  HeroSectionData,
  FeaturesSectionData,
  CtaSectionData,
  PageSection,
} from './types';
import { ShoppingCart } from 'lucide-react';

interface LandingPreviewProps {
  config: LandingPageConfig;
}

function HeroPreview({
  data,
  colors,
}: {
  data: HeroSectionData;
  colors: LandingPageConfig['colors'];
}) {
  const hasBg = !!data.backgroundImage;
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent:
          data.alignment === 'left'
            ? 'flex-start'
            : data.alignment === 'right'
              ? 'flex-end'
              : 'center',
        background: hasBg
          ? `linear-gradient(rgba(0,0,0,${data.overlayOpacity}), rgba(0,0,0,${data.overlayOpacity})), url(${data.backgroundImage}) center/cover no-repeat`
          : `linear-gradient(135deg, ${colors.secondaryColor} 0%, ${colors.primaryColor}55 100%)`,
        padding: '80px 64px',
      }}
    >
      <div
        style={{ textAlign: data.alignment, maxWidth: '640px', position: 'relative', zIndex: 1 }}
      >
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '52px',
            fontWeight: 300,
            letterSpacing: '0.04em',
            color: hasBg ? '#FAF9F6' : '#FAF9F6',
            lineHeight: 1.15,
            marginBottom: '20px',
          }}
        >
          {data.title}
        </h1>
        <p
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '16px',
            letterSpacing: '0.06em',
            color: hasBg ? 'rgba(250,249,246,0.8)' : 'rgba(250,249,246,0.75)',
            marginBottom: '40px',
            lineHeight: 1.7,
          }}
        >
          {data.subtitle}
        </p>
        <div
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent:
              data.alignment === 'center'
                ? 'center'
                : data.alignment === 'right'
                  ? 'flex-end'
                  : 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          {data.ctaText && (
            <span
              style={{
                display: 'inline-block',
                padding: '13px 32px',
                background: colors.buttonColor,
                color: '#FAF9F6',
                fontFamily: "'Jost', sans-serif",
                fontSize: '11px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              {data.ctaText}
            </span>
          )}
          {data.ctaSecondaryText && (
            <span
              style={{
                display: 'inline-block',
                padding: '12px 32px',
                border: `1px solid rgba(250,249,246,0.45)`,
                color: '#FAF9F6',
                fontFamily: "'Jost', sans-serif",
                fontSize: '11px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {data.ctaSecondaryText}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturesPreview({
  data,
  colors,
}: {
  data: FeaturesSectionData;
  colors: LandingPageConfig['colors'];
}) {
  return (
    <section style={{ padding: '80px 64px', background: colors.backgroundColor }}>
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '36px',
            fontWeight: 300,
            letterSpacing: '0.06em',
            color: colors.textColor,
            marginBottom: '12px',
          }}
        >
          {data.title}
        </h2>
        <p
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '13px',
            letterSpacing: '0.1em',
            color: `${colors.textColor}80`,
          }}
        >
          {data.subtitle}
        </p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(data.items.length, 3)}, 1fr)`,
          gap: '32px',
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        {data.items.map((item) => (
          <div
            key={item.id}
            style={{
              textAlign: 'center',
              padding: '40px 24px',
              border: `1px solid ${colors.primaryColor}22`,
              background: `${colors.primaryColor}08`,
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>{item.icon}</div>
            <h3
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '20px',
                fontWeight: 400,
                color: colors.textColor,
                marginBottom: '8px',
              }}
            >
              {item.title}
            </h3>
            <p
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: '13px',
                color: `${colors.textColor}80`,
                lineHeight: 1.6,
              }}
            >
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaPreview({
  data,
  colors,
}: {
  data: CtaSectionData;
  colors: LandingPageConfig['colors'];
}) {
  const bg =
    data.backgroundStyle === 'primary'
      ? colors.primaryColor
      : data.backgroundStyle === 'dark'
        ? colors.secondaryColor
        : colors.backgroundColor;
  const textClr = data.backgroundStyle === 'light' ? colors.textColor : '#FAF9F6';

  return (
    <section
      style={{
        padding: '80px 64px',
        background: bg,
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '40px',
          fontWeight: 300,
          letterSpacing: '0.04em',
          color: textClr,
          marginBottom: '16px',
        }}
      >
        {data.title}
      </h2>
      <p
        style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '13px',
          letterSpacing: '0.1em',
          color: `${textClr}B0`,
          marginBottom: '40px',
        }}
      >
        {data.subtitle}
      </p>
      {data.buttonText && (
        <span
          style={{
            display: 'inline-block',
            padding: '14px 40px',
            border: `1px solid ${textClr}`,
            color: textClr,
            fontFamily: "'Jost', sans-serif",
            fontSize: '11px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {data.buttonText}
        </span>
      )}
    </section>
  );
}

export function LandingPreview({ config }: LandingPreviewProps) {
  const { colors, sections, businessName, logoUrl } = config;

  const renderSection = (section: PageSection) => {
    if (!section.enabled) return null;
    switch (section.type) {
      case 'hero':
        return (
          <HeroPreview key={section.id} data={section.data as HeroSectionData} colors={colors} />
        );
      case 'features':
        return (
          <FeaturesPreview
            key={section.id}
            data={section.data as FeaturesSectionData}
            colors={colors}
          />
        );
      case 'cta':
        return (
          <CtaPreview key={section.id} data={section.data as CtaSectionData} colors={colors} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="lux-shell" style={{ background: colors.backgroundColor }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Jost:wght@300;400;500&display=swap');
        .lux-shell { background: ${colors.backgroundColor}; min-height: 100vh; display: flex; flex-direction: column; }
        .lux-shell-main { flex: 1; padding-top: 72px; }
        .lux-nav {
          position: sticky; top: 0; left: 0; right: 0; z-index: 200;
          padding: 18px 64px; display: flex; align-items: center;
          justify-content: space-between;
          background: rgba(250,249,246,0.96); backdrop-filter: blur(20px);
          border-bottom: 1px solid ${colors.primaryColor}26;
        }
        .nav-logo {
          font-family: 'Cormorant Garamond', serif; font-size: 17px;
          font-weight: 300; letter-spacing: 0.42em; text-transform: uppercase;
          color: ${colors.textColor}; text-decoration: none; user-select: none;
        }
        .nav-actions { display: flex; align-items: center; gap: 16px; }
        .nav-login {
          font-family: 'Jost', sans-serif; font-size: 10.5px; letter-spacing: 0.22em;
          text-transform: uppercase; color: ${colors.textColor}85; cursor: pointer;
        }
        .nav-cart {
          position: relative; display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; color: ${colors.textColor}99;
          border: 1px solid transparent; cursor: pointer;
        }
        .nav-cart-badge {
          position: absolute; top: 2px; right: 2px; width: 16px; height: 16px;
          background: ${colors.buttonColor}; border-radius: 50%; font-size: 9px;
          color: #FAF9F6; display: flex; align-items: center; justify-content: center;
          font-family: 'Jost', sans-serif;
        }
        @media (max-width: 768px) { .lux-nav { padding: 18px 24px; } }
      `}</style>

      {/* NAV */}
      <nav className="lux-nav">
        <span className="nav-logo">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={businessName}
              style={{ height: '32px', objectFit: 'contain' }}
            />
          ) : (
            businessName || 'Mi Tienda'
          )}
        </span>
        <div className="nav-actions">
          <span className="nav-login">Ingresar</span>
          <span className="nav-cart">
            <ShoppingCart size={18} />
            <span className="nav-cart-badge">0</span>
          </span>
        </div>
      </nav>

      {/* MAIN */}
      <main className="lux-shell-main">{sections.map(renderSection)}</main>

      {/* FOOTER */}
      <footer
        style={{
          padding: '40px 64px',
          borderTop: `1px solid ${colors.primaryColor}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: colors.backgroundColor,
        }}
      >
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '13px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: `${colors.textColor}60`,
          }}
        >
          {businessName || 'Mi Tienda'}
        </span>
        <span
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '11px',
            letterSpacing: '0.12em',
            color: `${colors.textColor}40`,
          }}
        >
          © {new Date().getFullYear()} · Todos los derechos reservados
        </span>
      </footer>
    </div>
  );
}
