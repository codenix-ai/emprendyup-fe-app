'use client';

// ─── ThemeSelector ─────────────────────────────────────────────────────────────
// Panel that displays the 5 theme presets as selectable cards with color swatches.
// Reads current theme from context and writes via setTheme().

import { Palette, Check } from 'lucide-react';
import { THEME_PRESETS } from '../theme';
import { useLandingEditor } from '../context/LandingEditorContext';
import type { ThemePreset } from '@/lib/landing-renderer/types/landing-json.schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type PresetKey = Exclude<ThemePreset, 'custom'>;

const PRESET_LABELS: Record<PresetKey, string> = {
  'elegant-dark': 'Elegant Dark',
  'modern-light': 'Modern Light',
  'natural-earth': 'Natural Earth',
  'bold-vibrant': 'Bold Vibrant',
  'minimal-mono': 'Minimal Mono',
};

const PRESET_KEYS = Object.keys(THEME_PRESETS) as PresetKey[];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ColorSwatchProps {
  color: string;
  label: string;
}

function ColorSwatch({ color, label }: ColorSwatchProps) {
  return (
    <span
      className="inline-block h-4 w-4 rounded-full border border-white/10 flex-shrink-0"
      style={{ backgroundColor: color }}
      title={label}
      aria-label={label}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ThemeSelector() {
  const { theme, setTheme } = useLandingEditor();

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
        <Palette className="h-4 w-4 text-indigo-400 flex-shrink-0" aria-hidden="true" />
        <h2 className="text-sm font-semibold tracking-wide">Tema Visual</h2>
      </div>

      {/* Preset list */}
      <ul
        className="flex flex-col gap-2 p-3 overflow-y-auto flex-1"
        role="listbox"
        aria-label="Seleccionar tema visual"
      >
        {PRESET_KEYS.map((key) => {
          const preset = THEME_PRESETS[key];
          const isActive = theme.preset === key;

          return (
            <li key={key} role="option" aria-selected={isActive}>
              <button
                type="button"
                onClick={() => setTheme(preset)}
                className={[
                  'w-full text-left rounded-lg px-3 py-2.5 transition-all duration-150',
                  'bg-gray-800 hover:bg-gray-750 hover:ring-1 hover:ring-indigo-400',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                  isActive ? 'ring-2 ring-indigo-500' : 'ring-0',
                ].join(' ')}
                aria-pressed={isActive}
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Preset name */}
                  <span className="text-sm font-medium leading-none truncate">
                    {PRESET_LABELS[key]}
                  </span>

                  {/* Active checkmark */}
                  {isActive && (
                    <Check
                      className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Color swatches row */}
                <div className="flex items-center gap-1.5 mt-2">
                  <ColorSwatch color={preset.colors.primary} label="Primary" />
                  <ColorSwatch color={preset.colors.secondary} label="Secondary" />
                  <ColorSwatch color={preset.colors.accent} label="Accent" />
                  <ColorSwatch color={preset.colors.background} label="Background" />
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer note */}
      <p className="px-4 py-2.5 text-xs text-gray-500 border-t border-gray-700 leading-snug">
        Los cambios se reflejan en tiempo real
      </p>
    </div>
  );
}
