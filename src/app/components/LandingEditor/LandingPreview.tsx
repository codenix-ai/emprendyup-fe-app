'use client';
import React from 'react';
import type {
  DraftConfig,
  BrandColors,
  DraftMenuConfig,
  DraftReservationFormConfig,
  DraftFooterConfig,
} from './types';
import { extractColors } from './types';
import { ShoppingCart } from 'lucide-react';

interface LandingPreviewProps {
  config: DraftConfig;
  sectionOrder?: string[];
}

// ── Safe string helper ────────────────────────────────────────────────────────
// Prevents "Objects are not valid as a React child" when API fields are objects.
function safeStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    return Object.values(val as Record<string, unknown>)
      .filter((v) => typeof v === 'string' || typeof v === 'number')
      .join(', ');
  }
  return '';
}

function resolveImageUrl(id: string | undefined | null): string {
  if (!id) return '';
  if (typeof id === 'string' && id.startsWith('http')) return id;
  return `https://emprendyup-images.s3.us-east-1.amazonaws.com/${id}`;
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function HeroPreview({ hero, colors }: { hero: DraftConfig['hero']; colors: BrandColors }) {
  if (!hero) return null;
  const bgImage =
    typeof hero.backgroundImage === 'string'
      ? hero.backgroundImage
      : (((hero.backgroundImage as Record<string, unknown> | undefined)?.url as string) ?? '');
  const hasBg = !!bgImage;
  const opacity = hero.overlayOpacity ?? 0.4;
  const alignment = hero.alignment ?? 'center';
  const buttons = Array.isArray(hero.buttons) ? hero.buttons : [];
  const bgColor = (hero.backgroundColor as string | undefined) ?? '';

  const resolvedBackground = hasBg
    ? `linear-gradient(rgba(0,0,0,${opacity}), rgba(0,0,0,${opacity})), url(${bgImage}) center/cover no-repeat`
    : bgColor
      ? bgColor
      : `linear-gradient(135deg, ${colors.secondaryColor} 0%, ${colors.primaryColor}55 100%)`;

  // Issue 9: vertical alignment
  const contentVertical = (hero.contentVertical ?? 'center') as string;
  const alignItemsMap: Record<string, string> = {
    top: 'flex-start',
    bottom: 'flex-end',
    center: 'center',
  };
  const alignItemsValue = alignItemsMap[contentVertical] ?? 'center';

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '480px',
        display: 'flex',
        alignItems: alignItemsValue,
        justifyContent:
          alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center',
        background: resolvedBackground,
        padding: '80px 64px',
      }}
    >
      <div style={{ textAlign: alignment, maxWidth: '640px', position: 'relative', zIndex: 1 }}>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '52px',
            fontWeight: 300,
            letterSpacing: '0.04em',
            color: '#FAF9F6',
            lineHeight: 1.15,
            marginBottom: '20px',
            ...(hero.titleStyle as React.CSSProperties | undefined),
          }}
        >
          {safeStr(hero.title)}
        </h1>
        <p
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '16px',
            letterSpacing: '0.06em',
            color: 'rgba(250,249,246,0.8)',
            marginBottom: hero.description ? '16px' : '40px',
            lineHeight: 1.7,
            ...(hero.subtitleStyle as React.CSSProperties | undefined),
          }}
        >
          {safeStr(hero.subtitle)}
        </p>
        {hero.description && (
          <p
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '14px',
              letterSpacing: '0.04em',
              color: 'rgba(250,249,246,0.65)',
              marginBottom: '40px',
              lineHeight: 1.8,
              ...(hero.descriptionStyle as React.CSSProperties | undefined),
            }}
          >
            {safeStr(hero.description)}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent:
              alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          {buttons.map((btn, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                padding: i === 0 ? '13px 32px' : '12px 32px',
                background: i === 0 ? colors.buttonColor : 'transparent',
                border: i === 0 ? 'none' : '1px solid rgba(250,249,246,0.45)',
                color: '#FAF9F6',
                fontFamily: "'Jost', sans-serif",
                fontSize: '11px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {safeStr(btn.text)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Menu ──────────────────────────────────────────────────────────────────────

function MenuPreview({ menu, colors }: { menu: DraftMenuConfig | undefined; colors: BrandColors }) {
  if (!menu) return null;

  const items = Array.isArray(menu.items) ? menu.items : [];
  const menuButtons = Array.isArray(menu.buttons) ? menu.buttons : [];

  return (
    <section
      style={{
        padding: '80px 64px',
        background: (menu['backgroundColor'] as string | undefined) ?? colors.backgroundColor,
      }}
    >
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '36px',
          fontWeight: 300,
          letterSpacing: '0.06em',
          color: colors.textColor,
          textAlign: 'center',
          marginBottom: '40px',
          ...(menu['titleStyle'] as React.CSSProperties | undefined),
        }}
      >
        {safeStr(menu.title) || 'Productos'}
      </h2>

      {(menu['subtitle'] as string | undefined) && (
        <p
          style={{
            ...(menu['subtitleStyle'] as React.CSSProperties | undefined),
            fontFamily: "'Jost', sans-serif",
            fontSize: '16px',
            color: `${colors.textColor}80`,
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          {safeStr(menu['subtitle'] as string)}
        </p>
      )}

      {items.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            maxWidth: '960px',
            margin: '0 auto',
          }}
        >
          {items.map((item, i) => {
            const name =
              safeStr(item.name) || safeStr(item.title) || safeStr(item.productName) || '';
            const price = item.price != null ? safeStr(item.price) : '';
            const imgRaw = item.image as Record<string, unknown> | string | undefined;
            const imageUrl =
              typeof imgRaw === 'string'
                ? imgRaw
                : imgRaw
                  ? resolveImageUrl(safeStr(imgRaw.id) || safeStr(imgRaw.url))
                  : '';
            const desc = safeStr(item.description) || safeStr(item['desc']);

            return (
              <div
                key={i}
                style={{
                  background: colors.backgroundColor,
                  border: `1px solid ${colors.primaryColor}22`,
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                {imageUrl && (
                  <div
                    style={{
                      height: '180px',
                      background: `url(${imageUrl}) center/cover no-repeat`,
                    }}
                  />
                )}
                {!imageUrl && (
                  <div
                    style={{
                      height: '120px',
                      background: `${colors.primaryColor}12`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Jost', sans-serif",
                        fontSize: '11px',
                        letterSpacing: '0.12em',
                        color: `${colors.primaryColor}60`,
                        textTransform: 'uppercase',
                      }}
                    >
                      Sin imagen
                    </span>
                  </div>
                )}
                <div style={{ padding: '16px' }}>
                  {name && (
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: '17px',
                        fontWeight: 400,
                        color: colors.textColor,
                        marginBottom: price ? '6px' : '0',
                        lineHeight: 1.3,
                      }}
                    >
                      {name}
                    </p>
                  )}
                  {price && (
                    <p
                      style={{
                        fontFamily: "'Jost', sans-serif",
                        fontSize: '13px',
                        fontWeight: 500,
                        color: colors.primaryColor,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {price}
                    </p>
                  )}
                  {desc && (
                    <p
                      style={{
                        fontFamily: "'Jost',sans-serif",
                        fontSize: '12px',
                        color: `${colors.textColor}60`,
                        lineHeight: 1.5,
                        marginTop: '6px',
                      }}
                    >
                      {desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '13px',
            color: `${colors.textColor}40`,
            textAlign: 'center',
            letterSpacing: '0.08em',
          }}
        >
          Los productos aparecerán aquí
        </p>
      )}

      {menuButtons.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          {menuButtons.map((btn, i) => (
            <a
              key={i}
              href={safeStr(btn.link)}
              style={{
                display: 'inline-block',
                padding: '12px 28px',
                background: safeStr(btn.backgroundColor) || colors.buttonColor,
                color: safeStr(btn.textColor) || '#FAF9F6',
                fontFamily: "'Jost', sans-serif",
                fontSize: '11px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                margin: '0 8px',
              }}
            >
              {safeStr(btn.text)}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

// ── About ─────────────────────────────────────────────────────────────────────

function AboutPreview({ about, colors }: { about: DraftConfig['about']; colors: BrandColors }) {
  if (!about) return null;

  const sectionBg = (about['backgroundColor'] as string | undefined) ?? colors.backgroundColor;
  const paragraphs = Array.isArray(about.paragraphs) ? (about.paragraphs as string[]) : [];
  const paragraphs2 = Array.isArray(about['paragraphs2']) ? (about['paragraphs2'] as string[]) : [];
  const images = Array.isArray(about.images) ? about.images : [];

  return (
    <section style={{ padding: '80px 64px', background: sectionBg }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '36px',
            fontWeight: 300,
            letterSpacing: '0.06em',
            color: colors.textColor,
            marginBottom: '12px',
            ...(about['titleStyle'] as React.CSSProperties | undefined),
          }}
        >
          {safeStr(about.title) || 'Sobre nosotros'}
        </h2>
        {(about['subtitle'] as string | undefined) && (
          <p
            style={{
              ...(about['subtitleStyle'] as React.CSSProperties),
            }}
          >
            {safeStr(about['subtitle'] as string | undefined)}
          </p>
        )}
        {about.description && (
          <p
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '14px',
              color: `${colors.textColor}80`,
              maxWidth: '640px',
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            {safeStr(about.description)}
          </p>
        )}
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              ...(about['paragraphStyle'] as React.CSSProperties),
            }}
          >
            {para}
          </p>
        ))}
        {paragraphs2.map((para, i) => (
          <p
            key={i}
            style={{
              ...(about['paragraph2Style'] as React.CSSProperties),
            }}
          >
            {para}
          </p>
        ))}
        {images.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              marginTop: '24px',
              flexWrap: 'wrap',
            }}
          >
            {images.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={resolveImageUrl(img.id)}
                alt={safeStr(img.alt)}
                style={{ maxWidth: '200px', borderRadius: '4px' }}
              />
            ))}
          </div>
        )}
      </div>
      {about.stats && about.stats.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '32px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {about.stats.map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '32px',
                  fontWeight: 400,
                  color: colors.primaryColor,
                }}
              >
                {safeStr(stat.value)}
              </div>
              <div
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: '12px',
                  letterSpacing: '0.1em',
                  color: `${colors.textColor}80`,
                  textTransform: 'uppercase',
                }}
              >
                {safeStr(stat.label)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Gallery ───────────────────────────────────────────────────────────────────

function GalleryPreview({
  gallery,
  colors,
}: {
  gallery: DraftConfig['gallery'];
  colors: BrandColors;
}) {
  if (!gallery?.images?.length) return null;
  const cols = gallery.columns ?? 3;
  return (
    <section
      style={{
        padding: '80px 64px',
        background: (gallery['backgroundColor'] as string | undefined) ?? colors.backgroundColor,
      }}
    >
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '36px',
          fontWeight: 300,
          letterSpacing: '0.06em',
          color: colors.textColor,
          textAlign: 'center',
          marginBottom: '40px',
          ...(gallery['titleStyle'] as React.CSSProperties | undefined),
        }}
      >
        {safeStr(gallery.title) || 'Galería'}
      </h2>
      {(gallery['subtitle'] as string | undefined) && (
        <p
          style={{
            ...(gallery['subtitleStyle'] as React.CSSProperties | undefined),
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          {safeStr(gallery['subtitle'] as string)}
        </p>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '16px',
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        {gallery.images.map((img, i) => {
          const url =
            typeof img === 'string'
              ? img
              : resolveImageUrl(
                  safeStr((img as Record<string, unknown>).id) ||
                    safeStr((img as Record<string, unknown>).url)
                );
          const alt = typeof img === 'string' ? '' : (img.alt ?? '');
          return (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                background: `url(${url}) center/cover no-repeat`,
                borderRadius: '4px',
              }}
              title={alt}
            />
          );
        })}
      </div>
    </section>
  );
}

// ── Reservation Form ──────────────────────────────────────────────────────────

function ReservationFormPreview({
  reservationForm,
  colors,
}: {
  reservationForm: DraftReservationFormConfig | undefined;
  colors: BrandColors;
}) {
  if (!reservationForm) return null;

  const fieldsIsObj =
    !Array.isArray(reservationForm.fields) &&
    typeof reservationForm.fields === 'object' &&
    reservationForm.fields !== null;
  const fieldsArr = Array.isArray(reservationForm.fields) ? reservationForm.fields : [];
  const fieldsObj = fieldsIsObj
    ? (reservationForm.fields as unknown as Record<string, string>)
    : null;

  const sharedInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    fontFamily: "'Jost', sans-serif",
    fontSize: '13px',
    color: `${colors.textColor}60`,
    background: colors.backgroundColor,
    border: `1px solid ${colors.primaryColor}30`,
    borderRadius: '2px',
    outline: 'none',
    cursor: 'not-allowed',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'Jost', sans-serif",
    fontSize: '10px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: `${colors.textColor}70`,
    marginBottom: '6px',
  };

  return (
    <section
      style={{
        padding: '80px 64px',
        background: `${colors.primaryColor}0f`,
      }}
    >
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '36px',
          fontWeight: 300,
          letterSpacing: '0.06em',
          color: colors.textColor,
          textAlign: 'center',
          marginBottom: '40px',
        }}
      >
        {safeStr(reservationForm.title) || 'Reservar'}
      </h2>

      <div
        style={{
          maxWidth: '480px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {fieldsObj && (
          <>
            <div>
              <label style={labelStyle}>{fieldsObj.name || 'Nombre'}</label>
              <input
                disabled
                type="text"
                placeholder={fieldsObj.name || 'Nombre'}
                style={sharedInputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>{fieldsObj.email || 'Correo Electrónico'}</label>
              <input
                disabled
                type="email"
                placeholder={fieldsObj.email || 'Correo Electrónico'}
                style={sharedInputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>{fieldsObj.message || 'Mensaje'}</label>
              <textarea
                disabled
                rows={3}
                placeholder={fieldsObj.message || 'Mensaje'}
                style={{ ...sharedInputStyle, resize: 'none' }}
              />
            </div>
          </>
        )}

        {fieldsArr.length > 0 &&
          fieldsArr.map((field, i) => {
            const label =
              safeStr(field.name).charAt(0).toUpperCase() + safeStr(field.name).slice(1);
            const isSelect = field.type === 'select';
            const isTextarea = field.type === 'textarea';

            return (
              <div key={i}>
                <label style={labelStyle}>
                  {label}
                  {field.required && (
                    <span style={{ color: colors.primaryColor, marginLeft: '3px' }}>*</span>
                  )}
                </label>
                {isSelect ? (
                  <select disabled style={sharedInputStyle}>
                    <option>—</option>
                  </select>
                ) : isTextarea ? (
                  <textarea
                    disabled
                    rows={3}
                    placeholder={label}
                    style={{ ...sharedInputStyle, resize: 'none' }}
                  />
                ) : (
                  <input
                    disabled
                    type={field.type ?? 'text'}
                    placeholder={label}
                    style={sharedInputStyle}
                  />
                )}
              </div>
            );
          })}

        <button
          disabled
          style={{
            marginTop: '8px',
            padding: '13px 32px',
            background: colors.buttonColor,
            border: 'none',
            color: '#FAF9F6',
            fontFamily: "'Jost', sans-serif",
            fontSize: '11px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: 'not-allowed',
            opacity: 0.85,
            alignSelf: 'flex-start',
          }}
        >
          {safeStr((reservationForm as Record<string, unknown>).submitButton as string) || 'Enviar'}
        </button>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────

function TestimonialsPreview({
  testimonials,
  colors,
}: {
  testimonials: DraftConfig['testimonials'];
  colors: BrandColors;
}) {
  if (!testimonials?.items?.length) return null;
  return (
    <section
      style={{
        padding: '80px 64px',
        background:
          (testimonials['backgroundColor'] as string | undefined) ?? `${colors.primaryColor}08`,
      }}
    >
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '36px',
          fontWeight: 300,
          letterSpacing: '0.06em',
          color: colors.textColor,
          textAlign: 'center',
          marginBottom: '16px',
          ...(testimonials['titleStyle'] as React.CSSProperties | undefined),
        }}
      >
        {safeStr(testimonials.title) || 'Testimonios'}
      </h2>
      {(testimonials['subtitle'] as string | undefined) && (
        <p
          style={{
            ...(testimonials['subtitleStyle'] as React.CSSProperties | undefined),
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          {safeStr(testimonials['subtitle'] as string)}
        </p>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(testimonials.items.length, 3)}, 1fr)`,
          gap: '24px',
          maxWidth: '960px',
          margin: '24px auto 0',
        }}
      >
        {testimonials.items.map((item, i) => {
          const itemRec = item as Record<string, unknown>;
          const stars = itemRec.stars as number | undefined;
          const hasImage = !!itemRec.image;
          const rawAvatarSrc = hasImage
            ? resolveImageUrl((itemRec.image as Record<string, unknown>).id as string)
            : resolveImageUrl(itemRec.avatar as string);
          const avatarSrc = rawAvatarSrc || '';

          const initials = safeStr(itemRec.name as string)
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0] ?? '')
            .join('')
            .toUpperCase();

          return (
            <div
              key={i}
              style={{
                padding: '32px 24px',
                background: colors.backgroundColor,
                border: `1px solid ${colors.primaryColor}22`,
                textAlign: 'center',
              }}
            >
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    margin: '0 auto 12px',
                    display: 'block',
                  }}
                  alt={safeStr(itemRec.name as string)}
                />
              ) : (
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: `${colors.primaryColor}22`,
                    border: `1px solid ${colors.primaryColor}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: initials ? '16px' : '20px',
                    fontWeight: 400,
                    color: colors.primaryColor,
                    letterSpacing: '0.05em',
                  }}
                >
                  {initials || '✦'}
                </div>
              )}
              {stars && (
                <p style={{ color: '#F59E0B', fontSize: '16px', marginBottom: '8px' }}>
                  {'★'.repeat(Math.min(stars, 5))}
                </p>
              )}
              <p
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: '13px',
                  color: `${colors.textColor}99`,
                  lineHeight: 1.7,
                  marginBottom: '16px',
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{safeStr(item.text)}&rdquo;
              </p>
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '15px',
                  fontWeight: 500,
                  color: colors.textColor,
                }}
              >
                {safeStr(item.name)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Contact ───────────────────────────────────────────────────────────────────

function ContactPreview({
  contact,
  colors,
}: {
  contact: DraftConfig['contact'];
  colors: BrandColors;
}) {
  if (!contact) return null;

  const contactBg =
    (contact['backgroundColor'] as string | undefined) ??
    (contact['style']
      ? (contact['style'] as Record<string, string>).backgroundColor
      : colors.secondaryColor);

  const socialEntries = contact.social ? Object.entries(contact.social).filter(([, v]) => v) : [];
  const hoursEntries = contact.hours ? Object.entries(contact.hours).filter(([, v]) => v) : [];
  const buttons = Array.isArray(contact.buttons) ? contact.buttons : [];

  return (
    <section style={{ padding: '80px 64px', background: contactBg, textAlign: 'center' }}>
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '40px',
          fontWeight: 300,
          letterSpacing: '0.04em',
          color: '#FAF9F6',
          marginBottom: '24px',
          ...(contact['titleStyle'] as React.CSSProperties | undefined),
        }}
      >
        {safeStr(contact.title) || 'Contacto'}
      </h2>
      {(contact['subtitle'] as string | undefined) && (
        <p
          style={{
            ...(contact['subtitleStyle'] as React.CSSProperties | undefined),
            fontFamily: "'Jost', sans-serif",
            fontSize: '14px',
            color: 'rgba(250,249,246,0.8)',
            marginBottom: '16px',
          }}
        >
          {safeStr(contact['subtitle'] as string)}
        </p>
      )}
      <div
        style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '13px',
          color: 'rgba(250,249,246,0.7)',
          lineHeight: 2,
        }}
      >
        {contact.email && <p>{safeStr(contact.email)}</p>}
        {contact.phone && <p>{safeStr(contact.phone)}</p>}
        {contact.address && <p>{safeStr(contact.address)}</p>}
      </div>
      {hoursEntries.length > 0 && (
        <div
          style={{
            marginTop: '16px',
            fontFamily: "'Jost', sans-serif",
            fontSize: '13px',
            color: 'rgba(250,249,246,0.7)',
            lineHeight: 2,
          }}
        >
          {hoursEntries.map(([day, val]) => (
            <span key={day} style={{ display: 'block' }}>
              <b>{day}</b>: {val}
            </span>
          ))}
        </div>
      )}
      {socialEntries.length > 0 && (
        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {socialEntries.map(([key, val]) => (
            <a
              key={key}
              href={val}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#FAF9F6',
                fontFamily: "'Jost', sans-serif",
                fontSize: '12px',
                textDecoration: 'underline',
              }}
            >
              {key}
            </a>
          ))}
        </div>
      )}
      {buttons.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          {buttons.map((btn, i) => (
            <a
              key={i}
              href={safeStr(btn.link)}
              style={{
                color: safeStr(btn.textColor),
                backgroundColor: safeStr(btn.backgroundColor),
                padding: '10px 24px',
                display: 'inline-block',
                textDecoration: 'none',
                margin: '4px',
              }}
            >
              {safeStr(btn.text)}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function FooterPreview({
  footer,
  businessName,
  colors,
  tagline,
}: {
  footer: DraftFooterConfig | undefined;
  businessName: string;
  colors: BrandColors;
  tagline?: string;
}) {
  const year = new Date().getFullYear();
  const footerStyle = (footer?.['style'] as Record<string, string> | undefined) ?? {};
  const footerBg = footerStyle.backgroundColor ?? colors.backgroundColor;
  const footerTextColor = footerStyle.textColor ?? colors.textColor;
  const footerFontFamily = footerStyle.fontFamily ?? "'Jost', sans-serif";
  const footerText =
    safeStr(footer?.['copyrightText'] as string) ||
    safeStr(footer?.text) ||
    `© ${year} · Todos los derechos reservados`;
  const links = Array.isArray(footer?.links) ? footer.links : [];
  const social = footer?.social ?? {};
  const socialEntries = Object.entries(social).filter(([, v]) => v);

  return (
    <footer
      style={{
        padding: '40px 64px',
        borderTop: `1px solid ${colors.primaryColor}22`,
        background: footerBg,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        {/* Left — business name + aboutText + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '13px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: `${footerTextColor}60`,
            }}
          >
            {businessName || 'Mi Tienda'}
          </span>
          {!!footer?.['aboutText'] && (
            <p
              style={{
                fontFamily: footerFontFamily,
                fontSize: '12px',
                color: footerTextColor,
                opacity: 0.7,
                marginBottom: '8px',
                marginTop: '4px',
              }}
            >
              {safeStr(footer['aboutText'] as string)}
            </p>
          )}
          {tagline && (
            <p
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: '11px',
                color: `${footerTextColor}60`,
                marginTop: '4px',
              }}
            >
              {tagline}
            </p>
          )}
        </div>

        {/* Centre — links */}
        {links.length > 0 && (
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            {links.map((link, i) => (
              <span
                key={i}
                style={{
                  fontFamily: footerFontFamily,
                  fontSize: '11px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: `${footerTextColor}60`,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                {safeStr(link.label)}
              </span>
            ))}
          </div>
        )}

        {/* Right — copyright + social pills */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '10px',
          }}
        >
          <span
            style={{
              fontFamily: footerFontFamily,
              fontSize: '11px',
              letterSpacing: '0.12em',
              color: `${footerTextColor}40`,
            }}
          >
            {footerText}
          </span>

          {socialEntries.length > 0 && (
            <div
              style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}
            >
              {socialEntries.map(([key, value]) => (
                <span
                  key={key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 10px',
                    border: `1px solid ${colors.primaryColor}30`,
                    borderRadius: '999px',
                    fontFamily: footerFontFamily,
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    color: `${colors.primaryColor}`,
                    background: `${colors.primaryColor}08`,
                  }}
                >
                  <span style={{ textTransform: 'capitalize' }}>{key}</span>
                  <span style={{ color: `${colors.textColor}50` }}>·</span>
                  <span>{safeStr(value)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

// ── Main Preview ──────────────────────────────────────────────────────────────

export function LandingPreview({ config, sectionOrder }: LandingPreviewProps) {
  const colors = extractColors(config);
  const branding = config.branding;
  const businessName = (branding?.name as string) ?? '';
  const logoUrl =
    typeof branding?.logo === 'string'
      ? branding.logo
      : (((branding?.logo as Record<string, unknown> | undefined)?.url as string) ?? '');

  const navItems = Array.isArray(config.navigation?.items) ? config.navigation!.items : [];
  const navStyle = config.navigation?.style ?? {};

  return (
    <div className="lux-shell" style={{ background: colors.backgroundColor }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Jost:wght@300;400;500&display=swap');
        .lux-shell { background: ${colors.backgroundColor}; min-height: 100vh; display: flex; flex-direction: column; }
        .lux-shell-main { flex: 1; }
        .lux-nav {
          position: sticky; top: 0; left: 0; right: 0; z-index: 200;
          padding: 18px 64px; display: flex; align-items: center;
          justify-content: space-between;
          background: ${navStyle.backgroundColor ?? 'rgba(250,249,246,0.96)'}; backdrop-filter: blur(20px);
          border-bottom: 1px solid ${colors.primaryColor}26;
        }
        .nav-logo {
          font-family: ${navStyle.fontFamily ? `'${navStyle.fontFamily}', sans-serif` : "'Cormorant Garamond', serif"}; font-size: 17px;
          font-weight: 300; letter-spacing: 0.42em; text-transform: uppercase;
          color: ${navStyle.textColor ?? colors.textColor}; text-decoration: none; user-select: none;
        }
        .nav-items {
          display: flex; align-items: center; gap: 28px; list-style: none;
          margin: 0; padding: 0;
        }
        .nav-item-link {
          font-family: ${navStyle.fontFamily ? `'${navStyle.fontFamily}', sans-serif` : "'Jost', sans-serif"}; font-size: 10.5px; letter-spacing: 0.18em;
          text-transform: uppercase; color: ${navStyle.textColor ? `${navStyle.textColor}85` : `${colors.textColor}85`};
          text-decoration: none; cursor: pointer;
        }
        .nav-actions { display: flex; align-items: center; gap: 16px; }
        .nav-login {
          font-family: ${navStyle.fontFamily ? `'${navStyle.fontFamily}', sans-serif` : "'Jost', sans-serif"}; font-size: 10.5px; letter-spacing: 0.22em;
          text-transform: uppercase; color: ${navStyle.textColor ? `${navStyle.textColor}85` : `${colors.textColor}85`}; cursor: pointer;
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
              src={safeStr(logoUrl)}
              alt={safeStr(businessName)}
              style={{ height: '32px', objectFit: 'contain' }}
            />
          ) : (
            safeStr(businessName) || 'Mi Tienda'
          )}
        </span>

        {navItems.length > 0 && (
          <ul className="nav-items">
            {navItems.map((item, i) => (
              <li key={i}>
                <span className="nav-item-link">{safeStr(item.label)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="nav-actions">
          <span className="nav-login">
            {safeStr((config.navigation?.['reserveButtonText'] as string) || 'Ingresar')}
          </span>
          <span className="nav-cart">
            <ShoppingCart size={18} />
            <span className="nav-cart-badge">0</span>
          </span>
        </div>
      </nav>

      {/* MAIN */}
      <main className="lux-shell-main">
        {(() => {
          const RENDERABLE_SECTIONS: Record<string, () => React.ReactNode> = {
            hero: () => <HeroPreview hero={config.hero} colors={colors} />,
            menu: () => <MenuPreview menu={config.menu} colors={colors} />,
            about: () => <AboutPreview about={config.about} colors={colors} />,
            gallery: () => <GalleryPreview gallery={config.gallery} colors={colors} />,
            reservationForm: () => (
              <ReservationFormPreview reservationForm={config.reservationForm} colors={colors} />
            ),
            testimonials: () => (
              <TestimonialsPreview testimonials={config.testimonials} colors={colors} />
            ),
            contact: () => <ContactPreview contact={config.contact} colors={colors} />,
          };
          const orderedSections = sectionOrder ?? Object.keys(RENDERABLE_SECTIONS);
          return orderedSections.map((key) => {
            const renderer = RENDERABLE_SECTIONS[key];
            return renderer ? <React.Fragment key={key}>{renderer()}</React.Fragment> : null;
          });
        })()}
      </main>

      {/* FOOTER */}
      <FooterPreview
        footer={config.footer}
        businessName={businessName}
        colors={colors}
        tagline={branding?.tagline}
      />
    </div>
  );
}
