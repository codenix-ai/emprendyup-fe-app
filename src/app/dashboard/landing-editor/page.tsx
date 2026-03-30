// ─── Landing Editor Page ──────────────────────────────────────────────────────
// Server Component raíz — solo renderiza el client wrapper.
// Mantiene compatibilidad con el layout del dashboard (ApolloProvider ya presente).

import { LandingEditorClient } from '@/features/landing-editor/LandingEditorClient';

export const metadata = {
  title: 'Editor de Landing Page | EmprendYup',
};

export default function LandingEditorPage() {
  return <LandingEditorClient />;
}
