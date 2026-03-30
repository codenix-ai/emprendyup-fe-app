'use client';
import { useNode, type UserComponent } from '@craftjs/core';
import { FaInstagram, FaFacebook, FaTiktok, FaWhatsapp } from 'react-icons/fa';
import { FooterSectionSettings } from './FooterSection.settings';
import { FOOTER_SECTION_DEFAULTS, type FooterSectionProps } from './FooterSection.props';

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
};

export const FooterSection: UserComponent<FooterSectionProps> = (props) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  const numCols = Math.min(4, Math.max(1, props.columns.length));
  const gridClass = GRID_COLS[numCols] ?? 'grid-cols-3';

  return (
    <footer
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      data-block-type="FooterSection"
      className="w-full cursor-move border-t-2 border-gray-200 pt-8"
      style={{
        backgroundColor: 'var(--color-bg, #f9fafb)',
        color: 'var(--color-text-muted, #6b7280)',
      }}
    >
      {/* ── Top: brand + columns ── */}
      <div
        className="max-w-6xl mx-auto px-6 pt-12 pb-8 grid gap-8"
        style={{
          gridTemplateColumns: numCols > 1 ? `1fr repeat(${numCols}, 1fr)` : '1fr',
        }}
      >
        {/* Brand column (always first) */}
        <div className="flex flex-col gap-3">
          <p
            className="font-bold text-lg"
            style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
          >
            {props.companyName}
          </p>
          {props.tagline && (
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
            >
              {props.tagline}
            </p>
          )}
          {/* Social icons */}
          <div className="flex gap-3 mt-2">
            {props.socialInstagram && (
              <a
                href={`https://instagram.com/${props.socialInstagram.replace('@', '')}`}
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
                style={{ backgroundColor: '#E1306C', color: '#fff' }}
              >
                <FaInstagram size={16} />
              </a>
            )}
            {props.socialFacebook && (
              <a
                href={props.socialFacebook}
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
                style={{ backgroundColor: '#1877F2', color: '#fff' }}
              >
                <FaFacebook size={16} />
              </a>
            )}
            {props.socialTiktok && (
              <a
                href={`https://tiktok.com/@${props.socialTiktok.replace('@', '')}`}
                aria-label="TikTok"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
                style={{ backgroundColor: '#010101', color: '#fff' }}
              >
                <FaTiktok size={15} />
              </a>
            )}
          </div>
        </div>

        {/* Link columns */}
        {props.columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-2">
            <p
              className="font-semibold text-sm mb-1"
              style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
            >
              {col.title}
            </p>
            {col.links.map((link, li) => (
              <a
                key={li}
                href={link.href}
                className="text-sm hover:underline"
                style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
              >
                {link.label}
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* ── Bottom: copyright ── */}
      <div className="border-t border-gray-200 px-6 py-4 text-center">
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
        >
          {props.copyrightText}
        </p>
      </div>

      {/* ── Floating WhatsApp button ── */}
      {props.showWhatsappFloat && props.socialWhatsapp && (
        <a
          href={`https://wa.me/${props.socialWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(props.whatsappFloatMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir WhatsApp"
          title="Chatea con nosotros"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#25D366',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(37,211,102,0.45)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.1)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow =
              '0 6px 20px rgba(37,211,102,0.55)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow =
              '0 4px 16px rgba(37,211,102,0.45)';
          }}
        >
          <FaWhatsapp size={28} />
        </a>
      )}
    </footer>
  );
};

FooterSection.craft = {
  displayName: 'Footer',
  props: FOOTER_SECTION_DEFAULTS,
  related: { settings: FooterSectionSettings },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
};
