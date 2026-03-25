import React from 'react';
import Link from 'next/link';
import Switcher from '../components/switcher';
import BackToHome from '../components/back-to-home';

export default function SignupSuccessfull() {
  return (
    <>
      <section className="relative h-screen flex justify-center items-center bg-slate-50 dark:bg-slate-800">
        <div className="container relative">
          <div className="md:flex justify-center">
            <div className="lg:w-2/5">
              <div className="relative overflow-hidden rounded-md bg-white dark:bg-slate-900 shadow dark:shadow-gray-800">
                <div className="px-6 py-12 bg-emerald-600 text-center">
                  <i className="mdi mdi-check-circle text-white text-6xl"></i>
                  <h5 className="text-white text-xl tracking-wide uppercase font-semibold mt-2">
                    Éxito
                  </h5>
                </div>

                <div className="px-6 py-12 text-center">
                  <p className="text-black font-semibold text-xl dark:text-white">
                    ¡Felicidades! 🎉
                  </p>
                  <p className="text-slate-400 mt-4">
                    Tu cuenta ha sido creada exitosamente. <br /> Disfruta tu experiencia. ¡Gracias!
                  </p>

                  <div className="mt-6">
                    <Link
                      href="/"
                      className="py-2 px-5 inline-block tracking-wide align-middle duration-500 text-base text-center bg-fourth-base text-black rounded-md"
                    >
                      Continuar
                    </Link>
                  </div>
                </div>

                <div className="text-center p-6 border-t border-gray-100 dark:border-gray-700">
                  <p className="mb-0 text-slate-400">© {new Date().getFullYear()} Emprendy.ai.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Switcher />
      <BackToHome />
    </>
  );
}
