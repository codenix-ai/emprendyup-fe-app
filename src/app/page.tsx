'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { gql, useMutation } from '@apollo/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import GoogleOAuthProvider from './components/GoogleOAuthProvider';
import { handleGoogleLogin, parseGoogleCredential } from '@/lib/utils/googleAuth';

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      access_token
      user {
        id
        email
        name
        membershipLevel
        role
        createdAt
        updatedAt
        serviceProviderId
        restaurantId
        storeId
      }
    }
  }
`;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const oauthError = searchParams.get('error');
    const message = searchParams.get('message');
    if (oauthError) {
      const errorMessages: Record<string, string> = {
        oauth_cancelled: 'Has cancelado el inicio de sesión con Google.',
        no_authorization_code: 'Error de autorización con Google.',
        oauth_not_configured: 'Google OAuth no está configurado correctamente.',
        token_exchange_failed: 'Error al intercambiar el token de Google.',
        profile_fetch_failed: 'Error al obtener tu perfil de Google.',
        backend_not_configured: 'Backend no configurado.',
        backend_auth_failed: 'Error de autenticación en el servidor.',
        unexpected_error: 'Error inesperado durante el inicio de sesión con Google.',
        user_exists: message || 'Ya tienes una cuenta. Por favor inicia sesión.',
      };
      setError(errorMessages[oauthError] || 'Error desconocido');
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const redirectAfterLogin = (user: {
    role?: string;
    storeId?: string | null;
    restaurantId?: string | null;
    serviceProviderId?: string | null;
  }) => {
    const hasBusiness = user.storeId || user.restaurantId || user.serviceProviderId;
    if (user.role === 'ADMIN' || hasBusiness) {
      router.push('/dashboard/insights');
    } else {
      router.push('/dashboard/store/new');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await loginMutation({ variables: { input: { email, password } } });
      if (!data?.login?.access_token || !data?.login?.user)
        throw new Error('Credenciales inválidas');
      localStorage.setItem('accessToken', data.login.access_token);
      localStorage.setItem('user', JSON.stringify(data.login.user));
      setSuccess('Inicio de sesión exitoso. Redirigiendo...');
      setTimeout(() => redirectAfterLogin(data.login.user), 900);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error en el login');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    setError('');
    setSuccess('');
    setGoogleLoading(true);
    try {
      const tokens = parseGoogleCredential(credentialResponse);
      const response = await handleGoogleLogin(tokens);
      if (response.success && response.user) {
        if (response.access_token) localStorage.setItem('accessToken', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setSuccess('Inicio de sesión con Google exitoso. Redirigiendo...');
        setTimeout(() => redirectAfterLogin(response.user!), 900);
      } else {
        if (
          response.message?.includes('No account found') ||
          response.message?.includes('User not found')
        ) {
          setError('No se encontró una cuenta con este correo. Por favor regístrate primero.');
        } else if (response.message?.includes('User already exists')) {
          setError('Ya existe una cuenta con este correo.');
        } else if (response.message?.includes('token validation')) {
          setError('Error al validar el token de Google. Por favor intenta nuevamente.');
        } else {
          setError(response.error || response.message || 'Error al iniciar sesión con Google');
        }
      }
    } catch {
      setError('Error al procesar el inicio de sesión con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const onGoogleLoginError = () => {
    setError('Error al iniciar sesión con Google. Por favor intenta nuevamente.');
    setGoogleLoading(false);
  };

  return (
    <GoogleOAuthProvider>
      <section className="min-h-screen flex bg-black">
        {/* ── Left panel – decorative image ───────────────────────── */}
        <div className="relative hidden md:flex md:w-1/2 lg:w-[55%] flex-col justify-end overflow-hidden">
          <Image
            src="/images/ab1.jpg"
            fill
            priority
            className="object-cover"
            alt="Emprendedores trabajando"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40" />

          {/* Brand tagline on image */}
          <div className="relative z-10 p-10 pb-14">
            <div className="inline-flex items-center gap-2 mb-8">
              <Image src="/images/logo.svg" width={40} height={40} alt="Emprendy.ai" />
              <span className="text-white font-bold text-xl">Emprendy.ai</span>
            </div>
            <blockquote className="text-white">
              <p className="text-2xl font-semibold leading-snug max-w-sm">
                &ldquo;Impulsa tu negocio con IA, tecnología y una comunidad que te respalda.&rdquo;
              </p>
              <footer className="mt-4 text-white/60 text-sm">
                La plataforma para emprendedores que quieren escalar
              </footer>
            </blockquote>
          </div>
        </div>

        {/* ── Right panel – form ──────────────────────────────────── */}
        <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-20 bg-[#0d0d0d]">
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

            <h1 className="text-2xl font-bold text-white mb-1">Bienvenido de nuevo</h1>
            <p className="text-slate-400 text-sm mb-8">
              ¿No tienes cuenta?{' '}
              <Link href="/registrarse" className="text-fourth-base hover:underline font-medium">
                Regístrate gratis
              </Link>
            </p>

            {/* Alerts */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                role="alert"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400"
                role="status"
              >
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="LoginEmail"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Correo electrónico
                </label>
                <input
                  id="LoginEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@gmail.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none ring-0 transition focus:border-fourth-base focus:ring-2 focus:ring-fourth-base/30"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="LoginPassword"
                    className="block text-sm font-medium text-slate-300"
                  >
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => router.push('/olvido-contrasena')}
                    className="text-xs text-fourth-base hover:underline focus:outline-none"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="LoginPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-11 text-white placeholder-slate-500 text-sm outline-none ring-0 transition focus:border-fourth-base focus:ring-2 focus:ring-fourth-base/30"
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
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-fourth-base py-2.5 text-sm font-semibold text-black transition hover:bg-fourth-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0d0d0d] px-3 text-xs text-slate-500">o continúa con</span>
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
                  onSuccess={onGoogleLoginSuccess}
                  onError={onGoogleLoginError}
                  useOneTap={false}
                  text="signin_with"
                  size="large"
                  width="100%"
                  theme="filled_black"
                />
              )}
            </div>

            <p className="mt-8 text-center text-xs text-slate-600">
              Al continuar, aceptas nuestros{' '}
              <Link href="/terminos" className="text-slate-400 hover:text-white transition-colors">
                Términos de servicio
              </Link>{' '}
              y{' '}
              <Link
                href="/politica-borrado-datos"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Política de privacidad
              </Link>
              .
            </p>
          </motion.div>
        </div>
      </section>
    </GoogleOAuthProvider>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-fourth-base" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
