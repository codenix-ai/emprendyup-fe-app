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
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
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
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-transparent text-black dark:text-white dark:border-gray-700 mb-4"
            placeholder="********"
            required
          />
          <label
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor="confirmPassword"
          >
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            type="password"
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
