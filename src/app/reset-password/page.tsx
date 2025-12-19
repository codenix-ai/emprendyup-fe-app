'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoaderIcon } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[\W_]/.test(newPassword);
  const hasMin = newPassword.length >= 8;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newPassword || !confirmPassword) {
      setError('Por favor ingresa y confirma tu nueva contraseña.');
      return;
    }
    // Enforce password policy: min 8, uppercase, lowercase, number, special
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError(
        'La contraseña debe tener mínimo 8 caracteres e incluir mayúscula, minúscula, número y un carácter especial.'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!token) {
      setError('Token inválido o faltante.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_API}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });
      if (res.ok) {
        setSuccess('¡Contraseña restablecida con éxito! Ahora puedes iniciar sesión.');
        setTimeout(() => {
          router.push('/login');
        }, 2500);
      } else {
        const data = await res.json();
        setError(data.message || 'Error al restablecer la contraseña.');
      }
    } catch (err) {
      setError('Error de red o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-fourth-base/10 via-blue-50 to-green-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md bg-white dark:bg-black rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center mb-4">
          <img src="/images/logo.svg" alt="Logo" className="h-12 mb-2" />
        </div>
        <h2 className="text-xl font-bold text-center text-black dark:text-white mb-6">
          Restablecer contraseña
        </h2>
        <form onSubmit={handleSubmit}>
          <label
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor="newPassword"
          >
            Nueva contraseña
          </label>
          <div className="relative mb-2">
            <input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded bg-transparent text-black dark:text-white dark:border-gray-700 mb-1"
              placeholder="********"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300"
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
          {/* Strength meter */}
          <div className="mb-3">
            <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
              <div
                className={`h-2 rounded ${
                  hasMin && hasUpper && hasLower && hasNumber && hasSpecial
                    ? 'bg-emerald-500'
                    : hasMin && (hasUpper || hasLower || hasNumber || hasSpecial)
                      ? 'bg-yellow-400'
                      : 'bg-red-400'
                }`}
                style={{
                  width: `${([hasMin, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length / 5) * 100}%`,
                }}
              />
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              {hasMin ? '✓' : '•'} 8 caracteres • {hasUpper ? '✓' : '•'} mayúscula •{' '}
              {hasLower ? '✓' : '•'} minúscula • {hasNumber ? '✓' : '•'} número •{' '}
              {hasSpecial ? '✓' : '•'} carácter especial
            </div>
          </div>
          <label
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor="confirmPassword"
          >
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-transparent text-black dark:text-white dark:border-gray-700 mb-4"
            placeholder="********"
            required
          />
          {error && <p className="text-red-500 mb-3 text-sm">{error}</p>}
          {success && <p className="text-green-500 mb-3 text-sm">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-fourth-base text-black rounded-md mt-2"
          >
            {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoaderIcon />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
