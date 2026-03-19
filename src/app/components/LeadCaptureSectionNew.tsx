'use client';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { gql, useMutation } from '@apollo/client';
import { useState } from 'react';
import Image from 'next/image';

const REGISTER_MUTATION = gql`
  mutation CreateEntrepreneur($data: CreateEntrepreneurDto!) {
    createEntrepreneur(data: $data) {
      id
      companyName
      country
      city
      name
      description
      phone
      website
      email
      category
      createdAt
      referralSource
    }
  }
`;

const mappedValues = [
  { name: 'Tecnología', value: 'TECHNOLOGY' },
  { name: 'Comida', value: 'FOOD' },
  { name: 'Moda', value: 'RETAIL' },
  { name: 'Educación', value: 'EDUCATION' },
  { name: 'Salud', value: 'HEALTH' },
  { name: 'Otro', value: 'OTHER' },
];

const mappedReferralSources = [
  { name: 'Google', value: 'GOOGLE' },
  { name: 'Redes Sociales', value: 'SOCIAL_MEDIA' },
  { name: 'Amigo', value: 'FRIEND' },
  { name: 'Evento', value: 'EVENT' },
  { name: 'Publicidad', value: 'ADVERTISEMENT' },
  { name: 'Otro', value: 'OTHER' },
];

