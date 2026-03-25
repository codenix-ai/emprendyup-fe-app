'use client';

import Image from 'next/image';
import Link from 'next/link';

import BackToHome from './back-to-home';

type AppErrorStateProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
  showReloadButton?: boolean;
  onReload?: () => void;
};

export function AppErrorState({
  title = 'Ocurrio un error inesperado',
  message = 'Tuvimos un problema al renderizar esta pantalla. Puedes volver al inicio o intentar de nuevo.',
  actionLabel = 'Volver al inicio',
  actionHref = '/',
  showReloadButton = false,
  onReload,
}: AppErrorStateProps) {
  return (
    <>
      <section className="relative bg-fourth-base/5">
        <div className="container-fluid relative">
          <div className="grid grid-cols-1">
            <div className="flex min-h-screen flex-col justify-center px-4 py-10 md:px-10">
              <div className="text-center">
                <Link href="/" data-testid="error-home-link">
                  <Image
                    src="/images/logo.svg"
                    width={114}
                    height={22}
                    className="mx-auto block dark:hidden"
                    alt="Logo de Emprendy.ai"
                  />
                  <Image
                    src="/images/logo.svg"
                    width={114}
                    height={22}
                    className="mx-auto hidden dark:block"
                    alt="Logo de Emprendy.ai"
                  />
                </Link>
              </div>

              <div className="title-heading my-auto text-center">
                <Image
                  src="/images/error.svg"
                  width={288}
                  height={219}
                  className="mx-auto w-72"
                  alt="Ilustracion de error"
                />
                <h1 className="mb-6 mt-8 text-3xl font-bold md:text-5xl">{title}</h1>
                <p className="text-slate-400">{message}</p>

                <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href={actionHref}
                    data-testid="error-primary-action"
                    className="inline-block rounded-md border border-fourth-base bg-fourth-base px-5 py-2 text-base font-semibold tracking-wide text-white duration-500 hover:border-fourth-200 hover:bg-fourth-200"
                  >
                    {actionLabel}
                  </Link>

                  {showReloadButton ? (
                    <button
                      type="button"
                      onClick={onReload}
                      data-testid="error-retry-button"
                      className="inline-block rounded-md border border-slate-200 px-5 py-2 text-base font-semibold tracking-wide text-slate-700 duration-500 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Reintentar
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="text-center">
                <p className="mb-0 text-slate-400">© {new Date().getFullYear()} Emprendy.ai.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <BackToHome />
    </>
  );
}
