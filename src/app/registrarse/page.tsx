'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { gql, useMutation } from '@apollo/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import BackToHome from '../components/back-to-home';
import Switcher from '../components/switcher';
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

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeId, setStoreId] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password policy checks (live)
  const hasUpper = /[A-Z]/.test(password);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[\W_]/.test(password);
  const hasMin = password.length >= 8;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [registerMutation] = useMutation(REGISTER_MUTATION);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle OAuth errors from URL params
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
      };

      setError(
        errorMessages[oauthError] || message || 'Ocurrió un error durante el registro con Google.'
      );

      // Limpia la URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  // Handle OAuth errors from URL params
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      const errorMessages = {
        oauth_cancelled: 'Has cancelado el registro con Google.',
        no_authorization_code: 'Error de autorización con Google.',
        oauth_not_configured: 'Google OAuth no está configurado correctamente.',
        token_exchange_failed: 'Error al intercambiar el token de Google.',
        profile_fetch_failed: 'Error al obtener tu perfil de Google.',
        backend_not_configured: 'Backend no configurado.',
        backend_auth_failed: 'Error de autenticación en el servidor.',
        unexpected_error: 'Error inesperado durante el registro con Google.',
      };
      setError(errorMessages[oauthError as keyof typeof errorMessages] || 'Error desconocido');

      // Clear the error from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setShowToast(false);

    if (!acceptTerms) {
      setError('Debes aceptar los Términos y Condiciones.');
      return;
    }

    // Enforce password policy: min 8 chars, uppercase, lowercase, number, special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        'La contraseña debe tener mínimo 8 caracteres e incluir mayúscula, minúscula, número y un carácter especial.'
      );
      setShowPasswordRequirements(true);
      return;
    }

    setLoading(true);
    try {
      const { data } = await registerMutation({
        variables: {
          input: {
            name,
            email,
            password,
            storeId: storeId || null,
          },
        },
      });
      if (!data?.register?.user?.id) {
        throw new Error('Error en el registro');
      }
      // Store access token if needed
      if (data.register.access_token) {
        localStorage.setItem('accessToken', data.register.access_token);
      }
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setName('');
        setEmail('');
        setPassword('');
        setStoreId('');
        setAcceptTerms(false);
        router.push(`/otp-confirmation?email=${encodeURIComponent(email)}`);
      }, 6000);
    } catch (err: any) {
      setError(err.message || 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Signup Success
  const onGoogleSignupSuccess = async (credentialResponse: CredentialResponse) => {
    setError('');
    setSuccess('');
    setGoogleLoading(true);

    try {
      const tokens = parseGoogleCredential(credentialResponse);

      // Try signup endpoint first
      const response = await handleGoogleSignup(tokens);

      if (response.success && response.user) {
        // Store tokens if provided
        if (response.access_token) {
          localStorage.setItem('accessToken', response.access_token);
        }
        localStorage.setItem('user', JSON.stringify(response.user));

        setSuccess('Registro con Google exitoso. Redirigiendo...');

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
          response.message?.includes('User already exists') ||
          response.message?.includes('already registered')
        ) {
          setError('Ya existe una cuenta con este correo. Por favor inicia sesión.');
        } else if (response.message?.includes('No account found')) {
          setError('Error al crear la cuenta. Por favor intenta nuevamente.');
        } else if (response.message?.includes('token validation')) {
          setError('Error al validar el token de Google. Por favor intenta nuevamente.');
        } else {
          setError(response.error || response.message || 'Error al registrarse con Google');
        }
      }
    } catch (err: any) {
      console.error('Google signup error:', err);
      setError('Error al procesar el registro con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Google Signup Error
  const onGoogleSignupError = () => {
    setError('Error al registrarse con Google. Por favor intenta nuevamente.');
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
                  alt="signup"
                />
              </div>

              {/* Formulario */}
              <div className="p-8 lg:px-20 flex flex-col justify-center h-full min-h-screen md:min-h-full bg-black">
                <form onSubmit={handleSubmit} className="text-start lg:py-20 py-8">
                  <h2 className="text-white text-xl font-bold mb-6 text-center">Registro</h2>

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
                      <label className="font-semibold text-white" htmlFor="RegisterName">
                        Nombre:
                      </label>
                      <input
                        id="RegisterName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-3 w-full py-2 px-3 h-10 bg-transparent border rounded text-white placeholder-gray-400"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="font-semibold text-white" htmlFor="RegisterEmail">
                        Correo Electrónico:
                      </label>
                      <input
                        id="RegisterEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-3 w-full py-2 px-3 h-10 bg-transparent border rounded text-white placeholder-gray-400"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="font-semibold text-white" htmlFor="RegisterPassword">
                        Contraseña:
                      </label>
                      <div className="mt-3 relative">
                        <input
                          id="RegisterPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            const v = e.target.value;
                            setPassword(v);
                            // If requirements are shown and user fixed the password, hide checklist
                            const passwordRegex =
                              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
                            if (showPasswordRequirements && passwordRegex.test(v)) {
                              setShowPasswordRequirements(false);
                            }
                          }}
                          className="w-full py-2 px-3 h-10 pr-10 bg-transparent border rounded text-white placeholder-gray-400"
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
                      {/* Password policy checklist (hidden until failed submit) */}
                      {showPasswordRequirements && (
                        <ul className="mt-2 text-sm space-y-1">
                          <li className={`${hasMin ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {hasMin ? '✔' : '•'} Mínimo 8 caracteres
                          </li>
                          <li className={`${hasUpper ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {hasUpper ? '✔' : '•'} Una letra mayúscula
                          </li>
                          <li className={`${hasLower ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {hasLower ? '✔' : '•'} Una letra minúscula
                          </li>
                          <li className={`${hasNumber ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {hasNumber ? '✔' : '•'} Un número
                          </li>
                          <li className={`${hasSpecial ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {hasSpecial ? '✔' : '•'} Un carácter especial (ej. !@#$%)
                          </li>
                        </ul>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="AcceptT&C"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="form-checkbox me-2"
                        />
                        <label htmlFor="AcceptT&C" className="text-slate-400">
                          Acepto los{' '}
                          <Link href="/terminos" className="text-fourth-base">
                            Términos y Condiciones
                          </Link>
                        </label>
                      </div>
                    </div>

                    {error && <p className="text-red-500 mb-3">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="py-2 px-5 w-full bg-fourth-base text-black rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Registrando...' : 'Registrar'}
                    </button>

                    <div className="py-4 text-center text-slate-400">o</div>

                    {/* Google Signup Button */}
                    <div className="flex justify-center">
                      {googleLoading ? (
                        <div className="py-2 px-5 w-full border rounded-md bg-white text-black flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                          <span>Procesando...</span>
                        </div>
                      ) : (
                        <GoogleLogin
                          onSuccess={onGoogleSignupSuccess}
                          onError={onGoogleSignupError}
                          useOneTap={false}
                          text="signup_with"
                          size="large"
                          width="100%"
                          theme="outline"
                        />
                      )}
                    </div>

                    <div className="text-center mt-4">
                      <span className="text-slate-400">¿Ya tienes una cuenta?</span>{' '}
                      <Link href="/login" className="text-white font-bold">
                        Inicia sesión
                      </Link>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <BackToHome />
        <Switcher />

        {/* Toast Success Message */}
        {showToast && (
          <div className="fixed top-4 right-4 z-50 transform transition-all duration-500 ease-in-out">
            <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 max-w-md">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium">¡Registro exitoso!</p>
                <p className="text-sm text-green-100">
                  Serás redirigido para verificar tu correo electrónico con un código OTP. Por favor
                  revisa tu bandeja de entrada y sigue las instrucciones.{' '}
                </p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="flex-shrink-0 ml-2 text-green-200 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </section>
    </GoogleOAuthProvider>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SignupForm />
    </Suspense>
  );
}
