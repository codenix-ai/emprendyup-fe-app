'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { gql, useMutation } from '@apollo/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import GoogleOAuthProvider from '../components/GoogleOAuthProvider';
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

  // Handle OAuth errors from URL params
  useEffect(() => {
    const oauthError = searchParams.get('error');
    const message = searchParams.get('message');

    if (oauthError) {
      const errorMessages = {
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
      setError(errorMessages[oauthError as keyof typeof errorMessages] || 'Error desconocido');

      // Clear the error from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await loginMutation({
        variables: {
          input: {
            email,
            password,
          },
        },
      });
      if (!data?.login?.access_token || !data?.login?.user) {
        throw new Error('Credenciales inválidas');
      }
      // Store access token and user data in localStorage
      localStorage.setItem('accessToken', data.login.access_token);
      localStorage.setItem('user', JSON.stringify(data.login.user));

      setSuccess('Inicio de sesión exitoso. Redirigiendo...');

      // Conditional redirect based on role
      setTimeout(() => {
        if (data.login.user.role === 'ADMIN') {
          router.push('/dashboard/insights');
        } else if (
          data.login.user.storeId ||
          data.login.user.restaurantId ||
          data.login.user.serviceProviderId
        ) {
          router.push('/dashboard/insights');
        } else {
          router.push('/dashboard/store/new');
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error en el login');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Login Success
  const onGoogleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    setError('');
    setSuccess('');
    setGoogleLoading(true);

    try {
      const tokens = parseGoogleCredential(credentialResponse);

      // Try login endpoint first
      const response = await handleGoogleLogin(tokens);

      if (response.success && response.user) {
        // Store tokens if provided
        if (response.access_token) {
          localStorage.setItem('accessToken', response.access_token);
        }
        localStorage.setItem('user', JSON.stringify(response.user));

        setSuccess('Inicio de sesión con Google exitoso. Redirigiendo...');

        // Redirect based on user status
        setTimeout(() => {
          if (response.user?.role === 'ADMIN') {
            router.push('/dashboard/insights');
          } else if (
            response.user?.storeId ||
            response.user?.restaurantId ||
            response.user?.serviceProviderId
          ) {
            router.push('/dashboard/insights');
          } else {
            router.push('/dashboard/store/new');
          }
        }, 1000);
      } else {
        // Handle backend errors
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
    } catch (err: any) {
      console.error('Google login error:', err);
      setError('Error al procesar el inicio de sesión con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Google Login Error
  const onGoogleLoginError = () => {
    setError('Error al iniciar sesión con Google. Por favor intenta nuevamente.');
    setGoogleLoading(false);
  };

  return (
    <GoogleOAuthProvider>
      <section className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-fourth-base/10 via-blue-50 to-green-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-full h-full bg-white dark:bg-black">
            <div className="grid md:grid-cols-2 grid-cols-1 items-center h-full">
              {/* Imagen lateral */}
              <div className="relative md:shrink-0 h-full">
                <Image
                  src="/images/ab1.jpg"
                  fill
                  className="w-full h-full object-cover"
                  alt="hombre en oficina"
                />
              </div>

              {/* Formulario */}
              <div className="p-8 lg:px-20 flex flex-col justify-center h-full min-h-screen md:min-h-full bg-black">
                <form onSubmit={handleSubmit} className="text-start lg:py-20 py-8">
                  <h2 className="text-white text-xl font-bold mb-6 text-center">Iniciar Sesión</h2>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Success Message */}
                  {success && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500 rounded text-green-500 text-sm">
                      {success}
                    </div>
                  )}

                  <div className="grid grid-cols-1">
                    <div className="mb-4">
                      <label className="font-semibold text-white" htmlFor="LoginEmail">
                        Correo electrónico:
                      </label>
                      <input
                        id="LoginEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-3 w-full py-2 px-3 h-10 bg-transparent border rounded text-white placeholder-gray-400"
                        placeholder="nombre@gmail.com"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="font-semibold text-white" htmlFor="LoginPassword">
                        Contraseña:
                      </label>
                      <div className="mt-3 relative">
                        <input
                          id="LoginPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full py-2 px-3 h-10 pr-10 bg-transparent border rounded text-white placeholder-gray-400"
                          placeholder="********"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-white opacity-80 hover:opacity-100"
                        >
                          {showPassword ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-9 0-11-8-11-8a17.38 17.38 0 0 1 5-5" />
                              <path d="M1 1l22 22" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1 12s2-7 11-7 11 7 11 7-2 7-11 7S1 12 1 12z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mb-2 text-right">
                      <button
                        type="button"
                        className="text-fourth-base text-sm hover:underline focus:outline-none"
                        onClick={() => router.push('/olvido-contrasena')}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="py-2 px-5 w-full bg-fourth-base text-black rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Ingresando...' : 'Login / Sign in'}
                    </button>

                    <div className="text-center my-4 text-slate-400">o</div>

                    {/* Google Login Button */}
                    <div className="flex justify-center">
                      {googleLoading ? (
                        <div className="py-2 px-5 w-full border rounded-md bg-white text-black flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                          <span>Procesando...</span>
                        </div>
                      ) : (
                        <GoogleLogin
                          onSuccess={onGoogleLoginSuccess}
                          onError={onGoogleLoginError}
                          useOneTap={false}
                          text="signin_with"
                          size="large"
                          width="100%"
                          theme="outline"
                        />
                      )}
                    </div>

                    <div className="text-center mt-4">
                      <span className="text-slate-400">¿No tienes una cuenta?</span>{' '}
                      <Link href="/registrarse" className="text-white font-bold">
                        Registrarse
                      </Link>
                    </div>
                  </div>
                </form>
                {/* Forgot Password Modal removed, now only redirect button remains */}
              </div>
            </div>
          </div>
        </div>
      </section>
    </GoogleOAuthProvider>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
