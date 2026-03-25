'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.serviceProviderId) {
      router.replace('/dashboard/service-dashboard');
    } else {
      router.replace('/dashboard/insights');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fourth-base mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Redirigiendo...</p>
      </div>
    </div>
  );
}
