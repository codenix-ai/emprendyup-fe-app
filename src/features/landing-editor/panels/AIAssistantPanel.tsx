'use client';

// ─── AIAssistantPanel ─────────────────────────────────────────────────────────
// Panel que permite generar una landing page completa con IA.
// Debe renderizarse dentro de <Editor> de Craft.js (usa useEditor).

import { useState, useEffect, useRef } from 'react';
import { Sparkles, CheckCircle, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { useAIGeneration } from '../hooks/useAIGeneration';
import { useLandingEditor } from '../context/LandingEditorContext';
import type { TenantContext } from '../context/TenantContext';
import type { GenerateLandingRequest } from '../ai/ai.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AIAssistantPanelProps {
  tenant: TenantContext;
}

type Tone = NonNullable<GenerateLandingRequest['tone']>;
type Language = NonNullable<GenerateLandingRequest['language']>;

// ─── Progress steps shown during generation ───────────────────────────────────

const PROGRESS_STEPS = [
  '🧠 Analizando tu negocio...',
  '✍️ Redactando contenido...',
  '🎨 Eligiendo el tema visual...',
] as const;

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: 'friendly', label: 'Amigable' },
  { value: 'professional', label: 'Profesional' },
  { value: 'bold', label: 'Atrevido' },
  { value: 'elegant', label: 'Elegante' },
  { value: 'minimal', label: 'Minimalista' },
];

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'English' },
];

// ─── Shared input class ───────────────────────────────────────────────────────

const INPUT_CLASS =
  'bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 text-sm w-full ' +
  'placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500';

// ─── Component ────────────────────────────────────────────────────────────────

export function AIAssistantPanel({ tenant }: AIAssistantPanelProps) {
  const { setTheme } = useLandingEditor();
  const { generateLanding, isGenerating, error, clearError } = useAIGeneration(tenant);

  // ─── Form state ──────────────────────────────────────────────────────────────
  const [description, setDescription] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [tone, setTone] = useState<Tone>('friendly');
  const [language, setLanguage] = useState<Language>('es');

  // ─── UI state ────────────────────────────────────────────────────────────────
  const [successPreset, setSuccessPreset] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  // ─── Progress animation ───────────────────────────────────────────────────
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isGenerating) {
      setActiveStep(0);
      stepTimerRef.current = setInterval(() => {
        setActiveStep((prev) => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev));
      }, 2000);
    } else {
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    }

    return () => {
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
      }
    };
  }, [isGenerating]);

  // ─── Validation ──────────────────────────────────────────────────────────────
  const descriptionTrimmed = description.trim();
  const isValid = descriptionTrimmed.length >= 20 && descriptionTrimmed.length <= 500;

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleGenerate = async (): Promise<void> => {
    if (!isValid || isGenerating) return;

    clearError();
    setSuccessPreset(null);

    const result = await generateLanding({
      businessDescription: descriptionTrimmed,
      businessName: businessName.trim() || undefined,
      tone,
      language,
    });

    if (result) {
      setTheme(result.landing.theme);
      setSuccessPreset(result.suggestedPreset);
    }
  };

  // ─── Reset ────────────────────────────────────────────────────────────────────
  const handleReset = (): void => {
    setDescription('');
    setBusinessName('');
    setTone('friendly');
    setLanguage('es');
    setSuccessPreset(null);
    clearError();
  };

  // ─── Preset display name ─────────────────────────────────────────────────────
  const presetDisplayName: Record<string, string> = {
    'elegant-dark': 'Elegant Dark',
    'modern-light': 'Modern Light',
    'natural-earth': 'Natural Earth',
    'bold-vibrant': 'Bold Vibrant',
    'minimal-mono': 'Minimal Mono',
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-900 flex flex-col h-full overflow-y-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-white font-semibold text-base">Generar con IA</h2>
        </div>
        <p className="text-gray-400 text-xs leading-snug">
          Describí tu negocio y la IA creará tu landing
        </p>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 px-4 py-4">
        {/* ── Success state ─────────────────────────────────────────────────── */}
        {successPreset && (
          <div className="bg-green-900/40 border border-green-700 rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
              <span className="text-green-300 font-semibold text-sm">¡Landing generada!</span>
            </div>
            <p className="text-green-200/70 text-xs">
              Tema aplicado:{' '}
              <span className="font-medium text-green-200">
                {presetDisplayName[successPreset] ?? successPreset}
              </span>
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Tu tema fue aplicado. Arrastrá los bloques sugeridos desde el panel izquierdo para
              completar tu landing.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Editar desde cero
            </button>
          </div>
        )}

        {/* ── Error display ─────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-lg p-3 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-300 text-xs leading-snug">{error}</p>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="text-xs text-red-400 hover:text-red-300 transition-colors self-start underline underline-offset-2"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* ── Form (hidden after success) ───────────────────────────────────── */}
        {!successPreset && (
          <>
            {/* Description textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-300 text-xs font-medium">
                Descripción del negocio <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Soy panadero artesanal en Palermo, hago medialunas y pan de campo..."
                maxLength={500}
                rows={4}
                disabled={isGenerating}
                className={`${INPUT_CLASS} resize-none disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              <div className="flex justify-between items-center">
                {descriptionTrimmed.length > 0 && descriptionTrimmed.length < 20 && (
                  <span className="text-yellow-500 text-xs">Mínimo 20 caracteres</span>
                )}
                {descriptionTrimmed.length === 0 && (
                  <span className="text-gray-600 text-xs">Mínimo 20 caracteres</span>
                )}
                {descriptionTrimmed.length >= 20 && (
                  <span className="text-green-500 text-xs">✓</span>
                )}
                <span
                  className={`text-xs ml-auto ${
                    description.length > 450 ? 'text-yellow-400' : 'text-gray-600'
                  }`}
                >
                  {description.length}/500
                </span>
              </div>
            </div>

            {/* Business name input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-300 text-xs font-medium">
                Nombre del negocio <span className="text-gray-500 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej: La Panadería de Juan"
                disabled={isGenerating}
                className={`${INPUT_CLASS} disabled:opacity-50 disabled:cursor-not-allowed`}
              />
            </div>

            {/* Tone select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-300 text-xs font-medium">Tono</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
                disabled={isGenerating}
                className={`${INPUT_CLASS} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {TONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-300 text-xs font-medium">Idioma</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                disabled={isGenerating}
                className={`${INPUT_CLASS} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Progress steps */}
            {isGenerating && (
              <div className="flex flex-col gap-2 py-1">
                {PROGRESS_STEPS.map((step, index) => (
                  <div
                    key={step}
                    className={`text-xs transition-all duration-500 ${
                      index === activeStep
                        ? 'text-indigo-300 animate-pulse font-medium'
                        : index < activeStep
                          ? 'text-gray-500 line-through'
                          : 'text-gray-700'
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
            )}

            {/* Generate button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!isValid || isGenerating}
              className={`
                w-full flex items-center justify-center gap-2
                px-4 py-2.5 rounded-lg text-sm font-semibold
                transition-colors duration-150
                ${
                  isValid && !isGenerating
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />✨ Generar landing completa
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
