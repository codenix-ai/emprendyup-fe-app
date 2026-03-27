'use client';
import React, { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { LandingPreview } from '@/app/components/LandingEditor/LandingPreview';
import type { LandingPageConfig } from '@/app/components/LandingEditor/types';
import { createDefaultConfig } from '@/app/components/LandingEditor/types';

export default function LandingPreviewPage() {
  const params = useSearchParams();

  const config = useMemo<LandingPageConfig>(() => {
    const raw = params.get('config');
    if (!raw) return createDefaultConfig();
    try {
      return JSON.parse(decodeURIComponent(raw)) as LandingPageConfig;
    } catch {
      return createDefaultConfig();
    }
  }, [params]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          color: '#fff',
          fontSize: '11px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          padding: '8px 16px',
          borderBottomLeftRadius: '8px',
        }}
      >
        Vista previa · <span style={{ color: '#60a5fa' }}>No publicada</span>
      </div>
      <LandingPreview config={config} />
    </div>
  );
}
