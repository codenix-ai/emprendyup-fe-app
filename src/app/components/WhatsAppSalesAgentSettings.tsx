'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWhatsAppSalesAgentConfig } from '@/lib/hooks/useWhatsAppSalesAgentConfig';

interface WhatsAppSalesAgentSettingsProps {
  storeId: string;
  storeName?: string | null;
  currency?: string | null;
  defaultWhatsappNumber?: string | null;
}

type AgentFormState = {
  isActive: boolean;
  whatsappNumber: string;
  catalogUrl: string;
  systemPrompt: string;
};

const WHATSAPP_E164_REGEX = /^\+\d{6,15}$/;

const stripInvisibleChars = (value: string) =>
  value
    // zero-width, BOM
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // bidi marks (embedding/override/isolate) + LRM/RLM + Arabic letter mark
    .replace(/[\u202A-\u202E\u2066-\u2069\u200E\u200F\u061C]/g, '')
    // NBSP
    .replace(/\u00A0/g, ' ');

const toAsciiDigitsAndPlus = (value: string) => {
  // Convert fullwidth plus/digits commonly introduced by some keyboards
  const withAsciiPlus = value.replace(/[＋﹢⁺₊➕]/g, '+');
  return withAsciiPlus.replace(/[\uFF10-\uFF19]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xff10 + 0x30)
  );
};

const normalizeWhatsappNumber = (value: string) => {
  const cleaned = toAsciiDigitsAndPlus(stripInvisibleChars(value)).trim();
  // `+` might not be the first char if there were invisible marks in the paste.
  const hasPlus = cleaned.includes('+');
  const digits = cleaned.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
};

const buildBasePrompt = (storeName?: string | null, currency?: string | null) => {
  const safeStoreName = storeName?.trim() || 'tu tienda';
  const safeCurrency = currency?.trim() || 'COP';
  const base =
    'Eres el asistente de ventas de WhatsApp de {STORE_NAME}. ' +
    'Responde en español, sé breve y persuasivo. ' +
    'Haz preguntas para entender la necesidad, recomienda productos del catálogo cuando sea posible, ' +
    'indica precios en {CURRENCY}, y guía al cliente a concretar la compra. ' +
    'Si falta información, solicita datos específicos. No inventes disponibilidad ni precios.';
  return base.replace('{STORE_NAME}', safeStoreName).replace('{CURRENCY}', safeCurrency);
};

const normalizeForm = (form: AgentFormState) => ({
  ...form,
  whatsappNumber: normalizeWhatsappNumber(form.whatsappNumber),
  catalogUrl: form.catalogUrl.trim(),
  systemPrompt: form.systemPrompt.trim(),
});

const validateForm = (form: AgentFormState) => {
  const errors: Partial<Record<keyof AgentFormState, string>> = {};
  const normalizedNumber = normalizeWhatsappNumber(form.whatsappNumber);
  const catalogUrl = form.catalogUrl.trim();
  const systemPrompt = form.systemPrompt.trim();

  if (!normalizedNumber || !WHATSAPP_E164_REGEX.test(normalizedNumber)) {
    errors.whatsappNumber = 'El número debe estar en formato E.164, sin espacios.';
  }

  if (!catalogUrl || !(catalogUrl.startsWith('http://') || catalogUrl.startsWith('https://'))) {
    errors.catalogUrl = 'La URL debe empezar con http:// o https://.';
  }

  if (!systemPrompt) {
    errors.systemPrompt = 'El System Prompt es requerido.';
  }

  return errors;
};

