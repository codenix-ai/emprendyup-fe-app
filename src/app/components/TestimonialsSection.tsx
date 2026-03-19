'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiStar, FiClock, FiZap, FiLink } from 'react-icons/fi';

const testimonials = [
  {
    name: 'María González',
    business: 'Artesanías Luna',
    location: 'Bogotá, Colombia',
    image: '/images/client/01.jpg',
    text: 'Gracias a Emprendy.ai aumenté mis ventas en un 300% en solo 3 meses. La comunidad es increíble y el apoyo constante.',
    rating: 5,
    revenue: '+$50M COP mensuales',
  },
  {
    name: 'Carlos Rodríguez',
    business: 'TechSolutions',
    location: 'Medellín, Colombia',
    image: '/images/client/02.jpg',
    text: 'El acompañamiento y las herramientas de IA me ayudaron a profesionalizar mi negocio completamente. Ahora tengo 15 empleados.',
    rating: 5,
    revenue: '+200% crecimiento anual',
  },
  {
    name: 'Ana Martín',
    business: 'Eco Productos',
    location: 'Cali, Colombia',
    image: '/images/client/03.jpg',
    text: 'La integración con el marketplace me abrió un mundo de nuevas oportunidades. Vendemos en toda Latinoamérica ahora.',
    rating: 5,
    revenue: '5x más ventas',
  },
  {
    name: 'Luis Fernando',
    business: 'Fitness Pro',
    location: 'Bucaramanga, Colombia',
    image: '/images/client/04.jpg',
    text: 'La IA generativa me ahorra 20 horas semanales creando contenido. Puedo enfocarme en lo que realmente importa: mis clientes.',
    rating: 5,
    revenue: '+300 clientes nuevos',
  },
  {
    name: 'Isabella Torres',
    business: 'Moda Sostenible',
    location: 'Cartagena, Colombia',
    image: '/images/client/05.jpg',
    text: 'El chatbot de WhatsApp automatizó mi atención al cliente. Ahora puedo dormir tranquila sabiendo que mis ventas no paran.',
    rating: 5,
    revenue: '24/7 ventas automáticas',
  },
  {
    name: 'Ricardo Palacios',
    business: 'Café Origen',
    location: 'Manizales, Colombia',
    image: '/images/client/07.jpg',
    text: 'Las métricas en tiempo real me permiten tomar decisiones inteligentes. Pasé de vender local a exportar internacionalmente.',
    rating: 5,
    revenue: 'Exportando a 8 países',
  },
  {
    name: 'Camila Restrepo',
    business: 'Dulces Artesanales',
    location: 'Pereira, Colombia',
    image: '/images/client/16.jpg',
    text: 'La comunidad de Emprendy.ai es como una familia. Constantemente aprendemos unos de otros y crecemos juntos.',
    rating: 5,
    revenue: 'Red de 50+ socios',
  },
];

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1));
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Get 3 testimonials to show (current and neighbors)
  const getVisibleTestimonials = () => {
    const testimonialsCopy = [...testimonials];
    const result = [];

    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % testimonials.length;
      result.push({ ...testimonialsCopy[index], originalIndex: index });
    }

    return result;
  };

  const visibleTestimonials = getVisibleTestimonials();

  return (
    <section className="relative py-16 md:py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Emprendedores exitosos que ya hacen parte de nuestra comunidad
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Historias reales de crecimiento, éxito y transformación digital de nuestra comunidad en
            toda Latinoamérica
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div
          className="relative max-w-7xl mx-auto"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Main Carousel */}
          <div className="relative overflow-hidden rounded-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                className="grid md:grid-cols-3 gap-6 md:gap-8"
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                {visibleTestimonials.map((testimonial, index) => (
                  <motion.div
                    key={`${testimonial.originalIndex}-${index}`}
                    className={`relative bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 ${
                      index === 1 ? 'md:scale-105 md:shadow-2xl z-10' : ''
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -10, transition: { duration: 0.3 } }}
                  >
                    {/* Rating Stars */}
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                        >
                          <FiStar className="w-5 h-5 text-yellow-400 fill-current" />
                        </motion.div>
                      ))}
                    </div>

                    {/* Testimonial Text */}
                    <blockquote className="text-slate-700 dark:text-slate-300 mb-6 text-lg leading-relaxed">
                      &quot;{testimonial.text}&quot;
                    </blockquote>

                    {/* Revenue/Growth Indicator */}
                    <div className="mb-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        📈 {testimonial.revenue}
                      </span>
                    </div>

                    {/* Author Info */}
                    <div className="flex items-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <Image
                          src={testimonial.image}
                          width={60}
                          height={60}
                          alt={testimonial.name}
                          className="w-16 h-16 rounded-full object-cover border-3 border-fourth-base mr-4"
                        />
                      </motion.div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                          {testimonial.name}
                        </h4>
                        <p className="text-fourth-base font-semibold">{testimonial.business}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          📍 {testimonial.location}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevTestimonial}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-slate-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-20"
            aria-label="Testimonio anterior"
          >
            <FiChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
          </button>

          <button
            onClick={nextTestimonial}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-slate-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-20"
            aria-label="Siguiente testimonio"
          >
            <FiChevronRight className="w-6 h-6 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-8 space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-fourth-base scale-125'
                  : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
              }`}
              aria-label={`Ir al testimonio ${index + 1}`}
            />
          ))}
        </div>
        {/* Value claims (show before numeric stats) */}
        <div className="mt-8 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
            <FiClock className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <h4 className="font-semibold text-lg text-slate-900 dark:text-white">Ahorra tiempo</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Ahorra hasta 20 horas/semana con automatizaciones y plantillas.
            </p>
          </div>
          <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
            <FiZap className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <h4 className="font-semibold text-lg text-slate-900 dark:text-white">
              Resultados rápidos
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Resultados visibles en 6–8 semanas con el plan piloto.
            </p>
          </div>
          <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
            <FiLink className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h4 className="font-semibold text-lg text-slate-900 dark:text-white">
              Fácil integración
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Integrado con WhatsApp, Shopify y pasarelas locales.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="text-center">
            <motion.h3
              className="text-3xl md:text-4xl font-bold text-fourth-base mb-2"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 100, delay: 0.5 }}
              viewport={{ once: true }}
            >
              50+
            </motion.h3>
            <p className="text-slate-600 dark:text-slate-400">Emprendedores Activos</p>
          </div>
          <div className="text-center">
            <motion.h3
              className="text-3xl md:text-4xl font-bold text-fourth-base mb-2"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 100, delay: 0.6 }}
              viewport={{ once: true }}
            >
              98%
            </motion.h3>
            <p className="text-slate-600 dark:text-slate-400">Satisfacción</p>
          </div>
          <div className="text-center">
            <motion.h3
              className="text-3xl md:text-4xl font-bold text-fourth-base mb-2"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 100, delay: 0.7 }}
              viewport={{ once: true }}
            >
              300%
            </motion.h3>
            <p className="text-slate-600 dark:text-slate-400">Crecimiento Promedio</p>
          </div>
          <div className="text-center">
            <motion.h3
              className="text-3xl md:text-4xl font-bold text-fourth-base mb-2"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 100, delay: 0.8 }}
              viewport={{ once: true }}
            >
              3
            </motion.h3>
            <p className="text-slate-600 dark:text-slate-400 flex items-center justify-center md:justify-center">
              <span>Ciudades</span>
              <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800 dark:bg-yellow-600 dark:text-black">
                Beta
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
