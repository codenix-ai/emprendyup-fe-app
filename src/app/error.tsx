'use client';

import { AppErrorState } from './components/AppErrorState';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return (
    <AppErrorState
      title="Ocurrio un error en la aplicacion"
      message="No pudimos completar esta vista. Intenta recargar el contenido o vuelve al inicio."
      showReloadButton
      onReload={reset}
    />
  );
}
