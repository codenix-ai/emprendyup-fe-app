'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { gql, useMutation } from '@apollo/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Check } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import GoogleOAuthProvider from '../components/GoogleOAuthProvider';
import { handleGoogleSignup, parseGoogleCredential } from '@/lib/utils/googleAuth';

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        email
        name
        storeId
      }
      access_token
    }
  }
`;

type PolicyCheck = { label: string; pass: boolean };

function PasswordStrength({ password }: { password: string }) {
  const checks: PolicyCheck[] = [
    { label: 'Mínimo 8 caracteres', pass: password.length >= 8 },
    { label: 'Una letra mayúscula', pass: /[A-Z]/.test(password) },
    { label: 'Una letra minúscula', pass: /[a-z]/.test(password) },
    { label: 'Un número', pass: /\d/.test(password) },
    { label: 'Un carácter especial (!@#$%)', pass: /[\W_]/.test(password) },
  ];
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1">
      {checks.map((c) => (
        <li
          key={c.label}
          className={`flex items-center gap-1.5 text-xs ${c.pass ? 'text-green-400' : 'text-slate-500'}`}
        >
          <Check size={11} className={c.pass ? 'text-green-400' : 'text-slate-600'} />
          {c.label}
        </li>
      ))}
    </ul>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [storeId] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPwHints, setShowPwHints] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [registerMutation] = useMutation(REGISTER_MUTATION);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const oauthError = searchParams.get('error');
    const message = searchParams.get('message');
    if (oauthError) {
      const errorMessages: Record<string, string> = {
        oauth_cancelled: 'Has cancelado el registro con Google.',
        no_authorization_code: 'Error de autorización con Google.',
        oauth_not_configured: 'Google OAuth no está configurado correctamente.',
        token_exchange_failed: 'Error al intercambiar el token de Google.',
        profile_fetch_failed: 'Error al obtener tu perfil de Google.',
        backend_not_configured: 'Backend no configurado.',
        backend_auth_failed: 'Error de autenticación en el servidor.',
        unexpected_error: 'Error inesperado durante el registro con Google.',
      };
      setError(errorMessages[oauthError] || message || 'Error desconocido');
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const redirectAfterAuth = (user: {
    role?: string;
    storeId?: string | null;
    restaurantId?: string | null;
    serviceProviderId?: string | null;
  }) => {
    const hasBusiness = user.storeId || user.restaurantId || user.serviceProviderId;
    if (user.role === 'ADMIN' || hasBusiness) {
      if (user.serviceProviderId) {
        router.push('/dashboard/service-dashboard');
      } else {
        router.push('/dashboard/insights');
      }
    } else {
      router.push('/dashboard/store/new');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setShowToast(false);

    if (!acceptTerms) {
      setError('Debes aceptar los Términos y Condiciones.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('La contraseña no cumple los requisitos de seguridad.');
      setShowPwHints(true);
      return;
    }

    setLoading(true);
    try {
      const { data } = await registerMutation({
        variables: { input: { name, email, password, storeId: storeId || null } },
      });
      if (!data?.register?.user?.id) throw new Error('Error en el registro');
      if (data.register.access_token)
        localStorage.setItem('accessToken', data.register.access_token);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push(`/otp-confirmation?email=${encodeURIComponent(email)}`);
      }, 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignupSuccess = async (credentialResponse: CredentialResponse) => {
    setError('');
    setSuccess('');
    setGoogleLoading(true);
    try {
      const tokens = parseGoogleCredential(credentialResponse);
      const response = await handleGoogleSignup(tokens);
      if (response.success && response.user) {
        if (response.access_token) localStorage.setItem('accessToken', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setSuccess('Registro con Google exitoso. Redirigiendo...');
        setTimeout(() => redirectAfterAuth(response.user!), 900);
      } else {
        if (
          response.message?.includes('User already exists') ||
          response.message?.includes('already registered')
        ) {
          setError('Ya existe una cuenta con este correo. Por favor inicia sesión.');
        } else if (response.message?.includes('token validation')) {
          setError('Error al validar el token de Google. Por favor intenta nuevamente.');
        } else {
          setError(response.error || response.message || 'Error al registrarse con Google');
        }
      }
    } catch {
      setError('Error al procesar el registro con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const onGoogleSignupError = () => {
    setError('Error al registrarse con Google. Por favor intenta nuevamente.');
    setGoogleLoading(false);
  };

  return (
    <GoogleOAuthProvider>
      <section className="min-h-screen flex bg-black">
        {/* ── Left panel – decorative image ───────────────────────── */}
        <div className="relative hidden md:flex md:w-1/2 lg:w-[45%] flex-col justify-end overflow-hidden">
          <Image
            src="/images/ab2.jpg"
            fill
            priority
            className="object-cover"
            alt="Emprendedora trabajando"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40" />
          <div className="relative z-10 p-10 pb-14">
            <Link
              href="/"
              className="inline-flex items-center gap-2 mb-8"
              aria-label="Volver al inicio"
            >
              <Image src="/images/logo.svg" width={40} height={40} alt="Emprendy.ai" />
              <span className="text-white font-bold text-xl">Emprendy.ai</span>
            </Link>
            <blockquote className="text-white">
              <p className="text-2xl font-semibold leading-snug max-w-sm">
                &ldquo;Miles de emprendedores ya están haciendo crecer su negocio con
                nosotros.&rdquo;
              </p>
              <footer className="mt-4 text-white/60 text-sm">
                Únete hoy, es completamente gratis
              </footer>
            </blockquote>
          </div>
        </div>

        {/* ── Right panel – form ──────────────────────────────────── */}
        <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 xl:px-16 bg-[#0d0d0d] overflow-y-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors w-fit"
          >
            <ArrowLeft size={16} />
            Volver al inicio
          </Link>

          <motion.div
            className="w-full max-w-sm mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            {/* Mobile logo */}
            <div className="md:hidden flex justify-center mb-6">
              <Image src="/images/logo.svg" width={44} height={44} alt="Emprendy.ai" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-1">Crea tu cuenta gratis</h1>
            <p className="text-slate-400 text-sm mb-7">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-fourth-base hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>

            {/* Alerts */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                  role="alert"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="mb-5 flex items-start gap-2.5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400"
                  role="status"
                >
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="RegisterName"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Nombre completo
                </label>
                <input
                  id="RegisterName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  autoComplete="name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition focus:border-fourth-base focus:ring-2 focus:ring-fourth-base/30"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="RegisterEmail"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Correo electrónico
                </label>
                <input
                  id="RegisterEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@gmail.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition focus:border-fourth-base focus:ring-2 focus:ring-fourth-base/30"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="RegisterPassword"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="RegisterPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setShowPwHints(true);
                    }}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-11 text-white placeholder-slate-500 text-sm outline-none transition focus:border-fourth-base focus:ring-2 focus:ring-fourth-base/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {showPwHints && <PasswordStrength password={password} />}
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="RegisterConfirmPassword"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    id="RegisterConfirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 pr-11 text-white placeholder-slate-500 text-sm outline-none transition focus:ring-2 ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30'
                        : 'border-white/10 focus:border-fourth-base focus:ring-fourth-base/30'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="mt-1 text-xs text-red-400">Las contraseñas no coinciden</p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="AcceptTerms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10 accent-fourth-base cursor-pointer"
                />
                <label
                  htmlFor="AcceptTerms"
                  className="text-slate-400 text-sm leading-snug cursor-pointer"
                >
                  Acepto los{' '}
                  <Link href="/terminos" className="text-fourth-base hover:underline">
                    Términos y Condiciones
                  </Link>{' '}
                  y la{' '}
                  <Link href="/politica-borrado-datos" className="text-fourth-base hover:underline">
                    Política de privacidad
                  </Link>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-fourth-base py-2.5 text-sm font-semibold text-black transition hover:bg-fourth-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Crear cuenta gratis'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0d0d0d] px-3 text-xs text-slate-500">o regístrate con</span>
              </div>
            </div>

            {/* Google */}
            <div className="flex justify-center">
              {googleLoading ? (
                <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm text-white">
                  <Loader2 size={16} className="animate-spin" />
                  Procesando...
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={onGoogleSignupSuccess}
                  onError={onGoogleSignupError}
                  useOneTap={false}
                  text="signup_with"
                  size="large"
                  width="100%"
                  theme="filled_black"
                />
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 max-w-sm"
          >
            <div className="flex items-start gap-3 rounded-xl bg-green-500 px-5 py-4 text-white shadow-xl">
              <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">¡Registro exitoso!</p>
                <p className="text-xs text-green-100 mt-0.5">
                  Revisa tu bandeja de entrada para verificar tu correo con el código OTP.
                </p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="ml-auto text-green-200 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <span aria-hidden>✕</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GoogleOAuthProvider>
  );
}

export default function Signup() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-fourth-base" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
