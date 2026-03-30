'use client';
import { useNode, type UserComponent } from '@craftjs/core';
import { ShoppingCart } from 'lucide-react';
import { NavigationBarSettings } from './NavigationBar.settings';
import { NAVIGATION_BAR_DEFAULTS, type NavigationBarProps } from './NavigationBar.props';

export const NavigationBar: UserComponent<NavigationBarProps> = (props) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  const isCentered = props.variant === 'centered';
  return (
    <nav
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      data-block-type="NavigationBar"
      className={`w-full cursor-move px-6 py-3 flex items-center gap-6 border-b-2 border-gray-200 ${isCentered ? 'flex-col sm:flex-row justify-center' : 'justify-between'} ${props.sticky ? 'sticky top-0 z-50 shadow-sm' : ''}`}
      style={{ backgroundColor: 'var(--color-surface, #f9fafb)' }}
    >
      <div
        className="flex items-center gap-2 font-bold text-lg"
        style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
      >
        {props.logoUrl && <img src={props.logoUrl} alt={props.logoText} className="h-8 w-auto" />}
        <span>{props.logoText}</span>
      </div>
      <div className="flex items-center gap-5 flex-wrap">
        {props.links.map((link, i) => (
          <a
            key={i}
            href={link.href}
            className="text-sm"
            style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
          >
            {link.label}
          </a>
        ))}
        {props.variant === 'with-cta' && props.ctaText && (
          <a
            href={props.ctaHref}
            className="text-sm font-medium px-4 py-1.5"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              borderRadius: 'var(--radius)',
            }}
          >
            {props.ctaText}
          </a>
        )}
        {props.showCart && (
          <a
            href={props.cartHref || '/carrito'}
            aria-label="Carrito de compras"
            className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--color-text)' }}
          >
            <ShoppingCart size={20} strokeWidth={1.8} />
          </a>
        )}
      </div>
    </nav>
  );
};

NavigationBar.craft = {
  displayName: 'Barra de Navegación',
  props: NAVIGATION_BAR_DEFAULTS,
  related: { settings: NavigationBarSettings },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
};
