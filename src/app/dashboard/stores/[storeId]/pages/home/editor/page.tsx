'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader, Globe, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

interface User {
  name: string;
  email: string;
  role: string;
  storeId?: string;
}

export default function PageEditorPage() {
  const params = useParams<{ storeId: string }>();
  const storeId = params?.storeId;

  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      if (stored?.email && stored?.name) {
        setUser(stored);
      }
    } catch {
      // no-op
    }
    setAuthChecked(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'Credenciales incorrectas');
        return;
      }

      const loggedUser: User = data.user;
      localStorage.setItem('user', JSON.stringify(loggedUser));
      if (data.token) localStorage.setItem('accessToken', data.token);
      setUser(loggedUser);
    } catch {
      setLoginError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-xl mb-3">
              <Globe className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Editor de página web
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
              Inicia sesión para continuar
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                data-testid="editor-login-email"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  data-testid="editor-login-password"
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {loginError && <p className="text-sm text-red-500 text-center">{loginError}</p>}

            <button
              type="submit"
              disabled={isLoggingIn}
              data-testid="editor-login-submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition"
            >
              {isLoggingIn && <Loader className="h-4 w-4 animate-spin" />}
              {isLoggingIn ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2 text-indigo-600">
        <Globe className="h-8 w-8" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editor de página web</h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        Tienda: <span className="font-medium">{storeId}</span>
      </p>
      <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-lg text-sm">
        <Loader className="h-4 w-4 animate-spin" />
        Editor en construcción…
      </div>
    </div>
  );
}
