'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Calendar, History, Plus, RefreshCcw } from 'lucide-react';
import { Fair, fairsApi } from '@/lib/api/fairs';

type TabKey = 'active' | 'history';

function formatDateRange(startsAt?: string, endsAt?: string): string {
  const start = startsAt ? new Date(startsAt) : null;
  const end = endsAt ? new Date(endsAt) : null;
  const fmt = new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  if (start && end) return `${fmt.format(start)} → ${fmt.format(end)}`;
  if (start) return fmt.format(start);
  return '';
}

function getFairStatusLabel(fair: Fair): { label: string; tone: 'green' | 'gray' | 'red' } {
  const raw = (fair.status || '').toUpperCase();
  if (raw.includes('ACTIVE') || raw.includes('RUNNING') || fair.isActive === true) {
    return { label: 'Activa', tone: 'green' };
  }
  if (raw.includes('CLOSED') || fair.closedAt) return { label: 'Cerrada', tone: 'gray' };
  if (raw) return { label: raw, tone: 'gray' };
  return { label: '—', tone: 'gray' };
}

function StatusPill({ fair }: { fair: Fair }) {
  const s = getFairStatusLabel(fair);
  const cls =
    s.tone === 'green'
      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20'
      : s.tone === 'red'
        ? 'bg-red-500/15 text-red-800 dark:text-red-200 border border-red-500/20'
        : 'bg-slate-500/15 text-slate-800 dark:text-slate-200 border border-slate-500/20';
  return <span className={`px-2 py-1 text-xs rounded-full ${cls}`}>{s.label}</span>;
}

export default function FairsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'active';

  const [tab, setTab] = useState<TabKey>(initialTab);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Fair[]>([]);

  const title = useMemo(() => (tab === 'active' ? 'Ferias Activas' : 'Historial de Ferias'), [tab]);

  async function load() {
    setLoading(true);
    try {
      const data =
        tab === 'active' ? await fairsApi.listActiveFairs() : await fairsApi.listMyFairs();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e?.message || 'No se pudieron cargar las ferias');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const tabSubtitle = tab === 'active' ? 'Ferias activas' : 'Historial';

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header / Controls */}
      <div className="rounded-3xl border border-gray-200/70 dark:border-gray-700/70 bg-white/80 dark:bg-gray-800/60 backdrop-blur p-4 md:p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
                Ferias
              </h1>
              <span className="hidden sm:inline text-xs px-2 py-1 rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-200 border border-slate-500/15">
                {tabSubtitle}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{title}</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200/70 dark:border-gray-700/70"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/dashboard/fairs/new')}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-fourth-base text-black"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Crear feria</span>
              <span className="sm:hidden">Crear</span>
            </button>
          </div>
        </div>

        {/* Segmented Tabs */}
        <div className="mt-4 p-1 rounded-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200/70 dark:border-gray-700/70 grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setTab('active')}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
              tab === 'active'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/60'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Activas
          </button>

          <button
            type="button"
            onClick={() => setTab('history')}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
              tab === 'history'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/60'
            }`}
          >
            <History className="h-4 w-4" />
            Historial
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{loading ? 'Actualizando…' : `${items.length} feria(s)`}</span>
          <span className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Activa
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Cerrada / Otro
            </span>
          </span>
        </div>
      </div>

      {/* List */}
      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="grid gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 animate-pulse"
              >
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="mt-2 h-3 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="mt-4 h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-fourth-base/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-6 w-6 text-fourth-base" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {tab === 'active' ? 'No tienes ferias activas' : 'Aún no hay ferias registradas'}
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {tab === 'active'
                    ? 'Crea una feria y empieza a registrar ventas en modo móvil.'
                    : 'Tus ferias cerradas aparecerán aquí con su historial.'}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/fairs/new')}
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold bg-fourth-base text-black"
                  >
                    <Plus className="h-4 w-4" />
                    Crear feria
                  </button>
                  <button
                    type="button"
                    onClick={load}
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200/70 dark:border-gray-700/70"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          items.map((fair) => (
            <div
              key={fair.id}
              className="rounded-3xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {fair.name || 'Feria'}
                    </h3>
                    <StatusPill fair={fair} />
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {formatDateRange(fair.startsAt, fair.endsAt)}
                  </p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Link
                    href={`/dashboard/fairs/${fair.id}`}
                    className="inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    Detalle
                  </Link>
                  {tab === 'active' && (
                    <Link
                      href={`/dashboard/fairs/${fair.id}/sell`}
                      className="inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold bg-fourth-base text-black"
                    >
                      Vender
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
