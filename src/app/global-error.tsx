'use client';

import './assets/scss/tailwind.scss';
import './assets/css/materialdesignicons.css';
import { AppErrorState } from './components/AppErrorState';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return (
    <html lang="es">
      <body>
        <AppErrorState
          title="La aplicacion encontro un problema"
          message="Se produjo un error critico al cargar la pagina. Puedes intentar nuevamente o volver al inicio."
          showReloadButton
          onReload={reset}
        />
      </body>
    </html>
  );
}
