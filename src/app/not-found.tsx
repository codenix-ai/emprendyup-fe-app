import { AppErrorState } from './components/AppErrorState';

export default function NotFound() {
  return (
    <AppErrorState
      title="Pagina no encontrada"
      message="La ruta que buscas no esta disponible. Puedes volver al inicio para continuar en Emprendy.ai."
    />
  );
}