export default function WhatsAppSalesAgentSettings({
  storeId,
  storeName,
  currency,
  defaultWhatsappNumber,
}: WhatsAppSalesAgentSettingsProps) {
  const { config, loading, error, upsertConfig } = useWhatsAppSalesAgentConfig('STORE', storeId);
  const basePrompt = useMemo(() => buildBasePrompt(storeName, currency), [storeName, currency]);
  const [form, setForm] = useState<AgentFormState>({
    isActive: false,
    whatsappNumber: defaultWhatsappNumber || '',
    catalogUrl: '',
    systemPrompt: basePrompt,
  });
  const normalizedWhatsAppPreview = useMemo(
    () => normalizeWhatsappNumber(form.whatsappNumber),
    [form.whatsappNumber]
  );
  const [initialForm, setInitialForm] = useState<AgentFormState | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [showErrors, setShowErrors] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (loading || initialized) return;

    if (config) {
      const nextState: AgentFormState = {
        isActive: config.isActive ?? true,
        whatsappNumber: config.whatsappNumber || '',
        catalogUrl: config.catalogUrl || '',
        systemPrompt: config.systemPrompt || basePrompt,
      };
      setForm(nextState);
      setInitialForm(nextState);
    } else {
      const nextState: AgentFormState = {
        isActive: false,
        whatsappNumber: defaultWhatsappNumber || '',
        catalogUrl: '',
        systemPrompt: basePrompt,
      };
      setForm(nextState);
      setInitialForm(nextState);
    }

    setInitialized(true);
  }, [loading, config, basePrompt, defaultWhatsappNumber, initialized]);

  useEffect(() => {
    if (!promptRef.current) return;
    promptRef.current.style.height = 'auto';
    promptRef.current.style.height = `${promptRef.current.scrollHeight}px`;
  }, [form.systemPrompt]);

  const errors = useMemo(() => validateForm(form), [form]);
  const hasErrors = Object.keys(errors).length > 0;

  const isDirty = useMemo(() => {
    if (!initialForm) return false;
    const normalizedCurrent = normalizeForm(form);
    const normalizedInitial = normalizeForm(initialForm);
    return JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedInitial);
  }, [form, initialForm]);

  useEffect(() => {
    if (!initialized || loading || config) return;
    if (!initialForm) return;
    if (isDirty) return;

    const nextWhatsapp = defaultWhatsappNumber || '';
    const shouldUpdatePrompt = initialForm.systemPrompt !== basePrompt;
    const shouldUpdateNumber = initialForm.whatsappNumber !== nextWhatsapp;

    if (shouldUpdatePrompt || shouldUpdateNumber) {
      const nextState: AgentFormState = {
        ...initialForm,
        systemPrompt: shouldUpdatePrompt ? basePrompt : initialForm.systemPrompt,
        whatsappNumber: shouldUpdateNumber ? nextWhatsapp : initialForm.whatsappNumber,
      };
      setForm(nextState);
      setInitialForm(nextState);
    }
  }, [initialized, loading, config, initialForm, isDirty, basePrompt, defaultWhatsappNumber]);

  const systemPromptChanged = useMemo(() => {
    if (!initialForm) return false;
    return normalizeForm(form).systemPrompt !== normalizeForm(initialForm).systemPrompt;
  }, [form, initialForm]);

  const handleSave = async () => {
    if (saveStatus === 'saving') return;

    setShowErrors(true);
    if (hasErrors || !isDirty) {
      return;
    }

    if (systemPromptChanged) {
      const confirmed = window.confirm(
        'El cambio del System Prompt afectará futuras conversaciones. ¿Deseas continuar?'
      );
      if (!confirmed) return;
    }

    setSaveStatus('saving');
    try {
      const normalized = normalizeForm(form);
      const updated = await upsertConfig({
        entityType: 'STORE',
        entityId: storeId,
        whatsappNumber: normalized.whatsappNumber,
        catalogUrl: normalized.catalogUrl,
        systemPrompt: normalized.systemPrompt,
        isActive: normalized.isActive,
      });

      const nextState: AgentFormState = {
        isActive: updated?.isActive ?? normalized.isActive,
        whatsappNumber: updated?.whatsappNumber ?? normalized.whatsappNumber,
        catalogUrl: updated?.catalogUrl ?? normalized.catalogUrl,
        systemPrompt: updated?.systemPrompt ?? normalized.systemPrompt,
      };

      setForm(nextState);
      setInitialForm(nextState);
      setSaveStatus('success');
      toast.success('Configuración guardada correctamente ✅');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar la configuración.';
      setSaveStatus('error');
      toast.error(message);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            WhatsApp Sales Agent
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configura el comportamiento y los datos del agente de ventas de WhatsApp para esta
            tienda.
          </p>
          {!loading && !config && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
              Aún no has creado la configuración. Completa los campos y guarda para activarla.
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving' || !isDirty || hasErrors}
          className="inline-flex items-center px-4 py-2 bg-fourth-base text-black rounded-lg hover:bg-fourth-base/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saveStatus === 'saving' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
          ) : saveStatus === 'success' ? (
            <CheckCircle className="h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saveStatus === 'saving' ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <span>{error.message}</span>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Activo
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Habilita o deshabilita el agente de ventas de WhatsApp.
            </p>
          </div>
          <label className="inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            <div className="relative w-11 h-6 bg-gray-300 dark:bg-gray-700 rounded-full peer peer-focus:outline-none peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {form.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            WhatsApp Number (E.164)
          </label>
          <input
            type="tel"
            value={form.whatsappNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
            onBlur={() =>
              setForm((prev) => ({
                ...prev,
                whatsappNumber: normalizeWhatsappNumber(prev.whatsappNumber),
              }))
            }
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
            placeholder="+573001234567"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Ej: +573001234567
            {normalizedWhatsAppPreview && normalizedWhatsAppPreview !== form.whatsappNumber
              ? ` · Se normaliza a: ${normalizedWhatsAppPreview}`
              : ''}
          </p>
          {showErrors && errors.whatsappNumber && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.whatsappNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Catalog URL
          </label>
          <input
            type="url"
            value={form.catalogUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, catalogUrl: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
            placeholder="https://..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">URL pública del catálogo</p>
          {showErrors && errors.catalogUrl && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.catalogUrl}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            System Prompt
          </label>
          <textarea
            ref={promptRef}
            value={form.systemPrompt}
            onChange={(e) => setForm((prev) => ({ ...prev, systemPrompt: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent resize-none overflow-hidden"
            rows={6}
          />
          <div className="flex items-center justify-between mt-2">
            {showErrors && errors.systemPrompt ? (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.systemPrompt}</p>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Campo requerido. Evita inventar precios o disponibilidad.
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {form.systemPrompt.length} caracteres
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
