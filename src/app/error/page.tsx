import { AppErrorState } from '../components/AppErrorState';
import Switcher from '../components/switcher';

export default function ErrorPage() {
  return (
    <>
      <AppErrorState
        title="Pagina no encontrada"
        message="No encontramos la pagina que intentabas visitar. Puedes volver al inicio para seguir navegando."
      />
      <Switcher />
    </>
  );
}
