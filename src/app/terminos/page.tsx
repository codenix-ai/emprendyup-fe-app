import React from 'react';
import Link from 'next/link';

import Navbar from '../components/NavBar/navbar';
import FaqTwo from '../components/faq-two';
import Footer from '../components/footer';
import Switcher from '../components/switcher';
import ScrollToTop from '../components/scroll-to-top';

export default function Terms() {
  return (
    <>
      <section className="relative table w-full py-32 lg:py-40 bg-gray-50 dark:bg-slate-800">
        <div className="container relative">
          <div className="grid grid-cols-1 text-center mt-10">
            <h3 className="text-3xl leading-normal font-semibold">Términos de Servicio</h3>
          </div>
        </div>

        <div className="absolute text-center z-10 bottom-5 start-0 end-0 mx-3">
          <ul className="tracking-[0.5px] mb-0 inline-block">
            <li className="inline-block uppercase text-[13px] font-bold duration-500 ease-in-out hover:text-fourth-base">
              <Link href="/">Emprendy.ai</Link>
            </li>
            <li className="inline-block text-base text-slate-950 dark:text-white mx-0.5 ltr:rotate-0 rtl:rotate-180">
              <i className="mdi mdi-chevron-right"></i>
            </li>
            <li
              className="inline-block uppercase text-[13px] font-bold text-fourth-base"
              aria-current="page"
            >
              Términos de Servicio
            </li>
          </ul>
        </div>
      </section>

      <section className="relative md:py-24 py-16">
        <div className="container relative">
          <div className="md:flex justify-center">
            <div className="md:w-3/4">
              <div className="p-6 bg-white dark:bg-slate-900 shadow dark:shadow-gray-800 rounded-md">
                <h5 className="text-xl font-semibold mb-4">
                  Última actualización: 25 de julio de 2025
                </h5>

                <h5 className="text-xl font-semibold mb-4 mt-8">1. Introducción</h5>
                <p className="text-slate-400">
                  Bienvenido a <b className="text-fourth-400">Emprendy.ai</b>. Al acceder y utilizar
                  nuestro sitio web, servicios o productos, aceptas cumplir con los siguientes
                  Términos de Servicio. Si no estás de acuerdo con alguno de ellos, por favor
                  abstente de usar la plataforma.
                </p>

                <h5 className="text-xl font-semibold mb-4 mt-8">2. Aceptación de los Términos</h5>
                <p className="text-slate-400">
                  Al registrarte, acceder o usar nuestros servicios, declaras que tienes al menos 18
                  años de edad y capacidad legal para aceptar estos Términos. Si usas la plataforma
                  en nombre de una empresa u organización, aceptas estos términos en representación
                  de dicha entidad.
                </p>

                <h5 className="text-xl font-semibold mb-4 mt-8">3. Registro de Usuario</h5>
                <ul className="list-disc list-inside text-slate-400">
                  <li>Debes proporcionar información veraz y actualizada al crear tu cuenta.</li>
                  <li>
                    Eres responsable de mantener la confidencialidad de tus credenciales de acceso.
                  </li>
                  <li>
                    Nos reservamos el derecho de suspender o eliminar cuentas que violen nuestros
                    términos.
                  </li>
                </ul>

                <h5 className="text-xl font-semibold mb-4 mt-8">4. Uso Aceptable</h5>
                <p className="text-slate-400">Está estrictamente prohibido:</p>
                <ul className="list-disc list-inside text-slate-400 mt-2">
                  <li>Usar Emprendy.ai con fines ilegales o no autorizados.</li>
                  <li>Distribuir virus, spam o software malicioso.</li>
                  <li>Violar los derechos de propiedad intelectual de terceros.</li>
                  <li>Manipular el contenido o servicios de la plataforma sin autorización.</li>
                </ul>

                <h5 className="text-xl font-semibold mb-4 mt-8">5. Propiedad Intelectual</h5>
                <p className="text-slate-400">
                  Todo el contenido, incluyendo textos, imágenes, logotipos, marcas y código fuente,
                  es propiedad de Emprendy.ai o de sus respectivos propietarios y está protegido por
                  las leyes de propiedad intelectual.
                </p>

                <h5 className="text-xl font-semibold mb-4 mt-8">6. Pagos y Transacciones</h5>
                <ul className="list-disc list-inside text-slate-400">
                  <li>Los precios y tarifas se encuentran claramente especificados.</li>
                  <li>Todas las transacciones son seguras y están protegidas mediante cifrado.</li>
                  <li>Emprendy.ai no almacena información confidencial de tarjetas de pago.</li>
                </ul>

                <h5 className="text-xl font-semibold mb-4 mt-8">7. Cancelaciones y Reembolsos</h5>
                <p className="text-slate-400">
                  Cada servicio o producto puede tener políticas específicas de cancelación o
                  reembolso. En caso de duda, contáctanos a{' '}
                  <a href="mailto:soporte@emprendyup.com" className="text-fourth-base underline">
                    soporte@emprendyup.com
                  </a>
                  .
                </p>

                <h5 className="text-xl font-semibold mb-4 mt-8">
                  8. Limitación de Responsabilidad
                </h5>
                <p className="text-slate-400">
                  Emprendy.ai no será responsable por daños indirectos, pérdida de ingresos o
                  interrupciones causadas por terceros, fallos técnicos o mal uso de la plataforma.
                </p>

                <h5 className="text-xl font-semibold mb-4 mt-8">
                  9. Modificaciones a los Términos
                </h5>
                <p className="text-slate-400">
                  Podemos actualizar estos Términos en cualquier momento. Notificaremos a los
                  usuarios registrados mediante correo electrónico o anuncio en la plataforma. El
                  uso continuo de los servicios implica aceptación de los cambios.
                </p>

                <h5 className="text-xl font-semibold mb-4 mt-8">10. Ley Aplicable</h5>
                <p className="text-slate-400">
                  Estos Términos se rigen por las leyes de Colombia. En caso de disputas, las partes
                  se someterán a los tribunales de la ciudad de Bogotá D.C.
                </p>

                <h5 className="text-xl font-semibold mb-4 mt-8">11. Contacto</h5>
                <p className="text-slate-400">
                  Si tienes preguntas sobre estos Términos, contáctanos a través de:
                </p>
                <ul className="text-slate-400 mt-2">
                  <li>
                    📧{' '}
                    <a href="mailto:soporte@emprendyup.com" className="text-fourth-base underline">
                      soporte@emprendyup.com
                    </a>
                  </li>
                  <li>
                    🌐{' '}
                    <a
                      href="https://www.emprendyup.com"
                      className="text-fourth-base underline"
                      target="_blank"
                    >
                      www.emprendyup.com
                    </a>
                  </li>
                </ul>

                <h5 className="text-xl font-semibold mt-10">Preguntas Frecuentes</h5>
                <FaqTwo />

                <div className="mt-6">
                  <Link
                    href="#"
                    className="py-2 px-5 inline-block font-semibold tracking-wide border align-middle duration-500 text-base text-center bg-fourth-base hover:bg-fourth-100 border-fourth-base hover:border-fourth-100 text-white rounded-md"
                  >
                    Acepto
                  </Link>
                  <Link
                    href="#"
                    className="py-2 px-5 inline-block font-semibold tracking-wide border align-middle duration-500 text-base text-center bg-transparent hover:bg-fourth-base border-fourth-base text-fourth-base hover:text-white rounded-md ms-2"
                  >
                    Rechazo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Switcher />
      <ScrollToTop />
    </>
  );
}