const LeadCaptureSectionNew = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const [registerBusiness, { data, loading, error }] = useMutation(REGISTER_MUTATION);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (formData: any) => {
    try {
      await registerBusiness({
        variables: {
          data: {
            ...formData,
            category: formData.category,
            referralSource: formData.referralSource,
          },
        },
      });
      setSuccess(true);
      reset();
    } catch (e) {
      console.error('Error registering business:', e);
      setSuccess(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url(/images/hero/bg-shape.png)] bg-center bg-no-repeat bg-cover opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-fourth-base/10 via-blue-600/10 to-purple-600/10"></div>

      <div className="container relative mx-auto px-4 py-12">
        <motion.div
          className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Left Side - Orange Full Height Modern Background, No Images */}
          <motion.div
            className="relative flex flex-col justify-center items-center h-full min-h-[600px] rounded-3xl shadow-2xl bg-transparent to-yellow-300"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col justify-center items-center h-full w-full px-8 py-12">
              <motion.h2
                className="text-4xl lg:text-5xl font-extrabold text-white mb-6 drop-shadow-lg text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                viewport={{ once: true }}
              >
                ¡Impulsa tu emprendimiento!
              </motion.h2>
              <motion.p
                className="text-xl lg:text-2xl text-white/90 mb-8 text-center max-w-md"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                viewport={{ once: true }}
              >
                Únete a la comunidad Emprendy.ai y accede a beneficios exclusivos, soporte IA y
                crecimiento acelerado.
              </motion.p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/20 rounded-xl px-6 py-4 text-white font-semibold text-lg shadow-md text-center">
                  🚀 Crecimiento acelerado
                </div>
                <div className="bg-white/20 rounded-xl px-6 py-4 text-white font-semibold text-lg shadow-md text-center">
                  🤖 IA incluida gratis
                </div>
                <div className="bg-white/20 rounded-xl px-6 py-4 text-white font-semibold text-lg shadow-md text-center">
                  🌎 Marketplace global
                </div>
                <div className="bg-white/20 rounded-xl px-6 py-4 text-white font-semibold text-lg shadow-md text-center">
                  💬 Chatbot WhatsApp
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Registration Form */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/20">
              {/* Header */}
              <div className="text-center mb-8">
                <motion.h2
                  className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  Registra tu{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-fourth-base to-blue-600">
                    Emprendimiento
                  </span>
                </motion.h2>
                <p className="text-slate-600 text-lg mb-6">
                  Únete a comunidad de emprendedores exitosos
                </p>

                {/* Special Offer Badge */}
                <motion.div
                  className="inline-flex items-center bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🎁 Registro GRATIS por tiempo limitado
                </motion.div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Company Name & Personal Name */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2 text-slate-700">
                      Nombre Emprendimiento *
                    </label>
                    <input
                      {...register('companyName', { required: true })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent transition-all"
                      placeholder="Mi emprendimiento"
                    />
                    {errors.companyName && (
                      <span className="text-red-500 text-xs mt-1 block">Requerido</span>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold mb-2 text-slate-700">Tu Nombre *</label>
                    <input
                      {...register('name', { required: true })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent transition-all"
                      placeholder="Tu nombre completo"
                    />
                    {errors.name && (
                      <span className="text-red-500 text-xs mt-1 block">Requerido</span>
                    )}
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2 text-slate-700">Email *</label>
                    <input
                      type="email"
                      {...register('email', { required: true })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent transition-all"
                      placeholder="correo@ejemplo.com"
                    />
                    {errors.email && (
                      <span className="text-red-500 text-xs mt-1 block">Requerido</span>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold mb-2 text-slate-700">WhatsApp *</label>
                    <input
                      {...register('phone', { required: true })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent transition-all"
                      placeholder="+573001234567"
                    />
                    {errors.phone && (
                      <span className="text-red-500 text-xs mt-1 block">Requerido</span>
                    )}
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="block font-semibold mb-2 text-slate-700">Sitio Web</label>
                  <input
                    {...register('website')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent transition-all"
                    placeholder="https://miemprendimiento.com (opcional)"
                  />
                </div>

                {/* Category & Location */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2 text-slate-700">Categoría *</label>
                    <select
                      {...register('category', { required: true })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent transition-all"
                    >
                      <option value="">Selecciona categoría</option>
                      {mappedValues.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <span className="text-red-500 text-xs mt-1 block">Requerido</span>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold mb-2 text-slate-700">País/Ciudad *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        {...register('country', { required: true })}
                        className="w-full px-3 py-3 rounded-xl border border-slate-200 text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent transition-all text-sm"
                        placeholder="Colombia"
                      />
                      <input
                        {...register('city', { required: true })}
                        className="w-full px-3 py-3 rounded-xl border border-slate-200 text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent transition-all text-sm"
                        placeholder="Bogotá"
                      />
                    </div>
                    {(errors.country || errors.city) && (
                      <span className="text-red-500 text-xs mt-1 block">Ambos requeridos</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-semibold mb-2 text-slate-700">Descripción *</label>
                  <textarea
                    {...register('description', { required: true })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent transition-all resize-none"
                    placeholder="Describe brevemente tu emprendimiento..."
                  />
                  {errors.description && (
                    <span className="text-red-500 text-xs mt-1 block">Requerido</span>
                  )}
                </div>

                {/* Referral Source */}
                <div>
                  <label className="block font-semibold mb-2 text-slate-700">
                    ¿Cómo nos encontraste? *
                  </label>
                  <select
                    {...register('referralSource', { required: true })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent transition-all"
                  >
                    <option value="">Selecciona una opción</option>
                    {mappedReferralSources.map((referral) => (
                      <option key={referral.value} value={referral.value}>
                        {referral.name}
                      </option>
                    ))}
                  </select>
                  {errors.referralSource && (
                    <span className="text-red-500 text-xs mt-1 block">Requerido</span>
                  )}
                </div>

                {/* Terms and Conditions Checkbox */}
                <div className="pt-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      {...register('acceptTerms', { required: true })}
                      className="mt-1 w-4 h-4 text-fourth-base bg-gray-100 border-gray-300 rounded focus:ring-fourth-base focus:ring-2"
                      id="acceptTerms"
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-slate-700 leading-relaxed">
                      He leído y acepto los{' '}
                      <a
                        href="/terms"
                        target="_blank"
                        className="text-fourth-base hover:text-blue-600 underline font-medium"
                      >
                        Términos y Condiciones
                      </a>{' '}
                      y el{' '}
                      <a
                        href="/privacy"
                        target="_blank"
                        className="text-fourth-base hover:text-blue-600 underline font-medium"
                      >
                        Tratamiento de Datos Personales
                      </a>
                      . Autorizo el tratamiento de mis datos para fines comerciales y de contacto.
                    </label>
                  </div>
                  {errors.acceptTerms && (
                    <span className="text-red-500 text-xs mt-1 block">
                      Debes aceptar los términos y condiciones para continuar
                    </span>
                  )}
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-fourth-base to-blue-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                      Registrando...
                    </div>
                  ) : (
                    <>🚀 Registrar mi Emprendimiento GRATIS</>
                  )}
                </motion.button>

                {/* Success/Error Messages */}
                {success && (
                  <motion.div
                    className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    🎉 ¡Registro exitoso! Te contactaremos pronto.
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    ❌ Error: {error.message}
                  </motion.div>
                )}

                {/* Trust Indicators */}
                <div className="text-center pt-4 border-t border-slate-200 text-black">
                  <p className="text-sm text-slate-500 mb-2">
                    🔒 100% Seguro • 🛡️ Sin Spam • 📋 Datos Protegidos
                  </p>
                  <p className="text-xs text-slate-400">
                    Tus datos están seguros y protegidos según nuestra política de privacidad
                  </p>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default LeadCaptureSectionNew;
