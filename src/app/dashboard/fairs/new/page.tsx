'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { fairsApi } from '@/lib/api/fairs';

function toIsoFromDatetimeLocal(value: string): string {
  // value like '2026-02-04T09:00'
  const d = new Date(value);
  return d.toISOString();
}

export default function NewFairPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !startsAt || !endsAt) {
      toast.error('Completa nombre, inicio y fin');
      return;
    }

    const startIso = toIsoFromDatetimeLocal(startsAt);
    const endIso = toIsoFromDatetimeLocal(endsAt);

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      toast.error('La fecha fin debe ser posterior al inicio');
      return;
    }

    setSaving(true);
    try {
      const fair = await fairsApi.createFair({
        name: name.trim(),
        startsAt: startIso,
        endsAt: endIso,
      });
      toast.success('Feria creada');
      router.push(`/dashboard/fairs/${fair.id}/sell`);
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo crear la feria');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-lg p-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
            Crear feria
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Nombre y rango de fechas</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Feria San Valentín"
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-3 text-base text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Inicio
            </label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-3 text-base text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Fin</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-3 text-base text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-base font-semibold bg-fourth-base text-black disabled:opacity-60"
        >
          <Save className="h-5 w-5" />
          {saving ? 'Creando…' : 'Crear feria'}
        </button>
      </form>
    </div>
  );
}
