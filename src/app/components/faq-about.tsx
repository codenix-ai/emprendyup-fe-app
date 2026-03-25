import React from 'react';
import Link from 'next/link';
import { faqAbout } from '../data/data';

export default function FaqAbout() {
  return (
    <>
      <div className="container relative">
        <div className="grid grid-cols-1 pb-8 text-center">
          <h3 className="mb-6 md:text-3xl text-2xl md:leading-normal leading-normal font-semibold">
            Encuentra la ayuda que necesitas
          </h3>

          <p className="text-slate-400 max-w-xl mx-auto">
            Con Emprendy.ai, tienes acceso a una amplia gama de recursos y soporte para ayudarte a
            resolver cualquier duda o problema que puedas tener. Desde preguntas frecuentes hasta
            asistencia personalizada, estamos aquí para asegurarnos de que tu experiencia sea lo más
            fluida posible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 mt-6 gap-6">
          {faqAbout.map((item, index) => {
            let Icon = item.icon;
            return (
              <div className="text-center px-6 mt-6" key={index}>
                <div className="w-20 h-20 bg-fourth-base/5 text-fourth-base rounded-xl text-3xl flex align-middle justify-center items-center shadow-sm dark:shadow-gray-800 mx-auto">
                  <Icon className="size-[30px]"></Icon>
                </div>

                <div className="content mt-7">
                  <Link
                    href="/helpcenter-faqs"
                    className="title h5 text-lg font-medium hover:text-fourth-base"
                  >
                    {item.title}
                  </Link>
                  <p className="text-slate-400 mt-3">{item.desc}</p>

                  <div className="mt-5">
                    <Link href="/helpcenter-faqs" className="text-fourth-base">
                      Leer más <i className="mdi mdi-chevron-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
