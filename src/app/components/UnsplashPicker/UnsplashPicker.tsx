'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from './UnsplashPicker.module.css';
import { PickerPhoto, UnsplashSearchResult } from './types';
import { useDebouncedValue } from './useDebouncedValue';

// Resolved once at module level — NEXT_PUBLIC_* vars are inlined at build time.
const ENV_API_BASE = (process.env.NEXT_PUBLIC_REST_API_ENDPOINT ?? '').trim().replace(/\/$/, '');

interface UnsplashPickerProps {
  searchEndpoint?: string; // overrides the default derived from NEXT_PUBLIC_REST_API_ENDPOINT
  selectEndpoint?: string; // optional POST endpoint to persist selection
  perPage?: number;
  initialQuery?: string;
  onSelect?: (photo: PickerPhoto) => void;
}

export default function UnsplashPicker({
  searchEndpoint,
  selectEndpoint,
  perPage = 12,
  initialQuery = '',
  onSelect,
}: UnsplashPickerProps) {
  const searchUrl = useMemo(
    () => searchEndpoint ?? `${ENV_API_BASE}/unsplash/random`,
    [searchEndpoint]
  );
  const selectUrl = useMemo(
    () => selectEndpoint ?? `${ENV_API_BASE}/images/unsplash/select`,
    [selectEndpoint]
  );
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query, 350);

  const [results, setResults] = useState<PickerPhoto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim() === '') {
      setResults([]);
      setPage(1);
      setTotalPages(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setPage(1);

    const q = encodeURIComponent(debouncedQuery.trim());
    fetch(`${searchUrl}?q=${q}&page=1&perPage=${perPage}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: UnsplashSearchResult) => {
        // Normalize backend response ({ id, url, thumbUrl, author, alt })
        // or Unsplash API response (results[].urls, user.name, alt_description)
        const rawResults = data.results || [];
        const normalized: PickerPhoto[] = rawResults.map((r: any) => {
          if (r.url) {
            return {
              id: r.id,
              url: r.url,
              thumbUrl: r.thumbUrl || r.small || undefined,
              author: r.author || null,
              alt: r.alt || null,
              _raw: r,
            };
          }
          // fallback for Unsplash API shape
          return {
            id: r.id,
            url: r.urls?.regular || r.urls?.full || r.urls?.raw || '',
            thumbUrl: r.urls?.thumb || r.urls?.small,
            author: r.user?.name || r.user?.username || null,
            alt: r.alt_description || r.description || null,
            _raw: r,
          };
        });

        setResults(normalized);
        setTotalPages((data as any).totalPages ?? (data as any).total_pages ?? null);
      })
      .catch((err) => {
        console.error('Unsplash search error', err);
        setError('Error buscando imágenes');
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery, perPage, searchEndpoint]);

  function loadMore() {
    if (loading) return;
    const next = page + 1;
    setLoading(true);
    const q = encodeURIComponent(debouncedQuery.trim());
    fetch(`${searchUrl}?q=${q}&page=${next}&perPage=${perPage}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: UnsplashSearchResult) => {
        const rawResults = data.results || [];
        const normalized: PickerPhoto[] = rawResults.map((r: any) => {
          if (r.url) {
            return {
              id: r.id,
              url: r.url,
              thumbUrl: r.thumbUrl || r.small || undefined,
              author: r.author || null,
              alt: r.alt || null,
              _raw: r,
            };
          }
          return {
            id: r.id,
            url: r.urls?.regular || r.urls?.full || r.urls?.raw || '',
            thumbUrl: r.urls?.thumb || r.urls?.small,
            author: r.user?.name || r.user?.username || null,
            alt: r.alt_description || r.description || null,
            _raw: r,
          };
        });

        setResults((s) => [...s, ...normalized]);
        setPage(next);
        setTotalPages((data as any).totalPages ?? (data as any).total_pages ?? null);
      })
      .catch((err) => {
        console.error('Unsplash load more error', err);
        setError('Error cargando más imágenes');
      })
      .finally(() => setLoading(false));
  }

  function handleSelect(photo: PickerPhoto) {
    if (selectUrl) {
      // Attempt to persist selection; don't block UI on failure
      fetch(selectUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId: photo.id,
          url: photo.url || photo._raw?.urls?.regular || '',
          thumbUrl: photo.thumbUrl || photo._raw?.urls?.thumb || undefined,
          author: photo.author || photo._raw?.user?.name || undefined,
        }),
      }).catch((err) => console.warn('Select persist failed', err));
    }

    if (onSelect) onSelect(photo);
  }

  return (
    <div className={styles.root}>
      <div className={styles.searchRow}>
        <input
          className={styles.input}
          placeholder="Buscar en Unsplash..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className={styles.btn}
          onClick={() => {
            setQuery('');
          }}
        >
          Limpiar
        </button>
      </div>

      {loading && results.length === 0 && <div className={styles.loading}>Buscando...</div>}

      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && results.length === 0 && debouncedQuery && (
        <div className={styles.empty}>No se encontraron imágenes.</div>
      )}

      <div className={styles.grid}>
        {results.map((p) => (
          <div key={p.id} className={styles.card}>
            <img className={styles.thumb} src={p.thumbUrl || p.url} alt={p.alt ?? ''} />
            <div className={styles.meta}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.author ?? p._raw?.user?.name ?? 'Unsplash'}
              </div>
              <button
                className={styles.btn}
                style={{ background: 'black', color: 'white' }}
                onClick={() => handleSelect(p)}
              >
                Seleccionar
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages && page < totalPages && (
        <div className={styles.loadMoreRow}>
          <button className={styles.btn} onClick={loadMore} disabled={loading}>
            {loading ? 'Cargando...' : 'Cargar más'}
          </button>
        </div>
      )}
    </div>
  );
}
