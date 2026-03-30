import type { LandingTheme, ThemePreset } from '@/lib/landing-renderer/types/landing-json.schema';

export const THEME_PRESETS: Record<Exclude<ThemePreset, 'custom'>, LandingTheme> = {
  'elegant-dark': {
    preset: 'elegant-dark',
    colors: {
      primary: '#C9A96E',
      secondary: '#1A1409',
      accent: '#E2C48A',
      background: '#0D0D0D',
      surface: '#1A1A1A',
      text: '#F5F5F0',
      textMuted: '#A09880',
    },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      scale: 'lg',
    },
    spacing: 'relaxed',
    borderRadius: 'sm',
    shadows: 'strong',
  },

  'modern-light': {
    preset: 'modern-light',
    colors: {
      primary: '#6366F1',
      secondary: '#4F46E5',
      accent: '#A5B4FC',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#111827',
      textMuted: '#6B7280',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      scale: 'md',
    },
    spacing: 'normal',
    borderRadius: 'md',
    shadows: 'subtle',
  },

  'natural-earth': {
    preset: 'natural-earth',
    colors: {
      primary: '#7C6A46',
      secondary: '#5C4D30',
      accent: '#B09A6E',
      background: '#FAF6F0',
      surface: '#F0E8DC',
      text: '#2D1B00',
      textMuted: '#7A6040',
    },
    typography: {
      headingFont: 'Lora',
      bodyFont: 'Source Sans 3',
      scale: 'md',
    },
    spacing: 'normal',
    borderRadius: 'sm',
    shadows: 'subtle',
  },

  'bold-vibrant': {
    preset: 'bold-vibrant',
    colors: {
      primary: '#FF3B5C',
      secondary: '#FF6B35',
      accent: '#FFD23F',
      background: '#FFF9F0',
      surface: '#FFF0E8',
      text: '#1A1A1A',
      textMuted: '#666666',
    },
    typography: {
      headingFont: 'Montserrat',
      bodyFont: 'Nunito',
      scale: 'xl',
    },
    spacing: 'normal',
    borderRadius: 'lg',
    shadows: 'medium',
  },

  'minimal-mono': {
    preset: 'minimal-mono',
    colors: {
      primary: '#000000',
      secondary: '#333333',
      accent: '#555555',
      background: '#FAFAFA',
      surface: '#F0F0F0',
      text: '#1A1A1A',
      textMuted: '#888888',
    },
    typography: {
      headingFont: 'Space Grotesk',
      bodyFont: 'Space Grotesk',
      scale: 'md',
    },
    spacing: 'compact',
    borderRadius: 'none',
    shadows: 'none',
  },
};

export const DEFAULT_THEME: LandingTheme = THEME_PRESETS['modern-light'];
