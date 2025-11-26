'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader } from 'lucide-react';
import { getCurrentUser } from '@/lib/utils/rbac';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAdminAccess = () => {
      try {
        const user = getCurrentUser();

        // Check if user exists and has ADMIN role
        if (!user || user.role !== 'ADMIN') {
          setIsAuthorized(false);
          setIsChecking(false);
          // Redirect to dashboard after a brief moment
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
          return;
        }

        setIsAuthorized(true);
        setIsChecking(false);
      } catch (error) {
        console.error('❌ AdminGuard - Error checking access:', error);
        setIsAuthorized(false);
        setIsChecking(false);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    };

    checkAdminAccess();
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-[var(--fourth-base)] mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No tienes permisos para acceder a esta sección. Solo los administradores pueden ver este
            contenido.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Serás redirigido al dashboard en unos segundos...
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-[var(--fourth-base)] text-white rounded-lg hover:opacity-90 transition-colors"
          >
            Ir al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
